import type {Collection} from '../types/types.js'
import {toSolidSignal} from '../utils.js'

// @deprecated
// Will get replaced with the collections from the database
export const legacyCollections: Collection[] = [
	{
		name: 'metamorphosis',
		slug: 'metamorphosis',
		logo: '',
		gender: 'female',
	},
	{
		name: 'H&M',
		slug: 'h&m',
		logo: 'https://d1e6s1h8cqcr26.cloudfront.net/drippy-app/drippy-app-3D/brands/h%26m/lgo-h%26m.webp',
		gender: 'female',
	},
	{
		name: 'anyshape',
		slug: 'anyshape',
		logo: '',
		gender: 'female',
	},
	{
		name: 'ayarabbim',
		slug: 'ayarabbim',
		logo: '',
		gender: 'female',
	},
	{
		name: 'baum-und-pferdgarten',
		slug: 'baum-und-pferdgarten',
		logo: '',
		gender: 'female',
	},
	{
		name: 'bloom.womenswear',
		slug: 'bloom.womenswear',
		logo: '',
		gender: 'female',
	},
	{
		name: 'bupbes',
		slug: 'bupbes',
		logo: '',
		gender: 'female',
	},
	{
		name: 'call-me-ari',
		slug: 'call-me-ari',
		logo: '',
		gender: 'female',
	},
	{
		name: 'cecilie-bahnsen',
		slug: 'cecilie-bahnsen',
		logo: '',
		gender: 'female',
	},
	{
		name: 'crescent',
		slug: 'crescent',
		logo: '',
		gender: 'female',
	},
	{
		name: 'cuba-vera',
		slug: 'cuba-vera',
		logo: '',
		gender: 'female',
	},
	{
		name: 'dario-mittmann',
		slug: 'dario-mittmann',
		logo: '',
		gender: 'female',
	},
	{
		name: 'givenchy',
		slug: 'givenchy',
		logo: '',
		gender: 'female',
	},
	{
		name: 'dico',
		slug: 'dico',
		logo: '',
		gender: 'female',
	},
	{
		name: 'dottie',
		slug: 'dottie',
		logo: '',
		gender: 'female',
	},
	{
		name: 'edini',
		slug: 'edini',
		logo: '',
		gender: 'female',
	},
	{
		name: 'erroris.ltd',
		slug: 'erroris.ltd',
		logo: '',
		gender: 'female',
	},
	{
		name: 'gola',
		slug: 'gola',
		logo: '',
		gender: 'female',
	},
	{
		name: 'h2b',
		slug: 'h2b',
		logo: '',
		gender: 'female',
	},
	{
		name: 'joie-des-roses',
		slug: 'joie-des-roses',
		logo: '',
		gender: 'female',
	},
	{
		name: 'jubin-studio',
		slug: 'jubin-studio',
		logo: '',
		gender: 'female',
	},
	{
		name: 'celeste-studio',
		slug: 'celeste-studio',
		logo: '',
		gender: 'female',
	},
	{
		name: 'just-etro-gang',
		slug: 'just-etro-gang',
		logo: '',
		gender: 'female',
	},
	{
		name: 'kido',
		slug: 'kido',
		logo: '',
		gender: 'female',
	},
	{
		name: 'levents',
		slug: 'levents',
		logo: '',
		gender: 'female',
	},
	{
		name: 'bad-habits',
		slug: 'bad-habits',
		logo: '',
		gender: 'female',
	},
	{
		name: 'beachclub.official',
		slug: 'beachclub.official',
		logo: '',
		gender: 'female',
	},
	{
		name: 'berta',
		slug: 'berta',
		logo: '',
		gender: 'female',
	},
	{
		name: 'cara-club',
		slug: 'cara-club',
		logo: '',
		gender: 'female',
	},
	{
		name: 'ceci-cela',
		slug: 'ceci-cela',
		logo: '',
		gender: 'female',
	},
	{
		name: 'celine',
		slug: 'celine',
		logo: '',
		gender: 'female',
	},
	{
		name: 'colin',
		slug: 'colin',
		logo: '',
		gender: 'female',
	},
	{
		name: 'demobaza',
		slug: 'demobaza',
		logo: '',
		gender: 'female',
	},
	{
		name: 'diane',
		slug: 'diane',
		logo: '',
		gender: 'female',
	},
	{
		name: 'hani',
		slug: 'hani',
		logo: '',
		gender: 'female',
	},
	{
		name: 'huelley-rose',
		slug: 'huelley-rose',
		logo: '',
		gender: 'female',
	},
	{
		name: 'hurricane-b',
		slug: 'hurricane-b',
		logo: '',
		gender: 'female',
	},
	{
		name: 'fig.cool-leather',
		slug: 'fig.cool-leather',
		logo: '',
		gender: 'female',
	},
	{
		name: 'libeworkshop',
		slug: 'libeworkshop',
		logo: '',
		gender: 'female',
	},
	{
		name: 'liniss-official',
		slug: 'liniss-official',
		logo: '',
		gender: 'female',
	},
	{
		name: 'meanbldv',
		slug: 'meanbldv',
		logo: '',
		gender: 'female',
	},
	{
		name: 'milk-white',
		slug: 'milk-white',
		logo: '',
		gender: 'female',
	},
	{
		name: 'mono-talk',
		slug: 'mono-talk',
		logo: '',
		gender: 'female',
	},
	{
		name: 'monroe-the-label',
		slug: 'monroe-the-label',
		logo: '',
		gender: 'female',
	},
	{
		name: 'naked',
		slug: 'naked',
		logo: '',
		gender: 'female',
	},
	{
		name: 'nakedandfamousdenim',
		slug: 'nakedandfamousdenim',
		logo: '',
		gender: 'female',
	},
	{
		name: 'zd-eye-of-the-storm',
		slug: 'zd-eye-of-the-storm',
		logo: '',
		gender: 'female',
	},
	{
		name: 'abercrombie',
		slug: 'abercrombie',
		logo: '',
		gender: 'female',
	},
	{
		name: 'oceania-london',
		slug: 'oceania-london',
		logo: '',
		gender: 'female',
	},
	{
		name: 'cortana',
		slug: 'cortana',
		logo: '',
		gender: 'female',
	},
]

// TODO: Update this to use the collections from the database
// TODO: rename "collections" to something better, we already have Meteor "collections" and a Collection type.
export const collections = toSolidSignal<Collection[]>(() => {
	return legacyCollections
})
