import {css, Element, element, html, signal} from 'lume'
import {createSignal, Index} from 'solid-js'
import {blocks} from '../consts/blocks.js'
import {fabrics} from '../consts/fabrics.js'
import '../elements/PreviewMeasurementPage.js'
import '../elements/PreviewPage.js'
import '../elements/SpacesPage.js'
import '../elements/SuccessPage.js'
import '../elements/back-button.js'
import '../elements/bottom-sheet.js'
import '../elements/cube-button.js'
import '../elements/login-ui.js'
import '../elements/person-button.js'
import '../elements/redo-button.js'
import '../elements/refresh-button.js'
import {sharedUIStyles} from '../elements/shared-ui-styles.js'
import '../elements/show-when.js'
import '../elements/tabs.js'
import '../elements/theme-switch.js'
import '../elements/undo-button.js'
import '../routes.js' // track page visits
import './drippy-scene.js'
import {store} from './store.js'

// Background image for the drippy scene
const sceneBackground = new URL('../images/background-2.jpeg', import.meta.url)
const avatarThumb = new URL('../images/avatar-female-tmp.png', import.meta.url)

// Simple signal for view switching
const [view, setView] = createSignal('blocks')

// Make it global for testing in browser console
;(window as any).setView = setView

// Hide the loading cover
const loadingCover = document.getElementById('loadingCover')
loadingCover?.classList.add('invisible')
loadingCover?.addEventListener('transitionend', () => loadingCover.remove())

@element
export class DrippyApp extends Element {
	static elementName = 'drippy-app'

	@signal selectedTab = 'blocks'
	@signal selectedBlockCategory = 'Bodice'
	@signal selectedFabricCategory = 'Cotton'

	private defaultCollection = 'speed'

	@signal blocksCategories: string[] = []

	connectedCallback() {
		super.connectedCallback()
		// Parse through blocks and get a set of all categories
		this.blocksCategories = [...new Set(blocks[this.defaultCollection].map(block => block.category))]
	}

	template = () => html`
		<!-- show-when conditionals -->
		<show-when
			condition=${() => view() === 'preview-measurement'}
			content=${() => html`<preview-measurement-page></preview-measurement-page>`}
		></show-when>
		<show-when condition=${() => view() === 'preview'} content=${() => html`<preview-page></preview-page>`}></show-when>

		<show-when condition=${() => view() === 'space'} content=${() => html`<spaces-page></spaces-page>`}></show-when>

		<show-when condition=${() => view() === 'success'} content=${() => html`<success-page></success-page>`}></show-when>
		<show-when
			condition=${() => view() === 'avatar'}
			content=${() =>
				html`<drippy-scene></drippy-scene>

					<section id="panel">
						<div class="genders">
							<button class="female selected">Women</button>
							<button class="male">Men</button>
						</div>

						<div class="grid">
							<div class="block"><img src=${avatarThumb} alt="Female avatar" /></div>
							<div class="block"><img src=${avatarThumb} alt="Female avatar" /></div>
							<div class="block"><img src=${avatarThumb} alt="Female avatar" /></div>
							<div class="block"><img src=${avatarThumb} alt="Female avatar" /></div>
							<div class="block"><img src=${avatarThumb} alt="Female avatar" /></div>
							<div class="block"><img src=${avatarThumb} alt="Female avatar" /></div>
						</div>
					</section>`}
		></show-when>

		<show-when
			condition=${() => view() === 'blocks'}
			content=${() => html`
				<div id="app-container">
				<div class="app-buttons">
					<div class="app-buttons-group">
						<undo-button disabled></undo-button>
						<redo-button disabled></redo-button>
						<refresh-button disabled></refresh-button>
					</div>
					<div class="app-buttons-group">
						<person-button></person-button>
						<cube-button></cube-button>
					</div>
				</div>

				<drippy-scene
					id="drippy-scene"
					style=${`background: url(${sceneBackground.href}) center bottom / cover no-repeat`}
				></drippy-scene>
				<bottom-sheet>
				<tabs-provider
					default-value=${() => this.selectedTab}
					ontabchange=${(e: CustomEvent) => {
						console.log('onchange', e)
						this.selectedTab = e.detail.value
					}}
				>
					<div class="tabs-container">
						<tabs-list>
							<tabs-trigger selected-value="blocks">Blocks</tabs-trigger>
							<tabs-trigger selected-value="fabrics">Fabrics</tabs-trigger>
							<tabs-trigger selected-value="accessories">Accessories</tabs-trigger>
						</tabs-list>
					</div>
					<div class="divider"></div>
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
								${(block: () => (typeof blocks)[typeof this.defaultCollection][number], index: number) => html`
									<div
										data-index=${index}
										class="item-card"
										classList=${() => ({
											active: store.selectedBlocks.get(block().category)?._id === block()._id,
										})}
										onclick=${() => {
											store.setSelectedBlocks = block()
										}}
									>
										<div class="item-preview">
											<img class="item-thumb" src=${() => block().thumb} alt=${() => block().blockName} />
										</div>
									</div>
								`}
								</>
						</tabs-content>
					</div>
					<tabs-content selected-value="fabrics">
					<div class="category-tabs">
					<button class="category-tab" classList=${() => ({active: this.selectedFabricCategory === 'Cotton'})} onclick=${() => (this.selectedFabricCategory = 'Cotton')}>Cotton</button>
					<button class="category-tab" classList=${() => ({active: this.selectedFabricCategory === 'Leather'})} onclick=${() => (this.selectedFabricCategory = 'Leather')}>Leather</button>
					<button class="category-tab" classList=${() => ({active: this.selectedFabricCategory === 'Denim'})} onclick=${() => (this.selectedFabricCategory = 'Denim')}>Denim</button>
					<button class="category-tab" classList=${() => ({active: this.selectedFabricCategory === 'Spantex'})} onclick=${() => (this.selectedFabricCategory = 'Spantex')}>Spantex</button>
				</div>
						<div class="items-grid">
							<${Index} each=${() => fabrics[this.defaultCollection].filter(fabric => fabric.category === this.selectedFabricCategory)}>
							${(fabric: () => (typeof fabrics)[typeof this.defaultCollection][number], index: number) => html`
								<div
									data-index=${index}
									class="item-card"
									classList=${() => ({
										active: store.selectedFabric?._id === fabric()._id,
									})}
									onclick=${() => {
										store.setSelectedFabrics = fabric()
									}}
								>
									<div class="item-preview">
										<img class="item-thumb" src=${() => fabric().thumb} alt=${() => fabric().materialName} />
									</div>
								</div>
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
			</div>
			`}
		></show-when>
	`

	css = css`
		${sharedUIStyles}

		* {
			box-sizing: border-box;
		}

		:host {
			width: 600px;
			height: 400px;
		}

		drippy-scene {
			width: 100%;
			height: 100%;

			background: #ccc;
			:host-context([data-theme='dark']) & {
				background: #333;
			}
		}

		#app-container {
			position: relative;
			width: 100%;
			height: 100%;
			overflow: hidden;
		}

		.app-buttons {
			position: absolute;
			z-index: 1;
			top: 135px;
			right: 1.5rem;
			display: flex;
			flex-direction: column;
			gap: 25px;
		}

		.app-buttons-group {
			display: flex;
			flex-direction: column;
			gap: 5px;
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

		.divider {
			border-top: 1px solid #e0e1e4;
		}

		.tabs-container {
			padding: 20px;
			padding-top: 0;
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

		#drippy-scene {
			transition: transform 0.2s ease-in-out;
		}

		@media (max-width: 768px) {
			#drippy-scene {
				transform: translateY(-120px);
			}
		}
	`
}
