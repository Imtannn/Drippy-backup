import {attribute, css, Element, element, html, signal, type ElementAttributes} from 'lume'
import type {Fabric} from '../types/fabric.js'
import type {TemplateCategory} from '../types/template.js'
import {store} from './store.js'

type FabricSelectionAttributes = 'pieceSelections' | 'availableFabrics' | 'selectedTemplateCategory'

@element
export class FabricSelection extends Element {
	static readonly elementName = 'fabric-selection'

	@attribute pieceSelections: string[] = []
	@attribute availableFabrics: Fabric[] = []
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

	#getSelectedFabrics = () => {
		// Get all selected fabrics for this template category
		const selectedFabricsBlocksMap = store.selectedFabrics.get(this.selectedTemplateCategory!)
		// Get all selected blocks keys for this template category
		const selectedBlocks = Array.from(selectedFabricsBlocksMap?.keys() || [])

		// Get a flat set of fabrics that are assigned to selected blocks
		const selectedFabrics = selectedBlocks.map(blockCategory => selectedFabricsBlocksMap?.get(blockCategory))

		return selectedFabrics
	}

	#getPieceFabric = (piece: string) => {
		const selectedFabrics = this.#getSelectedFabrics()

		const fabric = selectedFabrics.find(fabric => fabric?.get(piece))?.get(piece)
		return fabric
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
		const templateBlocks = store.selectedBlocks.get(this.selectedTemplateCategory)
		if (!templateBlocks) return

		const actualBlockCategories = Array.from(templateBlocks.keys())
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
		const selectedBlocks = store.selectedFabrics.get(this.selectedTemplateCategory!)

		if (!selectedBlocks) return false

		const blockCategories = Array.from(selectedBlocks.keys())
		return blockCategories.some(blockCategory => selectedBlocks.get(blockCategory)?.get(piece)?._id === fabric._id)
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
							items=${() => this.availableFabrics}
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
	`
}

export interface HTMLElementTagNameMap {
	'fabric-selection': FabricSelection
}

export interface IntrinsicElements {
	'fabric-selection': ElementAttributes<FabricSelection, FabricSelectionAttributes>
}
