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
			templateId: 'fc42c169-9c12-47d6-ba5d-06dec5bdbd0d',
			collection: '9heure19heure',
		},
		{
			category: 'Pants',
			templateId: 'd6d33246-4cb4-413d-ab35-b125ad74ef89',
			collection: '9heure19heure',
		},
	],
}
