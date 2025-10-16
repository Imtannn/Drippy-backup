import type {Avatar} from '../types/types.js'

const animationTestAvatar = new URL('../models/FV2_Yunaa-01.glb', import.meta.url).href

export const avatars: Avatar[] = [
	{
		thumbnail: 'https://d1e6s1h8cqcr26.cloudfront.net/drippy-app/drippy-app-3D/models/female/em/thumbnail.webp',
		src: 'https://d1e6s1h8cqcr26.cloudfront.net/drippy-app/drippy-app-3D/models/female/em/model.glb',
		gender: 'female',
		name: 'em',
		default: true,
	},
	{
		thumbnail: 'https://d1e6s1h8cqcr26.cloudfront.net/drippy-app/drippy-app-3D/models/female/yuna/thumbnail.webp',

		// Temporary replacement for testing animation.
		// src: 'https://d1e6s1h8cqcr26.cloudfront.net/drippy-app/drippy-app-3D/models/female/moidien/model.glb',
		src: animationTestAvatar,

		gender: 'female',
		name: 'yuna',
	},
	{
		thumbnail: 'https://d1e6s1h8cqcr26.cloudfront.net/drippy-app/drippy-app-3D/models/female/mia/thumbnail.webp',
		src: 'https://d1e6s1h8cqcr26.cloudfront.net/drippy-app/drippy-app-3D/models/female/mia/model.glb',
		gender: 'female',
		name: 'baroudeuses',
	},
	{
		thumbnail: 'https://d1e6s1h8cqcr26.cloudfront.net/drippy-app/drippy-app-3D/models/female/naomi/thumbnail.webp',
		src: 'https://d1e6s1h8cqcr26.cloudfront.net/drippy-app/drippy-app-3D/models/female/naomi/model.glb',
		gender: 'female',
		name: 'naomi',
	},
	{
		thumbnail: 'https://d1e6s1h8cqcr26.cloudfront.net/drippy-app/drippy-app-3D/models/female/tahy/thumbnail.webp',
		src: 'https://d1e6s1h8cqcr26.cloudfront.net/drippy-app/drippy-app-3D/models/female/tahy/model.glb',
		gender: 'female',
		name: 'tahy',
	},
	{
		thumbnail: 'https://d1e6s1h8cqcr26.cloudfront.net/drippy-app/drippy-app-3D/models/female/ruby/thumbnail.webp',
		src: 'https://d1e6s1h8cqcr26.cloudfront.net/drippy-app/drippy-app-3D/models/female/ruby/model.glb',
		gender: 'female',
		name: 'ruby',
	},
	{
		thumbnail: 'https://d1e6s1h8cqcr26.cloudfront.net/drippy-app/drippy-app-3D/models/female/heidi/thumbnail.webp',
		src: 'https://d1e6s1h8cqcr26.cloudfront.net/drippy-app/drippy-app-3D/models/female/heidi/model.glb',
		gender: 'female',
		name: 'heidi',
	},
	{
		thumbnail: 'https://d1e6s1h8cqcr26.cloudfront.net/drippy-app/drippy-app-3D/models/female/bella/thumbnail.webp',
		src: 'https://d1e6s1h8cqcr26.cloudfront.net/drippy-app/drippy-app-3D/models/female/bella/model.glb',
		gender: 'female',
		name: 'bella',
	},
	{
		thumbnail: 'https://d1e6s1h8cqcr26.cloudfront.net/drippy-app/drippy-app-3D/models/male/anh/thumbnail.webp',
		src: 'https://d1e6s1h8cqcr26.cloudfront.net/drippy-app/drippy-app-3D/models/male/anh/model.glb',
		name: 'anh',
		gender: 'male',
		default: true,
	},
	{
		thumbnail: 'https://d1e6s1h8cqcr26.cloudfront.net/drippy-app/drippy-app-3D/models/male/luka/thumbnail.webp',
		src: 'https://d1e6s1h8cqcr26.cloudfront.net/drippy-app/drippy-app-3D/models/male/luka/model.glb',
		name: 'luka',
		gender: 'male',
	},
	{
		thumbnail: 'https://d1e6s1h8cqcr26.cloudfront.net/drippy-app/drippy-app-3D/models/male/jinho/thumbnail.webp',
		src: 'https://d1e6s1h8cqcr26.cloudfront.net/drippy-app/drippy-app-3D/models/male/jinho/model.glb',
		name: 'jinho',
		gender: 'male',
	},
]
