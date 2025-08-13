import type {Block} from '../types/block'

export const blocks: Block[] = [
	{
		_id: '1',
		thumb: new URL('../images/piece_1.png', import.meta.url),
		modelFile: new URL('../models/Bodice 228.gltf', import.meta.url),
		blockName: 'Bodice 228',
		avatar: 'Female',
		category: 'Bodice',
	},
	{
		_id: '2',
		thumb: new URL('../images/piece_2.png', import.meta.url),
		modelFile: new URL('../models/Bodice 350.gltf', import.meta.url),
		blockName: 'Bodice 350',
		avatar: 'Female',
		category: 'Bodice',
	},
	{
		_id: '3',
		thumb: new URL('../images/piece_3.png', import.meta.url),
		modelFile: new URL('../models/skirt-168.gltf', import.meta.url),
		blockName: 'skirt168',
		avatar: 'Female',
		category: 'Skirt',
	},
	{
		_id: '4',
		thumb: new URL('../images/piece_4.png', import.meta.url),
		modelFile: new URL('../models/Bodice 358.gltf', import.meta.url),
		blockName: 'Bodice 358',
		avatar: 'Female',
		category: 'Bodice',
	},
	{
		_id: '6',
		thumb: new URL('../images/piece_6.png', import.meta.url),
		modelFile: new URL('../models/Skirt 351.gltf', import.meta.url),
		blockName: 'Skirt 351',
		avatar: 'Female',
		category: 'Skirt',
	},
	{
		_id: '7',
		thumb: new URL('../images/piece_1.png', import.meta.url),
		modelFile: new URL('../models/Sleeves 399.gltf', import.meta.url),
		blockName: 'Sleeves 399',
		avatar: 'Female',
		category: 'Sleeves',
	},
]
