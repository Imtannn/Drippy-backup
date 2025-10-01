import {css, Element, element, html} from 'lume'
import '../elements/back-button.js'
import '../elements/bottom-sheet.js'
import '../elements/home-button.js'
import '../elements/logo-button.js'
import '../elements/show-on-device.js'
import '../elements/theme-switch-button.js'
import {appStyles} from '../styles/app-styles.js'
import type {Template, TemplateCategory} from '../types/template.js'
import './app-buttons.js'
import './buy-button.js'
import './share-button.js'
import {store} from './store.js'

@element
export class OrderSize extends Element {
	static elementName = 'order-size'

	#onBackButtonClick = () => {
		store.view = 'order-items'
	}

	#onHomeButtonClick = () => {
		const currentAvatar = store.selectedAvatar || 'moidien'
		history.pushState(null, '', `/?avatar=${currentAvatar}`)
		store.resetState()
	}

	#onNextClick = () => {
		store.view = 'order'
	}

	#onShareClick = () => {
		// copy current url to clipboard
		console.log('Share my drip clicked')
		navigator.clipboard.writeText(window.location.href)
		alert('Link copied to clipboard')
	}

	#onBuyItClick = () => {
		store.view = 'order'
	}

	#onSizeButtonClick = (size: string, category?: TemplateCategory) => {
		if (size === 'Custom') {
			if (store.selectedSpace?.isWholesale) {
				// Wholesale: use existing global custom measurement
				store.view = 'custom-measurement'
			} else {
				// Retail: set current category and navigate to custom measurement
				if (category) {
					store.currentCustomMeasurementCategory = category
				}
				store.view = 'custom-measurement'
			}
		} else {
			if (store.selectedSpace?.isWholesale) {
				// Wholesale: use existing logic
				store.setOrderSelectedSize(size)
			} else {
				// Retail: set size for specific category
				if (category) {
					store.setRetailItemSize(category, size)
				} else {
					// Fallback to global if no category provided
					store.setOrderSelectedSize(size)
				}
			}
		}
	}

	// For retail mode: increase item quantity (not per size)
	#onIncreaseItemQuantity = (category: TemplateCategory) => {
		const currentQty = store.getRetailItemQuantity(category)
		store.setRetailItemQuantity(category, currentQty + 1)
	}

	// For retail mode: decrease item quantity (not per size)
	#onDecreaseItemQuantity = (category: TemplateCategory) => {
		const currentQty = store.getRetailItemQuantity(category)
		if (currentQty > 0) {
			store.setRetailItemQuantity(category, currentQty - 1)
		}
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

		<bottom-sheet float-direction="right" max-height="calc(100vh - 20rem)" default-snap="0.88">
			<div class="order-container">
				<!-- Scrollable content area -->
				<div class="scrollable-content">
					<div class="order-content">
						<!-- Selected Items List -->
						<div class="selected-items">
							<for-each
								items=${() =>
									Array.from(store.selectedTemplates.entries()).filter(([category]) =>
										store.selectedOrderItems.get(category),
									)}
								content=${() =>
									([category, template]: [TemplateCategory, Template]) => html`
										<div class="item-section">
											<!-- Item Header -->
											<div class="item-header">
												<div class="item-image">
													<img
														src=${() => {
															const cached = store.screenshotCache.get(category)
															return cached || template.thumb
														}}
														alt=${template.name}
													/>
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
												<!-- Conditional quantity controls based on wholesale/retail -->
												<show-when
													condition=${store.selectedSpace?.isWholesale}
													content=${() => html`
														<div class="quantity-controls">
															<span class="quantity">${() => store.getItemTotalQuantity(category)}</span>
														</div>
													`}
													fallback=${() => html`
														<div class="quantity-controls">
															<button class="quantity-btn" onclick=${() => this.#onIncreaseItemQuantity(category)}>
																+
															</button>
															<span class="quantity">${() => store.getRetailItemQuantity(category)}</span>
															<button class="quantity-btn" onclick=${() => this.#onDecreaseItemQuantity(category)}>
																−
															</button>
														</div>
													`}
												></show-when>
											</div>

											<!-- Conditional Size Options based on wholesale/retail -->
											<show-when
												condition=${store.selectedSpace?.isWholesale}
												content=${() => html`
													<!-- Wholesale: Size-specific quantity controls -->
													<div class="size-section">
														<h4>Size</h4>
														<div class="size-options">
															<div class="size-row">
																<span class="size-label">S (52)</span>
																<span class="size-price">$125</span>
																<div class="quantity-controls">
																	<button
																		class="quantity-btn"
																		onclick=${() => {
																			const newQty = store.getSizeQuantity(category, 'S') + 1
																			store.setSizeQuantity(category, 'S', newQty)
																		}}
																	>
																		+
																	</button>
																	<span class="quantity">${() => store.getSizeQuantity(category, 'S')}</span>
																	<button
																		class="quantity-btn"
																		onclick=${() => {
																			const newQty = store.getSizeQuantity(category, 'S') - 1
																			if (newQty >= 0) store.setSizeQuantity(category, 'S', newQty)
																		}}
																	>
																		−
																	</button>
																</div>
															</div>
															<div class="size-row">
																<span class="size-label">M (54)</span>
																<span class="size-price">$125</span>
																<div class="quantity-controls">
																	<button
																		class="quantity-btn"
																		onclick=${() => {
																			const newQty = store.getSizeQuantity(category, 'M') + 1
																			store.setSizeQuantity(category, 'M', newQty)
																		}}
																	>
																		+
																	</button>
																	<span class="quantity">${() => store.getSizeQuantity(category, 'M')}</span>
																	<button
																		class="quantity-btn"
																		onclick=${() => {
																			const newQty = store.getSizeQuantity(category, 'M') - 1
																			if (newQty >= 0) store.setSizeQuantity(category, 'M', newQty)
																		}}
																	>
																		−
																	</button>
																</div>
															</div>
															<div class="size-row">
																<span class="size-label">L (56)</span>
																<span class="size-price">$125</span>
																<div class="quantity-controls">
																	<button
																		class="quantity-btn"
																		onclick=${() => {
																			const newQty = store.getSizeQuantity(category, 'L') + 1
																			store.setSizeQuantity(category, 'L', newQty)
																		}}
																	>
																		+
																	</button>
																	<span class="quantity">${() => store.getSizeQuantity(category, 'L')}</span>
																	<button
																		class="quantity-btn"
																		onclick=${() => {
																			const newQty = store.getSizeQuantity(category, 'L') - 1
																			if (newQty >= 0) store.setSizeQuantity(category, 'L', newQty)
																		}}
																	>
																		−
																	</button>
																</div>
															</div>
														</div>
													</div>
												`}
												fallback=${() => html`
													<!-- Retail: Size selection buttons -->
													<div class="size-section">
														<h3 class="section-title">Size</h3>
														<div class="retail-size-options">
															<button
																class="size-btn"
																classList=${() => ({
																	selected: store.getRetailItemSize(category) === '34 (XS)' && !store.customMeasurement,
																})}
																onclick=${() => this.#onSizeButtonClick('34 (XS)', category)}
															>
																34 (XS)
															</button>
															<button
																class="size-btn"
																classList=${() => ({
																	selected: store.getRetailItemSize(category) === '36 (S)' && !store.customMeasurement,
																})}
																onclick=${() => this.#onSizeButtonClick('36 (S)', category)}
															>
																36 (S)
															</button>
															<button
																class="size-btn"
																classList=${() => ({
																	selected: store.getRetailItemSize(category) === '38 (M)' && !store.customMeasurement,
																})}
																onclick=${() => this.#onSizeButtonClick('38 (M)', category)}
															>
																38 (M)
															</button>
															<button
																class="size-btn"
																classList=${() => ({
																	selected:
																		store.getRetailItemSize(category) === '40/42 (L)' && !store.customMeasurement,
																})}
																onclick=${() => this.#onSizeButtonClick('40/42 (L)', category)}
															>
																40/42 (L)
															</button>
															<button
																class="size-btn"
																classList=${() => ({
																	selected: store.getRetailItemSize(category) === '44 (XL)' && !store.customMeasurement,
																})}
																onclick=${() => this.#onSizeButtonClick('44 (XL)', category)}
															>
																44 (XL)
															</button>
															<button
																class="size-btn"
																classList=${() => ({
																	selected:
																		store.getRetailItemSize(category) === '48 (2XL)' && !store.customMeasurement,
																})}
																onclick=${() => this.#onSizeButtonClick('48 (2XL)', category)}
															>
																48 (2XL)
															</button>
															<button
																class="size-btn"
																classList=${() => ({
																	selected:
																		store.getRetailItemSize(category) === '50 (3XL)' && !store.customMeasurement,
																})}
																onclick=${() => this.#onSizeButtonClick('50 (3XL)', category)}
															>
																50 (3XL)
															</button>
															<button
																class="size-btn"
																classList=${() => ({
																	selected:
																		store.getRetailItemSize(category) === '52 (4XL)' && !store.customMeasurement,
																})}
																onclick=${() => this.#onSizeButtonClick('52 (4XL)', category)}
															>
																52 (4XL)
															</button>
															<button
																class="size-btn custom"
																classList=${() => ({
																	selected:
																		store.getRetailItemSize(category) === 'Custom' ||
																		store.hasRetailItemCustomMeasurement(category),
																})}
																onclick=${() => this.#onSizeButtonClick('Custom', category)}
															>
																Custom size
															</button>
														</div>
													</div>
												`}
											></show-when>
										</div>
									`}
							></for-each>
						</div>
					</div>
				</div>

				<!-- Sticky button at bottom -->
				<div class="sticky-button-container">
					<!-- Total Order -->
					<div class="order-summary">
						<div class="total-section">
							<span class="total-label">Total order</span>
							<span class="total-amount">
								$${() =>
									store.selectedSpace?.isWholesale ? store.getOrderTotalCost() : store.getRetailOrderTotalCost()}
							</span>
						</div>
					</div>

					<button class="order-button" onclick=${this.#onNextClick}>Continue to order</button>
				</div>
			</div>
		</bottom-sheet>
	`

	css = css/*css*/ `
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

		.sticky-button-container {
			position: sticky;
			bottom: 0;
			background: transparent;
			margin-top: auto;
		}

		.total-section {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: var(--uiSpacingMedium);
		}

		.selected-items {
			padding-top: var(--uiSpacing);
		}

		.item-section {
			margin-bottom: var(--uiSpacingMedium);
			border-bottom: var(--borderWidth) solid var(--uiColorBorderColor);

			&:last-child {
				border-bottom: none;
				margin-bottom: var(--uiSpacingLarge);
			}
		}

		.item-header {
			display: flex;
			align-items: flex-start;
			gap: var(--uiSpacingSmall);
			margin-bottom: var(--uiSpacing);
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
			font-size: var(--fontSizeTextSm);
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

		.size-section {
			margin-bottom: var(--uiSpacingMedium);

			h4 {
				font-size: var(--fontSizeTextSm);
				font-weight: var(--fontWeightSemiBold);
				font-family: var(--fontFamily);
				color: var(--uiColorPrimaryBlack);
				margin: 0 0 var(--uiSpacingSmall) 0;
			}
		}

		.size-options {
			display: flex;
			flex-direction: column;
		}

		.size-row {
			display: flex;
			align-items: center;
			gap: var(--uiSpacingSmall);
			padding: var(--uiSpacingTiny) 0;
		}

		.size-label {
			font-size: var(--fontSizeTextSm);
			font-weight: var(--fontWeightMedium);
			font-family: var(--fontFamily);
			color: var(--uiColorPrimaryBlack);
			min-width: 60px;
		}

		.size-price {
			font-size: var(--fontSizeTextSm);
			font-family: var(--fontFamily);
			color: var(--uiColorSecondaryLightGrey);
			margin-left: auto;
			margin-right: var(--uiSpacingSmall);
		}

		.total-label {
			font-size: var(--fontSizeTextSm);
			font-weight: var(--fontWeightSemiBold);
			font-family: var(--fontFamily);
			color: var(--uiColorPrimaryBlack);
		}

		.total-amount {
			font-size: var(--fontSizeTextSm);
			font-weight: var(--fontWeightSemiBold);
			font-family: var(--fontFamily);
			color: var(--uiColorPrimaryBlack);
		}

		.order-button.disabled {
			color: var(--uiColorSecondaryLightGrey);
			cursor: not-allowed;
			pointer-events: none;
		}

		.quantity-controls {
			display: flex;
			align-items: center;
			justify-content: space-between;
			width: 80px;
			height: var(--uiSpacingLarge);
			background: var(--uiColorPrimaryLightGrey);
			border-radius: var(--borderRadiusPill);
			padding: 0 var(--uiSpacingSmall);

			:host-context([data-theme='dark']) & {
				background: var(--uiColorSecondaryDarkGrey);
			}
		}

		.quantity-btn {
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: var(--fontSizeTextSm);
			font-weight: var(--fontWeightMedium);
			transition: var(--transitionSlow);
			user-select: none;
			color: var(--uiColorPrimaryBlack);
			border: none;
			background: none;
			padding: 0;
			margin: 0;

			:host-context([data-theme='dark']) & {
				color: var(--uiColorPrimaryWhite);
			}

			&:hover {
				opacity: 0.7;
			}

			&:active {
				transform: scale(0.95);
			}
		}

		.quantity {
			font-size: var(--fontSizeTextSm);
			font-weight: var(--fontWeightSemiBold);
			text-align: center;
			user-select: none;
			flex: 1;
			color: var(--uiColorPrimaryBlack);

			:host-context([data-theme='dark']) & {
				color: var(--uiColorPrimaryWhite);
			}
		}

		/* Retail mode size button styles */
		.section-title {
			font-size: var(--fontSizeTextMd);
			font-weight: var(--fontWeightSemiBold);
			font-family: var(--fontFamily);
			color: var(--uiColorPrimaryBlack);
			margin: 0 0 var(--uiSpacing) 0;

			:host-context([data-theme='dark']) & {
				color: var(--uiColorPrimaryWhite);
			}
		}

		.size-section {
			margin-bottom: 30px;
		}

		/* Retail mode specific styling */
		.retail-size-options {
			display: flex;
			flex-wrap: wrap;
			gap: 10px;
		}

		.size-btn {
			padding: 8px 16px;
			border: 1px solid #ddd;
			background: #f5f5f5;
			border-radius: 20px;
			cursor: pointer;
			font-size: 12px;
			font-weight: 400;
			transition: all 0.2s;
			color: #000;

			:host-context([data-theme='dark']) & {
				background: #2a2a2a;
				border-color: #444;
				color: #fff;
			}
		}

		.size-btn:hover:not(.selected) {
			background: #f5f5f5;
			border-color: #bbb;

			:host-context([data-theme='dark']) & {
				background: #3a3a3a;
				border-color: #555;
			}
		}

		.size-btn.selected {
			background: #000;
			color: white;
			border-color: #000;

			:host-context([data-theme='dark']) & {
				background: #fff;
				color: #000;
				border-color: #fff;
			}
		}

		.size-btn.custom {
			position: relative;
			border: 1px solid #ddd;
			background: linear-gradient(136deg, #e56be8 1.67%, #495cff 100.68%);
			background-clip: text;
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
		}

		.size-btn.custom::before {
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background: linear-gradient(136deg, #e56be8 1.67%, #495cff 100.68%);
			border-radius: 20px;
			z-index: -1;
		}

		.size-btn.custom::after {
			content: '';
			position: absolute;
			top: 1px;
			left: 1px;
			right: 1px;
			bottom: 1px;
			background: white;
			border-radius: 19px;
			z-index: -1;
		}

		.size-btn.custom:active {
			opacity: 0.8;
			transition: opacity 0.1s ease;
		}

		.size-btn.custom:hover {
			opacity: 0.9;
			transform: translateY(-1px);
		}

		.size-btn.custom.selected {
			background: linear-gradient(136deg, #e56be8 1.67%, #495cff 100.68%);
			color: white;
			border-color: transparent;
			-webkit-text-fill-color: white;
			background-clip: unset;
		}
	`
}

declare global {
	interface HTMLElementTagNameMap {
		'order-size': OrderSize
	}
}
