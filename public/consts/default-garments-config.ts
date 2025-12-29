// Configure default garments per avatar gender
// Add/modify entries here to customize default selections

import type {DefaultGarmentsConfig} from '../types/default-garments'

export const defaultGarmentsConfig: DefaultGarmentsConfig = {
	female: [
		{
			category: 'Top',
			templateId: 'default-top',
			collection: 'default',
		},
		{
			category: 'Pants',
			templateId: 'default-shorts',
			collection: 'default',
		},
		{
			category: 'Shoes',
			templateId: 'default-shoes',
			collection: 'default',
		},
	],
	male: [
		{
			category: 'Top',
			templateId: 'default-male-top',
			collection: 'default',
		},
		{
			category: 'Pants',
			templateId: 'default-male-pants',
			collection: 'default',
		},
		{
			category: 'Shoes',
			templateId: 'default-male-shoes',
			collection: 'default',
		},
	],
}
