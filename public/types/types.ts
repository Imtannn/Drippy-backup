export type AppRoute =
	| 'avatar'
	| 'blocks'
	| 'preview'
	| 'custom-measurement'
	| 'success'
	| 'scene'
	| 'order'
	| 'order-items'
	| 'order-size'
	| 'share'
	| 'template'

export type Avatar = 'female' | 'male' | null

export type Space = {
	name: string
	collection: string
	description: string
	image: URL
	scene: URL
	includedModelFiles: URL[]
	gender: 'male' | 'female'
	garmentsCount: number
	isWholesale: boolean
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
}
