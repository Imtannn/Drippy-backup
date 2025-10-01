import type {Avatar} from '../types/types.js'

const animationTestAvatar = new URL('../models/FV2_Yunaa-01.glb', import.meta.url).href

export const avatars: Avatar[] = [
	{
		thumbnail:
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/models/female/yuna/thumbnail.webp',

		// Temporary replacement for testing animation.
		// src: 'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/models/female/moidien/model.glb',
		src: animationTestAvatar,

		gender: 'female',
		value: 'yuna',
		default: true,
	},
	{
		thumbnail:
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/models/female/mia/thumbnail.webp',
		src: 'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/models/female/mia/model.glb',
		gender: 'female',
		value: 'baroudeuses',
	},
	{
		thumbnail:
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/models/female/naomi/thumbnail.webp',
		src: 'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/models/female/naomi/model.glb',
		gender: 'female',
		value: 'naomi',
	},
	{
		thumbnail:
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/models/female/em/thumbnail.webp',
		src: 'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/models/female/em/model.glb',
		gender: 'female',
		value: 'em',
	},
	{
		thumbnail:
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/models/female/tahy/thumbnail.webp',
		src: 'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/models/female/tahy/model.glb',
		gender: 'female',
		value: 'tahy',
	},
	{
		thumbnail:
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/models/female/ruby/thumbnail.webp',
		src: 'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/models/female/ruby/model.glb',
		gender: 'female',
		value: 'ruby',
	},
	{
		thumbnail:
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/models/female/heidi/thumbnail.webp',
		src: 'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/models/female/heidi/model.glb',
		gender: 'female',
		value: 'heidi',
	},
	{
		thumbnail:
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/models/female/bella/thumbnail.webp',
		src: 'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/models/female/bella/model.glb',
		gender: 'female',
		value: 'bella',
	},
	{
		thumbnail:
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/models/male/anh/thumbnail.webp',
		src: 'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/models/male/anh/model.glb',
		value: 'anh',
		gender: 'male',
	},
	{
		thumbnail:
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/models/male/luka/thumbnail.webp',
		src: 'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/models/male/luka/model.glb',
		value: 'luka',
		gender: 'male',
		default: true,
	},
	{
		thumbnail:
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/models/male/jinho/thumbnail.webp',
		src: 'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/models/male/jinho/model.glb',
		value: 'jinho',
		gender: 'male',
	},
]
