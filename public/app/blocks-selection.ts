import {css, element, Element, For, html, Show, signal, type ElementAttributes} from 'lume'
import {blocks} from '../consts/blocks.js'
import {fabrics} from '../consts/fabrics.js'

import '../elements/back-button.js'
import '../elements/bottom-sheet.js'
import '../elements/cube-button.js'
import '../elements/login-ui.js'
import '../elements/logo-button.js'
import '../elements/person-button.js'
import '../elements/preview-button.js'
import '../elements/redo-button.js'
import '../elements/refresh-button.js'
import '../elements/show-when.js'
import '../elements/tabs.js'
import '../elements/theme-switch-button.js'
import '../elements/undo-button.js'
import type {Block, BlockCategory} from '../types/block.js'
import type {Fabric} from '../types/fabric.js'
import './app-buttons.js'
import './item-card.js'
import {store} from './store.js'
import type {TemplateCategory} from '../types/template.js'

type BlocksSelectionAttributes = keyof {}

@element
export class BlocksSelection extends Element {
	static readonly elementName = 'blocks-selection'

	@signal selectedTemplateCategory: TemplateCategory | null = null
	@signal selectedSubTab: string | null = null // block category or "fabric"
	@signal selectedBlockCategory: BlockCategory = 'Bodice'
	@signal selectedFabricCategory = 'Cotton'
	@signal availableTemplateCategories: TemplateCategory[] = []
	@signal blocksCategories: string[] = []
	@signal fabricCategories: string[] = []
	@signal availableBlocks: Block[] = []
	@signal availableFabrics: Fabric[] = []
	@signal spaceCollection: string | null = null

	private defaultCollection = 'moidien'

	private availableBlocksMapping: Record<TemplateCategory, BlockCategory[]> = {
		Shirt: ['Sleeves'],
		Jacket: ['Sleeves'],
		Pants: [],
		Accessories: [],
		Dress: [],
		Skirt: [],
	}

	connectedCallback() {
		super.connectedCallback()

		this.createEffect(() => {
			this.spaceCollection = store.selectedSpace?.collection ?? this.defaultCollection
		})

		// Update available template categories from selectedTemplates
		this.createEffect(() => {
			this.availableTemplateCategories = Array.from(store.selectedTemplates.keys())

			// Auto-select first template category if none selected
			if (this.availableTemplateCategories.length > 0 && !this.selectedTemplateCategory) {
				this.selectedTemplateCategory = this.availableTemplateCategories[0]
			}
		})

		// Update available blocks when template category changes
		this.createEffect(() => {
			if (!this.spaceCollection || !this.selectedTemplateCategory) return

			const selectedTemplate = store.selectedTemplates.get(this.selectedTemplateCategory)
			if (selectedTemplate) {
				this.availableBlocks = blocks[this.spaceCollection].filter(block => {
					if (block.templateCategory === 'Pants' || block.templateCategory === 'Accessories') {
						return true
					} else {
						return block.templateCategory === selectedTemplate.category
					}
				})
			} else {
				this.availableBlocks = []
			}
		})

		// Update available fabrics when template category changes
		this.createEffect(() => {
			if (!this.spaceCollection || !this.selectedTemplateCategory) return

			const selectedTemplate = store.selectedTemplates.get(this.selectedTemplateCategory)
			if (selectedTemplate) {
				this.availableFabrics = fabrics[this.spaceCollection].filter(
					fabric => fabric.templateCategory === selectedTemplate.category,
				)
			} else {
				this.availableFabrics = []
			}
		})

		// Update block categories when template category changes
		this.createEffect(() => {
			if (!this.selectedTemplateCategory) {
				this.blocksCategories = []
				return
			}

			// Sort by Bodice, then Sleeves, then Pants, then Skirt, then rest...
			const categoryOrder: BlockCategory[] = ['Bodice', 'Sleeves', 'Pants']
			const availableCategories = [
				...new Set(this.availableBlocksMapping[this.selectedTemplateCategory] || []),
			] as BlockCategory[]

			// Filter categories in the desired order, then add any remaining categories
			const orderedCategories = categoryOrder.filter(category => availableCategories.includes(category))
			const remainingCategories = availableCategories.filter(category => !categoryOrder.includes(category))
			const newCategories = [...orderedCategories, ...remainingCategories]

			this.blocksCategories = newCategories

			// Auto-select first sub-tab (first block category or fabric if no blocks)
			if (newCategories.length > 0) {
				this.selectedBlockCategory = newCategories[0]
				this.selectedSubTab = newCategories[0]
			} else if (this.availableFabrics.length > 0) {
				this.selectedSubTab = 'fabric'
			}
		})

		// Update sub-tab when block categories or fabrics change
		this.createEffect(() => {
			if (this.blocksCategories.length > 0 && !this.selectedSubTab) {
				this.selectedSubTab = this.blocksCategories[0]
			} else if (this.blocksCategories.length === 0 && this.availableFabrics.length > 0 && !this.selectedSubTab) {
				this.selectedSubTab = 'fabric'
			}
		})

		// Update fabric categories when available fabrics change
		this.createEffect(() => {
			const newCategories = [
				...new Set(this.availableFabrics.map(fabric => fabric.category).filter(Boolean)),
			] as string[]
			this.fabricCategories = newCategories

			// Auto-select first category
			if (newCategories.length > 0) {
				this.selectedFabricCategory = newCategories[0] as any
			}
		})
	}

	disconnectedCallback() {
		super.disconnectedCallback()
		this.selectedTemplateCategory = null
		this.selectedSubTab = null
	}

	#onBackButtonClick = () => {
		store.navigateTo = 'template'
	}

	#onPreviewButtonClick = () => {
		const searchParams = new URLSearchParams(window.location.search)
		searchParams.set('isPreview', 'true')
		store.setIsPreview = true
		window.history.replaceState({}, '', `?${searchParams.toString()}`)
	}

	#onFabricClick = (e: CustomEvent) => {
		const fabric = e.detail.itemValue
		if (!this.selectedTemplateCategory) return

		// Get ALL actually selected block categories for this template (not just the editable ones)
		const templateBlocks = store.selectedBlocks.get(this.selectedTemplateCategory)
		if (!templateBlocks) return

		const actualBlockCategories = Array.from(templateBlocks.keys())

		// Apply fabric to ALL selected blocks of this template category
		const fabricData = actualBlockCategories.map(blockCategory => ({
			fabric,
			blockCategory,
			templateCategory: this.selectedTemplateCategory!,
		}))

		store.setSelectedFabrics = fabricData
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
			<logo-button brand-name="Speed"></logo-button>
		</app-buttons-group>
		<app-buttons-group>
			<!-- <undo-button disabled></undo-button>
			<redo-button disabled></redo-button> -->
			<refresh-button></refresh-button>
		</app-buttons-group>
		<app-buttons-group>
			<person-button></person-button>
			<cube-button></cube-button>
		</app-buttons-group>
	</app-buttons-right>

	<app-buttons-right layout="bottom">
		<app-buttons-group>
			<preview-button onclick=${this.#onPreviewButtonClick}></preview-button>
		</app-buttons-group>
	</app-buttons-right>

	<bottom-sheet>
	<${Show} when=${() => this.availableTemplateCategories.length > 0}>
	<tabs-provider
		default-value=${() => this.selectedTemplateCategory}
		ontabchange=${(e: CustomEvent) => {
			this.selectedTemplateCategory = e.detail.value
		}}
	>
	<bottom-sheet-header>
		<div class="tabs-container">
			<tabs-list>
			<${For} each=${() => this.availableTemplateCategories}>
				${(category: TemplateCategory) => html` <tabs-trigger selected-value=${category}>${category}</tabs-trigger> `}
			</>
			</tabs-list>
		</div>
		</bottom-sheet-header>
		<div class="tabs-content-container">
			<${For} each=${() => this.availableTemplateCategories}>
			${(templateCategory: TemplateCategory) => html`
				<tabs-content selected-value=${templateCategory}>
					<!-- Sub-tabs within each template category -->
					<${Show} when=${() => this.selectedTemplateCategory === templateCategory}>
					<tabs-provider
						default-value=${() => this.selectedSubTab}
						ontabchange=${(e: CustomEvent) => {
							this.selectedSubTab = e.detail.value
						}}
					>
					<div class="category-tabs">
						<!-- Block category tabs -->
						<${For} each=${() => this.blocksCategories}>
						${(category: BlockCategory) => html`
							<button
								class="category-tab"
								classList=${() => ({active: this.selectedSubTab === category})}
								onclick=${() => {
									this.selectedSubTab = category
									this.selectedBlockCategory = category
								}}
							>
								${category}
							</button>
						`}
						</>
						<!-- Fabric tab at the end if fabrics are available -->
						<${Show} when=${() => this.availableFabrics.length > 0}>
							<button
								class="category-tab"
								classList=${() => ({active: this.selectedSubTab === 'fabric'})}
								onclick=${() => (this.selectedSubTab = 'fabric')}
							>
								Fabric
							</button>
						</>
					</div>

					<!-- Block content -->
					<${For} each=${() => this.blocksCategories}>
					${(blockCategory: BlockCategory) => html`
						<${Show} when=${() => this.selectedSubTab === blockCategory}>
							<div class="items-grid">
								<${For} each=${() => this.availableBlocks.filter(block => block.category === blockCategory)}>
								${(block: Block) => html`
									<item-card
										item-active=${() => {
											const templateBlocks = store.selectedBlocks.get(this.selectedTemplateCategory!)
											return templateBlocks?.get(block.category)?._id === block._id
										}}
										item-src=${() => block.thumb}
										item-alt=${() => block.blockName}
										item-value=${() => block}
										oncardselected=${(e: CustomEvent) => {
											if (!this.selectedTemplateCategory) return
											store.setSelectedBlocks = {
												block: e.detail.itemValue,
												templateCategory: this.selectedTemplateCategory,
											}
										}}
									></item-card>
								`}
								</>
							</div>
						</>
					`}
					</>

					<!-- Fabric content -->
					<${Show} when=${() => this.selectedSubTab === 'fabric'}>
						<div class="category-tabs">
							<${For} each=${() => this.fabricCategories}>
							${(category: string) => html`
								<button
									class="category-tab"
									classList=${() => ({active: this.selectedFabricCategory === category})}
									onclick=${() => (this.selectedFabricCategory = category)}
								>
									${category}
								</button>
							`}
							</>
						</div>
						<div class="items-grid">
							<${For} each=${() => this.availableFabrics.filter(fabric => fabric.category === this.selectedFabricCategory)}>
							${(fabric: Fabric) => html`
								<item-card
									item-active=${() => {
										// Check if this fabric is applied to any block of current template
										const templateBlocks = store.selectedBlocks.get(this.selectedTemplateCategory!)
										const templateFabrics = store.selectedFabrics.get(this.selectedTemplateCategory!)
										if (!templateBlocks || !templateFabrics) return false

										const actualBlockCategories = Array.from(templateBlocks.keys())
										return actualBlockCategories.some(
											blockCategory => templateFabrics.get(blockCategory)?._id === fabric._id,
										)
									}}
									item-src=${() => fabric.thumb}
									item-alt=${() => fabric.materialName}
									item-value=${() => fabric}
									oncardselected=${this.#onFabricClick}
								></item-card>
							`}
							</>
						</div>
					</>
					</tabs-provider>
					</>
				</tabs-content>
			`}
			</>
		</div>
	</tabs-provider>
	</>
</bottom-sheet>

	`

	css = css/*css*/ `
		:host {
			display: contents;
		}

		#panel {
			overflow: auto;

			padding: var(--uiSpacing);

			border-radius: 15px;
			position: absolute;

			top: var(--uiSpacing);
			left: var(--uiSpacing);
			bottom: var(--uiSpacing);

			--panelWidth: 300px;
			width: var(--panelWidth);

			@media (width < 720px) {
				--panelWidth: calc(100vw - 2 * var(--uiSpacing));

				top: unset;
				left: var(--uiSpacing);
				right: var(--uiSpacing);
				bottom: 0;

				width: unset;
				height: 400px;

				border-bottom-right-radius: 0;
				border-bottom-left-radius: 0;
			}

			background: var(--appBackground);
			:host-context([data-theme='dark']) & {
				background: var(--appBackgroundDark);
			}
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

		.genders {
			display: flex;
			gap: var(--uiSpacingSmall);
			margin-bottom: var(--uiSpacing);

			button {
				border: none;
				padding: 5px 10px;
				font-size: 0.7rem;
				line-height: 0.7rem;
				height: calc(0.7rem + 10px);
				border-radius: calc((0.7rem + 10px) / 2);

				background: #e0e1e4;
				color: #424347;

				&.selected {
					background: var(--appBackgroundDark);
					color: white;
				}

				:host-context([data-theme='dark']) & {
					background: #2b2b2c;
					color: #d0d0d0;

					&.selected {
						background: var(--appBackground);
						color: black;
					}
				}
			}
		}

		.grid {
			/* A grid with 3 columns, and infinite rows. */
			display: flex;
			gap: var(--uiSpacingSmall);
			flex-wrap: wrap;

			.block {
				--aspectRatio: 0.7;
				--width: calc((var(--panelWidth) - 2 * var(--uiSpacing) - 2 * var(--uiSpacingSmall)) / 3);
				width: var(--width);
				height: calc(var(--width) / var(--aspectRatio));
				overflow: hidden;

				background: #ebeced;
				:host-context([data-theme='dark']) & {
					background: #1b1b1b;
				}

				border: 1px solid transparent;
				border-radius: 10px;

				&:hover {
					border: 1px solid blue;

					:host-context([data-theme='dark']) & {
						border: 1px solid lightblue;
					}
				}

				img {
					pointer-events: none;
					position: relative;
					left: 50%;
					top: -20%;
					transform: translateX(-50%);
					width: 200%;
					height: auto;
				}
			}
		}

		.container {
			max-width: 600px;
			margin: 0 auto;
			background: white;
			padding: 20px;
			border-radius: 16px;
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		}

		.category-tabs {
			display: flex;
			gap: var(--uiGapLarge);
			margin-bottom: var(--uiSpacingMedium);
		}

		.category-tab {
			background: transparent;
			padding: 0;
			border: none;
			border-radius: var(--borderRadiusMedium);
			font-size: var(--fontSizeTextXs);
			color: var(--uiColorSecondaryLightGrey);
			cursor: pointer;
			transition: var(--transitionSlow);
		}

		.category-tab.active {
			color: var(--uiColorPrimaryBlack);
			font-weight: var(--fontWeightSemibold);
		}

		.items-grid {
			display: grid;
			grid-template-columns: repeat(3, 1fr);
			gap: var(--uiGap);
		}

		.item-card {
			aspect-ratio: 1;
			/* Two-layer background: inner fill on padding-box, gradient border on border-box */
			background:
				linear-gradient(#f8f8f8, #f8f8f8) padding-box,
				var(--item-card-border, linear-gradient(#0000, #0000)) border-box;
			border-radius: var(--borderRadiusMedium);
			overflow: hidden;
			cursor: pointer;
			border: var(--borderWidth) solid transparent; /* needed so the border-box layer shows */
			transition:
				transform var(--transitionFast),
				background var(--transitionFast);
		}

		.item-card:hover {
			transform: scale(1.02);
			--item-card-border: linear-gradient(136.36deg, #e56be8 1.67%, #495cff 100.68%);
		}

		@media (max-width: 768px) {
			.item-card:hover {
				transform: none;
				--item-card-border: none;
			}
		}

		.item-card.active {
			--item-card-border: linear-gradient(136.36deg, #e56be8 1.67%, #495cff 100.68%);
		}

		.item-preview {
			width: 100%;
			height: 100%;
			background: #e0e0e0;
			display: flex;
			align-items: center;
			justify-content: center;
			position: relative;

			img {
				width: 100%;
				height: 100%;
				object-fit: cover;
			}
		}

		.item-preview.fabric {
			background: linear-gradient(45deg, #ff6b6b, #ffd93d);
		}

		.item-preview.accessory {
			background: linear-gradient(45deg, #6c5ce7, #a29bfe);
		}

		@media (max-width: 768px) {
			.category-tab {
				font-size: 14px;
			}

			.item-card {
				border-radius: 10px;
			}
		}
	`
}

declare global {
	interface HTMLElementTagNameMap {
		'blocks-selection': BlocksSelection
	}
}

declare module 'lume' {
	interface IntrinsicElements {
		'blocks-selection': ElementAttributes<BlocksSelection, BlocksSelectionAttributes>
	}
}
