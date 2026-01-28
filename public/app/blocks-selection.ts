import {batch, css, element, Element, html, signal, type ElementAttributes} from 'lume'
import {blocks} from '../consts/blocks.js'
import {getFabricsByCollection} from '../consts/fabrics.js'
import {pushState, searchParams} from '../routes.js'

import '../elements/admin-button.js'
import '../elements/animation-select.js'
import '../elements/back-button.js'
import '../elements/bottom-sheet.js'
import '../elements/cube-button.js'
import '../elements/home-button.js'
import '../elements/logic/for-each.js'
import '../elements/logic/show-when.js'
import '../elements/login-ui.js'
import '../elements/logo-button.js'
import '../elements/person-button.js'
import '../elements/placeholder-image.js'
import '../elements/preview-button.js'
import '../elements/redo-button.js'
import '../elements/refresh-button.js'
import '../elements/tabs.js'
import '../elements/theme-switch-button.js'
import '../elements/undo-button.js'
import type {Block, BlockCategory} from '../types/block.js'
import type {Fabric} from '../types/fabric.js'
import type {TemplateCategory} from '../types/template.js'
import {size, values} from '../utils.js'
import './app-buttons.js'
import './fabric-selection.js'
import './item-card.js'
import {store} from './store.js'

type BlocksSelectionAttributes = keyof object // no attributes yet

@element
export class BlocksSelection extends Element {
	static override readonly elementName = 'blocks-selection'

	@signal selectedTemplateCategory: TemplateCategory | null = null
	@signal selectedSubTab: string | null = null // block category or "fabric"
	@signal selectedBlockCategory: BlockCategory = 'Bodice'
	@signal selectedFabricCategory = 'Cotton'
	@signal availableTemplateCategories: TemplateCategory[] = []
	@signal blocksCategories: string[] = []
	@signal fabricCategories: string[] = []
	@signal availableBlocks: Block[] = []
	@signal availableFabrics: Fabric[] = []
	@signal spaceCollection: string | string[] | null = null
	@signal pieceSelections: string[] = []

	private availableBlocksMapping: Record<TemplateCategory, BlockCategory[]> = {
		All: [],
		Shirt: ['Sleeves'],
		Jacket: ['Sleeves'],
		Pants: [],
		Accessories: [],
		Dress: [],
		Skirt: [],
		Top: [],
	}
	override connectedCallback() {
		super.connectedCallback()

		this.createEffect(() => {
			this.spaceCollection = store.getEffectiveCollection()
		})

		// Update available template categories from selectedTemplates
		this.createEffect(() => {
			// Sort template categories in the desired order
			const templateCategoriesOrder = ['Dress', 'Shirt', 'Jacket', 'Pants', 'Skirt']
			this.availableTemplateCategories = Array.from(Object.keys(store.selectedTemplates))
				.filter(category => category !== 'Accessories')
				.sort((a, b) => templateCategoriesOrder.indexOf(a) - templateCategoriesOrder.indexOf(b))

			// Auto-select first template category if none selected
			if (this.availableTemplateCategories.length > 0 && !this.selectedTemplateCategory)
				this.selectedTemplateCategory = this.availableTemplateCategories[0]
		})

		// Update available blocks when template category changes
		this.createEffect(() => {
			if (!this.spaceCollection || !this.selectedTemplateCategory) return

			const selectedTemplate = store.selectedTemplates[this.selectedTemplateCategory]
			if (selectedTemplate) {
				this.availableBlocks = blocks()
					.filter(block => block.collection === this.spaceCollection)
					.filter(block => {
						if (block.templateCategory === 'Pants' || block.templateCategory === 'Accessories') return true
						else return block.templateCategory === selectedTemplate.category
					})
			} else this.availableBlocks = []
		})

		// Update available fabrics when template category changes
		this.createEffect(() => {
			if (!this.spaceCollection || !this.selectedTemplateCategory) return

			const selectedTemplate = store.selectedTemplates[this.selectedTemplateCategory]
			if (selectedTemplate) {
				this.availableFabrics = getFabricsByCollection(this.spaceCollection).filter(fabric =>
					fabric.templateCategories?.includes(selectedTemplate.category),
				)
			} else this.availableFabrics = []
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
			if (this.availableFabrics.length > 0) this.selectedSubTab = 'fabric'
			else if (newCategories.length > 0) {
				this.selectedBlockCategory = newCategories[0]
				this.selectedSubTab = newCategories[0]
			}
		})

		// Update sub-tab when block categories or fabrics change
		this.createEffect(() => {
			if (this.blocksCategories.length > 0 && !this.selectedSubTab) this.selectedSubTab = this.blocksCategories[0]
			else if (this.blocksCategories.length === 0 && this.availableFabrics.length > 0 && !this.selectedSubTab)
				this.selectedSubTab = 'fabric'
		})

		// Update fabric categories when available fabrics change
		this.createEffect(() => {
			const newCategories = [
				...new Set(this.availableFabrics.map(fabric => fabric.category).filter(Boolean)),
			] as string[]
			this.fabricCategories = newCategories

			// Auto-select first category
			if (newCategories.length > 0) this.selectedFabricCategory = newCategories[0] as any
		})

		// Update piece selections when selected fabrics change
		this.createEffect(() => {
			if (!this.selectedTemplateCategory) {
				this.pieceSelections = []
				return
			}

			const templateSelection = store.getTemplateSelection(this.selectedTemplateCategory)
			if (!templateSelection) {
				this.pieceSelections = []
				return
			}

			const fabricsArray = values(templateSelection)
				.map(selection => selection?.fabrics ?? {})
				.filter(fabrics => size(fabrics) > 0)

			if (fabricsArray.length === 0) {
				this.pieceSelections = []
				return
			}

			const firstFabrics = fabricsArray[0]
			this.pieceSelections = Object.keys(firstFabrics).sort()
		})
	}
	override disconnectedCallback() {
		super.disconnectedCallback()
		this.selectedTemplateCategory = null
		this.selectedSubTab = null
	}

	#onBackButtonClick = () => {
		store.view = 'template'
	}

	#onHomeButtonClick = () => {
		store.goBackHomeAndResetState()
	}

	#onPreviewButtonClick = () => {
		batch(() => {
			searchParams().set('isPreview', 'true')
			pushState()
			store.isPreview = true
		})
	}
	override template = () => html`
		<app-buttons-left>
			<app-buttons-group>
				<back-button onclick=${this.#onBackButtonClick}></back-button>
				<home-button onclick=${this.#onHomeButtonClick}></home-button>
			</app-buttons-group>
		</app-buttons-left>

		<app-buttons-right>
			<app-buttons-group>
				<!-- <theme-switch-button></theme-switch-button> -->
				<logo-button brand-name="MoiDien"></logo-button>
			</app-buttons-group>
			<app-buttons-group>
				<!-- <undo-button disabled></undo-button>
			<redo-button disabled></redo-button> -->
				<refresh-button></refresh-button>
			</app-buttons-group>
			<app-buttons-group>
				<person-button></person-button>
				<cube-button></cube-button>
				<admin-button></admin-button>
			</app-buttons-group>
		</app-buttons-right>

		<app-buttons-right layout="bottom">
			<app-buttons-group>
				<preview-button onclick=${this.#onPreviewButtonClick}></preview-button>
			</app-buttons-group>
		</app-buttons-right>

		<bottom-sheet>
			<show-when
				condition=${() => this.availableTemplateCategories.length > 0}
				content=${() => html`
					<tabs-provider
						default-value=${() => this.selectedTemplateCategory}
						ontabchange=${(e: CustomEvent) => {
							this.selectedTemplateCategory = e.detail.value
						}}
					>
						<bottom-sheet-header>
							<div class="tabs-container">
								<tabs-list>
									<for-each
										items=${() => this.availableTemplateCategories}
										content=${() => (category: TemplateCategory) => html`
											<tabs-trigger selected-value=${category}>${category}</tabs-trigger>
										`}
									></for-each>
								</tabs-list>
							</div>
						</bottom-sheet-header>

						<div class="tabs-content-container">
							<for-each
								items=${() => this.availableTemplateCategories}
								content=${() => (templateCategory: TemplateCategory) => html`
									<tabs-content selected-value=${templateCategory}>
										<!-- Sub-tabs within each template category -->
										<show-when
											condition=${() => this.selectedTemplateCategory === templateCategory}
											content=${() => html`
												<tabs-provider
													default-value=${() => this.selectedSubTab}
													ontabchange=${(e: CustomEvent) => {
														this.selectedSubTab = e.detail.value
													}}
												>
													<div class="category-tabs">
														<!-- Fabric tab at the end if fabrics are available -->
														<show-when
															condition=${() => this.availableFabrics.length > 0}
															content=${() => html`
																<button
																	class="category-tab"
																	classList=${() => ({active: this.selectedSubTab === 'fabric'})}
																	onclick=${() => (this.selectedSubTab = 'fabric')}
																>
																	Fabric
																</button>
															`}
														></show-when>

														<!-- Block category tabs -->
														<for-each
															items=${() => this.blocksCategories}
															content=${() => (category: BlockCategory) => html`
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
														></for-each>
													</div>

													<!-- Fabric content -->
													<show-when
														condition="${() => this.selectedSubTab === 'fabric'}"
														content=${() => html`
															<fabric-selection
																piece-selections=${() => this.pieceSelections}
																available-fabrics=${() => this.availableFabrics}
																selected-template-category=${() => this.selectedTemplateCategory}
															></fabric-selection>
														`}
													></show-when>

													<!-- Block content -->
													<for-each
														items=${() => this.blocksCategories}
														content=${() => (blockCategory: BlockCategory) => html`
															<show-when
																condition=${() => this.selectedSubTab === blockCategory}
																content=${() => html`
																	<div class="items-grid">
																		<for-each
																			items=${() =>
																				this.availableBlocks.filter(block => block.category === blockCategory)}
																			content=${() => (block: Block) => html`
																				<item-card
																					item-active=${() => {
																						const selection = store.getBlockSelection(
																							this.selectedTemplateCategory!,
																							block.category,
																						)
																						return selection?.block?._id === block._id
																					}}
																					item-src=${() => block.thumb}
																					item-alt=${() => block.blockName}
																					item-value=${() => block}
																					oncardselected=${(e: CustomEvent) => {
																						if (!this.selectedTemplateCategory) return
																						store.setSelectedBlocks({
																							block: e.detail.itemValue,
																							templateCategory: this.selectedTemplateCategory,
																						})
																					}}
																				></item-card>
																			`}
																		></for-each>
																	</div>
																`}
															></show-when>
														`}
													></for-each>
												</tabs-provider>
											`}
										></show-when>
									</tabs-content>
								`}
							></for-each>
						</div>
					</tabs-provider>
				`}
			></show-when>
		</bottom-sheet>
	`
	override css = css /*css*/ `
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
			font-weight: var(--fontWeightSemiBold);
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

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			'blocks-selection': ElementAttributes<BlocksSelection, BlocksSelectionAttributes>
		}
	}
}
