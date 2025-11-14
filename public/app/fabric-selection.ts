import {attribute, css, Element, element, html, signal, type ElementAttributes} from 'lume'
import type {BlockCategory} from '../types/block.js'
import type {Fabric} from '../types/fabric.js'
import type {TemplateCategory} from '../types/template.js'
import {store} from './store.js'

type FabricSelectionAttributes = 'pieceSelections' | 'availableFabrics' | 'selectedTemplateCategory'

@element
export class FabricSelection extends Element {
	static readonly elementName = 'fabric-selection'

	@attribute pieceSelections: string[] = []
	@attribute availableFabrics: Record<string, Fabric[]> = {}
	@attribute selectedTemplateCategory: TemplateCategory | null = null

	@signal _selectingPiece: string | undefined = undefined

	connectedCallback() {
		super.connectedCallback()

		this.createEffect(() => {
			void this.selectedTemplateCategory
			if (!this._selectingPiece && this.pieceSelections.length > 0) {
				this._selectingPiece = this.pieceSelections[0]
			}
		})
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
		this._selectingPiece = piece
	}

	#isFabricActive = (fabric: Fabric, piece: string) => {
		if (!this.selectedTemplateCategory) return false
		const templateSelection = store.getTemplateSelection(this.selectedTemplateCategory)

		if (!templateSelection) return false

		return Object.values(templateSelection).some(
			selection => selection?.fabrics?.[piece]?._id === fabric._id,
		)
	}

	template = () => html`
		<div class="fabric-selection">
			<for-each
				items=${() => this.#getPiecesFabrics(this.pieceSelections)}
				content=${() => (pieceFabric: Fabric & {assignedMesh: string}) => html`
					<button
						class="piece-select-button"
						onclick=${() => this.#onPieceSelect(pieceFabric.assignedMesh)}
						data-piece=${() => pieceFabric.assignedMesh}
						classList=${() => ({active: pieceFabric.assignedMesh === this._selectingPiece})}
					>
						<img src=${() => pieceFabric.thumb} alt=${() => pieceFabric.materialName} />
					</button>
				`}
			></for-each>
		</div>
		<for-each items=${() => this.pieceSelections} content=${() => (piece: string) => html`
			<show-when
				condition=${() => piece === this._selectingPiece}
				content=${() => html`
					<div class="items-grid">
						<for-each
							items=${() => this.availableFabrics[this._selectingPiece || 'default']}
							content=${() => (fabric: Fabric) => html`
								<item-card
									item-active=${() => this.#isFabricActive(fabric, piece)}
									item-src=${() => fabric.thumb}
									item-alt=${() => fabric.materialName}
									item-value=${() => fabric}
									oncardselected=${(e: CustomEvent) => this.#onFabricSelect(e, piece)}
								></item-card>
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
			margin-top: 10px;
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
