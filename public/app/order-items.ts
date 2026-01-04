import {css, Element, element, html} from 'lume'
import '../elements/bottom-sheet.js'
import '../elements/logic/for-each.js'
import '../elements/theme-switch-button.js'
import {appStyles} from '../styles/app-styles.js'
import type {Template, TemplateCategory} from '../types/template.js'
import {captureGarmentScreenshot} from '../utils.js'
import './app-buttons-preset.js'
import {store} from './store.js'

@element
export class OrderItems extends Element {
	static override elementName = 'order-items'

	// Load existing selections when component connects
	override connectedCallback() {
		super.connectedCallback()

		// Initialize all selected templates as checked
		store.initializeOrderItems()

		// Pre-generate screenshots for all selected templates
		this.generateScreenshots()
	}

	private async generateScreenshots() {
		for (const [category] of Object.entries(store.selectedTemplates)) {
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

	#onNextClick = () => {
		const queryParams = new URLSearchParams(window.location.search)
		console.log('URL Query Parameters:', Object.fromEntries(queryParams))

		store.view = 'order-size'
	}

	#onItemToggle = (category: TemplateCategory) => {
		store.toggleOrderItem(category)
	}

	#onItemRowClick = async (template: Template, e: MouseEvent) => {
		// Prevent click if clicking on checkbox
		if ((e.target as HTMLElement).closest('.checkbox-icon')) {
			return
		}
		if (template.productUrl) {
			try {
				const proxyUrl = `/api/proxy?url=${encodeURIComponent(template.productUrl)}`
				const response = await fetch(proxyUrl, {
					method: 'GET',
					// Only fetch headers, don't wait for full body
					// Abort after getting headers
				})

				// If fetch fails or returns error status (403, 404, 500, etc.), open in new tab
				if (!response.ok || response.status >= 400) {
					console.log(`URL blocked (status ${response.status}), opening in new tab:`, template.productUrl)
					window.open(template.productUrl, '_blank')
					return
				}

				// URL is accessible, show in iframe
				store.iframePopupUrl = template.productUrl
				store.view = 'iframe-popup'
			} catch (error) {
				console.log('Error checking URL, opening in new tab:', error)
				window.open(template.productUrl, '_blank')
			}
		}
	}

	override template = () => html`
		<app-buttons-preset preset="order-flow"></app-buttons-preset>

		<bottom-sheet float-direction="right" max-height="calc(100vh - 20rem)">
			<div class="order-container">
				<p class="order-title">Shop these items IRL</p>
				<p class="order-description">Redeem a digital twin in your wardrobe automatically.</p>
				<!-- Scrollable content area -->
				<div class="scrollable-content">
					<!-- Items List -->
					<div class="items-list">
						<for-each
							items=${() => Object.entries(store.selectedTemplates)}
							content=${() =>
								([category, template]: [TemplateCategory, Template]) => html`
									<div class="item-row" onclick=${(e: MouseEvent) => this.#onItemRowClick(template, e)}>
										<div
											class="checkbox-icon"
											classList=${() => ({checked: store.selectedOrderItems.get(category) || false})}
											onclick=${(e: MouseEvent) => {
												e.stopPropagation()
												this.#onItemToggle(category)
											}}
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

												if (store.isScreenshotsLoading) {
													return html`<div class="screenshot-loader">
														<div class="spinner"></div>
													</div>`
												}

												return html`<img src=${cached || template.thumb} alt=${template.name} />`
											}}
										</div>
										<div class="item-details">
											<div class="item-name">${template.name}</div>
											<div class="item-price-row">
												<span class="item-price">US ${template.price}</span>
												<span class="item-moq" classList=${() => ({visible: store.selectedSpace?.isWholesale})}
													>MOQ: 5 pcs</span
												>
											</div>
										</div>
										<div class="arrow-right-icon">
											<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
												<path
													d="M6 12L10 8L6 4"
													stroke="#8c8c8c"
													stroke-width="1.5"
													stroke-linecap="round"
													stroke-linejoin="round"
												/>
											</svg>
										</div>
									</div>
								`}
						></for-each>
					</div>
				</div>
			</div>
			<!-- Sticky button at bottom -->
			<div class="sticky-button-container">
				<button class="save-button" onclick=${this.#onNextClick}>Save my design</button>
			</div>
		</bottom-sheet>
	`
	override css = css/*css*/ `
		${appStyles}

		.order-container {
			display: flex;
			flex-direction: column;
			height: 100%;
		}

		.scrollable-content {
			flex: 1;
			overflow-y: auto;
			padding-bottom: var(--uiSpacing);
		}
		.order-title {
			font-size: var(--fontSizeTextSm);
			font-weight: var(--fontWeightSemiBold);
			font-family: var(--fontFamily);
			color: var(--uiColorPrimaryBlack);
			text-align: center;
			margin-bottom: var(--uiSpacingTiny);
			padding: 0;
		}
		.order-description {
			font-size: var(--fontSizeTextXxs);
			font-weight: var(--fontWeightNormal);
			font-family: var(--fontFamily);
			color: #8c8c8c;
			text-align: center;
			margin: 0;
			padding: 0;
		}

		.items-list {
			display: flex;
			flex-direction: column;
			gap: var(--uiSpacingMedium);
			padding-top: var(--uiSpacing);
		}

		.sticky-button-container {
			position: sticky;
			bottom: 2%;
			max-width: 160px;
			margin: auto auto 0 auto;
			background: transparent;
		}

		.item-row {
			display: flex;
			align-items: center;
			gap: var(--uiSpacingMedium);
			cursor: pointer;
			transition: opacity 0.2s ease;

			&:hover {
				opacity: 0.8;
			}
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

		.arrow-right-icon {
			display: flex;
			align-items: center;
			justify-content: center;
			flex-shrink: 0;

			svg {
				width: 16px;
				height: 16px;
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
		@media (min-width: 768px) {
			.order-title {
				font-size: var(--fontSizeTextMd);
			}
			.order-description {
				font-size: var(--fontSizeTextXs);
			}
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
