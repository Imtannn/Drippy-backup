import type {Block, BlockCategory} from './block'

export type TemplateCategory =
	| 'All'
	| 'Skirt'
	| 'Jacket'
	| 'Shirt'
	| 'Pants'
	| 'Accessories'
	| 'Dress'
	| 'Top'
	| 'Jumpsuit'
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
	avatar: 'male' | 'female'
	price?: string
	category: TemplateCategory
	materialId?: string // References fabric by "${materialName} ${category}" format
	extraMaterials?: ExtraMaterial[]
	fabricOptions?: string[] // Array of material IDs that reference fabrics
	blockOptions?: {category: BlockCategory; blocks: Block[]}[]
	collection?: string
}
