import {
	attribute,
	css,
	Element,
	element,
	eventAttribute,
	html,
	onCleanup,
	signal,
	untrack,
	type ElementAttributes,
} from 'lume'

import '../elements/logic/for-each.js'
import '../elements/logic/show-when.js'
import '../elements/tabs.js'
import type {Block, BlockCategory} from '../types/block.js'
import type {Fabric} from '../types/fabric.js'
import type {Template} from '../types/template.js'
import {blockManager} from './block-manager.js'
import './fabric-selection.js'
import './item-card.js'
import {store} from './store.js'

const STYLE_TAB = 'style'
const FABRICS_TAB = 'fabrics'

type RemixOverlayAttributes = 'selectedTemplate' | 'onclose'

@element
export class RemixOverlay extends Element {
	static readonly elementName = 'remix-overlay'

	@attribute selectedTemplate: Template | null = null

	@signal activeTab: typeof STYLE_TAB | typeof FABRICS_TAB | null = null
	@signal spaceCollection: string | null = null
	@signal availableBlocks: Block[] = []
	@signal blocksCategories: string[] = []
	@signal availableFabrics: Record<string, Fabric[]> = {}
	@signal pieceSelections: string[] = []
	@signal selectedSubTab: string | null = null

	@eventAttribute onclose: () => void = () => {}

	connectedCallback() {
		super.connectedCallback()

		this.createEffect(() => {
			this.spaceCollection = store.selectedSpace?.collection ?? 'moidien'

			onCleanup(() => {
				this.spaceCollection = null
			})
		})

		// Update blocks for the selected template category
		this.createEffect(() => {
			if (!this.selectedTemplate || !this.spaceCollection) {
				this.availableBlocks = []
				return
			}

			this.availableBlocks = blockManager.getBlocksForTemplateCategory(
				this.selectedTemplate.category,
				this.spaceCollection,
			)

			onCleanup(() => {
				this.availableBlocks = []
			})
		})

		// Update block categories when template category changes (following blocks-selection logic)
		this.createEffect(() => {
			if (!this.selectedTemplate) {
				this.blocksCategories = []
				return
			}

			const {blocksCategories} = blockManager.isRemixAvailableForTemplate(this.selectedTemplate, {
				selectedBlocks: untrack(() => store.selectedBlocks),
				selectedSpace: untrack(() => store.selectedSpace),
				sourceCollection: this.spaceCollection,
			})

			this.blocksCategories = blocksCategories

			if (blocksCategories.length > 0) {
				this.selectedSubTab = blocksCategories[0]
			}

			this.activeTab = FABRICS_TAB

			onCleanup(() => {
				this.blocksCategories = []
			})
		})

		// Update fabrics for the template category
		this.createEffect(() => {
			if (!this.selectedTemplate || !this.spaceCollection) {
				this.availableFabrics = {}
				return
			}

			this.availableFabrics =
				blockManager.getAvailableFabricsForTemplate(this.spaceCollection, this.selectedTemplate) || {}

			// Make sure the overlay is scrolled to the top on opening
			this.shadowRoot?.querySelector('.scroll-content')?.scrollIntoView({behavior: 'instant', block: 'end'})

			onCleanup(() => {
				this.availableFabrics = {}
			})
		})

		// Update piece selections when selected fabrics change (following blocks-selection logic)
		this.createEffect(() => {
			const selectedFabrics = store.selectedFabrics.get(this.selectedTemplate!.category)
			if (!selectedFabrics) {
				this.pieceSelections = []
				return
			}

			const selectedBlocks = Array.from(selectedFabrics.keys())
			if (!selectedBlocks) {
				this.pieceSelections = []
				return
			}

			const selectedPieces = selectedBlocks.map(block => selectedFabrics.get(block)?.keys())?.[0]

			if (!selectedPieces) {
				this.pieceSelections = []
				return
			}

			this.pieceSelections = Array.from(selectedPieces).sort()

			onCleanup(() => {
				this.pieceSelections = []
			})
		})
	}

	#onBlockSelect = (block: Block) => {
		if (!this.selectedTemplate) return

		store.setSelectedBlocks({
			block,
			templateCategory: this.selectedTemplate.category,
		})
	}

	#getIsBlockActive = (block: Block) => {
		if (!this.selectedTemplate) return false
		const templateBlocks = store.selectedBlocks.get(this.selectedTemplate.category)
		return templateBlocks?.get(block.category)?._id === block._id
	}

	#filteredBlocksByCategory = (category: BlockCategory) => {
		return this.availableBlocks.filter(block => block.category === category)
	}

	#onSubTabChange = (e: CustomEvent) => {
		this.selectedSubTab = e.detail.value
	}

	template = () => html`
		<div class="overlay">
			<show-when
				condition=${() => this.activeTab !== null}
				content=${() => html`
					<tabs-provider
						default-value=${() => this.activeTab}
						ontabchange=${(e: CustomEvent) => (this.activeTab = e.detail.value)}
					>
						<div class="tabs-list-container">
							<tabs-list>
								<tabs-trigger selected-value=${FABRICS_TAB}> Fabrics </tabs-trigger>
								<show-when
									condition=${() => this.blocksCategories.length > 0}
									content=${() => html`<tabs-trigger selected-value=${STYLE_TAB}>Style</tabs-trigger>`}
								></show-when>
							</tabs-list>
						</div>

						<tabs-content selected-value=${FABRICS_TAB}>
							<div class="scroll-content"></div>

							<fabric-selection
								piece-selections=${() => this.pieceSelections}
								available-fabrics=${() => this.availableFabrics}
								selected-template-category=${() => this.selectedTemplate!.category}
							></fabric-selection>
						</tabs-content>

						<tabs-content selected-value=${STYLE_TAB}>
							<div class="scroll-content"></div>
							<show-when
								condition=${() => this.blocksCategories.length > 0}
								content=${() => html`
									<tabs-provider default-value=${() => this.selectedSubTab} ontabchange=${this.#onSubTabChange}>
										<div class="category-tabs">
											<for-each
												items=${() => this.blocksCategories}
												content=${() => (category: BlockCategory) => html`
													<button
														class="category-tab"
														classList=${() => ({active: this.selectedSubTab === category})}
														onclick=${() => {
															this.selectedSubTab = category
														}}
													>
														${category}
													</button>
												`}
											></for-each>
										</div>

										<for-each
											items=${() => this.blocksCategories}
											content=${() => (blockCategory: BlockCategory) => html`
												<show-when
													condition=${() => this.selectedSubTab === blockCategory}
													content=${() => html`
														<div class="items-grid">
															<for-each
																items=${() => this.#filteredBlocksByCategory(blockCategory)}
																content=${() => (block: Block) => html`
																	<item-card
																		item-active=${() => this.#getIsBlockActive(block)}
																		item-src=${() => block.thumb}
																		item-alt=${() => block.blockName}
																		item-value=${() => block}
																		oncardselected=${() => this.#onBlockSelect(block)}
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
								fallback=${() => html`<div class="empty-state">No variations available.</div>`}
							></show-when>
						</tabs-content>
					</tabs-provider>
				`}
			>
			</show-when>
		</div>
	`

	css = css/*css*/ `
		:host {
			display: block;
		}

		.overlay {
			display: flex;
			flex-direction: column;
			gap: var(--uiSpacingMedium);
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

		.empty-state {
			font-size: var(--fontSizeTextXs);
			color: var(--uiColorSecondaryLightGrey);
			text-align: center;
			padding: var(--uiSpacingLarge) 0;
		}

		.tabs-list-container {
			position: absolute;
			top: 15px;
			right: 0;
			left: 0;
			z-index: 100;
			background: var(--uiColorPrimaryWhite);
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: var(--uiSpacing);
			padding-top: 0;
			padding-bottom: var(--uiSpacingSmall);
		}

		.close-button-container {
			margin: -12px 8px;
			transform: translateX(20px);
			cursor: pointer;
			font-weight: var(--fontWeightSemiBold);
			font-size: var(--fontSizeTextXs);
			color: #ffffff;
			padding: 4px 12px;
			background: var(--uiColorPrimaryBlack);
			border: none;
			border-radius: 16px;
		}

		tabs-content {
			padding: var(--uiSpacing);
			padding-bottom: var(--uiSpacingXxl);
		}

		@media (min-width: 769px) {
			tabs-content {
				padding-top: 25px;
			}
		}
	`
}

declare global {
	interface HTMLElementTagNameMap {
		'remix-overlay': RemixOverlay
	}
}

declare module 'lume' {
	interface IntrinsicElements {
		'remix-overlay': ElementAttributes<RemixOverlay, RemixOverlayAttributes>
	}
}
