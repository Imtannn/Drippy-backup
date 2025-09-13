import {Meteor} from 'meteor/meteor'
import {createMutable} from 'solid-js/store'
import type {Block, BlockCategory} from '../types/block.js'
import type {Fabric} from '../types/fabric.js'
import type {Template, TemplateCategory} from '../types/template.js'
import type {AppRoute, CustomMeasurement, OrderState, OrderStatus, ShippingAddress, Space} from '../types/types.js'
import {toSolidSignal} from '../utils.js'
import {blockManager} from './block-manager.js'

export const store = createMutable({
	// key is the block category, value is the block
	view: 'avatar' as AppRoute,
	tempSelectedAvatar: null as string | null,
	selectedAvatar: null as string | null,
	selectedSpace: null as Space | null,
	selectedAnimation: 'none' as 'none' | 'walk' | 'dance',
	isPreview: false,
	selectedTemplates: new Map<TemplateCategory, Template>(),
	selectedBlocks: new Map<TemplateCategory, Map<BlockCategory, Block>>(),
	selectedFabrics: new Map<TemplateCategory, Map<BlockCategory, Fabric>>(),
	customMeasurement: null as CustomMeasurement | null,
	isShowAvatar: true,
	isShowScene: true,
	isDrippySceneLoading: [] as string[],
	loadingBlocks: [] as string[],
	loadingMaterials: [] as string[],

	// Order-related state
	selectedOrderItems: new Map<TemplateCategory, boolean>(),
	// Size-specific quantities: Map<TemplateCategory, Map<Size, quantity>>
	orderSizeQuantities: new Map<TemplateCategory, Map<string, number>>(),
	// For retail mode: overall item quantities (not per size)
	retailItemQuantities: new Map<TemplateCategory, number>(),
	// For retail mode: selected size per category
	retailItemSizes: new Map<TemplateCategory, string>(),
	// For retail mode: custom measurements per category
	retailItemCustomMeasurements: new Map<TemplateCategory, CustomMeasurement>(),
	// Track which category is currently being customized
	currentCustomMeasurementCategory: null as TemplateCategory | null,
	order: {
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
	} as OrderState,
	set setSelectedBlocks(
		blockData:
			| {block: Block; templateCategory: TemplateCategory}
			| {block: Block; templateCategory: TemplateCategory}[],
	) {
		if (!Array.isArray(blockData)) {
			blockData = [blockData]
		}
		const newBlocks = new Map<TemplateCategory, Map<BlockCategory, Block>>(this.selectedBlocks)

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
							const bodice = templateCategoryFabrics.get('Bodice')
							if (!bodice) return

							this.setSelectedFabrics = {
								fabric: bodice,
								blockCategory: 'Sleeves',
								templateCategory: templateCategory,
							}
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
						const bodice = templateCategoryFabrics.get('Bodice')
						if (!bodice) return

						this.setSelectedFabrics = {
							fabric: bodice,
							blockCategory: 'Sleeves',
							templateCategory: templateCategory,
						}
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
		this.selectedBlocks = newBlocks
	},
	set replaceSelectedBlocks(blockData: {blocks: Block[]; templateCategory: TemplateCategory; materialId: string}[]) {
		const {newBlocks, newFabrics} = blockManager.replaceSelectedBlocks(blockData, this.selectedSpace!)
		this.selectedBlocks = newBlocks
		this.replaceSelectedFabrics = newFabrics
	},
	set replaceSelectedFabrics(
		fabricData:
			| {fabric: Fabric; blockCategory: BlockCategory; templateCategory: TemplateCategory}
			| {fabric: Fabric; blockCategory: BlockCategory; templateCategory: TemplateCategory}[],
	) {
		if (!Array.isArray(fabricData)) {
			fabricData = [fabricData]
		}

		const newFabrics = new Map<TemplateCategory, Map<BlockCategory, Fabric>>(this.selectedFabrics)

		for (const {fabric, blockCategory, templateCategory} of fabricData) {
			let templateFabrics = newFabrics.get(templateCategory)
			if (!templateFabrics) {
				templateFabrics = new Map<BlockCategory, Fabric>()
				newFabrics.set(templateCategory, templateFabrics)
			}

			templateFabrics.set(blockCategory, fabric)
		}
		this.selectedFabrics = newFabrics
	},
	set setSelectedFabrics(
		fabricData:
			| {fabric: Fabric; blockCategory: BlockCategory; templateCategory: TemplateCategory}
			| {fabric: Fabric; blockCategory: BlockCategory; templateCategory: TemplateCategory}[],
	) {
		if (!Array.isArray(fabricData)) {
			fabricData = [fabricData]
		}
		const newFabrics = new Map<TemplateCategory, Map<BlockCategory, Fabric>>(this.selectedFabrics)

		for (const {fabric, blockCategory, templateCategory} of fabricData) {
			// Get or create the template's fabric map
			let templateFabrics = newFabrics.get(templateCategory)
			if (!templateFabrics) {
				templateFabrics = new Map<BlockCategory, Fabric>()
				newFabrics.set(templateCategory, templateFabrics)
			}

			templateFabrics.set(blockCategory, fabric)

			// If template has no fabrics left, remove the template entry
			if (templateFabrics.size === 0) {
				newFabrics.delete(templateCategory)
			}
		}
		this.selectedFabrics = newFabrics
	},
	set setSelectedTemplates(template: Template | Template[]) {
		if (!Array.isArray(template)) {
			template = [template]
		}
		const newTemplates = new Map<TemplateCategory, Template>(this.selectedTemplates)
		const checkInterchangeableCategories = (
			category: TemplateCategory,
			selectedTemplates: Map<TemplateCategory, Template>,
		) => {
			const interchangeableCategoriesMapping: Record<string, Partial<TemplateCategory>[]> = {
				Dress: ['Shirt', 'Pants', 'Skirt'],
				Shirt: ['Dress'],
				Jacket: [],
				Skirt: ['Pants', 'Dress'],
				Pants: ['Skirt', 'Dress'],
			}

			const interchangeableCategories = interchangeableCategoriesMapping[category]

			return interchangeableCategories?.filter(c => selectedTemplates.has(c as TemplateCategory)) ?? []
		}
		// check if the template with same category already exists
		for (const temp of template) {
			const interchangeableCategories = checkInterchangeableCategories(temp.category, this.selectedTemplates)
			if (interchangeableCategories.length > 0) {
				for (const category of interchangeableCategories) {
					if (this.selectedTemplates.has(category as TemplateCategory)) {
						newTemplates.delete(category as TemplateCategory)
					}
				}
			}
			if (this.selectedTemplates.has(temp.category)) {
				// if it exists, check if the template is the same, if so, remove it
				if (this.selectedTemplates.get(temp.category)?._id === temp._id) {
					newTemplates.delete(temp.category)
				} else {
					newTemplates.set(temp.category, temp)
				}
			} else {
				// if not, add it
				newTemplates.set(temp.category, temp)
			}
		}
		this.selectedTemplates = newTemplates
	},
	set navigateTo(route: AppRoute) {
		this.view = route
	},
	set setTempSelectedAvatar(avatar: string) {
		this.tempSelectedAvatar = avatar
	},
	set selectAvatar(avatar: string) {
		this.selectedAvatar = avatar
	},
	set selectSpace(space: Space | null) {
		this.selectedSpace = space
	},
	set setIsPreview(isPreview: boolean) {
		this.isPreview = isPreview
	},
	set setCustomMeasurement(measurement: CustomMeasurement) {
		this.customMeasurement = measurement
	},
	set setIsShowAvatar(isShowAvatar: boolean) {
		this.isShowAvatar = isShowAvatar
	},
	set setIsShowScene(isShowScene: boolean) {
		this.isShowScene = isShowScene
	},
	// Order-related setters
	set setOrderStatus(status: OrderStatus) {
		this.order.status = status
	},
	set setOrderError(error: string | null) {
		this.order.error = error
	},
	set setSelectedSize(size: string) {
		this.order.selectedSize = size
	},
	set setQuantity(quantity: number) {
		this.order.quantity = quantity
	},
	set setCustomerInfo(info: {email?: string; firstName?: string; lastName?: string}) {
		if (info.email !== undefined) this.order.customerEmail = info.email
		if (info.firstName !== undefined) this.order.customerFirstName = info.firstName
		if (info.lastName !== undefined) this.order.customerLastName = info.lastName
	},
	set setShippingAddress(address: Partial<ShippingAddress>) {
		this.order.shippingAddress = {...this.order.shippingAddress, ...address}
	},

	set setSelectedOrderItems(items: Map<TemplateCategory, boolean>) {
		this.selectedOrderItems = items
	},

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
	},

	getSizeQuantity(category: TemplateCategory, size: string): number {
		return this.orderSizeQuantities.get(category)?.get(size) || 0
	},

	getItemTotalQuantity(category: TemplateCategory): number {
		const sizeMap = this.orderSizeQuantities.get(category)
		if (!sizeMap) return 0
		return Array.from(sizeMap.values()).reduce((sum, qty) => sum + qty, 0)
	},

	getOrderTotalQuantity(): number {
		let total = 0
		for (const [category] of this.selectedOrderItems.entries()) {
			if (this.selectedOrderItems.get(category)) {
				total += this.getItemTotalQuantity(category)
			}
		}
		return total
	},

	getOrderTotalCost(): number {
		// For now, using $125 per item as shown in UI
		// TODO: Use actual pricing from templates/store
		return this.getOrderTotalQuantity() * 125
	},

	// Retail mode methods (for non-wholesale)
	setOrderSelectedSize(size: string) {
		this.order.selectedSize = size
	},

	setRetailItemQuantity(category: TemplateCategory, quantity: number) {
		const newQuantities = new Map(this.retailItemQuantities)
		newQuantities.set(category, quantity)
		this.retailItemQuantities = newQuantities
	},

	getRetailItemQuantity(category: TemplateCategory): number {
		return this.retailItemQuantities.get(category) || 1 // Default to 1 for retail
	},

	setRetailItemSize(category: TemplateCategory, size: string) {
		const newSizes = new Map(this.retailItemSizes)
		newSizes.set(category, size)
		this.retailItemSizes = newSizes
	},

	getRetailItemSize(category: TemplateCategory): string {
		return this.retailItemSizes.get(category) || '34 (XS)' // Default size for retail
	},

	setRetailItemCustomMeasurement(category: TemplateCategory, measurement: CustomMeasurement) {
		const newMeasurements = new Map(this.retailItemCustomMeasurements)
		newMeasurements.set(category, measurement)
		this.retailItemCustomMeasurements = newMeasurements
	},

	getRetailItemCustomMeasurement(category: TemplateCategory): CustomMeasurement | null {
		return this.retailItemCustomMeasurements.get(category) || null
	},

	hasRetailItemCustomMeasurement(category: TemplateCategory): boolean {
		return this.retailItemCustomMeasurements.has(category)
	},

	getRetailOrderTotalCost(): number {
		let total = 0
		for (const [category] of this.selectedOrderItems.entries()) {
			if (this.selectedOrderItems.get(category)) {
				total += this.getRetailItemQuantity(category) * 125
			}
		}
		return total
	},

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
	},

	initializeOrderItems() {
		// Initialize all selected templates as checked
		const newSelectedItems = new Map<TemplateCategory, boolean>()
		for (const [category] of this.selectedTemplates.entries()) {
			newSelectedItems.set(category, true)
		}
		this.selectedOrderItems = newSelectedItems
	},

	resetSelectedTemplates() {
		this.selectedTemplates = new Map<TemplateCategory, Template>()
		this.selectedBlocks = new Map<TemplateCategory, Map<BlockCategory, Block>>()
		this.selectedFabrics = new Map<TemplateCategory, Map<BlockCategory, Fabric>>()
		this.selectedOrderItems = new Map<TemplateCategory, boolean>()
		this.orderSizeQuantities = new Map<TemplateCategory, Map<string, number>>()
		this.retailItemQuantities = new Map<TemplateCategory, number>()
		this.retailItemSizes = new Map<TemplateCategory, string>()
		this.retailItemCustomMeasurements = new Map<TemplateCategory, CustomMeasurement>()
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
	},

	resetState() {
		this.view = 'avatar' as AppRoute
		this.selectedAvatar = null as string | null
		this.selectedSpace = null as Space | null
		this.selectedTemplates = new Map<TemplateCategory, Template>()
		this.selectedBlocks = new Map<TemplateCategory, Map<BlockCategory, Block>>()
		this.selectedFabrics = new Map<TemplateCategory, Map<BlockCategory, Fabric>>()
		this.selectedOrderItems = new Map<TemplateCategory, boolean>()
		this.orderSizeQuantities = new Map<TemplateCategory, Map<string, number>>()
		this.retailItemQuantities = new Map<TemplateCategory, number>()
		this.retailItemSizes = new Map<TemplateCategory, string>()
		this.retailItemCustomMeasurements = new Map<TemplateCategory, CustomMeasurement>()
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
	},

	set addIsDrippySceneLoading(key: string) {
		this.isDrippySceneLoading = [...this.isDrippySceneLoading, key]
	},
	set removeIsDrippySceneLoading(key: string) {
		this.isDrippySceneLoading = this.isDrippySceneLoading.filter(k => k !== key)
	},
})

export const currentUser = toSolidSignal(() => Meteor.user())
