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
import {onModelLoad, syncSignals, toSolidSignal} from '../utils.js'

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
	return spaces.find(space => space.slug === searchParams().get('scene')) ?? null
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
	view = searchParams().get('scene') && searchParams().get('avatar') ? ('template' as AppRoute) : ('scene' as AppRoute)

	/** Selected avatar defaults to the one in the URL. */
	selectedAvatar = searchParams().get('avatar') ?? avatars[0].name // TODO get this from localStorage (later, from backend) if we want to save the user value to make it the initial value
	selectedSpace = spaceFromParam()
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
	remixOverlayTemplateCategory = null as TemplateCategory | null
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

	// FIXME we should avoid having different ways of setting the same thing
	// (onItemClick in template-view.ts and loadFromUrlParameters in
	// drippy-app.ts).  This will get more difficult to manage and error
	// prone/buggy.
	setSelectedBlocks(
		blockData:
			| {block: Block; templateCategory: TemplateCategory}
			| {block: Block; templateCategory: TemplateCategory}[],
	) {
		if (!Array.isArray(blockData)) {
			blockData = [blockData]
		}
		const newBlocks = new Map<TemplateCategory, Map<BlockCategory, Block>>(this.__selectedBlocks)

		for (const {block, templateCategory} of blockData) {
			// Get or create the template's block map
			let templateBlocks = newBlocks.get(templateCategory)
			if (!templateBlocks) {
				templateBlocks = new Map<BlockCategory, Block>()
				newBlocks.set(templateCategory, templateBlocks)
			}

			// Check if the block with same category already exists in this template
			if (templateBlocks.has(block.category)) {
				// if it exists, check if the block is the same, if so, remove it
				if (templateBlocks.get(block.category)?._id === block._id) {
					templateBlocks.delete(block.category)
					// also remove it from selectedFabrics
					this.selectedFabrics.get(templateCategory)?.delete(block.category)
				} else {
					// check if the fabric for this block category already exists in this template
					const templateCategoryFabrics = this.selectedFabrics.get(templateCategory)
					if (templateCategoryFabrics) {
						// if the block category is Sleeves, check for bodice and add it to the fabric
						if (block.category === 'Sleeves') {
							const bodiceFabrics = templateCategoryFabrics.get('Bodice')
							if (!bodiceFabrics || bodiceFabrics.size === 0) return

							this.setSelectedFabrics = Array.from(bodiceFabrics.values()).map(fabric => ({
								fabric,
								blockCategory: 'Sleeves' as BlockCategory,
								templateCategory: templateCategory,
							}))
						}
					}
					templateBlocks.set(block.category, block)
				}
			} else {
				// check if the fabric for this block category already exists in this template
				const templateCategoryFabrics = this.selectedFabrics.get(templateCategory)
				if (templateCategoryFabrics) {
					// if the block category is Sleeves, check for bodice and add it to the fabric
					if (block.category === 'Sleeves') {
						const bodiceFabrics = templateCategoryFabrics.get('Bodice')
						if (!bodiceFabrics || bodiceFabrics.size === 0) return

						this.setSelectedFabrics = Array.from(bodiceFabrics.values()).map(fabric => ({
							fabric,
							blockCategory: 'Sleeves' as BlockCategory,
							templateCategory: templateCategory,
						}))
					}
				}
				// if not, add it
				templateBlocks.set(block.category, block)
			}

			// If template has no blocks left, remove the template entry
			if (templateBlocks.size === 0) {
				newBlocks.delete(templateCategory)
				this.selectedFabrics.delete(templateCategory)
			}
		}

		this.__selectedBlocks = newBlocks
	}

	set setSelectedFabrics(
		// FIXME don't repeat complex type definitions all over the place
		fabricData:
			| {fabric: Fabric; blockCategory: BlockCategory; templateCategory: TemplateCategory; assignedMesh?: string}
			| {fabric: Fabric; blockCategory: BlockCategory; templateCategory: TemplateCategory; assignedMesh?: string}[],
	) {
		if (!Array.isArray(fabricData)) {
			fabricData = [fabricData]
		}
		const newFabrics = new Map(this.selectedFabrics) as SelectedFabrics

		for (let {fabric, blockCategory, templateCategory, assignedMesh} of fabricData) {
			if (!assignedMesh) {
				assignedMesh = 'default'
			}

			// Get or create the template's fabric map
			let templateFabrics = newFabrics.get(templateCategory)
			if (!templateFabrics) {
				templateFabrics = new Map<BlockCategory, Map<string, Fabric>>()
				newFabrics.set(templateCategory, templateFabrics)
			}

			// Get existing fabrics for this block category
			const existingFabrics = templateFabrics.get(blockCategory) || new Map<string, Fabric>()

			// Replace only fabrics with the same assignedMesh value (including undefined)
			const noMatchAssignedMeshKeys = Array.from(existingFabrics.keys()).filter(
				assignedMeshKey => assignedMeshKey !== assignedMesh,
			)

			const updatedFabricsMap = new Map<string, Fabric>()
			for (const assignedMeshKey of noMatchAssignedMeshKeys) {
				updatedFabricsMap.set(assignedMeshKey, existingFabrics.get(assignedMeshKey)!)
			}
			updatedFabricsMap.set(assignedMesh, fabric)
			templateFabrics.set(blockCategory, updatedFabricsMap)

			// If template has no fabrics left, remove the template entry
			if (templateFabrics.size === 0) {
				newFabrics.delete(templateCategory)
			}
		}
		this.selectedFabrics = newFabrics
	}
	set unselectTemplate(template: Template) {
		const newTemplates = new Map<TemplateCategory, Template>(this.selectedTemplates)
		newTemplates.delete(template.category)
		const newBlocks = new Map<TemplateCategory, Map<BlockCategory, Block>>(this.__selectedBlocks)
		newBlocks.delete(template.category)
		const newFabrics = new Map<TemplateCategory, Map<BlockCategory, Map<string, Fabric>>>(this.selectedFabrics)
		newFabrics.delete(template.category)

		this.__selectedBlocks = newBlocks
		this.selectedTemplates = newTemplates
		this.selectedFabrics = newFabrics
	}
	set setRemixOverlayTemplateCategory(category: TemplateCategory | null) {
		this.remixOverlayTemplateCategory = category
	}
	set selectSpace(space: Space | null) {
		this.selectedSpace = space
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
			this.view = 'scene'
			// this.selectedAvatar = avatars[0].name // don't reset the selected avatar
			this.selectedSpace = null as Space | null
			this.selectedTemplates = new Map<TemplateCategory, Template>()
			this.__selectedBlocks = new Map<TemplateCategory, Map<BlockCategory, Block>>()
			this.selectedFabrics = new Map<TemplateCategory, Map<BlockCategory, Map<string, Fabric>>>()
			this.selectedOrderItems = new Map<TemplateCategory, boolean>()
			this.orderSizeQuantities = new Map<TemplateCategory, Map<string, number>>()
			this.retailItemQuantities = new Map<TemplateCategory, number>()
			this.retailItemSizes = new Map<TemplateCategory, string>()
			this.retailItemCustomMeasurements = new Map<TemplateCategory, CustomMeasurement>()
			this.screenshotCache = new Map<TemplateCategory, string>()
			// TODO only use unique symbols for loading states, and make sure async
			// processes always clean up!
			this.loadingScreenshots = new Set<TemplateCategory>()
			this.remixOverlayTemplateCategory = null

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

	clearAllLoadingStates() {
		this.clearLoadingBlocks()
		this.clearLoadingMaterials()
		this.clearLoadingScreenshots()
		this.clearIsDrippySceneLoading()
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

// Pre-populate selected blocks from URL on app initialization
selectedBlocksFromUrl()
selectedFabricsFromUrl()
console.log('Initialized selected blocks and fabrics from URL parameters', store.selectedBlocks, store.selectedFabrics)

createEffect(() => {
	if (!store.selectedAvatar) throw new Error('Never set the selected avatar to empty!')
})

const sceneParam = createMemo(() => searchParams().get('scene'))

// If no scene is selected, default to scene selection view (home), otherwise
// go to template view
createEffect(() => {
	if (!sceneParam()) {
		console.log('No scene param, going to scene selection view')
		store.view = 'scene'
	}
	// else store.view = 'template'
})

createEffect(() => {
	// If we're in scene selection view, remove all params, and don't sync
	// selectedAvatar with URL param
	if (store.view === 'scene') {
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

export type SelectedFabrics = Map<TemplateCategory, Map<BlockCategory, Map<string, Fabric>>>

export function updateGarmentsInUrl(garments: Map<TemplateCategory, Template>) {
	if (garments.size > 0) {
		const garmentIds = Array.from(garments.values()).map(garment => garment._id)
		untrack(searchParams).set('garments', garmentIds.join(','))
	} else untrack(searchParams).delete('garments')

	pushState()
}

export function updateBlocksInUrl(selectedBlocks: Map<TemplateCategory, Map<BlockCategory, Block>>) {
	if (selectedBlocks.size > 0) {
		const blockIds: string[] = []
		for (const [, blockMap] of selectedBlocks) {
			for (const [, block] of blockMap) {
				blockIds.push(block._id)
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
				for (const [piece, fabric] of pieceMap.entries())
					fabricEntries.push(`${templateCategory}-${blockCategory}-${piece}:${fabric._id}`)

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
	const sceneParam = untrack(searchParams).get('scene')
	const space = spaces.find(space => space.slug === sceneParam)
	const collection = space?.collection

	// Parse garments parameter (comma-separated block IDs)
	const garmentsParam = untrack(searchParams).get('garments')
	if (garmentsParam && collection) {
		const blockIds = garmentsParam.split(',').filter(id => id.trim())

		// Find blocks by ID within the specific brand collection
		for (const blockId of blockIds) {
			const block = findBlockById(blockId, collection)
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

// Helper function to find a block by ID within a specific brand collection
function findBlockById(blockId: string, collection: string): Block | null {
	// Search within the specific brand collection
	const brandBlocks = blocks[collection]
	if (brandBlocks) {
		return brandBlocks.find(b => b._id === blockId) || null
	}

	return null
}

function selectedFabricsFromUrl() {
	// Get the brand/collection from the scene URL parameter
	const sceneParam = untrack(searchParams).get('scene')
	const space = spaces.find(space => space.slug === sceneParam)
	const collection = space?.collection

	// Parse fabrics parameter (comma-separated entries in format: templateCategory-blockCategory-piece:fabricId)
	const fabricsParam = untrack(searchParams).get('fabrics')

	if (!fabricsParam || !collection) {
		return
	}

	const fabricEntries = fabricsParam.split(',').filter(entry => entry.trim())

	const fabricData: {
		fabric: Fabric
		blockCategory: BlockCategory
		templateCategory: TemplateCategory
		assignedMesh?: string
	}[] = []

	for (const entry of fabricEntries) {
		const [keyPart, fabricId] = entry.split(':')

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

		const fabric = findFabricById(fabricId, collection)
		if (fabric) {
			fabricData.push({
				fabric,
				blockCategory: blockCategory as BlockCategory,
				templateCategory: templateCategory as TemplateCategory,
				assignedMesh: piece === 'default' ? undefined : piece,
			})
		}
	}

	store.setSelectedFabrics = fabricData
}

// Helper function to find a fabric by ID within a specific brand collection
function findFabricById(fabricId: string, collection: string): Fabric | null {
	// Search within the specific brand collection
	const brandFabrics = fabrics[collection]
	if (brandFabrics) {
		return brandFabrics.find(f => f._id === fabricId) || null
	}

	return null
}
