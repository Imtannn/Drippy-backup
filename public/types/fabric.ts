export type FabricCategory =
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
	| 'Fur'
	| 'Abtract'
	| 'Twisted'
	| 'Velvet'
	| 'Scuba'
	| 'Fabric'
	| 'Poly'
	| 'Striped'
	| 'Polyester'
	| 'Knit'
	| string // for custom fabrics

export type Fabric = {
	_id: string
	thumb?: string
	normal?: string
	baseColor?: string
	displacement?: string
	roughness?: string
	alpha?: string
	assignedMesh?: string

	materialName: string
	category?: FabricCategory

	templateCategories?: string[]
}
