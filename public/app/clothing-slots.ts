import type {TemplateCategory} from '../types/template.js'
import type {BlockCategory} from '../types/block.js'

/**
 * Rendering priority per slot. Lower number = outer layer (renders on top).
 * Used to set polygonOffset to prevent Z-fighting between layered garments.
 */
export const SLOT_PRIORITY: Partial<Record<TemplateCategory, number>> = {
	Jacket: 0,
	Dress: 1,
	Jumpsuit: 1,
	Shoes: 1,
	Shirt: 2,
	Top: 2,
	Pants: 3,
	Skirt: 3,
}

/**
 * Masking rules: when an outer garment is equipped, which BlockCategories to
 * hide on specific inner TemplateCategories to prevent Z-fighting.
 *
 * Key = outer TemplateCategory
 * masks = inner TemplateCategories affected
 * blocks = BlockCategories to hide on those inner garments
 */
export const OUTER_GARMENT_MASKING: Partial<
	Record<
		TemplateCategory,
		{
			masks: TemplateCategory[]
			blocks: BlockCategory[]
		}
	>
> = {
	Dress: {
		masks: ['Top', 'Shirt'],
		blocks: ['Bodice', 'Sleeves', 'Full Body'],
	},
	Jumpsuit: {
		masks: ['Top', 'Shirt', 'Pants', 'Skirt'],
		blocks: ['Bodice', 'Sleeves', 'Pants', 'Skirt', 'Full Body'],
	},
	Shirt: {
		masks: ['Top'],
		blocks: ['Bodice'],
	},
}

/**
 * Returns true if a garment block should be hidden because a higher-priority
 * outer garment covers the same body region.
 *
 * @param blockCategory - The BlockCategory of the garment piece to check
 * @param templateCategory - The TemplateCategory (slot) the piece belongs to
 * @param selectedTemplates - Currently equipped templates by category
 */
export function isCoveredByOuterGarment(
	blockCategory: BlockCategory,
	templateCategory: TemplateCategory,
	selectedTemplates: Partial<Record<TemplateCategory, unknown>>,
): boolean {
	for (const [outerCat, masking] of Object.entries(OUTER_GARMENT_MASKING) as [
		TemplateCategory,
		(typeof OUTER_GARMENT_MASKING)[TemplateCategory],
	][]) {
		if (!selectedTemplates[outerCat]) continue
		if (!masking!.masks.includes(templateCategory)) continue
		if (masking!.blocks.includes(blockCategory)) return true
	}
	return false
}
