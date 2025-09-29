import {GLTFLoader, type GLTF} from 'three/examples/jsm/loaders/GLTFLoader.js'
import {blocks as collectionBlocks} from '../consts/blocks.js'
import {fabrics} from '../consts/fabrics.js'
import {getBlocksForTemplate} from '../consts/relationships.js'
import type {Block, BlockCategory} from '../types/block.js'
import type {Fabric} from '../types/fabric.js'
import type {Template, TemplateCategory} from '../types/template.js'
import type {Space} from '../types/types.js'

class BlockManager {
	private readonly availableBlocksMapping: Record<TemplateCategory, BlockCategory[]> = {
		All: [],
		Shirt: ['Sleeves'],
		Jacket: ['Sleeves'],
		Pants: [],
		Accessories: [],
		Dress: [],
		Skirt: [],
		Top: [],
		Coat: ['Sleeves'],
	}

	preloadTemplateBlocks(template: Block): Promise<GLTF> {
		const gltfLoader = new GLTFLoader()
		return gltfLoader.loadAsync(template.modelFile)
	}

	/**
	 * Check if the category is interchangeable with other categories
	 * @param category - The category to check
	 * @param selectedTemplates - The selected templates
	 * @returns The interchangeable categories
	 */
	checkInterchangeableCategories(category: TemplateCategory, selectedTemplates: Map<TemplateCategory, Template>) {
		const interchangeableCategoriesMapping: Record<string, Partial<TemplateCategory>[]> = {
			Dress: ['Shirt', 'Top', 'Pants', 'Skirt'],
			Top: ['Dress'],
			Shirt: ['Dress'],
			Jacket: ['Coat'],
			Skirt: ['Pants', 'Dress'],
			Pants: ['Skirt', 'Dress'],
			Coat: ['Jacket'],
		}

		const interchangeableCategories = interchangeableCategoriesMapping[category]

		return interchangeableCategories?.filter(c => selectedTemplates.has(c as TemplateCategory)) ?? []
	}

	/**
	 * Convert template to block data
	 * @param selectedTemplate - The selected template
	 * @param selectedSpace - The selected space
	 * @returns The block data
	 */
	convertTemplateToBlockData(selectedTemplate: Template, selectedSpace: Space) {
		const templateBlocks = getBlocksForTemplate(selectedTemplate, selectedSpace?.collection)
		return {
			blocks: templateBlocks,
			materialId: selectedTemplate.materialId ?? '',
			extraMaterials: selectedTemplate.extraMaterials,
		}
	}

	/**
	 * Parse fabric data to map
	 * @param defaultFabrics - The default fabrics
	 * @param fabricData - The fabric data
	 * @returns The new fabrics
	 */
	parseFabricDataToMap(
		fabricData:
			| {fabric: Fabric; blockCategory: BlockCategory; assignedMesh?: string}
			| {fabric: Fabric; blockCategory: BlockCategory; assignedMesh?: string}[],
	) {
		if (!Array.isArray(fabricData)) {
			fabricData = [fabricData]
		}
		const newFabrics = new Map<BlockCategory, Map<string, Fabric>>()

		for (let {fabric, blockCategory, assignedMesh} of fabricData) {
			if (!assignedMesh) {
				assignedMesh = 'default'
			}

			const existingFabricsMap = newFabrics.get(blockCategory) || new Map<string, Fabric>()
			existingFabricsMap.set(assignedMesh, fabric)
			newFabrics.set(blockCategory, existingFabricsMap)
		}

		return newFabrics
	}

	/**
	 * Get blocks and fabrics from template data
	 * @param blockData - The block data
	 * @param selectedSpace - The selected space
	 * @returns The new blocks and fabrics
	 */
	getBlocksAndFabricsMapFromTemplateData(
		templateData: {
			blocks: Block[]
			materialId: string
			extraMaterials?: {mesh: string; materialId: string}[]
		},
		selectedSpace: Space,
	) {
		// Completely replace selectedBlocks with new blocks (used for template selection)
		const newBlocksMap = new Map<BlockCategory, Block>()
		const newFabrics: {
			fabric: Fabric
			blockCategory: BlockCategory
			assignedMesh: string
		}[] = []

		for (const block of templateData.blocks) {
			newBlocksMap.set(block.category, block)

			// Create fabrics array for this block category
			const blockFabrics: Record<string, Fabric> = {}

			// Add the main fabric (without assignedMesh - will be default)
			if (templateData.materialId) {
				const fabric = fabrics[selectedSpace?.collection ?? 'moidien']?.find(
					fabric => `${fabric.category} - ${fabric.materialName}` === templateData.materialId,
				)
				if (fabric) {
					blockFabrics[fabric.assignedMesh || 'default'] = fabric
				}
			}

			// Add extra materials with specific mesh assignments
			if (templateData.extraMaterials) {
				for (const extraMaterial of templateData.extraMaterials) {
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
					assignedMesh: assignedMesh,
				})
			}
		}

		const newFabricsMap = this.parseFabricDataToMap(newFabrics)

		return {newBlocksMap, newFabricsMap}
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

	getBlockCategoriesForTemplateCategory(
		templateCategory: TemplateCategory,
		options: {
			selectedBlocks?: Map<TemplateCategory, Map<BlockCategory, Block>> | undefined
			selectedSpace?: Space | null | undefined
			sourceCollection?: string | null | undefined
		},
		collectionOverride?: string | null | undefined,
	): BlockCategory[] {
		const mappingCategories = [...(this.availableBlocksMapping[templateCategory] || [])] as BlockCategory[]
		const collection = collectionOverride ?? options.sourceCollection ?? options.selectedSpace?.collection ?? 'moidien'
		const blocks = this.getBlocksForTemplateCategory(templateCategory, collection)
		const categoriesFromBlocks = new Set<BlockCategory>(blocks.map(block => block.category))

		if (templateCategory === 'Shirt') {
			const selectedBlock = options.selectedBlocks?.get(templateCategory)?.get('Bodice')
			if (selectedBlock?.templateId !== '13' && options.selectedSpace?.collection === 'moidien') {
				return []
			}
		}

		const filteredMapping = mappingCategories.filter(category => categoriesFromBlocks.has(category))

		return filteredMapping
	}

	getAvailableFabricsForTemplateCategory(
		sourceCollection: string | null | undefined,
		templateCategory: TemplateCategory,
	): Fabric[] {
		const collection = sourceCollection ?? 'moidien'
		return (fabrics[collection] ?? []).filter(fabric => fabric.templateCategories?.includes(templateCategory))
	}

	getBlocksForTemplateCategory(templateCategory: TemplateCategory, collection: string | null | undefined) {
		const resolvedCollection = collection ?? 'moidien'
		return (collectionBlocks[resolvedCollection] ?? []).filter(block => block.templateCategory === templateCategory)
	}

	isRemixAvailableForTemplate(
		templateCategory: TemplateCategory,
		options: {
			selectedBlocks?: Map<TemplateCategory, Map<BlockCategory, Block>> | undefined
			selectedSpace?: Space | null | undefined
			sourceCollection?: string | null | undefined
		},
	) {
		if (!['Shirt', 'Jacket', 'Pants', 'Dress', 'Skirt', 'Top'].includes(templateCategory))
			return {available: false, blocksCategories: [], fabrics: []}
		const blocksCategories = this.getBlockCategoriesForTemplateCategory(templateCategory, options)
		const fabrics = this.getAvailableFabricsForTemplateCategory(
			options.sourceCollection ?? options.selectedSpace?.collection,
			templateCategory,
		)
		return {
			available: blocksCategories.length > 0 || fabrics.length > 0,
			blocksCategories,
			fabrics,
		}
	}
}

export const blockManager = new BlockManager()
