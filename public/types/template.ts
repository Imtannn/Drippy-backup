export type TemplateCategory =
	| 'All'
	| 'Dress'
	| 'Skirt'
	| 'Jacket'
	| 'Shirt'
	| 'Pants'
	| 'Accessories'
	| 'Dress'
	| 'Top'
	| string // For custom categories

export type ExtraMaterial = {
	mesh: string
	materialId: string
}

export type Template = {
	_id: string
	thumb: string
	modelFile?: string // Optional since we're getting from blocks now
	name: string
	avatar: 'Male' | 'Female'
	price?: string
	category: TemplateCategory
	materialId?: string // References fabric by "${materialName} ${category}" format
	extraMaterials?: ExtraMaterial[]
}
