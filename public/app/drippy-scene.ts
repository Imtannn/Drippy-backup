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
import {backgroundScenes} from '../consts/scenes.js'
import '../elements/logic/show-when.js'
import '../elements/lume-animation.js'
import '../elements/progress-loader.js'
import '../elements/rig/lume-auto-rigger.js'
import {pathname} from '../routes.js'
import type {Block, BlockCategory} from '../types/block.js'
import {getSceneBySlug, getSpaceDefaultScene} from '../utils.js'
import type {Fabric} from '../types/fabric.js'
import type {TemplateCategory} from '../types/template.js'
import type {Space} from '../types/types.js'
import {
	createMutationsSignal,
	enableFrontsideOnModelLoad,
	enableShadowOnModelLoad,
	getArmatureObject,
	hasAncestorWithName,
	isDesktop,
	meshesInTree,
	onModelLoad,
	querySelectorAllSignal,
	setEnvMapOnModelLoad,
	setMaterialsVisibleOnModelLoad,
	showSkeletonHelper,
} from '../utils.js'
import './app-buttons.js'
import {store} from './store.js'
import {textureManager} from './texture-manager.js'

// TODO Use the env specified for each space.
const env = '/images/envs/brown_photostudio_02.jpg'

type RenderBlock = {block: Block; templateCategory: TemplateCategory; id: string}

@element
export class DrippyScene extends Element {
	static elementName = 'drippy-scene'

	@attribute selectedSpace: Space | null = null
	@attribute selectedAvatar: string | null = null
	@attribute selectedFabrics: Map<TemplateCategory, Map<BlockCategory, Map<string, Fabric>>> = new Map()
	@attribute selectedBlocks: Map<TemplateCategory, Map<BlockCategory, Block>> = new Map()
	@attribute landing: boolean = false

	@signal isDark = false
	@signal sceneUrl = ''
	@signal renderBlocks: RenderBlock[] = []

	@signal private backgroundModel: GltfModel | null = null
	@signal private avatarModel: GltfModel | null = null
	@signal private lumeScene: Scene | null = null

	// When `false`, disable animations and rigging.
	@signal private animsEnabled = false

	@signal private animName: string | null = null
	@signal private animSrc: string | null = null

	@signal private loadingProgress = 0
	@signal private isLoading = false

	async #applyFabrics(
		el: Element3D,
		fabrics: Map<string, Fabric>,
		isCanceled: () => boolean,
		loadingId: symbol,
		templateId: string | undefined,
	) {
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

			for (const [assignedMesh, fabric] of fabrics.entries()) {
				fabricsByMesh.set(assignedMesh, fabric)
			}

			// Load texture sets for all fabrics
			const textureSetsByFabric = new Map<Fabric, any>()
			for (const fabric of fabricsByMesh.values()) {
				const textureSet = await textureManager.loadFabricTexturesWithUV(fabric, uvArray)
				textureSetsByFabric.set(fabric, textureSet)
			}

			if (isCanceled()) return

			// Create a map for mesh to meshes key since we are grouping meshes with the same material by '-'
			const meshToFabricMeshesMap = new Map<string, string>()
			for (const meshes of fabricsByMesh.keys()) {
				const meshArray = meshes.split('-')
				for (const mesh of meshArray) {
					meshToFabricMeshesMap.set(mesh, meshes)
				}
			}

			// Get all the meshes keys
			const allFabricMeses = [...meshToFabricMeshesMap.keys()]

			// Apply fabrics to meshes based on assignments
			for (const mesh of meshes) {
				// Check if there's a specific fabric assigned to this mesh
				const meshKey = allFabricMeses.filter(fabricMesh => hasAncestorWithName(mesh, fabricMesh))[0]
				const meshesKey = meshToFabricMeshesMap.get(meshKey)
				const fabricToUse = fabricsByMesh.get(meshesKey || 'default')

				if (fabricToUse) {
					const textureSet = textureSetsByFabric.get(fabricToUse)
					if (textureSet) {
						mesh.material = new THREE.MeshPhysicalMaterial()
						textureManager.applyTexturesToMaterial(mesh.material, textureSet)
					}
				}
			}
			el.needsUpdate()
		} catch (error) {
			console.warn('Failed to apply fabrics to object:', error)
		} finally {
			store.removeLoadingMaterial(loadingId)
			if (templateId) {
				store.clearLoadingTemplate(templateId)
			}
		}

		onCleanup(() => store.removeLoadingMaterial(loadingId))
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

	/**
	 * Checks if the model is rigged, if so, sets the skeleton to the avatar's.
	 * @param model
	 */
	#checkRiggedMesh(model: GltfModel) {
		if (!this.avatarModel) return

		const sourceSkeleton = getArmatureObject(this.avatarModel.three)?.skeleton

		model.three.traverse((obj: any) => {
			if (obj.skeleton) obj.skeleton = sourceSkeleton
		})
	}

	connectedCallback() {
		super.connectedCallback()

		this.createEffect(() => {
			const {avatarModel, backgroundModel} = this
			if (!avatarModel || !backgroundModel) return

			disableFrustumCulledOnLoad(backgroundModel)
			disableFrustumCulledOnLoad(avatarModel)

			const garmentModels = querySelectorAllSignal(avatarModel, 'lume-gltf-model[data-cloth]') as Accessor<
				NodeListOf<GltfModel>
			>

			const extraObjects = querySelectorAllSignal(avatarModel, 'lume-gltf-model.extraObjects') as Accessor<
				NodeListOf<GltfModel>
			>

			createEffect(() => {
				for (const el of extraObjects()) disableFrustumCulledOnLoad(el)
			})

			createEffect(() => {
				if (store.view === 'preview') {
					this.style.setProperty('--sceneTranslateX', 'translateX(0)')
					this.style.setProperty('--sceneTranslateY', 'translateY(0)')
				} else {
					this.style.setProperty('--sceneTranslateY', 'translateY(-100px)')

					if (
						store.view === 'order' ||
						store.view === 'order-items' ||
						store.view === 'order-size' ||
						store.view === 'custom-measurement' ||
						store.view === 'success' ||
						store.view === 'share'
					) {
						this.style.setProperty('--sceneTranslateX', 'translateX(calc(-1 * var(--sceneDesktopOffset)))')
					} else {
						this.style.setProperty('--sceneTranslateX', 'translateX(var(--sceneDesktopOffset))')
					}
				}
			})

			createEffect(() => {
				if (!this.selectedSpace) return
				const space = spaces.find(space => space.slug === this.selectedSpace?.slug)
				if (space) {
					const defaultSceneSlug = getSpaceDefaultScene(space)
					const scene = getSceneBySlug(backgroundScenes, defaultSceneSlug)
					if (scene) this.sceneUrl = scene.scene
				}
			})

			const mutations = createMutationsSignal(document.documentElement, {
				attributes: true,
				attributeFilter: ['data-theme'],
			})

			createEffect(() => {
				mutations()
				this.isDark = document.documentElement.dataset.theme === 'dark'
			})

			// Track selected avatar loading state
			const avatarId = Symbol('avatar')
			store.trackModelLoading(avatarId, avatarModel)

			// Track background scene loading state (only if a scene is given)
			const sceneId = Symbol('scene')
			createEffect(() => {
				if (!backgroundModel.src) return
				store.trackModelLoading(sceneId, backgroundModel)
			})

			let previousCount = -1
			let loaderTimeout: number | undefined = undefined
			let progressTimeouts: number[] = []

			createEffect(() => {
				const loadingCount = store.drippySceneLoads.size

				if (loadingCount > 0) {
					// Delay showing loader for 500ms - skip for fast loads
					if (!this.isLoading && loaderTimeout === undefined) {
						loaderTimeout = window.setTimeout(() => {
							if (store.drippySceneLoads.size > 0) {
								this.isLoading = true
								this.loadingProgress = 10
							}
							loaderTimeout = undefined
						}, 500)
					}

					if (this.isLoading) {
						if (loadingCount === 2) {
							this.loadingProgress = 10
						} else if (loadingCount === 1) {
							if (previousCount === 2 || previousCount === -1) {
								// animate smoothly through multiple steps
								const progressStages = [
									{progress: 15, delay: 0},
									{progress: 30, delay: 150},
									{progress: 50, delay: 300},
									{progress: 60, delay: 1000},
									{progress: 65, delay: 3000},
									{progress: 70, delay: 5000},
									{progress: 75, delay: 7000},
									{progress: 78, delay: 10000},
									{progress: 80, delay: 14000},
									{progress: 82, delay: 18000},
									{progress: 84, delay: 23000},
									{progress: 88, delay: 30000},
									{progress: 92, delay: 40000},
								]

								progressStages.forEach(({progress, delay}) => {
									const timeoutId = window.setTimeout(() => {
										if (store.drippySceneLoads.size === 1) {
											this.loadingProgress = progress
										}
									}, delay)
									progressTimeouts.push(timeoutId)
								})
							}
						}

						previousCount = loadingCount
					}
				} else if (loadingCount === 0 && (previousCount > 0 || this.isLoading || loaderTimeout !== undefined)) {
					// Clear pending loader timeout if loading finished fast
					if (loaderTimeout !== undefined) {
						clearTimeout(loaderTimeout)
						loaderTimeout = undefined
					}

					// Clear all progress stage timeouts
					progressTimeouts.forEach(timeoutId => clearTimeout(timeoutId))
					progressTimeouts = []

					if (this.isLoading) {
						this.loadingProgress = 100

						// Wait for browser to paint 100% before hiding
						// Triple RAF + small delay ensures 100% is visible
						requestAnimationFrame(() => {
							requestAnimationFrame(() => {
								requestAnimationFrame(() => {
									setTimeout(() => {
										this.isLoading = false
										previousCount = -1
									}, 100)
								})
							})
						})
					} else {
						// Reset state even if loader was never shown
						previousCount = -1
					}
				}
			})

			// Cleanup timeouts on component unmount
			onCleanup(() => {
				if (loaderTimeout !== undefined) {
					clearTimeout(loaderTimeout)
				}
				progressTimeouts.forEach(timeoutId => clearTimeout(timeoutId))
			})

			// Track block loading state
			createEffect(() => {
				for (const [index, el] of garmentModels().entries()) {
					// Use element ID + index for more stable identification
					const elementId = el.getAttribute('id') || `unknown-${index}`
					const blockId = Symbol(`block-${elementId}-${index}`)
					const modelLoaded = onModelLoad(el)

					createEffect(() => {
						if (!modelLoaded()) store.addLoadingBlock(blockId)
						onCleanup(() => store.removeLoadingBlock(blockId))
					})

					disableFrustumCulledOnLoad(el)
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

			createEffect(() => {
				const blocks = Array.from(this.selectedBlocks.values()).flatMap(blocks => Array.from(blocks.values()))
				this.renderBlocks = blocks.flatMap(block => {
					if (block.category === 'Sleeves') {
						const id = `${block.collection?.replace(/-/g, '_')}-${block.templateCategory}-${block.category}-${block._id}`
						let renderBlock = getRenderBlock(id, block, block.templateCategory)

						const idMirror = `${id}-mirror`
						let renderBlockMirror = getRenderBlock(idMirror, block, block.templateCategory)

						return [renderBlock, renderBlockMirror]
					}

					const id = `${block.collection?.replace(/-/g, '_')}-${block.templateCategory}-${block.category}-${block._id}`
					let renderBlock = getRenderBlock(id, block, block.templateCategory)

					return renderBlock
				})
			})

			// Re-apply materials whenever the selected fabrics change or models mount
			createEffect(() => {
				const selectedFabrics = this.selectedFabrics

				// Cause reactive re-run when the number of blocks changes
				if (this.renderBlocks.length === 0) {
					// nothing to bind
					return
				}

				let shouldCancel = false
				const isCanceled = () => shouldCancel

				// Process each model using its data-blockid to find the correct fabric
				for (const el of garmentModels()) {
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
					const fabrics = templateFabrics?.get(blockCategory) || new Map<string, Fabric>()
					const loadingId = Symbol(`material-${blockId}`)

					const modelLoaded = onModelLoad(el)

					createEffect(() => {
						if (!modelLoaded()) return

						if (fabrics.size > 0) {
							const template = store.selectedTemplates.get(templateCategory)
							this.#applyFabrics(el, fabrics, isCanceled, loadingId, template?._id)
						} else {
							// Reset to default material if no fabric selected for this block category
							this.#resetMaterialsToDefault(el)
							const template = store.selectedTemplates.get(templateCategory)
							if (template) {
								store.clearLoadingTemplate(template._id)
							}
						}

						onCleanup(() => this.#resetMaterialsToDefault(el))
					})
				}

				onCleanup(() => (shouldCancel = true))
			})

			createEffect(() => {
				if (store.selectedAnimation === 'none') {
					this.animsEnabled = false

					this.animName = null
					this.animSrc = null
				} else if (store.selectedAnimation === 'walk') {
					this.animsEnabled = true

					// this.animName = 'FV2_Walking in place.mtn'
					// this.animSrc = new URL('../models/Yuna-walkinplace.glb', import.meta.url).href
					// this.animName = 'animation_0'
					// this.animSrc = new URL('../models/EM-anim-test.glb', import.meta.url).href
					this.animName = 'animation_0'
					this.animSrc = new URL('../models/EM_Rig_v001-anim-test.glb', import.meta.url).href
				} else if (store.selectedAnimation === 'dance') {
					this.animsEnabled = true

					this.animName = 'FV2_Dancing_01.mtn'
					this.animSrc = new URL('../models/Yuna-dancing01.glb', import.meta.url).href
				}
			})

			createEffect(() => {
				if (!this.lumeScene) return
				this.lumeScene.glRenderer!.toneMapping = THREE.ACESFilmicToneMapping
			})

			enableFrontsideOnModelLoad(backgroundModel)
			enableShadowOnModelLoad(backgroundModel)
			setEnvMapOnModelLoad(backgroundModel, env)
			setMaterialsVisibleOnModelLoad(backgroundModel, () => store.isShowScene)
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
				condition=${() => !pathname().includes('upload-view')}
				content=${() => html`
					<progress-loader is-visible=${() => this.isLoading} progress=${() => this.loadingProgress}></progress-loader>
				`}
			></show-when>

			<show-when
				condition=${() => store.isAdmin && !store.turnOffSettingsInSpace}
				content=${() => html`
					<div
						style="position: absolute; top: 1rem; left: 50%; z-index: 1000; background: transparent; border-radius: 8px; padding: 6px 8px; display: none; flex-direction: column; gap: 4px; min-width: 60px; backdrop-filter: blur(4px);"
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

			<div id="lume-scene-container">
				<lume-scene
					ref=${(el: Scene) => ((this.lumeScene = el), el && (el.three.environmentIntensity = 0.3))}
					id="drippy-scene"
					webgl
					perspective="800"
					physically-correct-lights
					shadow-mode="vsm"
					environment="/images/envs/brown_photostudio_02.jpg"
				>
					<lume-element3d align-point="0.5 0.5 0.5">
						<lume-ambient-light visible="true" intensity="0.7" color="white"></lume-ambient-light>

						<!-- a sphere to debug/visualize the env map -->
						<lume-sphere visible="${() => store.isAdmin && !store.turnOffSettingsInSpace && false}" size="0.5 0.5 0.5" color="white" position="-2 -2 0" metalness="1" roughness="0"></lume-sphere>

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
							min-distance="0.5"
							max-distance="${() => (isDesktop() ? 30 : 50)}"
							distance="${() => (isDesktop() ? 2.5 : 4)}"
							min-vertical-angle="-17"
							max-vertical-angle="45"
							dolly-speed="${() => (this.landing ? 0 : 0.01)}"
							position="0 -1 0"
						>
							<lume-perspective-camera active slot="camera-child" near="0.05" far="60" fov="50"></lume-perspective-camera>
						</lume-camera-rig>

						<lume-gltf-model
							id="avatar"
							ref=${(el: GltfModel) => ((this.avatarModel = el), enableShadowOnModelLoad(el), setEnvMapOnModelLoad(el, env), showSkeletonHelper(el, () => true))}
							attr:src=${() => avatars.find(avatar => avatar.name === this.selectedAvatar)?.src ?? ''}
							scale="1 1 1"
							data-avatar
						>
							<lume-element3d ref=${(el: Element3D) => setMaterialsVisibleOnModelLoad(el.parentElement as GltfModel, () => store.isShowAvatar, el)}>
								<${For} each=${() => this.renderBlocks}>
									${(item: RenderBlock, index: Accessor<number>) => html`
										<lume-gltf-model
											ref=${(el: GltfModel) => {
												enableShadowOnModelLoad(el)
												setEnvMapOnModelLoad(el, env)

												setTimeout(() => {
													const modelLoaded = onModelLoad(el)
													createEffect(() => {
														if (!this.avatarModel) return

														const avatarLoaded = onModelLoad(this.avatarModel!)
														createEffect(() => {
															if (!avatarLoaded() || !modelLoaded()) return

															this.#checkRiggedMesh(el)
														})
													})
												})
											}}
											id=${item.id}
											data-index=${index()}
											data-cloth
											attr:src=${item.block.modelFile}
											scale=${item.id.endsWith('-mirror') ? '-1 1 1' : '1 1 1'}
										>
										</lume-gltf-model>
									`}
								</>
							</lume-element3d>

							<xlume-animation
								attr:src=${() => this.animSrc}
								clip-name=${() => this.animName}
								stopped=${() => !this.animsEnabled}
							></lume-animation>
						</lume-gltf-model>

					<lume-gltf-model
						ref=${(el: GltfModel) => (this.backgroundModel = el)}
						id="scene"
						attr:src=${() => {
							const defaultSceneSlug = getSpaceDefaultScene(this.selectedSpace)
							const scene = getSceneBySlug(backgroundScenes, defaultSceneSlug)
							console.log('selected background', scene?.scene)
							return scene?.scene ?? ''
						}}
					></lume-gltf-model>

					<${Index}
						each=${() => {
							const defaultSceneSlug = getSpaceDefaultScene(this.selectedSpace)
							const scene = getSceneBySlug(backgroundScenes, defaultSceneSlug)
							return scene?.includedModelFiles ?? []
						}}
					>
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
			--sceneDesktopOffset: 15rem;
			--sceneTranslateX: translateX(0);
			--sceneTranslateY: translateY(-100px);
			background: var(--appBackground);
			width: 600px;
			height: 400px;
			touch-action: none;
			position: relative;
			/* iOS specific fixes */
			-webkit-backface-visibility: hidden;
			backface-visibility: hidden;
			-webkit-transform: translateZ(0);
			transform: translateZ(0);
		}

		#lume-scene-container {
			width: calc(100% + 2 * var(--sceneDesktopOffset));
			height: 100%;
			translate: calc(-1 * var(--sceneDesktopOffset));
			transition: transform var(--transitionFast);
			-webkit-transition: transform var(--transitionFast);
			/* iOS specific fixes */
			-webkit-backface-visibility: hidden;
			backface-visibility: hidden;
			-webkit-transform: translateZ(0);
			transform: translateZ(0);
		}

		:host-context(.showcase__model-center) lume-scene {
			transform: unset !important;
			-webkit-transform: unset !important;
			transition: unset !important;
			-webkit-transition: unset !important;
		}

		lume-scene {
			transform: var(--sceneTranslateX);
			-webkit-transform: var(--sceneTranslateX);
			transition: transform var(--transitionFast);
			-webkit-transition: transform var(--transitionFast);
			/* iOS specific fixes */
			-webkit-backface-visibility: hidden;
			backface-visibility: hidden;
		}

		@media (max-width: 767px) {
			:host-context(.showcase__model-center) #lume-scene-container {
				transform: unset !important;
				-webkit-transform: unset !important;
			}
			#lume-scene-container {
				transform: var(--sceneTranslateY);
				-webkit-transform: var(--sceneTranslateY);
			}

			lume-scene {
				transform: translateX(0);
				-webkit-transform: translateX(0);
			}
		}
	`
}

function disableFrustumCulledOnLoad(model: GltfModel) {
	const modelLoaded = onModelLoad(model)

	createEffect(() => {
		if (modelLoaded()) model.three.traverse(child => (child.frustumCulled = false))
	})
}
