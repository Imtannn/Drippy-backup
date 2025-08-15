export type Block = {
	_id: string
	thumb: URL
	modelFile: URL
	blockName: string
	avatar: 'Male' | 'Female'
	category: 'Bodice' | 'Skirt' | 'Sleeves' | 'Pants'
}
