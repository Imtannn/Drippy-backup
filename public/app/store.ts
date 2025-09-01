import {createMutable} from 'solid-js/store'
import type {Block, BlockCategory} from '../types/block.js'
import type {Fabric} from '../types/fabric.js'
import type {Template} from '../types/template.js'

export type AppRoute =
	| 'avatar'
	| 'blocks'
	| 'preview'
	| 'custom-measurement'
	| 'success'
	| 'scene'
	| 'order'
	| 'share'
	| 'template'

export type Avatar = 'female' | 'male' | null

export type Scene = 'bloom realms' | null

export type CustomMeasurement = {
	bust: number
	waist: number
	hips: number
	shoulder: number
	shoulderToKnee: number
}

export type OrderStatus = 'idle' | 'submitting' | 'success' | 'error'

export type ShippingAddress = {
	firstName: string
	lastName: string
	address: string
	apartment: string
	city: string
	postalCode: string
	phone: string
}

export type OrderState = {
	status: OrderStatus
	error: string | null
	productName: string
	selectedSize: string
	quantity: number
	email: string
	customerEmail: string
	customerFirstName: string
	customerLastName: string
	shippingAddress: ShippingAddress
}

export const store = createMutable({
	// key is the block category, value is the block
	view: 'avatar' as AppRoute,
	tempSelectedAvatar: 'male' as Avatar,
	selectedAvatar: null as Avatar,
	selectedScene: null as Scene,
	isPreview: false,
	selectedTemplate: null as Template | null,
	selectedBlocks: new Map<BlockCategory, Block>(),
	selectedFabric: null as Fabric | null,
	customMeasurement: null as CustomMeasurement | null,

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
	set setSelectedBlocks(blocks: Block[] | Block) {
		if (!Array.isArray(blocks)) {
			blocks = [blocks]
		}
		const newBlocks = new Map<BlockCategory, Block>(this.selectedBlocks)
		// check if the block with same category already exists
		for (const block of blocks) {
			if (this.selectedBlocks.has(block.category)) {
				// if it exists, check if the block is the same, if so, remove it
				if (this.selectedBlocks.get(block.category)?._id === block._id) {
					newBlocks.delete(block.category)
				} else {
					newBlocks.set(block.category, block)
				}
			} else {
				// if not, add it
				newBlocks.set(block.category, block)
			}
		}
		this.selectedBlocks = newBlocks
	},
	set replaceSelectedBlocks(blocks: Block[]) {
		// Completely replace selectedBlocks with new blocks (used for template selection)
		const newBlocks = new Map<BlockCategory, Block>()
		for (const block of blocks) {
			newBlocks.set(block.category, block)
		}
		this.selectedBlocks = newBlocks
	},
	set setSelectedFabrics(fabric: Fabric | null) {
		console.log('setSelectedFabrics', fabric, this.selectedFabric)
		if (fabric?._id === this.selectedFabric?._id) {
			this.selectedFabric = null
			return
		}
		this.selectedFabric = fabric
	},
	set setSelectedTemplate(template: Template | null) {
		this.selectedTemplate = template
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
	set selectScene(scene: Scene) {
		this.selectedScene = scene
	},
	set setIsPreview(isPreview: boolean) {
		this.isPreview = isPreview
	},
	set setCustomMeasurement(measurement: CustomMeasurement) {
		this.customMeasurement = measurement
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

	resetState() {
		this.view = 'avatar' as AppRoute
		this.selectedAvatar = null as Avatar
		this.selectedScene = null as Scene
		this.selectedTemplate = null as Template | null
		this.selectedBlocks = new Map<BlockCategory, Block>()
		this.selectedFabric = null as Fabric | null
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
})
