import {
	attribute,
	CameraRig,
	clamp,
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
import {createMemo, untrack} from 'solid-js'
import * as THREE from 'three'
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js'
import {OutlinePass} from 'three/examples/jsm/postprocessing/OutlinePass.js'
import {OutputPass} from 'three/examples/jsm/postprocessing/OutputPass.js'
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js'
import {avatars} from '../consts/avatars.js'

import {createMutable} from 'solid-js/store'
import {backgroundScenes} from '../consts/scenes.js'
import {spaces} from '../consts/spaces.js'
import '../elements/logic/show-when.js'
import '../elements/lume-animation.js'
import '../elements/progress-loader.js'
import '../elements/rig/lume-auto-rigger.js'
import {pathname} from '../routes.js'
import type {Block, BlockCategory} from '../types/block.js'
import type {TemplateCategory} from '../types/template.js'
import type {PieceFabricsMap, SelectedGarments, Space} from '../types/types.js'
import {
	createFabricTexture,
	createMutationsSignal,
	enableFrontsideOnModelLoad,
	enableShadowOnModelLoad,
	getArmatureObject,
	getSceneBySlug,
	getSpaceDefaultScene,
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
	@attribute selectedGarments: SelectedGarments = {}
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

	// Camera rig drag state
	@signal private cameraY = -1
	@signal private cameraRigInteractive = true
	@signal private isVerticalPan = false
	@signal private cameraRig: CameraRig | null = null

	// Post-processing for outline effect
	private composer: EffectComposer | null = null
	private outlinePass: OutlinePass | null = null

	/**
	 * Stores fabric texture signals in a two-level Map structure to keep them stable across effect reruns.
	 *
	 * Structure:
	 *   Map<blockId, Map<fabricId, {texture, loading, error}>>
	 *
	 * Example:
	 *   fabricTextureSignals
	 *   ├─ "drippy_Shirt_Bodice_123" (blockId)
	 *   │  ├─ "fabric_456" → {
	 *   │  │     texture: Accessor<TextureSet | null>,  // Contains ALL texture maps for this fabric
	 *   │  │     loading: Accessor<boolean>,
	 *   │  │     error: Accessor<Error | null>
	 *   │  │   }
	 *   │  │   // texture() returns TextureSet with: baseColor, normal, displacement, roughness, alpha
	 *   │  └─ "fabric_789" → {texture, loading, error}
	 *   └─ "drippy_Pants_Bottom_456" (blockId)
	 *      └─ "fabric_101" → {texture, loading, error}
	 *
	 * TextureSet (returned by texture()):
	 *   - baseColor?: THREE.Texture      // Main color texture
	 *   - normal?: THREE.Texture         // Normal map for surface detail
	 *   - displacement?: THREE.Texture   // Displacement map for height
	 *   - roughness?: THREE.Texture      // Roughness map for material properties
	 *   - alpha?: THREE.Texture          // Alpha/transparency map
	 *
	 * Why this structure:
	 * - Outer Map (blockId): Isolates signals per garment block for easy cleanup
	 * - Inner Map (fabricId): Tracks each fabric's loading state independently
	 * - ReturnType<typeof createFabricTexture>: The signal object returned by createFabricTexture()
	 *   containing reactive texture, loading, and error states
	 *
	 * Benefits:
	 * - Signals persist across effect reruns (no recreation)
	 * - Enables proper reactive tracking of async texture loading
	 * - All texture maps per fabric are bundled in TextureSet (accessed via texture())
	 * - Easy cleanup when blocks or fabrics are removed
	 */
	private fabricTextureSignals: Record<string, Record<string, ReturnType<typeof createFabricTexture>>> = createMutable(
		{},
	)

	#applyFabricsWithSignals(
		el: Element3D,
		loadingId: symbol,
		templateId: string | undefined,
		templateCategory: TemplateCategory,
		blockCategory: BlockCategory,
	) {
		const root = el.three
		const blockId = el.getAttribute('id') || 'unknown'

		// Extract UV data for proper texture scaling
		const meshes = [...meshesInTree(root)]
		const uvArray = meshes[0]?.geometry?.attributes?.uv?.array ? Array.from(meshes[0].geometry.attributes.uv.array) : []

		// Get or create signal storage for this block
		const blockFabricSignals = untrack(() =>
			this.fabricTextureSignals[blockId]
				? this.fabricTextureSignals[blockId]
				: ((this.fabricTextureSignals[blockId] = {}), this.fabricTextureSignals[blockId]),
		)
		// console.log('### blockFabricSignals', {...blockFabricSignals})

		const currentSelectedFabrics = createMemo(() => {
			//templateId
			const templateSelection = store.selectedGarments[templateCategory] ?? {}
			const blockSelection = templateSelection?.[blockCategory]
			const fabricsRecord = {...(blockSelection?.fabrics ?? {})}
			console.log(`### [${blockCategory}] fabricsRecord:`, fabricsRecord)
			console.log(
				`### [${blockCategory}] fabric IDs:`,
				Object.values(fabricsRecord).map(f => f._id),
			)
			const result = new Map(
				Object.entries(fabricsRecord).map(([_, fabric]) => [_, Object.freeze({...fabric})]),
			) as PieceFabricsMap
			console.log(`### [${blockCategory}] currentSelectedFabrics Map size:`, result.size)
			console.log(`### [${blockCategory}] currentSelectedFabrics Map entries:`, Array.from(result.entries()))
			return result
		})

		// Create texture signals when fabrics change
		createEffect(() => {
			//templateId
			// console.log('### CREATE effect - running for blockId:', blockId)
			const currentFabrics = currentSelectedFabrics()
			// console.log('### CREATE effect currentFabrics entry count', currentFabrics.size)
			// console.log('### BEFORE CREATE - blockFabricSignals keys:', Object.keys(blockFabricSignals))
			// console.log('### BEFORE CREATE - blockFabricSignals reference:', blockFabricSignals)

			// Create signals for new fabrics
			for (const fabric of currentFabrics.values()) {
				const textureState = createFabricTexture(() => fabric, uvArray)
				blockFabricSignals[fabric._id] = textureState

				// Track loading state per fabric ID
				createEffect(() => {
					const isLoading = textureState.loading()
					const hasTexture = !!textureState.texture()
					console.log(`### [${fabric._id}] isLoading:`, isLoading, 'hasTexture:', hasTexture)
					if (isLoading) {
						store.addLoadingFabric(fabric._id)
					} else {
						store.removeLoadingFabric(fabric._id)
					}

					onCleanup(() => {
						store.removeLoadingFabric(fabric._id)
					})
				})
			}

			onCleanup(() => {
				console.log('### CREATE effect CLEANUP - deleting blockFabricSignals keys:', Object.keys(blockFabricSignals))
				for (const key in blockFabricSignals) delete blockFabricSignals[key]
				console.log('### CREATE effect CLEANUP - after delete, keys:', Object.keys(blockFabricSignals))
			})
		})

		const isAnyFabricLoading = createMemo(() => {
			return Object.values(blockFabricSignals).some(signal => signal.loading())
		})

		// Track aggregate loading state reactively
		createEffect(() => {
			if (!isAnyFabricLoading()) return

			store.addLoadingMaterial(loadingId)

			onCleanup(() => {
				store.removeLoadingMaterial(loadingId)
				if (templateId) store.clearLoadingTemplate(templateId)
			})
		})

		// Apply textures reactively as they load
		createEffect(() => {
			//console.log('### APPLY effect - running for blockId:', blockId)
			const currentFabrics = currentSelectedFabrics()
			console.log('### APPLY effect - START - blockFabricSignals keys:', Object.keys(blockFabricSignals))

			// Create a map for mesh to meshes key
			const meshToFabricMeshesMap = new Map<string, string>()
			for (const meshesKey of currentFabrics.keys()) {
				const meshArray = meshesKey.split('-')
				for (const mesh of meshArray) {
					meshToFabricMeshesMap.set(mesh, meshesKey)
				}
			}

			const allFabricMeshes = [...meshToFabricMeshesMap.keys()]

			for (const mesh of meshes) {
				// Check if there's a specific fabric assigned to this mesh
				const meshKey = allFabricMeshes.filter(fabricMesh => hasAncestorWithName(mesh, fabricMesh))[0]
				const meshesKey = meshToFabricMeshesMap.get(meshKey)
				const fabricToUse = currentFabrics.get(meshesKey || 'default')

				if (fabricToUse) {
					console.log('### APPLY effect - blockFabricSignals keys:', Object.keys(blockFabricSignals))
					console.log('### APPLY effect - fabricToUse._id:', fabricToUse._id)
					console.log('### APPLY effect - fabricToUse:', fabricToUse)
					const textureState = blockFabricSignals[fabricToUse._id]
					console.log(
						'### fabricToUse:',
						fabricToUse._id,
						'textureState exists:',
						!!textureState,
						'textureState:',
						textureState,
					)
					if (textureState) {
						const textureSet = textureState.texture()
						const isLoading = textureState.loading()
						const error = textureState.error()
						console.log('### textureSet:', !!textureSet, 'isLoading:', isLoading, 'error:', error)

						if (textureSet && !isLoading && !error) {
							console.log('### APPLYING TEXTURE TO MESH')
							mesh.material = new THREE.MeshPhysicalMaterial()
							textureManager.applyTexturesToMaterial(mesh.material, textureSet)
						}
					}
				}
			}

			el.needsUpdate()
		})

		const cleanup = () => {
			store.removeLoadingMaterial(loadingId)
			if (!el.isConnected) {
				delete this.fabricTextureSignals[blockId]
				this.#resetMaterialsToDefault(el)
			}
		}

		onCleanup(cleanup)
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

	#handlePointerDown = (e: PointerEvent) => {
		const isMobile = !isDesktop()

		// Mobile: always enable vertical drag, Desktop: only with shift key
		if (isMobile || e.shiftKey) {
			this.isVerticalPan = true
			if (!isMobile) {
				e.stopImmediatePropagation()
			}
		}
	}

	#handlePointerMove = (e: PointerEvent) => {
		const isMobile = !isDesktop()
		if (!this.isVerticalPan) return
		// Scale the movement - dragging down increases Y (looks up), dragging up decreases Y (looks down)
		this.cameraY -= e.movementY / 1000
		this.cameraY = clamp(this.cameraY, -2, 0)
		if (!isMobile) {
			e.stopImmediatePropagation()
		}
	}

	#handlePointerUp = (e: PointerEvent) => {
		const isMobile = !isDesktop()
		if (this.isVerticalPan && !isMobile) {
			e.stopImmediatePropagation()
		}

		this.isVerticalPan = false
	}

	connectedCallback() {
		super.connectedCallback()

		// Reset camera to default when space changes
		this.createEffect(() => {
			const space = this.selectedSpace
			if (!space || !this.cameraRig) return

			this.cameraRig.distance = isDesktop() ? 2.5 : 4
			this.cameraRig.verticalAngle = 0
			this.cameraRig.horizontalAngle = 0
			this.cameraY = -1

			this.cameraRig.needsUpdate()
		})

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

			// Watch for panel collapse state changes
			const panelCollapseMutations = createMutationsSignal(document.documentElement, {
				attributes: true,
				attributeFilter: ['class'],
			})

			createEffect(() => {
				// Trigger reactive update when panel collapse state changes
				panelCollapseMutations()
				const isPanelCollapsed = document.documentElement.classList.contains('panel-collapsed')

				if (store.view === 'preview') {
					this.style.setProperty('--sceneTranslateX', 'translateX(0)')
					this.style.setProperty('--sceneTranslateY', 'translateY(0)')
				} else {
					this.style.setProperty('--sceneTranslateY', 'translateY(-100px)')

					const shouldShiftLeft =
						store.view === 'order' ||
						store.view === 'order-items' ||
						store.view === 'order-size' ||
						store.view === 'custom-measurement' ||
						store.view === 'success' ||
						store.view === 'share' ||
						store.view === 'template'

					if (isPanelCollapsed) {
						this.style.setProperty('--sceneTranslateX', 'translateX(0)')
					} else if (shouldShiftLeft) {
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

			// Track block loading state - use WeakSet to track by element, not by ID
			const trackedElements = new WeakSet<Element>()

			createEffect(() => {
				for (const [index, el] of garmentModels().entries()) {
					// Only create effect once per element instance
					if (!trackedElements.has(el)) {
						trackedElements.add(el)
						const blockId = el.getAttribute('data-block-id') || el.getAttribute('id') || `unknown-${index}`
						const modelLoaded = onModelLoad(el)

						createEffect(() => {
							if (!modelLoaded()) {
								store.addLoadingBlock(blockId)
							} else {
								store.removeLoadingBlock(blockId)
							}

							onCleanup(() => {
								store.removeLoadingBlock(blockId)
							})
						})
					}

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
				const garmentSelections = this.selectedGarments ?? {}
				const blocks: Block[] = []

				for (const templateSelection of Object.values(garmentSelections)) {
					if (!templateSelection) continue

					for (const selection of Object.values(templateSelection)) {
						if (selection?.block) {
							blocks.push(selection.block)
						}
					}
				}

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

			// Stable loading IDs per block
			const blockLoadingIds = new Map<string, symbol>()

			// Re-apply materials whenever the selected fabrics change or models mount
			createEffect(() => {
				// Cause reactive re-run when the number of blocks changes
				if (this.renderBlocks.length === 0) {
					// nothing to bind
					return
				}

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

					// Get or create stable loading ID
					let loadingId = blockLoadingIds.get(blockId)
					if (!loadingId) {
						loadingId = Symbol(`material-${blockId}`)
						blockLoadingIds.set(blockId, loadingId)
					}

					const modelLoaded = onModelLoad(el)

					createEffect(() => {
						const loaded = modelLoaded()
						if (!loaded) return

						const template = store.selectedTemplates.get(templateCategory)
						const fabricsRecord = store.getTemplateSelection(templateCategory)?.[blockCategory]?.fabrics
						void fabricsRecord

						this.#applyFabricsWithSignals(el, loadingId!, template?._id, templateCategory, blockCategory)
					})
				}
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

			// Set up post-processing for outline effect
			let renderPass: RenderPass | null = null

			createEffect(() => {
				if (!this.lumeScene) return
				const renderer = this.lumeScene.glRenderer
				if (!renderer) return

				const threeScene = this.lumeScene.three
				const camera = this.lumeScene.threeCamera

				if (!threeScene || !camera) return

				// Wait for valid size before initializing composer
				const size = new THREE.Vector2()
				renderer.getSize(size)
				if (size.x === 0 || size.y === 0) return

				// Create composer if not exists
				if (!this.composer) {
					this.composer = new EffectComposer(renderer)

					renderPass = new RenderPass(threeScene, camera)
					this.composer.addPass(renderPass)

					this.outlinePass = new OutlinePass(size, threeScene, camera)
					this.outlinePass.edgeStrength = 3
					this.outlinePass.edgeGlow = 0.5
					this.outlinePass.edgeThickness = 4
					this.outlinePass.visibleEdgeColor.set(0x9b59b6) // purple accent
					this.outlinePass.hiddenEdgeColor.set(0x9b59b6)
					this.composer.addPass(this.outlinePass)

					const outputPass = new OutputPass()
					this.composer.addPass(outputPass)

					// Store original drawScene
					const originalDrawScene = this.lumeScene.drawScene.bind(this.lumeScene)

					// Override the render loop to use composer
					this.lumeScene.drawScene = () => {
						// Skip if size is invalid
						const currentSize = new THREE.Vector2()
						renderer.getSize(currentSize)
						if (currentSize.x === 0 || currentSize.y === 0) return

						// Only use composer if we have objects to outline AND selectingPiece is set
						if (true && store.selectingPiece && this.outlinePass && this.outlinePass.selectedObjects.length > 0) {
							// Update cameras to current frame's camera
							const currentCamera = this.lumeScene!.threeCamera!
							if (renderPass) renderPass.camera = currentCamera
							this.outlinePass.renderCamera = currentCamera
							this.composer!.render()
						} else {
							// Fall back to original rendering when no outline needed
							originalDrawScene()
						}
					}

					// Handle resize
					const resizeObserver = new ResizeObserver(() => {
						if (!this.lumeScene || !this.composer) return
						const newSize = new THREE.Vector2()
						renderer.getSize(newSize)
						if (newSize.x > 0 && newSize.y > 0) {
							this.composer.setSize(newSize.x, newSize.y)
						}
					})
					resizeObserver.observe(this.lumeScene)
					onCleanup(() => resizeObserver.disconnect())
				}
			})

			// Update outline selection based on store.selectingPiece
			// Use debounce and async processing to avoid blocking render
			let outlineUpdateTimeout: number | null = null
			let lastSelectingPiece: string | null = null

			createEffect(() => {
				if (!this.outlinePass) return

				const selectingPiece = store.selectingPiece

				// Skip if same piece (avoid redundant work)
				if (selectingPiece === lastSelectingPiece) return
				lastSelectingPiece = selectingPiece

				// Clear previous timeout
				if (outlineUpdateTimeout) {
					cancelAnimationFrame(outlineUpdateTimeout)
					outlineUpdateTimeout = null
				}

				if (!selectingPiece) {
					this.outlinePass.selectedObjects = []
					this.lumeScene?.needsUpdate()
					return
				}

				// Defer heavy work to next frame to avoid blocking
				outlineUpdateTimeout = requestAnimationFrame(() => {
					if (!this.outlinePass || store.selectingPiece !== selectingPiece) return

					const models = garmentModels()
					if (models.length === 0) return

					// "default" means all meshes in the garment
					const isDefault = selectingPiece === 'default'
					const pieceNames = isDefault ? [] : selectingPiece.split('-')
					const selectedMeshes: THREE.Object3D[] = []

					// Process models in chunks to avoid long blocking
					for (const garmentModel of models) {
						if (!garmentModel.three) continue

						garmentModel.three.traverse((obj: THREE.Object3D) => {
							if (!(obj as THREE.Mesh).isMesh) return

							if (isDefault) {
								selectedMeshes.push(obj)
							} else {
								for (const pieceName of pieceNames) {
									if (hasAncestorWithName(obj, pieceName)) {
										selectedMeshes.push(obj)
										break
									}
								}
							}
						})
					}

					if (this.outlinePass && store.selectingPiece === selectingPiece) {
						this.outlinePass.selectedObjects = selectedMeshes
						// Trigger re-render after updating outline selection
						this.lumeScene?.needsUpdate()
					}
				})
			})

			onCleanup(() => {
				if (outlineUpdateTimeout) cancelAnimationFrame(outlineUpdateTimeout)
			})
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
					oncapture:pointerdown=${this.#handlePointerDown}
					oncapture:pointermove=${this.#handlePointerMove}
					oncapture:pointerup=${this.#handlePointerUp}

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
							ref=${(el: CameraRig) => (this.cameraRig = el)}
							min-distance="0.5"
							max-distance="${() => (isDesktop() ? 30 : 50)}"
							distance="${() => (isDesktop() ? 2.5 : 4)}"
							min-vertical-angle="${() => (isDesktop() ? '-17' : '0')}"
							max-vertical-angle="${() => (isDesktop() ? '45' : '0')}"
							dolly-speed="${() => (this.landing ? 0 : 0.01)}"
							attr:position="${() => `0 ${this.cameraY} 0`}"
							xinteractive=${() => {
								return this.cameraRigInteractive
							}}
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
											attr:data-block-id=${() => item.block._id}
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

					<!-- Background scene -->
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

					<!-- Background scene extra objects -->
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
				transform: var(--overrideSceneTranslateY, var(--sceneTranslateY));
				-webkit-transform: var(--overrideSceneTranslateY, var(--sceneTranslateY));
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
