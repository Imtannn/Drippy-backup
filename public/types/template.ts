export type TemplateCategory = 'Jacket' | 'Shirt' | 'Pants' | 'Accessories'

export type Template = {
	_id: string
	thumb: string
	modelFile?: string // Optional since we're getting from blocks now
	name: string
	avatar: 'Male' | 'Female'
	category: TemplateCategory
	materialId?: string // References fabric by "${materialName} ${category}" format
}
