import type {Block, BlockCategory} from './block.js'
import type {Fabric} from './fabric.js'
import type {Template, TemplateCategory} from './template.js'

export type AppRoute =
	| 'avatar'
	| 'preview'
	| 'custom-measurement'
	| 'success'
	| 'space'
	| 'order'
	| 'order-items'
	| 'order-size'
	| 'share'
	| 'template'
	| 'iframe-popup'

export type Gender = 'male' | 'female'

export type Avatar = {
	thumbnail: string
	src: string
	/** A unique name such as "cool-avatar". Serves as the ID of the avatar. */
	name: string
	gender: Gender
	/** When true, the avatar is the default avatar. Only *one* avatar should have this set to true. */
	default?: boolean
}

export type Collection = {
	name: string
	slug: string
	logo: string
	gender: Gender
	garmentsCount: number
}

export type BackgroundScene = {
	name: string
	slug: string
	description: string
	/** Image used as an env map for global lighting and reflections. */
	env: string
	scene: string
	includedModelFiles: string[]
}

export type Space = {
	name: string
	description: string
	logo: string
	slug: string

	/** The slugs of the Collections in this Space */
	collections: string[]
	/** The slugs of the BackgroundScenes in this Space */
	scenes: string[]
	/** Thumbnail image URL for this Space */
	thumbnail?: string
	/** Slug for the default BackgroundScene. */
	defaultScene: string
	gender: 'male' | 'female'
	garmentsCount: number
	isWholesale: boolean

	/** When true, the space is view-only without pricing, and does not allow purchases. */
	viewOnly?: boolean

	// If either of these are true, the space is not shown in the public gallery.
	isWorkInProgress?: boolean
	isHidden?: boolean
}

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

export type OrderData = {
	// Customer information
	email: string
	customerEmail: string
	firstName: string
	lastName: string
	phone: string

	// Order type
	orderType: 'wholesale' | 'retail'

	// Multi-size order items (for wholesale)
	orderItems: Array<{
		templateCategory: string
		templateName: string
		templateId: string
		sizes: Array<{
			size: string
			quantity: number
			price: number
		}>
		totalQuantity: number
		totalPrice: number
	}>

	// Retail order items (for retail)
	retailOrderItems?: Array<{
		templateCategory: string
		templateName: string
		templateId: string
		selectedSize: string
		quantity: number
		price: number
		totalPrice: number
		customMeasurement?: CustomMeasurement // Custom measurements if size is 'Custom'
	}>

	// Shipping information
	shippingAddress: {
		firstName: string
		lastName: string
		address: string
		apartment?: string
		city: string
		postalCode?: string
		phone: string
	}

	designUrl?: string

	spaceDescription?: string
}

export type OrderSuccessOrError =
	| {
			success: true
			orderId: string
			message: string
	  }
	| {
			success: false
			error: string
			details: string
	  }

export type TemplateMap = Record<TemplateCategory, Template>
export type CategoryBlocksMap = Map<BlockCategory, Block>
export type TemplateBlocksMap = Map<TemplateCategory, CategoryBlocksMap>

export type PieceFabricsMap = Map<string, Fabric>
export type BlockFabricsMap = Map<BlockCategory, PieceFabricsMap>
export type TemplateFabricsMap = Map<TemplateCategory, BlockFabricsMap>

export type FabricSelection = {
	fabric: Fabric
	blockCategory: BlockCategory
	templateCategory: TemplateCategory
	assignedMesh: string
}

export type BlockSelection = {block: Block; templateCategory: TemplateCategory}

export type SelectedGarment = {
	block: Block | null
	fabrics: Record<string, Fabric>
}

export type TemplateCategorySelection = Partial<Record<BlockCategory, SelectedGarment>>

export type SelectedGarments = Partial<Record<TemplateCategory, TemplateCategorySelection>>
