import {GLTFLoader, type GLTF} from 'three/examples/jsm/loaders/GLTFLoader.js'
import {fabrics} from '../consts/fabrics.js'
import {getBlocksForTemplate} from '../consts/relationships.js'
import type {Block, BlockCategory} from '../types/block.js'
import type {Fabric} from '../types/fabric.js'
import type {Template, TemplateCategory} from '../types/template.js'
import type {Space} from '../types/types.js'

class BlockManager {
	preloadTemplateBlocks(template: Template, selectedSpace: Space): Promise<GLTF>[] {
		const blocks = getBlocksForTemplate(template, selectedSpace?.collection)
		const gltfLoader = new GLTFLoader()
		return blocks.map(block => gltfLoader.loadAsync(block.modelFile))
	}

	replaceSelectedBlocks(
		blockData: {blocks: Block[]; templateCategory: TemplateCategory; materialId: string}[],
		selectedSpace: Space,
	) {
		// Completely replace selectedBlocks with new blocks (used for template selection)
		const newBlocks = new Map<TemplateCategory, Map<BlockCategory, Block>>()
		const newFabrics: {fabric: Fabric; blockCategory: BlockCategory; templateCategory: TemplateCategory}[] = []

		for (const {blocks, templateCategory, materialId} of blockData) {
			const templateBlocks = new Map<BlockCategory, Block>()
			for (const block of blocks) {
				templateBlocks.set(block.category, block)
				if (materialId) {
					const fabric = fabrics[selectedSpace?.collection ?? 'moidien']?.find(
						fabric => `${fabric.category} - ${fabric.materialName}` === materialId,
					)
					if (fabric) {
						newFabrics.push({
							fabric: fabric,
							blockCategory: block.category,
							templateCategory: templateCategory,
						})
					}
				}
			}
			if (templateBlocks.size > 0) {
				newBlocks.set(templateCategory, templateBlocks)
			}
		}

		return {newBlocks, newFabrics}
	}
}

export const blockManager = new BlockManager()
