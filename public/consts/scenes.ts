import type {BackgroundScene} from '../types/types.js'
import {toSolidSignal} from '../utils.js'

// @deprecated
// Will get replaced with the scenes from the database
export const legacyBackgroundScenes: BackgroundScene[] = [
	{
		name: 'Metamorphosis',
		slug: 'metamorphosis',
		description: 'OOFYA',
		env: '/images/envs/OOFYA-env.webp',
		scene: '/static/drippy-app/drippy-app-3D/brands/oofya/OOFYA+-+Scene.glb',
		// scene: '/models/OOFYA+SCENE-light+(4).glb',
		includedModelFiles: [
			// '/static/drippy-app/drippy-app-3D/brands/oofya/OOFYA+-+SHOES.glb',
		],
	},
	{
		name: 'Drippy Shop',
		slug: 'drippy-shop',
		description: 'Drippy Shop',
		env: '/images/envs/Drippy-Shop-HDRIs.webp',
		scene: '/static/drippy-app/drippy-app-3D/brands/drippy-shop/Drippy+Shop+-+Scene.glb',
		// env: 'https://rawcdn.githack.com/trusktr/assets/b516a3c6b35732cb65b74b541a97c9636fef3bd8/scenes/DAMAGED%20WALL.webp',
		// scene: 'https://rawcdn.githack.com/trusktr/assets/b516a3c6b35732cb65b74b541a97c9636fef3bd8/scenes/Drippy%20Shop%20-%20Scene-%20Damaged%20wall.glb',
		includedModelFiles: [],
	},
	{
		name: 'H&M',
		slug: 'h&m',
		description: 'H&M',
		env: '/images/envs/H&M-env.webp',
		scene: '/static/drippy-app/drippy-app-3D/brands/h%26m/H%26M+Scene.glb',
		includedModelFiles: [],
	},
]

// TODO: Update this to use the scenes from the database
export const backgroundScenes = toSolidSignal<BackgroundScene[]>(() => {
	return legacyBackgroundScenes
})
