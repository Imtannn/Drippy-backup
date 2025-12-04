import type {TemplateCategory} from './template.js'
import type {Gender} from './types.js'

/**
 * Default garment configuration to ensure avatar is never naked.
 * Customizable per avatar gender - add entries as needed.
 */
export type DefaultGarmentConfig = {
	category: TemplateCategory
	templateId: string
	collection: string
}

export type DefaultGarmentsConfig = Record<Gender, DefaultGarmentConfig[]>
