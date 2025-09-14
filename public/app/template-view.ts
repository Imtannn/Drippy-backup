import {css, Element, element, html, signal, untrack, type ElementAttributes} from 'lume'
import type {Accessor} from 'solid-js'
import {getBlocksForTemplate, getFabricForTemplate} from '../consts/relationships.js'
import {templates} from '../consts/templates.js'
import type {Block} from '../types/block.js'
import type {Template, TemplateCategory} from '../types/template.js'
import {blockManager} from './block-manager.js'
import {store} from './store.js'
import {textureManager} from './texture-manager.js'

import '../elements/animation-select.js'
import '../elements/back-button.js'
import '../elements/bottom-sheet.js'
import '../elements/cube-button.js'
import '../elements/logic/for-each.js'
import '../elements/logic/index-each.js'
import '../elements/logic/show-when.js'
import '../elements/logo-button.js'
import '../elements/person-button.js'
import '../elements/tabs.js'
import '../elements/theme-switch-button.js'
import './app-buttons.js'
import './drip-it-button.js'
import './item-card.js'

type TemplateViewAttributes = keyof {}

@element
export class TemplateView extends Element {
	static readonly elementName = 'template-view'

	@signal selectedTab: TemplateCategory | null = null
	@signal templateCategories: Record<TemplateCategory, Template[]> = {} as Record<TemplateCategory, Template[]>
	@signal spaceCollection: string | null = null

	private defaultCollection = 'moidien'

	connectedCallback() {
		super.connectedCallback()

		this.createEffect(() => {
			this.spaceCollection = store.selectedSpace?.collection ?? this.defaultCollection
		})

		// Update template categories when templates change
		this.createEffect(() => {
			if (!this.spaceCollection) return
			// Define the category order: 'Dress' | 'Jacket' | 'Shirt' | 'Skirt' | 'Pants' | 'Accessories'
			const categoryOrder: TemplateCategory[] = ['Dress', 'Shirt', 'Jacket', 'Skirt', 'Pants', 'Accessories']

			// Get available categories from templates
			const availableCategories = [
				...new Set(templates[this.spaceCollection].map(template => template.category)),
			] as TemplateCategory[]

			// Sort categories in the desired order
			const orderedCategories = categoryOrder.filter(category => availableCategories.includes(category))

			this.templateCategories = ['All', ...orderedCategories].reduce(
				(acc, category) => {
					acc[category as TemplateCategory] = templates[this.spaceCollection!].filter(
						template => template.category === category,
					)
					return acc
				},
				{} as Record<TemplateCategory, Template[]>,
			)
		})

		this.createEffect(() => {
			// Auto-select first category
			const categories = Object.keys(this.templateCategories)
			if (categories.length > 0) {
				this.selectedTab = categories[0] as TemplateCategory
			}
		})
	}

	#onItemClick = async (e: CustomEvent) => {
		const template = e.detail.itemValue as Template

		store.setSelectedTemplates = template

		const templateFabric = getFabricForTemplate(template, store.selectSpace?.collection)

		if (templateFabric) {
			const loadingId = `${templateFabric._id}-${Date.now()}`
			store.loadingMaterials = [...untrack(() => store.loadingMaterials), loadingId]
			try {
				// Preload base fabric textures into cache (most efficient - no config needed yet)
				// Preload template blocks
				await Promise.all([
					textureManager.preloadFabricBaseTextures(templateFabric),
					blockManager.preloadTemplateBlocks(template, store.selectedSpace!),
				])
			} catch (error) {
				console.warn('Failed to preload fabric textures:', error)
			} finally {
				store.loadingMaterials = untrack(() => store.loadingMaterials).filter(id => id !== loadingId)
			}
		}

		// Set the selected template using the new Map structure

		// Get blocks for ALL selected templates, organized by template category
		const templateBlockData: {blocks: Block[]; templateCategory: TemplateCategory; materialId: string}[] = []
		for (const [templateCategory, selectedTemplate] of store.selectedTemplates.entries()) {
			const templateBlocks = getBlocksForTemplate(selectedTemplate, store.selectedSpace?.collection)
			templateBlockData.push({
				blocks: templateBlocks,
				templateCategory: templateCategory,
				materialId: selectedTemplate.materialId ?? '',
			})
		}

		// Replace blocks with aggregated blocks from all selected templates
		store.replaceSelectedBlocks = templateBlockData
	}

	#onDripItClick = () => {
		store.navigateTo = 'blocks'
	}

	#onBackButtonClick = () => {
		store.resetSelectedTemplates()
		const searchParams = new URLSearchParams(window.location.search)
		searchParams.delete('scene')
		window.history.replaceState({}, '', `?${searchParams.toString()}`)
		store.selectSpace = null
		store.navigateTo = 'scene'
	}

	template = () => html`
		<app-buttons-left>
			<app-buttons-group>
				<back-button onclick=${this.#onBackButtonClick}></back-button>
			</app-buttons-group>
		</app-buttons-left>

		<app-buttons-right>
			<app-buttons-group>
				<!-- <theme-switch-button></theme-switch-button> -->
				<logo-button brand-name="MoiDien"></logo-button>
			</app-buttons-group>
			<app-buttons-group>
				<person-button></person-button>
				<cube-button></cube-button>
				<animation-select></animation-select>
			</app-buttons-group>
		</app-buttons-right>

		<app-buttons-right layout="bottom">
			<app-buttons-group>
				<drip-it-button
					button-disabled=${() => store.selectedTemplates.size === 0}
					onclick=${this.#onDripItClick}
				></drip-it-button>
			</app-buttons-group>
		</app-buttons-right>

		<bottom-sheet>
			<show-when
				condition=${() => this.selectedTab !== null}
				content=${() => html`
					<tabs-provider
						default-value=${() => this.selectedTab}
						ontabchange=${(e: CustomEvent) => (this.selectedTab = e.detail.value)}
					>
						<bottom-sheet-header>
							<div class="tabs-container">
								<tabs-list>
									<index-each
										items=${() => Object.keys(this.templateCategories)}
										content=${() => (category: Accessor<TemplateCategory>) => html`
											<tabs-trigger selected-value=${category()}>${category()}</tabs-trigger>
										`}
									></index-each>
								</tabs-list>
							</div>
						</bottom-sheet-header>
						<div class="tabs-content-container">
							<for-each
								items=${() => Object.keys(this.templateCategories)}
								content=${() => (category: TemplateCategory) => html`
									<tabs-content selected-value=${category}>
										<div class="items-grid">
											<for-each
												items=${() =>
													category === 'All'
														? Object.values(this.templateCategories).flat()
														: this.templateCategories[category]}
												content=${() => (template: Template) => html`
													<div class="template-item">
														<item-card
															item-active=${() => store.selectedTemplates.get(template.category)?._id === template._id}
															item-src=${template.thumb}
															item-alt=${template.name}
															item-value=${template}
															oncardselected=${this.#onItemClick}
															object-fit="contain"
															object-position="center"
															aspect-ratio="0.79"
														></item-card>
														<div class="template-product-name">Product Name</div>
														<div class="template-product-price-container">
															<div
																class="template-product-price"
																classList=${() => ({wholesale: store.selectedSpace?.isWholesale})}
															>
																€ 125.00
															</div>
															<div
																class="template-product-wholesale"
																classList=${() => ({wholesale: store.selectedSpace?.isWholesale})}
															>
																MOQ: 5pcs
															</div>
														</div>
													</div>
												`}
											></for-each>
										</div>
									</tabs-content>
								`}
							></for-each>
						</div>
					</tabs-provider>
				`}
			></show-when>
		</bottom-sheet>
	`

	css = css/*css*/ `
		:host {
			display: contents;
		}

		.tabs-container {
			padding: var(--uiSpacing);
			padding-top: 0;
			padding-bottom: var(--uiSpacingSmall);
			background: var(--uiColorPrimaryWhite);
		}

		.bottom-sheet-header {
			position: sticky;
			top: 0;
			background: var(--appBackground);
			z-index: 10;
			border-bottom: var(--borderWidth) solid var(--uiColorBorderColor);
		}

		.tabs-content-container {
			padding: var(--uiSpacing);
			padding-top: 0;
			padding-bottom: 5px;
			background: var(--uiColorPrimaryWhite);
		}

		.items-grid {
			display: grid;
			grid-template-columns: repeat(3, 1fr);
			gap: var(--uiGap);
		}

		.templates-content-container {
			padding: var(--uiSpacing);
			padding-top: 0;
			padding-bottom: 5px;
			background: var(--uiColorPrimaryWhite);
		}

		.template-item {
			min-width: 0;
			min-height: 0;
			width: 100%;
			height: 100%;
			display: flex;
			flex-direction: column;
			gap: var(--uiSpacingTiny);
		}

		.template-product-name {
			font-size: var(--fontSizeTextXs);
			font-weight: var(--fontWeightSemiBold);
			color: #424347;
		}

		.template-product-price-container {
			display: flex;
			flex-direction: row;
			justify-content: space-between;
			align-items: center;
			flex-wrap: wrap;
		}

		.template-product-price {
			font-size: var(--fontSizeTextXs);
			font-weight: var(--fontWeightNormal);
			color: #424347;
			text-wrap: nowrap;
		}

		.template-product-price.wholesale {
			font-size: var(--fontSizeTextXxs);
		}

		.template-product-wholesale {
			opacity: 0;
		}

		.template-product-wholesale.wholesale {
			font-size: var(--fontSizeTextXxs);
			font-weight: var(--fontWeightNormal);
			color: #424347;
			text-wrap: nowrap;
			opacity: 1;
		}
	`
}

declare global {
	interface HTMLElementTagNameMap {
		'template-view': TemplateView
	}
}

declare module 'lume' {
	interface IntrinsicElements {
		'template-view': ElementAttributes<TemplateView, TemplateViewAttributes>
	}
}
