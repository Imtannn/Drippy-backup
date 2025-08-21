export type Block = {
	_id: string
	thumb: string
	modelFile: string
	blockName: string
	avatar: 'Male' | 'Female'
	category: 'Bodice' | 'Skirt' | 'Sleeves' | 'Pants' | 'Template'
}
