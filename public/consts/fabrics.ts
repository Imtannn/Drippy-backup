import type {Fabric} from '../types/fabric'

export const fabrics: Record<string, Fabric[]> = {
	baroudeuses: [
		{
			_id: '1',
			thumb:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/baroudeuses/root/Linen_-_38/Linen_-_38_-_Render.png',
			normal:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/baroudeuses/root/Linen_-_38/Linen_-_38_-_Normal_Map.jpg',
			baseColor:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/baroudeuses/root/Linen_-_38/Linen_-_38_-_Base_Color.jpg',
			displacement:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/baroudeuses/root/Linen_-_38/Linen_-_38_-_Displacement.jpg',
			roughness:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/baroudeuses/root/Linen_-_38/Linen_-_38_-_Roughness.jpg',
			materialName: '38',
			category: 'Linen',
			templateCategories: ['Pants', 'Shirt'],
		},
		{
			_id: '2',
			thumb:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/baroudeuses/root/Cotton_-_Taupe/Cotton_-_Taupe_-_Render.png',
			normal:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/baroudeuses/root/Cotton_-_Taupe/Cotton_-_Taupe_-_Normal_Map.jpg',
			baseColor: '',
			displacement:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/baroudeuses/root/Cotton_-_Taupe/Cotton_-_Taupe_-_Displacement.jpg',
			roughness:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/baroudeuses/root/Cotton_-_Taupe/Cotton_-_Taupe_-_Roughness.jpg',
			materialName: 'Taupe',
			category: 'Cotton',
			templateCategories: ['Pants', 'Shirt'],
		},
		{
			_id: '3',
			thumb:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/baroudeuses/root/Silk_-_Herringbone/Silk_-_Herringbone_-_Render.png',
			normal:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/baroudeuses/root/Silk_-_Herringbone/Silk_-_Herringbone_-_Normal_Map.jpg',
			baseColor:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/baroudeuses/root/Silk_-_Herringbone/Silk_-_Herringbone_-_Base_color.jpg',
			displacement:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/baroudeuses/root/Silk_-_Herringbone/Silk_-_Herringbone_-_Displacement.jpg',
			roughness:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/baroudeuses/root/Silk_-_Herringbone/Silk_-_Herringbone_-_Roughness.jpg',
			materialName: 'Herringbone',
			category: 'Silk',
			templateCategories: ['Pants', 'Shirt'],
		},
	],
	moidien: [
		{
			_id: '1',
			thumb:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/moidien/Accessories/Material_10/PLEATED_FABRIC_-_BLACK_-_RENDER.png',
			normal:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/moidien/Accessories/Material_10/PLEATED_FABRIC_-_BLACK_-_NORMAL.jpg',
			baseColor:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/moidien/Accessories/Material_10/PLEATED_FABRIC_-_BLACK_-_BASE.jpg',
			displacement:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/moidien/Accessories/Material_10/PLEATED_FABRIC_-_BLACK_-_DISPLACE.jpg',
			roughness:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/moidien/Accessories/Material_10/PLEATED_FABRIC_-_BLACK_-_ROUGH.jpg',
			materialName: 'Black',
			category: 'Pleated Fabric',
			templateCategories: ['Accessories'],
		},
		{
			_id: '2',
			thumb:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/moidien/Accessories/Material_2/PLEATED_FABRIC_-_WHITE_-_RENDER.png',
			normal:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/moidien/Accessories/Material_2/PLEATED_FABRIC_-_WHITE_-_NORMAL.jpg',
			baseColor:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/moidien/Accessories/Material_2/PLEATED_FABRIC_-_WHITE_-_BASE.jpg',
			displacement:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/moidien/Accessories/Material_2/PLEATED_FABRIC_-_WHITE_-_DISPLACE.jpg',
			roughness:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/moidien/Accessories/Material_2/PLEATED_FABRIC_-_WHITE_-_ROUGH.jpg',
			materialName: 'White',
			category: 'Pleated Fabric',
			templateCategories: ['Accessories', 'Shirt'],
		},
		{
			_id: '3',
			thumb:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/moidien/Dress/Material_3/COTTON_-_TAUPE_-_RENDER.png',
			normal:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/moidien/Dress/Material_3/COTTON_-_TAUPE_-_NORMAL.jpg',
			baseColor:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/moidien/Dress/Material_3/COTTON_-_TAUPE_-_BASE.jpg',
			displacement:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/moidien/Dress/Material_3/COTTON_-_TAUPE_-_DISPLACE.jpg',
			roughness:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/moidien/Dress/Material_3/COTTON_-_TAUPE_-_ROUGH.jpg',
			materialName: 'Taupe',
			category: 'Cotton',
			templateCategories: ['Dress'],
		},
		{
			_id: '5',
			thumb:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/moidien/Shirt/Material_12/SEERSUCKER_FABRIC_-_BLACK_-_RENDER.png',
			normal:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/moidien/Shirt/Material_12/SEERSUCKER_FABRIC_-_BLACK_-_NORMAL.jpg',
			baseColor:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/moidien/Shirt/Material_12/SEERSUCKER_FABRIC_-_BLACK_-_BASE.jpg',
			displacement:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/moidien/Shirt/Material_12/SEERSUCKER_FABRIC_-_BLACK_-_DISPLACE.jpg',
			roughness:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/moidien/Shirt/Material_12/SEERSUCKER_FABRIC_-_BLACK_-_ROUGH.jpg',
			materialName: 'Black',
			category: 'Seersucker Fabric',
			templateCategories: ['Shirt'],
		},
		{
			_id: '6',
			thumb:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/moidien/Shirt/Material_11/COTTON_-_WHITE_-_RENDER.png',
			normal:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/moidien/Shirt/Material_11/COTTON_-_WHITE_-_NORMAL.jpg',
			baseColor:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/moidien/Shirt/Material_11/COTTON_-_WHITE_-_BASE.jpg',
			displacement:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/moidien/Shirt/Material_11/COTTON_-_WHITE_-_DISPLACE.jpg',
			roughness:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/moidien/Shirt/Material_11/COTTON_-_WHITE_-_ROUGH.jpg',
			materialName: 'White',
			category: 'Cotton',
			templateCategories: ['Shirt'],
		},
		{
			_id: '7',
			thumb:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/moidien/Shirt/Materials_8/CRINKLE_FABRIC_-_NAVY_-_RENDER.png',
			normal:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/moidien/Shirt/Materials_8/CRINKLE_FABRIC_-_NAVY_-_NORMAL.jpg',
			baseColor:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/moidien/Shirt/Materials_8/CRINKLE_FABRIC_-_NAVY_-_BASE.jpg',
			displacement:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/moidien/Shirt/Materials_8/CRINKLE_FABRIC_-_NAVY_-_DISPLACE.jpg',
			roughness:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/moidien/Shirt/Materials_8/CRINKLE_FABRIC_-_NAVY_-_ROUGH.jpg',
			materialName: 'Navy',
			category: 'Crinkle Fabric',
			templateCategories: ['Shirt'],
		},
		{
			_id: '8',
			thumb:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/moidien/Pants/Material_7/COTTON_-_BLACK_-_RENDER.png',
			normal:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/moidien/Pants/Material_7/COTTON_-_BLACK_-_NORMAL.jpg',
			baseColor:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/moidien/Pants/Material_7/COTTON_-_BLACK_-_BASE.jpg',
			displacement:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/moidien/Pants/Material_7/COTTON_-_BLACK_-_DISPLACE.jpg',
			roughness:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/moidien/Pants/Material_7/COTTON_-_BLACK_-_ROUGH.jpg',
			materialName: 'Black',
			category: 'Cotton',
			templateCategories: ['Pants'],
		},
		{
			_id: '9',
			thumb:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/moidien/Pants/Material_4/COTTON_-_TWILL_-_RENDER.png',
			normal:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/moidien/Pants/Material_4/COTTON_-_TWILL_-_NORMAL.jpg',
			baseColor:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/moidien/Pants/Material_4/COTTON_-_TWILL_-_BASE.jpg',
			displacement:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/moidien/Pants/Material_4/COTTON_-_TWILL_-_DISPLACE.jpg',
			roughness:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/moidien/Pants/Material_4/COTTON_-_TWILL_-_ROUGH.jpg',
			materialName: 'Twill',
			category: 'Cotton',
			templateCategories: ['Pants'],
		},
	],
	vaishnavi: [
		{
			_id: '1',
			thumb:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/vaishnavi/root/SILK_-_DUSTY__MOCHA/SILK_-_DUSTY_MOCHA_-_RENDER.png',
			normal:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/vaishnavi/root/SILK_-_DUSTY__MOCHA/SILK_-_DUSTY_MOCHA_-_NORMAL.jpg',
			baseColor:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/vaishnavi/root/SILK_-_DUSTY__MOCHA/SILK_-_DUSTY_MOCHA_-_BASE_COLOR.jpg',
			displacement:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/vaishnavi/root/SILK_-_DUSTY__MOCHA/SILK_-_DUSTY_MOCHA_-_DISPLACEMENT.jpg',
			roughness:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/vaishnavi/root/SILK_-_DUSTY__MOCHA/SILK_-_DUSTY_MOCHA_-_ROUGH.jpg',
			materialName: 'Dusty  Mocha',
			category: 'Silk',
			templateCategories: [],
		},
		{
			_id: '2',
			thumb:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/vaishnavi/root/SILK_-_BLOOD_RED/SILK_-_BLOOD_RED_-_RENDER.png',
			normal:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/vaishnavi/root/SILK_-_BLOOD_RED/SILK_-_BLOOD_RED_-_NORMAL.jpg',
			baseColor:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/vaishnavi/root/SILK_-_BLOOD_RED/SILK_-_BLOOD_RED_-_BASE_COLOR.jpg',
			displacement:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/vaishnavi/root/SILK_-_BLOOD_RED/SILK_-_BLOOD_RED_-_DISPLACEMENT.jpg',
			roughness:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/vaishnavi/root/SILK_-_BLOOD_RED/SILK_-_BLOOD_RED_-_ROUGH.jpg',
			materialName: 'Blood Red',
			category: 'Silk',
			templateCategories: ['Dress'],
		},
		{
			_id: '3',
			thumb:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/vaishnavi/root/SILK_-_COCONUT_MILK/SILK_-_COCONUT_MILK_-_RENDER.png',
			normal:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/vaishnavi/root/SILK_-_COCONUT_MILK/SILK_-_COCONUT_MILK_-_NORMAL.jpg',
			baseColor:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/vaishnavi/root/SILK_-_COCONUT_MILK/SILK_-_COCONUT_MILK_-_BASE.jpg',
			displacement:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/vaishnavi/root/SILK_-_COCONUT_MILK/SILK_-_COCONUT_MILK_-_DISPLACE.jpg',
			roughness:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/vaishnavi/root/SILK_-_COCONUT_MILK/SILK_-_COCONUT_MILK_-_ROUGH.jpg',
			materialName: 'Coconut Milk',
			category: 'Silk',
			templateCategories: ['Dress'],
		},
		{
			_id: '4',
			thumb:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/vaishnavi/root/SEQUIN_-_281/SEQUIN_-_281_-_RENDER.png',
			normal:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/vaishnavi/root/SEQUIN_-_281/SEQUIN_-_281_-_NORMAL.jpg',
			baseColor:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/vaishnavi/root/SEQUIN_-_281/SEQUIN_-_281_-_BASE_COLOR.jpg',
			displacement:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/vaishnavi/root/SEQUIN_-_281/SEQUIN_-_281_-_DISPLACE.jpg',
			roughness:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/vaishnavi/root/SEQUIN_-_281/SEQUIN_-_281_-_ROUGH.jpg',
			materialName: '281',
			category: 'Sequin',
			templateCategories: ['Shirt', 'Skirt'],
		},
		{
			_id: '5',
			thumb:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/vaishnavi/root/SILK_-_BEIGE/SILK_-_BEIGE_-_RENDER_%281%29.png',
			normal:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/vaishnavi/root/SILK_-_BEIGE/SILK_-_BEIGE_-_NORMAL.jpg',
			baseColor:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/vaishnavi/root/SILK_-_BEIGE/SILK_-_BEIGE_-_BASE_COLOR.jpg',
			displacement:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/vaishnavi/root/SILK_-_BEIGE/SILK_-_BEIGE_-_DISPLACE.jpg',
			roughness:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/vaishnavi/root/SILK_-_BEIGE/SILK_-_BEIGE_-_ROUGH.jpg',
			materialName: 'Beige',
			category: 'Silk',
			templateCategories: ['Shirt', 'Skirt'],
		},
	],
	movement: [
		{
			_id: '1',
			thumb: '',
			normal:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/movement/root/SILK_-_CHIFFON_BLEND_/SILK_-_CHIFFON_BLEND_-_NORMAL.jpg',
			baseColor:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/movement/root/SILK_-_CHIFFON_BLEND_/SILK_-_CHIFFON_BLEND_-_BASE_COLOR.jpg',
			displacement:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/movement/root/SILK_-_CHIFFON_BLEND_/SILK_-_CHIFFON_BLEND_-_DISPLACE.jpg',
			roughness:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/movement/root/SILK_-_CHIFFON_BLEND_/SILK_-_CHIFFON_BLEND_-_ROUGH.jpg',
			materialName: 'Chiffon Blend',
			category: 'Silk',
			templateCategories: [],
		},
		{
			_id: '2',
			thumb:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/movement/root/SILK_-_CREPE_%28E8BBCA%29/SILK_-_CREPE_%28E8BBCA%29_-_RENDER.png',
			normal:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/movement/root/SILK_-_CREPE_%28E8BBCA%29/SILK_-_CREPE_%28E8BBCA%29_-_NORMAL.jpg',
			baseColor:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/movement/root/SILK_-_CREPE_%28E8BBCA%29/SILK_-_CREPE_%28E8BBCA%29_-_BASE.jpg',
			displacement:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/movement/root/SILK_-_CREPE_%28E8BBCA%29/SILK_-_CREPE_%28E8BBCA%29_-_DISPLACE.jpg',
			roughness:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/movement/root/SILK_-_CREPE_%28E8BBCA%29/SILK_-_CREPE_%28E8BBCA%29_-_ROUGH.jpg',
			materialName: 'Crepe (E8bbca)',
			category: 'Silk',
			templateCategories: ['Dress'],
		},
		{
			_id: '3',
			thumb:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/movement/root/SILK_-_CREPE_%28096372%29/SILK_-_CREPE_%28096372%29_-_RENDER.png',
			normal:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/movement/root/SILK_-_CREPE_%28096372%29/SILK_-_CREPE_%28096372%29_-_NORMAL.jpg',
			baseColor:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/movement/root/SILK_-_CREPE_%28096372%29/SILK_-_CREPE_%28096372%29_-_BASE.jpg',
			displacement:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/movement/root/SILK_-_CREPE_%28096372%29/SILK_-_CREPE_%28096372%29_-_DISPLACE.jpg',
			roughness:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/movement/root/SILK_-_CREPE_%28096372%29/SILK_-_CREPE_%28096372%29_-_ROUGH.jpg',
			materialName: 'Crepe (096372)',
			category: 'Silk',
			templateCategories: ['Dress'],
		},
		{
			_id: '4',
			thumb:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/movement/root/SILK_-_CREPE_%28D6E2EA%29/SILK_-_CREPE_%28D6E2EA%29_-_RENDER.png',
			normal:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/movement/root/SILK_-_CREPE_%28D6E2EA%29/SILK_-_CREPE_%28D6E2EA%29_-_NORMAL.jpg',
			baseColor:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/movement/root/SILK_-_CREPE_%28D6E2EA%29/SILK_-_CREPE_%28D6E2EA%29_-_BASE.jpg',
			displacement:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/movement/root/SILK_-_CREPE_%28D6E2EA%29/SILK_-_CREPE_%28D6E2EA%29_-_DISPLACE.jpg',
			roughness:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/movement/root/SILK_-_CREPE_%28D6E2EA%29/SILK_-_CREPE_%28D6E2EA%29_-_ROUGH.jpg',
			materialName: 'Crepe (D6e2ea)',
			category: 'Silk',
			templateCategories: ['Dress'],
		},
		{
			_id: '5',
			thumb:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/movement/root/SILK_-_CHIFFON/SILK_-_CHIFFON_-_RENDER.png',
			normal:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/movement/root/SILK_-_CHIFFON/SILK_-_CHIFFON_-_NORMAL.jpg',
			baseColor:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/movement/root/SILK_-_CHIFFON/SILK_-_CHIFFON_-_BASE.jpg',
			displacement:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/movement/root/SILK_-_CHIFFON/SILK_-_CHIFFON_-_DISPLACE.jpg',
			roughness:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/movement/root/SILK_-_CHIFFON/SILK_-_CHIFFON_-_ROUGH.jpg',
			materialName: 'Chiffon',
			category: 'Silk',
			templateCategories: ['Shirt', 'Skirt'],
		},
		{
			_id: '6',
			thumb:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/movement/root/SILK_-_CREPE/SILK_-_CREPE_-_RENDER.png',
			normal:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/movement/root/SILK_-_CREPE/SILK_-_CREPE_-_NORMAL.jpg',
			baseColor:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/movement/root/SILK_-_CREPE/SILK_-_CREPE_-_BASE.jpg',
			displacement:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/movement/root/SILK_-_CREPE/SILK_-_CREPE_-_DISPLACE.jpg',
			roughness:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/movement/root/SILK_-_CREPE/SILK_-_CREPE_-_ROUGH.jpg',
			materialName: 'Crepe',
			category: 'Silk',
			templateCategories: ['Shirt', 'Skirt'],
		},
	],
}
