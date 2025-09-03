export type BlockCategory = 'Bodice' | 'Sleeves' | 'Pants' | 'Bag' | 'Hat' | 'Full Body'
export type TemplateCategory = 'Jacket' | 'Shirt' | 'Pants' | 'Accessories' | 'Dress' | 'Skirt'

export type BlockAvatar = 'Male' | 'Female'

export type Block = {
	_id: string
	thumb: string
	modelFile: string
	blockName: string
	avatar: BlockAvatar
	category: BlockCategory
	templateId: string
	templateName: string
	templateCategory: TemplateCategory
}
