import type {Avatar} from '../types/types.js'
import {toSolidSignal} from '../utils.js'

// @deprecated
// Will get replace with the avatars from the database
export const legacyAvatars: Avatar[] = [
	{
		thumbnail: '/static/drippy-app/drippy-app-3D/models/male/Leo/thumbnail.png',
		src: '/static/drippy-app/drippy-app-3D/models/male/Leo/model.glb',
		name: 'leo',
		gender: 'male',
		default: true,
	},
	{
		thumbnail: '/static/drippy-app/drippy-app-3D/models/male/Luka/thumbnail.png',
		src: '/static/drippy-app/drippy-app-3D/models/male/Luka/model.glb',
		name: 'luka',
		gender: 'male',
	},
	{
		thumbnail: '/static/drippy-app/drippy-app-3D/models/female/Avatar-1/Yuna/Yuna.png',
		src: '/static/drippy-app/drippy-app-3D/Yuna.glb',

		gender: 'female',
		name: 'yuna-a-pose',
	},
	{
		thumbnail: '/static/drippy-app/drippy-app-3D/models/female/Avatar-1/Naomi/Naomi.png',
		src: '/static/drippy-app/drippy-app-3D/Naomi.glb',
		gender: 'female',
		name: 'naomi-a-pose',
	},
	{
		thumbnail: '/static/drippy-app/drippy-app-3D/models/female/Avatar-1/Mia/Mia.png',
		src: '/static/drippy-app/drippy-app-3D/Mia.glb',
		gender: 'female',
		name: 'mia-a-pose',
		default: true,
	},
]

// TODO: Update this to use the avatars from the database
export const avatars = toSolidSignal<Avatar[]>(() => {
	return legacyAvatars
})
