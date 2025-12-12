import {type GltfModel} from 'lume'
import {Meteor} from 'meteor/meteor'
import {batch, createEffect, createMemo, onCleanup, untrack} from 'solid-js'
import {createMutable} from 'solid-js/store'
import {avatars} from '../consts/avatars.js'
import {spaces} from '../consts/spaces.js'
import {Visits, type Visit} from '../imports/collections/Visits.js'
import {pushState, searchParams, url} from '../routes.js'
import type {Block, BlockCategory} from '../types/block.js'
import type {Fabric} from '../types/fabric.js'
import type {Template, TemplateCategory} from '../types/template.js'
import type {
	AppRoute,
	BlockSelection,
	CustomMeasurement,
	FabricSelection,
	OrderState,
	OrderStatus,
	SelectedGarment,
	SelectedGarments,
	ShippingAddress,
	Space,
	TemplateBlocksMap,
	TemplateCategorySelection,
	TemplateFabricsMap,
	TemplateMap,
} from '../types/types.js'
import {
	getSpaceDefaultScene,
	getSpacePrimaryCollection,
	onModelLoad,
	spaceHasMultipleCollections,
	syncSignals,
	toSolidSignal,
} from '../utils.js'
import type {ConnectionStatus} from './network-monitor.js'
import {createNetworkEffect} from './network-monitor.js'
import {templateHelpers} from './template-helpers.js'

export const currentUser = toSolidSignal(() => Meteor.user() as Readonly<Meteor.User> | null)
export const username = () => currentUser()?.username ?? ''
export const dateOfBirth = () => currentUser()?.profile?.dateOfBirth ?? ''
export const isAdmin = () => !!currentUser()?.profile?.isAdmin
export const turnOffSettingsInSpace = () => !!currentUser()?.profile?.turnOffSettingsInSpace
export const hideAnimationSelection = () => !!currentUser()?.profile?.hideAnimationSelection

const pathname = location.pathname

// TODO optimize: use a publication that only sends the count for total visits,
// and paginate visits. For now, limit performance impact by exposing visits
// only to the /stats page.
export const visits = toSolidSignal(() => {
	if (pathname === '/stats') return Visits.find({}).fetch() as readonly Visit[]
	else return [] as readonly Visit[]
})
export const usersCount = toSolidSignal(() => Counts.get('users'))

const spaceFromParam = createMemo<Space | null>(() => {
	return spaces.find(space => space.slug === searchParams().get('space')) ?? null
})

class Store {
	// convenience properties for signals
	get user() {
		return currentUser()
	}
	get username() {
		return username()
	}
	get dateOfBirth() {
		return dateOfBirth()
	}
	get isAdmin() {
		return isAdmin()
	}
	get hideAnimationSelection() {
		return hideAnimationSelection()
	}
	get visits() {
		return visits()
	}
	get usersCount() {
		return usersCount()
	}

	get turnOffSettingsInSpace() {
		return turnOffSettingsInSpace()
	}

	// FIXME this is not in sync with the address bar back/forward buttons
	view = searchParams().get('space') && searchParams().get('avatar') ? ('template' as AppRoute) : ('scene' as AppRoute)

	/** Selected avatar defaults based on space gender to the one in the URL. */
	selectedAvatar = searchParams().get('avatar') ?? avatars[0].name // TODO get this from localStorage (later, from backend) if we want to save the user value to make it the initial value
	selectedSpace = spaceFromParam()
	/** Selected collection within a space (for multi-collection spaces) */
	selectedCollection: string | null = null
	/** Selected scene within a space (for multi-scene spaces) */
	selectedScene: string | null = null
	isPreview = searchParams().get('isPreview') === 'true'
	// FIXME initialize other props from URL params as well

	showAnimationSelect = false
	selectedAnimation = 'none' as 'none' | 'walk' | 'dance'
	selectedTemplates: TemplateMap = {}
	selectedGarments: SelectedGarments = {}
	customMeasurement = null as CustomMeasurement | null
	isShowAvatar = true
	isShowScene = true

	// Loading states tracked by unique symbols
	drippySceneLoads = new Set<symbol>()
	loadingBlocks: Record<string, number> = {}
	loadingMaterials = new Set<symbol>()
	loadingScreenshots = new Set<TemplateCategory>()
	loadingFabricIds = new Set<string>()
	loadingTemplateId: string | null = null
	currentAbortController: AbortController | null = null

	connectionStatus: ConnectionStatus = 'online'
	showConnectionWarning = false

	// Track if initial URL params have been loaded (to avoid default garments interfering)
	urlParamsLoaded = false

	// Order-related state
	selectedOrderItems = new Map<TemplateCategory, boolean>()
	// Size-specific quantities: Map<TemplateCategory, Map<Size, quantity>>
	orderSizeQuantities = new Map<TemplateCategory, Map<string, number>>()
	// For retail mode: overall item quantities (not per size)
	retailItemQuantities = new Map<TemplateCategory, number>()
	// For retail mode: selected size per category
	retailItemSizes = new Map<TemplateCategory, string>()
	// For retail mode: custom measurements per category
	retailItemCustomMeasurements = new Map<TemplateCategory, CustomMeasurement>()
	// Track which category is currently being customized
	currentCustomMeasurementCategory = null as TemplateCategory | null
	// Screenshot cache for garment images
	screenshotCache = new Map<TemplateCategory, string>()
	remixOverlayTemplate = null as Template | null
	// Currently selected piece for fabric selection (used for outline highlighting)
	selectingPiece: string | null = null
	order = {
		status: 'idle' as OrderStatus,
		error: null as string | null,
		productName: 'Custom 3D Drippy Design',
		selectedSize: '34 (XS)',
		quantity: 1,
		customerEmail: '',
		customerFirstName: '',
		customerLastName: '',
		shippingAddress: {
			firstName: '',
			lastName: '',
			address: '',
			apartment: '',
			city: '',
			postalCode: '',
			phone: '',
		},
	} as OrderState

	/** Returns the garment selection for a given template category and block category. If the garment selection is not found, it is created and initialized with default values. */
	private getGarmentSelection(templateCategory: TemplateCategory, blockCategory: BlockCategory): SelectedGarment {
		if (!this.selectedGarments[templateCategory]) {
			this.selectedGarments[templateCategory] = {} as TemplateCategorySelection
		}

		const templateSelection = this.selectedGarments[templateCategory] as TemplateCategorySelection

		if (!templateSelection[blockCategory]) {
			templateSelection[blockCategory] = {
				block: null,
				fabrics: {},
			}
		}

		return templateSelection[blockCategory]!
	}

	private cleanupGarmentSelection(templateCategory: TemplateCategory, blockCategory: BlockCategory) {
		const templateSelection = this.selectedGarments[templateCategory]
		if (!templateSelection) return

		const garmentSelection = templateSelection[blockCategory]
		if (garmentSelection && garmentSelection.block === null && Object.keys(garmentSelection.fabrics).length === 0) {
			delete templateSelection[blockCategory]
		}

		if (Object.keys(templateSelection).length === 0) {
			delete this.selectedGarments[templateCategory]
		}
	}

	getTemplateSelection(templateCategory: TemplateCategory): TemplateCategorySelection | undefined {
		return this.selectedGarments[templateCategory]
	}

	getBlockSelection(templateCategory: TemplateCategory, blockCategory: BlockCategory): SelectedGarment | undefined {
		return this.selectedGarments[templateCategory]?.[blockCategory]
	}

	replaceSelectedGarments(blocksMap: TemplateBlocksMap, fabricsMap: TemplateFabricsMap) {
		this.selectedGarments = templateHelpers.buildSelectedGarmentsFromMaps(blocksMap, fabricsMap)
	}

	clearSelectedGarments() {
		this.selectedGarments = {}
	}

	/**
	 * Helper method to apply fabric inheritance for Sleeves from Bodice.
	 * When a Sleeves block is added, it inherits the fabrics from the Bodice block if available.
	 */
	private applySleevesFabricInheritance(block: Block, templateCategory: TemplateCategory) {
		console.log('applying sleeves fabric inheritance for', block.category)
		if (block.category !== 'Sleeves') return

		const templateSelection = this.selectedGarments[templateCategory]
		if (!templateSelection) return

		const bodiceSelection = templateSelection.Bodice
		if (!bodiceSelection) return

		const bodiceFabrics = bodiceSelection.fabrics
		if (!bodiceFabrics || Object.keys(bodiceFabrics).length === 0) return

		const sleevesSelection = this.getGarmentSelection(templateCategory, 'Sleeves')
		console.log('inheriting fabrics to sleeves', templateCategory, bodiceFabrics)

		for (const [meshKey, fabric] of Object.entries(bodiceFabrics)) {
			sleevesSelection.fabrics[meshKey] = fabric
		}
	}

	// FIXME we should avoid having different ways of setting the same thing
	// (onItemClick in template-view.ts and loadFromUrlParameters in
	// drippy-app.ts).  This will get more difficult to manage and error
	// prone/buggy.
	setSelectedBlocks(blockData: BlockSelection | BlockSelection[]) {
		batch(() => {
			if (!Array.isArray(blockData)) {
				blockData = [blockData]
			}

			for (const {block, templateCategory} of blockData) {
				console.log('block template category', templateCategory, block.category)

				const garmentSelection = this.getGarmentSelection(templateCategory, block.category)

				if (garmentSelection.block?._id === block._id) {
					console.log('unselecting block', block.category)
					garmentSelection.block = null
					garmentSelection.fabrics = {}
					this.cleanupGarmentSelection(templateCategory, block.category)
				} else {
					console.log(garmentSelection.block ? 'replacing block' : 'adding block', block.category)
					garmentSelection.block = block
					this.applySleevesFabricInheritance(block, templateCategory)
				}
			}
		})
	}

	set setSelectedFabrics(fabricData: FabricSelection | FabricSelection[]) {
		if (!Array.isArray(fabricData)) {
			fabricData = [fabricData]
		}

		for (let {fabric, blockCategory, templateCategory, assignedMesh} of fabricData) {
			if (!assignedMesh) {
				assignedMesh = 'default'
			}

			const garmentSelection = this.getGarmentSelection(templateCategory, blockCategory)

			garmentSelection.fabrics = {...garmentSelection.fabrics, [assignedMesh]: fabric}
		}
	}

	set unselectTemplate(template: Template) {
		untrack(() => {
			batch(() => {
				delete this.selectedTemplates[template.category]
				delete this.selectedGarments[template.category]
				// this.touchSelectedGarments()

				// Update URL params to prevent re-adding from URL when last item is removed
				// TODO side effects should be in an Effect (createEffect) or
				// derived in a memo (createMemo).
				if (Object.keys(this.selectedTemplates).length === 0) {
					untrack(searchParams).delete('garments')
					untrack(searchParams).delete('blocks')
					untrack(searchParams).delete('fabrics')
					pushState()
				} else {
					// Update garments param with remaining templates
					const garmentEntries: string[] = []
					for (const t of Object.values(this.selectedTemplates)) {
						const collectionSlug = t.collection ?? null
						garmentEntries.push(collectionSlug ? `${collectionSlug}|${t._id}` : t._id)
					}
					untrack(searchParams).set('garments', garmentEntries.join(','))
					pushState()
				}
			})
		})
	}
	set setRemixOverlayTemplate(template: Template | null) {
		this.remixOverlayTemplate = template
	}
	set setSelectingPiece(piece: string | null) {
		this.selectingPiece = piece
	}
	set selectSpace(space: Space | null) {
		batch(() => {
			this.selectedSpace = space
			// Initialize collection and scene when selecting a space
			if (space) {
				// Check URL params first, otherwise use primary
				const collectionParam = searchParams().get('collection')
				const sceneParam = searchParams().get('scene')

				if (collectionParam && space.collections.includes(collectionParam)) {
					this.selectedCollection = collectionParam
				} else {
					// For multi-collection spaces, default to null (show all)
					// For single-collection spaces, use primary
					this.selectedCollection = spaceHasMultipleCollections(space) ? null : getSpacePrimaryCollection(space)
				}

				if (sceneParam && space.scenes.includes(sceneParam)) {
					this.selectedScene = sceneParam
				} else {
					this.selectedScene = getSpaceDefaultScene(space)
				}
			}
		})
	}

	set setSelectedCollection(collection: string | null) {
		this.selectedCollection = collection
		if (collection) {
			searchParams().set('collection', collection)
		} else {
			searchParams().delete('collection')
		}
		pushState()
	}

	set setSelectedScene(scene: string | null) {
		this.selectedScene = scene
		if (scene) {
			searchParams().set('scene', scene)
			pushState()
		}
	}

	/** Get the effective space (just returns selectedSpace) */
	getEffectiveSpace(): Space | null {
		return this.selectedSpace
	}

	/** Get the effective collection for the current space */
	getEffectiveCollection(): string | null {
		if (!this.selectedSpace) return null

		// If multi-collection space, use selectedCollection (null means show all)
		if (spaceHasMultipleCollections(this.selectedSpace)) {
			return this.selectedCollection || null
		}

		// Single collection space, use primary
		return getSpacePrimaryCollection(this.selectedSpace)
	}

	/** Get the effective scene for the current space */
	getEffectiveScene(): string | null {
		if (!this.selectedSpace) return null

		// Use selectedScene if set, otherwise use default
		return this.selectedScene || getSpaceDefaultScene(this.selectedSpace)
	}
	set setCustomMeasurement(measurement: CustomMeasurement) {
		this.customMeasurement = measurement
	}
	set setIsShowAvatar(isShowAvatar: boolean) {
		this.isShowAvatar = isShowAvatar
	}
	set setIsShowScene(isShowScene: boolean) {
		this.isShowScene = isShowScene
	}
	// Order-related setters
	set setOrderStatus(status: OrderStatus) {
		this.order.status = status
	}
	set setOrderError(error: string | null) {
		this.order.error = error
	}
	set setSelectedSize(size: string) {
		this.order.selectedSize = size
	}
	set setQuantity(quantity: number) {
		this.order.quantity = quantity
	}
	set setCustomerInfo(info: {email?: string; firstName?: string; lastName?: string}) {
		if (info.email !== undefined) this.order.customerEmail = info.email
		if (info.firstName !== undefined) this.order.customerFirstName = info.firstName
		if (info.lastName !== undefined) this.order.customerLastName = info.lastName
	}
	set setShippingAddress(address: Partial<ShippingAddress>) {
		this.order.shippingAddress = {...this.order.shippingAddress, ...address}
	}

	set setConnectionStatus(status: ConnectionStatus) {
		this.connectionStatus = status
		if (status === 'slow' || status === 'offline') {
			this.showConnectionWarning = true
		} else if (status === 'online') {
			this.showConnectionWarning = false
		}
	}

	set setShowConnectionWarning(show: boolean) {
		this.showConnectionWarning = show
	}

	set setSelectedOrderItems(items: Map<TemplateCategory, boolean>) {
		this.selectedOrderItems = items
	}

	setSizeQuantity(category: TemplateCategory, size: string, quantity: number) {
		// Create a new Map to trigger reactivity
		const newQuantities = new Map(this.orderSizeQuantities)

		if (!newQuantities.has(category)) {
			newQuantities.set(category, new Map<string, number>())
		}

		// Create new inner Map to trigger reactivity
		const categoryMap = new Map(newQuantities.get(category)!)
		categoryMap.set(size, quantity)
		newQuantities.set(category, categoryMap)

		this.orderSizeQuantities = newQuantities
	}

	getSizeQuantity(category: TemplateCategory, size: string): number {
		return this.orderSizeQuantities.get(category)?.get(size) || 0
	}

	getItemTotalQuantity(category: TemplateCategory): number {
		const sizeMap = this.orderSizeQuantities.get(category)
		if (!sizeMap) return 0
		return Array.from(sizeMap.values()).reduce((sum, qty) => sum + qty, 0)
	}

	getOrderTotalQuantity(): number {
		let total = 0
		for (const [category] of this.selectedOrderItems.entries()) {
			if (this.selectedOrderItems.get(category)) {
				total += this.getItemTotalQuantity(category)
			}
		}
		return total
	}

	getOrderTotalCost(): number {
		// For now, using $125 per item as shown in UI
		// TODO: Use actual pricing from templates/store
		return this.getOrderTotalQuantity() * 125
	}

	// Retail mode methods (for non-wholesale)
	setOrderSelectedSize(size: string) {
		this.order.selectedSize = size
	}

	setRetailItemQuantity(category: TemplateCategory, quantity: number) {
		const newQuantities = new Map(this.retailItemQuantities)
		newQuantities.set(category, quantity)
		this.retailItemQuantities = newQuantities
	}

	getRetailItemQuantity(category: TemplateCategory): number {
		return this.retailItemQuantities.get(category) || 1 // Default to 1 for retail
	}

	setRetailItemSize(category: TemplateCategory, size: string) {
		const newSizes = new Map(this.retailItemSizes)
		newSizes.set(category, size)
		this.retailItemSizes = newSizes
	}

	getRetailItemSize(category: TemplateCategory): string {
		return this.retailItemSizes.get(category) || '34 (XS)' // Default size for retail
	}

	setRetailItemCustomMeasurement(category: TemplateCategory, measurement: CustomMeasurement) {
		const newMeasurements = new Map(this.retailItemCustomMeasurements)
		newMeasurements.set(category, measurement)
		this.retailItemCustomMeasurements = newMeasurements
	}

	getRetailItemCustomMeasurement(category: TemplateCategory): CustomMeasurement | null {
		return this.retailItemCustomMeasurements.get(category) || null
	}

	hasRetailItemCustomMeasurement(category: TemplateCategory): boolean {
		return this.retailItemCustomMeasurements.has(category)
	}

	getRetailOrderTotalCost(): number {
		let total = 0
		for (const [category] of this.selectedOrderItems.entries()) {
			if (this.selectedOrderItems.get(category)) {
				total += this.getRetailItemQuantity(category) * 125
			}
		}
		return total
	}

	toggleOrderItem(category: TemplateCategory) {
		const newSelectedItems = new Map(this.selectedOrderItems)
		const currentlySelected = newSelectedItems.get(category) || false

		// Check if this would leave no items selected
		const selectedCount = Array.from(newSelectedItems.values()).filter(Boolean).length
		if (currentlySelected && selectedCount <= 1) {
			// Don't allow unchecking if it's the last selected item
			return
		}

		newSelectedItems.set(category, !currentlySelected)
		this.selectedOrderItems = newSelectedItems
	}

	initializeOrderItems() {
		// Initialize all selected templates as checked
		const newSelectedItems = new Map<TemplateCategory, boolean>()
		for (const [category] of Object.entries(this.selectedTemplates)) {
			newSelectedItems.set(category, true)
		}
		this.selectedOrderItems = newSelectedItems
	}

	goBackHomeAndResetState() {
		batch(() => {
			this.view = 'space'
			// this.selectedAvatar = avatars[0].name // don't reset the selected avatar
			this.selectedSpace = null as Space | null
			this.selectedCollection = null
			this.selectedScene = null
			this.selectedTemplates = {}
			this.selectedGarments = {}
			this.selectedOrderItems = new Map<TemplateCategory, boolean>()
			this.orderSizeQuantities = new Map<TemplateCategory, Map<string, number>>()
			this.retailItemQuantities = new Map<TemplateCategory, number>()
			this.retailItemSizes = new Map<TemplateCategory, string>()
			this.retailItemCustomMeasurements = new Map<TemplateCategory, CustomMeasurement>()
			this.screenshotCache = new Map<TemplateCategory, string>()
			// TODO only use unique symbols for loading states, and make sure async
			// processes always clean up!
			this.loadingScreenshots = new Set<TemplateCategory>()
			this.remixOverlayTemplate = null
			this.urlParamsLoaded = false

			// Clear all loading states to prevent orphaned symbols
			// FIXME clearing loading states should not be necessary. If so, it
			// means there's a leak. Instead, don't clear loading states, all async
			// processes must always clean up after themselves, and this will
			// automatically keep loading states cleared.
			this.clearAllLoadingStates()

			this.isPreview = false
			this.customMeasurement = null as CustomMeasurement | null
			this.order = {
				status: 'idle' as OrderStatus,
				error: null as string | null,
				productName: 'Custom 3D Drippy Design',
				selectedSize: '34 (XS)',
				quantity: 1,
				email: '',
				customerEmail: '',
				customerFirstName: '',
				customerLastName: '',
				shippingAddress: {
					firstName: '',
					lastName: '',
					address: '',
					apartment: '',
					city: '',
					postalCode: '',
					phone: '',
				},
			} as OrderState
		})
	}

	addIsDrippySceneLoading(key: symbol) {
		untrack(() => {
			this.drippySceneLoads.add(key)
			this.drippySceneLoads = new Set(this.drippySceneLoads) // trigger reactivity
		})
	}
	removeIsDrippySceneLoading(key: symbol) {
		untrack(() => {
			this.drippySceneLoads.delete(key)
			this.drippySceneLoads = new Set(this.drippySceneLoads) // trigger reactivity
		})
	}
	clearIsDrippySceneLoading() {
		untrack(() => {
			this.drippySceneLoads.clear()
			this.drippySceneLoads = new Set(this.drippySceneLoads) // trigger reactivity
		})
	}

	addLoadingBlock(blockId: string) {
		if (!blockId) return
		untrack(() => {
			const currentCount = this.loadingBlocks[blockId] ?? 0
			this.loadingBlocks = {...this.loadingBlocks, [blockId]: currentCount + 1}
		})
	}
	removeLoadingBlock(blockId: string) {
		if (!blockId) return
		untrack(() => {
			const currentCount = this.loadingBlocks[blockId]
			if (!currentCount) return
			if (currentCount === 1) {
				const {[blockId]: _, ...rest} = this.loadingBlocks
				this.loadingBlocks = rest
			} else {
				this.loadingBlocks = {...this.loadingBlocks, [blockId]: currentCount - 1}
			}
		})
	}
	clearLoadingBlocks() {
		untrack(() => {
			this.loadingBlocks = {}
		})
	}

	isBlockLoading(blockId: string): boolean {
		return Boolean(blockId && blockId in this.loadingBlocks)
	}

	addLoadingMaterial(key: symbol) {
		untrack(() => {
			this.loadingMaterials.add(key)
			this.loadingMaterials = new Set(this.loadingMaterials) // trigger reactivity
		})
	}
	removeLoadingMaterial(key: symbol) {
		untrack(() => {
			this.loadingMaterials.delete(key)
			this.loadingMaterials = new Set(this.loadingMaterials) // trigger reactivity
		})
	}
	clearLoadingMaterials() {
		untrack(() => {
			this.loadingMaterials.clear()
			this.loadingMaterials = new Set(this.loadingMaterials) // trigger reactivity
		})
	}

	addLoadingFabric(fabricId: string) {
		untrack(() => {
			this.loadingFabricIds.add(fabricId)
			this.loadingFabricIds = new Set(this.loadingFabricIds) // trigger reactivity
		})
	}
	removeLoadingFabric(fabricId: string) {
		untrack(() => {
			this.loadingFabricIds.delete(fabricId)
			this.loadingFabricIds = new Set(this.loadingFabricIds) // trigger reactivity
		})
	}
	clearLoadingFabrics() {
		untrack(() => {
			this.loadingFabricIds.clear()
			this.loadingFabricIds = new Set(this.loadingFabricIds) // trigger reactivity
		})
	}

	isFabricLoading(fabricId: string): boolean {
		return this.loadingFabricIds.has(fabricId)
	}

	addLoadingScreenshot(category: TemplateCategory) {
		untrack(() => {
			// FIXME only use unique symbols for loading states, and make sure
			// async processes always clean up!
			this.loadingScreenshots.add(category)
			this.loadingScreenshots = new Set(this.loadingScreenshots) // trigger reactivity
		})
	}
	removeLoadingScreenshot(category: TemplateCategory) {
		untrack(() => {
			// FIXME only use unique symbols for loading states, and make sure
			// async processes always clean up!
			this.loadingScreenshots.delete(category)
			this.loadingScreenshots = new Set(this.loadingScreenshots) // trigger reactivity
		})
	}
	clearLoadingScreenshots() {
		untrack(() => {
			this.loadingScreenshots.clear()
			this.loadingScreenshots = new Set(this.loadingScreenshots) // trigger reactivity
		})
	}

	setLoadingTemplate(templateId: string) {
		if (this.currentAbortController) {
			this.currentAbortController.abort()
		}
		this.currentAbortController = new AbortController()
		this.loadingTemplateId = templateId
	}

	clearLoadingTemplate(templateId: string) {
		if (this.loadingTemplateId === templateId) {
			this.loadingTemplateId = null
			this.currentAbortController = null
		}
	}

	isTemplateLoading(templateId: string): boolean {
		return this.loadingTemplateId === templateId
	}

	clearAllLoadingStates() {
		this.clearLoadingBlocks()
		this.clearLoadingMaterials()
		this.clearLoadingFabrics()
		this.clearLoadingScreenshots()
		this.clearIsDrippySceneLoading()
		this.loadingTemplateId = null
		if (this.currentAbortController) {
			this.currentAbortController.abort()
			this.currentAbortController = null
		}
	}

	trackModelLoading(id: symbol, model: GltfModel) {
		const modelLoaded = onModelLoad(model)

		createEffect(() => {
			if (!modelLoaded()) {
				this.addIsDrippySceneLoading(id)
			}

			onCleanup(() => {
				this.removeIsDrippySceneLoading(id)
			})
		})
	}

	constructor() {
		return createMutable(this)
	}
}

export const store = new Store()

// For debuggering
;(window as any).drippyStore = store

createNetworkEffect((status: ConnectionStatus) => {
	store.setConnectionStatus = status
	console.log('Network status changed:', status)
})

// Pre-populate selected blocks from URL on app initialization
selectedBlocksFromUrl()
selectedFabricsFromUrl()
console.log('Initialized selected garments from URL parameters', store.selectedGarments)

createEffect(() => {
	if (!store.selectedAvatar) throw new Error('Never set the selected avatar to empty!')
})

const spaceParam = createMemo(() => searchParams().get('space'))

// If no scene is selected, default to scene selection view (home), otherwise
// go to template view
createEffect(() => {
	if (!spaceParam()) {
		console.log('No space param, going to scene selection view')
		store.view = 'space'
	}
	// else store.view = 'template'
})

createEffect(() => {
	// If we're in scene selection view, remove all params, and don't sync
	// selectedAvatar with URL param
	if (store.view === 'space') {
		untrack(() => {
			url().search = ''
			pushState()
		})
		return
	}

	// Anywhere but on the scene view, initialize the avatar URL param from selectedAvatar
	untrack(() => {
		if (!searchParams().get('avatar')) {
			searchParams().set('avatar', store.selectedAvatar)
			pushState()
		}
	})

	console.log('sync selectedAvatar with URL param')

	// And keep both selectedAvatar and avatar URL parameter in sync
	syncSignals(
		() => store.selectedAvatar,
		(value: string) => (store.selectedAvatar = value),
		() => searchParams().get('avatar') ?? avatars[0].name,
		(value: string) => {
			searchParams().set('avatar', value)
			pushState()
		},
	)
})

// Auto-correct avatar when navigating to a space with different gender
createEffect(() => {
	const space = store.selectSpace
	if (!space) return

	const currentAvatar = avatars.find(a => a.name === store.selectedAvatar)

	// If space gender doesn't match avatar gender, switch to default avatar for that gender
	if (space.gender && currentAvatar && space.gender !== currentAvatar.gender) {
		const defaultAvatar = avatars.find(a => a.gender === space.gender && a.default)
		if (defaultAvatar) {
			store.selectedAvatar = defaultAvatar.name
		}
	}
})

export function updateGarmentsSelectionInUrl(selectedGarments: SelectedGarments) {
	const blockEntries: string[] = []
	const fabricEntries: string[] = []

	for (const [templateCategory, blockSelections] of Object.entries(selectedGarments)) {
		if (!blockSelections) continue

		for (const [blockCategory, selection] of Object.entries(blockSelections)) {
			if (!selection) continue

			if (selection.block) {
				const collectionSlug = selection.block.collection ?? null
				blockEntries.push(collectionSlug ? `${collectionSlug}|${selection.block._id}` : selection.block._id)
			}

			for (const [piece, fabric] of Object.entries(selection.fabrics)) {
				const collectionSlug = fabric.collection ?? null
				fabricEntries.push(
					collectionSlug
						? `${collectionSlug}|${templateCategory}-${blockCategory}-${piece}:${fabric._id}`
						: `${templateCategory}-${blockCategory}-${piece}:${fabric._id}`,
				)
			}
		}
	}

	if (blockEntries.length > 0) {
		untrack(searchParams).set('blocks', blockEntries.join(','))
	} else {
		untrack(searchParams).delete('blocks')
	}

	if (fabricEntries.length > 0) {
		untrack(searchParams).set('fabrics', fabricEntries.join(','))
	} else {
		untrack(searchParams).delete('fabrics')
	}

	pushState()
}

export function selectedBlocksFromUrl() {
	const blockData: {block: Block; templateCategory: TemplateCategory}[] = []

	const blocksParam = untrack(searchParams).get('blocks')
	if (blocksParam) {
		const entries = blocksParam
			.split(',')
			.map(entry => entry.trim())
			.filter(Boolean)

		for (const entry of entries) {
			const {collectionSlug, value: blockId} = templateHelpers.parseCollectionQualifiedEntry(entry)
			if (!blockId) continue

			const block = templateHelpers.findBlockById(blockId, collectionSlug)
			if (block) {
				blockData.push({
					block,
					templateCategory: block.templateCategory,
				})
			}
		}
	}

	store.setSelectedBlocks(blockData)
}

function selectedFabricsFromUrl() {
	const fabricsParam = untrack(searchParams).get('fabrics')

	if (!fabricsParam) {
		return
	}

	const fabricEntries = fabricsParam.split(',').filter(entry => entry.trim())

	const fabricData: {
		fabric: Fabric
		blockCategory: BlockCategory
		templateCategory: TemplateCategory
		assignedMesh: string
	}[] = []

	for (const entry of fabricEntries) {
		const {collectionSlug, value} = templateHelpers.parseCollectionQualifiedEntry(entry)
		if (!value) continue

		const [keyPart, fabricId] = value.split(':')

		if (!keyPart || !fabricId) {
			continue
		}

		// Split only on first 2 dashes to handle concatenated mesh names
		// Format: templateCategory-blockCategory-piece (where piece may contain dashes)
		const dashIndex1 = keyPart.indexOf('-')
		if (dashIndex1 === -1) continue

		const templateCategory = keyPart.substring(0, dashIndex1)
		const remaining = keyPart.substring(dashIndex1 + 1)

		const dashIndex2 = remaining.indexOf('-')
		if (dashIndex2 === -1) continue

		const blockCategory = remaining.substring(0, dashIndex2)
		const piece = remaining.substring(dashIndex2 + 1)

		if (!templateCategory || !blockCategory || !piece) {
			continue
		}

		const fabric = templateHelpers.findFabricById(fabricId, collectionSlug)
		if (fabric) {
			fabricData.push({
				fabric,
				blockCategory: blockCategory as BlockCategory,
				templateCategory: templateCategory as TemplateCategory,
				assignedMesh: piece === 'default' ? 'default' : piece,
			})
		}
	}

	store.setSelectedFabrics = fabricData
}
