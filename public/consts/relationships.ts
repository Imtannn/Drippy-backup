import type {Template} from '../types/template.js'
import type {Block} from '../types/block.js'
import type {Fabric} from '../types/fabric.js'
import {templates} from './templates.js'
import {blocks} from './blocks.js'
import {fabrics} from './fabrics.js'

/**
 * Data Relationships Documentation
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
export function getFabricForTemplate(template: Template, brand: string = 'moidien'): Fabric | null {
	if (!template.materialId) return null

	const brandFabrics = (fabrics as BrandData<Fabric>)[brand] || []
	return (
		brandFabrics.find(
			fabric => `${fabric.materialName} ${fabric.category} ${fabric.templateCategory}` === template.materialId,
		) || null
	)
}

/**
 * Find all blocks that belong to a specific template
 */
export function getBlocksForTemplate(template: Template, brand: string = 'moidien'): Block[] {
	const brandBlocks = (blocks as BrandData<Block>)[brand] || []
	return brandBlocks.filter(
		block => block.templateName === template.name && block.templateCategory === template.category,
	)
}

/**
 * Find template that a block belongs to
 */
export function getTemplateForBlock(block: Block, brand: string = 'moidien'): Template | null {
	const brandTemplates = (templates as BrandData<Template>)[brand] || []
	return (
		brandTemplates.find(
			template => template.name === block.templateName && template.category === block.templateCategory,
		) || null
	)
}

/**
 * Get all fabrics for a specific template category
 */
export function getFabricsForTemplateCategory(category: string, brand: string = 'moidien'): Fabric[] {
	const brandFabrics = (fabrics as BrandData<Fabric>)[brand] || []
	return brandFabrics.filter(fabric => fabric.templateCategory === category)
}

/**
 * Get blocks grouped by their category for a template
 */
export function getBlocksByCategoryForTemplate(template: Template, brand: string = 'moidien'): Record<string, Block[]> {
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

/**
 * Get complete template data with related blocks and fabric
 */
export function getCompleteTemplateData(templateId: string, brand: string = 'moidien') {
	const brandTemplates = (templates as BrandData<Template>)[brand] || []
	const template = brandTemplates.find(t => t._id === templateId)

	if (!template) return null

	return {
		template,
		fabric: getFabricForTemplate(template, brand),
		blocks: getBlocksForTemplate(template, brand),
		blocksByCategory: getBlocksByCategoryForTemplate(template, brand),
	}
}

/**
 * Get data summary for debugging/overview
 */
export function getDataSummary(brand: string = 'moidien') {
	const brandTemplates = (templates as BrandData<Template>)[brand] || []
	const brandBlocks = (blocks as BrandData<Block>)[brand] || []
	const brandFabrics = (fabrics as BrandData<Fabric>)[brand] || []

	// Count templates with/without materials
	const templatesWithMaterials = brandTemplates.filter(t => t.materialId).length
	const templatesWithoutMaterials = brandTemplates.filter(t => !t.materialId).length

	// Count blocks by category
	const blocksByCategory = brandBlocks.reduce(
		(acc, block) => {
			acc[block.category] = (acc[block.category] || 0) + 1
			return acc
		},
		{} as Record<string, number>,
	)

	// Count fabrics by template category
	const fabricsByTemplateCategory = brandFabrics.reduce(
		(acc, fabric) => {
			const category = fabric.templateCategory || 'Unknown'
			acc[category] = (acc[category] || 0) + 1
			return acc
		},
		{} as Record<string, number>,
	)

	return {
		brand,
		counts: {
			templates: brandTemplates.length,
			blocks: brandBlocks.length,
			fabrics: brandFabrics.length,
		},
		templates: {
			withMaterials: templatesWithMaterials,
			withoutMaterials: templatesWithoutMaterials,
			byCategory: brandTemplates.reduce(
				(acc, template) => {
					acc[template.category] = (acc[template.category] || 0) + 1
					return acc
				},
				{} as Record<string, number>,
			),
		},
		blocks: {
			byCategory: blocksByCategory,
			byTemplateCategory: brandBlocks.reduce(
				(acc, block) => {
					acc[block.templateCategory] = (acc[block.templateCategory] || 0) + 1
					return acc
				},
				{} as Record<string, number>,
			),
		},
		fabrics: {
			byTemplateCategory: fabricsByTemplateCategory,
			byMaterialCategory: brandFabrics.reduce(
				(acc, fabric) => {
					const category = fabric.category || 'Unknown'
					acc[category] = (acc[category] || 0) + 1
					return acc
				},
				{} as Record<string, number>,
			),
		},
	}
}

/**
 * Validate data relationships
 */
export function validateRelationships(brand: string = 'moidien') {
	const brandTemplates = (templates as BrandData<Template>)[brand] || []
	const brandBlocks = (blocks as BrandData<Block>)[brand] || []
	const brandFabrics = (fabrics as BrandData<Fabric>)[brand] || []

	const issues: string[] = []

	// Check templates with materialId but no matching fabric
	brandTemplates.forEach(template => {
		if (template.materialId) {
			const fabric = getFabricForTemplate(template, brand)
			if (!fabric) {
				issues.push(`Template "${template.name}" references missing fabric "${template.materialId}"`)
			}
		}
	})

	// Check blocks with no matching template
	brandBlocks.forEach(block => {
		const template = getTemplateForBlock(block, brand)
		if (!template) {
			issues.push(
				`Block "${block.blockName}" references missing template "${block.templateName}" (${block.templateCategory})`,
			)
		}
	})

	// Check for orphaned fabrics (no template references them)
	brandFabrics.forEach(fabric => {
		const fabricId = `${fabric.materialName} ${fabric.category} ${fabric.templateCategory}`
		const isReferenced = brandTemplates.some(template => template.materialId === fabricId)
		if (!isReferenced) {
			issues.push(`Fabric "${fabricId}" is not referenced by any template`)
		}
	})

	return {
		valid: issues.length === 0,
		issues,
	}
}

// Export commonly used combinations
export const relationshipHelpers = {
	getFabricForTemplate,
	getBlocksForTemplate,
	getTemplateForBlock,
	getFabricsForTemplateCategory,
	getBlocksByCategoryForTemplate,
	getCompleteTemplateData,
	getDataSummary,
	validateRelationships,
}
