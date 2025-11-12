import {type GltfModel} from 'lume'
import {Meteor} from 'meteor/meteor'
import {batch, createEffect, createMemo, onCleanup, untrack} from 'solid-js'
import {createMutable} from 'solid-js/store'
import {avatars} from '../consts/avatars.js'
import {blocks} from '../consts/blocks.js'
import {fabrics} from '../consts/fabrics.js'
import {spaces} from '../consts/spaces.js'
import {Visits, type Visit} from '../imports/collections/Visits.js'
import {pushState, searchParams, url} from '../routes.js'
import type {Block, BlockCategory} from '../types/block.js'
import type {Fabric} from '../types/fabric.js'
import type {Template, TemplateCategory} from '../types/template.js'
import type {AppRoute, CustomMeasurement, OrderState, OrderStatus, ShippingAddress, Space} from '../types/types.js'
import {
	getSpaceCollections,
	getSpaceDefaultScene,
	getSpacePrimaryCollection,
	onModelLoad,
	spaceHasMultipleCollections,
	syncSignals,
	toSolidSignal,
} from '../utils.js'
import type {ConnectionStatus} from './network-monitor.js'
import {createNetworkEffect} from './network-monitor.js'

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

	selectedAnimation = 'none' as 'none' | 'walk' | 'dance'
	selectedTemplates = new Map<TemplateCategory, Template>()
	private __selectedBlocks = new Map<TemplateCategory, Map<BlockCategory, Block>>()
	selectedFabrics = new Map() as SelectedFabrics
	customMeasurement = null as CustomMeasurement | null
	isShowAvatar = true
	isShowScene = true

	// Loading states tracked by unique symbols
	drippySceneLoads = new Set<symbol>()
	loadingBlocks = new Set<symbol>()
	loadingMaterials = new Set<symbol>()
	loadingScreenshots = new Set<TemplateCategory>()
	loadingTemplateId: string | null = null
	currentAbortController: AbortController | null = null

	connectionStatus: ConnectionStatus = 'online'
	showConnectionWarning = false

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

	get selectedBlocks() {
		return this.__selectedBlocks
	}

	/**
	 * Helper method to apply fabric inheritance for Sleeves from Bodice.
	 * When a Sleeves block is added, it inherits the fabrics from the Bodice block if available.
	 */
	private applySleevesFabricInheritance(block: Block, templateCategory: TemplateCategory) {
		console.log('applying sleeves fabric inheritance for', block.category)
		if (block.category !== 'Sleeves') return

		const templateCategoryFabrics = this.selectedFabrics.get(templateCategory)!
		debugger
		// if (!templateCategoryFabrics) return

		const bodiceFabrics = templateCategoryFabrics.get('Bodice')
		console.log('tmpl cat fabrics', templateCategory, ...templateCategoryFabrics.entries())
		if (!bodiceFabrics || bodiceFabrics.size === 0) return

		this.setSelectedFabrics = Array.from(bodiceFabrics.values()).map(fabric => ({
			fabric,
			blockCategory: 'Sleeves' as BlockCategory,
			templateCategory,
			assignedMesh: (console.log('assignedMesh for fabric', fabric.assignedMesh), fabric.assignedMesh ?? 'default'),
		}))
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
			const newBlocks = new Map<TemplateCategory, Map<BlockCategory, Block>>(this.__selectedBlocks)
			console.log('block template categories', ...newBlocks.keys())

			for (const {block, templateCategory} of blockData) {
				console.log('block template category', templateCategory, block.category)
				// Get or create the template's block map
				let templateBlocks = newBlocks.get(templateCategory)
				if (!templateBlocks) {
					console.log('creating template blocks for', templateCategory)
					templateBlocks = new Map<BlockCategory, Block>()
					newBlocks.set(templateCategory, templateBlocks)
				}

				// Check if the block with same category already exists in this template
				if (templateBlocks.has(block.category)) {
					console.log('template blocks has category', block.category)
					// if the block is already selected, unselect the block.
					if (templateBlocks.get(block.category)?._id === block._id) {
						console.log('unselecting block', block.category)
						templateBlocks.delete(block.category)
						// also remove it from selectedFabrics
						this.selectedFabrics.get(templateCategory)?.delete(block.category)
					} else {
						console.log('replacing block', block.category)

						// Replace with new block
						templateBlocks.set(block.category, block)

						// Apply fabric inheritance for Sleeves from Bodice
						this.applySleevesFabricInheritance(block, templateCategory)
					}
				} else {
					console.log('adding block', block.category)

					// Add new block
					templateBlocks.set(block.category, block)

					// Apply fabric inheritance for Sleeves from Bodice
					this.applySleevesFabricInheritance(block, templateCategory)
				}

				// If template has no blocks left, remove the template entry
				if (templateBlocks.size === 0) {
					console.log('removing template blocks for', templateCategory)
					newBlocks.delete(templateCategory)
					this.selectedFabrics.delete(templateCategory)
				}
			}

			this.selectedFabrics = this.selectedFabrics // trigger reactivity
			debugger
			this.__selectedBlocks = newBlocks // trigger reactivity
		})
	}

	set setSelectedFabrics(fabricData: FabricSelection | FabricSelection[]) {
		if (!Array.isArray(fabricData)) {
			fabricData = [fabricData]
		}
		const newFabrics = new Map(this.selectedFabrics) as SelectedFabrics
		console.log('fabric template categories', ...newFabrics.entries())

		for (let {fabric, blockCategory, templateCategory, assignedMesh} of fabricData) {
			console.log('fabric template category', templateCategory, fabric.category)
			// if (!assignedMesh) {
			// 	assignedMesh = 'default'
			// }

			// Get or create the template's fabric map
			let templateFabrics = newFabrics.get(templateCategory)
			if (!templateFabrics) {
				templateFabrics = new Map<BlockCategory, Map<string, Fabric>>()
				newFabrics.set(templateCategory, templateFabrics)
			}

			// Get existing fabrics for this block category
			const existingFabrics = templateFabrics.get(blockCategory) || new Map<string, Fabric>()
			templateFabrics.set(blockCategory, existingFabrics)

			// Replace only fabrics with the same assignedMesh value (including undefined)
			// const noMatchAssignedMeshKeys = Array.from(existingFabrics.keys()).filter(
			// 	assignedMeshKey => assignedMeshKey !== assignedMesh,
			// )

			// const updatedFabricsMap = new Map<string, Fabric>()
			console.log('updated fabrics map for', blockCategory, 'in', templateCategory, existingFabrics)

			// for (const assignedMeshKey of noMatchAssignedMeshKeys) {
			// 	updatedFabricsMap.set(assignedMeshKey, existingFabrics.get(assignedMeshKey)!)
			// }

			// updatedFabricsMap.set(assignedMesh, fabric)
			existingFabrics.set(assignedMesh, fabric)

			// If template has no fabrics left, remove the template entry
			// if (templateFabrics.size === 0) {
			// 	newFabrics.delete(templateCategory)
			// }
		}

		this.selectedFabrics = newFabrics
		debugger
	}

	set unselectTemplate(template: Template) {
		batch(() => {
			const newTemplates = new Map<TemplateCategory, Template>(this.selectedTemplates)
			newTemplates.delete(template.category)
			const newBlocks = new Map<TemplateCategory, Map<BlockCategory, Block>>(this.__selectedBlocks)
			newBlocks.delete(template.category)
			const newFabrics = new Map<TemplateCategory, Map<BlockCategory, Map<string, Fabric>>>(this.selectedFabrics)
			newFabrics.delete(template.category)

			this.__selectedBlocks = newBlocks
			this.selectedTemplates = newTemplates
			this.selectedFabrics = newFabrics
			debugger
		})
	}
	set setRemixOverlayTemplate(template: Template | null) {
		this.remixOverlayTemplate = template
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
					this.selectedCollection = getSpacePrimaryCollection(space)
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
			pushState()
		}
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

		// If multi-collection space, use selectedCollection
		if (spaceHasMultipleCollections(this.selectedSpace)) {
			return this.selectedCollection || getSpacePrimaryCollection(this.selectedSpace)
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
		for (const [category] of this.selectedTemplates.entries()) {
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
			this.selectedTemplates = new Map<TemplateCategory, Template>()
			this.__selectedBlocks = new Map<TemplateCategory, Map<BlockCategory, Block>>()
			this.selectedFabrics = new Map<TemplateCategory, Map<BlockCategory, Map<string, Fabric>>>()
			debugger
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

	addLoadingBlock(key: symbol) {
		untrack(() => {
			this.loadingBlocks.add(key)
			this.loadingBlocks = new Set(this.loadingBlocks) // trigger reactivity
		})
	}
	removeLoadingBlock(key: symbol) {
		untrack(() => {
			this.loadingBlocks.delete(key)
			this.loadingBlocks = new Set(this.loadingBlocks) // trigger reactivity
		})
	}
	clearLoadingBlocks() {
		untrack(() => {
			this.loadingBlocks.clear()
			this.loadingBlocks = new Set(this.loadingBlocks) // trigger reactivity
		})
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
				this.addLoadingBlock(id)
				this.addIsDrippySceneLoading(id)
			}

			onCleanup(() => {
				this.removeLoadingBlock(id)
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
console.log('Initialized selected blocks and fabrics from URL parameters', store.selectedBlocks, store.selectedFabrics)

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

export type SelectedFabrics = Map<TemplateCategory, Map<BlockCategory, Map<string, Fabric>>>

export function updateGarmentsInUrl(garments: Map<TemplateCategory, Template>) {
	if (garments.size > 0) {
		const garmentIds = Array.from(garments.values()).map(garment => {
			const collection = garment.collection
			const collectionSlug = collection
				? (spaces.find(space => space.collections.includes(collection))?.slug ?? null)
				: null
			if (collectionSlug) return `${collectionSlug}|${garment._id}`
			return garment._id
		})
		untrack(searchParams).set('garments', garmentIds.join(','))
	} else untrack(searchParams).delete('garments')

	pushState()
}

export function updateBlocksInUrl(selectedBlocks: Map<TemplateCategory, Map<BlockCategory, Block>>) {
	if (selectedBlocks.size > 0) {
		const blockIds: string[] = []
		for (const [, blockMap] of selectedBlocks) {
			for (const [, block] of blockMap) {
				const collection = block.collection
				const collectionSlug = collection
					? (spaces.find(space => space.collections.includes(collection))?.slug ?? null)
					: null
				if (collectionSlug) blockIds.push(`${collectionSlug}|${block._id}`)
				else blockIds.push(block._id)
			}
		}
		untrack(searchParams).set('garments', blockIds.join(','))
	} else {
		untrack(searchParams).delete('garments')
	}

	pushState()
}

// FIXME please don't duplicate complex type definitions all over the place.
export function updateFabricsInUrl(fabrics: Map<TemplateCategory, Map<BlockCategory, Map<string, Fabric>>>) {
	if (fabrics.size > 0) {
		const fabricEntries: string[] = []

		for (const [templateCategory, blockMap] of fabrics.entries())
			for (const [blockCategory, pieceMap] of blockMap.entries())
				for (const [piece, fabric] of pieceMap.entries()) {
					const collection = fabric.collection
					const collectionSlug = collection
						? (spaces.find(space => space.collections.includes(collection))?.slug ?? null)
						: null
					fabricEntries.push(
						collectionSlug
							? `${collectionSlug}|${templateCategory}-${blockCategory}-${piece}:${fabric._id}`
							: `${templateCategory}-${blockCategory}-${piece}:${fabric._id}`,
					)
				}

		if (fabricEntries.length > 0) untrack(searchParams).set('fabrics', fabricEntries.join(','))
		else {
			// FIXME? is this still deleting the param from URL?
			untrack(searchParams).delete('fabrics')
			// debugger
		}
	} else {
		// FIXME? is this still deleting the param from URL?
		untrack(searchParams).delete('fabrics')
		// debugger
	}

	// Update URL without triggering page reload
	pushState()
}

export function selectedBlocksFromUrl() {
	const blockData: {block: Block; templateCategory: TemplateCategory}[] = []

	// Get the brand/collection from the scene URL parameter
	const spaceParam = untrack(searchParams).get('space')
	const fallbackSpace = spaces.find(space => space.slug === spaceParam) ?? null

	// Parse garments parameter (comma-separated block IDs)
	const garmentsParam = untrack(searchParams).get('garments')
	if (garmentsParam) {
		const entries = garmentsParam
			.split(',')
			.map(entry => entry.trim())
			.filter(Boolean)

		for (const entry of entries) {
			const {spaceSlug, value: blockId} = parseSpaceQualifiedEntry(entry)
			if (!blockId) continue

			const resolvedSpace =
				(spaceSlug ? (spaces.find(space => space.slug === spaceSlug) ?? null) : null) ?? fallbackSpace
			const block = findBlockById(blockId, resolvedSpace)
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

// Helper function to find a block by ID within a space's collections
function findBlockById(blockId: string, space: Space | null): Block | null {
	if (space) {
		// Get all collections for this space
		const collections = getSpaceCollections(space)

		// Search through all collections in the space
		for (const collectionSlug of collections) {
			const brandBlocks = blocks[collectionSlug]
			if (brandBlocks) {
				const found = brandBlocks.find(b => b._id === blockId)
				if (found) return found
			}
		}
		return null
	}

	// If no space provided, search through all blocks
	for (const brandBlocks of Object.values(blocks)) {
		const found = brandBlocks?.find?.(b => b._id === blockId)
		if (found) return found
	}

	return null
}

function selectedFabricsFromUrl() {
	// Get the brand/collection from the space URL parameter
	const spaceParam = untrack(searchParams).get('space')
	const fallbackSpace = spaces.find(space => space.slug === spaceParam) ?? null

	// Parse fabrics parameter (comma-separated entries in format: templateCategory-blockCategory-piece:fabricId)
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
		const {spaceSlug, value} = parseSpaceQualifiedEntry(entry)
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

		const resolvedSpace = (spaceSlug ? (spaces.find(space => space.slug === spaceSlug) ?? null) : null) ?? fallbackSpace
		const fabric = findFabricById(fabricId, resolvedSpace)
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

// Helper function to find a fabric by ID within a space's collections
function findFabricById(fabricId: string, space: Space | null): Fabric | null {
	if (space) {
		// Get all collections for this space
		const collections = getSpaceCollections(space)

		// Search through all collections in the space
		for (const collectionSlug of collections) {
			const brandFabrics = fabrics[collectionSlug]
			if (brandFabrics) {
				const found = brandFabrics.find(f => f._id === fabricId)
				if (found) return found
			}
		}
		return null
	}

	// If no space provided, search through all fabrics
	for (const brandFabrics of Object.values(fabrics)) {
		const found = brandFabrics?.find?.(f => f._id === fabricId)
		if (found) return found
	}

	return null
}

export function parseSpaceQualifiedEntry(entry: string): {spaceSlug: string | null; value: string | null} {
	const trimmed = entry.trim()
	if (!trimmed) return {spaceSlug: null, value: null}

	const pipeIndex = trimmed.indexOf('|')
	if (pipeIndex === -1) {
		return {spaceSlug: null, value: trimmed}
	}

	const spaceSlug = trimmed.substring(0, pipeIndex).trim()
	const value = trimmed.substring(pipeIndex + 1).trim()

	if (!value) {
		return {spaceSlug: null, value: trimmed}
	}

	return {
		spaceSlug: spaceSlug.length > 0 ? spaceSlug : null,
		value,
	}
}

type FabricSelection = {
	fabric: Fabric
	blockCategory: BlockCategory
	templateCategory: TemplateCategory
	assignedMesh: string
}

type BlockSelection = {block: Block; templateCategory: TemplateCategory}
