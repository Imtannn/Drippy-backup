import {
	attribute,
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
	signal,
} from 'lume'
import type {Accessor} from 'solid-js'
import * as THREE from 'three'
import {avatars} from '../consts/avatars.js'
import {spaces} from '../consts/spaces.js'
import '../elements/loading-indicator.js'
import '../elements/logic/show-when.js'
import '../elements/lume-animation.js'
import '../elements/rig/lume-auto-rigger.js'
import type {Block, BlockCategory} from '../types/block.js'
import type {Fabric} from '../types/fabric.js'
import type {TemplateCategory} from '../types/template.js'
import {
	createMutationsSignal,
	enableFrontsideOnModelLoad,
	enableShadowOnModelLoad,
	meshesInTree,
	onModelLoad,
	setEnvMapOnModelLoad,
	setMaterialsVisibleOnModelLoad,
} from '../utils.js'
import './app-buttons.js'
import {store} from './store.js'
import {textureManager} from './texture-manager.js'
import type {Space} from '../types/types.js'

// TODO Use the env specified for each space.
const env = '/images/envs/brown_photostudio_02.jpg'

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

	@attribute selectedSpace: Space | null = null
	@attribute selectedAvatar: string | null = null
	@attribute selectedFabrics: Map<TemplateCategory, Map<BlockCategory, Fabric[]>> = new Map()
	@attribute selectedBlocks: Map<TemplateCategory, Map<BlockCategory, Block>> = new Map()

	@signal isDark = false
	@signal sceneUrl = ''
	@signal renderBlocks: RenderBlock[] = []

	@signal private backgroundModel: GltfModel | null = null
	@signal private avatarModel: GltfModel | null = null
	@signal private lumeScene: Scene | null = null

	// When `false`, disable animations and rigging.
	@signal private animsEnabled = false

	@signal private animsStopped = true

	@signal private animName: string | null = null
	@signal private animSrc: string | null = null

	async #applyFabrics(el: Element3D, fabrics: Fabric[], isCanceled: () => boolean, loadingId: symbol) {
		const root = el.three
		store.addLoadingMaterial(loadingId)

		try {
			// Extract UV data for proper texture scaling
			const meshes = [...meshesInTree(root)]
			const uvArray = meshes[0]?.geometry?.attributes?.uv?.array
				? Array.from(meshes[0].geometry.attributes.uv.array)
						.slice(0, 5)
						.map((el: any) => Math.abs(el))
				: []

			// Create a map of fabric assignments by mesh name
			const fabricsByMesh = new Map<string, Fabric>()
			let defaultFabric: Fabric | null = null

			for (const fabric of fabrics) {
				if (fabric.assignedMesh) {
					fabricsByMesh.set(fabric.assignedMesh, fabric)
				} else {
					// Fabric without assignedMesh is the default fabric for unspecified meshes
					defaultFabric = fabric
				}
			}

			// Load texture sets for all fabrics
			const textureSetsByFabric = new Map<Fabric, any>()
			for (const fabric of fabrics) {
				const textureSet = await textureManager.loadFabricTexturesWithUV(fabric, uvArray)
				textureSetsByFabric.set(fabric, textureSet)
			}

			if (isCanceled()) return

			// Apply fabrics to meshes based on assignments
			for (const mesh of meshes) {
				const meshName = mesh.parent?.name.toLowerCase() || mesh.name.toLowerCase() || ''

				// Check if there's a specific fabric assigned to this mesh
				const assignedFabric = fabricsByMesh.get(meshName)
				const fabricToUse = assignedFabric || defaultFabric

				if (fabricToUse) {
					const textureSet = textureSetsByFabric.get(fabricToUse)
					if (textureSet) {
						mesh.material = new THREE.MeshPhysicalMaterial()
						textureManager.applyTexturesToMaterial(mesh.material, textureSet)
						console.log(`Applied fabric ${fabricToUse.materialName} to mesh ${meshName}`)
					}
				}
			}
			el.needsUpdate()
		} catch (error) {
			console.warn('Failed to apply fabrics to object:', error)
		} finally {
			store.removeLoadingMaterial(loadingId)
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
			if (this.selectedSpace) {
				const space = spaces.find(space => space.slug === this.selectedSpace?.slug)
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

		const avatarId = Symbol('avatar')

		// FIXME The following two effects are almost identical, running some of
		// the same code twice.

		// Track selected avatar loading state
		this.createEffect(() => {
			if (!store.isShowAvatar) return
			// Allow tempSelectedAvatar to work as preview even when selectedAvatar exists
			const currentAvatar = store.tempSelectedAvatar ?? this.selectedAvatar
			if (currentAvatar) {
				const avatar = this.avatarModel
				if (!avatar) return

				const avatarLoaded = onModelLoad(avatar)

				createEffect(() => {
					if (!avatarLoaded()) {
						store.addLoadingBlock(avatarId)
						store.addIsDrippySceneLoading(avatarId)

						return
					}

					store.removeLoadingBlock(avatarId)
					store.removeIsDrippySceneLoading(avatarId)
				})
			}
		})

		const sceneId = Symbol('scene')

		// Track background scene loading state
		this.createEffect(() => {
			if (!this.selectedSpace || !this.selectedSpace?.scene || !store.isShowScene) return

			const scene = this.backgroundModel
			if (!scene) return

			const backgroundLoaded = onModelLoad(scene)

			createEffect(() => {
				if (!backgroundLoaded()) {
					store.addLoadingBlock(sceneId)
					store.addIsDrippySceneLoading(sceneId)

					return
				}

				store.removeLoadingBlock(sceneId)
				store.removeIsDrippySceneLoading(sceneId)
			})
		})

		// Track block loading state
		this.createEffect(() => {
			const totalBlockCount = this.renderBlocks.length

			if (totalBlockCount === 0) {
				store.removeLoadingBlock(avatarId) // why remove avatarId when no blocks?
				return
			}

			const models = Array.from(this.shadowRoot?.querySelectorAll('lume-gltf-model[data-cloth]') ?? []) as GltfModel[]

			for (const [index, el] of models.entries()) {
				const blockId = Symbol(`block-${index}`)
				const modelLoaded = onModelLoad(el)

				createEffect(() => {
					if (!modelLoaded()) {
						store.addLoadingBlock(blockId)
						return
					}

					store.removeLoadingBlock(blockId)
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
			const blocks = Array.from(this.selectedBlocks.values()).flatMap(blocks => Array.from(blocks.values()))
			this.renderBlocks = blocks.flatMap(block => {
				if (block.category === 'Sleeves') {
					const id = `${this.selectedSpace?.collection}-${block.templateCategory}-${block.category}-${block._id}`
					let renderBlock = getRenderBlock(id, block, block.templateCategory)

					const idMirror = `${id}-mirror`
					let renderBlockMirror = getRenderBlock(idMirror, block, block.templateCategory)

					return [renderBlock, renderBlockMirror]
				}

				const id = `${this.selectedSpace?.collection}-${block.templateCategory}-${block.category}-${block._id}`
				let renderBlock = getRenderBlock(id, block, block.templateCategory)

				return renderBlock
			})
		})

		// Re-apply materials whenever the selected fabrics change or models mount
		this.createEffect(async () => {
			const selectedFabrics = this.selectedFabrics
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

				const templateCategory = parts[1] as TemplateCategory
				const blockCategory = parts[2] as BlockCategory

				// Find the fabrics for this block
				const templateFabrics = selectedFabrics.get(templateCategory)
				const fabrics = templateFabrics?.get(blockCategory) || []
				const loadingId = Symbol(`material-${blockId}`)
				const modelLoaded = onModelLoad(el)

				createEffect(() => {
					if (!modelLoaded()) return

					if (fabrics.length > 0) {
						this.#applyFabrics(el, fabrics, isCanceled, loadingId)
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

			if (store.loadingBlocks.size > 0) {
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
				condition=${() => store.isAdmin}
				content=${() => html`
					<div
						style="position: absolute; top: 1rem; left: 50%; z-index: 1000; background: transparent; border-radius: 8px; padding: 6px 8px; display: flex; flex-direction: column; gap: 4px; min-width: 60px; backdrop-filter: blur(4px);"
					>
						<p style="color: black; font-size: 8px; font-weight: 500; margin: 0; text-align: center; line-height: 1;">
							Env
						</p>
						<input
							id="env-intensity"
							title="Environment Intensity"
							type="range"
							min="0"
							max="3"
							step="0.1"
							value="0.3"
							style="width: 50px; height: 3px; background: #333; border-radius: 2px; outline: none; -webkit-appearance: none; appearance: none;"
							oninput=${(e: Event) => {
								const input = e.target as HTMLInputElement
								const value = Number(input.value) || 0
								console.log('Environment intensity changed to:', value)
								this.lumeScene!.three.environmentIntensity = value
								this.lumeScene!.needsUpdate()
							}}
						/>
					</div>
				`}
			></show-when>

			<show-when
				condition=${() => store.view === 'blocks' || store.view === 'avatar' || store.view === 'template'}
				content=${() => html`
					<app-buttons-left layout="bottom">
						<app-buttons-group>
							<loading-indicator
								is-visible=${() => store.loadingBlocks.size > 0 || store.loadingMaterials.size > 0}
							></loading-indicator>
						</app-buttons-group>
					</app-buttons-left>
				`}
			></show-when>

			<div id="lume-scene-container">
				<lume-scene
					ref=${(el: Scene) => ((this.lumeScene = el), el && (el.three.environmentIntensity = 0.3))}
					id="drippy-scene"
					webgl
					perspective="2200"
					physically-correct-lights
					shadow-mode="vsm"
					environment="/images/envs/brown_photostudio_02.jpg"
				>
					<lume-element3d align-point="0.5 0.5 0.5">
						<lume-ambient-light visible="true" intensity="0.7" color="white"></lume-ambient-light>

						<!-- a sphere to debug/visualize the env map -->
						<lume-sphere visible="${() => store.isAdmin}" size="0.5 0.5 0.5" color="white" position="-2 -2 0" metalness="1" roughness="0"></lume-sphere>

						<lume-spot-light
							visible="true"
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
							visible="true"
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
							visible="true"
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

						<lume-gltf-model
							id="avatar"
							ref=${(el: GltfModel) => ((this.avatarModel = el), enableShadowOnModelLoad(el), setEnvMapOnModelLoad(el, env))}
							src=${() => {
								// Prioritize tempSelectedAvatar for preview functionality
								const currentAvatar = store.tempSelectedAvatar ?? this.selectedAvatar
								const foundAvatar = avatars.find(avatar => avatar.value === currentAvatar)
								return foundAvatar?.src
							}}
							scale="1 1 1"
							data-avatar
						>
							<lume-element3d ref=${(el: Element3D) => setMaterialsVisibleOnModelLoad(el.parentElement as GltfModel, () => store.isShowAvatar, el)}>
								<${For} each=${() => this.renderBlocks}>
									${(item: RenderBlock, index: Accessor<number>) => html`
										<lume-gltf-model
											ref=${(el: GltfModel) => (enableShadowOnModelLoad(el), setEnvMapOnModelLoad(el, env))}
											id=${item.id}
											data-index=${index()}
											data-cloth
											src=${item.block.modelFile}
											scale=${item.id.endsWith('-mirror') ? '-1 1 1' : '1 1 1'}
										>
											<!-- The lume-auto-rigger will rig the parent lume-gltf-model to the next nearest lume-gltf-model skeleton. -->
											<lume-auto-rigger
												excluded-bones=${() => excludeBonesFromBlock(item.block)}
												onrig=${() => {
													this.animsStopped = false
												}}
												disabled=${() => {
													//
													// return false
													return !this.animsEnabled
												}}
											></lume-auto-rigger>
										</lume-gltf-model>
									`}
								</>
							</lume-element3d>

							<lume-animation
								src=${() => this.animSrc}
								clip-name=${() => this.animName}
								stopped=${() => this.animsStopped || !this.animsEnabled}
							></lume-animation>
						</lume-gltf-model>

						<lume-gltf-model
							ref=${(el: GltfModel) => ((this.backgroundModel = el), enableShadowOnModelLoad(el), enableFrontsideOnModelLoad(el), setEnvMapOnModelLoad(el, env), setMaterialsVisibleOnModelLoad(el, () => store.isShowScene))}
							id="scene"
							src=${() => this.selectedSpace?.scene ?? ''}
						></lume-gltf-model>

						<${Index} each=${() => this.selectedSpace?.includedModelFiles}>
							${(item: Accessor<string>) => html`
								<lume-gltf-model
									ref=${(el: GltfModel) => (enableShadowOnModelLoad(el), setEnvMapOnModelLoad(el, env))}
									attr:src=${() => item()}
									class="extraObjects"
								></lume-gltf-model>
							`}
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

		:host-context(.showcase__model-center) lume-scene {
			transform: unset !important;
			transition: unset !important;
		}

		lume-scene {
			transform: var(--scene-transform);
			transition: transform var(--transitionFast);
		}

		@media (max-width: 767px) {
			:host-context(.showcase__model-center) #lume-scene-container {
				transform: unset !important;
			}
			#lume-scene-container {
				transform: var(--scene-desktop-transform);
			}

			lume-scene {
				transform: translateX(0);
			}
		}
	`
}
