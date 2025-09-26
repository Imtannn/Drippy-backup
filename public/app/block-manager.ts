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
		blockData: {
			blocks: Block[]
			templateCategory: TemplateCategory
			materialId: string
			extraMaterials?: {mesh: string; materialId: string}[]
		}[],
		selectedSpace: Space,
	) {
		// Completely replace selectedBlocks with new blocks (used for template selection)
		const newBlocks = new Map<TemplateCategory, Map<BlockCategory, Block>>()
		const newFabrics: {
			fabric: Fabric
			blockCategory: BlockCategory
			templateCategory: TemplateCategory
			assignedMesh: string
		}[] = []

		for (const {blocks, templateCategory, materialId, extraMaterials} of blockData) {
			const templateBlocks = new Map<BlockCategory, Block>()
			for (const block of blocks) {
				templateBlocks.set(block.category, block)

				// Create fabrics array for this block category
				const blockFabrics: Record<string, Fabric> = {}

				// Add the main fabric (without assignedMesh - will be default)
				if (materialId) {
					const fabric = fabrics[selectedSpace?.collection ?? 'moidien']?.find(
						fabric => `${fabric.category} - ${fabric.materialName}` === materialId,
					)
					if (fabric) {
						blockFabrics[fabric.assignedMesh || 'default'] = fabric
					}
				}

				// Add extra materials with specific mesh assignments
				if (extraMaterials) {
					for (const extraMaterial of extraMaterials) {
						const extraFabric = fabrics[selectedSpace?.collection ?? 'moidien']?.find(
							fabric => `${fabric.category} - ${fabric.materialName}` === extraMaterial.materialId,
						)
						if (extraFabric) {
							blockFabrics[extraMaterial.mesh] = extraFabric
						}
					}
				}

				// Add all fabrics for this block category
				for (const [assignedMesh, fabric] of Object.entries(blockFabrics)) {
					newFabrics.push({
						fabric: fabric,
						blockCategory: block.category,
						templateCategory: templateCategory,
						assignedMesh: assignedMesh,
					})
				}
			}
			if (templateBlocks.size > 0) {
				newBlocks.set(templateCategory, templateBlocks)
			}
		}

		return {newBlocks, newFabrics}
	}

	parseBlocksToMaterials(blocks: Block[]) {
		// Completely replace selectedBlocks with new blocks (used for template selection)
		const newBlocks = new Map<TemplateCategory, Map<BlockCategory, Block>>()

		for (const block of blocks) {
			const templateBlocks = new Map<BlockCategory, Block>()
			templateBlocks.set(block.category, block)
			if (templateBlocks.size > 0) {
				newBlocks.set(block.templateCategory, templateBlocks)
			}
		}

		return newBlocks
	}
}

export const blockManager = new BlockManager()
