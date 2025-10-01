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
		name: 'moidien',
		default: true,
	},
	{
		thumbnail:
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/models/female/mia/thumbnail.webp',
		src: 'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/models/female/mia/model.glb',
		gender: 'female',
		name: 'baroudeuses',
	},
	{
		thumbnail:
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/models/female/naomi/thumbnail.webp',
		src: 'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/models/female/naomi/model.glb',
		gender: 'female',
		name: 'naomi',
	},
	{
		thumbnail:
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/models/female/em/thumbnail.webp',
		src: 'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/models/female/em/model.glb',
		gender: 'female',
		name: 'em',
	},
	{
		thumbnail:
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/models/female/v2/thumbnail.webp',
		src: 'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/models/female/v2/model.glb',
		gender: 'female',
		name: 'v2',
	},
	{
		thumbnail:
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/models/female/v4/thumbnail.webp',
		src: 'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/models/female/v4/model.glb',
		gender: 'female',
		name: 'v4',
	},
	{
		thumbnail:
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/models/female/v3/thumbnail.webp',
		src: 'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/models/female/v3/model.glb',
		gender: 'female',
		name: 'v3',
	},
	{
		thumbnail:
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/models/male/with-underwear/thumbnail.webp',
		src: 'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/models/male/with-underwear/model.glb',
		name: 'with-underwear',
		gender: 'male',
	},
	{
		thumbnail:
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/models/male/luka/thumbnail.webp',
		src: 'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/models/male/luka/model.glb',
		name: 'luka',
		gender: 'male',
		default: true,
	},
	{
		thumbnail:
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/models/male/jinho/thumbnail.webp',
		src: 'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/models/male/jinho/model.glb',
		name: 'jinho',
		gender: 'male',
	},
]
