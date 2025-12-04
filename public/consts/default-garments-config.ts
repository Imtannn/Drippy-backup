// Configure default garments per avatar gender
// Add/modify entries here to customize default selections

import type {DefaultGarmentsConfig} from '../types/default-garments'

export const defaultGarmentsConfig: DefaultGarmentsConfig = {
	female: [
		{
			category: 'Top',
			templateId: '3561a65f-fa86-416f-b219-030d1f0c8ccd',
			collection: 'shadow-grace',
		},
		{
			category: 'Pants',
			templateId: '365f8b52-3d5f-4eff-ad51-968773105a9a',
			collection: 'fige-dans-le-temps',
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
