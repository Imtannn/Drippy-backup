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
