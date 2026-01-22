import {type GltfModel} from 'lume'
import {Meteor} from 'meteor/meteor'
import {batch, createEffect, createMemo, createSignal, onCleanup, untrack} from 'solid-js'
import {createMutable} from 'solid-js/store'
import {avatars} from '../consts/avatars.js'
import {spaces} from '../consts/spaces.js'
import {Visits, type Visit} from '../imports/collections/Visits.js'
import {Wishlist, type Wishlist as WishlistType} from '../imports/collections/Wishlist.js'
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
	entries,
	getSpaceDefaultScene,
	getSpacePrimaryCollection,
	onModelLoad,
	removeItemUnsorted,
	size,
	spaceHasMultipleCollections,
	syncSignals,
	toSolidSignal,
	values,
} from '../utils.js'
import type {ConnectionStatus} from './network-monitor.js'
import {createNetworkEffect} from './network-monitor.js'
import {templateHelpers} from './TemplateHelpers.js'

/**
 * The current user as a Solid.js signal. Undefined means loading during the
 * app's initial load, null means logged out, and a Meteor.User object means
 * logged in.
 */
export const currentUser = toSolidSignal(() => Meteor.user() as Readonly<Meteor.User> | null | undefined)

export const userLoading = (user: Meteor.User | null | undefined): user is undefined => user === undefined
export const isLoggedIn = (user: Meteor.User | null | undefined): user is Meteor.User | undefined => user !== null
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
export const wishlist = toSolidSignal(() => {
	const user = currentUser()
	if (!user) return [] as readonly WishlistType[]
	return Wishlist.find({userId: user._id}).fetch() as readonly WishlistType[]
})

// Pending wishlist item (used when user favorites before login)
// Persist to localStorage to survive page reloads
const PENDING_WISHLIST_ID_KEY = 'pendingWishlistId'

const getPendingWishlistIdFromStorage = (): string | null => {
	if (typeof window === 'undefined') return null
	const stored = localStorage.getItem(PENDING_WISHLIST_ID_KEY)
	return stored || null
}

const setPendingWishlistIdToStorage = (id: string | null) => {
	if (typeof window === 'undefined') return
	if (id) localStorage.setItem(PENDING_WISHLIST_ID_KEY, id)
	else localStorage.removeItem(PENDING_WISHLIST_ID_KEY)
}

const [pendingWishlistId, setPendingWishlistIdInternal] = createSignal<string | null>(getPendingWishlistIdFromStorage())

const setPendingWishlistId = (id: string | null) => {
	setPendingWishlistIdInternal(id)
	setPendingWishlistIdToStorage(id)
}

export {pendingWishlistId, setPendingWishlistId}

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

	get wishlist() {
		return wishlist()
	}

	showAdminContent = false

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
	selectedAnimation: 'none' | 'walk' | 'dance' | 'idle' = 'idle'
	selectedTemplates: TemplateMap = {}
	selectedGarments: SelectedGarments = {}
	customMeasurement = null as CustomMeasurement | null
	isShowAvatar = true
	isShowScene = true

	// Loading states tracked by unique values
	drippySceneLoads: symbol[] = []
	private loadingBlocks: Record<string, number> = {}
	private loadingScreenshots: TemplateCategory[] = []
	private loadingFabricIds: string[] = []
	private loadingTemplateIds: string[] = []

	connectionStatus: ConnectionStatus = 'online'
	showConnectionWarning = false

	// Track if initial URL params have been loaded (to avoid default garments interfering)
	urlParamsLoaded = false

	// Order-related state
	// FIXME stop using Maps unless they solve a problem such as a static cache or iteration speed
	selectedOrderItems = new Map<TemplateCategory, boolean>()
	// Size-specific quantities: Map<TemplateCategory, Map<Size, quantity>>
	// FIXME stop using Maps unless they solve a problem such as a static cache or iteration speed
	orderSizeQuantities = new Map<TemplateCategory, Map<string, number>>()
	// For retail mode: overall item quantities (not per size)
	// FIXME stop using Maps unless they solve a problem such as a static cache or iteration speed
	retailItemQuantities = new Map<TemplateCategory, number>()
	// For retail mode: selected size per category
	// FIXME stop using Maps unless they solve a problem such as a static cache or iteration speed
	retailItemSizes = new Map<TemplateCategory, string>()
	// For retail mode: custom measurements per category
	// FIXME stop using Maps unless they solve a problem such as a static cache or iteration speed
	retailItemCustomMeasurements = new Map<TemplateCategory, CustomMeasurement>()
	// Track which category is currently being customized
	currentCustomMeasurementCategory = null as TemplateCategory | null
	// Screenshot cache for garment images
	// FIXME stop using Maps unless they solve a problem such as a static cache or iteration speed
	screenshotCache = new Map<TemplateCategory, string>()
	remixOverlayTemplate = null as Template | null
	// URL for iframe popup
	iframePopupUrl: string | null = null
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
		if (!this.selectedGarments[templateCategory])
			this.selectedGarments[templateCategory] = {} as TemplateCategorySelection

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
		if (garmentSelection && garmentSelection.block === null && size(garmentSelection.fabrics) === 0)
			delete templateSelection[blockCategory]

		if (size(templateSelection) === 0) delete this.selectedGarments[templateCategory]
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
		if (block.category !== 'Sleeves') return

		const templateSelection = this.selectedGarments[templateCategory]
		if (!templateSelection) return

		const bodiceSelection = templateSelection.Bodice
		if (!bodiceSelection) return

		const bodiceFabrics = bodiceSelection.fabrics
		if (!bodiceFabrics || size(bodiceFabrics) === 0) return

		const sleevesSelection = this.getGarmentSelection(templateCategory, 'Sleeves')

		for (const [meshKey, fabric] of entries(bodiceFabrics)) sleevesSelection.fabrics[meshKey] = fabric
	}

	// FIXME we should avoid having different ways of setting the same thing
	// (onItemClick in template-view.ts and loadFromUrlParameters in
	// drippy-app.ts).  This will get more difficult to manage and error
	// prone/buggy.
	setSelectedBlocks(blockData: BlockSelection | BlockSelection[]) {
		batch(() => {
			if (!Array.isArray(blockData)) blockData = [blockData]

			for (const {block, templateCategory} of blockData) {
				const garmentSelection = this.getGarmentSelection(templateCategory, block.category)

				if (garmentSelection.block?._id === block._id) {
					garmentSelection.block = null
					garmentSelection.fabrics = {}
					this.cleanupGarmentSelection(templateCategory, block.category)
				} else {
					garmentSelection.block = block
					this.applySleevesFabricInheritance(block, templateCategory)
				}
			}
		})
	}

	set setSelectedFabrics(fabricData: FabricSelection | FabricSelection[]) {
		if (!Array.isArray(fabricData)) fabricData = [fabricData]

		// FIXME STOP DUPLICATING CODE IN RANDOM PLACES OR YOU WILL BE IN TROUBLE! (see parseFabricDataToMap in template-helpers.ts)
		for (const data of fabricData) {
			const {fabric, blockCategory, templateCategory} = data
			let {assignedMesh} = data

			if (!assignedMesh) assignedMesh = 'default'

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
				// FIXME side effects should be in an Effect (createEffect) or
				// derived in a memo (createMemo).
				if (size(this.selectedTemplates) === 0) {
					untrack(searchParams).delete('garments')
					untrack(searchParams).delete('blocks')
					untrack(searchParams).delete('fabrics')
					pushState()
				} else {
					// Update garments param with remaining templates
					const garmentEntries: string[] = []
					for (const t of values(this.selectedTemplates)) {
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

				if (collectionParam && space.collections.includes(collectionParam)) this.selectedCollection = collectionParam
				else
					// For multi-collection spaces, default to null (show all)
					// For single-collection spaces, use primary
					this.selectedCollection = spaceHasMultipleCollections(space) ? null : getSpacePrimaryCollection(space)

				if (sceneParam && space.scenes.includes(sceneParam)) this.selectedScene = sceneParam
				else this.selectedScene = getSpaceDefaultScene(space)
			}
		})
	}

	set setSelectedCollection(collection: string | null) {
		this.selectedCollection = collection
		if (collection) searchParams().set('collection', collection)
		else searchParams().delete('collection')

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
		if (spaceHasMultipleCollections(this.selectedSpace)) return this.selectedCollection || null

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
		if (status === 'slow' || status === 'offline') this.showConnectionWarning = true
		else if (status === 'online') this.showConnectionWarning = false
	}

	set setShowConnectionWarning(show: boolean) {
		this.showConnectionWarning = show
	}

	set setSelectedOrderItems(items: Map<TemplateCategory, boolean>) {
		this.selectedOrderItems = items
	}

	setSizeQuantity(category: TemplateCategory, size: string, quantity: number) {
		// Create a new Map to trigger reactivity
		// FIXME stop using Maps unless they solve a problem such as a static cache or iteration speed
		const newQuantities = new Map(this.orderSizeQuantities)

		if (!newQuantities.has(category)) newQuantities.set(category, new Map<string, number>())

		// Create new inner Map to trigger reactivity
		// FIXME stop using Maps unless they solve a problem such as a static cache or iteration speed
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
		for (const [category] of this.selectedOrderItems.entries())
			if (this.selectedOrderItems.get(category)) total += this.getItemTotalQuantity(category)

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
		// FIXME stop using Maps unless they solve a problem such as a static cache or iteration speed
		const newQuantities = new Map(this.retailItemQuantities)
		newQuantities.set(category, quantity)
		this.retailItemQuantities = newQuantities
	}

	getRetailItemQuantity(category: TemplateCategory): number {
		return this.retailItemQuantities.get(category) || 1 // Default to 1 for retail
	}

	setRetailItemSize(category: TemplateCategory, size: string) {
		// FIXME stop using Maps unless they solve a problem such as a static cache or iteration speed
		const newSizes = new Map(this.retailItemSizes)
		newSizes.set(category, size)
		this.retailItemSizes = newSizes
	}

	getRetailItemSize(category: TemplateCategory): string {
		return this.retailItemSizes.get(category) || '34 (XS)' // Default size for retail
	}

	setRetailItemCustomMeasurement(category: TemplateCategory, measurement: CustomMeasurement) {
		// FIXME stop using Maps unless they solve a problem such as a static cache or iteration speed
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
		for (const [category] of this.selectedOrderItems.entries())
			if (this.selectedOrderItems.get(category)) total += this.getRetailItemQuantity(category) * 125

		return total
	}

	toggleOrderItem(category: TemplateCategory) {
		// FIXME stop using Maps unless they solve a problem such as a static cache or iteration speed
		const newSelectedItems = new Map(this.selectedOrderItems)
		const currentlySelected = newSelectedItems.get(category) || false

		// Check if this would leave no items selected
		const selectedCount = Array.from(newSelectedItems.values()).filter(Boolean).length
		if (currentlySelected && selectedCount <= 1)
			// Don't allow unchecking if it's the last selected item
			return

		newSelectedItems.set(category, !currentlySelected)
		this.selectedOrderItems = newSelectedItems
	}

	initializeOrderItems() {
		// Initialize all selected templates as checked
		// FIXME stop using Maps unless they solve a problem such as a static cache or iteration speed
		const newSelectedItems = new Map<TemplateCategory, boolean>()
		for (const [category] of entries(this.selectedTemplates)) newSelectedItems.set(category, true)

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
			// FIXME stop using Maps unless they solve a problem such as a static cache or iteration speed
			this.selectedOrderItems = new Map<TemplateCategory, boolean>()
			// FIXME stop using Maps unless they solve a problem such as a static cache or iteration speed
			this.orderSizeQuantities = new Map<TemplateCategory, Map<string, number>>()
			// FIXME stop using Maps unless they solve a problem such as a static cache or iteration speed
			this.retailItemQuantities = new Map<TemplateCategory, number>()
			// FIXME stop using Maps unless they solve a problem such as a static cache or iteration speed
			this.retailItemSizes = new Map<TemplateCategory, string>()
			// FIXME stop using Maps unless they solve a problem such as a static cache or iteration speed
			this.retailItemCustomMeasurements = new Map<TemplateCategory, CustomMeasurement>()
			// FIXME stop using Maps unless they solve a problem such as a static cache or iteration speed
			this.screenshotCache = new Map<TemplateCategory, string>()
			this.loadingScreenshots.length = 0
			this.remixOverlayTemplate = null
			this.urlParamsLoaded = false

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
			if (!this.drippySceneLoads.includes(key)) this.drippySceneLoads.push(key)
		})
	}
	removeIsDrippySceneLoading(key: symbol) {
		untrack(() => removeItemUnsorted(this.drippySceneLoads, key))
	}
	clearIsDrippySceneLoading() {
		untrack(() => (this.drippySceneLoads.length = 0))
	}
	get isDrippySceneLoading(): boolean {
		return this.drippySceneLoads.length > 0
	}

	addLoadingBlock(blockId: string) {
		if (!blockId) return
		untrack(() => {
			const currentCount = this.loadingBlocks[blockId] ?? 0
			this.loadingBlocks[blockId] = currentCount + 1
		})
	}
	removeLoadingBlock(blockId: string) {
		if (!blockId) return
		untrack(() => {
			const currentCount = this.loadingBlocks[blockId]
			if (!currentCount) return
			if (currentCount === 1) delete this.loadingBlocks[blockId]
			else this.loadingBlocks[blockId] = currentCount - 1
		})
	}
	clearLoadingBlocks() {
		untrack(() => {
			for (const key in this.loadingBlocks) delete this.loadingBlocks[key]
		})
	}
	isBlockLoading(blockId: string): boolean {
		const blockTracked = blockId in this.loadingBlocks
		return Boolean(blockId && blockTracked)
	}
	get anyBlockIsLoading(): boolean {
		return size(this.loadingBlocks) > 0
	}

	addLoadingFabric(fabricId: string) {
		untrack(() => {
			if (!this.loadingFabricIds.includes(fabricId)) this.loadingFabricIds.push(fabricId)
		})
	}
	removeLoadingFabric(fabricId: string) {
		untrack(() => removeItemUnsorted(this.loadingFabricIds, fabricId))
	}
	clearLoadingFabrics() {
		untrack(() => (this.loadingFabricIds.length = 0))
	}

	isFabricLoading(fabricId: string): boolean {
		return this.loadingFabricIds.includes(fabricId)
	}

	addLoadingScreenshot(category: TemplateCategory) {
		untrack(() => {
			if (!this.loadingScreenshots.includes(category)) this.loadingScreenshots.push(category)
		})
	}
	removeLoadingScreenshot(category: TemplateCategory) {
		untrack(() => removeItemUnsorted(this.loadingScreenshots, category))
	}
	clearLoadingScreenshots() {
		untrack(() => (this.loadingScreenshots.length = 0))
	}
	get isScreenshotsLoading(): boolean {
		return this.loadingScreenshots.length > 0
	}

	setLoadingTemplate(templateId: string, category?: TemplateCategory) {
		if (!templateId) return

		const templateCategory = category ?? templateHelpers.getTemplateCategoryById(templateId)
		const conflictingCategories = new Set<TemplateCategory>()

		if (templateCategory) {
			templateHelpers.getOverridingCategories(templateCategory).forEach(c => conflictingCategories.add(c))
			templateHelpers.getCategoriesThatOverride(templateCategory).forEach(c => conflictingCategories.add(c))
			conflictingCategories.add(templateCategory)
			console.log('conflictingCategories', conflictingCategories)
		}

		untrack(() => {
			if (conflictingCategories.size > 0) {
				for (const id of this.loadingTemplateIds) {
					const idCategory = templateHelpers.getTemplateCategoryById(id)
					if (idCategory && conflictingCategories.has(idCategory)) removeItemUnsorted(this.loadingTemplateIds, id)
				}
			}

			this.loadingTemplateIds.push(templateId)
		})
	}

	clearLoadingTemplate(templateId: string) {
		if (!templateId) return
		untrack(() => removeItemUnsorted(this.loadingTemplateIds, templateId))
	}

	isTemplateLoading(templateId: string): boolean {
		return this.loadingTemplateIds.includes(templateId)
	}

	clearAllLoadingStates() {
		this.clearLoadingBlocks()
		this.clearLoadingFabrics()
		this.clearLoadingScreenshots()
		this.clearIsDrippySceneLoading()
		this.loadingTemplateIds.length = 0
	}

	trackModelLoading(id: symbol, model: GltfModel) {
		const modelLoaded = onModelLoad(model)

		createEffect(() => {
			if (modelLoaded()) return
			this.addIsDrippySceneLoading(id)
			onCleanup(() => this.removeIsDrippySceneLoading(id))
		})
	}

	constructor() {
		return createMutable(this)
	}
}

export const store = new Store()

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
		if (defaultAvatar) store.selectedAvatar = defaultAvatar.name
	}
})

export function updateGarmentsSelectionInUrl(selectedGarments: SelectedGarments) {
	const blockEntries: string[] = []
	const fabricEntries: string[] = []

	for (const [templateCategory, blockSelections] of entries(selectedGarments)) {
		if (!blockSelections) continue

		for (const [blockCategory, selection] of entries(blockSelections)) {
			if (!selection) continue

			if (selection.block) {
				const collectionSlug = selection.block.collection ?? null
				blockEntries.push(collectionSlug ? `${collectionSlug}|${selection.block._id}` : selection.block._id)
			}

			for (const [piece, fabric] of entries(selection.fabrics)) {
				const collectionSlug = fabric.collection ?? null
				fabricEntries.push(
					collectionSlug
						? `${collectionSlug}|${templateCategory}-${blockCategory}-${piece}:${fabric._id}`
						: `${templateCategory}-${blockCategory}-${piece}:${fabric._id}`,
				)
			}
		}
	}

	if (blockEntries.length > 0) untrack(searchParams).set('blocks', blockEntries.join(','))
	else untrack(searchParams).delete('blocks')

	if (fabricEntries.length > 0) untrack(searchParams).set('fabrics', fabricEntries.join(','))
	else untrack(searchParams).delete('fabrics')

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

	if (!fabricsParam) return

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

		if (!keyPart || !fabricId) continue

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

		if (!templateCategory || !blockCategory || !piece) continue

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
