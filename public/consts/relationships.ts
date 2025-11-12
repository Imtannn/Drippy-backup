import type {Template} from '../types/template.js'
import type {Block} from '../types/block.js'
import type {Fabric} from '../types/fabric.js'
import {blocks} from './blocks.js'
import {fabrics} from './fabrics.js'

/**
 * Data Relationships Documentation
 * CONTINUE update
 *
 * 1. Templates → Fabrics:
 *    - template.materialId matches "${fabric.materialName} ${fabric.category} ${fabric.templateCategory}"
 *    - Example: materialId "145 Cotton Shirt" → fabric with materialName="145", category="Cotton", templateCategory="Shirt"
 *
 * 2. Blocks → Templates:
 *    - block.templateId/templateName matches template.name
 *    - block.templateCategory matches template.category
 *
 * 3. Blocks → Template Categories:
 *    - Multiple blocks can belong to the same template
 *    - Block categories: "Bodice", "Sleeves", "Pants"
 */

// Helper type for brand collections
type BrandData<T> = Record<string, T[]>

/**
 * Find fabric that matches a template's materialId
 */
export function getFabricsByFabricCategory(fabricCategory?: string, collection: string = 'gap'): Fabric[] {
	if (!fabricCategory) return []

	const fabricsInCategory = (fabrics[collection] ?? []).filter(fabric => fabric.category === fabricCategory)

	return fabricsInCategory
}

/**
 * Find all blocks that belong to a specific template
 */
export function getBlocksForTemplate(template: Template, brand: string = 'gap'): Block[] {
	const brandBlocks = (blocks as BrandData<Block>)[brand] || []
	return brandBlocks.filter(block => block.templateId === template._id && block.templateCategory === template.category)
}

/**
 * Get blocks grouped by their category for a template
 */
export function getBlocksByCategoryForTemplate(template: Template, brand: string = 'gap'): Record<string, Block[]> {
	const templateBlocks = getBlocksForTemplate(template, brand)

	return templateBlocks.reduce(
		(acc, block) => {
			const category = block.category
			if (!acc[category]) acc[category] = []
			acc[category].push(block)
			return acc
		},
		{} as Record<string, Block[]>,
	)
}
