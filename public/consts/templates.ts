import type {Template} from '../types/template'

export const templates: Record<string, Template[]> = {
	vaishnavi: [
		{
			_id: '836d34da-5681-471d-9334-a786c841f5af',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/vaishnavi/templates/Top/Dusty_mocha_corset_-_250.webp',
			name: 'Dusty mocha corset',
			price: '250',
			avatar: 'female',
			category: 'Top',
			materialId: 'Silk - Dusty Mocha',
		},
		{
			_id: '4f528a03-1113-4e6a-bc2b-025a2e7add26',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/vaishnavi/templates/Top/Beaded_crop_top_-_250.webp',
			name: 'Beaded crop top',
			price: '250',
			avatar: 'female',
			category: 'Top',
			materialId: 'Sequin - 281',
		},
		{
			_id: '73356365-718f-4508-8b15-8a6276ee706f',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/vaishnavi/templates/Skirt/Dusty_mocha_skirt_-_150.webp',
			name: 'Dusty mocha skirt',
			price: '150',
			avatar: 'female',
			category: 'Skirt',
			materialId: 'Silk - Dusty Mocha',
		},
		{
			_id: '7ff95024-4d4d-4179-83b0-f87b29d292bd',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/vaishnavi/templates/Skirt/Draped_skirt_-_150.webp',
			name: 'Draped skirt',
			price: '150',
			avatar: 'female',
			category: 'Skirt',
			materialId: 'Sequin - 281',
		},
		{
			_id: '6209a01f-67f5-4864-b9f6-1e0b192f4315',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/vaishnavi/templates/Dress/One-piece_blood_dress_-_420.webp',
			name: 'One',
			price: 'N/A',
			avatar: 'female',
			category: 'Dress',
			materialId: 'Silk - Blood Red',
		},
		{
			_id: '5e246a49-efcf-4c7c-939d-34526848112d',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/vaishnavi/templates/Dress/One-piece_-_400.webp',
			name: 'One',
			price: 'N/A',
			avatar: 'female',
			category: 'Dress',
			materialId: 'Silk - Coconut Milk',
		},
	],
	haruki: [
		{
			_id: '7e65aaee-4565-47d1-acfd-a1d811c9662c',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/haruki/templates/Top/Wind_of_colors_-_2000.webp',
			name: 'Wind of colors',
			price: '2000',
			avatar: 'female',
			category: 'Top',
			materialId: 'Silk - Crepe',
		},
		{
			_id: '883d6e7c-5d81-48c1-a33b-f71170fdd477',
			thumb:
				'https://d1e6s1h8cqcr26.cloudfront.net/images/haruki/templates/Dress/Touch_of_mermaid_short_dress_-_2100.webp',
			name: 'Touch of mermaid short dress',
			price: '2100',
			avatar: 'female',
			category: 'Dress',
			materialId: 'Silk - Crepe (E8bbca)',
		},
		{
			_id: '52522d15-3b26-4437-b4a4-43ecc219a6b4',
			thumb:
				'https://d1e6s1h8cqcr26.cloudfront.net/images/haruki/templates/Dress/Dance_of_mermaid_mini_dress_-_2100.webp',
			name: 'Dance of mermaid mini dress',
			price: '2100',
			avatar: 'female',
			category: 'Dress',
			materialId: 'Silk - Crepe (D6e2ea)',
		},
		{
			_id: 'dfe09f25-df47-4739-8bd2-50e872222d67',
			thumb:
				'https://d1e6s1h8cqcr26.cloudfront.net/images/haruki/templates/Dress/Waves_of_colors_long_dress_-_2200.webp',
			name: 'Waves of colors long dress',
			price: '2200',
			avatar: 'female',
			category: 'Dress',
			materialId: 'Silk - Crepe',
			extraMaterials: [
				{
					mesh: 'base_drippy_tight_regular_shoulder_36-base_drippy_tight_regular_shoulder_35',
					materialId: 'Silk - Crepe (096372)',
				},
				{
					mesh: 'base_drippy_tight_regular_shoulder_33-base_drippy_tight_regular_shoulder_34',
					materialId: 'Silk - Chiffon (2ab4c8)',
				},
				{
					mesh: 'base_drippy_tight_regular_shoulder_31-base_drippy_tight_regular_shoulder_32',
					materialId: 'Silk - Crepe (D6e2ea)',
				},
			],
		},
		{
			_id: 'df2d6e23-b890-4464-a1ce-47c4d6f80a64',
			thumb:
				'https://d1e6s1h8cqcr26.cloudfront.net/images/haruki/templates/Dress/Waves_of_colors_mini_dress_-_2100.webp',
			name: 'Waves of colors mini dress',
			price: '2100',
			avatar: 'female',
			category: 'Dress',
			materialId: 'Silk - Crepe',
			extraMaterials: [
				{
					mesh: 'pattern_621662',
					materialId: 'Silk - Crepe (096372)',
				},
				{
					mesh: 'pattern_578230',
					materialId: 'Silk - Crepe (D6e2ea)',
				},
				{
					mesh: 'pattern_599284',
					materialId: 'Silk - Chiffon (2ab4c8)',
				},
			],
		},
		{
			_id: '605dafae-35aa-4a21-8073-5423dbc2cb53',
			thumb:
				'https://d1e6s1h8cqcr26.cloudfront.net/images/haruki/templates/Dress/Touch_of_mermaid_mini_dress_-_2100.webp',
			name: 'Touch of mermaid mini dress',
			price: '2100',
			avatar: 'female',
			category: 'Dress',
			materialId: 'Silk - Crepe (096372)',
		},
		{
			_id: '88bc28ab-ac04-4a2e-b87d-def761ae35e2',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/haruki/templates/Dress/Touch_of_mermaid_dress_-_2200.webp',
			name: 'Touch of mermaid dress',
			price: '2200',
			avatar: 'female',
			category: 'Dress',
			materialId: 'Silk - Crepe (096372)',
		},
		{
			_id: 'f002baf9-2376-40d1-8eea-8327f31f2be7',
			thumb:
				'https://d1e6s1h8cqcr26.cloudfront.net/images/haruki/templates/Dress/Touch_of_mermaid_long_dress_-_2200.webp',
			name: 'Touch of mermaid long dress',
			price: '2200',
			avatar: 'female',
			category: 'Dress',
			materialId: 'Silk - Crepe (E8bbca)',
		},
		{
			_id: 'd644c12e-6282-43b4-b4a1-d0a1cbd57163',
			thumb:
				'https://d1e6s1h8cqcr26.cloudfront.net/images/haruki/templates/Dress/Dance_of_mermaid_long_dress_-_2200.webp',
			name: 'Dance of mermaid long dress',
			price: '2200',
			avatar: 'female',
			category: 'Dress',
			materialId: 'Silk - Crepe (D6e2ea)',
		},
		{
			_id: 'e910268c-01b4-41ed-a473-03674f6348fb',
			thumb:
				'https://d1e6s1h8cqcr26.cloudfront.net/images/haruki/templates/Dress/Dance_in_the_sea_long_dress_-_2200.webp',
			name: 'Dance in the sea long dress',
			price: '2200',
			avatar: 'female',
			category: 'Dress',
			materialId: 'Silk - Chiffon (2ab4c8)',
		},
		{
			_id: '410ae5f9-08d3-4031-8434-13848d940709',
			thumb:
				'https://d1e6s1h8cqcr26.cloudfront.net/images/haruki/templates/Dress/Dance_in_the_sea_short_dress_-_2100.webp',
			name: 'Dance in the sea short dress',
			price: '2100',
			avatar: 'female',
			category: 'Dress',
			materialId: 'Silk - Chiffon (2ab4c8)',
		},
		{
			_id: '2f096d4d-d943-4ab1-9443-957d4cd8248e',
			thumb:
				'https://d1e6s1h8cqcr26.cloudfront.net/images/haruki/templates/Skirt/Wind_of_colors_mini_skirt_-_2100.webp',
			name: 'Wind of colors mini skirt',
			price: '2100',
			avatar: 'female',
			category: 'Skirt',
			materialId: 'Silk - Crepe',
			extraMaterials: [
				{
					mesh: 'pattern_609085-pattern_609088-pattern_609091',
					materialId: 'Silk - Crepe (096372)',
				},
				{
					mesh: 'pattern_609086-pattern_609089-pattern_609092',
					materialId: 'Silk - Chiffon (2ab4c8)',
				},
				{
					mesh: 'pattern_609084-pattern_609087-pattern_609090',
					materialId: 'Silk - Crepe (D6e2ea)',
				},
			],
		},
		{
			_id: 'fdea1b82-5d23-4532-adc7-ec747a91ed4f',
			thumb:
				'https://d1e6s1h8cqcr26.cloudfront.net/images/haruki/templates/Skirt/Wind_of_colors_long_skirt_-_2300.webp',
			name: 'Wind of colors long skirt',
			price: '2300',
			avatar: 'female',
			category: 'Skirt',
			materialId: 'Silk - Crepe',
			extraMaterials: [
				{
					mesh: 'pattern_609100-pattern_609090-pattern_609093-pattern_609095',
					materialId: 'Silk - Crepe (096372)',
				},
				{
					mesh: 'pattern_609101-pattern_609097-pattern_609091-pattern_609096',
					materialId: 'Silk - Chiffon (2ab4c8)',
				},
				{
					mesh: 'pattern_609086-pattern_609088-pattern_609092-pattern_609094',
					materialId: 'Silk - Crepe (D6e2ea)',
				},
			],
		},
	],
	lostCause: [
		{
			_id: '604768cb-bb37-40dd-a23c-bd00a51ab453',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/lostCause/templates/Top/Knitted_Jacket_-_350.webp',
			name: 'Knitted Jacket',
			price: '350',
			avatar: 'female',
			category: 'Top',
			materialId: 'Wool - Yarn',
		},
		{
			_id: 'ddc6b788-ec44-43da-a5dc-d32da98c478a',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/lostCause/templates/Top/Knitted_Top_-_250.webp',
			name: 'Knitted Top',
			price: '250',
			avatar: 'female',
			category: 'Top',
			materialId: 'Wool - Black Twisted',
		},
		{
			_id: 'c5fb6710-fa66-4e84-8650-01bf71931124',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/lostCause/templates/Top/Cropped_mini_jacket_-_350.webp',
			name: 'Cropped mini jacket',
			price: '350',
			avatar: 'female',
			category: 'Top',
			materialId: 'Wool - Yarn',
		},
		{
			_id: '25b01105-43b9-4239-9e40-41676f8d3991',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/lostCause/templates/Top/Knitted_open_top_-_220.webp',
			name: 'Knitted open top',
			price: '220',
			avatar: 'female',
			category: 'Top',
			materialId: 'Wool - Black Twisted',
			extraMaterials: [
				{
					mesh: 'avatar',
					materialId: 'Silk - Black',
				},
			],
		},
		{
			_id: '4573e379-92a4-4f20-967c-5d272616ccd3',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/lostCause/templates/Top/Pagoda_Sleeve_Top_-_350.webp',
			name: 'Pagoda Sleeve Top',
			price: '350',
			avatar: 'female',
			category: 'Top',
			materialId: 'Wool - Yarn',
		},
		{
			_id: '2a028d16-3e37-444e-aafb-060b8027a2eb',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/lostCause/templates/Top/Manipulation_top_-_250.webp',
			name: 'Manipulation top',
			price: '250',
			avatar: 'female',
			category: 'Top',
			materialId: 'Wool - Yarn',
		},
		{
			_id: 'c8d0ad22-4b16-4cb6-b705-596ce6f7a47f',
			thumb:
				'https://d1e6s1h8cqcr26.cloudfront.net/images/lostCause/templates/Top/Knitted_sleeveless_wool_top_-_0.webp',
			name: 'Knitted sleeveless wool top',
			price: '0',
			avatar: 'female',
			category: 'Top',
			materialId: 'Wool - Twisted',
		},
		{
			_id: 'c8070c99-dab6-4539-a173-9b9918bc2c45',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/lostCause/templates/Top/Top_-_0.webp',
			name: 'Top',
			price: '0',
			avatar: 'female',
			category: 'Top',
			materialId: 'Wool - Black Twisted',
		},
		{
			_id: 'db145519-4ecf-4381-86da-6332ef8f3458',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/lostCause/templates/Top/Jacket_-_0.webp',
			name: 'Jacket',
			price: '0',
			avatar: 'female',
			category: 'Top',
			materialId: 'Leather - Print',
		},
		{
			_id: 'e934fe93-d274-44da-8793-3d4ebed2fb11',
			thumb:
				'https://d1e6s1h8cqcr26.cloudfront.net/images/lostCause/templates/Dress/Midi_manipulation_dress_-_600.webp',
			name: 'Midi manipulation dress',
			price: '600',
			avatar: 'female',
			category: 'Dress',
			materialId: 'Wool - Yarn',
		},
		{
			_id: 'c238a279-7546-4edc-9419-16884f9030c8',
			thumb:
				'https://d1e6s1h8cqcr26.cloudfront.net/images/lostCause/templates/Skirt/Knitted_wool/organza_skirt__-_500.webp',
			name: 'Knitted wool/organza skirt',
			price: '500',
			avatar: 'female',
			category: 'Skirt',
			materialId: 'Twisted - Yarn',
			extraMaterials: [
				{
					mesh: 'pattern_645432_node-pattern_645431_node',
					materialId: 'Abtract - Navy Face',
				},
			],
		},
		{
			_id: 'aaacdc1d-9a61-4f50-8677-68b470a913d6',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/lostCause/templates/Skirt/Chunky_long_skirt_-_550.webp',
			name: 'Chunky long skirt',
			price: '550',
			avatar: 'female',
			category: 'Skirt',
			materialId: 'Silk - Charcoal Gray',
			extraMaterials: [
				{
					mesh: 'pattern_2271989',
					materialId: 'Wool - Yarn',
				},
			],
		},
		{
			_id: '91885e70-cb0c-41ad-9bcd-3ca49897fe83',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/lostCause/templates/Pants/Linen_fringed_trousers_-_500.webp',
			name: 'Linen fringed trousers',
			price: '500',
			avatar: 'female',
			category: 'Pants',
			materialId: 'Leather - Print',
		},
		{
			_id: 'c89cd8fb-83ee-4328-b0a2-e922d15268db',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/lostCause/templates/Pants/Organza_trousers_-_450.webp',
			name: 'Organza trousers',
			price: '450',
			avatar: 'female',
			category: 'Pants',
			materialId: 'Abtract - Black Face',
			extraMaterials: [
				{
					mesh: 'pattern_7459227-pattern_7459226',
					materialId: 'Wool - Yarn',
				},
			],
		},
	],
	shri: [
		{
			_id: '2598dcc7-eb64-4613-a89b-28aee204473e',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/shri/templates/Top/White_Quilted_Jacket_-_150.webp',
			name: 'White Quilted Jacket',
			price: '150',
			avatar: 'female',
			category: 'Top',
			materialId: 'Quilting - White',
			extraMaterials: [
				{
					mesh: 'binding_21901279-pattern_686569-pattern_686567-base_drippy_tight_regular_shoulder_23-base_drippy_tight_regular_shoulder_25-base_drippy_tight_regular_shoulder_27-base_drippy_tight_regular_shoulder_33',
					materialId: 'Fabric - Golden',
				},
				{
					mesh: 'base_drippy_tight_regular_shoulder_69-base_drippy_tight_regular_shoulder_71-base_drippy_tight_regular_shoulder_64-base_drippy_tight_regular_shoulder_73-base_drippy_tight_regular_shoulder_76-base_drippy_tight_regular_shoulder_75',
					materialId: 'Gold - Mesh Small',
				},
				{
					mesh: 'base_drippy_tight_regular_shoulder_67-base_drippy_tight_regular_shoulder_74-base_drippy_tight_regular_shoulder_65-base_drippy_tight_regular_shoulder_72',
					materialId: 'Gold - Mesh',
				},
			],
		},
		{
			_id: '34721360-3545-47ad-9eff-df217375bc05',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/shri/templates/Top/Bobbin_Lace_Crop_Top_-_150.webp',
			name: 'Bobbin Lace Crop Top',
			price: '150',
			avatar: 'female',
			category: 'Top',
			materialId: 'Organza - Black',
			extraMaterials: [
				{
					mesh: 'pattern_1156603-pattern_1156607-pattern_1156608-pattern_1156605',
					materialId: 'Silk - Black',
				},
				{
					mesh: 'pattern_17355264-pattern_1156601',
					materialId: 'Lace - Tulle',
				},
			],
		},
		{
			_id: 'd5f1710b-f84b-4406-a638-2cba169ab773',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/shri/templates/Top/White_Crop_Shirt_with_Pockets_-_100.webp',
			name: 'White Crop Shirt with Pockets',
			price: '100',
			avatar: 'female',
			category: 'Top',
			materialId: 'Cotton - White',
		},
		{
			_id: '39727300-2a47-4f83-b434-8236cc08b828',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/shri/templates/Top/Corset_-_150.webp',
			name: 'Corset',
			price: '150',
			avatar: 'female',
			category: 'Top',
			materialId: 'Velvet - Black',
		},
		{
			_id: '9350f250-b2c2-4c00-be56-1ccaaf850b28',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/shri/templates/Top/Gold_Quilted_Top_with_Flower_-_200.webp',
			name: 'Gold Quilted Top with Flower',
			price: '200',
			avatar: 'female',
			category: 'Top',
			materialId: 'Quilting - Golden',
		},
		{
			_id: '121315a1-44a5-4231-85b5-d767f6345bed',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/shri/templates/Top/Gold_Quilted_Top_-_100.webp',
			name: 'Gold Quilted Top',
			price: '100',
			avatar: 'female',
			category: 'Top',
			materialId: 'Quilting - Golden',
			extraMaterials: [
				{
					mesh: 'pattern_1248603-pattern_1251950-pattern_1248600-pattern_1248599',
					materialId: 'Mesh - Metallic',
				},
			],
		},
		{
			_id: '76b0ace1-833d-4c60-8434-a82152cff911',
			thumb:
				'https://d1e6s1h8cqcr26.cloudfront.net/images/shri/templates/Top/Black_Crop_Jacket_With_Balloon_Sleeves_-_220.webp',
			name: 'Black Crop Jacket With Balloon Sleeves',
			price: '220',
			avatar: 'female',
			category: 'Top',
			materialId: 'Silk - Black',
			extraMaterials: [
				{
					mesh: 'pattern_3187427_node-vtt_25_node-vtt_29_node',
					materialId: 'Lace - Golden',
				},
			],
		},
		{
			_id: '23b8498a-6c8e-4369-b98a-0c98c2c56903',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/shri/templates/Top/Hand_Woven_Bobbin_Lace_Bib_-_200.webp',
			name: 'Hand Woven Bobbin Lace Bib',
			price: '200',
			avatar: 'female',
			category: 'Top',
			materialId: 'Seersucker - Seethrough',
			extraMaterials: [
				{
					mesh: 'pattern_3461812-pattern_3461811',
					materialId: 'Gold - Mesh',
				},
			],
		},
		{
			_id: '02baaf88-92e4-4df9-94d0-0b18f1a03cec',
			thumb:
				'https://d1e6s1h8cqcr26.cloudfront.net/images/shri/templates/Top/White_Shirt_with_Balloon_Sleeves_-_100.webp',
			name: 'White Shirt with Balloon Sleeves',
			price: '100',
			avatar: 'female',
			category: 'Top',
			materialId: 'Cotton - White',
		},
		{
			_id: '8513db15-e848-4474-b129-17dfaad7e667',
			thumb:
				'https://d1e6s1h8cqcr26.cloudfront.net/images/shri/templates/Top/Gold_Crop_Jacket_with_Flower_Brooch_-_100.webp',
			name: 'Gold Crop Jacket with Flower Brooch',
			price: '100',
			avatar: 'female',
			category: 'Top',
			materialId: 'Fabric - Golden',
		},
		{
			_id: '9d15ffb8-24c8-480d-b3ca-ad5f4519d525',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/shri/templates/Skirt/White_Quilted_Midi_Skirt_-_120.webp',
			name: 'White Quilted Midi Skirt',
			price: '120',
			avatar: 'female',
			category: 'Skirt',
			materialId: 'Quilting - White',
		},
		{
			_id: '26069ad9-dfaf-40d3-bd9f-0c1f9f6381b0',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/shri/templates/Skirt/Gold_Quilted_Skirt_-_250.webp',
			name: 'Gold Quilted Skirt',
			price: '250',
			avatar: 'female',
			category: 'Skirt',
			materialId: 'Fabric - Golden',
			extraMaterials: [
				{
					mesh: 'base_drippy_tight_regular_shoulder_25-base_drippy_tight_regular_shoulder_5-base_drippy_tight_regular_shoulder_16-base_drippy_tight_regular_shoulder_18',
					materialId: 'Quilting - Golden',
				},
			],
		},
		{
			_id: 'e2de216f-5110-4f8d-be26-9180d9294601',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/shri/templates/Skirt/Gold_Mini_Skirt_-_100.webp',
			name: 'Gold Mini Skirt',
			price: '100',
			avatar: 'female',
			category: 'Skirt',
			materialId: 'Fabric - Golden',
		},
		{
			_id: '49d31a05-720f-4714-807b-594d40bc30af',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/shri/templates/Skirt/Layered_Long_Skirt_-_100.webp',
			name: 'Layered Long Skirt',
			price: '100',
			avatar: 'female',
			category: 'Skirt',
			materialId: 'Mesh - Metallic',
			extraMaterials: [
				{
					mesh: 'pattern_148545-pattern_148552-pattern_148554-pattern_148548-pattern_148544-pattern_148546',
					materialId: 'Tape - Gold',
				},
			],
		},
		{
			_id: '6b860286-b896-4645-b299-18f326a02e6d',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/shri/templates/Accesorries/White_Berret_Hat_-_60.webp',
			name: 'White Berret Hat',
			price: '60',
			avatar: 'female',
			category: 'Accesorries',
			materialId: 'Quilting - White',
		},
		{
			_id: 'd9647874-f0d9-49a2-b257-e05dd9636e83',
			thumb:
				'https://d1e6s1h8cqcr26.cloudfront.net/images/shri/templates/Pants/"Drama_Queen"_Quilted_Wide_leg_Pant_-_300.webp',
			name: '"Drama Queen" Quilted Wide leg Pant',
			price: '300',
			avatar: 'female',
			category: 'Pants',
			materialId: 'Silk - Bronze',
			extraMaterials: [
				{
					mesh: 'trim',
					materialId: 'Trim - Texture',
				},
			],
		},
		{
			_id: '968d3a86-00ed-49bf-8cb5-60f5a840b920',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/shri/templates/Pants/Quilted_Black_Culotte_-_200.webp',
			name: 'Quilted Black Culotte',
			price: '200',
			avatar: 'female',
			category: 'Pants',
			materialId: 'Quilting - Black',
			extraMaterials: [
				{
					mesh: 'topstitch-pattern_118853',
					materialId: 'Fabric - Golden',
				},
			],
		},
	],
	eliseF: [
		{
			_id: '63bbf581-6141-48a6-9d55-7bf3798b6cce',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/eliseF/templates/Top/Reversible_Jacket_-_180.webp',
			name: 'Reversible Jacket',
			price: '180',
			avatar: 'female',
			category: 'Top',
			materialId: 'Striped - Canvas',
			extraMaterials: [
				{
					mesh: '53-49-51-50-48-42-47-pattern_8255504-pattern_8255505-25-31-44',
					materialId: 'Polyester - Navy',
				},
				{
					mesh: 'buttonhead',
					materialId: 'Cotton - Orange',
				},
			],
		},
		{
			_id: 'f7e0c226-7450-468c-845d-6fbf2bc9f821',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/eliseF/templates/Top/Oversized_Bomber_-_230.webp',
			name: 'Oversized Bomber',
			price: '230',
			avatar: 'female',
			category: 'Top',
			materialId: 'Polyester - Navy',
			extraMaterials: [
				{
					mesh: '42-44-31-23-6-9-41-27',
					materialId: 'Knit - Fleece',
				},
			],
		},
		{
			_id: '7c6fec02-7fd8-48a6-bf45-40526ab97af0',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/eliseF/templates/Top/Mesh_shirt_LS_-_140.webp',
			name: 'Mesh shirt LS',
			price: '140',
			avatar: 'female',
			category: 'Top',
			materialId: 'Cotton - White',
			extraMaterials: [
				{
					mesh: 'body_back_yoke_23-piece15-tie_8-piece14-piece11-piece10-pattern2d_81354-pattern_11338152-pattern_11338149-pattern_11338146-pattern_11338140-pattern_11338143-pattern_11338137-pattern_7374393-body_front_placket_13-body_back_yoke_30-body_front_11-body_back_yoke_29-body_front_placket_12-buttonhead-body_back_yoke_24-body_front_9-body_back_yoke_27',
					materialId: 'Cotton - Orange',
				},
			],
		},
		{
			_id: '06538d6c-0332-455c-8dcb-0ddb49a394a3',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/eliseF/templates/Top/Hoodie_-_90.webp',
			name: 'Hoodie',
			price: '90',
			avatar: 'female',
			category: 'Top',
			materialId: 'Knit - Fleece',
			extraMaterials: [
				{
					mesh: 'pattern_35-pattern_36',
					materialId: 'Cotton - Orange',
				},
			],
		},
		{
			_id: '8d4a1b7c-e881-4d5a-8dd9-7e43bcdffba9',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/eliseF/templates/Top/Pleats_shirt_-_130.webp',
			name: 'Pleats shirt',
			price: '130',
			avatar: 'female',
			category: 'Top',
			materialId: 'Cotton - Lavender Blue',
			extraMaterials: [
				{
					mesh: 'buttonhead-pattern_12455102-pattern_12455100-pattern_12455098-pattern_12455096-pattern_12455093-pattern_12455094',
					materialId: 'Cotton - Orange',
				},
			],
		},
		{
			_id: '40cb3909-d52c-4267-a554-cb1dad3108fe',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/eliseF/templates/Top/Mesh_shirt_SS_-_130.webp',
			name: 'Mesh shirt SS',
			price: '130',
			avatar: 'female',
			category: 'Top',
			materialId: 'Cotton - White',
			extraMaterials: [
				{
					mesh: 'pattern_11338152-pattern_7374393-body_back_yoke_23-body_back_yoke_29-body_back_yoke_30-body_back_yoke_24-body_back_yoke_27-body_front_placket_12-body_front_placket_13-body_front_9-body_front_11-buttonhead-pattern_11338149-pattern_11338146-pattern_11338143-pattern_11338140-pattern_11338137-tie_8-pattern2d_81354-piece10-piece14-piece11-piece15',
					materialId: 'Cotton - Orange',
				},
			],
		},
		{
			_id: '2c5b1c58-541c-4b4e-9a37-e9c0a8772cd5',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/eliseF/templates/Top/Tanktop_-_45.webp',
			name: 'Tanktop',
			price: '45',
			avatar: 'female',
			category: 'Top',
			materialId: 'Striped - Tanktop',
			extraMaterials: [
				{
					mesh: 'topstitch-front_13-front_11-front_8-front_12-front_7-front_5',
					materialId: 'Poly - Twill',
				},
			],
		},
		{
			_id: '0c551054-375c-4e65-8189-0ae95e14fc38',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/eliseF/templates/Pants/Oversized_Denim_Pants_-_180.webp',
			name: 'Oversized Denim Pants',
			price: '180',
			avatar: 'female',
			category: 'Pants',
			materialId: 'Denim - 276',
		},
		{
			_id: '878465cd-06b8-42f2-a2f0-6f31e3489077',
			thumb:
				'https://d1e6s1h8cqcr26.cloudfront.net/images/eliseF/templates/Pants/Denim_Pockets_Pants_+_Bermuda_Short_-_300.webp',
			name: 'Denim Pockets Pants + Bermuda Short',
			price: '300',
			avatar: 'female',
			category: 'Pants',
			materialId: 'Polyester - Navy',
			extraMaterials: [
				{
					mesh: 'pattern_15153799',
					materialId: 'Poly - Dusty Blue',
				},
				{
					mesh: '40-37-42-39',
					materialId: 'Denim - Back',
				},
				{
					mesh: '26-35-33-41-38-43-34',
					materialId: 'Denim - 276',
				},
			],
		},
		{
			_id: '9ad94a5d-3f47-4caa-b874-85bc3d9b35b1',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/eliseF/templates/Pants/Bermuda_Short_-_100.webp',
			name: 'Bermuda Short',
			price: '100',
			avatar: 'female',
			category: 'Pants',
			materialId: 'Polyester - Navy',
			extraMaterials: [
				{
					mesh: 'pattern_15153799',
					materialId: 'Poly - Dusty Blue',
				},
			],
		},
		{
			_id: '55e693ea-106e-4d8d-bb39-8e7988ce66fc',
			thumb:
				'https://d1e6s1h8cqcr26.cloudfront.net/images/eliseF/templates/Pants/Denim_Pocket_Pants_+_Pleats_Skirt_-_285.webp',
			name: 'Denim Pocket Pants + Pleats Skirt',
			price: '285',
			avatar: 'female',
			category: 'Pants',
			materialId: 'Denim - 276',
			extraMaterials: [
				{
					mesh: '42-40-37-39',
					materialId: 'Denim - Back',
				},
				{
					mesh: '29-11-24-28-9-4-15-16-13-12-8-14-3',
					materialId: 'Polyester - Navy',
				},
			],
		},
		{
			_id: 'b396effe-7525-4b89-9864-6385f733a154',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/eliseF/templates/Pants/Pleats_Skirt_-_85.webp',
			name: 'Pleats Skirt',
			price: '85',
			avatar: 'female',
			category: 'Pants',
			materialId: 'Polyester - Navy',
		},
		{
			_id: 'ab20c4c2-0cdb-4dd7-ac38-8a971a18d462',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/eliseF/templates/Pants/Track_Short_-_90.webp',
			name: 'Track Short',
			price: '90',
			avatar: 'female',
			category: 'Pants',
			materialId: 'Poly - Twill',
			extraMaterials: [
				{
					mesh: 'buttonhead',
					materialId: 'Cotton - Orange',
				},
				{
					mesh: 'pattern_4033755-pattern_4033757',
					materialId: 'Poly - Dusty Blue',
				},
			],
		},
		{
			_id: 'cf540fc1-d805-4e4d-8ba3-8b58b6c9aa29',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/eliseF/templates/Pants/Track_Pants_-_110.webp',
			name: 'Track Pants',
			price: '110',
			avatar: 'female',
			category: 'Pants',
			materialId: 'Poly - Twill',
			extraMaterials: [
				{
					mesh: 'buttonhead',
					materialId: 'Cotton - Orange',
				},
				{
					mesh: 'pattern_4033754-pattern_4033753',
					materialId: 'Poly - Dusty Blue',
				},
			],
		},
		{
			_id: '5fd47905-f3ac-45a2-bd2f-2bbf316e721e',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/eliseF/templates/Pants/Denim_Pockets_Pants_-_200.webp',
			name: 'Denim Pockets Pants',
			price: '200',
			avatar: 'female',
			category: 'Pants',
			materialId: 'Denim - 276',
			extraMaterials: [
				{
					mesh: '39-40-42-37',
					materialId: 'Denim - Back',
				},
			],
		},
	],
	oofya: [
		{
			_id: '0dac77ce-a8c1-4b3f-a57f-f30e3654b7fd',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/oofya/templates/Top/Frame_-_130_Euro.webp',
			name: 'Frame',
			price: '130',
			avatar: 'female',
			category: 'Top',
			materialId: 'Cotton - Black',
		},
		{
			_id: 'f9961e85-b08c-4e1a-8d3a-74d53c68a352',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/oofya/templates/Top/Whiteout_-_130_Euro.webp',
			name: 'Whiteout',
			price: '130',
			avatar: 'female',
			category: 'Top',
			materialId: 'Cotton - White',
		},
		{
			_id: '41512edc-8f34-4e7b-a31f-d3745e88c642',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/oofya/templates/Top/The_Triad_-_200_Euro.webp',
			name: 'The Triad',
			price: '200',
			avatar: 'female',
			category: 'Top',
			materialId: 'Cotton - Black',
		},
		{
			_id: 'ee2e379a-ef73-4c06-b68f-74c4d11a9de2',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/oofya/templates/Skirt/Lamella_-_170_Euro.webp',
			name: 'Lamella',
			price: '170',
			avatar: 'female',
			category: 'Skirt',
			materialId: 'Corduroy - Grid',
		},
		{
			_id: '2a3533c4-8ecd-4638-889c-1883d7e2adab',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/oofya/templates/Dress/Severance_-_300_Euro.webp',
			name: 'Severance',
			price: '300',
			avatar: 'female',
			category: 'Dress',
			materialId: 'Cotton - Black',
			extraMaterials: [
				{
					mesh: 'pattern_1195494-pattern_1195493',
					materialId: 'Cotton - Gray',
				},
			],
		},
		{
			_id: '7064b611-98a3-4de0-ac9f-bc48f143fbb3',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/oofya/templates/Dress/Item_2.webp',
			name: 'Item 2',
			price: 'N/A',
			avatar: 'female',
			category: 'Dress',
			materialId: 'Cotton - Black',
			extraMaterials: [
				{
					mesh: 'pattern_1195494-pattern_1195493',
					materialId: 'Cotton - Gray',
				},
			],
		},
		{
			_id: '52569f7c-d121-4224-92b6-f2d66a418181',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/oofya/templates/Accessory/Ava_-_170_Euro.webp',
			name: 'Ava',
			price: '170',
			avatar: 'female',
			category: 'Accessory',
			materialId: 'Taffeta - Black',
		},
		{
			_id: 'fa150510-87d2-4dec-8aa1-318be4184e1e',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/oofya/templates/Accessory/Pli_-_170_Euro.webp',
			name: 'Pli',
			price: '170',
			avatar: 'female',
			category: 'Accessory',
			materialId: '3d - Square',
		},
		{
			_id: '639c2e03-5ed0-4143-a295-26df838c4d18',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/oofya/templates/Pants/Liminal_-_130_Euro.webp',
			name: 'Liminal',
			price: '130',
			avatar: 'female',
			category: 'Pants',
			materialId: 'Cotton - Black',
		},
	],
	theSoul: [
		{
			_id: 'eca2f168-ae28-4348-a063-df4741625878',
			thumb:
				'https://d1e6s1h8cqcr26.cloudfront.net/images/theSoul/templates/Pants/SERENE_WIDE_LEG_TAILORED_TROUSERS_-_0.webp',
			name: 'SERENE WIDE LEG TAILORED TROUSERS',
			price: '0',
			avatar: 'female',
			category: 'Pants',
			materialId: 'Wool - Olive Gray',
		},
		{
			_id: 'a34fdbe7-c610-40c8-b595-4a2926bc5fdd',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/theSoul/templates/Pants/SUNVEIL_TAILORED_TROUSERS_-_0.webp',
			name: 'SUNVEIL TAILORED TROUSERS',
			price: '0',
			avatar: 'female',
			category: 'Pants',
			materialId: 'Suiting - Honey Mustard',
		},
		{
			_id: '3482b9d3-bd60-4531-87dc-fa6e44d326aa',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/theSoul/templates/Top/SUNVEIL_V_NECK_BLAZER_-_0.webp',
			name: 'SUNVEIL V NECK BLAZER',
			price: '0',
			avatar: 'female',
			category: 'Top',
			materialId: 'Suiting - Honey Mustard',
		},
		{
			_id: 'a77d6eb1-670f-4971-80c9-929c77eb6302',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/theSoul/templates/Top/CLOUD_BALLOON_DRAPED_-_305.webp',
			name: 'CLOUD BALLOON DRAPED',
			price: '305',
			avatar: 'female',
			category: 'Top',
			materialId: 'Cotton - White',
		},
		{
			_id: '0dda3223-05de-474f-a943-2fe90a03dbda',
			thumb:
				'https://d1e6s1h8cqcr26.cloudfront.net/images/theSoul/templates/Top/SERENE_HIGH_NECK_DRAPED_BLOUSE_-_0.webp',
			name: 'SERENE HIGH NECK DRAPED BLOUSE',
			price: '0',
			avatar: 'female',
			category: 'Top',
			materialId: 'Wool - Olive Gray',
		},
		{
			_id: '72aa291b-0628-408d-a9f4-2099b15dd873',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/theSoul/templates/Top/OLIVIA_TWEED_JACKET_-_515.webp',
			name: 'OLIVIA TWEED JACKET',
			price: '515',
			avatar: 'female',
			category: 'Top',
			materialId: 'Tweed - 331',
		},
		{
			_id: 'ce9b972e-7d5c-4e9d-a4c1-026e2a7ae890',
			thumb:
				'https://d1e6s1h8cqcr26.cloudfront.net/images/theSoul/templates/Dress/LILY_IVORY_HIGH_NECK_LACE_DRESS_-_450.webp',
			name: 'LILY IVORY HIGH NECK LACE DRESS',
			price: '450',
			avatar: 'female',
			category: 'Dress',
			materialId: 'Lace - Flower',
			extraMaterials: [
				{
					mesh: 'pattern_4844284-pattern_4872557-pattern_4872556-pattern_4856659-pattern_4856658',
					materialId: 'Taffeta - Black',
				},
			],
		},
		{
			_id: '9a1768c4-2ff8-4c39-aa08-a980cfc368fa',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/theSoul/templates/Dress/PETAL_VEIL_GOWN_-_570.webp',
			name: 'PETAL VEIL GOWN',
			price: '570',
			avatar: 'female',
			category: 'Dress',
			materialId: 'Taffeta - Black',
		},
		{
			_id: '5f9fc352-bf3b-405c-bdc2-6622a057477e',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/theSoul/templates/Dress/GOLDEN_BLOOM-DRAPED_GOWN_-_300.webp',
			name: 'GOLDEN BLOOM',
			price: 'N/A',
			avatar: 'female',
			category: 'Dress',
			materialId: 'Silk - Tan',
		},
		{
			_id: 'a5f6203f-fd2c-41ed-9234-439830f922fb',
			thumb:
				'https://d1e6s1h8cqcr26.cloudfront.net/images/theSoul/templates/Dress/CASCADE_FLORAL_BUSTIER_MAXI_DRESS_-_465.webp',
			name: 'CASCADE FLORAL BUSTIER MAXI DRESS',
			price: '465',
			avatar: 'female',
			category: 'Dress',
			materialId: 'Print Chiffon - Floral',
		},
		{
			_id: 'cc468411-caf9-4943-b5f2-087da2183a09',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/theSoul/templates/Dress/STARLIGHT_DRESS_-_410.webp',
			name: 'STARLIGHT DRESS',
			price: '410',
			avatar: 'female',
			category: 'Dress',
			materialId: 'Sateen - Black',
		},
		{
			_id: 'd9656de1-eaa5-4d6c-a252-dc8908d7951a',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/theSoul/templates/Dress/ROSA_LACE_DRESS_-_465.webp',
			name: 'ROSA LACE DRESS',
			price: '465',
			avatar: 'female',
			category: 'Dress',
			materialId: 'Lace - White Flower',
		},
	],
	moidien: [
		{
			_id: '9936c6c8-2926-4ce7-b43a-63dbebd1d736',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/moidien/templates/Top/Strap_top_-_0.webp',
			name: 'Strap top',
			price: '0',
			avatar: 'female',
			category: 'Top',
			materialId: 'Seersucker - Seethrough',
		},
		{
			_id: 'ce3f43f6-cef4-4a4e-ab75-c7b144edb806',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/moidien/templates/Top/Wrap_jacket_-_65_.webp',
			name: 'Wrap jacket',
			price: '65',
			avatar: 'female',
			category: 'Top',
			materialId: 'Crinkle Fabric - Navy',
		},
		{
			_id: '2bdcfff1-9af2-4af8-8168-9123b8f54d61',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/moidien/templates/Top/Bomber_jacket_-_65.webp',
			name: 'Bomber jacket',
			price: '65',
			avatar: 'female',
			category: 'Top',
			materialId: 'Poly - Jacquard',
		},
		{
			_id: '8a1d9f67-1621-4a18-bcac-0ed3a42cadb7',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/moidien/templates/Top/Washed_Tshirt_with_folds_-_40.webp',
			name: 'Washed Tshirt with folds',
			price: '40',
			avatar: 'female',
			category: 'Top',
			materialId: 'Washed - T',
		},
		{
			_id: '6cf59254-4bdc-493a-b912-652459a0247e',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/moidien/templates/Top/Pleated_long_sleeve_shirt_-_65.webp',
			name: 'Pleated long sleeve shirt',
			price: '65',
			avatar: 'female',
			category: 'Top',
			materialId: 'Pleated - White',
		},
		{
			_id: '6e675fd7-d6fe-48c4-b904-453718203ef5',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/moidien/templates/Top/Pleated_short_sleeve_shirt_-_45.webp',
			name: 'Pleated short sleeve shirt',
			price: '45',
			avatar: 'female',
			category: 'Top',
			materialId: 'Pleated - Brown',
		},
		{
			_id: '5b2ffe89-6a69-465e-896d-3df70908453b',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/moidien/templates/Top/Shirt_with_folds_-_65.webp',
			name: 'Shirt with folds',
			price: '65',
			avatar: 'female',
			category: 'Top',
			materialId: 'Cotton - White',
		},
		{
			_id: '074db149-1cec-46c1-8731-a1b521b14687',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/moidien/templates/Hat/Item_1.webp',
			name: 'Item 1',
			price: 'N/A',
			avatar: 'female',
			category: 'Hat',
			materialId: 'Pleated - Random White',
		},
		{
			_id: '3733a3c4-3c81-4402-ad4a-50f030fb8a54',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/moidien/templates/Bag/Pleated_tote_bag_-_55.webp',
			name: 'Pleated tote bag',
			price: '55',
			avatar: 'female',
			category: 'Bag',
			materialId: 'Pleated - Random White',
		},
		{
			_id: 'e5921e32-8216-41c6-b930-e715bc390eee',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/moidien/templates/Bag/Item_10.webp',
			name: 'Item 10',
			price: 'N/A',
			avatar: 'female',
			category: 'Bag',
			materialId: 'Pleated - Random Black',
		},
		{
			_id: 'ae850ea9-fa4a-443a-89f5-b70a1ed4ed62',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/moidien/templates/Accessories/Item_16.webp',
			name: 'Item 16',
			price: 'N/A',
			avatar: 'female',
			category: 'Accessories',
			materialId: 'Cotton - White',
		},
		{
			_id: '13819394-d2ab-4dc7-864c-24542f99f372',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/moidien/templates/Accessories/Item_15.webp',
			name: 'Item 15',
			price: 'N/A',
			avatar: 'female',
			category: 'Accessories',
			materialId: 'Cotton - White',
		},
		{
			_id: 'df14e704-b0c4-4180-bafc-46857508dfa5',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/moidien/templates/Accessories/Item_14.webp',
			name: 'Item 14',
			price: 'N/A',
			avatar: 'female',
			category: 'Accessories',
			materialId: 'Cotton - White',
		},
		{
			_id: '57e5c79b-369e-49a1-a874-8864492ed600',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/moidien/templates/Accessories/Item_17.webp',
			name: 'Item 17',
			price: 'N/A',
			avatar: 'female',
			category: 'Accessories',
			materialId: 'Cotton - White',
		},
		{
			_id: 'b7e9ceef-460d-41fa-9034-443ceb6eda8b',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/moidien/templates/Accessories/Item_13.webp',
			name: 'Item 13',
			price: 'N/A',
			avatar: 'female',
			category: 'Accessories',
			materialId: 'Cotton - White',
		},
		{
			_id: 'dd096174-ab05-4c48-a710-462478349c7a',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/moidien/templates/Dress/Dress_with_folds_-_105.webp',
			name: 'Dress with folds',
			price: '105',
			avatar: 'female',
			category: 'Dress',
			materialId: 'Cotton - Taupe',
		},
		{
			_id: '1b135f16-cebf-4607-8057-6493e569508a',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/moidien/templates/Pants/Item_7.webp',
			name: 'Item 7',
			price: 'N/A',
			avatar: 'female',
			category: 'Pants',
			materialId: 'Twill - 235',
		},
		{
			_id: '061323fc-b653-48a1-ab4b-48e3e0a978df',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/moidien/templates/Pants/Lazy_pants_-_40.webp',
			name: 'Lazy pants',
			price: '40',
			avatar: 'female',
			category: 'Pants',
			materialId: 'Seersucker - Black',
		},
		{
			_id: 'a342d040-e53c-4735-bf92-76e9004fcb18',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/moidien/templates/Pants/Pants_with_folds_-_65_.webp',
			name: 'Pants with folds',
			price: '65',
			avatar: 'female',
			category: 'Pants',
			materialId: 'Twill - 235',
		},
	],
	emwear: [
		{
			_id: '07bed14c-7bd1-47a8-b943-716fa7c68aba',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/emwear/templates/Skirt/Silk_Bloom_Skirt_-_28.webp',
			name: 'Silk Bloom Skirt',
			price: '28',
			avatar: 'female',
			category: 'Skirt',
			materialId: 'Lace - White',
		},
		{
			_id: '4331656e-496a-4e67-b248-d83c07486d58',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/emwear/templates/Top/Silk_Bloom_Top_-_45.webp',
			name: 'Silk Bloom Top',
			price: '45',
			avatar: 'female',
			category: 'Top',
			materialId: 'Silk - White',
		},
		{
			_id: 'fba4a338-aae2-4412-8684-f271711fc7d2',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/emwear/templates/Coat/Ocean_Wave_Sleep_Robe_-_57.webp',
			name: 'Ocean Wave Sleep Robe',
			price: '57',
			avatar: 'female',
			category: 'Coat',
			materialId: 'Mesh - Flower',
			extraMaterials: [
				{
					mesh: '66-24-70-71',
					materialId: 'Silk - Fffaed',
				},
			],
		},
		{
			_id: '8e799ad0-14e4-465f-8904-6115eb12df9f',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/emwear/templates/Dress/Ocean_Wave_Slip_Dress_-_120.webp',
			name: 'Ocean Wave Slip Dress',
			price: '120',
			avatar: 'female',
			category: 'Dress',
			materialId: 'Silk - Lavender Blush',
			extraMaterials: [
				{
					mesh: '76-64-68-23',
					materialId: 'Mesh - Lavender Blush',
				},
				{
					mesh: 'pattern_402777-pattern_402779-pattern_354297',
					materialId: 'Lace - Lavender Blush',
				},
			],
		},
		{
			_id: 'f472875c-ddee-47b4-9710-90a16b605ea1',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/emwear/templates/Dress/Rosette_Dress_-_100.webp',
			name: 'Rosette Dress',
			price: '100',
			avatar: 'female',
			category: 'Dress',
			materialId: 'Silk - Cce9ff',
			extraMaterials: [
				{
					mesh: '33-65-64-pattern_76019845-pattern_76183233-pattern_76019844-63-62-21',
					materialId: 'Silk - Seethrough Cce9ff',
				},
			],
		},
		{
			_id: '1a2ee7ef-43c6-4183-b765-14450e50a1b3',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/emwear/templates/Dress/Drape_Elegance_Dress_-_67.webp',
			name: 'Drape Elegance Dress',
			price: '67',
			avatar: 'female',
			category: 'Dress',
			materialId: 'Silk - Ffebb7',
		},
		{
			_id: 'b270b0c7-fff1-42a2-92ca-72ce22691514',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/emwear/templates/Dress/Pure_Grace_Dress_-_60.webp',
			name: 'Pure Grace Dress',
			price: '60',
			avatar: 'female',
			category: 'Dress',
			materialId: 'Silk - Off White',
			extraMaterials: [
				{
					mesh: 'pattern_402783-pattern_402782-pattern_402780-pattern_402776-pattern_354302-pattern_354305-pattern_354304-pattern_354303-pattern_354295',
					materialId: 'Lace - Light Cream',
				},
			],
		},
		{
			_id: 'd6c21e5d-e910-4601-926c-6f6d0b4b2aec',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/emwear/templates/Dress/Swayrose_Dress_-_67.webp',
			name: 'Swayrose Dress',
			price: '67',
			avatar: 'female',
			category: 'Dress',
			materialId: 'Silk - Ffc85a',
		},
		{
			_id: 'd4742f2e-2776-42a5-a371-709bdaee08ff',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/emwear/templates/Dress/Luxe_Reverie_Dress_-_55.webp',
			name: 'Luxe Reverie Dress',
			price: '55',
			avatar: 'female',
			category: 'Dress',
			materialId: 'Silk - Ffe6f2',
			extraMaterials: [
				{
					mesh: 'pattern_354307-pattern_354313-pattern_354306-pattern_354310',
					materialId: 'Lace - Ffe6f2',
				},
			],
		},
		{
			_id: '277866bb-30b6-41ea-8e93-88c9598bc4bc',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/emwear/templates/Dress/Holi_Sunset_Dress_-_90.webp',
			name: 'Holi Sunset Dress',
			price: '90',
			avatar: 'female',
			category: 'Dress',
			materialId: 'Silk - Fffaed',
			extraMaterials: [
				{
					mesh: 'pattern_402772-pattern_402773-pattern_354294',
					materialId: 'Silk - Seethrough (Fffaed)',
				},
			],
		},
		{
			_id: 'da0335a4-caa6-4055-b5c1-f627632ac35f',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/emwear/templates/Dress/Lush_Dream_Dress_-_55.webp',
			name: 'Lush Dream Dress',
			price: '55',
			avatar: 'female',
			category: 'Dress',
			materialId: 'Silk - Light Cream',
			extraMaterials: [
				{
					mesh: 'pattern_402776-pattern_402775-pattern_354304-pattern_354305',
					materialId: 'Lace - Light Cream',
				},
			],
		},
	],
	atelierGourney: [
		{
			_id: 'a38f7d37-6115-4488-8385-b160d936d541',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/atelierGourney/templates/Pants/Item_1.webp',
			name: 'Item 1',
			price: 'N/A',
			avatar: 'female',
			category: 'Pants',
			materialId: 'Denim - 383',
		},
		{
			_id: 'e2c1aa0b-fda2-4f5b-9591-a22257aac3b7',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/atelierGourney/templates/Top/Item_1.webp',
			name: 'Item 1',
			price: 'N/A',
			avatar: 'female',
			category: 'Top',
			materialId: 'Denim - 383',
		},
		{
			_id: '281b9de5-69ce-4b58-8bdd-558bb01bb91f',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/atelierGourney/templates/Jumpsuit/FRACTYNE_-_300.webp',
			name: 'FRACTYNE',
			price: '300',
			avatar: 'female',
			category: 'Jumpsuit',
			materialId: 'Denim - 383',
		},
		{
			_id: 'c28fde53-31de-42fa-bd98-c44304c70f82',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/atelierGourney/templates/Jumpsuit/VELLITH_-_350.webp',
			name: 'VELLITH',
			price: '350',
			avatar: 'female',
			category: 'Jumpsuit',
			materialId: 'Leather - White',
			extraMaterials: [
				{
					mesh: 'pattern_14215691-pattern_14215690-pattern_14215689-pattern_14215688-pattern_14215687-pattern_14215686-pattern_14215685-pattern_14215684-pattern_14215683-pattern_14215682-pattern_14215681-pattern_14215680-pattern_14215679-pattern_14215678-pattern_14215677-pattern_14215676-pattern_14215675-pattern_14215674-pattern_14215673-pattern_14215672-pattern_14215671-pattern_14215670-pattern_14215669-pattern_14215668-pattern_14215667-pattern_14215666-pattern_14215664-pattern_14215665-pattern_14215663',
					materialId: 'Cotton - White',
				},
			],
		},
		{
			_id: '6b5caf18-0f55-49c4-b44f-8ddf2170cbfa',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/atelierGourney/templates/Jumpsuit/SCINTRA_-_350.webp',
			name: 'SCINTRA',
			price: '350',
			avatar: 'female',
			category: 'Jumpsuit',
			materialId: 'Leather - Brown',
		},
		{
			_id: '61cda566-37b7-4e72-8e4c-9b9f9fa6be9a',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/atelierGourney/templates/Jumpsuit/CAUTRA_-_350.webp',
			name: 'CAUTRA',
			price: '350',
			avatar: 'female',
			category: 'Jumpsuit',
			materialId: 'Leather - Lamb',
			extraMaterials: [
				{
					mesh: 'pattern_33238759-pattern_33238758-pattern_33238757-pattern_33238756-pattern_33238755-pattern_33238754-pattern_33238753-pattern_33238752-pattern_33238751-pattern_33238750-pattern_33238749-pattern_33238748-pattern_33238747-pattern_33238746-pattern_33238744-pattern_33238745-pattern_33238742-pattern_33238743-pattern_33238741-pattern_33238740-pattern_33238739-pattern_33238738',
					materialId: 'Cotton - White',
				},
			],
		},
		{
			_id: '3a0cb360-604b-4963-bb65-1fc51759909f',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/atelierGourney/templates/Jumpsuit/AETERNA_-_2500.webp',
			name: 'AETERNA',
			price: '2500',
			avatar: 'female',
			category: 'Jumpsuit',
			materialId: 'Black - 360',
		},
		{
			_id: 'b0944118-e448-4721-a3e7-cdea7449fedc',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/atelierGourney/templates/Dress/AETERNA_-_3500.webp',
			name: 'AETERNA',
			price: '3500',
			avatar: 'female',
			category: 'Dress',
			materialId: 'Metallic - Fringe',
		},
		{
			_id: 'ea8a612a-cff4-4829-8bc0-b9f7a2c30f8c',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/atelierGourney/templates/Dress/INVOLVITE_-_3500.webp',
			name: 'INVOLVITE',
			price: '3500',
			avatar: 'female',
			category: 'Dress',
			materialId: 'Wool - Sequin',
		},
		{
			_id: '4dc465a4-f396-46d1-b2fc-632052d61af4',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/atelierGourney/templates/Dress/CHRYSTALICE_-_3000.webp',
			name: 'CHRYSTALICE',
			price: '3000',
			avatar: 'female',
			category: 'Dress',
			materialId: 'Wool - 361',
		},
		{
			_id: '8bb26106-1214-4989-b194-00f8b503194f',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/atelierGourney/templates/Dress/HYMNUSE_-_4500.webp',
			name: 'HYMNUSE',
			price: '4500',
			avatar: 'female',
			category: 'Dress',
			materialId: 'Wool - 361',
		},
		{
			_id: '5b8ccd6f-1173-4947-882e-8f74d0f1db18',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/atelierGourney/templates/Dress/NOSTORIA_-_2500.webp',
			name: 'NOSTORIA',
			price: '2500',
			avatar: 'female',
			category: 'Dress',
			materialId: 'Wool - 361',
			extraMaterials: [
				{
					mesh: 'pattern_13045425-pattern_13045424-pattern_402784-pattern_402783-pattern_354312-pattern_402780-pattern_402781-pattern_354317-pattern_354314-pattern_354315-pattern_354316-pattern_245407',
					materialId: 'Embroidered - Horsehair',
				},
			],
		},
	],
	zove: [
		{
			_id: '8b158dba-6928-48d0-9f10-ef9a6f3f2671',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/zove/templates/Dress/Item_1.webp',
			name: 'Item 1',
			price: 'N/A',
			avatar: 'female',
			category: 'Dress',
			materialId: 'Twill - 235',
			extraMaterials: [
				{
					mesh: 'buttonhead',
					materialId: 'Trim - Texture',
				},
			],
		},
		{
			_id: '612b7b0b-961d-469b-ad54-e5293775495c',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/zove/templates/Top/INO_TOP_-_890.webp',
			name: 'INO TOP',
			price: '890',
			avatar: 'female',
			category: 'Top',
			materialId: 'Silk - Seethrough Cce9ff',
		},
		{
			_id: 'd5d6362d-9e37-4381-8685-0b5f54eea27a',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/zove/templates/Top/Washed_denim_corset_-_230.webp',
			name: 'Washed denim corset',
			price: '230',
			avatar: 'female',
			category: 'Top',
			materialId: 'Denim - Light',
			extraMaterials: [
				{
					mesh: 'pattern_16422735-pattern_16386325-pattern_16386328-pattern_16386326-pattern_16386327-pattern_16386329-pattern_16422734',
					materialId: 'Leather - Black',
				},
			],
		},
		{
			_id: '9a69b980-8800-4bea-b5b9-e8547fe0a515',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/zove/templates/Top/corset_-_230.webp',
			name: 'corset',
			price: '230',
			avatar: 'female',
			category: 'Top',
			materialId: 'Leather - Black',
			extraMaterials: [
				{
					mesh: 'trim',
					materialId: 'Trim - Texture',
				},
			],
		},
		{
			_id: '06dc3f69-e9ef-48d7-8d80-c37e139cc9a8',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/zove/templates/Top/Item_3.webp',
			name: 'Item 3',
			price: 'N/A',
			avatar: 'female',
			category: 'Top',
			materialId: 'Cotton - Twill',
			extraMaterials: [
				{
					mesh: 'trim',
					materialId: 'Trim - Texture',
				},
			],
		},
		{
			_id: '682f5ff8-4e52-4668-884a-4c3b1380f260',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/zove/templates/Top/Item_2.webp',
			name: 'Item 2',
			price: 'N/A',
			avatar: 'female',
			category: 'Top',
			materialId: 'Twill - 235',
			extraMaterials: [
				{
					mesh: 'buttonhead',
					materialId: 'Trim - Texture',
				},
			],
		},
		{
			_id: '9be33ffd-dad4-44e6-8d75-7547cd2e5401',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/zove/templates/Skirt/NARCISSE_SKIRT_-_8600.webp',
			name: 'NARCISSE SKIRT',
			price: '8600',
			avatar: 'female',
			category: 'Skirt',
			materialId: 'Cotton - Twill',
			extraMaterials: [
				{
					mesh: 'topstitch',
					materialId: 'Corduroy - Grid',
				},
				{
					mesh: 'trim',
					materialId: 'Fabric - Golden',
				},
			],
		},
		{
			_id: '60ba9e56-7677-45f8-a103-7e0f5b976379',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/zove/templates/Skirt/Item_1.webp',
			name: 'Item 1',
			price: 'N/A',
			avatar: 'female',
			category: 'Skirt',
			materialId: 'Twill - 235',
		},
	],
	jaSengBu: [
		{
			_id: 'aec2813b-4191-4de5-bb62-1c8ece6fb69b',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/jaSengBu/templates/Skirt/Sheer_Tulle_Overlay_Skirt.webp',
			name: 'Sheer Tulle Overlay Skirt',
			price: 'N/A',
			avatar: 'female',
			category: 'Skirt',
			materialId: 'Jersey - Black',
			extraMaterials: [
				{
					mesh: 'pattern_8215297-pattern_7672782',
					materialId: 'Organza - Black',
				},
			],
		},
		{
			_id: '95c78f28-b8b8-48d6-a142-5d7a0b843d6e',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/jaSengBu/templates/Skirt/Gold_Leaf_Appliqué_Midi_Skirt.webp',
			name: 'Gold Leaf Appliqué Midi Skirt',
			price: 'N/A',
			avatar: 'female',
			category: 'Skirt',
			materialId: 'Dark Green - 348',
			extraMaterials: [
				{
					mesh: '_7-_8',
					materialId: 'Golden - 349',
				},
			],
		},
		{
			_id: '5828d089-f997-4a15-a0e5-4aa2ea0ffcda',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/jaSengBu/templates/Skirt/Draped_Abstract_Skirt.webp',
			name: 'Draped Abstract Skirt',
			price: 'N/A',
			avatar: 'female',
			category: 'Skirt',
			materialId: 'Taffeta - Red Print',
			extraMaterials: [
				{
					mesh: 'pattern_402805-pattern_402808-pattern_402807-pattern_402803-pattern_402799-pattern_402802-pattern_402801-pattern_402791-pattern_354310-pattern_354321-pattern_354312-pattern_354333-pattern_354343-pattern_354347-pattern_354331-pattern_354339-pattern_354330-pattern_354327-pattern_354342-pattern_354341-pattern_354336',
					materialId: 'Taffeta - White Print',
				},
			],
		},
		{
			_id: '1b03f3aa-7a01-4f17-bca2-fec4097fae46',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/jaSengBu/templates/Top/Cropped_Jersey_Tank.webp',
			name: 'Cropped Jersey Tank',
			price: 'N/A',
			avatar: 'female',
			category: 'Top',
			materialId: 'Jersey - Black',
		},
		{
			_id: 'cdaa3df2-50ff-4f48-b5bc-f5171adfa1f0',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/jaSengBu/templates/Top/Structured_Corset_Shirt.webp',
			name: 'Structured Corset Shirt',
			price: 'N/A',
			avatar: 'female',
			category: 'Top',
			materialId: 'Cotton - Charcoal Teal',
		},
		{
			_id: '41e88790-f6bd-4392-a7f4-91dcda0d6190',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/jaSengBu/templates/Top/Sheer_Net_Organza_Top.webp',
			name: 'Sheer Net Organza Top',
			price: 'N/A',
			avatar: 'female',
			category: 'Top',
			materialId: 'Organza - Black',
			extraMaterials: [
				{
					mesh: 'pattern_354296-pattern_354299-pattern_402778-pattern_402776',
					materialId: 'Jersey - Black',
				},
			],
		},
		{
			_id: 'a0a94b45-365e-4bff-ae27-063bb7ff103c',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/jaSengBu/templates/Dress/RAGLAN_COAT_WITH_A_BELT.webp',
			name: 'RAGLAN COAT WITH A BELT',
			price: 'N/A',
			avatar: 'female',
			category: 'Dress',
			materialId: 'Tweed Modern - 359',
		},
		{
			_id: '9aaf4fa1-0b93-4a6f-9792-065084d1f2a3',
			thumb:
				'https://d1e6s1h8cqcr26.cloudfront.net/images/jaSengBu/templates/Dress/TAILORED_JACKET-INSPIRED_MINI_DRESS.webp',
			name: 'TAILORED JACKET',
			price: 'N/A',
			avatar: 'female',
			category: 'Dress',
			materialId: 'Jacquard - Red',
		},
		{
			_id: 'dc13b5cb-5dcb-4ea2-ab45-0001c49eab59',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/jaSengBu/templates/Dress/Sculpted_Siren.webp',
			name: 'Sculpted Siren',
			price: 'N/A',
			avatar: 'female',
			category: 'Dress',
			materialId: 'Muslin - 343',
		},
	],
	mssPark: [
		{
			_id: 'efd067cb-a9e4-4812-970b-fad26cdc3f5b',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/mssPark/templates/Skirt/Round_Skirt_-_400.webp',
			name: 'Round Skirt',
			price: '400',
			avatar: 'female',
			category: 'Skirt',
			materialId: 'Poly - Camo',
		},
		{
			_id: '17f22759-7d1e-41b3-a88c-3edd90a4ad2c',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/mssPark/templates/Skirt/Item_3.webp',
			name: 'Item 3',
			price: 'N/A',
			avatar: 'female',
			category: 'Skirt',
			materialId: 'Jersey - Stretch',
		},
		{
			_id: '30b8eb21-2d8d-4d51-9689-da83e3d4b272',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/mssPark/templates/Skirt/Item_1.webp',
			name: 'Item 1',
			price: 'N/A',
			avatar: 'female',
			category: 'Skirt',
			materialId: 'Jersey - Black',
		},
		{
			_id: '1cd0014f-a3be-47c0-8400-62daff80820e',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/mssPark/templates/Pants/Camo_short_-_300.webp',
			name: 'Camo short',
			price: '300',
			avatar: 'female',
			category: 'Pants',
			materialId: 'Poly - Camo',
		},
		{
			_id: '52b39a72-53cc-402e-aa64-556e587d5ba7',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/mssPark/templates/Pants/Doorknob_Detail_Shorts_-_420.webp',
			name: 'Doorknob Detail Shorts',
			price: '420',
			avatar: 'female',
			category: 'Pants',
			materialId: 'Leather - Cracked',
			extraMaterials: [
				{
					mesh: 'trim',
					materialId: 'Trim - Texture',
				},
			],
		},
		{
			_id: 'b6882bcb-7b19-474c-b7f1-18fe73685acd',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/mssPark/templates/Pants/Vegan_Fur_Cut_Pants_-_1100.webp',
			name: 'Vegan Fur Cut Pants',
			price: '1100',
			avatar: 'female',
			category: 'Pants',
			materialId: 'Fur - 373',
		},
		{
			_id: 'b6efd7ae-85c0-44e3-83b7-4987aa4304da',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/mssPark/templates/Top/Asymmetric_Camo_Zip_-_600.webp',
			name: 'Asymmetric Camo Zip',
			price: '600',
			avatar: 'female',
			category: 'Top',
			materialId: 'Jersey - Stretch',
			extraMaterials: [
				{
					mesh: 'graphic_1789490-zipperpattern_1789291-graphic_1789479-zipperpattern_1789278-slider_1',
					materialId: 'Trim - Texture',
				},
				{
					mesh: 'pattern_1545473-pattern_1545475-pattern_1545477',
					materialId: 'Poly - Camo',
				},
			],
		},
		{
			_id: '3013c7bb-1ca9-452a-8c3b-3ddb8146c19f',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/mssPark/templates/Top/Asymmetric_Cut_out_Top_-_650.webp',
			name: 'Asymmetric Cut out Top',
			price: '650',
			avatar: 'female',
			category: 'Top',
			materialId: 'Jersey - Black',
			extraMaterials: [
				{
					mesh: 'trim',
					materialId: 'Trim - Texture',
				},
			],
		},
		{
			_id: 'ee4d4a07-6bdf-42a7-9df6-a9d73cc1402d',
			thumb:
				'https://d1e6s1h8cqcr26.cloudfront.net/images/mssPark/templates/Top/Technical_Illustration_Hollow_Bodysuit_-_0.webp',
			name: 'Technical Illustration Hollow Bodysuit',
			price: '0',
			avatar: 'female',
			category: 'Top',
			materialId: 'Cotton - Twill',
		},
		{
			_id: '66625b66-ddd6-48e5-b63c-54c424313dbd',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/mssPark/templates/Top/Modular_Leather_Flower_Top_-_645.webp',
			name: 'Modular Leather Flower Top',
			price: '645',
			avatar: 'female',
			category: 'Top',
			materialId: 'Leather - Cracked',
		},
		{
			_id: '32c03edd-ed33-408e-8d83-884b4bb9cd90',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/mssPark/templates/Dress/Side_Exposed_Boned_Skort_-_550.webp',
			name: 'Side Exposed Boned Skort',
			price: '550',
			avatar: 'female',
			category: 'Dress',
			materialId: 'Jersey - Stretch',
		},
		{
			_id: 'b433bfdb-7df8-4777-87d5-cebe0aa07363',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/mssPark/templates/Dress/Lace_Hooded_Duster_Coat_-_650.webp',
			name: 'Lace Hooded Duster Coat',
			price: '650',
			avatar: 'female',
			category: 'Dress',
			materialId: 'Lace - White',
		},
		{
			_id: '538080c8-d2af-402a-bfb0-b6a9d4999873',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/mssPark/templates/Dress/Item_1.webp',
			name: 'Item 1',
			price: 'N/A',
			avatar: 'female',
			category: 'Dress',
			materialId: 'Cotton - Black Seethrough',
		},
	],
	imzadFemale: [
		{
			_id: '167e2add-4ec9-439b-b109-820ebd82a596',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/imzadFemale/templates/Coat/Item_1.webp',
			name: 'Item 1',
			price: 'N/A',
			avatar: 'female',
			category: 'Coat',
			materialId: 'Suede - White',
			extraMaterials: [
				{
					mesh: 'buttonhead',
					materialId: 'Trim - Texture',
				},
			],
		},
		{
			_id: '74d644d2-aaee-4a2b-954c-b74d36fd29ce',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/imzadFemale/templates/Skirt/LA_JUPE_AEROX.webp',
			name: 'LA JUPE AEROX',
			price: 'N/A',
			avatar: 'female',
			category: 'Skirt',
			materialId: 'Leather - Dark Indigo',
			extraMaterials: [
				{
					mesh: 'trim-buttonhead',
					materialId: 'Trim - Texture',
				},
			],
		},
		{
			_id: 'd79ff169-4764-4038-bbd7-4ce6a3a6b97a',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/imzadFemale/templates/Top/Top.webp',
			name: 'Top',
			price: 'N/A',
			avatar: 'female',
			category: 'Top',
			materialId: 'Organza - Dark Indigo',
			extraMaterials: [
				{
					mesh: 'trim',
					materialId: 'Trim - Texture',
				},
			],
		},
		{
			_id: '517fc419-0cc1-4176-bb5d-df6224903fc1',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/imzadFemale/templates/Top/LE_BOMBERS_STRYKER.webp',
			name: 'LE BOMBERS STRYKER',
			price: 'N/A',
			avatar: 'female',
			category: 'Top',
			materialId: 'Charcoal - Blue Velvet',
			extraMaterials: [
				{
					mesh: 'blobk_drippy_tight_ralan_45-buttonhead',
					materialId: 'Trim - Texture',
				},
			],
		},
	],
	imzadMale: [
		{
			_id: '5733554d-41fc-4858-a0a7-3e43b6c5eadf',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/imzadMale/templates/Skirt/NUANCIER_DE_LA_JUPE.webp',
			name: 'NUANCIER DE LA JUPE',
			price: 'N/A',
			avatar: 'female',
			category: 'Skirt',
			materialId: 'Silk - Beige',
		},
		{
			_id: '55a559aa-b503-4da7-9960-929455711278',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/imzadMale/templates/Top/LE_HOODY-DRESS_VELORA.webp',
			name: 'LE HOODY',
			price: 'N/A',
			avatar: 'female',
			category: 'Top',
			materialId: 'Sequin - White',
		},
		{
			_id: 'd225f8c9-7a81-4641-b15d-1ed7ee62273b',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/imzadMale/templates/Top/LE_DEBARDEUR_ARMOR.webp',
			name: 'LE DEBARDEUR ARMOR',
			price: 'N/A',
			avatar: 'female',
			category: 'Top',
			materialId: 'Organ - Beaded Rhinstones',
		},
		{
			_id: '8b55fb19-cb45-4d9b-8c1f-b3743a428738',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/imzadMale/templates/Top/LE_PULL_RAW.webp',
			name: 'LE PULL RAW',
			price: 'N/A',
			avatar: 'female',
			category: 'Top',
			materialId: 'Twill - Beige',
		},
		{
			_id: '00de2cf2-d878-4917-828c-77329182b1ab',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/imzadMale/templates/Accessories/Item_2.webp',
			name: 'Item 2',
			price: 'N/A',
			avatar: 'female',
			category: 'Accessories',
			materialId: 'Leather - Dark Indigo',
			extraMaterials: [
				{
					mesh: 'pattern_27226345-pattern_5365078-pattern_27226344-pattern_5365077-buttonhead',
					materialId: 'Trim - Texture',
				},
			],
		},
		{
			_id: 'a40a1a15-e6ec-49e3-90f1-c1a3c4dae241',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/imzadMale/templates/Pants/LE_PANTALON_D-FURM.webp',
			name: 'LE PANTALON D',
			price: 'N/A',
			avatar: 'female',
			category: 'Pants',
			materialId: 'Denim - Shimmery',
			extraMaterials: [
				{
					mesh: 'buttonhead',
					materialId: 'Trim - Texture',
				},
				{
					mesh: '43-32-37-29-26-25-23-22-18-17-16-13',
					materialId: 'Back Denim - Shimmery',
				},
			],
		},
	],
	sapienzaUniversityOfRome: [
		{
			_id: 'c3e264db-a30d-43f6-93f4-47da6e7feae3',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/templates/Dress/Item_5.webp',
			name: 'Item 5',
			price: 'N/A',
			avatar: 'female',
			category: 'Dress',
			materialId: 'Cotton - Silk White',
			extraMaterials: [
				{
					mesh: '22-base_drippy_tight_regular_shoulder_8-base_drippy_tight_regular_shoulder_8-base_drippy_tight_regular_shoulder_7-base_drippy_tight_regular_shoulder_4-base_drippy_tight_regular_shoulder_12-base_drippy_tight_regular_shoulder_15',
					materialId: 'Muslin - Pink',
				},
				{
					mesh: '56-pattern_231535-pattern_231534-pattern_231531-pattern_2212-pattern_1688480-pattern2d_6068759',
					materialId: 'Muslin - Brown',
				},
				{
					mesh: 'buttonhead-pattern_2404383-binding_46778-pattern_2410116-pattern_2410115',
					materialId: 'Texture - Micro Velvet',
				},
			],
			fabricOptions: [
				'Cotton - Silk White',
				'Velvet - 02',
				'Velvet - 08',
				'Velvet - 07',
				'Velvet - 06',
				'Muslin - White',
				'Texture - Micro',
				'Muslin - Pink',
				'Muslin - Green',
				'Muslin - Brown',
				'Muslin - Blue',
				'Texture - Micro Velvet',
				'Texture - Micro 3',
				'Texture - Micro 2',
			],
			blockOptions: [
				{
					category: 'Skirt',
					blocks: [
						{
							_id: '786bac61-b16a-4230-81bd-2f1f7d4537ed',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Skirt/Item_5.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Skirt/Item_5.glb',
							blockName: 'Item 5',
							avatar: 'female',
							category: 'Skirt',
							templateCategory: 'Dress',
						},
						{
							_id: '14af09c0-7c6b-4f88-ab6c-736c18d04234',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Skirt/Item_4.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Skirt/Item_4.gltf',
							blockName: 'Item 4',
							avatar: 'female',
							category: 'Skirt',
							templateCategory: 'Dress',
						},
						{
							_id: 'a11b47ae-0efe-4e3e-986f-d29c26f7b6b6',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Skirt/Item_3.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Skirt/Item_3.glb',
							blockName: 'Item 3',
							avatar: 'female',
							category: 'Skirt',
							templateCategory: 'Dress',
						},
						{
							_id: '669657ea-3b0b-4102-ab12-d8d4d7d21419',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Skirt/Item_2.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Skirt/Item_2.gltf',
							blockName: 'Item 2',
							avatar: 'female',
							category: 'Skirt',
							templateCategory: 'Dress',
						},
						{
							_id: 'f181c8da-860a-4eff-b6fe-be92dcc388a0',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Skirt/Item_1.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Skirt/Item_1.glb',
							blockName: 'Item 1',
							avatar: 'female',
							category: 'Skirt',
							templateCategory: 'Dress',
						},
					],
				},
				{
					category: 'Sleeves',
					blocks: [
						{
							_id: 'a678bc9e-2fc4-4680-9942-1d128a843ff0',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Sleeves/Item_5.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Sleeves/Item_5.glb',
							blockName: 'Item 5',
							avatar: 'female',
							category: 'Sleeves',
							templateCategory: 'Dress',
						},
						{
							_id: '0e8956cb-59ad-4f67-be04-a3be6b183436',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Sleeves/Item_4.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Sleeves/Item_4.gltf',
							blockName: 'Item 4',
							avatar: 'female',
							category: 'Sleeves',
							templateCategory: 'Dress',
						},
						{
							_id: 'bdfbc840-8ce6-46c2-a87f-05c493a04507',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Sleeves/Item_3.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Sleeves/Item_3.gltf',
							blockName: 'Item 3',
							avatar: 'female',
							category: 'Sleeves',
							templateCategory: 'Dress',
						},
						{
							_id: '6ef89ba3-324f-4eb5-bc78-a6a3ef7f5f70',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Sleeves/Item_2.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Sleeves/Item_2.gltf',
							blockName: 'Item 2',
							avatar: 'female',
							category: 'Sleeves',
							templateCategory: 'Dress',
						},
						{
							_id: 'a5f1db00-5b2d-4cfc-8eac-8933e5a4b0dd',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Sleeves/Item_1.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Sleeves/Item_1.gltf',
							blockName: 'Item 1',
							avatar: 'female',
							category: 'Sleeves',
							templateCategory: 'Dress',
						},
					],
				},
				{
					category: 'Bodice',
					blocks: [
						{
							_id: '988b792a-05c8-47f0-b8e4-50147b10782d',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Bodice/Item_5.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Bodice/Item_5.gltf',
							blockName: 'Item 5',
							avatar: 'female',
							category: 'Bodice',
							templateCategory: 'Dress',
						},
						{
							_id: '34ab1f2d-3ee3-435f-83c1-b6caadd8ddc1',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Bodice/Item_4.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Bodice/Item_4.gltf',
							blockName: 'Item 4',
							avatar: 'female',
							category: 'Bodice',
							templateCategory: 'Dress',
						},
						{
							_id: '9c294d6d-083c-45c2-8b62-bda4ada2d961',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Bodice/Item_3.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Bodice/Item_3.gltf',
							blockName: 'Item 3',
							avatar: 'female',
							category: 'Bodice',
							templateCategory: 'Dress',
						},
						{
							_id: '56b5c6ff-01ab-477c-9230-189774f941bd',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Bodice/Item_2.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Bodice/Item_2.gltf',
							blockName: 'Item 2',
							avatar: 'female',
							category: 'Bodice',
							templateCategory: 'Dress',
						},
						{
							_id: 'f5a07c6b-598b-439c-b88b-eaf3b99049c9',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Bodice/Item_1.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Bodice/Item_1.gltf',
							blockName: 'Item 1',
							avatar: 'female',
							category: 'Bodice',
							templateCategory: 'Dress',
						},
					],
				},
			],
		},
		{
			_id: 'cc633204-9247-4fd3-88f3-5f9689e57aaa',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/templates/Dress/Item_4.webp',
			name: 'Item 4',
			price: 'N/A',
			avatar: 'female',
			category: 'Dress',
			materialId: 'Texture - Micro Velvet',
			extraMaterials: [
				{
					mesh: 'pattern_3018146-pattern_2554216-pattern_430464-base_drippy_tight_regular_shoulder_22-front_skirt_1',
					materialId: 'Velvet - 01',
				},
				{
					mesh: 'pattern2d_4878588-pattern2d_4878586-pattern2d_4878584-15-9-pattern2d_3905762',
					materialId: 'Lace - Flower 01',
				},
			],
			fabricOptions: [
				'Texture - Micro Velvet',
				'Velvet - Red',
				'Lace - Flower 05',
				'Lace - Flower 04',
				'Lace - Flower 03',
				'Lace - Flower 02',
				'Lace - Flower 01',
				'Velvet - 08',
				'Velvet - 07',
				'Velvet - 06',
				'Velvet - 05',
				'Velvet - 04',
				'Velvet - 03',
				'Velvet - 02',
				'Velvet - 01',
			],
			blockOptions: [
				{
					category: 'Skirt',
					blocks: [
						{
							_id: '56004db6-d853-493a-8c4f-dcf5ed62bbb5',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Skirt/Item_5.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Skirt/Item_5.glb',
							blockName: 'Item 5',
							avatar: 'female',
							category: 'Skirt',
							templateCategory: 'Dress',
						},
						{
							_id: '9a3a696f-1148-4d62-8745-6c8a94987917',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Skirt/Item_4.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Skirt/Item_4.glb',
							blockName: 'Item 4',
							avatar: 'female',
							category: 'Skirt',
							templateCategory: 'Dress',
						},
						{
							_id: 'a831af1a-08e8-466a-b630-f2b69ca95997',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Skirt/Item_3.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Skirt/Item_3.gltf',
							blockName: 'Item 3',
							avatar: 'female',
							category: 'Skirt',
							templateCategory: 'Dress',
						},
						{
							_id: '1b4f2bc7-5ae2-4502-99b3-84d0943de753',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Skirt/Item_2.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Skirt/Item_2.glb',
							blockName: 'Item 2',
							avatar: 'female',
							category: 'Skirt',
							templateCategory: 'Dress',
						},
						{
							_id: '92e54454-685d-47a7-9376-66ac541ca82f',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Skirt/Item_1.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Skirt/Item_1.glb',
							blockName: 'Item 1',
							avatar: 'female',
							category: 'Skirt',
							templateCategory: 'Dress',
						},
					],
				},
				{
					category: 'Bodice',
					blocks: [
						{
							_id: 'd68e8728-6e5d-4829-82e6-85ae069eaf6c',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Bodice/Item_5.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Bodice/Item_5.gltf',
							blockName: 'Item 5',
							avatar: 'female',
							category: 'Bodice',
							templateCategory: 'Dress',
						},
						{
							_id: 'db5b8907-239e-427c-b31f-9e76d794fcf0',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Bodice/Item_4.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Bodice/Item_4.gltf',
							blockName: 'Item 4',
							avatar: 'female',
							category: 'Bodice',
							templateCategory: 'Dress',
						},
						{
							_id: 'c4a74e35-eef4-4dcf-b5d6-3d2e26b787e6',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Bodice/Item_3.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Bodice/Item_3.gltf',
							blockName: 'Item 3',
							avatar: 'female',
							category: 'Bodice',
							templateCategory: 'Dress',
						},
						{
							_id: 'bd8e585d-f096-4965-a1e8-9317a3713170',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Bodice/Item_2.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Bodice/Item_2.gltf',
							blockName: 'Item 2',
							avatar: 'female',
							category: 'Bodice',
							templateCategory: 'Dress',
						},
						{
							_id: '8adcbfbf-aaf2-42cf-9621-ba5c13789c8b',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Bodice/Item_1.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Bodice/Item_1.gltf',
							blockName: 'Item 1',
							avatar: 'female',
							category: 'Bodice',
							templateCategory: 'Dress',
						},
					],
				},
			],
		},
		{
			_id: '3e174a1a-8782-4417-a549-a1443e7b8fc0',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/templates/Dress/Item_3.webp',
			name: 'Item 3',
			price: 'N/A',
			avatar: 'female',
			category: 'Dress',
			materialId: 'Striped - Metallic 01',
			extraMaterials: [
				{
					mesh: 'front_skirt_1-pattern2d_525099-25-23-22-pattern_705947-214',
					materialId: 'Striped - Metallic 02',
				},
			],
			fabricOptions: [
				'Striped - Metallic 01',
				'Striped - Metallic 05',
				'Striped - Metallic 04',
				'Striped - Metallic 03',
				'Striped - Metallic 02',
			],
			blockOptions: [
				{
					category: 'Skirt',
					blocks: [
						{
							_id: 'f64f4001-ed02-4cbb-8da5-86cb08ef325d',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Skirt/Item_5.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Skirt/Item_5.glb',
							blockName: 'Item 5',
							avatar: 'female',
							category: 'Skirt',
							templateCategory: 'Dress',
						},
						{
							_id: 'c1dec974-6a6b-4f4d-adff-0fc53e3ca497',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Skirt/Item_4.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Skirt/Item_4.gltf',
							blockName: 'Item 4',
							avatar: 'female',
							category: 'Skirt',
							templateCategory: 'Dress',
						},
						{
							_id: '7535daa3-60d1-46b0-b414-4e9f1a466d1b',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Skirt/Item_3.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Skirt/Item_3.gltf',
							blockName: 'Item 3',
							avatar: 'female',
							category: 'Skirt',
							templateCategory: 'Dress',
						},
						{
							_id: 'aee775ef-c853-4fab-a892-ee0ddd194dca',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Skirt/Item_2.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Skirt/Item_2.glb',
							blockName: 'Item 2',
							avatar: 'female',
							category: 'Skirt',
							templateCategory: 'Dress',
						},
						{
							_id: '9941dae4-7d3d-4ce8-83f2-58415feace2b',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Skirt/Item_1.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Skirt/Item_1.glb',
							blockName: 'Item 1',
							avatar: 'female',
							category: 'Skirt',
							templateCategory: 'Dress',
						},
					],
				},
				{
					category: 'Bodice',
					blocks: [
						{
							_id: '243d80a4-662b-4f5b-8597-495c8b2be881',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Bodice/Item_5.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Bodice/Item_5.gltf',
							blockName: 'Item 5',
							avatar: 'female',
							category: 'Bodice',
							templateCategory: 'Dress',
						},
						{
							_id: 'febafc18-4ef1-46bb-82d0-c20c9b252163',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Bodice/Item_4.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Bodice/Item_4.gltf',
							blockName: 'Item 4',
							avatar: 'female',
							category: 'Bodice',
							templateCategory: 'Dress',
						},
						{
							_id: '278f09e9-455a-466d-a0cc-d8a65f876c46',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Bodice/Item_3.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Bodice/Item_3.gltf',
							blockName: 'Item 3',
							avatar: 'female',
							category: 'Bodice',
							templateCategory: 'Dress',
						},
						{
							_id: '789ba6eb-5b4d-41b0-809d-cd6f6dff1d56',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Bodice/Item_2.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Bodice/Item_2.gltf',
							blockName: 'Item 2',
							avatar: 'female',
							category: 'Bodice',
							templateCategory: 'Dress',
						},
						{
							_id: 'fed6da8f-c802-427b-8470-683552a07456',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Bodice/Item_1.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Bodice/Item_1.gltf',
							blockName: 'Item 1',
							avatar: 'female',
							category: 'Bodice',
							templateCategory: 'Dress',
						},
					],
				},
				{
					category: 'Sleeves',
					blocks: [
						{
							_id: 'cf7f5a66-550e-4d0b-bde2-99222386f0e1',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Sleeves/Item_5.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Sleeves/Item_5.glb',
							blockName: 'Item 5',
							avatar: 'female',
							category: 'Sleeves',
							templateCategory: 'Dress',
						},
						{
							_id: '3f0cc6b0-16ff-477f-8487-a8aaeb29688d',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Sleeves/Item_4.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Sleeves/Item_4.gltf',
							blockName: 'Item 4',
							avatar: 'female',
							category: 'Sleeves',
							templateCategory: 'Dress',
						},
						{
							_id: '90c47add-3e0a-4b7f-a863-b83cca8bb6a8',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Sleeves/Item_3.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Sleeves/Item_3.glb',
							blockName: 'Item 3',
							avatar: 'female',
							category: 'Sleeves',
							templateCategory: 'Dress',
						},
						{
							_id: '086f2002-2a8d-487f-b683-c285f1383f43',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Sleeves/Item_2.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Sleeves/Item_2.gltf',
							blockName: 'Item 2',
							avatar: 'female',
							category: 'Sleeves',
							templateCategory: 'Dress',
						},
						{
							_id: '7f500e1c-448b-415b-82f7-58d5a719a649',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Sleeves/Item_1.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Sleeves/Item_1.glb',
							blockName: 'Item 1',
							avatar: 'female',
							category: 'Sleeves',
							templateCategory: 'Dress',
						},
					],
				},
			],
		},
		{
			_id: '46abfd36-e31b-4abb-9ac5-fc78c36d72fb',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/templates/Dress/Item_2.webp',
			name: 'Item 2',
			price: 'N/A',
			avatar: 'female',
			category: 'Dress',
			materialId: 'Velvet - 01',
			extraMaterials: [
				{
					mesh: 'pattern2d_63550',
					materialId: 'Velvet - 01',
				},
				{
					mesh: 'pattern2d_28134-1-pattern_5714551-pattern_5714554-pattern_27679-pattern_27678-pattern_60164-pattern_60163',
					materialId: 'Velvet - 06',
				},
				{
					mesh: 'pattern2d_63551-pattern2d_2231230-pattern2d_1616726-pattern2d_1616728-pattern2d_1616725-pattern2d_1616727-pattern2d_1063645-pattern2d_1063646',
					materialId: 'Velvet - 07',
				},
			],
			fabricOptions: [
				'Velvet - 01',
				'Velvet - 08',
				'Velvet - 07',
				'Velvet - 06',
				'Velvet - 05',
				'Velvet - 04',
				'Velvet - 03',
				'Velvet - 02',
			],
			blockOptions: [
				{
					category: 'Skirt',
					blocks: [
						{
							_id: '82f9e126-8e80-45b2-9e7d-a13caebca854',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Skirt/Item_5.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Skirt/Item_5.gltf',
							blockName: 'Item 5',
							avatar: 'female',
							category: 'Skirt',
							templateCategory: 'Dress',
						},
						{
							_id: '55633175-27a6-45cf-a991-30410a63794f',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Skirt/Item_4.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Skirt/Item_4.gltf',
							blockName: 'Item 4',
							avatar: 'female',
							category: 'Skirt',
							templateCategory: 'Dress',
						},
						{
							_id: '69a921ab-a4a5-4cb4-9577-136a7fcc26ce',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Skirt/Item_3.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Skirt/Item_3.glb',
							blockName: 'Item 3',
							avatar: 'female',
							category: 'Skirt',
							templateCategory: 'Dress',
						},
						{
							_id: '99bea4cf-b00f-4435-b276-5aa8e35a8884',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Skirt/Item_2.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Skirt/Item_2.gltf',
							blockName: 'Item 2',
							avatar: 'female',
							category: 'Skirt',
							templateCategory: 'Dress',
						},
						{
							_id: 'aba2502e-22be-4ab8-a4ae-6405a2da4e82',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Skirt/Item_1.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Skirt/Item_1.gltf',
							blockName: 'Item 1',
							avatar: 'female',
							category: 'Skirt',
							templateCategory: 'Dress',
						},
					],
				},
				{
					category: 'Bodice',
					blocks: [
						{
							_id: '48f392e8-7356-40f0-aa2d-5210db0caa58',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Bodice/Item_5.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Bodice/Item_5.gltf',
							blockName: 'Item 5',
							avatar: 'female',
							category: 'Bodice',
							templateCategory: 'Dress',
						},
						{
							_id: '5e018f5e-b3c2-4c06-9ed0-e3592164477c',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Bodice/Item_4.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Bodice/Item_4.gltf',
							blockName: 'Item 4',
							avatar: 'female',
							category: 'Bodice',
							templateCategory: 'Dress',
						},
						{
							_id: 'fff30506-3eb2-4294-8f46-b97101a5d0d9',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Bodice/Item_3.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Bodice/Item_3.gltf',
							blockName: 'Item 3',
							avatar: 'female',
							category: 'Bodice',
							templateCategory: 'Dress',
						},
						{
							_id: 'bf51316a-3c03-4c66-b714-5794b0ac3257',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Bodice/Item_2.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Bodice/Item_2.gltf',
							blockName: 'Item 2',
							avatar: 'female',
							category: 'Bodice',
							templateCategory: 'Dress',
						},
						{
							_id: '7a4c26e1-3b2f-41de-bae3-5405c94ccbfd',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Bodice/Item_1.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Bodice/Item_1.gltf',
							blockName: 'Item 1',
							avatar: 'female',
							category: 'Bodice',
							templateCategory: 'Dress',
						},
					],
				},
				{
					category: 'Sleeves',
					blocks: [
						{
							_id: 'fcf81ffd-9e45-4cdc-89d0-c8ae82d92311',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Sleeves/Item_5.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Sleeves/Item_5.gltf',
							blockName: 'Item 5',
							avatar: 'female',
							category: 'Sleeves',
							templateCategory: 'Dress',
						},
						{
							_id: '98e28f18-780b-4bfc-bf46-525939e4f4a0',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Sleeves/Item_4.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Sleeves/Item_4.gltf',
							blockName: 'Item 4',
							avatar: 'female',
							category: 'Sleeves',
							templateCategory: 'Dress',
						},
						{
							_id: '8be61f21-e51e-4ccf-9230-93807960e25d',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Sleeves/Item_3.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Sleeves/Item_3.gltf',
							blockName: 'Item 3',
							avatar: 'female',
							category: 'Sleeves',
							templateCategory: 'Dress',
						},
						{
							_id: 'e653f55d-4b28-4d3d-91ad-815fda18bcc6',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Sleeves/Item_2.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Sleeves/Item_2.gltf',
							blockName: 'Item 2',
							avatar: 'female',
							category: 'Sleeves',
							templateCategory: 'Dress',
						},
						{
							_id: '24bcac90-d85d-49eb-9b34-4df74f85c328',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Sleeves/Item_1.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Sleeves/Item_1.gltf',
							blockName: 'Item 1',
							avatar: 'female',
							category: 'Sleeves',
							templateCategory: 'Dress',
						},
					],
				},
			],
		},
		{
			_id: 'd87cbf05-05d8-4d08-8a20-c569bbb48cde',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/templates/Dress/Item_1.webp',
			name: 'Item 1',
			price: 'N/A',
			avatar: 'female',
			category: 'Dress',
			materialId: 'Muslin - White',
			extraMaterials: [
				{
					mesh: 'sleeve_(right_arm)_1-pattern_60164-pattern_60163-43-pattern_5665-pattern_14236-pattern_1161011-pattern_1318891-pattern_1318892-pattern_1318893-pattern_1318894-pattern_1318895-pattern_1318896-pattern_1318897-pattern_2233571',
					materialId: 'Muslin - Brown',
				},
			],
			fabricOptions: ['Muslin - White', 'Muslin - Green', 'Muslin - Brown', 'Muslin - Blue', 'Muslin - Pink'],
			blockOptions: [
				{
					category: 'Sleeves',
					blocks: [
						{
							_id: '23323760-4014-4e3d-942e-61ee72996b1e',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Sleeves/Sleeves_5.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Sleeves/Sleeves_5.gltf',
							blockName: 'Sleeves 5',
							avatar: 'female',
							category: 'Sleeves',
							templateCategory: 'Dress',
						},
						{
							_id: '08246989-4a53-4afe-ae27-728704594b52',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Sleeves/Sleeves_4.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Sleeves/Sleeves_4.gltf',
							blockName: 'Sleeves 4',
							avatar: 'female',
							category: 'Sleeves',
							templateCategory: 'Dress',
						},
						{
							_id: '1bd17a67-6acb-42db-8c62-1bae85841109',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Sleeves/Sleeves_3.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Sleeves/Sleeves_3.gltf',
							blockName: 'Sleeves 3',
							avatar: 'female',
							category: 'Sleeves',
							templateCategory: 'Dress',
						},
						{
							_id: '3f020eb7-5a05-492c-a704-7d47a944e7af',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Sleeves/Sleeves_2.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Sleeves/Sleeves_2.gltf',
							blockName: 'Sleeves 2',
							avatar: 'female',
							category: 'Sleeves',
							templateCategory: 'Dress',
						},
						{
							_id: '1297ca6f-0194-4adc-baf5-20fc0db74149',
							thumb:
								'https://d1e6s1h8cqcr26.cloudfront.net/images/sapienzaUniversityOfRome/options/Dress/Sleeves/Sleeves_1.webp',
							modelFile:
								'https://d1e6s1h8cqcr26.cloudfront.net/models/sapienzaUniversityOfRome/options/Dress/Sleeves/Sleeves_1.gltf',
							blockName: 'Sleeves 1',
							avatar: 'female',
							category: 'Sleeves',
							templateCategory: 'Dress',
						},
					],
				},
			],
		},
	],
}
