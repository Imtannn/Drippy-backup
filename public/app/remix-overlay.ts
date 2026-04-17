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

import {fabrics, getFabricsByCollection} from '../consts/fabrics.js'
import '../elements/bottom-sheet.js'
import '../elements/logic/for-each.js'
import '../elements/logic/show-when.js'
import '../elements/show-on-device.js'
import '../elements/tabs.js'
import type {Block} from '../types/block.js'
import type {Fabric, FabricsByCategory} from '../types/fabric.js'
import type {Template} from '../types/template.js'
import './fabric-selection.js'
import './item-card.js'
import './loading-spinner-overlay.js'
import {store, updateGarmentsSelectionInUrl} from './store.js'
import {templateHelpers} from './TemplateHelpers.js'
import {size, values} from '../utils.js'

const FABRICS_TAB = 'fabrics'

type RemixOverlayAttributes = 'selectedTemplate' | 'onclose' | 'disabledScroll'

@element
export class RemixOverlay extends Element {
	static override readonly elementName = 'remix-overlay'

	@attribute selectedTemplate: Template | null = null
	@booleanAttribute disabledScroll = false

	@signal activeTab: typeof FABRICS_TAB | null = null
	@signal spaceCollection: string | string[] | null = null
	@signal availableBlocks: Block[] = []
	@signal blocksCategories: string[] = []
	@signal availableFabrics: FabricsByCategory = {}
	@signal pieceSelections: string[] = []
	@signal selectedSubTab: string | null = null
	@signal isOpen: boolean = false

	@eventAttribute override onclose: () => void = () => {}

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

		if (triggeredInsideFabricSelection) this.#scheduleUrlSync()
	}
	override connectedCallback() {
		super.connectedCallback()
		this.addEventListener('cardselected', this.#onFabricCardSelected)

		this.createEffect(() => {
			this.spaceCollection = store.getEffectiveCollection()

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
			if (this.selectedTemplate.blockOptions && this.selectedTemplate.blockOptions.length > 0)
				// Flatten all blocks from blockOptions
				this.availableBlocks = this.selectedTemplate.blockOptions.flatMap(option => option.blocks)
			else {
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
			if (this.selectedTemplate && !this.activeTab) this.activeTab = FABRICS_TAB
		})

		// Update block categories when template category changes
		this.createEffect(() => {
			if (!this.selectedTemplate) {
				this.blocksCategories = []
				return
			}

			// Use template blockOptions if available, otherwise fall back to templateHelpers
			if (this.selectedTemplate.blockOptions && this.selectedTemplate.blockOptions.length > 0)
				this.blocksCategories = this.selectedTemplate.blockOptions.map(option => option.category)
			else {
				const {blocksCategories} = templateHelpers.isRemixAvailableForTemplate(this.selectedTemplate, {
					selectedGarments: untrack(() => store.selectedGarments),
					selectedSpace: untrack(() => store.getEffectiveSpace()),
					sourceCollection: this.spaceCollection,
				})
				this.blocksCategories = blocksCategories
			}

			if (this.blocksCategories.length > 0) this.selectedSubTab = this.blocksCategories[0]

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
				const availableFabrics: FabricsByCategory = {}

				// Get fabrics that match the fabricOptions
				const optionFabrics = this.selectedTemplate.fabricOptions
					.map(materialId => {
						return fabrics().find(fabric => fabric._id === materialId)
					})
					.filter(fabric => fabric !== undefined) as Fabric[]

				// Get categories from option fabrics
				const optionCategories = new Set(optionFabrics.map(f => f.category).filter(Boolean))

				// Filter default fabrics to only include those with matching categories (and not already in options)
				const filteredDefaultFabrics = getFabricsByCollection('default').filter(
					fabric => fabric.category && optionCategories.has(fabric.category),
				)

				if (optionFabrics.length > 0) availableFabrics['default'] = [...optionFabrics, ...filteredDefaultFabrics]

				// Handle extraMaterials if they exist - use optionFabrics directly
				if (this.selectedTemplate.extraMaterials && this.selectedTemplate.extraMaterials.length > 0) {
					for (const extraMaterial of this.selectedTemplate.extraMaterials)
						availableFabrics[extraMaterial.mesh] = [...optionFabrics, ...filteredDefaultFabrics]
				}

				this.availableFabrics = availableFabrics
			} else {
				this.availableFabrics =
					templateHelpers.getAvailableFabricsForTemplate(this.spaceCollection, this.selectedTemplate) || {}

				// CONTINUE remove line, and ensure it works
				this.availableFabrics['default'] = this.availableFabrics['default'] // eslint-disable-line -- trigger reactivity
			}

			// Make sure the overlay is scrolled to the top on opening
			this.shadowRoot?.querySelector('.scroll-content')?.scrollIntoView({behavior: 'instant', block: 'end'})

			onCleanup(() => {
				this.availableFabrics = {}
			})
		})

		// Update piece selections when selected fabrics change
		this.createEffect(() => {
			const templateSelection = this.selectedTemplate
				? store.getTemplateSelection(this.selectedTemplate.category)
				: undefined

			if (!templateSelection) {
				this.pieceSelections = []
				return
			}

			const fabricsArray = values(templateSelection)
				.map(selection => selection.fabrics)
				.filter(fabrics => size(fabrics) > 0)

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
	override disconnectedCallback() {
		super.disconnectedCallback()
		this.removeEventListener('cardselected', this.#onFabricCardSelected)
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
						<tabs-content selected-value=${FABRICS_TAB}>
							<div class="scroll-content"></div>

							<fabric-selection
								is-remix
								piece-selections=${() => this.pieceSelections}
								available-fabrics=${() => this.availableFabrics}
								selected-template-category=${() => this.selectedTemplate?.category ?? ''}
							></fabric-selection>
						</tabs-content>

					</tabs-provider>
				`}
			>
			</show-when>
		</div>
	`
	override template = () => html`
		<!-- Mobile: wrap in bottom-sheet -->
		<show-on-device mobile>
			<bottom-sheet
				class="remix-overlay-sheet"
				default-snap=${() => (this.pieceSelections.length > 1 ? '0.25' : '0.20')}
				snap-points=${() => (this.pieceSelections.length > 1 ? '0.25,0.25,0.25' : '0.20,0.20,0.20')}
				z-index="2000"
				collapse-button="false"
				max-height="100vh"
				disabled-scroll=${() => this.disabledScroll}
			>
				${this.#renderContent()}
			</bottom-sheet>
		</show-on-device>

		<!-- Desktop: render directly without bottom-sheet wrapper -->
		<show-on-device desktop>
			<div class="remix-overlay-desktop" classList=${{'is-open': () => this.disabledScroll}}>
				${this.#renderContent()}
			</div>
		</show-on-device>
	`
	override css = css /*css*/ `
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
			grid-auto-columns: calc((100% - (var(--uiGap) * 4)) / 4.5);
			gap: var(--uiGap);
			overflow-x: auto;
			overflow-y: auto;
			scroll-snap-type: x proximity;
			-webkit-overflow-scrolling: touch;
			padding-top: var(--uiSpacingSmall);
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
			background: rgba(255, 255, 255, 0.06);
			backdrop-filter: blur(4px);
			-webkit-backdrop-filter: blur(4px);
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: var(--uiSpacing);
			padding-top: 10px;
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
			padding: 0 var(--uiSpacing);
			padding-top: 10px;
			padding-bottom: 10px;
			margin-top: 0;
		}

		.remix-overlay-sheet {
			/* panel-width is controlled via attribute */
		}

		/* Desktop: fixed at bottom, slide up when open */
		.remix-overlay-desktop {
			position: fixed;
			width: 100%;

			/* hide beyond the bottom edge */
			bottom: 0;
			transform: translateY(100%);

			/* It will slide in on top of other content. */
			z-index: 2001;

			/* Keep the underlying panel visible by at least a certain amount when there is not enough vertical space to fit the whole bottom sheet. */
			max-height: calc(100% - var(--uiSpacingXxl));

			background: rgba(255, 255, 255, 0.1);
			backdrop-filter: blur(4px);
			-webkit-backdrop-filter: blur(4px);
			border-top-left-radius: var(--borderRadiusXl);
			border-top-right-radius: var(--borderRadiusXl);
			/* FIXME this transition currently doesn't work because height is not explicit, but based on content (translateY(100%) depends on height). We can fix it by translating a 100%x100% outer container instead. */
			transition: transform 0.3s ease-out;
			overflow-y: auto;
			box-shadow:
				0 -4px 6px -1px rgba(0, 0, 0, 0.1),
				0 -2px 4px -1px rgba(0, 0, 0, 0.06);
			pointer-events: none;

			/* slide up into view */
			&.is-open {
				transform: translateY(0);
				pointer-events: auto;
			}
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

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			'remix-overlay': ElementAttributes<RemixOverlay, RemixOverlayAttributes>
		}
	}
}
