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
