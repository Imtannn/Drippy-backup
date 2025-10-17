export type BlockCategory =
	| 'Bodice'
	| 'Sleeves'
	| 'Pants'
	| 'Bag'
	| 'Hat'
	| 'Full Body'
	| 'Accessory'
	| 'Skirt'
	| 'Coat'

export type TemplateCategory = 'Jacket' | 'Shirt' | 'Pants' | 'Accessories' | 'Dress' | 'Skirt' | 'Top' | string // For custom categories

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
}
