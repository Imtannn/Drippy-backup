import {
	attribute,
	booleanAttribute,
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

import {fabrics} from '../consts/fabrics.js'
import '../elements/bottom-sheet.js'
import '../elements/logic/for-each.js'
import '../elements/logic/show-when.js'
import '../elements/show-on-device.js'
import '../elements/tabs.js'
import type {Block, BlockCategory} from '../types/block.js'
import type {Fabric} from '../types/fabric.js'
import type {Template} from '../types/template.js'
import './fabric-selection.js'
import './item-card.js'
import './loading-spinner-overlay.js'
import {store, updateGarmentsSelectionInUrl} from './store.js'
import {templateHelpers} from './template-helpers.js'

const STYLE_TAB = 'style'
const FABRICS_TAB = 'fabrics'

type RemixOverlayAttributes = 'selectedTemplate' | 'onclose' | 'disabledScroll'

@element
export class RemixOverlay extends Element {
	static readonly elementName = 'remix-overlay'

	@attribute selectedTemplate: Template | null = null
	@booleanAttribute disabledScroll = false

	@signal activeTab: typeof STYLE_TAB | typeof FABRICS_TAB | null = null
	@signal spaceCollection: string | null = null
	@signal availableBlocks: Block[] = []
	@signal blocksCategories: string[] = []
	@signal availableFabrics: Record<string, Fabric[]> = {}
	@signal pieceSelections: string[] = []
	@signal selectedSubTab: string | null = null
	@signal isOpen: boolean = false

	@eventAttribute onclose: () => void = () => {}

	#scheduleUrlSync = () => {
		queueMicrotask(() => {
			updateGarmentsSelectionInUrl(store.selectedGarments)
		})
	}

	#onFabricCardSelected = (event: Event) => {
		const path = typeof event.composedPath === 'function' ? event.composedPath() : []
		const triggeredInsideFabricSelection = path.some(
			target => target instanceof HTMLElement && target.tagName === 'FABRIC-SELECTION',
		)

		if (triggeredInsideFabricSelection) {
			this.#scheduleUrlSync()
		}
	}

	connectedCallback() {
		super.connectedCallback()
		this.addEventListener('cardselected', this.#onFabricCardSelected)

		// Set activeTab if selectedTemplate is already set
		if (this.selectedTemplate) {
			this.activeTab = FABRICS_TAB
		}

		this.createEffect(() => {
			this.spaceCollection = store.getEffectiveCollection() ?? 'gap'

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

			// Use template blockOptions if available, otherwise fall back to templateHelpers
			if (this.selectedTemplate.blockOptions && this.selectedTemplate.blockOptions.length > 0) {
				// Flatten all blocks from blockOptions
				this.availableBlocks = this.selectedTemplate.blockOptions.flatMap(option => option.blocks)
			} else {
				this.availableBlocks = templateHelpers.getBlocksForTemplateCategory(
					this.selectedTemplate.category,
					this.spaceCollection,
				)
			}

			onCleanup(() => {
				this.availableBlocks = []
			})
		})

		// Set activeTab immediately when selectedTemplate is set
		this.createEffect(() => {
			const template = this.selectedTemplate
			if (template) {
				// Always ensure activeTab is set when template exists
				this.activeTab = this.activeTab || FABRICS_TAB
			}
		})

		// Update block categories when template category changes (following blocks-selection logic)
		this.createEffect(() => {
			if (!this.selectedTemplate) {
				this.blocksCategories = []
				return
			}

			// Use template blockOptions if available, otherwise fall back to templateHelpers
			if (this.selectedTemplate.blockOptions && this.selectedTemplate.blockOptions.length > 0) {
				this.blocksCategories = this.selectedTemplate.blockOptions.map(option => option.category)
			} else {
				const {blocksCategories} = templateHelpers.isRemixAvailableForTemplate(this.selectedTemplate, {
					selectedGarments: untrack(() => store.selectedGarments),
					selectedSpace: untrack(() => store.getEffectiveSpace()),
					sourceCollection: this.spaceCollection,
				})
				this.blocksCategories = blocksCategories
			}

			if (this.blocksCategories.length > 0) {
				this.selectedSubTab = this.blocksCategories[0]
			}

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

			// Use template fabricOptions if available, otherwise fall back to templateHelpers
			if (this.selectedTemplate.fabricOptions && this.selectedTemplate.fabricOptions.length > 0) {
				// Get fabrics from the collection that match the fabricOptions material IDs
				const collection = this.spaceCollection
				const availableFabrics: Record<string, Fabric[]> = {}

				// Get fabrics that match the fabricOptions
				const optionFabrics = this.selectedTemplate.fabricOptions
					.map(materialId => {
						return fabrics[collection]?.find(fabric => fabric._id === materialId)
					})
					.filter(fabric => fabric !== undefined) as Fabric[]

				const defaultFabrics = fabrics['default']
				if (optionFabrics.length > 0) {
					availableFabrics['default'] = [...optionFabrics, ...defaultFabrics]
				}

				// Handle extraMaterials if they exist - use optionFabrics directly
				if (this.selectedTemplate.extraMaterials && this.selectedTemplate.extraMaterials.length > 0) {
					for (const extraMaterial of this.selectedTemplate.extraMaterials) {
						availableFabrics[extraMaterial.mesh] = [...optionFabrics, ...defaultFabrics]
					}
				}

				this.availableFabrics = availableFabrics
			} else {
				const defaultFabrics = fabrics['default']
				this.availableFabrics =
					templateHelpers.getAvailableFabricsForTemplate(this.spaceCollection, this.selectedTemplate) || {}
				this.availableFabrics['default'] = [...this.availableFabrics['default'], ...defaultFabrics]
			}

			// Make sure the overlay is scrolled to the top on opening
			this.shadowRoot?.querySelector('.scroll-content')?.scrollIntoView({behavior: 'instant', block: 'end'})

			onCleanup(() => {
				this.availableFabrics = {}
			})
		})

		// Update piece selections when selected fabrics change (following blocks-selection logic)
		this.createEffect(() => {
			const templateSelection = this.selectedTemplate
				? store.getTemplateSelection(this.selectedTemplate.category)
				: undefined

			if (!templateSelection) {
				this.pieceSelections = []
				return
			}

			const fabricsArray = Object.values(templateSelection)
				.map(selection => selection?.fabrics ?? {})
				.filter(fabrics => Object.keys(fabrics).length > 0)

			if (fabricsArray.length === 0) {
				this.pieceSelections = []
				return
			}

			const firstFabrics = fabricsArray[0]
			this.pieceSelections = Object.keys(firstFabrics).sort()

			onCleanup(() => {
				this.pieceSelections = []
			})
		})
	}

	disconnectedCallback() {
		super.disconnectedCallback()
		this.removeEventListener('cardselected', this.#onFabricCardSelected)
	}

	#onBlockSelect = (block: Block) => {
		if (!this.selectedTemplate) return

		store.setSelectedBlocks({
			block,
			templateCategory: this.selectedTemplate.category,
		})

		this.#scheduleUrlSync()
	}

	#getIsBlockActive = (block: Block) => {
		if (!this.selectedTemplate) return false
		const selection = store.getBlockSelection(this.selectedTemplate.category, block.category)
		return selection?.block?._id === block._id
	}

	#isBlockLoading = (block: Block) => {
		if (!this.selectedTemplate) return false

		// Check if the block model itself is still loading
		if (store.isBlockLoading(block._id)) return true

		// Only check fabrics if this block is actually the selected one
		const selection = store.getBlockSelection(this.selectedTemplate.category, block.category)
		if (selection?.block?._id !== block._id) return false // Not the selected block

		// Check if any fabrics for this selected block are loading
		if (!selection?.fabrics) return false
		return Object.values(selection.fabrics).some(fabric => store.isFabricLoading(fabric._id))
	}

	#filteredBlocksByCategory = (category: BlockCategory) => {
		// If using template blockOptions, filter from the specific category's blocks
		if (this.selectedTemplate?.blockOptions && this.selectedTemplate.blockOptions.length > 0) {
			const categoryOption = this.selectedTemplate.blockOptions.find(option => option.category === category)
			return categoryOption?.blocks || []
		}

		// Otherwise use the general available blocks
		return this.availableBlocks.filter(block => block.category === category)
	}

	#onSubTabChange = (e: CustomEvent) => {
		this.selectedSubTab = e.detail.value
	}

	#renderContent = () => html`
		<div class="overlay">
			<show-when
				condition=${() => this.selectedTemplate !== null && this.activeTab !== null}
				content=${() => html`
					<tabs-provider
						default-value=${() => this.activeTab || FABRICS_TAB}
						ontabchange=${(e: CustomEvent) => (this.activeTab = e.detail.value)}
					>
						<div class="tabs-list-container">
							<tabs-list>
								<tabs-trigger selected-value=${FABRICS_TAB}>Fabrics</tabs-trigger>
								<show-when
									condition=${() => this.blocksCategories.length > 0}
									content=${() => html`<tabs-trigger selected-value=${STYLE_TAB}>Style</tabs-trigger>`}
								></show-when>
							</tabs-list>
						</div>

						<tabs-content selected-value=${FABRICS_TAB}>
							<div class="scroll-content"></div>

							<fabric-selection
								is-remix
								piece-selections=${() => this.pieceSelections}
								available-fabrics=${() => this.availableFabrics}
								selected-template-category=${() => this.selectedTemplate?.category ?? ''}
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
												content=${() => (blockCategory: BlockCategory) => html`
													<show-when
														condition=${() => this.selectedSubTab === blockCategory}
														content=${() => html`
															<div class="items-grid">
																<for-each
																	items=${() => this.#filteredBlocksByCategory(blockCategory)}
																	content=${() => (block: Block) => html`
																		<div class="item-card-container">
																			<item-card
																				item-active=${() => this.#getIsBlockActive(block)}
																				item-src=${() => block.thumb}
																				item-alt=${() => block.blockName}
																				item-value=${() => block}
																				oncardselected=${() => this.#onBlockSelect(block)}
																			></item-card>
																			<show-when
																				condition=${() => this.#isBlockLoading(block)}
																				content=${() => html` <loading-spinner-overlay></loading-spinner-overlay> `}
																			></show-when>
																		</div>
																	`}
																></for-each>
															</div>
														`}
													></show-when>
												`}
											></for-each>
										</div>
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

	template = () => html`
		<!-- Mobile: wrap in bottom-sheet -->
		<show-on-device device="mobile">
			<bottom-sheet
				class="remix-overlay-sheet"
				default-snap="0.25"
				snap-points="0.25,0.25,0.25"
				z-index="2000"
				collapse-button="false"
				max-height="100vh"
				disabled-scroll=${() => this.disabledScroll}
			>
				${this.#renderContent()}
			</bottom-sheet>
		</show-on-device>

		<!-- Desktop: render directly without bottom-sheet wrapper -->
		<show-on-device device="desktop">
			<div class="remix-overlay-desktop" classList=${{'is-open': () => this.disabledScroll}}>
				${this.#renderContent()}
			</div>
		</show-on-device>
	`

	css = css/*css*/ `
		:host {
			display: block;
		}

		.overlay {
			display: flex;
			flex-direction: column;
			gap: var(--uiSpacingMedium);
			min-height: 100%;
		}

		.done-button-container {
			display: none;
			justify-content: flex-end;
			margin-bottom: var(--uiSpacingSmall);
			padding: 0 var(--uiSpacing);
		}
		.done-button {
			background: var(--uiColorPrimaryBlack);
			color: var(--uiColorPrimaryWhite);
			border: none;
			border-radius: var(--borderRadiusPill);
			height: var(--buttonHeight);
			padding: var(--uiSpacingSmall) var(--uiSpacingMedium);
			font-size: var(--fontSizeTextXs);
			font-weight: var(--fontWeightSemiBold);
			cursor: pointer;
			transition: var(--transitionFast);
		}

		.done-button:hover {
			background: var(--uiColorPrimaryBlack);
			opacity: 0.8;
		}

		.category-tabs {
			display: flex;
			gap: var(--uiGapLarge);
			margin-bottom: var(--uiSpacingTiny);
		}

		.category-tab {
			background: transparent;
			padding-top: var(--uiSpacingMedium);
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
			grid-auto-flow: column;
			grid-auto-columns: calc((100% - (var(--uiGap) * 3)) / 4);
			gap: var(--uiGap);
			overflow-x: auto;
			overflow-y: auto;
			scroll-snap-type: x proximity;
			-webkit-overflow-scrolling: touch;
			padding-bottom: var(--uiSpacingSmall);
		}

		.items-grid::-webkit-scrollbar {
			display: none;
		}

		.items-grid > * {
			scroll-snap-align: start;
		}

		.item-card-container {
			position: relative;
		}

		.empty-state {
			font-size: var(--fontSizeTextXs);
			color: var(--uiColorSecondaryLightGrey);
			text-align: center;
			padding: var(--uiSpacingLarge) 0;
		}

		.tabs-list-container {
			position: sticky;
			top: 0;
			right: 0;
			left: 0;
			z-index: 100;
			background: var(--uiColorPrimaryWhite);
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: var(--uiSpacing);
			padding-top: 15px;
			padding-bottom: 10px;
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
			padding-top: 0;
			margin-top: -10px;
		}

		.remix-overlay-sheet {
			/* panel-width is controlled via attribute */
		}

		/* Desktop: fixed at bottom, slide up when open */
		.remix-overlay-desktop {
			position: fixed;
			bottom: 0;
			left: 0;
			right: 0;
			z-index: 2001;
			background: var(--uiColorPrimaryWhite);
			border-top-left-radius: var(--borderRadiusXl);
			border-top-right-radius: var(--borderRadiusXl);
			height: 25vh;
			max-height: 25vh;
			transform: translateY(100%);
			transition: transform 0.3s ease-out;
			overflow-y: auto;
			box-shadow:
				0 -4px 6px -1px rgba(0, 0, 0, 0.1),
				0 -2px 4px -1px rgba(0, 0, 0, 0.06);
			pointer-events: none;
		}

		.remix-overlay-desktop.is-open {
			transform: translateY(0);
			pointer-events: auto;
		}

		@media (max-width: 768px) {
			.overlay {
				height: 100%;
				overflow-y: auto;
				overflow-x: hidden;
				overscroll-behavior: contain;
			}

			tabs-content {
				overflow: visible;
			}

			.template-item {
				transform: scale(0.8);
				transform-origin: top center;
			}
		}

		@media (min-width: 769px) {
			.category-tabs {
				margin-bottom: var(--uiSpacingMedium);
			}
			.items-grid {
				grid-auto-flow: row;
				grid-auto-columns: unset;
				grid-template-columns: repeat(4, 1fr);
				overflow-x: visible;
				padding-bottom: var(--uiSpacingXxs);
				scroll-snap-type: none;
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
