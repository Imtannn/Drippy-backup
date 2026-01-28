import type {TemplateCategory} from './template'

export type BlockCategory =
	| 'Accessory'
	| 'Bag'
	| 'Bodice'
	| 'Coat'
	| 'Dress'
	| 'Full Body'
	| 'Hat'
	| 'Pants'
	| 'Shoes'
	| 'Skirt'
	| 'Sleeves'

export type BlockAvatar = 'male' | 'female'

export type Block = {
	_id: string
	thumb: string
	modelFile: string
	blockName: string
	avatar: BlockAvatar
	category: BlockCategory
	templateId?: string
	templateName?: string
	templateCategory: TemplateCategory
	collection: string
}
