import {css, Element, element, html} from 'lume'
import '../elements/back-button.js'
import '../elements/bottom-sheet.js'
import '../elements/home-button.js'
import '../elements/logic/for-each.js'
import '../elements/logo-button.js'
import '../elements/show-on-device.js'
import '../elements/theme-switch-button.js'
import {appStyles} from '../styles/app-styles.js'
import type {Template, TemplateCategory} from '../types/template.js'
import {captureGarmentScreenshot} from '../utils.js'
import './app-buttons.js'
import './buy-button.js'
import './share-button.js'
import {store} from './store.js'

@element
export class OrderItems extends Element {
	static elementName = 'order-items'

	// Load existing selections when component connects
	connectedCallback() {
		super.connectedCallback()

		// Initialize all selected templates as checked
		store.initializeOrderItems()

		// Pre-generate screenshots for all selected templates
		this.generateScreenshots()
	}

	private async generateScreenshots() {
		for (const [category] of store.selectedTemplates.entries()) {
			try {
				// Mark this category as loading
				store.addLoadingScreenshot(category)

				const screenshot = await captureGarmentScreenshot(category)

				// Update the store's screenshot cache
				store.screenshotCache.set(category, screenshot)

				// Remove loading state
				store.removeLoadingScreenshot(category)
			} catch (error) {
				console.warn(`Failed to generate screenshot for ${category}:`, error)
				// Remove loading state even if failed
				store.removeLoadingScreenshot(category)
			}
		}
	}

	#onBackButtonClick = () => {
		store.navigateTo = 'preview'
	}

	#onHomeButtonClick = () => {
		const url = window.location.pathname
		let search = window.location.search
		search = search.replace('isPreview=true', '')
		window.history.replaceState({}, '', `${url}${search}`)
		store.resetState()
		store.navigateTo = 'template'
	}

	#onNextClick = () => {
		store.navigateTo = 'order-size'
	}

	#onItemToggle = (category: TemplateCategory) => {
		store.toggleOrderItem(category)
	}

	#onShareClick = () => {
		// copy current url to clipboard
		navigator.clipboard.writeText(window.location.href)
		alert('Link copied to clipboard')
	}

	#onBuyItClick = () => {
		store.navigateTo = 'preview'
	}

	template = () => html`
		<app-buttons-left>
			<app-buttons-group group-direction="row">
				<back-button onclick=${this.#onBackButtonClick}></back-button>
				<home-button onclick=${this.#onHomeButtonClick}></home-button>
			</app-buttons-group>
		</app-buttons-left>

		<app-buttons-right>
			<app-buttons-group>
				<!-- <theme-switch-button></theme-switch-button> -->
				<logo-button brand-name="MoiDien"></logo-button>
			</app-buttons-group>
		</app-buttons-right>

		<show-on-device device="desktop">
			<app-buttons-right layout="bottom">
				<app-buttons-group custom-style="gap: 34px;" group-direction="row">
					<share-button onclick=${this.#onShareClick}></share-button>
					<buy-button onclick=${this.#onBuyItClick}></buy-button>
				</app-buttons-group>
			</app-buttons-right>
		</show-on-device>

		<bottom-sheet float-direction="right" max-height="calc(100vh - 20rem)">
			<div class="order-container">
				<!-- Items List -->
				<div class="items-list">
					<for-each
						items=${() => Array.from(store.selectedTemplates.entries())}
						content=${() =>
							([category, template]: [TemplateCategory, Template]) => html`
								<div class="item-row">
									<div
										class="checkbox-icon"
										classList=${() => ({checked: store.selectedOrderItems.get(category) || false})}
										onclick=${() => this.#onItemToggle(category)}
									>
										<svg width="15" height="16" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
											<rect y="0.569336" width="15" height="15" rx="7.5" fill="var(--uiColorAccentViolet)" />
											<path
												d="M11 5.56934L7.64637 9.63434C7.24639 10.1192 6.50361 10.1192 6.10363 9.63434L5 8.29661"
												stroke="white"
												stroke-width="1.2"
												stroke-linecap="round"
												stroke-linejoin="round"
											/>
										</svg>
									</div>
									<div class="item-image">
										${() => {
											const cached = store.screenshotCache.get(category)
											const isLoading = store.loadingScreenshots.has(category)

											console.log(
												`[OrderItems] Screenshot for ${category}:`,
												cached ? `${cached.length} chars` : 'NULL/UNDEFINED',
												'Loading:',
												isLoading,
											)

											if (isLoading) {
												return html`<div class="screenshot-loader">
													<div class="spinner"></div>
												</div>`
											}

											return html`<img src=${cached || template.thumb} alt=${template.name} />`
										}}
									</div>
									<div class="item-details">
										<div class="item-name">Product name</div>
										<div class="item-price-row">
											<span class="item-price">$125.00</span>
											<span class="item-moq" classList=${() => ({visible: store.selectedSpace?.isWholesale})}
												>MOQ: 5 pcs</span
											>
										</div>
									</div>
								</div>
							`}
					></for-each>
				</div>

				<!-- Spacer to push button to bottom -->
				<div class="button-spacer"></div>

				<button class="order-button" onclick=${this.#onNextClick}>Continue to order</button>
			</div>
		</bottom-sheet>
	`

	css = css/*css*/ `
		${appStyles}

		.items-list {
			display: flex;
			flex-direction: column;
			gap: var(--uiSpacingMedium);
			padding-top: var(--uiSpacing);
		}

		.item-row {
			display: flex;
			align-items: center;
			gap: var(--uiSpacingMedium);
		}

		.checkbox-icon {
			cursor: pointer;
			opacity: 0.1;
			transition: var(--transitionFast);

			&.checked {
				opacity: 1 !important;

				&:hover {
					opacity: 1;
				}
			}

			&:not(.checked) {
				opacity: 0.1 !important;

				&:hover {
					opacity: 0.3;
				}
			}
		}

		.item-image {
			width: 60px;
			height: 60px;
			border-radius: var(--borderRadiusSmall);
			overflow: hidden;
			background: var(--uiColorPrimaryLightGrey);

			img {
				width: 100%;
				height: 100%;
				object-fit: cover;
			}
		}

		.item-details {
			flex: 1;
		}

		.item-name {
			font-size: var(--fontSizeTextMd);
			font-weight: var(--fontWeightSemiBold);
			font-family: var(--fontFamily);
			color: var(--uiColorPrimaryBlack);
			margin-bottom: var(--uiSpacingTiny);
		}

		.item-price-row {
			display: flex;
			align-items: center;
			gap: var(--uiSpacingSmall);
		}

		.item-price {
			font-size: var(--fontSizeTextSm);
			font-family: var(--fontFamily);
			color: var(--uiColorSecondaryLightGrey);
		}

		.item-moq {
			font-size: var(--fontSizeTextSm);
			font-family: var(--fontFamily);
			color: var(--uiColorSecondaryLightGrey);
			opacity: 0;

			&.visible {
				opacity: 1;
			}
		}

		.button-spacer {
			flex: 1;
			min-height: 40px;
		}

		.item-image {
			width: 60px;
			height: 60px;
			border-radius: var(--borderRadiusSmall);
			overflow: hidden;
			background: var(--uiColorPrimaryLightGrey);

			img {
				width: 100%;
				height: 100%;
				object-fit: cover;
			}
		}

		.item-details {
			flex: 1;
		}

		.item-name {
			font-size: var(--fontSizeTextMd);
			font-weight: var(--fontWeightSemiBold);
			font-family: var(--fontFamily);
			color: var(--uiColorPrimaryBlack);
			margin-bottom: var(--uiSpacingTiny);
		}

		.item-price-row {
			display: flex;
			align-items: center;
			gap: var(--uiSpacingSmall);
		}

		.item-price {
			font-size: var(--fontSizeTextSm);
			font-family: var(--fontFamily);
			color: var(--uiColorSecondaryLightGrey);
		}

		.item-moq {
			font-size: var(--fontSizeTextSm);
			font-family: var(--fontFamily);
			color: var(--uiColorSecondaryLightGrey);
			opacity: 0;

			&.visible {
				opacity: 1;
			}
		}

		.screenshot-loader {
			width: 100%;
			height: 100%;
			display: flex;
			align-items: center;
			justify-content: center;
			background: var(--uiColorPrimaryLightGrey);
		}

		.spinner {
			width: 24px;
			height: 24px;
			border: 2px solid var(--uiColorSecondaryLightGrey);
			border-top: 2px solid var(--uiColorAccentViolet);
			border-radius: 50%;
			animation: spin 1s linear infinite;
		}

		@keyframes spin {
			0% {
				transform: rotate(0deg);
			}
			100% {
				transform: rotate(360deg);
			}
		}
	`
}

declare global {
	interface HTMLElementTagNameMap {
		'order-items': OrderItems
	}
}
