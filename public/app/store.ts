import {createMutable} from 'solid-js/store'
import type {Block} from '../types/block.js'
import type {Fabric} from '../types/fabric.js'

export const store = createMutable({
	// key is the block category, value is the block
	selectedBlocks: new Map<string, Block>(),
	selectedFabric: null as Fabric | null,
	set setSelectedBlocks(blocks: Block[] | Block) {
		if (!Array.isArray(blocks)) {
			blocks = [blocks]
		}
		const newBlocks = new Map<string, Block>(this.selectedBlocks)
		// check if the block with same category already exists
		for (const block of blocks) {
			if (this.selectedBlocks.has(block.category)) {
				// if it exists, check if the block is the same, if so, remove it
				if (this.selectedBlocks.get(block.category)?._id === block._id) {
					newBlocks.delete(block.category)
				} else {
					newBlocks.set(block.category, block)
				}
			} else {
				// if not, add it
				newBlocks.set(block.category, block)
			}
		}
		this.selectedBlocks = newBlocks
	},
	set setSelectedFabrics(fabric: Fabric) {
		this.selectedFabric = fabric
	},
})
