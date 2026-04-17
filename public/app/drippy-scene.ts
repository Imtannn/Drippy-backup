import '../elements/logic/show-when.js'
import '../elements/lume-animation.js'
import '../elements/progress-loader.js'

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
	type Sphere,
} from 'lume'
import type {Accessor} from 'solid-js'
import {batch, createMemo} from 'solid-js'
import * as THREE from 'three'
import {RGBELoader} from 'three/examples/jsm/loaders/RGBELoader.js'
import {avatars} from '../consts/avatars.js'

import {backgroundScenes} from '../consts/scenes.js'
import {animations} from '../consts/poses.js'
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
	isMesh,
	materialsOfRenderable,
	meshesInTree,
	onModelLoad,
	querySelectorAllSignal,
	setEnvMapOnModelLoad,
	setMaterialsVisibleOnModelLoad,
	showSkeletonHelper,
	values,
	whenModelLoaded,
} from '../utils.js'
import {AvatarSkeleton} from './avatar-skeleton.js'
import {isCoveredByOuterGarment, SLOT_PRIORITY} from './clothing-slots.js'
import {isAdmin, store} from './store.js'
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

const defaultRenderBlocks: RenderBlock[] = blocks()
	.filter(block => block.collection === 'default')
	.map(block => {
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
	static override readonly elementName = 'drippy-scene'

	@attribute selectedSpace: Space | null = null
	@attribute selectedAvatar: string | null = null
	@attribute selectedGarments: SelectedGarments = {}
	@attribute landing: boolean = false

	#docMutations = createMutationsSignal(document.documentElement, {attributes: true, attributeFilter: ['data-theme']})

	/** True on phones/tablets — used to scale down render quality for performance. */
	private get isMobile(): boolean {
		return window.matchMedia('(max-width: 768px)').matches || ('ontouchstart' in window && window.innerWidth < 1024)
	}

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
		return store.animationsEnabled
	}

	@signal private animName: string | null = null
	@signal private animSrc: string | null = null
	@signal private animTrimStart = 0

	@signal private loadingProgress = 0
	@signal private isLoading = true

	// Camera rig drag state
	@signal private cameraY = -1
	@signal private cameraRigInteractive = true
	@signal private isVerticalPan = false
	@signal private cameraRig: CameraRig | null = null

	@memo get scene() {
		const defaultSceneSlug = getSpaceDefaultScene(this.selectedSpace)
		return getSceneBySlug(backgroundScenes(), defaultSceneSlug)
	}

	// Persist the last valid scene src so navigating to home (selectedSpace=null)
	// doesn't set src="" which causes the model to reload and get stuck loading.
	@signal private _lastSceneSrc = ''

	@effect persistSceneSrc() {
		const src = this.scene?.scene
		if (src) this._lastSceneSrc = src
	}

	// TODO this is a temporary hack. Scenes should have specific features saved in the DB once we migrate to DB.
	@memo private get isDamagedWallScene() {
		return !!this.scene?.scene.includes('Damaged%20wall')
	}
	// TODO this is a temporary hack. Scenes should have specific features saved in the DB once we migrate to DB.
	@memo private get isDrippyShop() {
		return this.selectedSpace?.slug === 'drippy-shop'
	}
	// TODO this is a temporary hack. Scenes should have specific features saved in the DB once we migrate to DB.
	@memo private get isMetamorphosis() {
		return this.selectedSpace?.slug === 'metamorphosis'
	}
	// TODO this is a temporary hack. Scenes should have specific features saved in the DB once we migrate to DB.
	@memo private get isHM() {
		return this.selectedSpace?.slug === 'h&m'
	}



	// TODO Move to `lume-block`
	/**
	 * Checks if the model is rigged, if so, sets the skeleton to the avatar's.
	 * @param model
	 */
	#adoptAvatarSkeleton(model: GltfModel) {
		if (!this.avatarModel) throw new Error('Avatar model required for rigging.')

		const sourceSkeleton = getArmatureObject(this.avatarModel.three)?.skeleton
		if (!sourceSkeleton) throw new Error('Avatar model has no skeleton for rigging.')

		model.three.traverse((obj: THREE.Object3D) => {
			if ('skeleton' in obj && obj.skeleton) obj.skeleton = sourceSkeleton
		})
	}

	// TODO Move to `lume-block`
	/**
	 * Checks if the block is an accessory, and if so, creates an appropriate bone target.
	 * @param block
	 * @param obj
	 */
	#syncAccessoryWithSkeleton(block: RenderBlock, obj: THREE.Object3D) {
		if (block.block.category !== 'Accessory') return

		this.avatarSkeleton.createBoneTarget(obj, 'Left_HandIndex_Tip')
	}

	/** Check if a garment should be visible based on user selections and outer garment masking */
	#isGarmentVisible(item: RenderBlock, selectedTemplates: TemplateMap): boolean {
		if (!item.id.startsWith('default-')) {
			// Keep non-default blocks hidden while any block of the same template
			// category is still loading, so garments appear as one complete set
			// (bodice/sleeves/etc) instead of popping in one by one.
			if (anyBlockIsLoadingInTemplateCategory(this.renderBlocks, item.templateCategory)) return false

			// Hide non-default garment pieces covered by a higher-priority outer garment
			return !isCoveredByOuterGarment(item.block.category, item.templateCategory, selectedTemplates)
		}

		const overriddenBy = templateHelpers.getCategoriesThatOverride(item.templateCategory)

		// If any block is loading in this template category, keep default visible while loading
		if (anyBlockIsLoadingInTemplateCategory(this.renderBlocks, item.templateCategory)) return true
		if (overriddenBy.some(category => anyBlockIsLoadingInTemplateCategory(this.renderBlocks, category))) return true

		// Is this category overridden by another selected category?
		if (selectedTemplates[item.templateCategory]) return false
		return !overriddenBy.some(cat => selectedTemplates[cat])
	}

	#handlePointerDown = (_e: PointerEvent) => {
		this.isVerticalPan = true
	}

	#handlePointerMove = (e: PointerEvent) => {
		if (!this.isVerticalPan) return
		this.cameraY -= e.movementY / 200
		this.cameraY = clamp(this.cameraY, -2, 0)
	}

	#handlePointerUp = (_e: PointerEvent) => {
		this.isVerticalPan = false
	}

	#onHiddenItemsClick = () => {
		document.dispatchEvent(new CustomEvent('open-hidden-items'))
	}

	@memo private get avatar() {
		return avatars().find(a => a.name === this.selectedAvatar)
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

	// Reset camera to default when space changes or re-center is requested
	@effect cameraEffect() {
		store.cameraResetTick // reactive dependency for re-center button
		const space = this.selectedSpace
		if (!this.cameraRig) return
		if (!space && !store.cameraResetTick) return

		this.cameraRig.distance = isDesktop() ? 2.5 : 4
		this.cameraRig.verticalAngle = 0
		this.cameraRig.horizontalAngle = 0
		this.cameraY = -1

		this.cameraRig.needsUpdate()
	}

	@effect backgroundModelEffect() {
		const {backgroundModel} = this
		if (!backgroundModel) return

		enableFrontsideOnModelLoad(backgroundModel)
		if (!this.isMobile) enableShadowOnModelLoad(backgroundModel)
		// setEnvMapOnModelLoad(backgroundModel, env)
		setMaterialsVisibleOnModelLoad(backgroundModel, () => store.isShowScene)
		whenModelLoaded(backgroundModel, () => {
			// Apply space-specific material adjustments
			if (this.isDrippyShop) {
				// Darken Drippy Shop scene materials for its moody aesthetic
				backgroundModel.three.traverse(obj => {
					if (!isMesh(obj)) return
					const isLogo = obj.parent?.name.includes('Drippy_Shop_-_Logo') || obj.name === 'Pattern_21273'
					if (isLogo) return
					for (const mat of materialsOfRenderable(obj) as Generator<THREE.MeshStandardMaterial>) {
						mat.color.multiplyScalar(0.05)
						mat.needsUpdate = true
					}
				})
			} else if (this.isMetamorphosis) {
				// Metamorphosis: bright white-silver, slightly cool, metallic
				backgroundModel.three.traverse(obj => {
					if (!isMesh(obj)) return
					const isLogo =
						obj.name.toLowerCase().includes('logo') ||
						obj.parent?.name.toLowerCase().includes('logo') ||
						obj.name.toLowerCase().includes('oofya')
					if (isLogo) {
						// Keep the Oofya logo black
						for (const mat of materialsOfRenderable(obj) as Generator<THREE.MeshStandardMaterial>) {
							mat.color.set('#000000')
							mat.metalness = 0
							mat.roughness = 0.8
							mat.needsUpdate = true
						}
						return
					}
					for (const mat of materialsOfRenderable(obj) as Generator<THREE.MeshStandardMaterial>) {
						// Chrome: near-mirror metal, minimal color influence
						mat.color.lerp(new THREE.Color(0.9, 0.92, 0.95), 0.85)
						// Full metalness, near-zero roughness for mirror reflections
						mat.metalness = 0.3
						mat.roughness = 0.15
						mat.needsUpdate = true
					}
				})
			} else if (this.isHM) {
				// H&M: concrete walls, everything else untouched
				backgroundModel.three.traverse(obj => {
					if (!isMesh(obj)) return
					const name = (obj.name + ' ' + (obj.parent?.name ?? '')).toLowerCase()
					const isWall = name.includes('wall') || name.includes('ceiling') || name.includes('floor') || name.includes('ground')
					if (!isWall) return
					for (const mat of materialsOfRenderable(obj) as Generator<THREE.MeshStandardMaterial>) {
						mat.color.lerp(new THREE.Color(0.42, 0.40, 0.38), 0.55)
						mat.metalness = 0
						mat.roughness = 0.92
						mat.needsUpdate = true
					}
				})
			}

			backgroundModel.three.traverse(obj => {
				obj.castShadow = true

				// If an artist forgot to convert baked materials back into PBR
				// materials, fix it, so that our dynamic lights will have
				// effect on objects with those materials.
				if (isMesh(obj)) {
					function copyMapsToPhysical(mat: THREE.Material) {
						if (mat instanceof THREE.MeshStandardMaterial) return mat
						console.warn('found non-PBR material')
						const newMat = new THREE.MeshPhysicalMaterial()
						for (const key of Object.keys(mat)) {
							// @ts-expect-error too dymamic for TS, but this is valid
							if (key === 'map' || key.endsWith('Map')) newMat[key] = mat[key]
						}
						return newMat
					}
					if (Array.isArray(obj.material)) {
						const newMats = []
						for (const mat of materialsOfRenderable(obj)) newMats.push(copyMapsToPhysical(mat))
						obj.material = newMats
					} else obj.material = copyMapsToPhysical(obj.material)
				}

				if (this.isDamagedWallScene) {
					if (isMesh(obj)) {
						for (const mat of materialsOfRenderable(obj) as Generator<THREE.MeshStandardMaterial>) {
							mat.envMap = new THREE.TextureLoader().load(this.scene?.env ?? '/images/envs/brown_photostudio_02.jpg')
							mat.envMap.mapping = THREE.EquirectangularReflectionMapping
							mat.envMap.colorSpace = THREE.SRGBColorSpace
							mat.envMapRotation = new THREE.Euler(0, Math.PI / 2, 0)
							createEffect(() => {
								mat.envMapIntensity = 30 * this.#overallEnvIntensity
								if (obj.name === 'MatShape_1988') mat.envMapIntensity *= 3
								if (obj.name === 'Plane') mat.envMapIntensity *= 3
							})
						}
					}
				}

				if (this.isDrippyShop) {
					// Fluid chrome logo — highly reflective, iridescent metal
					if ((obj.parent?.name.includes('Drippy_Shop_-_Logo') || obj.name === 'Pattern_21273') && isMesh(obj)) {
						const fluidMat = new THREE.MeshPhysicalMaterial()
						fluidMat.map = null
						fluidMat.color.set('#ffffff')
						fluidMat.metalness = 1.0
						fluidMat.roughness = 0.02
						fluidMat.iridescence = 1.0
						fluidMat.iridescenceIOR = 1.8
						fluidMat.iridescenceThicknessRange = [200, 600]
						fluidMat.needsUpdate = true
						obj.material = fluidMat
					}
				}
			})
		})

		const sceneId = Symbol('background')
		store.trackModelLoading(sceneId, backgroundModel)
	}

	@signal private documentElementMutations = createMutationsSignal(document.documentElement, {
		attributes: true,
		attributeFilter: ['class'],
	})

	// Watch for panel collapse state changes
	@effect panelCollapseEffect() {
		// Trigger reactive update when panel collapse state changes
		this.documentElementMutations()
		const isPanelCollapsed = document.documentElement.classList.contains('panel-collapsed')

		if (store.view === 'preview') {
			// Ensure in preview mode when no UI is shown, the scene is centered
			// full window.
			this.style.setProperty('--sceneTranslateX', '0')
			this.style.setProperty('--sceneTranslateY', '0')
		} else {
			this.style.setProperty('--sceneTranslateY', '-100px')

			const shouldShiftLeft =
				store.view === 'order' ||
				store.view === 'order-items' ||
				store.view === 'order-size' ||
				store.view === 'custom-measurement' ||
				store.view === 'success' ||
				store.view === 'share' ||
				store.view === 'template'

			if (isPanelCollapsed) this.style.setProperty('--sceneTranslateX', '0')
			else if (shouldShiftLeft) this.style.setProperty('--sceneTranslateX', 'calc(-1 * var(--sceneDesktopOffset))')
			else this.style.setProperty('--sceneTranslateX', 'var(--sceneDesktopOffset)')
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
				// TODO remove this AI timeout junk
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

	// #fabricsLoading = Symbol()

	// Re-apply materials whenever the selected fabrics change or models mount
	@effect fabricsLoadingEffect() {
		if (!this.garmentModelsInSyncAndLoaded) return

		// TODO track fabrics loading for the scene loading screen.
		// store.addIsDrippySceneLoading(this.#fabricsLoading)
		// onCleanup(() => store.removeIsDrippySceneLoading(this.#fabricsLoading))

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

				// store.removeIsDrippySceneLoading(this.#fabricsLoading)

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
					console.assert(!!textureSet, 'Texture set should be available here')
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

	// #animationLoading = Symbol()
	#firstAnimLoaded = false

	@effect animationEffect() {
		if (!store.selectedAnimation) return

		const gender = this.avatarGender
		const anims = gender === 'male' ? animations.male : animations.female
		const anim = anims.find(a => a.value === store.selectedAnimation)

		if (!anim?.src) return

		// Track only the first animation load, so we don't pop up the loading
		// screen each time.
		if (!this.#firstAnimLoaded) {
			this.#firstAnimLoaded = true
			// TODO animation load tracking
			// store.addIsDrippySceneLoading(this.#animationLoading)
			// onCleanup(() => store.removeIsDrippySceneLoading(this.#animationLoading))
		}

		this.animName = anim.clipName
		this.animSrc = new URL(anim.src, import.meta.url).href
		this.animTrimStart = anim.trimStart ?? 0

		// FIXME small hack: fetch triggers initial animation asset warm-up.
		// Make lume-animation provide a loading signal or event instead.
		void fetch(this.animSrc)
	}

	@effect animationAutoplayEffect() {
		if (!store.autoplayAnimations || !store.animationsEnabled) return

		const gender = this.avatarGender
		const anims = gender === 'male' ? animations.male : animations.female
		if (anims.length === 0) return

		const advance = () => {
			const currentIndex = anims.findIndex(a => a.value === store.selectedAnimation)
			const nextIndex = (currentIndex + 1) % anims.length
			store.selectedAnimation = anims[nextIndex]!.value
		}

		const id = window.setInterval(advance, 20000)
		onCleanup(() => window.clearInterval(id))
	}

	#musicCtx: AudioContext | null = null
	#musicScheduler: ReturnType<typeof setInterval> | null = null

	startBackgroundMusic() {
		if (this.#musicCtx) return
		const ctx = new AudioContext()
		this.#musicCtx = ctx
		void ctx.resume()

		const master = ctx.createGain()
		master.gain.value = 0.4
		master.connect(ctx.destination)

		const bpm = 78
		const beat = 60 / bpm
		const bar = beat * 4

		// Low drone — always-on bass rumble with slow LFO wobble
		const drone = ctx.createOscillator()
		const droneGain = ctx.createGain()
		const droneFilter = ctx.createBiquadFilter()
		drone.type = 'sawtooth'
		drone.frequency.value = 55 // A1
		droneFilter.type = 'lowpass'
		droneFilter.frequency.value = 120
		droneGain.gain.value = 0.5
		const lfo = ctx.createOscillator()
		const lfoGain = ctx.createGain()
		lfo.frequency.value = 0.2
		lfoGain.gain.value = 8
		lfo.connect(lfoGain).connect(drone.frequency)
		drone.connect(droneFilter).connect(droneGain).connect(master)
		drone.start()
		lfo.start()

		// Schedule each bar: bass stab + pad chord + kick
		const scheduleBar = (t: number) => {
			// Bass stabs — A minor pattern: A2 A2 G2 E2
			const bassNotes = [110, 110, 98, 82.4]
			bassNotes.forEach((freq, i) => {
				const osc = ctx.createOscillator()
				const filt = ctx.createBiquadFilter()
				const g = ctx.createGain()
				osc.type = 'sawtooth'
				osc.frequency.value = freq
				filt.type = 'lowpass'
				filt.frequency.value = 400
				const nt = t + i * beat
				g.gain.setValueAtTime(0, nt)
				g.gain.linearRampToValueAtTime(0.35, nt + 0.02)
				g.gain.exponentialRampToValueAtTime(0.001, nt + beat * 0.75)
				osc.connect(filt).connect(g).connect(master)
				osc.start(nt); osc.stop(nt + beat)
			})

			// Pad — A minor chord (A3 C4 E4) slow attack/release over whole bar
			;[220, 261.6, 329.6, 440].forEach((freq, i) => {
				const osc = ctx.createOscillator()
				const g = ctx.createGain()
				osc.type = 'sine'
				osc.frequency.value = freq * (1 + (i % 2 === 0 ? 0.002 : -0.002))
				g.gain.setValueAtTime(0, t)
				g.gain.linearRampToValueAtTime(0.06, t + bar * 0.3)
				g.gain.setValueAtTime(0.06, t + bar * 0.7)
				g.gain.linearRampToValueAtTime(0, t + bar + 0.05)
				osc.connect(g).connect(master)
				osc.start(t); osc.stop(t + bar + 0.1)
			})

			// Kick — subtle low thump on beat 1 and 3
			;[0, beat * 2].forEach(offset => {
				const osc = ctx.createOscillator()
				const g = ctx.createGain()
				osc.type = 'sine'
				osc.frequency.setValueAtTime(160, t + offset)
				osc.frequency.exponentialRampToValueAtTime(40, t + offset + 0.08)
				g.gain.setValueAtTime(0.5, t + offset)
				g.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.15)
				osc.connect(g).connect(master)
				osc.start(t + offset); osc.stop(t + offset + 0.2)
			})
		}

		// Web Audio lookahead scheduler
		let nextBar = ctx.currentTime + 0.1
		scheduleBar(nextBar)
		nextBar += bar

		this.#musicScheduler = setInterval(() => {
			while (nextBar < ctx.currentTime + bar * 2) {
				scheduleBar(nextBar)
				nextBar += bar
			}
		}, bar * 500)
	}

	stopBackgroundMusic() {
		if (this.#musicScheduler) clearInterval(this.#musicScheduler)
		this.#musicCtx?.close()
		this.#musicCtx = null
		this.#musicScheduler = null
	}

	@signal accessor #overallEnvIntensity = 1
	@signal accessor #spotLightIntensity = 5
	/** in degrees. */
	@signal accessor #spotLightHorizontalRotation = 72
	/** in degrees. 90 is directly overhead. */
	@signal accessor #spotLightVerticalRotation = 72
	@signal accessor #spotLightDistance = 3.2
	@signal accessor #spotLightPenumbra = 0.15
	/** in degrees */
	@signal accessor #spotLightAngle = 40
	/** A reference to the renderer used for the Lume scene. It will be null until the Lume scene has loaded and instantiated it. */
	@signal accessor #glRenderer: THREE.WebGLRenderer | null = null

	@effect autoStartMusic() {
		if (!this.isDrippyShop) return
		onCleanup(() => {
			this.stopBackgroundMusic()
		})
	}

	@effect syncBackgroundMusic() {
		if (!this.isDrippyShop) {
			this.stopBackgroundMusic()
			return
		}

		if (store.backgroundMusicEnabled) this.startBackgroundMusic()
		else this.stopBackgroundMusic()
	}

	@effect grabRenderer() {
		const lumeScene = this.lumeScene
		if (!lumeScene) return null

		if (!lumeScene.glRenderer) return null
		// lumeScene.glRenderer is not reactive, but will be available after a timeout.
		// FIXME make lume's renderer glRenderer a signal so we don't need a timeout hack in this consumer code.
		setTimeout(() => (this.#glRenderer = lumeScene.glRenderer!))
	}

	@effect updateEnvIntensity() {
		const lumeScene = this.lumeScene
		if (!lumeScene) return
		lumeScene.three.environmentIntensity = this.#overallEnvIntensity * (this.isHM ? 0.65 : 1)
		lumeScene.needsUpdate()
	}

	@effect loadHdrEnvironment() {
		const lumeScene = this.lumeScene
		const renderer = this.#glRenderer
		if (!lumeScene || !renderer) return

		if (this.isMobile) {
			// Reuse the already-loaded env texture instead of fetching the same file twice
			const texture = this.#envTexture
			if (!texture) return // re-runs reactively once #envTexture is set
			texture.mapping = THREE.EquirectangularReflectionMapping
			texture.colorSpace = THREE.SRGBColorSpace
			const pmrem = new THREE.PMREMGenerator(renderer)
			lumeScene.three.environment = pmrem.fromEquirectangular(texture).texture
			pmrem.dispose()
			lumeScene.needsUpdate()
			return
		}

		const pmremGenerator = new THREE.PMREMGenerator(renderer)
		pmremGenerator.compileEquirectangularShader()

		new RGBELoader().load('/images/envs/studio_small_08_1k.hdr', texture => {
			const envMap = pmremGenerator.fromEquirectangular(texture).texture
			pmremGenerator.dispose()
			texture.dispose()

			lumeScene.three.environment = envMap
			lumeScene.needsUpdate()
		})
	}

	@effect setShadowType() {
		if (!this.#glRenderer) return
		this.#glRenderer.shadowMap.type = THREE.PCFSoftShadowMap
	}

	@effect postprocessing() {
		const renderer = this.#glRenderer
		const lumeScene = this.lumeScene
		if (!renderer || !lumeScene) return

		renderer.toneMapping = THREE.ACESFilmicToneMapping
		renderer.toneMappingExposure = 0.85
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.isMobile ? 1.5 : 2))
	}

	@effect avatarModelEffect() {
		const {avatarModel} = this
		if (!avatarModel) return

		// Show the loading screen only on the initial avatar load, not on
		// subsequent avatar switches (the user shouldn't see a full loading
		// screen just because they picked a different avatar).
		const avatarId = Symbol('avatar')
		const modelLoaded = onModelLoad(avatarModel)
		let hasLoadedOnce = false
		createEffect(() => {
			if (modelLoaded()) {
				hasLoadedOnce = true
				return
			}
			if (hasLoadedOnce) return
			store.addIsDrippySceneLoading(avatarId)
			onCleanup(() => store.removeIsDrippySceneLoading(avatarId))
		})

		whenModelLoaded(avatarModel, () => {
			store.showAnimationSelect = !!getArmatureObject(avatarModel.three)
		})
	}

	@signal accessor #envTexture: THREE.Texture | null = null
	@signal accessor #envTexturePromise = new THREE.TextureLoader().loadAsync(env)
	#envTextureLoading = Symbol()

	@effect setEnvTexture() {
		store.addIsDrippySceneLoading(this.#envTextureLoading)
		onCleanup(() => store.removeIsDrippySceneLoading(this.#envTextureLoading))

		let cleaned = false
		onCleanup(() => (cleaned = true))

		this.#envTexturePromise.then(tex => {
			if (cleaned) return
			batch(() => {
				store.removeIsDrippySceneLoading(this.#envTextureLoading)
				this.#envTexture = tex
			})
		})
	}

	#handleBlockModel(el: GltfModel, block: () => RenderBlock) {
		enableShadowOnModelLoad(el)
		setEnvMapOnModelLoad(
			el,
			() => this.#envTexture,
			() => this.#overallEnvIntensity * 1.8,
		)
		disableFrustumCulledOnLoad(el)

		createEffect(() => {
			// Track default garment loading
			if (block().id.startsWith('default-')) {
				const defaultGarmentId = Symbol(`default-garment-${block().id}`)
				store.trackModelLoading(defaultGarmentId, el)
			}
		})

		whenModelLoaded(el, () => {
			createEffect(() => {
				if (!this.avatarModel) return
				const avatarLoaded = onModelLoad(this.avatarModel!)

				createEffect(() => {
					if (!avatarLoaded()) return

					this.#adoptAvatarSkeleton(el)
					this.#syncAccessoryWithSkeleton(block(), el.three)
				})
			})

			// Priority determines both polygon offset and render order.
			// Lower priority number = outer layer = more aggressive depth offset = higher renderOrder.
			// Pants/Skirt (3) → offset -1, renderOrder 1
			// Shirt/Top   (2) → offset -2, renderOrder 2  ← wins over bottoms at waist
			// Jacket etc  (1) → offset -3, renderOrder 3  ← wins over everything
			const priority = SLOT_PRIORITY[block().templateCategory]
			const polygonOffsetFactor = priority !== undefined ? -(4 - priority) : 0
			const renderOrder = priority !== undefined ? 4 - priority : 0
			const hasJacketSelected = Boolean(store.selectedTemplates.Jacket)
			const hasLowerOuterwearSelected = Boolean(
				store.selectedTemplates.Skirt || store.selectedTemplates.Dress || store.selectedTemplates.Jumpsuit,
			)

			el.three.traverse(obj => {
				if (!isMesh(obj)) return

				const material = obj.material

				if (Array.isArray(material)) throw new Error('blocks with multi materials not yet supported.')
				if (!(material instanceof THREE.MeshStandardMaterial))
					throw new Error('only blocks with standard PBR materials supported')

				material.transparent = true
				material.side = THREE.DoubleSide

				const maps = [material.map, material.normalMap, material.roughnessMap, material.metalnessMap, material.aoMap]
				for (const map of maps) if (map) map.anisotropy = 4

				if (polygonOffsetFactor !== 0) {
					material.polygonOffset = true
					material.polygonOffsetFactor = polygonOffsetFactor
					material.polygonOffsetUnits = polygonOffsetFactor * 4
				}

				const cat = block().templateCategory
				const isInnerLayerUnderJacket = cat === 'Top' || cat === 'Shirt' || cat === 'Dress' || cat === 'Jumpsuit'

				// Pants and Skirt don't write to the depth buffer so that upper-body
				// garments (Top, Shirt) always composite on top at the waist overlap.
				// The avatar body still provides the depth wall for background occlusion.
				if (cat === 'Pants' || cat === 'Skirt') material.depthWrite = false

				// Stage-1 jacket overlap fix: when jacket is equipped, let inner upper-body
				// layers avoid depth writes and render just behind jacket to reduce flicker.
				if (hasJacketSelected && isInnerLayerUnderJacket) {
					// Category-specific depth bias: dresses/jumpsuits usually share more surface
					// area with jackets, so they get a stronger bias than tops/shirts.
					const jacketOverlapOffsetByCategory: Partial<Record<TemplateCategory, number>> = {
						Top: -2.2,
						Shirt: -2.2,
						Dress: -3.2,
						Jumpsuit: -3.2,
					}
					const overlapOffset = jacketOverlapOffsetByCategory[cat] ?? -2.5

					material.depthWrite = false
					material.polygonOffset = true
					material.polygonOffsetFactor = Math.min(material.polygonOffsetFactor ?? 0, overlapOffset)
					material.polygonOffsetUnits = (material.polygonOffsetFactor ?? overlapOffset) * 4
					obj.renderOrder = Math.max(0, renderOrder - 1)
					return
				}

				// Stage-1 skirt/dress vs shoes fix: when lower outerwear is equipped,
				// push shoes slightly behind to reduce hem intersection flicker.
				if (hasLowerOuterwearSelected && cat === 'Shoes') {
					material.depthWrite = false
					material.polygonOffset = true
					const shoesUnderHemOffset = -0.9
					material.polygonOffsetFactor = Math.max(material.polygonOffsetFactor ?? 0, shoesUnderHemOffset)
					material.polygonOffsetUnits = (material.polygonOffsetFactor ?? shoesUnderHemOffset) * 4
					obj.renderOrder = Math.max(0, renderOrder - 3)
					return
				}

				obj.renderOrder = renderOrder


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
		const shadowMapSize = this.isMobile ? 512 : 2048
		const shadowRadius = this.isMobile ? 3 : 4
		const shadowSamples = this.isMobile ? 8 : 16

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
					<div id="debugUi">
						<div>
							<p>Environment Intensity (${() => this.#overallEnvIntensity})</p>

							<input
								id="envIntensity"
								type="range"
								min="0"
								max="3"
								step="0.01"
								prop:value=${() => this.#overallEnvIntensity}
								oninput=${(e: Event) => (this.#overallEnvIntensity = Number((e.target as HTMLInputElement).value) || 0)}
							/>
						</div>

						<div>
							<p>Spotlight intensity (${() => this.#spotLightIntensity})</p>

							<input
								id="spotLightIntensity"
								type="range"
								min="0"
								max="30"
								step="0.01"
								prop:value=${() => this.#spotLightIntensity}
								oninput=${(e: Event) => (this.#spotLightIntensity = Number((e.target as HTMLInputElement).value) || 0)}
							/>
						</div>

						<div>
							<p>Spotlight horizontal rotation (${() => this.#spotLightHorizontalRotation})</p>

							<input
								id="spotLightHorizontalRotation"
								type="range"
								min="0"
								max="360"
								step="0.01"
								prop:value=${() => this.#spotLightHorizontalRotation}
								oninput=${(e: Event) =>
									(this.#spotLightHorizontalRotation = Number((e.target as HTMLInputElement).value) || 0)}
							/>
						</div>

						<div>
							<p>Spotlight vertical rotation (${() => this.#spotLightVerticalRotation})</p>

							<input
								id="spotLightVerticalRotation"
								type="range"
								min="0"
								max="${'90' /*90 is straight up above, the light will look down*/}"
								step="0.01"
								prop:value=${() => this.#spotLightVerticalRotation}
								oninput=${(e: Event) =>
									(this.#spotLightVerticalRotation = Number((e.target as HTMLInputElement).value) || 0)}
							/>
						</div>

						<div>
							<p>Spotlight distance (${() => this.#spotLightDistance})</p>

							<input
								id="spotLightDistance"
								type="range"
								min="0"
								max="6"
								step="0.01"
								prop:value=${() => this.#spotLightDistance}
								oninput=${(e: Event) => (this.#spotLightDistance = Number((e.target as HTMLInputElement).value) || 0)}
							/>
						</div>

						<div>
							<p>Spotlight penumbra (${() => this.#spotLightPenumbra})</p>

							<input
								id="spotLightPenumbra"
								type="range"
								min="0"
								max="1"
								step="0.01"
								prop:value=${() => this.#spotLightPenumbra}
								oninput=${(e: Event) => (this.#spotLightPenumbra = Number((e.target as HTMLInputElement).value) || 0)}
							/>
						</div>

						<div>
							<p>Spotlight angle (${() => this.#spotLightAngle})</p>

							<input
								id="spotLightAngle"
								type="range"
								min="0"
								max="180"
								step="0.01"
								prop:value=${() => this.#spotLightAngle}
								oninput=${(e: Event) => (this.#spotLightAngle = Number((e.target as HTMLInputElement).value) || 0)}
							/>
						</div>

						<style>
							#debugUi {
								position: absolute;
								top: 1rem;
								bottom: 1rem;
								overflow-y: auto;
								right: calc(var(--bottom-sheet-panel-width) + 150px);
								z-index: 1000;
								background: transparent;
								border-radius: 8px;
								padding: 6px 8px;
								display: flex;
								flex-direction: column;
								gap: 20px;
								width: 250px;
								backdrop-filter: blur(4px);

								p {
									color: white;
									font-size: 8px;
									font-weight: 500;
									margin: 0;
									text-align: center;
									line-height: 1;
								}

								input[type='range'] {
									width: 100%;
									height: 3px;
									background: #333;
									border-radius: 2px;
									outline: none;
									appearance: none;
								}

								& div:has(input[type='checkbox']) {
									display: flex;
									justify-content: center;
									flex-direction: column;
								}
							}
						</style>
					</div>
				`}
			></show-when>

			<show-when
				condition=${() => store.view === 'template' && store.isAdmin}
				content=${() => html`
					<button id="hidden-items-toggle" onclick=${this.#onHiddenItemsClick} title="Manage hidden items">
						Hidden
					</button>
				`}
			></show-when>

			<div id="vignette"></div>

			<div id="lume-scene-container">
				<lume-scene
					ref=${(el: Scene) => (this.lumeScene = el)}
					id="drippy-scene"
					webgl
					perspective="800"
					physically-correct-lights
					shadow-mode="pcfsoft"
					attr:environment-intensity=${() => this.#overallEnvIntensity}
					oncapture:pointerdown=${this.#handlePointerDown}
					oncapture:pointermove=${this.#handlePointerMove}
					oncapture:pointerup=${this.#handlePointerUp}

				>
					<lume-element3d align-point="0.5 0.5 0.5">
						<!-- Ambient: low-level fill so shadow sides aren't pure black -->
					<lume-ambient-light visible="true" intensity="0.05" color="white"></lume-ambient-light>

					<!-- Fill light: opposite side of key, no shadow, softens contrast -->
					<lume-directional-light
						visible=${() => !this.isMobile}
						position="-1.5 -2 0.8"
						intensity="0.8"
						color="#b0c8ff"
					></lume-directional-light>

					<!-- Rim/back light: from behind and above, adds depth separation -->
					<lume-directional-light
						visible=${() => !this.isMobile}
						position="0 -1.5 -2"
						intensity="1.0"
						color="#ffe8d0"
					></lume-directional-light>

						<!-- a sphere to debug/visualize the env map -->
						<lume-sphere ref=${(el: Sphere) => {
							createEffect(() => {
								// For now timeout as quick hack to wait for the material behavior (non-element) to define the material.
								// FIXME Delete timeout after we switch to behavior elements, as it will be clear when to run logic (with the ref of the material behavior element)
								setTimeout(() => {
									const mat = el.three.material as THREE.MeshPhysicalMaterial
									// TODO replace hard-coded scene-specific values
									// with values from the data models.
									if (this.isDamagedWallScene) {
										mat.envMap = new THREE.TextureLoader().load(
											this.scene?.env ?? '/images/envs/brown_photostudio_02.jpg',
										)
										mat.envMap.mapping = THREE.EquirectangularReflectionMapping
										mat.envMap.colorSpace = THREE.SRGBColorSpace
										mat.envMapRotation = new THREE.Euler(0, Math.PI / 2, 0)
										createEffect(() => (mat.envMapIntensity = 10 * this.#overallEnvIntensity))
										mat.needsUpdate = true
									} else {
										mat.envMap = null
										mat.needsUpdate = true
									}
								}, 100)
							})
						}} visible="${() => store.isAdmin && store.showAdminContent}" size="0.5 0.5 0.5" color="white" position="-2 -2 0" metalness="1" roughness="0"></lume-sphere>

						<lume-spot-light
							visible="true"
							target="#avatar"
							position=${() =>
								// TODO replace hard-coded scene-specific values
								// with values from the data models.
								(() => {
									const radius = this.#spotLightDistance
									const horizontalRadians = (this.#spotLightHorizontalRotation / 180) * Math.PI
									const verticalRadians = (this.#spotLightVerticalRotation / 180) * Math.PI
									// Vertical angle tilts from orbit (0deg) to directly above target (90deg).
									const horizontalRadius = radius * Math.cos(verticalRadians)

									return [
										horizontalRadius * Math.sin(horizontalRadians),
										-radius * Math.sin(verticalRadians),
										horizontalRadius * Math.cos(horizontalRadians),
									]
								})()}
							intensity=${() =>
								// TODO replace hard-coded scene-specific values
								// with values from the data models.
								this.isDrippyShop ? this.#spotLightIntensity : this.isHM ? this.#spotLightIntensity * 0.65 : this.#spotLightIntensity}
							ref=${(el: SpotLight) => {
								el.three.shadow.focus = 1
								el.three.shadow.blurSamples = shadowSamples
							}}
							shadow-map-width="${shadowMapSize}"
							shadow-map-height="${shadowMapSize}"
							shadow-bias="${shadowBias}"
							shadow-normal-bias="${shadowNormalBias}"
							penumbra="${() => this.#spotLightPenumbra}"
							angle="${() => this.#spotLightAngle}"
							shadow-radius="${shadowRadius}"
						>

						${() =>
							isAdmin() && store.showAdminContent
								? html`
										<lume-sphere
											size="0.05 0.05 0.05"
											color="white"
											has="basic-material"
											mount-point="0.5 0.5 0.5"
											cast-shadow="false"
										></lume-sphere>
									`
								: null}

						</lume-spot-light>

						<lume-camera-rig
							ref=${(el: CameraRig) => (this.cameraRig = el)}
							min-distance="0.5"
							max-distance="${() => (isDesktop() ? 4 : 6)}"
							distance="${() => (isDesktop() ? 2.5 : 4)}"
							min-vertical-angle="${() => (isDesktop() ? '-17' : '0')}"
							max-vertical-angle="${() => (isDesktop() ? '45' : '0')}"
							min-horizontal-angle="${() =>
								// TODO replace hard-coded scene-specific values
								// with values from the data models.
								this.isDrippyShop ? -120 : -Infinity}"
							max-horizontal-angle="${() =>
								// TODO replace hard-coded scene-specific values
								// with values from the data models.
								this.isDrippyShop ? 120 : Infinity}"
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
								setEnvMapOnModelLoad(
									el,
									() => this.#envTexture,
									() => this.#overallEnvIntensity * 1.8,
								)
								showSkeletonHelper(el, () => store.isAdmin && store.showAdminContent)
								disableFrustumCulledOnLoad(el)
							}}
							attr:src=${() => avatars().find(avatar => avatar.name === this.selectedAvatar)?.src ?? ''}
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
											ref=${(el: GltfModel) => this.#handleBlockModel(el, () => this.block0)}
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
											ref=${(el: GltfModel) => this.#handleBlockModel(el, () => this.block1)}
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
											ref=${(el: GltfModel) => this.#handleBlockModel(el, () => this.block2)}
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
											ref=${(el: GltfModel) => this.#handleBlockModel(el, () => item)}
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
								trim-start=${() => this.animTrimStart}
							></lume-animation>
						</lume-gltf-model>

					<!-- Background scene -->
					<lume-gltf-model
						ref=${(el: GltfModel) => (this.backgroundModel = el)}
						id="scene"
						attr:src=${() => this._lastSceneSrc}
					></lume-gltf-model>

					<!-- Background scene extra objects -->
					<${Index}
						each=${() => {
							return this.scene?.includedModelFiles ?? []
						}}
					>
						${(item: Accessor<string>) => html`
							<lume-gltf-model
								ref=${(el: GltfModel) => (
									enableShadowOnModelLoad(el),
									setEnvMapOnModelLoad(
										el,
										() => this.#envTexture,
										() => this.#overallEnvIntensity * 1.8,
									)
								)}
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
			--sceneTranslateX: 0;
			--sceneTranslateY: -100px;
			background: var(--appBackground);
			width: 600px;
			height: 400px;
			touch-action: none;
			position: relative;
			backface-visibility: hidden;
		}

		#vignette {
			position: absolute;
			inset: 0;
			pointer-events: none;
			z-index: 10;
			background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.75) 100%);
		}

		#hidden-items-toggle {
			position: absolute;
			bottom: 16px;
			right: 64px;
			z-index: 3200;
			border: 1px solid rgba(255, 255, 255, 0.24);
			background: rgba(0, 0, 0, 0.5);
			color: #fff;
			border-radius: 999px;
			height: 40px;
			padding: 0 12px;
			font-size: 11px;
			font-weight: 700;
			cursor: pointer;
			display: inline-flex;
			align-items: center;
			justify-content: center;
			backdrop-filter: blur(8px);
			-webkit-backdrop-filter: blur(8px);
		}

		:host-context(.panel-collapsed) #hidden-items-toggle {
			display: none;
		}

		#lume-scene-container {
			width: calc(100% + 2 * var(--sceneDesktopOffset));
			height: 100%;
			translate: calc(-1 * var(--sceneDesktopOffset)) 0;
			transition: translate var(--transitionDefaultTimeCurve);
			backface-visibility: hidden;
		}

		lume-scene {
			translate: var(--sceneTranslateX);
			transition: translate var(--transitionDefaultTimeCurve);
		}

		@media (max-width: 767px) {
			#lume-scene-container {
				width: 100%;
				translate: 0 var(--overrideSceneTranslateY, var(--sceneTranslateY));
				transform-origin: center center;
				transition: translate var(--transitionTimeFast) ease-in-out;
			}

			lume-scene {
				translate: 0;
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
