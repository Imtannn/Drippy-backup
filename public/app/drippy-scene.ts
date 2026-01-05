import {
	attribute,
	CameraRig,
	clamp,
	createEffect,
	css,
	disposeMaterial,
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
	memo,
} from 'lume'
import type {Accessor} from 'solid-js'
import {createMemo} from 'solid-js'
import * as THREE from 'three'
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js'
import {OutlinePass} from 'three/examples/jsm/postprocessing/OutlinePass.js'
import {OutputPass} from 'three/examples/jsm/postprocessing/OutputPass.js'
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js'
import {avatars} from '../consts/avatars.js'

import {backgroundScenes} from '../consts/scenes.js'
import {spaces} from '../consts/spaces.js'
import {appAnims} from '../elements/animation-select.js'
import '../elements/logic/show-when.js'
import '../elements/lume-animation.js'
import '../elements/lume-rect-area-light.js'
import '../elements/progress-loader.js'
import '../elements/rig/lume-auto-rigger.js'
import {pathname} from '../routes.js'
import type {Block, BlockCategory} from '../types/block.js'
import type {TemplateCategory} from '../types/template.js'
import type {Gender, SelectedGarments, Space, TemplateMap} from '../types/types.js'
import {
	arrayEquals,
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
	whenModelLoaded,
} from '../utils.js'
import './app-buttons.js'
import {AvatarSkeleton} from './avatar-skeleton.js'
import {store} from './store.js'
import {templateHelpers} from './template-helpers.js'
import {textureManager} from './texture-manager.js'
import {blocks} from '../consts/blocks.js'

// TODO Use the env specified for each space.
const env = '/images/envs/brown_photostudio_02.jpg'

type Collection = string
type BlockId = string
type MaybeMirror = '' | '-mirror'
type RenderBlockId = `${Collection}-${TemplateCategory}-${BlockCategory}-${BlockId}${MaybeMirror}`

interface RenderBlock {
	block: Block
	templateCategory: TemplateCategory
	id: RenderBlockId
}

const defaultRenderBlocks: RenderBlock[] = blocks.default.map(block => {
	if ((block.category as BlockCategory) === 'Sleeves')
		throw new Error('Separate sleeves not currently supported for default garments.')

	return {
		block,
		templateCategory: block.templateCategory,
		id: `${block.collection}-${block.templateCategory}-${block.category}-${block._id}`,
	} satisfies RenderBlock
})

const defaultFemaleBlocks = defaultRenderBlocks.filter(b => b.block.avatar === 'female')
const defaultMaleBlocks = defaultRenderBlocks.filter(b => b.block.avatar === 'male')

@element
export class DrippyScene extends Element {
	static override elementName = 'drippy-scene'

	@attribute selectedSpace: Space | null = null
	@attribute selectedAvatar: string | null = null
	@attribute selectedGarments: SelectedGarments = {}
	@attribute landing: boolean = false

	@signal isDark = false
	@signal sceneUrl = ''

	@signal private backgroundModel: GltfModel | null = null
	@signal private avatarModel: GltfModel | null = null
	private avatarSkeleton = new AvatarSkeleton()
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

	@memo get scene() {
		const defaultSceneSlug = getSpaceDefaultScene(this.selectedSpace)
		return getSceneBySlug(backgroundScenes, defaultSceneSlug)
	}

	// Post-processing for outline effect
	private composer: EffectComposer | null = null
	private outlinePass: OutlinePass | null = null

	// Reset materials to default state (no textures)
	#resetMaterialProperties(el: Element3D, mesh: THREE.Mesh) {
		const material = mesh.material as THREE.MeshPhysicalMaterial
		material.map = null
		material.normalMap = null
		material.roughnessMap = null
		// material.displacementMap = null
		material.needsUpdate = true

		el.needsUpdate()
	}

	// TODO Move to `lume-block`
	/**
	 * Checks if the model is rigged, if so, sets the skeleton to the avatar's.
	 * @param model
	 */
	#checkRiggedMesh(model: GltfModel) {
		if (!this.avatarModel) return

		const sourceSkeleton = getArmatureObject(this.avatarModel.three)?.skeleton
		if (!sourceSkeleton) return

		model.three.traverse((obj: any) => {
			if (obj.skeleton) obj.skeleton = sourceSkeleton
		})
	}

	// TODO Move to `lume-block`
	/**
	 * Checks if the block is an accessory, and if so, creates an appropriate bone target.
	 * @param block
	 * @param obj
	 */
	#checkAccessory(block: RenderBlock, obj: THREE.Object3D) {
		if (block.block.category !== 'Accessory') return

		this.avatarSkeleton.createBoneTarget(obj, 'Left_HandIndex_Tip')
	}

	/** Check if a default garment should be visible based on user selections */
	#isDefaultGarmentVisible(templateCategory: TemplateCategory, selectedTemplates: TemplateMap): boolean {
		// Has user selected this category?
		if (selectedTemplates?.[templateCategory]) {
			const templateBlocks = this.renderBlocks.filter(rb => rb.templateCategory === templateCategory)

			// Keep default visible if no blocks rendered yet OR any block still loading
			if (templateBlocks.length === 0) return true
			const anyBlockLoading = templateBlocks.some(rb => store.isBlockLoading(rb.block._id))
			return anyBlockLoading
			// // Template selected - keep default visible until all blocks are loaded
			// const templateBlocks = this.renderBlocks.filter(rb => rb.templateCategory === templateCategory)
			// // Keep default visible if no blocks rendered yet OR any block still loading
			// if (templateBlocks.length === 0) return true
			// const anyBlockLoading = templateBlocks.some(rb => store.isBlockLoading(rb.block._id))
			// return anyBlockLoading // Visible while loading, hidden when done
		}
		// Is this category overridden by another selected category?
		const overriddenBy = templateHelpers.getCategoriesThatOverride(templateCategory)
		return !overriddenBy.some(cat => selectedTemplates[cat])
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

	@memo private get avatar() {
		return avatars.find(a => a.name === this.selectedAvatar)
	}

	@memo private get avatarGender(): Gender {
		return this.avatar?.gender ?? 'female'
	}

	// Select default garments based on avatar gender
	// These are always rendered (preloaded) but visibility is toggled
	@memo private get _defaultRenderBlocks(): RenderBlock[] {
		const gender = this.avatarGender
		return gender === 'female' ? defaultFemaleBlocks : defaultMaleBlocks
	}

	@memo private get renderBlocks(): RenderBlock[] {
		const garmentSelections = this.selectedGarments ?? {}
		const blocks: Block[] = []

		for (const templateSelection of Object.values(garmentSelections)) {
			if (!templateSelection) continue
			for (const selection of Object.values(templateSelection)) if (selection?.block) blocks.push(selection.block)
		}

		return [
			...this._defaultRenderBlocks,
			...blocks.flatMap(block => {
				const id: RenderBlockId = `${block.collection?.replace(/-/g, '_')}-${block.templateCategory}-${block.category}-${block._id}`
				let renderBlock = getRenderBlock(id, block, block.templateCategory)

				if (block.category === 'Sleeves') {
					const idMirror: RenderBlockId = `${id}-mirror`
					let renderBlockMirror = getRenderBlock(idMirror, block, block.templateCategory)
					return [renderBlock, renderBlockMirror]
				}

				return renderBlock
			}),
		]
	}

	override connectedCallback() {
		super.connectedCallback() // runs this.template()

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
			enableFrontsideOnModelLoad(backgroundModel)
			enableShadowOnModelLoad(backgroundModel)
			setEnvMapOnModelLoad(backgroundModel, env)
			setMaterialsVisibleOnModelLoad(backgroundModel, () => store.isShowScene)
			whenModelLoaded(backgroundModel, () => {
				backgroundModel.three.traverse(obj => {
					// if ((obj as any).isLight)
					obj.castShadow = false
				})
			})

			// Track selected avatar loading state
			const avatarId = Symbol('avatar')
			store.trackModelLoading(avatarId, avatarModel)

			// Track background scene loading state (only if a scene is given)
			createEffect(() => {
				if (!backgroundModel.src) return
				const sceneId = Symbol('background')
				store.trackModelLoading(sceneId, backgroundModel)
			})

			const garmentModels = querySelectorAllSignal(avatarModel, 'lume-gltf-model[data-block]') as Accessor<
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
						store.view === 'iframe-popup' ||
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
					if (this.scene) this.sceneUrl = this.scene.scene
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

			const avatarLoaded = onModelLoad(avatarModel)
			createEffect(() => {
				if (!avatarLoaded()) return

				store.showAnimationSelect = !!getArmatureObject(avatarModel.three)
			})

			let previousCount = -1
			let loaderTimeout: number | undefined = undefined
			let progressTimeouts: number[] = []

			createEffect(() => {
				const loadingCount = store.drippySceneLoads.length

				if (loadingCount > 0) {
					// Delay showing loader for 500ms - skip for fast loads
					if (!this.isLoading && loaderTimeout === undefined) {
						loaderTimeout = window.setTimeout(() => {
							if (store.isDrippySceneLoading) {
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
										if (store.drippySceneLoads.length === 1) {
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
						this.isLoading = false
						previousCount = -1
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

			createEffect(() => {
				for (const el of garmentModels()) {
					const blockId = el.dataset.blockId
					if (!blockId) throw new Error('Garment model missing data-block-id attribute')

					const modelLoaded = onModelLoad(el)
					createEffect(() => {
						if (modelLoaded()) return
						store.addLoadingBlock(blockId)
						onCleanup(() => store.removeLoadingBlock(blockId))
					})
				}
			})

			const modelsInSyncWithRenderBlocks = createMemo(() => {
				if (this.renderBlocks.length !== garmentModels().length) return false
				for (const [i, rb] of this.renderBlocks.entries()) {
					console.log('render block', rb.id)
					if (rb.id !== garmentModels()[i]?.getAttribute('id')) return false
				}
				return true
			})

			const garmentModelLoads = createMemo(() => [...garmentModels()].map(el => onModelLoad(el)))

			const garmentModelsInSyncAndLoaded = createMemo(() => {
				if (!modelsInSyncWithRenderBlocks()) return false
				return garmentModelLoads().every(loaded => loaded())
			})

			const garmentUvArrays = createMemo(() => {
				return [...garmentModels()].map(el => {
					const root = el.three

					// Extract UV data for proper texture scaling
					const meshes = [...meshesInTree(root)]
					return Array.from(meshes[0]?.geometry?.attributes?.uv?.array ?? [])
				})
			})

			createEffect(() => {
				console.log(
					modelsInSyncWithRenderBlocks()
						? '✅ Models in sync with render blocks'
						: '❌ Models NOT in sync with render blocks',
				)
			})

			// Re-apply materials whenever the selected fabrics change or models mount
			createEffect(() => {
				console.log('garments effect')

				if (!garmentModelsInSyncAndLoaded()) return

				// Process each model using its data-blockid to find the correct fabric
				for (const [blockIndex, renderBlock] of this.renderBlocks.entries()) {
					// Use UV data for proper texture scaling (TODO do we still
					// need the relic from the old app?).
					// NOTE! We need to wait for all garment models to load to
					// ensure UVs are ready.  Unfortunately, this currently
					// means fabrics won't start loading until all garments are
					// loaded.
					// TODO get rid of this need for checking uv arrays, have
					// designers set expected texture scale on their end in the
					// upload page, then we can load fabrics in parallel without
					// waiting for garments to load.
					const uvArray = garmentUvArrays()[blockIndex]

					const blockId = renderBlock.id

					// Parse blockId to extract template category, block category, and block ID
					// Format: "TemplateCategory-BlockCategory-BlockId" or "TemplateCategory-BlockCategory-BlockId-mirror"
					const isMirror = blockId.endsWith('-mirror')
					const baseBlockId = isMirror ? blockId.slice(0, -7) : blockId // Remove "-mirror" if present
					const parts = baseBlockId.split('-')

					if (parts.length < 3) {
						console.error('Invalid block ID format:', blockId)
						continue
					}

					if (blockId.startsWith('default-')) continue // Skip default garments, they have built-in fabrics for now

					const templateCategory = parts[1] as TemplateCategory
					const blockCategory = parts[2] as BlockCategory
					const template = store.selectedTemplates[templateCategory]
					const templateId = template?._id
					if (!templateId) throw new Error('Template ID missing for category:' + templateCategory)
					const fabricsForBlockCategory = store.selectedGarments[templateCategory]?.[blockCategory]?.fabrics ?? {}
					console.log('selectedGarments', store.selectedGarments)

					const fabricLoadingSignals: Record<string, ReturnType<typeof createFabricTexture>> = {}

					// Create signals for new fabrics
					// TODO (FIXME?) This is loading state for all fabrics of
					// the template category and block category, but is it the
					// fabrics for the render block we're iterating?
					for (const fabric of Object.values(fabricsForBlockCategory)) {
						const textureState = createFabricTexture(() => fabric, uvArray)
						fabricLoadingSignals[fabric._id] = textureState

						// Track loading state per fabric
						createEffect(() => {
							console.log('fabric loading effect')
							if (!textureState.loading()) return
							store.addLoadingFabric(fabric._id)
							onCleanup(() => store.removeLoadingFabric(fabric._id))
						})
					}

					const fabricsLoaded = createMemo(() =>
						Object.values(fabricLoadingSignals).every(f => !f.loading() && f.texture()),
					)

					const templateBlocks = createMemo(
						() => {
							// prettier-ignore
							console.log( 'templateBlocks', this.renderBlocks.filter(rb => rb.templateCategory === templateCategory),)
							return this.renderBlocks.filter(rb => rb.templateCategory === templateCategory)
						},
						undefined,
						{equals: arrayEquals},
					)

					// CONTINUE It doesn't seem to make sense for this effect to be
					// here because we're iterating *EVERY* render block, and
					// thus we're clearing loading state based on the fabrics of
					// a *single* block, not *all blocks* in the template. Is
					// this right?
					createEffect(() => {
						// Check if all blocks for this template category are loaded
						if (templateBlocks().length === 0)
							throw new Error('No blocks found for template category: ' + templateCategory)

						if (fabricsLoaded()) {
							console.log('✅ CLEARING loading template:', templateId)
							// The fabrics for the block loaded, clear the
							// loading state for the *whole* template
							// CONTINUE Is this right? Template should be done
							// "loading" after all fabrics for all categories
							// are loaded, not only for category of current
							// block.
							store.clearLoadingTemplate(templateId)
						}
					})

					const anyFabricErrors = createMemo(() => Object.values(fabricLoadingSignals).map(f => f.error()))

					createEffect(() => {
						if (anyFabricErrors().some(error => error !== null))
							console.error('Error loading one or more fabrics for block:', blockId)
						for (const error of anyFabricErrors()) if (error) console.error(error)
					})

					// Apply textures reactively as they load
					createEffect(() => {
						if (!fabricsLoaded()) return

						// Create a map for mesh to meshes key
						const meshToFabricMeshesMap = new Map<string, string>()
						for (const meshesKey of Object.keys(fabricsForBlockCategory)) {
							// CONTINUE ensure correct comment here:
							// e.g. "Sleeve_Left-Sleeve_Right" -> ["Sleeve_Left", "Sleeve_Right"]
							const meshArray = meshesKey.split('-')
							for (const mesh of meshArray) meshToFabricMeshesMap.set(mesh, meshesKey)
						}

						const allFabricMeshes = [...meshToFabricMeshesMap.keys()]
						const el = garmentModels()[blockIndex]
						const meshes = [...meshesInTree(el.three)]

						for (const mesh of meshes) {
							// Check if there's a specific fabric assigned to this mesh
							const meshKey = allFabricMeshes.filter(fabricMesh => hasAncestorWithName(mesh, fabricMesh))[0]
							const meshesKey = meshToFabricMeshesMap.get(meshKey)

							const fabricToUse = fabricsForBlockCategory[meshesKey || 'default']
							if (!fabricToUse) continue

							const textureState = fabricLoadingSignals[fabricToUse._id]
							if (!textureState) continue

							const textureSet = textureState.texture()!
							const isLoading = textureState.loading()!

							// These must be true because of fabricsLoaded() check above
							console.assert(textureSet, 'Texture set should be available here')
							console.assert(!isLoading, 'Texture should not be loading here')

							// CONTINUE revisit this to ensure materials/textures
							// are properly disposed.
							// Maybe we don't need to create a new material
							// every time.
							// OLD:
							disposeMaterial(mesh)
							mesh.material = new THREE.MeshPhysicalMaterial()
							textureManager.applyTexturesToMaterial(mesh.material, textureSet)
							onCleanup(() => {
								disposeMaterial(mesh)
								this.#resetMaterialProperties(el, mesh)
								el.needsUpdate()
							})
							// NEW:
							// textureManager.applyTexturesToMaterial(mesh.material, textureSet)
							// onCleanup(() => {
							// 	this.#resetMaterialProperties(el, mesh)
							// 	el.needsUpdate()
							// })
						}

						el.needsUpdate()
					})
				}
			})

			createEffect(() => {
				this.animsEnabled = store.selectedAnimation !== 'none'

				const anim = appAnims.find(val => val.id === store.selectedAnimation)
				if (!anim || !anim.src) return

				this.animName = anim.name
				this.animSrc = new URL(anim.src, import.meta.url).href
			})

			createEffect(() => {
				if (!this.lumeScene) return
				this.lumeScene.glRenderer!.toneMapping = THREE.ACESFilmicToneMapping
			})

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
					this.outlinePass.edgeStrength = 10
					this.outlinePass.edgeGlow = 0
					this.outlinePass.edgeThickness = 4
					this.outlinePass.visibleEdgeColor.set(0x9b59b6) // purple accent
					this.composer.addPass(this.outlinePass)

					// const bloomPass = new BloomPass(1, 25, 4)
					// bloomPass.setSize(size.x, size.y)
					// CONTINUE: use threshold to get bright areas only. Use UnrealBloomPass instead if BloomPass has no threshold.
					// this.composer.addPass(bloomPass)

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
						if (this.outlinePass && store.selectingPiece && this.outlinePass.selectedObjects.length > 0) {
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

					// "default" means all meshes in the garment for the currently selected template only
					const isDefault = selectingPiece === 'default'
					const pieceNames = isDefault ? [] : selectingPiece.split('-')
					const selectedMeshes: THREE.Object3D[] = []

					// Get the template category being edited (from remix overlay)
					const editingTemplateCategory = store.remixOverlayTemplate?.category

					// Process models in chunks to avoid long blocking
					for (const garmentModel of models) {
						if (!garmentModel.three) continue

						// For "default", only outline models belonging to the selected template
						if (isDefault && editingTemplateCategory) {
							const modelId = garmentModel.getAttribute('id') || ''
							// ID format: collection-templateCategory-blockCategory-blockId
							const parts = modelId.split('-')
							const modelTemplateCategory = parts[1] as TemplateCategory | undefined
							if (modelTemplateCategory !== editingTemplateCategory) continue
						}

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

	#handleRigging(el: GltfModel, block: RenderBlock) {
		const modelLoaded = onModelLoad(el)

		createEffect(() => {
			if (!this.avatarModel) return
			const avatarLoaded = onModelLoad(this.avatarModel!)

			createEffect(() => {
				if (!avatarLoaded() || !modelLoaded()) return

				this.#checkRiggedMesh(el)
				this.#checkAccessory(block, el.three)
			})
		})
	}

	override template = () => {
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
					attr:environment=${() => this.scene?.env ?? '/images/envs/brown_photostudio_02.jpg'}
					attr:environment-intensity="0.3"
					oncapture:pointerdown=${this.#handlePointerDown}
					oncapture:pointermove=${this.#handlePointerMove}
					oncapture:pointerup=${this.#handlePointerUp}

				>
					<lume-element3d align-point="0.5 0.5 0.5">
						<lume-ambient-light visible="false" intensity="0.7" color="white"></lume-ambient-light>

						<!-- a sphere to debug/visualize the env map -->
						<lume-sphere visible="${() => store.isAdmin && !store.turnOffSettingsInSpace}" size="0.5 0.5 0.5" color="white" position="-2 -2 0" metalness="1" roughness="0"></lume-sphere>

						<lume-spot-light
							visible="false"
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
							visible="false"
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
							visible="false"
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

						<lume-element3d position="0 0 -2.38">
							<lume-rect-area-light debug="true" size="0.1 3.4 0" color="white" intensity="20" position="3.3 -2.1 0" rotation="0 90 0" mount-point="0.5 0.5 0.5">
								<!-- <lume-plane size-mode="proportional proportional" size="1 1" opacity="0.5" sidedness="back"></lume-plane> -->
							</lume-rect-area-light>

							<lume-rect-area-light debug="true" size="0.1 3.4 0" color="white" intensity="20" position="-3.3 -2.1 0" rotation="0 -90 0" mount-point="0.5 0.5 0.5">
								<!-- <lume-plane size-mode="proportional proportional" size="1 1" opacity="0.5" sidedness="back"></lume-plane> -->
							</lume-rect-area-light>
						</lume-element3d>
						<lume-element3d position="0 0 -7.6">
							<lume-rect-area-light debug="true" size="0.1 3.4 0" color="white" intensity="20" position="2.75 -2.1 0" rotation="0 90 0" mount-point="0.5 0.5 0.5">
								<!-- <lume-plane size-mode="proportional proportional" size="1 1" opacity="0.5" sidedness="back"></lume-plane> -->
							</lume-rect-area-light>

							<lume-rect-area-light debug="true" size="0.1 3.4 0" color="white" intensity="20" position="-2.75 -2.1 0" rotation="0 -90 0" mount-point="0.5 0.5 0.5">
								<!-- <lume-plane size-mode="proportional proportional" size="1 1" opacity="0.5" sidedness="back"></lume-plane> -->
							</lume-rect-area-light>
						</lume-element3d>

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
							ref=${(el: GltfModel) => {
								this.avatarModel = el
								this.avatarSkeleton.setAvatar(el)
								enableShadowOnModelLoad(el)
								setEnvMapOnModelLoad(el, env)
								showSkeletonHelper(el, () => true)
								disableFrustumCulledOnLoad(el)
							}}
							attr:src=${() => avatars.find(avatar => avatar.name === this.selectedAvatar)?.src ?? ''}
							scale="1 1 1"
							data-avatar
						>
							<lume-element3d ref=${(el: Element3D) => setMaterialsVisibleOnModelLoad(el.parentElement as GltfModel, () => store.isShowAvatar, el)}>
								<!-- User-selected garments -->
								<${For} each=${() => this.renderBlocks}>
									${(item: RenderBlock) => html`
										<lume-gltf-model
											ref=${(el: GltfModel) => {
												enableShadowOnModelLoad(el)
												setEnvMapOnModelLoad(el, env)
												disableFrustumCulledOnLoad(el)
												this.#handleRigging(el, item)

												// Track default garment loading
												if (item.id.startsWith('default-')) {
												const defaultGarmentId = Symbol(`default-garment-${item.id}`)
												store.trackModelLoading(defaultGarmentId, el)
												}
											}}
											id=${item.id}
											attr:data-block-id=${() => item.block._id}
											attr:data-block
											attr:data-default=${() => item.id.startsWith('default-')}
											attr:src=${item.block.modelFile}
											scale=${item.id.endsWith('-mirror') ? '-1 1 1' : '1 1 1'}
											visible=${() =>
												!item.id.startsWith('default-') ||
												// Default garments always loaded, visibility toggled
												(item.id.startsWith('default-') &&
													this.#isDefaultGarmentVisible(item.templateCategory, store.selectedTemplates))}
										></lume-gltf-model>
									`}
								</>
							</lume-element3d>

							<lume-animation
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
							console.log('selected background', this.scene?.scene)
							return this.scene?.scene ?? ''
						}}
					></lume-gltf-model>

					<!-- Background scene extra objects -->
					<${Index}
						each=${() => {
							return this.scene?.includedModelFiles ?? []
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

	override css = css/*css*/ `
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
				transform: var(--overrideSceneTranslateY, var(--sceneTranslateY)) scale(var(--scene-scale, 1));
				-webkit-transform: var(--overrideSceneTranslateY, var(--sceneTranslateY)) scale(var(--scene-scale, 1));
				transform-origin: center center;
			}

			lume-scene {
				transform: translateX(0);
				-webkit-transform: translateX(0);
			}
		}
	`
}

function disableFrustumCulledOnLoad(model: GltfModel) {
	whenModelLoaded(model, () => model.three.traverse(child => (child.frustumCulled = false)))
}

// This will cache render blocks by ID. This is a quick fix to make the
// <For> re-use the same objects to avoid reloading GLTF models.
// FIXME this grows and never shrinks.
const renderBlockCache = new Map<string, RenderBlock>()

function getRenderBlock(id: RenderBlockId, block: Block, templateCategory: TemplateCategory) {
	let renderBlock = renderBlockCache.get(id)
	if (!renderBlock) renderBlockCache.set(id, (renderBlock = {block, templateCategory, id}))
	return renderBlock
}
