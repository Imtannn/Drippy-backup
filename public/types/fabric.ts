export type Fabric = {
	_id: string
	thumb?: string
	normal?: string
	baseColor?: string
	displacement?: string
	roughness?: string
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
	templateCategory?: string
}
