import type {Texture} from 'three'

export type Fabric = {
	_id: string
	thumb?: string
	normal?: string
	baseColor?: string
	displacement?: string
	roughness?: string
	alpha?: string
	baseColorTex?: Texture | undefined
	normalTex?: Texture | undefined
	displacementTex?: Texture | undefined
	roughnessTex?: Texture | undefined
	alphaTex?: Texture | undefined

	materialName: string
	category?:
		| 'Cotton'
		| 'Leather'
		| 'Denim'
		| 'Spantex'
		| 'Jean'
		| 'Wool'
		| 'Linen'
		| 'Crinkle Fabric'
		| 'Pleated Fabric'
		| 'Seersucker Fabric'
		| 'Silk'
		| 'Sequin'
	templateCategories?: string[]
}
