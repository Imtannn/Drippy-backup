import {createMutable} from 'solid-js/store'
import type {Block, BlockCategory} from '../types/block.js'
import type {Fabric} from '../types/fabric.js'
import type {Template, TemplateCategory} from '../types/template.js'
import type {AppRoute, Avatar, Space, CustomMeasurement, OrderStatus, ShippingAddress, OrderState} from '../types/types.js'
import {fabrics} from '../consts/fabrics.js'
import {toSolidSignal} from '../utils.js'
import {Meteor} from 'meteor/meteor'

export const store = createMutable({
	// key is the block category, value is the block
	view: 'avatar' as AppRoute,
	tempSelectedAvatar: 'female' as Avatar,
	selectedAvatar: null as Avatar,
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

	// Order-related state
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
		// Completely replace selectedBlocks with new blocks (used for template selection)
		const newBlocks = new Map<TemplateCategory, Map<BlockCategory, Block>>()
		const newFabrics: {fabric: Fabric; blockCategory: BlockCategory; templateCategory: TemplateCategory}[] = []

		for (const {blocks, templateCategory, materialId} of blockData) {
			const templateBlocks = new Map<BlockCategory, Block>()
			for (const block of blocks) {
				templateBlocks.set(block.category, block)
				if (materialId) {
					const fabric = fabrics[this.selectedSpace?.collection ?? 'moidien']?.find(
						fabric => `${fabric.materialName} ${fabric.category} ${fabric.templateCategory}` === materialId,
					)
					if (fabric) {
						newFabrics.push({
							fabric: fabric,
							blockCategory: block.category,
							templateCategory: templateCategory,
						})
					}
				}
			}
			if (templateBlocks.size > 0) {
				newBlocks.set(templateCategory, templateBlocks)
			}
		}
		this.selectedBlocks = newBlocks
		this.replaceSelectedFabrics = newFabrics
	},
	set removeSelectedFabrics(fabricData: {blockCategory: BlockCategory; templateCategory: TemplateCategory}) {
		this.selectedFabrics.get(fabricData.templateCategory)?.delete(fabricData.blockCategory)
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

			// Check if the fabric for this block category already exists in this template
			if (templateFabrics.has(blockCategory)) {
				// if it exists, check if the fabric is the same, if so, remove it
				if (templateFabrics.get(blockCategory)?._id === fabric._id) {
					templateFabrics.delete(blockCategory)
				} else {
					templateFabrics.set(blockCategory, fabric)
				}
			} else {
				// if not, add it
				templateFabrics.set(blockCategory, fabric)
			}

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
				Dress: ['Shirt'],
				Shirt: ['Dress'],
				Jacket: [],
				Skirt: ['Pants'],
				Pants: ['Skirt'],
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
	set setTempSelectedAvatar(avatar: Avatar) {
		this.tempSelectedAvatar = avatar
	},
	set selectAvatar(avatar: Avatar) {
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

	resetSelectedTemplates() {
		this.selectedTemplates = new Map<TemplateCategory, Template>()
		this.selectedBlocks = new Map<TemplateCategory, Map<BlockCategory, Block>>()
		this.selectedFabrics = new Map<TemplateCategory, Map<BlockCategory, Fabric>>()
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
		this.selectedAvatar = null as Avatar
		this.selectedSpace = null as Space | null
		this.selectedTemplates = new Map<TemplateCategory, Template>()
		this.selectedBlocks = new Map<TemplateCategory, Map<BlockCategory, Block>>()
		this.selectedFabrics = new Map<TemplateCategory, Map<BlockCategory, Fabric>>()
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
