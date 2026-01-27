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
	/** @deprecated not usable for realtime graphics, requires very high poly models. */
	displacement?: string
	roughness?: string
	alpha?: string
	assignedMesh?: string
	scaleX?: number
	scaleY?: number
	offsetX?: number
	offsetY?: number
	coef?: number
	rotate?: number

	materialName: string
	category?: FabricCategory

	templateCategories?: string[]
	collection: string
}

export type FabricsByCategory = {
	[k in FabricCategory]?: Fabric[]
}
