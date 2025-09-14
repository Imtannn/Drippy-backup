import {
	createEffect,
	css,
	Element,
	element,
	Element3D,
	For,
	GltfModel,
	html,
	Index,
	onCleanup,
	Scene,
	Show,
	signal,
	untrack,
} from 'lume'
import * as THREE from 'three'
import type {Accessor} from 'solid-js'
import {spaces} from '../consts/spaces.js'
import '../elements/loading-indicator.js'
import '../elements/lume-animation.js'
import '../elements/rig/lume-auto-rigger.js'
import '../elements/logic/show-when.js'
import type {Block, BlockCategory} from '../types/block.js'
import type {Fabric} from '../types/fabric.js'
import type {TemplateCategory} from '../types/template.js'
import './app-buttons.js'
import {store} from './store.js'
import {textureManager} from './texture-manager.js'
import {avatars} from '../consts/avatars.js'
import {
	createMutationsSignal,
	enableFrontsideOnModelLoad,
	enableShadowOnModelLoad,
	meshesInTree,
	onModelLoad,
} from '../utils.js'

type RenderBlock = {block: Block; templateCategory: TemplateCategory; id: string}

function excludeBonesFromBlock(block: Block) {
	const baseBones = ['Right_Pectoral', 'Left_Pectoral', 'Neck', 'Right_Heel', 'Left_Heel']

	const isDress = block.templateCategory === 'Dress' || block._id === '12' || block._id === '9'

	if (isDress) {
		return baseBones.concat(['Right_Arm', 'Left_Arm'])
	}

	if (block.templateCategory === 'Pants') {
		// Could also exclude bones above the waist but I don't see it being an issue.
		return baseBones.concat(['Right_Arm', 'Left_Arm'])
	}

	const isShortSleeves = block._id == '13' || block._id == '14'

	if (isShortSleeves) {
		return baseBones.concat(['Right_ForeArm', 'Left_ForeArm'])
	}

	return baseBones
}

@element
export class DrippyScene extends Element {
	static elementName = 'drippy-scene'

	@signal isDark = false
	@signal sceneUrl = ''
	@signal renderBlocks: RenderBlock[] = []

	@signal private backgroundModel: GltfModel | null = null
	@signal private avatarModel: GltfModel | null = null
	@signal private lumeScene: Scene | null = null

	// When `false`, disable animations and rigging.
	@signal private animsEnabled = true

	@signal private animsStopped = true

	@signal private animName: string | null = null
	@signal private animSrc: string | null = null

	async #applyFabric(el: Element3D, fabric: Fabric, isCanceled: () => boolean, blockId?: string) {
		const root = el.three
		const loadingId = blockId || `${fabric._id}-${Date.now()}`
		store.loadingMaterials = [...untrack(() => store.loadingMaterials), loadingId]

		try {
			// Extract UV data for proper texture scaling
			const meshes = [...meshesInTree(root)]
			const uvArray = meshes[0]?.geometry?.attributes?.uv?.array
				? Array.from(meshes[0].geometry.attributes.uv.array)
						.slice(0, 5)
						.map((el: any) => Math.abs(el))
				: []

			// Load textures with UV-aware scaling using texture manager
			const textureSet = await textureManager.loadFabricTexturesWithUV(fabric, uvArray)
			if (isCanceled()) return

			for (const mesh of meshesInTree(root)) textureManager.applyTexturesToMaterial(mesh.material, textureSet)
			el.needsUpdate()
		} catch (error) {
			console.warn('Failed to apply fabric to object:', error)
		} finally {
			store.loadingMaterials = untrack(() => store.loadingMaterials).filter(id => id !== loadingId)
		}
	}

	// Reset materials to default state (no textures)
	#resetMaterialsToDefault(el: Element3D) {
		for (const mesh of meshesInTree(el.three)) {
			const material = mesh.material as THREE.MeshPhysicalMaterial
			material.map = null
			material.normalMap = null
			material.roughnessMap = null
			// material.displacementMap = null
			material.needsUpdate = true
		}

		el.needsUpdate()
	}

	connectedCallback() {
		super.connectedCallback()

		this.createEffect(() => {
			if (store.view === 'preview') {
				this.style.setProperty('--scene-transform', 'translateX(0)')
			} else {
				if (
					store.view === 'order' ||
					store.view === 'order-items' ||
					store.view === 'order-size' ||
					store.view === 'custom-measurement' ||
					store.view === 'success' ||
					store.view === 'share'
				) {
					this.style.setProperty('--scene-transform', 'translateX(-10rem)')
				} else {
					this.style.setProperty('--scene-transform', 'translateX(10rem)')
				}
			}
		})

		this.createEffect(() => {
			if (store.view === 'preview') {
				this.style.setProperty('--scene-desktop-transform', 'translateY(0)')
			} else {
				this.style.setProperty('--scene-desktop-transform', 'translateY(-100px)')
			}
		})

		this.createEffect(() => {
			if (store.selectedSpace) {
				const space = spaces.find(space => space.slug === store.selectedSpace?.slug)
				if (space) {
					this.sceneUrl = space.scene
				}
			}
		})

		this.createEffect(() => {
			const mutations = createMutationsSignal(document.documentElement, {
				attributes: true,
				attributeFilter: ['data-theme'],
			})

			this.createEffect(() => {
				mutations()
				this.isDark = document.documentElement.dataset.theme === 'dark'
			})
		})

		const avatarId = 'avatar'

		// FIXME The following two effects are almost identical, running some of
		// the same code twice.

		// Track selected avatar loading state
		this.createEffect(() => {
			if (!store.isShowAvatar || store.selectedAvatar) return

			const avatar = this.avatarModel
			if (!avatar) return

			const avatarLoaded = onModelLoad(avatar)

			createEffect(() => {
				if (!avatarLoaded()) {
					untrack(() => {
						if (!store.loadingBlocks.includes(avatarId)) store.loadingBlocks = [...store.loadingBlocks, avatarId]
						if (!store.isDrippySceneLoading.includes(avatarId)) store.addIsDrippySceneLoading = avatarId
					})

					return
				}

				store.loadingBlocks = untrack(() => store.loadingBlocks).filter(id => id !== avatarId)
				store.removeIsDrippySceneLoading = avatarId
			})
		})

		const sceneId = 'scene'

		// Track background scene loading state
		this.createEffect(() => {
			if (!store.selectedSpace || !store.selectedSpace?.scene || !store.isShowScene) return

			const scene = this.backgroundModel
			if (!scene) return

			const backgroundLoaded = onModelLoad(scene)

			createEffect(() => {
				if (!backgroundLoaded()) {
					untrack(() => {
						if (!store.loadingBlocks.includes(sceneId)) store.loadingBlocks = [...store.loadingBlocks, sceneId]
						if (!store.isDrippySceneLoading.includes(sceneId)) store.addIsDrippySceneLoading = sceneId
					})

					return
				}

				store.loadingBlocks = untrack(() => store.loadingBlocks).filter(id => id !== sceneId)
				store.removeIsDrippySceneLoading = sceneId
			})
		})

		// Track block loading state
		this.createEffect(() => {
			const totalBlockCount = this.renderBlocks.length

			if (totalBlockCount === 0) {
				store.loadingBlocks = untrack(() => store.loadingBlocks).filter(id => id !== 'avatar')
				return
			}

			const models = Array.from(this.shadowRoot?.querySelectorAll('lume-gltf-model[data-cloth]') ?? []) as GltfModel[]

			for (const [index, el] of models.entries()) {
				const blockId = `block-${index}`
				const modelLoaded = onModelLoad(el)

				createEffect(() => {
					if (!modelLoaded()) {
						store.loadingBlocks = [...untrack(() => store.loadingBlocks), blockId]
						return
					}

					store.loadingBlocks = untrack(() => store.loadingBlocks).filter(id => id !== blockId)
				})
			}
		})

		// This will cache render blocks by ID. This is a quick fix to make the
		// <For> re-use the same objects to avoid reloading GLTF models.
		const renderBlockCache = new Map<string, RenderBlock>()

		function getRenderBlock(id: string, block: Block, templateCategory: TemplateCategory) {
			let renderBlock = renderBlockCache.get(id)
			if (!renderBlock) renderBlockCache.set(id, (renderBlock = {block, templateCategory, id}))
			return renderBlock
		}

		this.createEffect(() => {
			const blocks = Array.from(store.selectedBlocks.values()).flatMap(blocks => Array.from(blocks.values()))
			this.renderBlocks = blocks.flatMap(block => {
				if (block.category === 'Sleeves') {
					const id = `${block.templateCategory}-${block.category}-${block._id}`
					let renderBlock = getRenderBlock(id, block, block.templateCategory)

					const idMirror = `${id}-mirror`
					let renderBlockMirror = getRenderBlock(idMirror, block, block.templateCategory)

					return [renderBlock, renderBlockMirror]
				}

				const id = `${block.templateCategory}-${block.category}-${block._id}`
				let renderBlock = getRenderBlock(id, block, block.templateCategory)

				return renderBlock
			})
		})

		// Re-apply materials whenever the selected fabrics change or models mount
		this.createEffect(async () => {
			const selectedFabrics = store.selectedFabrics
			// Add a delay of 100ms to ensure the lume-gltf-model are in the DOM
			await new Promise(resolve => setTimeout(resolve, 100))

			// Cause reactive re-run when the number of blocks changes
			if (this.renderBlocks.length === 0) {
				// nothing to bind
				return
			}

			let shouldCancel = false
			const isCanceled = () => shouldCancel

			const models: GltfModel[] = Array.from(
				this.shadowRoot?.querySelectorAll('lume-gltf-model[data-cloth]') ?? [],
			) as GltfModel[]

			// Process each model using its data-blockid to find the correct fabric
			for (const el of models) {
				const blockId = el.getAttribute('id')
				if (!blockId) continue

				// Parse blockId to extract template category, block category, and block ID
				// Format: "TemplateCategory-BlockCategory-BlockId" or "TemplateCategory-BlockCategory-BlockId-mirror"
				const isMirror = blockId.endsWith('-mirror')
				const baseBlockId = isMirror ? blockId.slice(0, -7) : blockId // Remove "-mirror" if present
				const parts = baseBlockId.split('-')

				if (parts.length < 3) continue

				const templateCategory = parts[0] as TemplateCategory
				const blockCategory = parts[1] as BlockCategory

				// Find the fabric for this block
				const templateFabrics = selectedFabrics.get(templateCategory)
				const fabric = templateFabrics?.get(blockCategory)
				const loadingId = `material-${blockId}`
				const modelLoaded = onModelLoad(el)

				createEffect(() => {
					if (!modelLoaded()) return

					if (fabric) {
						this.#applyFabric(el, fabric, isCanceled, loadingId)
					} else {
						// Reset to default material if no fabric selected for this block category
						this.#resetMaterialsToDefault(el)
					}
				})
			}

			onCleanup(() => (shouldCancel = true))
		})

		// Play animation when blocks are added, pause animation when no blocks.
		this.createEffect(() => {
			// When rigging the garments to the skeleton, the model needs to be stationary,
			// ideally in T-pose. We need to wait for all the blocks to be fully loaded before
			// rigging.

			if (store.loadingBlocks.length > 0) {
				this.animsStopped = true
			} else {
				// Wait 1 more frame just for good measure. The rigging should happen as soon as
				// the bocks are loaded, so this makes sure that the animations start on the next
				// frame, when the rigging is finished.
				if (this.animsEnabled) {
					requestAnimationFrame(() => {
						this.animsStopped = false
					})
				}
			}
		})

		this.createEffect(() => {
			if (store.selectedAnimation === 'none') {
				this.animsEnabled = false
				this.animsStopped = true

				this.animName = null
				this.animSrc = null
			} else if (store.selectedAnimation === 'walk') {
				this.animsEnabled = true

				this.animName = 'FV2_Walking in place.mtn'
				this.animSrc = '../models/Yuna-walkinplace.glb'
			} else if (store.selectedAnimation === 'dance') {
				this.animsEnabled = true

				this.animName = 'FV2_Dancing_01.mtn'
				this.animSrc = '../models/Yuna-dancing01.glb'
			}
		})

		this.createEffect(() => {
			if (!this.lumeScene) return
			this.lumeScene.glRenderer!.toneMapping = THREE.ACESFilmicToneMapping
		})
	}

	template = () => {
		const shadowBias = -0.0005
		const shadowNormalBias = /*0.005*/ 0
		const shadowCameraSize = 5
		const shadowMapSize = 1024
		const penumbra = 0.25
		const spotAngle = 30
		const shadowRadius = 4

		return html`
			<show-when
				condition=${() => store.view === 'blocks' || store.view === 'avatar' || store.view === 'template'}
				content=${() => html`
					<app-buttons-left layout="bottom">
						<app-buttons-group>
							<loading-indicator
								is-visible=${() => store.loadingBlocks.length > 0 || store.loadingMaterials.length > 0}
							></loading-indicator>
						</app-buttons-group>
					</app-buttons-left>
				`}
			></show-when>

			<div id="lume-scene-container">
				<lume-scene
					ref=${(el: Scene) => (this.lumeScene = el)}
					id="drippy-scene"
					webgl
					perspective="2200"
					physically-correct-lights
					shadow-mode="vsm"
				>
					<lume-element3d align-point="0.5 0.5 0.5">
						<lume-ambient-light intensity="0.7" color="white"></lume-ambient-light>

						<lume-spot-light
							target="#avatar"
							position="5 -5 1"
							intensity="3"
							shadow-camera-top="${-shadowCameraSize}"
							shadow-camera-bottom="${shadowCameraSize}"
							shadow-camera-left="${-shadowCameraSize}"
							shadow-camera-right="${shadowCameraSize}"
							shadow-map-width="${shadowMapSize}"
							shadow-map-height="${shadowMapSize}"
							shadow-bias="${shadowBias}"
							shadow-normal-bias="${shadowNormalBias}"
							penumbra="${penumbra}"
							angle="${spotAngle}"
							shadow-radius="${shadowRadius}"
						>

							<!-- <lume-sphere size="1 1 1" color="deeppink" has="basic-material"
								mount-point="0.5 0.5 0.5"
								cast-shadow="false"
							></lume-sphere> -->

						</lume-spot-light>

						<lume-spot-light
							target="#avatar"
							position="-5 -5 1"
							intensity="3"
							shadow-camera-top="${-shadowCameraSize}"
							shadow-camera-bottom="${shadowCameraSize}"
							shadow-camera-left="${-shadowCameraSize}"
							shadow-camera-right="${shadowCameraSize}"
							shadow-map-width="${shadowMapSize}"
							shadow-map-height="${shadowMapSize}"
							shadow-bias="${shadowBias}"
							shadow-normal-bias="${shadowNormalBias}"
							penumbra="${penumbra}"
							angle="${spotAngle}"
							shadow-radius="${shadowRadius}"
						>

							<!-- <lume-sphere size="1 1 1" color="deeppink" has="basic-material"
								mount-point="0.5 0.5 0.5"
								cast-shadow="false"
							></lume-sphere> -->

						</lume-spot-light>

						<lume-spot-light
							target="#avatar"
							position="0 -5 5"
							intensity="3"
							shadow-camera-top="${-shadowCameraSize}"
							shadow-camera-bottom="${shadowCameraSize}"
							shadow-camera-left="${-shadowCameraSize}"
							shadow-camera-right="${shadowCameraSize}"
							shadow-map-width="${shadowMapSize}"
							shadow-map-height="${shadowMapSize}"
							shadow-bias="${shadowBias}"
							shadow-normal-bias="${shadowNormalBias}"
							penumbra="${penumbra}"
							angle="${spotAngle}"
							shadow-radius="${shadowRadius}"
						>

							<!-- <lume-sphere size="1 1 1" color="deeppink" has="basic-material"
								mount-point="0.5 0.5 0.5"
								cast-shadow="false"
							></lume-sphere> -->

						</lume-spot-light>

						<lume-camera-rig
							min-distance="2"
							max-distance="15"
							distance="9"
							dolly-speed="0.01"
							position="0 -1 0"
						></lume-camera-rig>

						<${Show}
							when=${() => store.isShowAvatar}
							fallback=${() => html`
								<${For} each=${() => this.renderBlocks}>
									${(item: RenderBlock, index: Accessor<number>) => html`
										<lume-gltf-model
											ref=${enableShadowOnModelLoad}
											id=${item.id}
											data-index=${index()}
											data-cloth
											src=${item.block.modelFile}
											scale=${item.id.endsWith('-mirror') ? '-1 1 1' : '1 1 1'}
										></lume-gltf-model>
									`}
								</>
							`}
						>
							<lume-gltf-model
								id="avatar"
								ref=${(el: GltfModel) => ((this.avatarModel = el), enableShadowOnModelLoad(el))}
								src=${() => avatars.find(avatar => avatar.value === (store.selectedAvatar ?? store.tempSelectedAvatar))?.src}
								scale="1 1 1"
								data-avatar
							>
								<${For} each=${() => this.renderBlocks}>
									${(item: RenderBlock, index: Accessor<number>) => html`
										<lume-gltf-model
											ref=${enableShadowOnModelLoad}
											id=${item.id}
											data-index=${index()}
											data-cloth
											src=${item.block.modelFile}
											scale=${item.id.endsWith('-mirror') ? '-1 1 1' : '1 1 1'}
										>
											<lume-auto-rigger
												excluded-bones=${() => excludeBonesFromBlock(item.block)}
												onrig=${() => {
													this.animsStopped = false
												}}
												disabled=${() => {
													//
													return false
													return !this.animsEnabled
												}}
											></lume-auto-rigger>
										</lume-gltf-model>
									`}
								</>

								<lume-animation
									src=${() => this.animSrc}
									clip-name=${() => this.animName}
									stopped=${() => this.animsStopped || !this.animsEnabled}
								></lume-animation>
							</lume-gltf-model>
						</>

						<${Show} when=${() => store.isShowScene && store.selectedSpace?.scene}>
							<lume-gltf-model
								ref=${(el: GltfModel) => ((this.backgroundModel = el), enableShadowOnModelLoad(el), enableFrontsideOnModelLoad(el))}
								id="scene"
								src=${() => store.selectedSpace?.scene}
							></lume-gltf-model>
						</>

						<${Index} each=${() => store.selectedSpace?.includedModelFiles}>
							${(item: Accessor<string>) => html`
								<lume-gltf-model ref=${enableShadowOnModelLoad} src=${() => item()}></lume-gltf-model>
							`}
						</>

						<${Show} when=${() => !this.animsEnabled}>
							<${For} each=${() => this.renderBlocks}>
								${(item: RenderBlock, index: Accessor<number>) => html`
									<lume-gltf-model
										ref=${enableShadowOnModelLoad}
										id=${item.id}
										data-index=${index()}
										data-cloth
										src=${item.block.modelFile}
										scale=${item.id.endsWith('-mirror') ? '-1 1 1' : '1 1 1'}
									></lume-gltf-model>
								`}
							</>
						</>
					</lume-element3d>
				</lume-scene>
			</div>
		`
	}

	css = css/*css*/ `
		:host {
			--scene-transform: translateX(0);
			--scene-desktop-transform: translateY(-100px);
			background: var(--appBackground);
			width: var(--appWidth);
			height: var(--appHeight);
			touch-action: none;
			position: relative;
		}

		#lume-scene-container {
			width: 100%;
			height: 100%;
			transition: transform var(--transitionFast);
		}

		lume-scene {
			transform: var(--scene-transform);
			transition: transform var(--transitionFast);
		}

		@media (max-width: 767px) {
			#lume-scene-container {
				transform: var(--scene-desktop-transform);
			}

			lume-scene {
				transform: translateX(0);
			}
		}
	`
}
