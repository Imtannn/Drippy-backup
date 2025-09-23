import type {Space} from '../types/types.js'
import {blocks} from './blocks.js'

export const spaces: Space[] = [
	{
		name: 'GẤP',
		slug: 'GAP',
		description: 'MoiDien',
		logo: 'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/brands/moidien/logo.webp',
		env: '/images/envs/brown_photostudio_02.jpg',
		sceneThumbnail:
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/brands/moidien/scene-thumbnail.webp',
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
	// {
	// 	name: 'YALLAH',
	// 	slug: 'YALLAH',
	// 	description: 'Baroudeuses',
	// 	logo: '',
	// 	env: '/images/envs/brown_photostudio_02.jpg',
	// 	sceneThumbnail:
	// 		'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/brands/baroudeuses/scene-thumbnail.png',
	// 	scene:
	// 		'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/brands/baroudeuses/scene-model.glb',
	// 	includedModelFiles: [
	// 		'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/brands/baroudeuses/extras/shoes.glb',
	// 	],
	// 	gender: 'female',
	// 	garmentsCount: blocks.baroudeuses?.length ?? 0,
	// 	collection: 'baroudeuses',
	// 	isWholesale: false,
	// },
	{
		name: 'Movement',
		slug: 'movement',
		description: 'Haruki',
		logo: '',
		env: '/images/envs/brown_photostudio_02.jpg',
		sceneThumbnail:
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/brands/movement/scene-thumbnail.webp',
		scene: '',
		includedModelFiles: [],
		gender: 'female',
		garmentsCount: blocks.haruki?.length ?? 0,
		collection: 'haruki',
		isWholesale: false,
	},
	{
		name: 'Essence of her',
		slug: 'essence-of-her',
		description: 'Vaishnavi',
		logo: '',
		env: '/images/envs/brown_photostudio_02.jpg',
		sceneThumbnail:
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/brands/naishnavi/scene-thumbnail.webp',
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
	{
		name: 'Shadow Grace',
		slug: 'shadow-grace',
		description: 'Lost Cause',
		logo: '',
		env: '/images/envs/brown_photostudio_02.jpg',
		sceneThumbnail:
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/brands/lost-cause/scene-thumbnail.webp',
		scene:
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/brands/lost-cause/scene-model.glb',
		includedModelFiles: [
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/brands/lost-cause/extras/shoes.glb',
		],
		gender: 'female',
		garmentsCount: blocks.lostCause?.length ?? 0,
		collection: 'lostCause',
		isWholesale: false,
	},
	{
		name: 'Duality in Radiance',
		slug: 'duality-in-radiance',
		description: 'SHRI',
		logo: '',
		env: '/images/envs/brown_photostudio_02.jpg',
		sceneThumbnail:
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/brands/shri/scene-thumbnail.webp',
		scene: 'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/brands/shri/scene-model.glb',
		includedModelFiles: [
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/brands/shri/extras/shoes.glb',
		],
		gender: 'female',
		garmentsCount: blocks.shri?.length ?? 0,
		collection: 'shri',
		isWholesale: false,
	},
	{
		name: '9heure19heure',
		slug: '9heure19heuree',
		description: 'ELISE.F',
		logo: '',
		env: '/images/envs/brown_photostudio_02.jpg',
		sceneThumbnail:
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/brands/eliseF/scene-thumbnail.webp',
		scene: 'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/brands/eliseF/scene-model.glb',
		includedModelFiles: [
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/brands/eliseF/extras/shoes.glb',
		],
		gender: 'male',
		garmentsCount: blocks.eliseF?.length ?? 0,
		collection: 'eliseF',
		isWholesale: false,
	},
	{
		name: 'Metamorphosis',
		slug: 'metamorphosis',
		description: 'OOFYA',
		logo: '',
		env: '/images/envs/brown_photostudio_02.jpg',
		sceneThumbnail:
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/brands/oofya/scene-thumbnail.webp',
		scene: 'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/brands/oofya/scene-model.glb',
		includedModelFiles: [
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/brands/oofya/extras/shoes.glb',
		],
		gender: 'male',
		garmentsCount: blocks.oofya?.length ?? 0,
		collection: 'oofya',
		isWholesale: false,
	},
]
