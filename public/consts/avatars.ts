import type {Avatar} from '../types/types.js'

const animationTestAvatar = new URL('../models/FV2_Yunaa-01.glb', import.meta.url).href

export const avatars: Avatar[] = [
	{
		thumbnail:
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/models/female/moidien/thumbnail.webp',

		// Temporary replacement for testing animation.
		// src: 'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/models/female/moidien/model.glb',
		src: animationTestAvatar,

		gender: 'female',
		value: 'moidien',
	},
	{
		thumbnail:
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/models/female/mia/thumbnail.png',
		src: 'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/models/female/mia/model.glb',
		gender: 'female',
		value: 'baroudeuses',
	},
	{
		thumbnail:
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/models/male/with-underwear/thumbnail.png',
		src: 'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/models/male/with-underwear/model.glb',
		value: 'with-underwear',
		gender: 'male',
	},
]
