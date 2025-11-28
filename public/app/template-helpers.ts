import {blocks, blocks as collectionBlocks} from '../consts/blocks.js'
import {fabrics} from '../consts/fabrics.js'
import {templates} from '../consts/templates.js'
import type {Block, BlockCategory} from '../types/block.js'
import type {Fabric} from '../types/fabric.js'
import type {Template, TemplateCategory} from '../types/template.js'
import type {
	BlockFabricsMap,
	CategoryBlocksMap,
	PieceFabricsMap,
	SelectedGarments,
	Space,
	TemplateBlocksMap,
	TemplateCategorySelection,
	TemplateFabricsMap,
	TemplateMap,
} from '../types/types.js'
import {getSpacePrimaryCollection} from '../utils.js'

/**
 * Data Relationships Documentation
 *
 * See relationships.md for comprehensive documentation.
 *
 * Quick reference (see relationships.md for more details):
 * - Spaces → Collections: spaces list collection slugs that must exist in the collections catalog
 * - Templates/Blocks/Fabrics share the collection slug to stay within the same dataset boundary
 * - Templates → Blocks: link via block.templateId === template._id
 * - Templates → Fabrics: reference fabric IDs directly (materialId and extraMaterials IDs)
 */

class TemplateHelpers {
	private readonly availableBlocksMapping: Record<TemplateCategory, BlockCategory[]> = {
		All: [],
		Shirt: ['Sleeves'],
		Jacket: ['Sleeves'],
		Pants: [],
		Accessories: [],
		Dress: [],
		Skirt: [],
		Top: ['Sleeves'],
		Coat: ['Sleeves'],
		Jumpsuit: ['Sleeves'],
	}

	private readonly overridingCategoriesMapping: Record<string, TemplateCategory[]> = {
		Dress: ['Shirt', 'Top', 'Pants', 'Skirt', 'Jumpsuit', 'Jacket'],
		Top: ['Dress', 'Jacket'],
		Shirt: ['Dress', 'Jumpsuit', 'Jacket'],
		Jacket: ['Coat', 'Shirt', 'Top', 'Jumpsuit', 'Dress'],
		Skirt: ['Pants', 'Dress', 'Jumpsuit'],
		Pants: ['Skirt', 'Dress'],
		Coat: ['Dress', 'Shirt', 'Top', 'Pants', 'Skirt', 'Jacket'],
		Jumpsuit: ['Dress', 'Shirt', 'Skirt', 'Jacket'],
	}

	/**
	 * Resolve available fabrics scoped to a specific fabric category.
	 *
	 * @param fabricCategory - Category slug pulled from a template fabric.
	 * @param collection - Collection slug to read from; defaults to `gap`.
	 * @returns Fabrics that belong to the requested category within the collection.
	 */
	#getFabricsByFabricCategory(fabricCategory?: string, collection: string = 'gap'): Fabric[] {
		if (!fabricCategory) return []

		const fabricsInCategory = (fabrics[collection] ?? []).filter(fabric => fabric.category === fabricCategory)

		return fabricsInCategory
	}

	/**
	 * Create a defensive copy of the user's garment selection.
	 *
	 * @param selection - Current selection keyed by template category then block category.
	 * @returns New object graph that shares no nested references with the input.
	 */
	cloneSelectedGarments(selection: SelectedGarments): SelectedGarments {
		const cloned: SelectedGarments = {}

		for (const [templateCategory, templateSelection] of Object.entries(selection)) {
			if (!templateSelection) continue

			const clonedTemplate: TemplateCategorySelection = {}
			for (const [blockCategory, garment] of Object.entries(templateSelection)) {
				if (!garment) continue

				clonedTemplate[blockCategory as BlockCategory] = {
					block: garment.block ?? null,
					fabrics: {...garment.fabrics},
				}
			}

			if (Object.keys(clonedTemplate).length > 0) {
				cloned[templateCategory as TemplateCategory] = clonedTemplate
			}
		}

		return cloned
	}

	/**
	 * Merge block and fabric maps into the `TemplateCategorySelection` structure.
	 *
	 * @param blocksMap - Map of block categories to the selected block.
	 * @param fabricsMap - Map of block categories to fabric selections for each mesh.
	 * @returns Selection record consumable by the garment store.
	 */
	buildTemplateSelectionFromMaps(
		blocksMap?: CategoryBlocksMap,
		fabricsMap?: BlockFabricsMap,
	): TemplateCategorySelection {
		const templateSelection: TemplateCategorySelection = {}

		if (blocksMap) {
			for (const [blockCategory, block] of blocksMap.entries()) {
				const current = templateSelection[blockCategory] ?? {block: null, fabrics: {}}
				current.block = block
				templateSelection[blockCategory] = current
			}
		}

		if (fabricsMap) {
			for (const [blockCategory, fabricMap] of fabricsMap.entries()) {
				const fabricsRecord = Object.fromEntries(fabricMap.entries())
				const current = templateSelection[blockCategory] ?? {block: null, fabrics: {}}
				current.fabrics = fabricsRecord
				templateSelection[blockCategory] = current
			}
		}

		return templateSelection
	}

	/**
	 * Hydrate a `SelectedGarments` object from per-template block and fabric maps.
	 *
	 * @param blocksMap - Template to block-category map produced elsewhere in the pipeline.
	 * @param fabricsMap - Template to fabric map mirroring the same keys.
	 * @returns Combined garment selection grouped by template category.
	 */
	buildSelectedGarmentsFromMaps(blocksMap: TemplateBlocksMap, fabricsMap: TemplateFabricsMap): SelectedGarments {
		const result: SelectedGarments = {}
		const templateCategories = new Set<TemplateCategory>([
			...(blocksMap.keys() as Iterable<TemplateCategory>),
			...(fabricsMap.keys() as Iterable<TemplateCategory>),
		])

		for (const templateCategory of templateCategories) {
			const templateBlocks = blocksMap.get(templateCategory)
			const templateFabrics = fabricsMap.get(templateCategory)
			const templateSelection = this.buildTemplateSelectionFromMaps(templateBlocks, templateFabrics)

			if (Object.keys(templateSelection).length > 0) {
				result[templateCategory] = templateSelection
			}
		}

		return result
	}

	/**
	 * Remove specific template categories from the current selection.
	 *
	 * @param selection - Full garment selection.
	 * @param templateCategories - Categories to drop.
	 * @returns New selection without the omitted template categories.
	 */
	omitTemplateCategories(
		selection: SelectedGarments,
		templateCategories: Iterable<TemplateCategory>,
	): SelectedGarments {
		const cloned = this.cloneSelectedGarments(selection)

		for (const templateCategory of templateCategories) {
			if (templateCategory in cloned) {
				delete cloned[templateCategory]
			}
		}

		return cloned
	}

	/**
	 * Replace the selection of a single template category.
	 *
	 * @param selection - Existing garment selection.
	 * @param templateCategory - Category to update.
	 * @param templateSelection - New selection for the given category.
	 * @returns Updated garment selection.
	 */
	withTemplateSelection(
		selection: SelectedGarments,
		templateCategory: TemplateCategory,
		templateSelection: TemplateCategorySelection,
	): SelectedGarments {
		const cloned = this.cloneSelectedGarments(selection)

		if (Object.keys(templateSelection).length === 0) {
			delete cloned[templateCategory]
		} else {
			cloned[templateCategory] = templateSelection
		}

		return cloned
	}

	/**
	 * Determine which template categories must be cleared before adding another.
	 *
	 * @param category - Category being toggled on.
	 * @param selectedTemplates - Currently selected templates keyed by category.
	 * @returns Categories that conflict with the requested category.
	 */
	checkOverridingCategories(category: TemplateCategory, selectedTemplates: TemplateMap): TemplateCategory[] {
		const overridingCategories = this.overridingCategoriesMapping[category] as TemplateCategory[] | undefined

		return overridingCategories?.filter(c => selectedTemplates.has(c)) ?? []
	}

	/**
	 * Convert template to block data used by downstream selection flows.
	 *
	 * @param selectedTemplate - Template the user picked.
	 * @param collection - Collection slug used when resolving blocks.
	 * @returns Block data shape storing blocks and material metadata.
	 */
	convertTemplateToBlockData(selectedTemplate: Template, collection: string | null | undefined) {
		const templateBlocks = this.#resolveBlocksForTemplate(selectedTemplate, collection)
		return {
			blocks: templateBlocks,
			materialId: selectedTemplate.materialId ?? '',
			extraMaterials: selectedTemplate.extraMaterials,
		}
	}

	#resolveBlocksForTemplate(template: Template, collection: string | null | undefined): Block[] {
		const lookupOrder: string[] = []

		if (collection) {
			lookupOrder.push(collection)
		}

		if (template.collection && !lookupOrder.includes(template.collection)) {
			lookupOrder.push(template.collection)
		}

		for (const slug of lookupOrder) {
			const matches = (collectionBlocks[slug] ?? []).filter(block => block.templateId === template._id)
			if (matches.length > 0) {
				return matches
			}
		}

		for (const blocksList of Object.values(collectionBlocks)) {
			const matches = blocksList.filter(block => block.templateId === template._id)
			if (matches.length > 0) {
				return matches
			}
		}

		return []
	}

	/**
	 * Convert fabric assignment payloads into a map keyed by block category and mesh.
	 *
	 * @param fabricData - Single or multiple fabric assignments.
	 * @returns Block to piece fabric map for downstream consumption.
	 */
	#parseFabricDataToMap(
		fabricData:
			| {fabric: Fabric; blockCategory: BlockCategory; assignedMesh?: string}
			| {fabric: Fabric; blockCategory: BlockCategory; assignedMesh?: string}[],
	): BlockFabricsMap {
		if (!Array.isArray(fabricData)) {
			fabricData = [fabricData]
		}
		const newFabrics: BlockFabricsMap = new Map()

		for (let {fabric, blockCategory, assignedMesh} of fabricData) {
			if (!assignedMesh) {
				assignedMesh = 'default'
			}

			const existingFabricsMap: PieceFabricsMap = newFabrics.get(blockCategory) ?? new Map()
			existingFabricsMap.set(assignedMesh, fabric)
			newFabrics.set(blockCategory, existingFabricsMap)
		}

		return newFabrics
	}

	/**
	 * Generate replacement block and fabric maps when a template is selected.
	 *
	 * @param templateData - Block and material information sourced from a template.
	 * @param collection - Collection slug that drives fabric lookup.
	 * @param fabricOverrides - Overrides parsed from URL state.
	 * @returns Maps of blocks and fabrics ready to merge into selections.
	 */
	getBlocksAndFabricsMapFromTemplateData(
		templateData: {
			blocks: Block[]
			materialId: string
			extraMaterials?: {mesh: string; materialId: string}[]
		},
		collection: string | null | undefined,
		fabricOverrides?: BlockFabricsMap,
	) {
		// Completely replace selectedBlocks with new blocks (used for template selection)
		const newBlocksMap: CategoryBlocksMap = new Map()
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
					const fabric = fabrics[collection ?? 'gap']?.find(fabric => fabric._id === templateData.materialId)
					if (fabric) {
						blockFabrics[fabric.assignedMesh || 'default'] = fabric
					}
				}

				// Add extra materials with specific mesh assignments
				if (templateData.extraMaterials) {
					for (const extraMaterial of templateData.extraMaterials) {
						const extraFabric = fabrics[collection ?? 'gap']?.find(fabric => fabric._id === extraMaterial.materialId)
						if (extraFabric) {
							blockFabrics[extraMaterial.mesh] = extraFabric
						}
					}
				}

				// Add all fabrics for this block category
				for (const [assignedMesh, fabric] of Object.entries(blockFabrics)) {
					// CONTINUE confusion is happening here in downstream code
					// because this, for example, assigns a fabric for sweater
					// laces (name "pattern_35-pattern_36") but the block
					// category is "Sleeves", which is not the category for
					// laces.
					newFabrics.push({
						fabric: fabric,
						blockCategory: block.category,
						assignedMesh: assignedMesh,
					})
				}
			}
		}

		const newFabricsMap = this.#parseFabricDataToMap(newFabrics)

		return {newBlocksMap, newFabricsMap}
	}

	/**
	 * Derive the eligible block categories for a template category within the current context.
	 *
	 * @param templateCategory - Category being evaluated.
	 * @param options - Selected garments and space metadata that influence availability.
	 * @param collectionOverride - Explicit collection slug to use instead of derived ones.
	 * @returns Block categories that remain valid for the given state.
	 */
	#getBlockCategoriesForTemplateCategory(
		templateCategory: TemplateCategory,
		options: {
			selectedGarments?: SelectedGarments | undefined
			selectedSpace?: Space | null | undefined
			sourceCollection?: string | null | undefined
		},
		collectionOverride?: string | null | undefined,
	): BlockCategory[] {
		const mappingCategories = [...(this.availableBlocksMapping[templateCategory] || [])] as BlockCategory[]
		const collection =
			collectionOverride ?? options.sourceCollection ?? getSpacePrimaryCollection(options.selectedSpace) ?? 'gap'
		const blocks = this.getBlocksForTemplateCategory(templateCategory, collection)
		const categoriesFromBlocks = new Set<BlockCategory>(blocks.map(block => block.category))

		if (templateCategory === 'Shirt') {
			const selectedBlock = options.selectedGarments?.[templateCategory]?.Bodice?.block
			const spaceCollection = getSpacePrimaryCollection(options.selectedSpace)
			if (
				selectedBlock?.templateName !== 'Pleated long sleeve shirt' &&
				(spaceCollection === 'gap' || options.sourceCollection === 'gap')
			) {
				return []
			}

			if (spaceCollection === 'oofya' || options?.sourceCollection === 'oofya') {
				return []
			}
		}

		const filteredMapping = mappingCategories.filter(category => categoriesFromBlocks.has(category))

		return filteredMapping
	}

	/**
	 * Resolve available fabrics for each mesh slot in a template.
	 *
	 * @param sourceCollection - Collection slug to search; defaults to `gap`.
	 * @param template - Template describing the fabric categories.
	 * @returns Record keyed by mesh/piece name pointing to allowed fabrics.
	 */
	getAvailableFabricsForTemplate(
		sourceCollection: string | null | undefined,
		template: Template,
	): Record<string, Fabric[]> {
		// Resolve template.materialId (fabric _id) to the fabric instance, then filter by allowed template categories
		const collection = sourceCollection ?? 'gap'
		const availableFabrics: Record<string, Fabric[]> = {}

		const defaultFabric = fabrics[collection]?.find(fabric => fabric._id === template.materialId)

		availableFabrics['default'] = this.#getFabricsByFabricCategory(defaultFabric?.category, collection)

		if (template.extraMaterials && template.extraMaterials.length > 0) {
			for (const extraMaterial of template.extraMaterials) {
				const extraFabric = fabrics[collection]?.find(fabric => fabric._id === extraMaterial.materialId)
				availableFabrics[extraMaterial.mesh] = this.#getFabricsByFabricCategory(extraFabric?.category, collection)
			}
		}

		return availableFabrics
	}

	/**
	 * Fetch all blocks for a template category within a collection.
	 *
	 * @param templateCategory - Category the user is exploring.
	 * @param collection - Collection slug or null to fall back to default.
	 * @returns Blocks belonging to the category and collection.
	 */
	getBlocksForTemplateCategory(templateCategory: TemplateCategory, collection: string | null | undefined) {
		const resolvedCollection = collection ?? 'gap'
		return (collectionBlocks[resolvedCollection] ?? []).filter(block => block.templateCategory === templateCategory)
	}

	/**
	 * Determine whether remix tooling should be available for a template.
	 *
	 * @param template - Template being evaluated.
	 * @param options - Context about the selection and space.
	 * @returns Availability flag, eligible block categories, and fabric choices.
	 */
	isRemixAvailableForTemplate(
		template: Template,
		options: {
			selectedGarments?: SelectedGarments | undefined
			selectedSpace?: Space | null | undefined
			sourceCollection?: string | null | undefined
		},
	) {
		const templateCategory = template.category
		if (!['Shirt', 'Jacket', 'Pants', 'Dress', 'Skirt', 'Top'].includes(templateCategory))
			return {available: false, blocksCategories: [], fabrics: []}
		const blocksCategories = this.#getBlockCategoriesForTemplateCategory(templateCategory, options)
		const fabrics = this.getAvailableFabricsForTemplate(
			options.sourceCollection ?? getSpacePrimaryCollection(options.selectedSpace),
			template,
		)
		return {
			available: blocksCategories.length > 0 || Object.values(fabrics).some(fabricArray => fabricArray.length > 1),
			blocksCategories,
			fabrics,
		}
	}

	/**
	 * Find a block by id across collections, favoring the provided slug.
	 *
	 * @param blockId - Block identifier.
	 * @param collectionSlug - Optional collection slug to search first.
	 * @returns Matching block or `null` when not found.
	 */
	findBlockById(blockId: string, collectionSlug: string | null): Block | null {
		if (collectionSlug) {
			const collectionBlocks = blocks[collectionSlug]
			const found = collectionBlocks?.find?.(b => b._id === blockId) ?? null
			if (found) return found
		}

		for (const collectionBlocks of Object.values(blocks)) {
			const found = collectionBlocks?.find?.(b => b._id === blockId)
			if (found) return found
		}

		return null
	}

	/**
	 * Find a fabric by id across collections, favoring the provided slug.
	 *
	 * @param fabricId - Fabric identifier to resolve.
	 * @param collectionSlug - Optional collection slug to search first.
	 * @returns Matching fabric or `null` when not found.
	 */
	findFabricById(fabricId: string, collectionSlug: string | null): Fabric | null {
		if (collectionSlug) {
			const collectionFabrics = fabrics[collectionSlug]
			const found = collectionFabrics?.find?.(f => f._id === fabricId) ?? null
			if (found) return found
		}

		for (const collectionFabrics of Object.values(fabrics)) {
			const found = collectionFabrics?.find?.(f => f._id === fabricId)
			if (found) return found
		}

		return null
	}

	/**
	 * Parse strings that optionally encode a collection slug using `collection|value` format.
	 *
	 * @param entry - Raw string from URL or storage.
	 * @returns Collection slug (when provided) and the extracted value.
	 */
	parseCollectionQualifiedEntry(entry: string): {collectionSlug: string | null; value: string | null} {
		const trimmed = entry.trim()
		if (!trimmed) return {collectionSlug: null, value: null}

		const pipeIndex = trimmed.indexOf('|')
		if (pipeIndex === -1) {
			return {collectionSlug: null, value: trimmed}
		}

		const collectionSlug = trimmed.substring(0, pipeIndex).trim()
		const value = trimmed.substring(pipeIndex + 1).trim()

		if (!value) {
			return {collectionSlug: null, value: trimmed}
		}

		return {
			collectionSlug: collectionSlug.length > 0 ? collectionSlug : null,
			value,
		}
	}

	/**
	 * Find a template by id across collections, favoring the provided slug.
	 *
	 * @param templateId - Template identifier to resolve.
	 * @param collectionSlug - Optional collection slug to search first.
	 * @returns Matching template or `null` when not found.
	 */
	findTemplateById(templateId: string, collectionSlug: string | null): Template | null {
		if (collectionSlug) {
			const collectionTemplates = templates[collectionSlug]
			const found = collectionTemplates?.find?.(template => template._id === templateId) ?? null
			if (found) return found
		}

		for (const collectionTemplates of Object.values(templates)) {
			const found = collectionTemplates?.find?.(template => template._id === templateId)
			if (found) return found
		}

		return null
	}
}

export const templateHelpers = new TemplateHelpers()
