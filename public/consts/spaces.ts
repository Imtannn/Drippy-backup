import type {Space} from '../types/types.js'
import {blocks} from './blocks.js'

export const spaces: Space[] = [
	{
		name: 'GẤP',
		description: 'MoiDien',
		image: new URL('../images/moidien-scene.png', import.meta.url),
		scene: new URL('../models/Moidien-scene.glb', import.meta.url),
		gender: 'female',
		garmentsCount: blocks.moidien.length,
		collection: 'moidien',
	},
]
