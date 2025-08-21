import {css, Element, element, eventAttribute, html, type ElementAttributes} from 'lume'
import {store} from './store.js'
import '../elements/back-button.js'
import '../elements/home-button.js'
import '../elements/theme-switch-button.js'
import '../elements/logo-button.js'
import {appStyles} from '../elements/app-style.js'
import './share-button.js'
import './buy-button.js'
import '../elements/show-on-device.js'
import '../elements/person-button.js'
import './app-buttons.js'

type OrderViewAttributes = 'onclick'

@element
export class OrderView extends Element {
	static readonly elementName = 'order-view'

	@eventAttribute onclick = null

	#onCustomSizeClick() {
		store.navigateTo = 'custom-measurement'
	}

	#onBackButtonClick = () => {
		store.navigateTo = 'preview'
	}

	#onHomeButtonClick = () => {
		const url = window.location.pathname
		window.history.replaceState({}, '', url)
		store.resetState()
		store.navigateTo = 'avatar'
	}

	#onBuyItClick = () => {
		store.navigateTo = 'success'
	}

	#onShareClick = () => {
		// copy current url to clipboard
		console.log('Share my drip clicked')
		navigator.clipboard.writeText(window.location.href)
		alert('Link copied to clipboard')
	}

	template = () => html`
	<app-buttons-left>
		<app-buttons-group group-direction="row">
			<back-button onclick=${this.#onBackButtonClick}></back-button>
			<home-button onclick=${this.#onHomeButtonClick}></home-button>
		</app-buttons-group>
	</app-buttons-left>

		<show-on-device device="desktop">
		<app-buttons-right layout="bottom">
			<app-buttons-group custom-style="gap: 34px;" group-direction="row">
				<share-button onclick=${this.#onShareClick}></share-button>
				<buy-button onclick=${this.#onBackButtonClick}></buy-button>
			</app-buttons-group>
		</app-buttons-right>

	</show-on-device>

	<app-buttons-right>
		<app-buttons-group>
			<!-- <theme-switch-button></theme-switch-button> -->
			<logo-button brand-name="Speed"></logo-button>
		</app-buttons-group>
	</app-buttons-right>

	<bottom-sheet float-direction="right" max-height="calc(100vh - 20rem)">
			<div class="order-container">
				<div class="product-info">
					<div class="product-image">
						<img src="../images/background.jpg" alt="Product" />
					</div>
					<div class="product-details">
						<h2 class="product-name">Product name</h2>
						<p class="product-price">Custom price</p>
					</div>
					<div
						class="quantity-controls"
						onclick="
							const updateQty = (change) => {
								const qty = this.querySelector('.quantity');
								const val = parseInt(qty.textContent) + change;
								if (val >= 1 && val <= 99) qty.textContent = val;
							};
							if (event.target.textContent === '+') updateQty(1);
							if (event.target.textContent === '−') updateQty(-1);
						"
					>
						<button class="quantity-btn">+</button>
						<span class="quantity">1</span>
						<button class="quantity-btn">−</button>
					</div>
				</div>

				<!-- Size Selection -->
				<div class="size-section">
					<h3 class="section-title">Size</h3>
					<div
						class="size-options"
						onclick="
							if (event.target.classList.contains('size-btn')) {
								this.querySelector('.selected')?.classList.remove('selected');
								event.target.classList.add('selected');
							}
						"
					>
						<button class="size-btn selected">34 (XS)</button>
						<button class="size-btn">36 (S)</button>
						<button class="size-btn">38 (M)</button>
						<button class="size-btn">40/42 (L)</button>
						<button class="size-btn">44 (XL)</button>
						<button class="size-btn">48 (2XL)</button>
						<button class="size-btn">50 (3XL)</button>
						<button class="size-btn">52 (4XL)</button>
						<button class="size-btn custom" onclick=${this.#onCustomSizeClick}>Custom size</button>
					</div>
				</div>

				<!-- Shipping Address -->
				<div class="shipping-section">
					<h3 class="section-title">Shipping address</h3>
					<div class="form-fields">
						<div class="field-group">
							<input type="text" class="form-input" placeholder=" " value="Tan" />
							<label class="floating-label">First name</label>
						</div>
						<div class="field-group">
							<input type="text" class="form-input" placeholder=" " />
							<label class="floating-label">Last name</label>
						</div>
						<div class="field-group">
							<input type="text" class="form-input" placeholder=" " />
							<label class="floating-label">Address</label>
						</div>
						<div class="field-group">
							<input type="text" class="form-input" placeholder=" " />
							<label class="floating-label">Apartment, suite, etc. (optional)</label>
						</div>
						<div class="field-group">
							<input type="text" class="form-input" placeholder=" " />
							<label class="floating-label">City</label>
						</div>
						<div class="field-group">
							<input type="text" class="form-input" placeholder=" " />
							<label class="floating-label">Postal code (optional)</label>
						</div>
						<div class="field-group">
							<input type="text" class="form-input" placeholder=" " />
							<label class="floating-label">Phone</label>
						</div>
					</div>
				</div>

				<!-- Order Button -->
				<button class="order-button" onclick=${this.#onBuyItClick}>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
						<path
							d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
						Send my order to LOGO
					</button>
				</div>
			</div>
		</bottom-sheet>
	`

	css = css/*css*/ `
		${appStyles}

		.order-container {
			padding: 20px;
			padding-top: 0;
		}

		.product-info {
			display: flex;
			align-items: center;
			gap: 15px;
			margin-bottom: 30px;
		}

		.product-image {
			width: 60px;
			height: 60px;
			border-radius: 10px;
			overflow: hidden;
		}

		.product-image img {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}

		.product-details {
			flex: 1;
		}

		.product-name {
			font-size: 14px;
			font-weight: 600;
			color: #000;
			margin: 0 0 5px 0;

			:host-context([data-theme='dark']) & {
				color: #fff;
			}
		}

		.product-price {
			font-size: 10px;
			font-weight: 400;
			color: #666;
			margin: 0;

			:host-context([data-theme='dark']) & {
				color: #ccc;
			}
		}

		.quantity-controls {
			display: flex;
			align-items: center;
			justify-content: space-between;
			width: 80px;
			height: 30px;
			background: #f5f5f5;
			border-radius: 1000px;
			padding: 0 12px;

			:host-context([data-theme='dark']) & {
				background: #2a2a2a;
			}
		}

		.quantity-btn {
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 14px;
			font-weight: 500;
			transition: all 0.2s;
			user-select: none;
			color: #000;

			:host-context([data-theme='dark']) & {
				color: #fff;
			}
		}

		.quantity-btn:hover {
			opacity: 0.7;
		}

		.quantity-btn:active {
			transform: scale(0.95);
		}

		.quantity {
			font-size: 14px;
			font-weight: 600;
			text-align: center;
			user-select: none;
			flex: 1;
			color: #000;

			:host-context([data-theme='dark']) & {
				color: #fff;
			}
		}

		.size-section {
			margin-bottom: 30px;
		}

		.size-options {
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
			font-size: 10px;
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
			background: linear-gradient(136deg, #e56be8 1.67%, #495cff 100.68%);
			background-clip: text;
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			border: 1px solid;
			border-radius: 20px;
		}

		.size-btn.custom:hover {
			opacity: 0.9;
			transform: translateY(-1px);
		}

		.size-btn.custom.selected {
			/* No special styling when selected for now */
		}

		.shipping-section {
			margin-bottom: 30px;
		}

		/* Dark mode for order button */
		.order-button {
			:host-context([data-theme='dark']) & {
				background: #fff;
				color: #000;
			}
		}

		.quantity-btn {
			width: var(--icon-button-size);
			height: var(--icon-button-size);
			border: 1px solid var(--color-border);
			background: var(--color-background);
			border-radius: 50%;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 18px;
		}

		.size-btn.selected {
			background: #000;
			color: white;
			border-color: #000;
		}

		.size-btn.custom {
			color: #8b5cf6;
			border-color: #8b5cf6;
		}

		.shipping-section {
			margin-bottom: 30px;
		}
	`
}

declare global {
	interface HTMLElementTagNameMap {
		'order-view': OrderView
	}
}

declare module 'lume' {
	interface IntrinsicElements {
		'order-view': ElementAttributes<OrderView, OrderViewAttributes>
	}
}
