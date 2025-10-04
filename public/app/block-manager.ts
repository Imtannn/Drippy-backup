import {GLTFLoader, type GLTF} from 'three/examples/jsm/loaders/GLTFLoader.js'
import {blocks as collectionBlocks} from '../consts/blocks.js'
import {fabrics} from '../consts/fabrics.js'
import {getBlocksForTemplate, getFabricForTemplate} from '../consts/relationships.js'
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
		Jumpsuit: ['Sleeves'],
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
			Dress: ['Shirt', 'Top', 'Pants', 'Skirt', 'Jumpsuit', 'Jacket'],
			Top: ['Dress', 'Jumpsuit', 'Jacket'],
			Shirt: ['Dress', 'Jumpsuit', 'Jacket'],
			Jacket: ['Coat', 'Shirt', 'Top', 'Jumpsuit', 'Dress'],
			Skirt: ['Pants', 'Dress', 'Jumpsuit'],
			Pants: ['Skirt', 'Dress', 'Jumpsuit'],
			Coat: ['Dress', 'Shirt', 'Top', 'Pants', 'Skirt', 'Jacket'],
			Jumpsuit: ['Dress', 'Shirt', 'Top', 'Pants', 'Skirt', 'Jacket'],
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
	 * @param fabricOverrides - The fabric overrides
	 * @returns The new blocks and fabrics
	 */
	getBlocksAndFabricsMapFromTemplateData(
		templateData: {
			blocks: Block[]
			materialId: string
			extraMaterials?: {mesh: string; materialId: string}[]
		},
		selectedSpace: Space,
		fabricOverrides?: Map<BlockCategory, Map<string, Fabric>>,
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

			// Check if there are fabric overrides for this block category
			const overrideFabrics = fabricOverrides?.get(block.category)

			if (overrideFabrics && overrideFabrics.size > 0) {
				// Use fabric overrides from URL
				for (const [assignedMesh, fabric] of overrideFabrics.entries()) {
					newFabrics.push({
						fabric: fabric,
						blockCategory: block.category,
						assignedMesh: assignedMesh,
					})
				}
			} else {
				// Use default template fabrics
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
		}

		const newFabricsMap = this.parseFabricDataToMap(newFabrics)

		return {newBlocksMap, newFabricsMap}
	}

	/**
	 * Build fabric overrides map from URL parameters
	 * @param fabricsParam - The fabrics URL parameter (e.g., "Shirt-Bodice-default:fabric123,Pants-Waist-default:fabric456")
	 * @param spaceFabrics - Available fabrics for the current space
	 * @returns Map of fabric overrides organized by template category and block category
	 */
	buildFabricOverridesFromUrl(
		fabricsParam: string,
		spaceFabrics: Fabric[],
	): Map<TemplateCategory, Map<BlockCategory, Map<string, Fabric>>> {
		const fabricOverrides = new Map<TemplateCategory, Map<BlockCategory, Map<string, Fabric>>>()

		const fabricEntries = fabricsParam.split(',')
		for (const fabricEntry of fabricEntries) {
			const [pathPart, fabricId] = fabricEntry.split(':')
			if (!pathPart || !fabricId) continue

			const dashIndex1 = pathPart.indexOf('-')
			if (dashIndex1 === -1) continue

			const templateCategory = pathPart.substring(0, dashIndex1)
			const remaining = pathPart.substring(dashIndex1 + 1)

			const dashIndex2 = remaining.indexOf('-')
			if (dashIndex2 === -1) continue

			const blockCategory = remaining.substring(0, dashIndex2)
			const piece = remaining.substring(dashIndex2 + 1)

			if (!templateCategory || !blockCategory || !piece) continue

			const fabric = spaceFabrics.find(f => f._id === fabricId.trim())
			if (!fabric) continue

			// Get or create the template's fabric map
			let templateFabrics = fabricOverrides.get(templateCategory as TemplateCategory)
			if (!templateFabrics) {
				templateFabrics = new Map<BlockCategory, Map<string, Fabric>>()
				fabricOverrides.set(templateCategory as TemplateCategory, templateFabrics)
			}

			// Get or create the block category's fabric map
			let blockFabrics = templateFabrics.get(blockCategory as BlockCategory)
			if (!blockFabrics) {
				blockFabrics = new Map<string, Fabric>()
				templateFabrics.set(blockCategory as BlockCategory, blockFabrics)
			}

			blockFabrics.set(piece, fabric)
		}

		return fabricOverrides
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
			if (
				selectedBlock?.templateName !== 'Pleated long sleeve shirt' &&
				(options.selectedSpace?.collection === 'moidien' || options.sourceCollection === 'moidien')
			) {
				return []
			}

			if (options?.selectedSpace?.collection === 'oofya' || options?.sourceCollection === 'oofya') {
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

	getAvailableFabricsForTemplate(
		sourceCollection: string | null | undefined,
		template: Template,
	): Record<string, Fabric[]> {
		// use template.materialId to get the fabric
		// only filter fabrics that both include template.category and fabric.category
		const collection = sourceCollection ?? 'moidien'
		const availableFabrics: Record<string, Fabric[]> = {}

		const templateFabric = getFabricForTemplate(template, collection)

		availableFabrics['default'] = (fabrics[collection] ?? []).filter(
			fabric => fabric.templateCategories?.includes(template.category) && fabric.category === templateFabric?.category,
		)

		if (template.extraMaterials && template.extraMaterials.length > 0) {
			for (const extraMaterial of template.extraMaterials) {
				const extraFabric = fabrics[collection]?.find(
					fabric => `${fabric.category} - ${fabric.materialName}` === extraMaterial.materialId,
				)
				console.log('extraFabric', extraFabric)
				availableFabrics[extraMaterial.mesh] = (fabrics[collection] ?? []).filter(
					fabric => fabric.templateCategories?.includes(template.category) && fabric.category === extraFabric?.category,
				)
			}
		}

		console.log('availableFabrics', availableFabrics, template)

		return availableFabrics
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
