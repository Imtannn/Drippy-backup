import {css, element, Element, html, Index, signal, type ElementAttributes} from 'lume'
import {blocks} from '../consts/blocks.js'
import {fabrics} from '../consts/fabrics.js'
import '../elements/back-button.js'
import '../elements/bottom-sheet.js'
import '../elements/cube-button.js'
import '../elements/login-ui.js'
import '../elements/person-button.js'
import '../elements/redo-button.js'
import '../elements/refresh-button.js'
import '../elements/show-when.js'
import '../elements/tabs.js'
import '../elements/undo-button.js'
import {store} from './store.js'
import './item-card.js'
import '../elements/theme-switch-button.js'
import '../elements/back-button.js'
import '../elements/logo-button.js'
import './app-buttons.js'
import '../elements/preview-button.js'

type BlocksSelectionAttributes = keyof {}

@element
export class BlocksSelection extends Element {
	static readonly elementName = 'blocks-selection'

	@signal selectedTab = 'blocks'
	@signal selectedBlockCategory = 'Bodice'
	@signal selectedFabricCategory = 'Cotton'
	@signal blocksCategories: string[] = []

	private defaultCollection = 'speed'

	connectedCallback() {
		super.connectedCallback()
		// Parse through blocks and get a set of all categories
		this.blocksCategories = [...new Set(blocks[this.defaultCollection].map(block => block.category))]
	}

	#onBackButtonClick = () => {
		console.log('onBackButtonClick')
		const searchParams = new URLSearchParams(window.location.search)
		searchParams.delete('scene')
		window.history.replaceState({}, '', `?${searchParams.toString()}`)
		store.selectScene = null
		store.navigateTo = 'scene'
	}

	#onPreviewButtonClick = () => {
		console.log('onPreviewButtonClick')
		const searchParams = new URLSearchParams(window.location.search)
		searchParams.set('isPreview', 'true')
		store.setIsPreview = true
		window.history.replaceState({}, '', `?${searchParams.toString()}`)
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
			<refresh-button disabled></refresh-button>
		</app-buttons-group>
		<app-buttons-group>
			<person-button disabled></person-button>
			<cube-button disabled></cube-button>
		</app-buttons-group>
	</app-buttons-right>

	<app-buttons-right layout="bottom">
		<app-buttons-group>
			<preview-button onclick=${this.#onPreviewButtonClick}></preview-button>
		</app-buttons-group>
	</app-buttons-right>

	<bottom-sheet>
	<tabs-provider
		default-value=${() => this.selectedTab}
		ontabchange=${(e: CustomEvent) => {
			this.selectedTab = e.detail.value
		}}
	>
	<bottom-sheet-header>
		<div class="tabs-container">
			<tabs-list>
				<tabs-trigger selected-value="blocks">Blocks</tabs-trigger>
				<tabs-trigger selected-value="fabrics">Fabrics</tabs-trigger>
				<tabs-trigger selected-value="accessories">Accessories</tabs-trigger>
			</tabs-list>
		</div>
		</bottom-sheet-header>
		<div class="tabs-content-container">
			<tabs-content selected-value="blocks">
				<div class="category-tabs">
					<${Index} each=${() => this.blocksCategories}>
					${(category: () => string) => html`
						<button
							class="category-tab"
							classList=${() => ({active: this.selectedBlockCategory === category()})}
							onclick=${() => (this.selectedBlockCategory = category())}
						>
							${category()}
						</button>
					`}
					</>
				</div>
				<div class="items-grid">
					<${Index} each=${() => blocks[this.defaultCollection].filter(block => block.category === this.selectedBlockCategory)}>
					${(block: () => (typeof blocks)[typeof this.defaultCollection][number]) => html`
						<item-card
							item-active=${() => store.selectedBlocks.get(block().category)?._id === block()._id}
							item-src=${() => block().thumb}
							item-alt=${() => block().blockName}
							item-value=${() => block()}
							oncardselected=${(e: CustomEvent) => {
								store.setSelectedBlocks = e.detail.itemValue
							}}
						></item-card>
					`}
					</>
		</div>

			</tabs-content>
			<tabs-content selected-value="fabrics">
				<div class="category-tabs">
				<button class="category-tab" classList=${() => ({active: this.selectedFabricCategory === 'Cotton'})} onclick=${() => (this.selectedFabricCategory = 'Cotton')}>Cotton</button>
				<button class="category-tab" classList=${() => ({active: this.selectedFabricCategory === 'Leather'})} onclick=${() => (this.selectedFabricCategory = 'Leather')}>Leather</button>
				<button class="category-tab" classList=${() => ({active: this.selectedFabricCategory === 'Denim'})} onclick=${() => (this.selectedFabricCategory = 'Denim')}>Denim</button>
				<button class="category-tab" classList=${() => ({active: this.selectedFabricCategory === 'Spantex'})} onclick=${() => (this.selectedFabricCategory = 'Spantex')}>Spantex</button>
			</div>
			<div class="items-grid">
				<${Index} each=${() => fabrics[this.defaultCollection].filter(fabric => fabric.category === this.selectedFabricCategory)}>
				${(fabric: () => (typeof fabrics)[typeof this.defaultCollection][number]) => html`
					<item-card
						item-active=${() => store.selectedFabric?._id === fabric()._id}
						item-src=${() => fabric().thumb}
						item-alt=${() => fabric().materialName}
						item-value=${() => fabric()}
						oncardselected=${(e: CustomEvent) => {
							store.setSelectedFabrics = e.detail.itemValue
						}}
					></item-card>
				`}
				</>
			</div>
		</tabs-content>
		<tabs-content selected-value="accessories">
			<div class="items-grid">
				<div class="item-card">
					<div class="item-preview accessory"></div>
				</div>
				<div class="item-card">
					<div class="item-preview accessory"></div>
				</div>
			</div>
		</tabs-content>
	</tabs-provider>
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
			padding: 20px;
			padding-top: 0;
		}

		.bottom-sheet-header {
			position: sticky;
			top: 0;
			background: var(--appBackground);
			z-index: 10;
			border-bottom: 1px solid #e0e1e4;
		}

		.tabs-content-container {
			padding: 20px;
			padding-top: 0;
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
			gap: 15px;
			margin-bottom: 16px;
		}

		.category-tab {
			background: transparent;
			padding: 0;
			border: none;
			border-radius: 12px;
			font-size: 14px;
			color: #99999a;
			cursor: pointer;
			transition: all 0.2s ease;
		}

		.category-tab.active {
			color: #121316;
		}

		.items-grid {
			display: grid;
			grid-template-columns: repeat(3, 1fr);
			gap: 10px;
		}

		.item-card {
			aspect-ratio: 1;
			/* Two-layer background: inner fill on padding-box, gradient border on border-box */
			background:
				linear-gradient(#f8f8f8, #f8f8f8) padding-box,
				var(--item-card-border, linear-gradient(#0000, #0000)) border-box;
			border-radius: 12px;
			overflow: hidden;
			cursor: pointer;
			border: 1px solid transparent; /* needed so the border-box layer shows */
			transition:
				transform 0.2s ease,
				background 0.2s ease;
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
				font-size: 12px;
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
