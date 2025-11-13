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

export type Scene = {
	name: string
	slug: string
	description: string
	env: string
	sceneThumbnail: string
	scene: string
	includedModelFiles: string[]
}

export type Space = {
	name: string
	slug: string
	logo: string
	/** Image used as an env map for global lighting and reflections. */
	collections: string[]
	scenes: string[]
	spaceThumbnail?: string
	defaultScene: string
	description: string
	gender: 'male' | 'female'
	garmentsCount: number
	isWholesale: boolean
	isWorkInProgress?: boolean
	viewOnly?: boolean
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
