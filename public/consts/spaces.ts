import type {Collection, Space} from '../types/types.js'
import {toSolidSignal} from '../utils.js'
import {getBlocksByCollection} from './blocks.js'
import {collections} from './collections.js'

// @deprecated
// Will get replaced with the spaces from the database
export const legacySpaces: Space[] = [
	{
		name: 'Metamorphosis',
		slug: 'metamorphosis',
		description: 'OOFYA',
		logo: 'https://d1e6s1h8cqcr26.cloudfront.net/drippy-app/drippy-app-3D/Logo-1/Oofya.png',
		thumbnail: 'https://d1e6s1h8cqcr26.cloudfront.net/drippy-app/drippy-app-3D/brands/oofya/OOFYA+-+SCENE.webp',
		defaultScene: 'metamorphosis',
		scenes: ['metamorphosis'],
		gender: 'female',
		collections: ['metamorphosis'],
		isWholesale: false,
		isWorkInProgress: false,
		isHidden: false,
	},
	{
		name: 'H&M',
		slug: 'h&m',
		description: 'H&M',
		logo: 'https://d1e6s1h8cqcr26.cloudfront.net/drippy-app/drippy-app-3D/brands/h%26m/lgo-h%26m.webp',
		thumbnail: 'https://d1e6s1h8cqcr26.cloudfront.net/drippy-app/drippy-app-3D/brands/h%26m/H%26M+Scene.png',
		defaultScene: 'h&m',
		scenes: ['h&m'],
		gender: 'female',
		collections: ['h&m'],
		isWholesale: false,
		isWorkInProgress: false,
		isHidden: false,
	},
	{
		name: 'Drippy Shop',
		slug: 'drippy-shop',
		description: 'Drippy Shop',
		logo: 'https://d1e6s1h8cqcr26.cloudfront.net/drippy-app/drippy-app-3D/Logo-1/Oofya.png',
		thumbnail: 'https://d1e6s1h8cqcr26.cloudfront.net/drippy-app/drippy-app-3D/brands/oofya/OOFYA+-+SCENE.webp',
		defaultScene: 'drippy-shop',
		scenes: ['drippy-shop'],
		gender: 'female',
		collections: [
			'anyshape',
			'ayarabbim',
			'baum-und-pferdgarten',
			'bloom.womenswear',
			'bupbes',
			'call-me-ari',
			'cecilie-bahnsen',
			'crescent',
			'cuba-vera',
			'dario-mittmann',
			'givenchy',
			'dico',
			'dottie',
			'edini',
			'erroris.ltd',
			'gola',
			'h2b',
			'joie-des-roses',
			'jubin-studio',
			'celeste-studio',
			'just-etro-gang',
			'kido',
			'levents',
			'bad-habits',
			'beachclub.official',
			'berta',
			'cara-club',
			'ceci-cela',
			'celine',
			'colin',
			'demobaza',
			'diane',
			'hani',
			'huelley-rose',
			'hurricane-b',
			'fig.cool-leather',
			'libeworkshop',
			'liniss-official',
			'meanbldv',
			'milk-white',
			'mono-talk',
			'monroe-the-label',
			'naked',
			'nakedandfamousdenim',
			'zd-eye-of-the-storm',
			'abercrombie',
			'oceania-london',
			'cortana',
		],
		isWholesale: false,
		isWorkInProgress: false,
		isHidden: false,
	},
]

// TODO: Update this to use the spaces from the database
export const spaces = toSolidSignal<Space[]>(() => {
	return legacySpaces
})

export function collectionsInSpace(spaceOrSlug: string | Space): Collection[] {
	const space = spaces().find(s => s === spaceOrSlug || s.slug === spaceOrSlug)
	if (!space) return []
	return collections().filter(c => space.collections.includes(c.slug))
}

export function countItemsInSpace(spaceOrSlug: string | Space): number {
	const space = spaces().find(s => s === spaceOrSlug || s.slug === spaceOrSlug)
	if (!space) return 0
	const spaceCollections = collectionsInSpace(space)
	let count = 0
	for (const collection of spaceCollections) count += getBlocksByCollection(collection).length
	return count
}
