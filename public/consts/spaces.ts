import type {Space} from '../types/types.js'
import {blocks} from './blocks.js'

export const spaces: Space[] = [
	{
		name: 'GẤP',
		slug: 'GAP',
		description: 'MoiDien',
		logo: 'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/brands/moidien/logo.webp',
		sceneThumbnail:
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/brands/moidien/scene-thumbnail.png',
		scene:
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/brands/moidien/scene-model.glb',
		includedModelFiles: [
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/brands/moidien/extras/shoes.glb',
		],
		gender: 'female',
		garmentsCount: blocks.moidien?.length ?? 0,
		collection: 'moidien',
		isWholesale: true,
	},
	{
		name: 'YALLAH',
		slug: 'YALLAH',
		description: 'Baroudeuses',
		logo: '',
		sceneThumbnail:
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/brands/baroudeuses/scene-thumbnail.png',
		scene:
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/brands/baroudeuses/scene-model.glb',
		includedModelFiles: [
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/brands/baroudeuses/extras/shoes.glb',
		],
		gender: 'female',
		garmentsCount: blocks.baroudeuses?.length ?? 0,
		collection: 'baroudeuses',
		isWholesale: false,
	},
	{
		name: 'Movement',
		slug: 'movement',
		description: 'Movement',
		logo: '',
		sceneThumbnail:
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/brands/movement/scene-thumbnail.jpeg',
		scene: '',
		includedModelFiles: [],
		gender: 'female',
		garmentsCount: blocks.movement?.length ?? 0,
		collection: 'movement',
		isWholesale: false,
	},
	{
		name: 'Vaishnavi',
		slug: 'vaishnavi',
		description: 'Vaishnavi',
		logo: '',
		sceneThumbnail:
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/brands/naishnavi/scene-thumbnail.png',
		scene:
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/brands/naishnavi/scene-model.glb',
		includedModelFiles: [
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/brands/naishnavi/extras/shoes.glb',
		],
		gender: 'female',
		garmentsCount: blocks.vaishnavi?.length ?? 0,
		collection: 'vaishnavi',
		isWholesale: false,
	},
]
