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
		isWholesale: false,
	},
	{
		name: 'Baroudeuses',
		slug: 'baroudeuses',
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
]
