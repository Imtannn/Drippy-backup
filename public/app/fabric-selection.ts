import {attribute, booleanAttribute, css, Element, element, html, type ElementAttributes} from 'lume'
import '../elements/logic/show-when.js'
import type {BlockCategory} from '../types/block.js'
import type {Fabric} from '../types/fabric.js'
import type {TemplateCategory} from '../types/template.js'
import './loading-spinner-overlay.js'
import {store} from './store.js'

type FabricSelectionAttributes = 'pieceSelections' | 'availableFabrics' | 'selectedTemplateCategory' | 'isRemix'

@element
export class FabricSelection extends Element {
	static readonly elementName = 'fabric-selection'

	@attribute pieceSelections: string[] = []
	@attribute availableFabrics: Record<string, Fabric[]> = {}
	@attribute selectedTemplateCategory: TemplateCategory | null = null
	@booleanAttribute isRemix = false

	connectedCallback() {
		super.connectedCallback()

		this.createEffect(() => {
			void this.selectedTemplateCategory
			if (!store.selectingPiece && this.pieceSelections.length > 0) {
				store.setSelectingPiece = this.pieceSelections[0]
			}
		})
	}

	disconnectedCallback() {
		super.disconnectedCallback()
		store.setSelectingPiece = null
	}

	#getSelectedFabrics = (): Record<string, Fabric>[] => {
		if (!this.selectedTemplateCategory) return []

		const templateSelection = store.getTemplateSelection(this.selectedTemplateCategory)
		if (!templateSelection) return []

		return Object.values(templateSelection)
			.map(selection => selection?.fabrics ?? {})
			.filter(fabrics => Object.keys(fabrics).length > 0)
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

		// Get ALL actually selected block categories for this template (not just the editable ones)
		const templateSelection = store.getTemplateSelection(this.selectedTemplateCategory)
		if (!templateSelection) return

		const actualBlockCategories = Object.entries(templateSelection)
			.filter(([, selection]) => selection?.block)
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

		return Object.values(templateSelection).some(selection => selection?.fabrics?.[piece]?._id === fabric._id)
	}

	template = () => html`

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

		<for-each items=${() => this.pieceSelections} content=${() => (piece: string) => html`
			<show-when
				condition=${() => piece === store.selectingPiece}
				content=${() => html`
					<div class="items-grid">
						<for-each
							items=${() => this.availableFabrics[store.selectingPiece || 'default']}
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
				`}
			>
			</show-when>
		`}></for-each>
	</div>
	`

	css = css/*css*/ `
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
			overflow-x: auto;
			overflow-y: hidden;
			scroll-snap-type: x proximity;
			-webkit-overflow-scrolling: touch;
			padding-bottom: var(--uiSpacingSmall);
			padding-top: var(--uiSpacingSmall);
		}
		:host([is-remix]) .items-grid::-webkit-scrollbar {
			display: none;
		}
		:host([is-remix]) .items-grid > * {
			scroll-snap-align: start;
		}

		@media (min-width: 768px) {
			.items-grid {
				grid-template-columns: repeat(4, 1fr);
			}
		}
	`
}

export interface HTMLElementTagNameMap {
	'fabric-selection': FabricSelection
}

export interface IntrinsicElements {
	'fabric-selection': ElementAttributes<FabricSelection, FabricSelectionAttributes>
}
