import type {BackgroundScene} from '../types/types.js'
import {toSolidSignal} from '../utils.js'

// @deprecated
// Will get replaced with the scenes from the database
export const legacyBackgroundScenes: BackgroundScene[] = [
	{
		name: 'Metamorphosis',
		slug: 'metamorphosis',
		description: 'OOFYA',
		env: '/images/envs/industrial_wooden_attic.jpg',
		scene: 'https://d1e6s1h8cqcr26.cloudfront.net/drippy-app/drippy-app-3D/brands/oofya/OOFYA+SCENE-light1.glb',
		// scene: '/models/OOFYA+SCENE-light+(4).glb',
		includedModelFiles: [
			// 'https://d1e6s1h8cqcr26.cloudfront.net/drippy-app/drippy-app-3D/brands/oofya/OOFYA+-+SHOES.glb',
		],
	},
	{
		name: 'Drippy Shop',
		slug: 'drippy-shop',
		description: 'Drippy Shop',
		env: '/images/envs/industrial_wooden_attic.jpg',
		scene: 'https://d1e6s1h8cqcr26.cloudfront.net/drippy-app/drippy-app-3D/brands/drippy-shop/Drippy+Shop+-+Scene.glb',
		includedModelFiles: [],
	},
	{
		name: 'H&M',
		slug: 'h&m',
		description: 'H&M',
		env: '/images/envs/H&M-env.webp',
		scene: 'https://d1e6s1h8cqcr26.cloudfront.net/drippy-app/drippy-app-3D/brands/h%26m/H%26M+Scene.glb',
		includedModelFiles: [],
	},
]

// TODO: Update this to use the scenes from the database
export const backgroundScenes = toSolidSignal<BackgroundScene[]>(() => {
	return legacyBackgroundScenes
})
