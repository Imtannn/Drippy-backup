import {attribute, booleanAttribute, css, Element, element, html, signal, type ElementAttributes} from 'lume'
import '../elements/logic/show-when.js'
import '../elements/tabs.js'
import type {BlockCategory} from '../types/block.js'
import type {Fabric, FabricCategory, FabricsByCategory} from '../types/fabric.js'
import type {TemplateCategory} from '../types/template.js'
import './loading-spinner-overlay.js'
import {store} from './store.js'
import {pushHistory} from './history.js'
import {entries, size, values} from '../utils.js'
import type {PieceFabricsMap} from '../types/types.js'

type FabricSelectionAttributes = 'pieceSelections' | 'availableFabrics' | 'selectedTemplateCategory' | 'isRemix'

@element
export class FabricSelection extends Element {
	static override readonly elementName = 'fabric-selection'

	@attribute pieceSelections: string[] = []
	@attribute availableFabrics: FabricsByCategory = {}
	@attribute selectedTemplateCategory: TemplateCategory | null = null
	@booleanAttribute isRemix = false

	@signal selectedCategoryTab: FabricCategory | 'All' = 'All'
	@signal private fabricThumbValidity: Record<string, boolean> = {}

	override connectedCallback() {
		super.connectedCallback()

		this.createEffect(() => {
			void this.selectedTemplateCategory
			if (!store.selectingPiece && this.pieceSelections.length > 0) store.setSelectingPiece = this.pieceSelections[0]
		})

		// Reset category tab when piece or fabrics change
		this.createEffect(() => {
			const categories = this.#getFabricCategories()
			if (categories.length > 0 && !categories.includes(this.selectedCategoryTab)) this.selectedCategoryTab = 'All'
		})
	}
	override disconnectedCallback() {
		super.disconnectedCallback()
		store.setSelectingPiece = null
	}

	#getSelectedFabrics = (): PieceFabricsMap[] => {
		if (!this.selectedTemplateCategory) return []

		const templateSelection = store.getTemplateSelection(this.selectedTemplateCategory)
		if (!templateSelection) return []

		return values(templateSelection)
			.map(selection => selection.fabrics)
			.filter(fabrics => size(fabrics) > 0)
	}

	#getPieceFabric = (piece: string) => {
		const selectedFabrics = this.#getSelectedFabrics()

		for (const fabrics of selectedFabrics) {
			const fabric = fabrics[piece]
			if (fabric) return fabric
		}

		return undefined
	}

	#getPiecesFabrics = (pieceSelections: string[]) => {
		if (!pieceSelections) return []

		const piecesFabrics = pieceSelections
			.map(piece => {
				const fabric = this.#getPieceFabric(piece)
				if (!fabric) return undefined
				return {
					...fabric,
					assignedMesh: piece,
				}
			})
			.filter(fabric => fabric !== undefined)

		return piecesFabrics
	}

	#onFabricSelect = (e: CustomEvent, piece: string) => {
		const fabric = e.detail.itemValue
		if (!this.selectedTemplateCategory) return

		pushHistory()

		// Get ALL actually selected block categories for this template (not just the editable ones)
		const templateSelection = store.getTemplateSelection(this.selectedTemplateCategory)
		if (!templateSelection) return

		const actualBlockCategories = entries(templateSelection)
			.filter(([, selection]) => selection.block)
			.map(([blockCategory]) => blockCategory as BlockCategory)

		// Apply fabric to ALL selected blocks of this template category
		const fabricData = actualBlockCategories.map(blockCategory => ({
			fabric,
			blockCategory,
			templateCategory: this.selectedTemplateCategory!,
			assignedMesh: piece,
		}))

		store.setSelectedFabrics = fabricData
	}

	#onPieceSelect = (piece: string) => {
		store.setSelectingPiece = piece
	}

	#isFabricActive = (fabric: Fabric, piece: string) => {
		if (!this.selectedTemplateCategory) return false
		const templateSelection = store.getTemplateSelection(this.selectedTemplateCategory)

		if (!templateSelection) return false

		return values(templateSelection).some(selection => selection?.fabrics?.[piece]?._id === fabric._id)
	}

	#getFabricCategories = (): (FabricCategory | 'All')[] => {
		const fabrics = this.availableFabrics[store.selectingPiece || 'default'] || []
		const categoriesSet = new Set<FabricCategory>()
		for (const fabric of fabrics) if (fabric.category) categoriesSet.add(fabric.category)

		const categories = Array.from(categoriesSet).sort()
		return categories.length > 1 ? ['All', ...categories] : ['All']
	}

	#validateFabricThumb = (fabric: Fabric) => {
		if (!fabric._id || !fabric.thumb) return
		if (this.fabricThumbValidity[fabric._id] !== undefined) return
		// Mark as pending immediately to avoid repeated Image() creation on rerenders.
		this.fabricThumbValidity = {...this.fabricThumbValidity, [fabric._id]: false}

		const img = new Image()
		img.onload = () => {
			this.fabricThumbValidity = {...this.fabricThumbValidity, [fabric._id]: true}
		}
		img.onerror = () => {
			this.fabricThumbValidity = {...this.fabricThumbValidity, [fabric._id]: false}
		}
		img.src = fabric.thumb
	}

	#getFilteredFabrics = (): Fabric[] => {
		const fabrics = (this.availableFabrics[store.selectingPiece || 'default'] || []).filter(
			fabric => typeof fabric.thumb === 'string' && fabric.thumb.trim().length > 0,
		)

		for (const fabric of fabrics) this.#validateFabricThumb(fabric)

		const visibleFabrics = fabrics.filter(fabric => this.fabricThumbValidity[fabric._id] === true)
		if (this.selectedCategoryTab === 'All') return visibleFabrics

		return visibleFabrics.filter(fabric => fabric.category === this.selectedCategoryTab)
	}

	#onCategoryTabChange = (e: CustomEvent) => {
		this.selectedCategoryTab = e.detail.value
	}

	override template = () => html`
		<show-when
			condition=${() => this.#getPiecesFabrics(this.pieceSelections).length > 1}
			content=${() => html`
				<div class="fabric-selection">
					<for-each
						items=${() => this.#getPiecesFabrics(this.pieceSelections)}
						content=${() => (pieceFabric: Fabric & {assignedMesh: string}) => html`
							<button
								class="piece-select-button"
								onclick=${() => this.#onPieceSelect(pieceFabric.assignedMesh)}
								data-piece=${() => pieceFabric.assignedMesh}
								classList=${() => ({active: pieceFabric.assignedMesh === store.selectingPiece})}
							>
								<img src=${() => pieceFabric.thumb} alt=${() => pieceFabric.materialName} />
							</button>
						`}
					></for-each>
				</div>
			`}
		></show-when>

		<for-each
			items=${() => this.pieceSelections}
			content=${() => (piece: string) => html`
				<show-when
					condition=${() => piece === store.selectingPiece}
					content=${() => html`
						<tabs-provider default-value="All" ontabchange=${this.#onCategoryTabChange}>
							<show-when
								condition=${() => this.#getFabricCategories().length > 1}
								content=${() => html`
									<div class="category-tabs-container">
										<tabs-list>
											<for-each
												items=${() => this.#getFabricCategories()}
												content=${() => (category: FabricCategory | 'All') => html`
													<tabs-trigger selected-value=${() => category}>${() => category}</tabs-trigger>
												`}
											></for-each>
										</tabs-list>
									</div>
								`}
							></show-when>

							<div class="items-grid">
								<for-each
									items=${() => this.#getFilteredFabrics()}
									content=${() => (fabric: Fabric) => html`
										<div class="item-card-container">
											<item-card
												item-active=${() => this.#isFabricActive(fabric, piece)}
												item-src=${() => fabric.thumb}
												item-alt=${() => fabric.materialName}
												item-value=${() => fabric}
												oncardselected=${(e: CustomEvent) => this.#onFabricSelect(e, piece)}
											></item-card>
											<show-when
												condition=${() => store.isFabricLoading(fabric._id)}
												content=${() => html` <loading-spinner-overlay></loading-spinner-overlay> `}
											></show-when>
										</div>
									`}
								></for-each>
							</div>
						</tabs-provider>
					`}
				>
				</show-when>
			`}
		></for-each>
	`
	override css = css /*css*/ `
		:host {
			display: contents;
			display: flex;
			flex-direction: column;
			gap: var(--uiGap);
		}

		.fabric-selection {
			display: flex;
			flex-direction: row;
			gap: var(--uiSpacingTiny);
		}

		.piece-select-button {
			cursor: pointer;
			border-radius: 999px;
			overflow: hidden;
			width: 25px;
			height: 25px;
			user-select: none;
			border: none;
			background: transparent;
			padding: 0;

			&:hover {
				transform: scale(1.02);
			}

			img {
				width: 100%;
				height: 100%;
				object-fit: cover;
				object-position: center;
			}
		}

		.piece-select-button.active {
			border: 2px solid var(--uiColorAccentViolet);
		}

		.category-tabs-container {
			margin-bottom: var(--uiSpacingSmall);
		}

		.items-grid {
			display: grid;
			grid-template-columns: repeat(3, 1fr);
			gap: var(--uiGap);
		}

		.item-card-container {
			position: relative;
		}

		:host([is-remix]) .items-grid {
			/* override default 4.5-column grid */
			grid-template-columns: none;
			grid-auto-flow: column;
			grid-auto-columns: calc((100% - (var(--uiGap) * 4)) / 4.5);
			gap: 8px;
			padding-top: 6px;
			padding-bottom: 6px;
			overflow-x: auto;
			overflow-y: hidden;
			scroll-snap-type: x proximity;
			-webkit-overflow-scrolling: touch;
		}
		:host([is-remix]) .items-grid::-webkit-scrollbar {
			display: none;
		}
		:host([is-remix]) .items-grid > * {
			scroll-snap-align: start;
		}

		:host([is-remix]) item-card {
			--item-preview-border: 0;
			--item-preview-shadow: none;
			--item-preview-hover-border-color: transparent;
			--item-preview-active-border-color: transparent;
			--item-preview-active-shadow:
				0 0 0 3px #ffffff,
				0 0 0 5px var(--uiColorAccentViolet),
				0 0 14px rgba(165, 115, 255, 0.5);
		}

		@media (min-width: 768px) {
			.items-grid {
				grid-template-columns: repeat(4, 1fr);
			}
		}
	`
}

declare global {
	interface HTMLElementTagNameMap {
		'fabric-selection': FabricSelection
	}
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			'fabric-selection': ElementAttributes<FabricSelection, FabricSelectionAttributes>
		}
	}
}
