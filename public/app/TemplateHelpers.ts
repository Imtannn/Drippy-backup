import {blocks, getBlocksByCollection} from '../consts/blocks.js'
import {fabrics, getFabricsByCollection} from '../consts/fabrics.js'
import {getTemplatesByCollection, templates} from '../consts/templates.js'
import type {Block, BlockCategory} from '../types/block.js'
import type {Fabric, FabricsByCategory} from '../types/fabric.js'
import type {Template, TemplateCategory} from '../types/template.js'
import type {
	BlockFabricsMap,
	CategoryBlocksMap,
	FabricSelection,
	PieceFabricsMap,
	SelectedGarments,
	Space,
	TemplateBlocksMap,
	TemplateCategorySelection,
	TemplateFabricsMap,
	TemplateMap,
} from '../types/types.js'
import {entries, getSpacePrimaryCollection, size, values} from '../utils.js'

// CONTINUE delete or update this comment. relationships.md does not exist.
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
	 * @param collection - Collection slug to read from.
	 * @returns Fabrics that belong to the requested category within the collection.
	 */
	#getFabricsByFabricCategory(fabricCategory: string, collection: string | string[] | null | undefined): Fabric[] {
		if (!fabricCategory) return []

		// TODO: If no collection is provided, loop through all collections in space and find the fabrics
		let fabricsInCategory: Fabric[] = []
		if (collection)
			fabricsInCategory = getFabricsByCollection(collection).filter(fabric => fabric.category === fabricCategory)
		else fabricsInCategory = fabrics().filter(fabric => fabric.category === fabricCategory)

		// Include default fabrics with the same category (not already in the collection)
		const defaultFabrics = getFabricsByCollection('default')?.filter(fabric => fabric.category === fabricCategory) ?? []

		console.log('fabricsInCategory', [...fabricsInCategory, ...defaultFabrics])

		return [...fabricsInCategory, ...defaultFabrics]
	}

	/**
	 * Create a defensive copy of the user's garment selection.
	 *
	 * @param selection - Current selection keyed by template category then block category.
	 * @returns New object graph that shares no nested references with the input.
	 */
	cloneSelectedGarments(selection: SelectedGarments): SelectedGarments {
		const cloned: SelectedGarments = {}

		for (const [templateCategory, templateSelection] of entries(selection)) {
			const clonedTemplate: TemplateCategorySelection = {}
			for (const [blockCategory, garment] of entries(templateSelection)) {
				clonedTemplate[blockCategory as BlockCategory] = {
					block: garment.block ?? null,
					fabrics: {...garment.fabrics},
				}
			}

			if (size(clonedTemplate) > 0) cloned[templateCategory as TemplateCategory] = clonedTemplate
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
			for (const [blockCategory, block] of entries(blocksMap)) {
				const current = templateSelection[blockCategory] ?? {block: null, fabrics: {}}
				templateSelection[blockCategory] = current
				current.block = block
			}
		}

		if (fabricsMap) {
			for (const [blockCategory, fabricMap] of entries(fabricsMap)) {
				const fabricsRecord = {...fabricMap}
				const current = templateSelection[blockCategory] ?? {block: null, fabrics: {}}
				templateSelection[blockCategory] = current
				current.fabrics = fabricsRecord
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
		const templateCategories = new Set<TemplateCategory>([...Object.keys(blocksMap), ...Object.keys(fabricsMap)])

		for (const templateCategory of templateCategories) {
			const templateBlocks = blocksMap[templateCategory]
			const templateFabrics = fabricsMap[templateCategory]
			const templateSelection = this.buildTemplateSelectionFromMaps(templateBlocks, templateFabrics)

			if (size(templateSelection) > 0) result[templateCategory] = templateSelection
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

		for (const templateCategory of templateCategories) if (templateCategory in cloned) delete cloned[templateCategory]

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

		if (size(templateSelection) === 0) delete cloned[templateCategory]
		else cloned[templateCategory] = templateSelection

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

		return overridingCategories?.filter(c => selectedTemplates[c]) ?? []
	}

	/**
	 * Get all categories that override a given category.
	 * This is the inverse lookup of overridingCategoriesMapping.
	 *
	 * @param category - The category to check what overrides it.
	 * @returns Array of categories that override the given category.
	 */
	getCategoriesThatOverride(category: TemplateCategory): TemplateCategory[] {
		const result: TemplateCategory[] = []

		for (const [overrider, overridden] of entries(this.overridingCategoriesMapping))
			if (overridden.includes(category)) result.push(overrider)

		return result
	}

	getOverridingCategories(category: TemplateCategory): TemplateCategory[] {
		return this.overridingCategoriesMapping[category] ?? []
	}

	getTemplateCategoryById(templateId: string): TemplateCategory | undefined {
		return templates().find(template => template?._id === templateId)?.category
	}

	/**
	 * Convert template to block data used by downstream selection flows.
	 *
	 * @param selectedTemplate - Template the user picked.
	 * @param collection - Collection slug used when resolving blocks.
	 * @returns Block data shape storing blocks and material metadata.
	 */
	convertTemplateToBlockData(selectedTemplate: Template, collection: string | string[] | null | undefined) {
		const templateBlocks = this.#resolveBlocksForTemplate(selectedTemplate, collection)
		return {
			blocks: templateBlocks,
			materialId: selectedTemplate.materialId ?? '',
			extraMaterials: selectedTemplate.extraMaterials,
		}
	}

	#resolveBlocksForTemplate(template: Template, collection: string | string[] | null | undefined): Block[] {
		const lookupOrder: string[] = Array.isArray(collection) ? collection : collection ? [collection] : []

		if (template.collection && !lookupOrder.includes(template.collection)) lookupOrder.push(template.collection)

		for (const slug of lookupOrder) {
			const matches = getBlocksByCollection(slug).filter(block => block.templateId === template._id)
			if (matches.length > 0) return matches
		}

		const matches = blocks().filter(block => block.templateId === template._id)
		if (matches.length > 0) return matches

		return []
	}

	/**
	 * Convert fabric assignment payloads into a map keyed by block category and mesh.
	 *
	 * @param fabricData - Single or multiple fabric assignments.
	 * @returns Block to piece fabric map for downstream consumption.
	 */
	#parseFabricDataToMap(
		fabricData: Omit<FabricSelection, 'templateCategory'> | Omit<FabricSelection, 'templateCategory'>[],
	): BlockFabricsMap {
		if (!Array.isArray(fabricData)) fabricData = [fabricData]

		const newFabrics: BlockFabricsMap = {}

		// FIXME STOP DUPLICATING CODE IN RANDOM PLACES OR YOU WILL BE IN TROUBLE! (see setSelectedFabrics in store.ts)
		for (const data of fabricData) {
			const {fabric, blockCategory} = data
			let {assignedMesh} = data

			if (!assignedMesh) assignedMesh = 'default'

			const existingFabricsMap = newFabrics[blockCategory] ?? {}
			existingFabricsMap[assignedMesh] = fabric
			newFabrics[blockCategory] = existingFabricsMap
		}

		return newFabrics
	}

	#getFabricById(fabricId: string, collection?: string | string[] | null): Fabric | undefined {
		return (collection ? getFabricsByCollection(collection) : fabrics()).find(fabric => fabric._id === fabricId)
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
		collection: string | string[] | null | undefined,
		fabricOverrides?: BlockFabricsMap,
	) {
		// Completely replace selectedBlocks with new blocks (used for template selection)
		const newBlocksMap: CategoryBlocksMap = {}
		const newFabrics: {
			fabric: Fabric
			blockCategory: BlockCategory
			assignedMesh: string
		}[] = []

		for (const block of templateData.blocks) {
			newBlocksMap[block.category] = block

			// Check if there are fabric overrides for this block category
			const overrideFabrics = fabricOverrides?.[block.category]
			if (overrideFabrics && size(overrideFabrics) > 0) {
				// Use fabric overrides from URL
				for (const [assignedMesh, fabric] of entries(overrideFabrics)) {
					newFabrics.push({
						fabric: fabric,
						blockCategory: block.category,
						assignedMesh: assignedMesh,
					})
				}
			} else {
				// Use default template fabrics
				const blockFabrics: PieceFabricsMap = {}

				// Add the main fabric (without assignedMesh - will be default)
				if (templateData.materialId) {
					// If no collection is provided, loop through all collections and find the fabric
					const fabric = this.#getFabricById(templateData.materialId, collection)

					if (fabric) blockFabrics[fabric.assignedMesh || 'default'] = fabric
				}

				// Add extra materials with specific mesh assignments
				if (templateData.extraMaterials) {
					for (const extraMaterial of templateData.extraMaterials) {
						const extraFabric = this.#getFabricById(extraMaterial.materialId, collection)
						if (extraFabric) blockFabrics[extraMaterial.mesh] = extraFabric
					}
				}

				// Add all fabrics for this block category
				for (const [assignedMesh, fabric] of entries(blockFabrics)) {
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
			sourceCollection?: string | string[] | null | undefined
		},
		collectionOverride?: string | string[] | null | undefined,
	): BlockCategory[] {
		const mappingCategories = [...(this.availableBlocksMapping[templateCategory] || [])] as BlockCategory[]
		const collection =
			collectionOverride ?? options.sourceCollection ?? getSpacePrimaryCollection(options.selectedSpace)
		const blocks = this.getBlocksForTemplateCategory(templateCategory, collection)
		const categoriesFromBlocks = new Set<BlockCategory>(blocks.map(block => block.category))

		if (templateCategory === 'Shirt') {
			const selectedBlock = options.selectedGarments?.[templateCategory]?.Bodice?.block
			const spaceCollection = getSpacePrimaryCollection(options.selectedSpace)
			if (
				selectedBlock?.templateName !== 'Pleated long sleeve shirt' &&
				(spaceCollection === 'gap' || options.sourceCollection === 'gap')
			)
				return []

			if (spaceCollection === 'oofya' || options?.sourceCollection === 'oofya') return []
		}

		const filteredMapping = mappingCategories.filter(category => categoriesFromBlocks.has(category))

		return filteredMapping
	}

	/**
	 * Resolve available fabrics for each mesh slot in a template.
	 *
	 * @param collection - Collection slug to search; defaults to `gap`.
	 * @param template - Template describing the fabric categories.
	 * @returns Record keyed by mesh/piece name pointing to allowed fabrics.
	 */
	getAvailableFabricsForTemplate(
		collection: string | string[] | null | undefined,
		template: Template,
	): FabricsByCategory {
		// Resolve template.materialId (fabric _id) to the fabric instance, then filter by allowed template categories
		/** Available fabrics by category. */
		const availableFabrics: FabricsByCategory = {}

		const defaultFabric = fabrics().find(fabric => fabric._id === template.materialId)
		if (defaultFabric?.category)
			availableFabrics['default'] = this.#getFabricsByFabricCategory(defaultFabric.category, collection)

		if (template.extraMaterials && template.extraMaterials.length > 0) {
			for (const extraMaterial of template.extraMaterials) {
				const extraFabric = fabrics().find(fabric => fabric._id === extraMaterial.materialId)
				console.log('extraFabric', extraFabric)
				if (!extraFabric?.category) continue
				availableFabrics[extraMaterial.mesh] = this.#getFabricsByFabricCategory(extraFabric.category, collection)
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
	getBlocksForTemplateCategory(templateCategory: TemplateCategory, collection: string | string[] | null | undefined) {
		const resolvedCollection = Array.isArray(collection) ? collection : collection ? [collection] : []
		return (getBlocksByCollection(resolvedCollection) ?? []).filter(
			block => block.templateCategory === templateCategory,
		)
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
			sourceCollection?: string | string[] | null | undefined
		},
	) {
		const templateCategory = template.category
		if (!['Shirt', 'Jacket', 'Pants', 'Dress', 'Skirt', 'Top'].includes(templateCategory))
			return {available: false, blocksCategories: [], fabrics: []}
		const blocksCategories = this.#getBlockCategoriesForTemplateCategory(templateCategory, options)
		const fabrics = options.sourceCollection
			? this.getAvailableFabricsForTemplate(options.sourceCollection, template)
			: {}
		return {
			available: blocksCategories.length > 0 || values(fabrics).some(fabricArray => fabricArray.length > 1),
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
	findBlockById(blockId: string, collectionSlug?: string | null): Block | undefined {
		return (collectionSlug ? getBlocksByCollection(collectionSlug) : blocks()).find(b => b._id === blockId)
	}

	/**
	 * Find a fabric by id across collections, favoring the provided slug.
	 *
	 * @param fabricId - Fabric identifier to resolve.
	 * @param collectionSlug - Optional collection slug to search first.
	 * @returns Matching fabric or `null` when not found.
	 */
	findFabricById(fabricId: string, collectionSlug?: string | null): Fabric | undefined {
		return (collectionSlug ? getFabricsByCollection(collectionSlug) : fabrics()).find(f => f._id === fabricId)
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
		if (pipeIndex === -1) return {collectionSlug: null, value: trimmed}

		const collectionSlug = trimmed.substring(0, pipeIndex).trim()
		const value = trimmed.substring(pipeIndex + 1).trim()

		if (!value) return {collectionSlug: null, value: trimmed}

		return {
			collectionSlug: collectionSlug.length > 0 ? collectionSlug : null,
			value,
		}
	}

	// TODO: Remove collectionSlug parameter and use templates() instead
	/**
	 * Find a template by id across collections, favoring the provided slug.
	 *
	 * @param templateId - Template identifier to resolve.
	 * @param collectionSlug - Optional collection slug to search first.
	 * @returns Matching template or `null` when not found.
	 */
	findTemplateById(templateId: string, collectionSlug?: string | null): Template | undefined {
		return (collectionSlug ? getTemplatesByCollection(collectionSlug) : templates()).find(
			template => template._id === templateId,
		)
	}
}

export const templateHelpers = new TemplateHelpers()
