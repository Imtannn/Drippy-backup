export type BlockCategory = 'Bodice' | 'Skirt' | 'Sleeves' | 'Pants' | 'Template'

export type BlockAvatar = 'Male' | 'Female'

export type Block = {
	_id: string
	thumb: string
	modelFile: string
	blockName: string
	avatar: BlockAvatar
	category: BlockCategory
}
