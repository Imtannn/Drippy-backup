import type {Avatar} from '../types/types.js'
import {toSolidSignal} from '../utils.js'

// @deprecated
// Will get replace with the avatars from the database
export const legacyAvatars: Avatar[] = [
	{
		thumbnail: 'https://d1e6s1h8cqcr26.cloudfront.net/drippy-app/drippy-app-3D/models/male/Leo/thumbnail.png',
		src: 'https://d1e6s1h8cqcr26.cloudfront.net/drippy-app/drippy-app-3D/models/male/Leo/model.glb',
		name: 'leo',
		gender: 'male',
		default: true,
	},
	{
		thumbnail: 'https://d1e6s1h8cqcr26.cloudfront.net/drippy-app/drippy-app-3D/models/male/Luka/thumbnail.png',
		src: 'https://d1e6s1h8cqcr26.cloudfront.net/drippy-app/drippy-app-3D/models/male/Luka/model.glb',
		name: 'luka',
		gender: 'male',
	},
	{
		thumbnail: 'https://d1e6s1h8cqcr26.cloudfront.net/drippy-app/drippy-app-3D/models/female/Avatar-1/Yuna/Yuna.png',
		src: 'https://d1e6s1h8cqcr26.cloudfront.net/drippy-app/drippy-app-3D/Yuna.glb',

		gender: 'female',
		name: 'yuna-a-pose',
		default: true,
	},
	{
		thumbnail: 'https://d1e6s1h8cqcr26.cloudfront.net/drippy-app/drippy-app-3D/models/female/Avatar-1/Naomi/Naomi.png',
		src: 'https://d1e6s1h8cqcr26.cloudfront.net/drippy-app/drippy-app-3D/Naomi.glb',
		gender: 'female',
		name: 'naomi-a-pose',
	},
	{
		thumbnail: 'https://d1e6s1h8cqcr26.cloudfront.net/drippy-app/drippy-app-3D/models/female/Avatar-1/Mia/Mia.png',
		src: 'https://d1e6s1h8cqcr26.cloudfront.net/drippy-app/drippy-app-3D/Mia.glb',
		gender: 'female',
		name: 'mia-a-pose',
	},
]

export const avatars = toSolidSignal<Avatar[]>(() => {
	return legacyAvatars
})

export const getDefaultAvatarName = () => {
	const list = avatars()
	return list.find(avatar => avatar.default)?.name ?? list[0]?.name ?? ''
}

export const getAvatarByName = (name: string) => {
	return avatars().find(avatar => avatar.name === name) ?? null
}

export const getAvatarByGender = (gender: Avatar['gender']) => {
	const list = avatars()
	return (
		list.find(avatar => avatar.gender === gender && avatar.default) ??
		list.find(avatar => avatar.gender === gender) ??
		null
	)
}
