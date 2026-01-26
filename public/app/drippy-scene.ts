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
	memo,
	effect,
	SpotLight,
} from 'lume'
import type {Accessor} from 'solid-js'
import {createMemo} from 'solid-js'
import * as THREE from 'three'
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js'
import {OutlinePass} from 'three/examples/jsm/postprocessing/OutlinePass.js'
import {OutputPass} from 'three/examples/jsm/postprocessing/OutputPass.js'
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js'
// import {BloomPass} from 'three/examples/jsm/postprocessing/BloomPass.js'
import {UnrealBloomPass} from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import {avatars} from '../consts/avatars.js'

import {backgroundScenes} from '../consts/scenes.js'
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
	values,
	whenModelLoaded,
} from '../utils.js'
import './app-buttons.js'
import {AvatarSkeleton} from './avatar-skeleton.js'
import {store} from './store.js'
import {templateHelpers} from './TemplateHelpers.js'
import {textureManager} from './TextureManager.js'
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

	#docMutations = createMutationsSignal(document.documentElement, {attributes: true, attributeFilter: ['data-theme']})

	// @ts-expect-error TODO use this to implement dark mode
	@memo private get isDark() {
		this.#docMutations()
		return document.documentElement.dataset.theme === 'dark'
	}

	@signal private backgroundModel: GltfModel | null = null
	@signal private avatarModel: GltfModel | null = null
	private avatarSkeleton = new AvatarSkeleton()
	@signal private lumeScene: Scene | null = null

	// When `false`, disable animations and rigging.
	@memo private get animsEnabled() {
		return store.selectedAnimation !== 'none'
	}

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

	// TODO Move to `lume-block`
	/**
	 * Checks if the model is rigged, if so, sets the skeleton to the avatar's.
	 * @param model
	 */
	#adoptAvatarSkeleton(model: GltfModel) {
		if (!this.avatarModel) throw new Error('Avatar model required for rigging.')

		const sourceSkeleton = getArmatureObject(this.avatarModel.three)?.skeleton
		if (!sourceSkeleton) throw new Error('Avatar model has no skeleton for rigging.')

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
	#isGarmentVisible(item: RenderBlock, selectedTemplates: TemplateMap): boolean {
		if (!item.id.startsWith('default-')) return true

		const overriddenBy = templateHelpers.getCategoriesThatOverride(item.templateCategory)

		// If any block is loading in this template category, keep default visible while loading
		if (anyBlockIsLoadingInTemplateCategory(this.renderBlocks, item.templateCategory)) return true
		if (overriddenBy.some(category => anyBlockIsLoadingInTemplateCategory(this.renderBlocks, category))) return true

		// Is this category overridden by another selected category?
		if (selectedTemplates[item.templateCategory]) return false
		return !overriddenBy.some(cat => selectedTemplates[cat])
	}

	#handlePointerDown = (e: PointerEvent) => {
		const isMobile = !isDesktop()

		// Mobile: always enable vertical drag, Desktop: only with shift key
		if (isMobile || e.shiftKey) {
			this.isVerticalPan = true
			if (!isMobile) e.stopImmediatePropagation()
		}
	}

	#handlePointerMove = (e: PointerEvent) => {
		const isMobile = !isDesktop()
		if (!this.isVerticalPan) return
		// Scale the movement - dragging down increases Y (looks up), dragging up decreases Y (looks down)
		this.cameraY -= e.movementY / 1000
		this.cameraY = clamp(this.cameraY, -2, 0)
		if (!isMobile) e.stopImmediatePropagation()
	}

	#handlePointerUp = (e: PointerEvent) => {
		const isMobile = !isDesktop()
		if (this.isVerticalPan && !isMobile) e.stopImmediatePropagation()

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

		for (const templateSelection of values(garmentSelections)) {
			if (!templateSelection) continue
			for (const selection of values(templateSelection)) if (selection?.block) blocks.push(selection.block)
		}

		return [
			...this._defaultRenderBlocks,
			...blocks.flatMap(block => {
				const id: RenderBlockId = `${block.collection?.replace(/-/g, '_')}-${block.templateCategory}-${block.category}-${block._id}`
				const renderBlock = getRenderBlock(id, block, block.templateCategory)

				if (block.category === 'Sleeves') {
					const idMirror: RenderBlockId = `${id}-mirror`
					const renderBlockMirror = getRenderBlock(idMirror, block, block.templateCategory)
					return [renderBlock, renderBlockMirror]
				}

				return renderBlock
			}),
		]
	}

	@memo private get garmentModelsSignal() {
		if (!this.avatarModel) return null
		return querySelectorAllSignal(this.avatarModel, 'lume-gltf-model[data-block]') as Accessor<NodeListOf<GltfModel>>
	}

	@memo private get garmentModels() {
		return this.garmentModelsSignal ? this.garmentModelsSignal() : emptyNodeList<GltfModel>()
	}

	@memo private get extraObjectSignal() {
		if (!this.avatarModel) return null
		return querySelectorAllSignal(this.avatarModel, 'lume-gltf-model.extraObject') as Accessor<NodeListOf<GltfModel>>
	}

	@memo private get extraObjects() {
		return this.extraObjectSignal ? this.extraObjectSignal() : emptyNodeList<GltfModel>()
	}

	// Reset camera to default when space changes
	@effect cameraEffect() {
		const space = this.selectedSpace
		if (!space || !this.cameraRig) return

		this.cameraRig.distance = isDesktop() ? 2.5 : 4
		this.cameraRig.verticalAngle = 0
		this.cameraRig.horizontalAngle = 0
		this.cameraY = -1

		this.cameraRig.needsUpdate()
	}

	@effect backgroundModelEffect() {
		const {backgroundModel} = this
		if (!backgroundModel) return

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

		const sceneId = Symbol('background')
		store.trackModelLoading(sceneId, backgroundModel)
	}

	@signal private documentElementMutations = (() => {
		return createMutationsSignal(document.documentElement, {
			attributes: true,
			attributeFilter: ['class'],
		})
	})()

	// Watch for panel collapse state changes
	@effect panelCollapseEffect() {
		// Trigger reactive update when panel collapse state changes
		this.documentElementMutations()
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

			if (isPanelCollapsed) this.style.setProperty('--sceneTranslateX', 'translateX(0)')
			else if (shouldShiftLeft)
				this.style.setProperty('--sceneTranslateX', 'translateX(calc(-1 * var(--sceneDesktopOffset)))')
			else this.style.setProperty('--sceneTranslateX', 'translateX(var(--sceneDesktopOffset))')
		}
	}

	@effect extraObjectEffect() {
		for (const el of this.extraObjects) disableFrustumCulledOnLoad(el)
	}

	@effect loadingProgressEffect() {
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
					if (loadingCount === 2) this.loadingProgress = 10
					else if (loadingCount === 1) {
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
									if (store.drippySceneLoads.length === 1) this.loadingProgress = progress
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
				} else
					// Reset state even if loader was never shown
					previousCount = -1
			}
		})

		// Cleanup timeouts on component unmount
		onCleanup(() => {
			if (loaderTimeout !== undefined) clearTimeout(loaderTimeout)

			progressTimeouts.forEach(timeoutId => clearTimeout(timeoutId))
		})
	}

	@effect garmentLoadingEffect() {
		for (const el of this.garmentModels) {
			const blockId = el.dataset.blockId
			if (!blockId) throw new Error('Garment model missing data-block-id attribute')

			const modelLoaded = onModelLoad(el)
			createEffect(() => {
				if (modelLoaded()) return
				store.addLoadingBlock(blockId)
				onCleanup(() => store.removeLoadingBlock(blockId))
			})
		}
	}

	@memo get modelsInSyncWithRenderBlocks() {
		if (this.renderBlocks.length === 0 || this.garmentModels.length === 0) return false
		if (this.renderBlocks.length !== this.garmentModels.length) return false
		for (const [i, rb] of this.renderBlocks.entries())
			if (rb.id !== this.garmentModels[i]?.getAttribute('id')) return false
		return true
	}

	@memo get garmentModelLoads() {
		return [...this.garmentModels].map(el => onModelLoad(el))
	}

	@memo get garmentModelsInSyncAndLoaded() {
		if (!this.modelsInSyncWithRenderBlocks) return false
		return this.garmentModelLoads.every(loaded => loaded())
	}

	// Re-apply materials whenever the selected fabrics change or models mount
	@effect fabricsLoadingEffect() {
		if (!this.garmentModelsInSyncAndLoaded) return

		// Process each model using its data-block-id to find the correct fabric
		for (const [blockIndex, renderBlock] of this.renderBlocks.entries()) {
			// CONTINUE we deleted uvArray, so we can freely load fabrics in parallel to garment models

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

			const fabricLoadingSignals: Record<string, ReturnType<typeof createFabricTexture>> = {}

			// Create signals for new fabrics
			// TODO (FIXME?) This is loading state for all fabrics of
			// the template category and block category, but is it the
			// fabrics for the render block we're iterating?
			for (const fabric of values(fabricsForBlockCategory)) {
				const textureState = createFabricTexture(() => fabric)
				fabricLoadingSignals[fabric._id] = textureState

				// Track loading state per fabric
				createEffect(() => {
					if (!textureState.loading()) return
					store.addLoadingFabric(fabric._id)
					onCleanup(() => store.removeLoadingFabric(fabric._id))
				})
			}

			const fabricsLoaded = createMemo(() => values(fabricLoadingSignals).every(f => !f.loading() && f.texture()))

			const templateBlocks = createMemo(
				() => this.renderBlocks.filter(rb => rb.templateCategory === templateCategory),
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
				if (templateBlocks().length === 0) throw new Error('No blocks found for template category: ' + templateCategory)

				if (fabricsLoaded())
					// The fabrics for the block loaded, clear the
					// loading state for the *whole* template
					// CONTINUE Is this right? Template should be done
					// "loading" after all fabrics for all categories
					// are loaded, not only for category of current
					// block.
					store.clearLoadingTemplate(templateId)
			})

			const anyFabricErrors = createMemo(() => values(fabricLoadingSignals).map(f => f.error()))

			createEffect(() => {
				if (anyFabricErrors().some(error => error !== null))
					console.error('Error loading one or more fabrics for block:', blockId)
				for (const error of anyFabricErrors()) if (error) console.error(error)
			})

			// Apply textures reactively as they load
			createEffect(() => {
				if (!fabricsLoaded()) return

				// Create a map for mesh to meshes key
				// FIXME stop using Maps unless they solve a problem such as a static cache or iteration speed
				const meshToFabricMeshesMap = new Map<string, string>()
				for (const meshesKey of Object.keys(fabricsForBlockCategory)) {
					// CONTINUE ensure correct comment here:
					// e.g. "Sleeve_Left-Sleeve_Right" -> ["Sleeve_Left", "Sleeve_Right"]
					const meshArray = meshesKey.split('-')
					for (const mesh of meshArray) meshToFabricMeshesMap.set(mesh, meshesKey)
				}

				const allFabricMeshes = [...meshToFabricMeshesMap.keys()]
				const el = this.garmentModels[blockIndex]
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

					textureManager.applyTexturesToMaterial(mesh.material as THREE.MeshPhysicalMaterial, textureSet)
					el.needsUpdate()
					// skip cleanup so that we keep old fabric visible while loading new one.
					// onCleanup(() => {
					// 	textureManager.clearTexturesFromMaterial(mesh.material as THREE.MeshPhysicalMaterial)
					// 	el.needsUpdate()
					// })
				}

				el.needsUpdate()
			})
		}
	}

	@effect animationEffect() {
		const anim = appAnims.find(val => val.id === store.selectedAnimation)
		if (!anim || !anim.src) return

		this.animName = anim.name
		this.animSrc = new URL(anim.src, import.meta.url).href
	}

	@effect sceneEffects() {
		const lumeScene = this.lumeScene
		if (!lumeScene) return

		createEffect(() => {
			const renderer = lumeScene.glRenderer
			if (!renderer) return

			renderer.toneMapping = THREE.ACESFilmicToneMapping

			const threeScene = lumeScene.three
			const camera = lumeScene.threeCamera

			// Wait for valid size before initializing composer
			const size = new THREE.Vector2()
			renderer.getSize(size)
			if (size.x === 0 || size.y === 0) return

			// Create composer if not exists
			if (!this.composer) {
				this.composer = new EffectComposer(renderer)

				// Set up post-processing for outline effect
				const renderPass = new RenderPass(threeScene, camera)
				this.composer.addPass(renderPass)

				// const bloomPass = new BloomPass(1, 25, 4)
				// bloomPass.setSize(size.x, size.y)
				const bloomPass = new UnrealBloomPass(size, 1.5, 0.4, 0.85)
				this.composer.addPass(bloomPass)

				this.outlinePass = new OutlinePass(size, threeScene, camera)
				this.outlinePass.edgeStrength = 10
				this.outlinePass.edgeGlow = 0
				this.outlinePass.edgeThickness = 4
				this.outlinePass.visibleEdgeColor.set(0x9b59b6) // purple accent
				this.composer.addPass(this.outlinePass)

				const outputPass = new OutputPass()
				this.composer.addPass(outputPass)

				// Store original drawScene
				const originalDrawScene = lumeScene.drawScene.bind(lumeScene)

				// Override the render loop to use composer
				lumeScene.drawScene = () => {
					// Skip if size is invalid
					const currentSize = new THREE.Vector2()
					renderer.getSize(currentSize)
					if (currentSize.x === 0 || currentSize.y === 0) return

					// Only use composer if we have objects to outline AND selectingPiece is set
					if (this.outlinePass && store.selectingPiece && this.outlinePass.selectedObjects.length > 0) {
						// Update cameras to current frame's camera
						const currentCamera = lumeScene.threeCamera!
						if (renderPass) renderPass.camera = currentCamera
						this.outlinePass.renderCamera = currentCamera
						this.composer!.render()
					} else
						// Fall back to original rendering when no outline needed
						originalDrawScene()
				}

				// Handle resize
				const resizeObserver = new ResizeObserver(() => {
					if (!lumeScene || !this.composer) return
					const newSize = new THREE.Vector2()
					renderer.getSize(newSize)
					if (newSize.x > 0 && newSize.y > 0) this.composer.setSize(newSize.x, newSize.y)
				})
				resizeObserver.observe(lumeScene)
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

				const models = this.garmentModels
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

						if (isDefault) selectedMeshes.push(obj)
						else {
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
	}

	@effect avatarModelEffect() {
		const {avatarModel} = this
		if (!avatarModel) return

		// Track selected avatar loading state
		const avatarId = Symbol('avatar')
		store.trackModelLoading(avatarId, avatarModel)

		whenModelLoaded(avatarModel, () => {
			store.showAnimationSelect = !!getArmatureObject(avatarModel.three)
		})
	}

	#handleRigging(el: GltfModel, block: () => RenderBlock) {
		const modelLoaded = onModelLoad(el)

		createEffect(() => {
			if (!this.avatarModel) return
			const avatarLoaded = onModelLoad(this.avatarModel!)

			createEffect(() => {
				if (!avatarLoaded() || !modelLoaded()) return

				this.#adoptAvatarSkeleton(el)
				this.#checkAccessory(block(), el.three)
			})
		})
	}

	@memo private get block0() {
		return this.renderBlocks[0]
	}
	@memo private get block1() {
		return this.renderBlocks[1]
	}
	@memo private get block2() {
		return this.renderBlocks[2]
	}

	override template = () => {
		const shadowBias = -0.0004
		const shadowNormalBias = /*0.005*/ 0
		const shadowMapSize = 2048
		const penumbra = 0.25
		const spotAngle = 30
		const shadowRadius = 6
		const shadowSamples = 8

		return html`
			<show-when
				condition=${() => !pathname().includes('upload-view')}
				content=${() => html`
					<progress-loader is-visible=${() => this.isLoading} progress=${() => this.loadingProgress}></progress-loader>
				`}
			></show-when>

			<show-when
				condition=${() => store.isAdmin && store.showAdminContent}
				content=${() => html`
					<div
						style="
							position: absolute;
							top: 1rem;
							left: 50%;
							z-index: 1000;
							background: transparent;
							border-radius: 8px;
							padding: 6px 8px;
							flex-direction: column;
							gap: 4px;
							width: 150px;
							backdrop-filter: blur(4px);
						"
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
							style="width: 100%; height: 3px; background: #333; border-radius: 2px; outline: none; -webkit-appearance: none; appearance: none;"
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
					ref=${(el: Scene) => {
						this.lumeScene = el
						el.three.environmentIntensity = 0.6
						setTimeout(() => {
							if (el.glRenderer) el.glRenderer.shadowMap.type = THREE.VSMShadowMap
						})
					}}
					id="drippy-scene"
					webgl
					perspective="800"
					physically-correct-lights
					shadow-mode="vsm"
					attr:environment=${() => /*TODO webp: this.scene?.env ??*/ '/images/envs/brown_photostudio_02.jpg'}
					attr:environment-intensity="0.3"
					oncapture:pointerdown=${this.#handlePointerDown}
					oncapture:pointermove=${this.#handlePointerMove}
					oncapture:pointerup=${this.#handlePointerUp}

				>
					<lume-element3d align-point="0.5 0.5 0.5">
						<lume-ambient-light visible="false" intensity="0.7" color="white"></lume-ambient-light>

						<!-- a sphere to debug/visualize the env map -->
						<lume-sphere visible="${() => store.isAdmin && store.showAdminContent}" size="0.5 0.5 0.5" color="white" position="-2 -2 0" metalness="1" roughness="0"></lume-sphere>

						<lume-spot-light
							visible="true"
							target="#avatar"
							position="2 -4.3 2"
							intensity="3"
							ref=${(el: SpotLight) => {
								el.three.shadow.focus = 1
								el.three.shadow.blurSamples = shadowSamples
							}}
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
							ref=${(el: GltfModel) => {
								this.avatarModel = el
								this.avatarSkeleton.setAvatar(el)
								enableShadowOnModelLoad(el)
								setEnvMapOnModelLoad(el, env)
								showSkeletonHelper(el, () => store.isAdmin && store.showAdminContent)
								disableFrustumCulledOnLoad(el)
							}}
							attr:src=${() => avatars.find(avatar => avatar.name === this.selectedAvatar)?.src ?? ''}
							scale="1 1 1"
							data-avatar
						>
							<lume-element3d ref=${(el: Element3D) => setMaterialsVisibleOnModelLoad(el.parentElement as GltfModel, () => store.isShowAvatar, el)}>
								<${() => {
									// Instead of <For> loop here we're hard
									// coding a fixed number of default garment
									// models to avoid a Solid bug with <For>
									// causing effects to stop running (they get
									// cleaned up when the For updates).

									return html`
										<lume-gltf-model
											ref=${(el: GltfModel) => {
												enableShadowOnModelLoad(el)
												setEnvMapOnModelLoad(el, env)
												disableFrustumCulledOnLoad(el)
												this.#handleRigging(el, () => this.block0)

												createEffect(() => {
													// Track default garment loading
													if (this.block0.id.startsWith('default-')) {
														const defaultGarmentId = Symbol(`default-garment-${this.block0.id}`)
														store.trackModelLoading(defaultGarmentId, el)
													}
												})
											}}
											id=${() => this.block0.id}
											attr:data-block-id=${() => this.block0.block._id}
											data-block
											attr:data-default=${() => this.block0.id.startsWith('default-')}
											attr:src=${() => this.block0.block.modelFile}
											scale=${() => (this.block0.id.endsWith('-mirror') ? '-1 1 1' : '1 1 1')}
											visible=${() => this.#isGarmentVisible(this.block0, store.selectedTemplates)}
										></lume-gltf-model>
									`
								}}></>
								<${() => {
									return html`
										<lume-gltf-model
											ref=${(el: GltfModel) => {
												enableShadowOnModelLoad(el)
												setEnvMapOnModelLoad(el, env)
												disableFrustumCulledOnLoad(el)
												this.#handleRigging(el, () => this.block1)

												createEffect(() => {
													// Track default garment loading
													if (this.block1.id.startsWith('default-')) {
														const defaultGarmentId = Symbol(`default-garment-${this.block1.id}`)
														store.trackModelLoading(defaultGarmentId, el)
													}
												})
											}}
											id=${() => this.block1.id}
											attr:data-block-id=${() => this.block1.block._id}
											data-block
											attr:data-default=${() => this.block1.id.startsWith('default-')}
											attr:src=${() => this.block1.block.modelFile}
											scale=${() => (this.block1.id.endsWith('-mirror') ? '-1 1 1' : '1 1 1')}
											visible=${() => this.#isGarmentVisible(this.block1, store.selectedTemplates)}
										></lume-gltf-model>
									`
								}}></>
								<${() => {
									return html`
										<lume-gltf-model
											ref=${(el: GltfModel) => {
												enableShadowOnModelLoad(el)
												setEnvMapOnModelLoad(el, env)
												disableFrustumCulledOnLoad(el)
												this.#handleRigging(el, () => this.block2)

												createEffect(() => {
													// Track default garment loading
													if (this.block2.id.startsWith('default-')) {
														const defaultGarmentId = Symbol(`default-garment-${this.block2.id}`)
														store.trackModelLoading(defaultGarmentId, el)
													}
												})
											}}
											id=${() => this.block2.id}
											attr:data-block-id=${() => this.block2.block._id}
											data-block
											attr:data-default=${() => this.block2.id.startsWith('default-')}
											attr:src=${() => this.block2.block.modelFile}
											scale=${() => (this.block2.id.endsWith('-mirror') ? '-1 1 1' : '1 1 1')}
											visible=${() => this.#isGarmentVisible(this.block2, store.selectedTemplates)}
										></lume-gltf-model>
									`
								}}></>


								<${For} each=${() => this.renderBlocks.slice(3)}>
									${(item: RenderBlock) => html`
										<lume-gltf-model
											ref=${(el: GltfModel) => {
												enableShadowOnModelLoad(el)
												setEnvMapOnModelLoad(el, env)
												disableFrustumCulledOnLoad(el)
												this.#handleRigging(el, () => item)

												// Track default garment loading
												if (item.id.startsWith('default-')) {
													const defaultGarmentId = Symbol(`default-garment-${item.id}`)
													store.trackModelLoading(defaultGarmentId, el)
												}
											}}
											id=${item.id}
											attr:data-block-id=${() => item.block._id}
											data-block
											attr:data-default=${() => item.id.startsWith('default-')}
											attr:src=${item.block.modelFile}
											scale=${item.id.endsWith('-mirror') ? '-1 1 1' : '1 1 1'}
											visible=${() => this.#isGarmentVisible(item, store.selectedTemplates)}
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
						attr:src=${() => this.scene?.scene ?? ''}
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

	override css = css /*css*/ `
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

function anyBlockIsLoadingInTemplateCategory(renderBlocks: RenderBlock[], templateCategory: TemplateCategory) {
	for (const rb of renderBlocks) {
		if (rb.templateCategory !== templateCategory) continue
		if (store.isBlockLoading(rb.block._id)) return true
	}
	return false
}

/** Returns an empty NodeList (`new NodeList` is not possible). */
function emptyNodeList<T extends Element>() {
	// select nothing with random selector
	const emptySelector = '.__empty__' + Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)
	return document.querySelectorAll(emptySelector) as NodeListOf<T>
}

// <${For} each=${() => this.renderBlocks}>
// 	${(item: RenderBlock) => html`
// 		<lume-gltf-model
// 			ref=${(el: GltfModel) => {
// 				enableShadowOnModelLoad(el)
// 				setEnvMapOnModelLoad(el, env)
// 				disableFrustumCulledOnLoad(el)
// 				this.#handleRigging(el, item)

// 				// Track default garment loading
// 				if (item.id.startsWith('default-')) {
// 					const defaultGarmentId = Symbol(`default-garment-${item.id}`)
// 					store.trackModelLoading(defaultGarmentId, el)
// 				}
// 			}}
// 			id=${item.id}
// 			attr:data-block-id=${() => item.block._id}
// 			data-block
// 			attr:data-default=${() => item.id.startsWith('default-')}
// 			attr:src=${item.block.modelFile}
// 			scale=${item.id.endsWith('-mirror') ? '-1 1 1' : '1 1 1'}
// 			visible=${() => this.#isGarmentVisible(item, store.selectedTemplates)}
// 		></lume-gltf-model>
// 	`}
// </>
