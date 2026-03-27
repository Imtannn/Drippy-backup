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
		logo: '/static/drippy-app/drippy-app-3D/Logo-1/Oofya.png',
		thumbnail: '/static/drippy-app/drippy-app-3D/brands/oofya/OOFYA+-+SCENE.webp',
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
		logo: '/static/drippy-app/drippy-app-3D/brands/h%26m/lgo-h%26m.webp',
		thumbnail: '/static/drippy-app/drippy-app-3D/brands/h%26m/H%26M+Scene.png',
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
		logo: '/static/drippy-app/drippy-app-3D/brands/drippy-shop/Drippy+Shop+-+Logo.jpg',
		thumbnail: '/static/drippy-app/drippy-app-3D/brands/drippy-shop/Drippy+Shop+-+Logo.jpg',
		defaultScene: 'drippy-shop',
		scenes: ['drippy-shop'],
		gender: 'female',
		collections: [
			'metamorphosis',
			'h&m',

			///////////////////////////////////////////////////////
			'môi_điên',
			'emwear',
			'the_soul',
			'bohee',
			'b.club',
			'coor_official',
			'highway',
			'massimodutti',
			'meanblvd',
			'splash.boutique',
			'call_me_ari',
			'celine',
			'poxi',
			'ayarabbim',
			'cubavera',
			'salteyestudio',
			'nakedandfamousdenim',
			'givenchy',
			'eye_of_the_storm',
			'berta',
			'abercrombie',
			'milkwhite',
			'oia.studios',
			'the_tis',
			'𝐶𝑂𝐿𝐼𝑁ⓡ',
			'bupbes',
			'just_etro.gang',
			'oceana_london',
			'xipi',
			'edini',
			'cortana',
			'ceci_cela',
			'liniss_official',
			'vinaygaia',
			'paradise_saigon',
			'lider',
			'julian_prohaska',
			'david_black',
			'ssdslsns',
			'hurricane_b',
			'skall',
			'cara_club',
			'stevie_crowne',
			'fig._cool_leather',
			'hani',
			'huelley_rose',
			'beachclub.official',
			'ushatava',
			'naked',
			'demobaza',
			'libeworkshop',
			'mono_talk',
			'whiteplan',
			'erroris.ltd',
			'dottie',
			'tubycatu',
			'baum_und_pferdgarten',
			'pradies',
			'ononmm',
			'bad_habits',
			'levents',
			'gola',
			'jubin_studio',
			'rotate',
			'kido',
			'rechic',
			'dario_mittmann',
			'cecilie_bahnsen',
			'tsun',
			'sora.m_design',
			'bloom.womenswear',
			'salteye',
			'ridkid',
			'raxada',
			'push_push',
			'procode',
			'pindiga_ranjith_kumar',
			'monroe_the_label',
			'diane',
			'crescent',
			'anyshape',
			'céleste_studio',
			'ohz_-_𝙼𝙰𝙳𝙴_𝙵𝙾𝚁_𝚈𝙾𝚄',
			'sò_vintage_official',
			'каталог_1811',
			'dico®',
			'𝐉𝐎𝐈𝐄_𝐃𝐄𝐒_𝐑𝐎𝐒𝐄𝐒',
			'h2b_à_la_mode',
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
