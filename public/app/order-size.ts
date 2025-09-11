import {css, Element, element, For, html} from 'lume'
import '../elements/back-button.js'
import '../elements/bottom-sheet.js'
import '../elements/home-button.js'
import '../elements/logo-button.js'
import '../elements/show-on-device.js'
import '../elements/theme-switch-button.js'
import {appStyles} from '../styles/app-styles.js'
import {orderStyles} from '../styles/order-styles.js'
import type {Template, TemplateCategory} from '../types/template.js'
import './app-buttons.js'
import './buy-button.js'
import './share-button.js'
import {store} from './store.js'

@element
export class OrderSize extends Element {
	static elementName = 'order-size'

	#onBackButtonClick = () => {
		store.navigateTo = 'order-items'
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
		store.navigateTo = 'order'
	}

	#onShareClick = () => {
		// copy current url to clipboard
		console.log('Share my drip clicked')
		navigator.clipboard.writeText(window.location.href)
		alert('Link copied to clipboard')
	}

	#onBuyItClick = () => {
		store.navigateTo = 'order'
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
			<!-- Selected Items List -->
			<div class="selected-items">
				<${For} each=${() => Array.from(store.selectedTemplates.entries()).filter(([category]) => store.selectedOrderItems.get(category))}>
				${([category, template]: [TemplateCategory, Template]) => html`
					<div class="item-section">
						<!-- Item Header -->
						<div class="item-header">
							<div class="item-image">
								<img src=${template.thumb} alt=${template.name} />
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
							<div class="quantity-controls">
								<span class="quantity">${() => store.getItemTotalQuantity(category)}</span>
							</div>
						</div>

						<!-- Size Options -->
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
					</div>
				`}
				</>
			</div>

			<!-- Total Order -->
			<div class="order-summary">
				<div class="total-section">
					<span class="total-label">Total order</span>
					<span class="total-amount">$${() => store.getOrderTotalCost()}</span>
				</div>
			</div>

			<button class="order-button" onclick=${this.#onNextClick}>Continue to order</button>
		</div>
	</bottom-sheet>
	`

	css = css/*css*/ `
		${appStyles}
		${orderStyles}

		.selected-items {
			padding-top: 20px;
		}

		.item-section {
			margin-bottom: 30px;
			border-bottom: 1px solid #f0f0f0;
			padding-bottom: 20px;
		}

		.item-section:last-child {
			border-bottom: none;
			margin-bottom: 20px;
		}

		.item-header {
			display: flex;
			align-items: flex-start;
			gap: 16px;
			margin-bottom: 20px;
		}

		.item-image {
			width: 60px;
			height: 60px;
			border-radius: 8px;
			overflow: hidden;
			background: #f5f5f5;
		}

		.item-image img {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}

		.item-details {
			flex: 1;
		}

		.item-name {
			font-size: 16px;
			font-weight: 600;
			color: #000;
			margin-bottom: 4px;
		}

		.item-price-row {
			display: flex;
			align-items: center;
			gap: 12px;
		}

		.item-price {
			font-size: 14px;
			color: #666;
		}

		.item-moq {
			font-size: 14px;
			color: #666;
			opacity: 0;
		}

		.item-moq.visible {
			opacity: 1;
		}

		.size-section h4 {
			font-size: 16px;
			font-weight: 600;
			color: #000;
			margin: 0 0 16px 0;
		}

		.size-options {
			display: flex;
			flex-direction: column;
			gap: 12px;
		}

		.size-row {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 12px 0;
		}

		.size-label {
			font-size: 14px;
			font-weight: 500;
			color: #000;
			min-width: 60px;
		}

		.size-price {
			font-size: 14px;
			color: #666;
			flex: 1;
			text-align: left;
			margin-left: 20px;
		}

		.order-summary {
			margin-top: 30px;
			padding-top: 20px;
			border-top: 1px solid #f0f0f0;
		}

		.total-section {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 20px;
		}

		.total-label {
			font-size: 16px;
			font-weight: 600;
			color: #000;
		}

		.total-amount {
			font-size: 16px;
			font-weight: 600;
			color: #000;
		}
	`
}

declare global {
	interface HTMLElementTagNameMap {
		'order-size': OrderSize
	}
}
