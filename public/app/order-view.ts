import {css, Element, element, eventAttribute, html, type ElementAttributes} from 'lume'
import {Meteor} from 'meteor/meteor'
import type {OrderData} from '../../server/imports/order-service.js'
import {appStyles} from '../elements/app-style.js'
import '../elements/back-button.js'
import '../elements/home-button.js'
import '../elements/logo-button.js'
import '../elements/person-button.js'
import '../elements/show-on-device.js'
import '../elements/theme-switch-button.js'
import './app-buttons.js'
import './buy-button.js'
import './share-button.js'
import {store} from './store.js'

type OrderViewAttributes = 'onclick'

@element
export class OrderView extends Element {
	static readonly elementName = 'order-view'

	@eventAttribute onclick = null

	#onSizeButtonClick = (size: string) => {
		if (size === 'Custom') {
			store.navigateTo = 'custom-measurement'
		} else {
			// Clear custom measurement when selecting a regular size
			store.customMeasurement = null
			store.setSelectedSize = size
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

	// Helper function to collect all order data
	#collectOrderData = (): OrderData => {
		// Use store values for shipping address
		const shippingAddress = {
			firstName: store.order.shippingAddress.firstName || '',
			lastName: store.order.shippingAddress.lastName || '',
			address: store.order.shippingAddress.address || '',
			apartment: store.order.shippingAddress.apartment || '',
			city: store.order.shippingAddress.city || '',
			postalCode: store.order.shippingAddress.postalCode || '',
			phone: store.order.shippingAddress.phone || '',
		}

		// Map selected blocks (garments) to minimal payload for email
		const garments = Array.from(store.selectedBlocks.values()).map(g => ({_id: g._id, blockName: g.blockName}))

		const orderData: OrderData = {
			// Customer information
			email: store.order.email || '',
			customerEmail:
				store.order.customerEmail || 'thidieuanhle@gmail.com' || shippingAddress.firstName + '@example.com', // Placeholder
			firstName: shippingAddress.firstName,
			lastName: shippingAddress.lastName,
			phone: shippingAddress.phone,

			// Product information
			productName: store.order.productName,
			selectedSize: store.order.selectedSize,
			isCustomSize: store.order.selectedSize === 'Custom',
			customMeasurement: store.customMeasurement || undefined,
			quantity: store.order.quantity,

			// Shipping information
			shippingAddress,
			// Garments from current model
			garments,
		}

		return orderData
	}

	#onBuyItClick = async () => {
		try {
			// Set loading state
			store.setOrderStatus = 'submitting'
			store.setOrderError = null

			// Collect all order data
			const orderData = this.#collectOrderData()

			// Validate required fields
			if (!orderData.firstName || !orderData.lastName) {
				throw new Error('Please fill in your name')
			}

			if (!orderData.email) {
				throw new Error('Please fill in your email address')
			}

			if (!orderData.shippingAddress.address || !orderData.shippingAddress.city) {
				throw new Error('Please fill in your shipping address')
			}

			if (!orderData.productName) {
				throw new Error('Product name is required')
			}

			console.log('📦 Submitting order:', orderData)

			// Call Meteor method to submit order
			const result = await Meteor.callAsync('order.submit', orderData)

			if (result.success) {
				console.log('Order submitted successfully:', result.orderId)
				store.setOrderStatus = 'success'
				store.navigateTo = 'success'
			} else {
				console.error('Server returned error:', result)
				throw new Error(result.error || 'Failed to submit order')
			}
		} catch (error) {
			console.error('Error submitting order:', error)
			store.setOrderStatus = 'error'
			store.setOrderError = error instanceof Error ? error.message : 'Failed to submit order'
		}
	}

	#onFirstNameInput = (e?: Event) => {
		if (e?.target) {
			const target = e.target as HTMLInputElement
			store.order.shippingAddress.firstName = target.value
		}
	}

	#onLastNameInput = (e?: Event) => {
		if (e?.target) {
			const target = e.target as HTMLInputElement
			store.order.shippingAddress.lastName = target.value
		}
	}

	#onEmailInput = (e?: Event) => {
		if (e?.target) {
			const target = e.target as HTMLInputElement
			store.order.email = target.value
		}
	}

	#onAddressInput = (e?: Event) => {
		if (e?.target) {
			const target = e.target as HTMLInputElement
			store.order.shippingAddress.address = target.value
		}
	}

	#onApartmentInput = (e?: Event) => {
		if (e?.target) {
			const target = e.target as HTMLInputElement
			store.order.shippingAddress.apartment = target.value
		}
	}

	#onCityInput = (e?: Event) => {
		if (e?.target) {
			const target = e.target as HTMLInputElement
			store.order.shippingAddress.city = target.value
		}
	}

	#onPostalCodeInput = (e?: Event) => {
		if (e?.target) {
			const target = e.target as HTMLInputElement
			store.order.shippingAddress.postalCode = target.value
		}
	}

	#onPhoneInput = (e?: Event) => {
		if (e?.target) {
			const target = e.target as HTMLInputElement
			store.order.shippingAddress.phone = target.value
		}
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
						<h2 class="product-name">${() => store.order.productName}</h2>
						<p class="product-price">Custom price</p>
					</div>
					<div class="quantity-controls">
						<button class="quantity-btn" onclick=${() => {
							const newQty = store.order.quantity + 1
							if (newQty <= 99) store.setQuantity = newQty
						}}>+</button>
						<span class="quantity">${() => store.order.quantity}</span>
						<button class="quantity-btn" onclick=${() => {
							const newQty = store.order.quantity - 1
							if (newQty >= 1) store.setQuantity = newQty
						}}>−</button>
					</div>
				</div>

				<!-- Size Selection -->
				<div class="size-section">
					<h3 class="section-title">Size</h3>
					<div class="size-options">
						<button 
							class="size-btn" 
							classList=${() => ({selected: store.order.selectedSize === '34 (XS)' && !store.customMeasurement})}
							onclick=${() => this.#onSizeButtonClick('34 (XS)')}
						>
							34 (XS)
						</button>
						<button 
							class="size-btn" 
							classList=${() => ({selected: store.order.selectedSize === '36 (S)' && !store.customMeasurement})}
							onclick=${() => this.#onSizeButtonClick('36 (S)')}
						>
							36 (S)
						</button>
						<button 
							class="size-btn" 
							classList=${() => ({selected: store.order.selectedSize === '38 (M)' && !store.customMeasurement})}
							onclick=${() => this.#onSizeButtonClick('38 (M)')}
						>
							38 (M)
						</button>
						<button 
							class="size-btn" 
							classList=${() => ({selected: store.order.selectedSize === '40/42 (L)' && !store.customMeasurement})}
							onclick=${() => this.#onSizeButtonClick('40/42 (L)')}
						>
							40/42 (L)
						</button>
						<button 
							class="size-btn" 
							classList=${() => ({selected: store.order.selectedSize === '44 (XL)' && !store.customMeasurement})}
							onclick=${() => this.#onSizeButtonClick('44 (XL)')}
						>
							44 (XL)
						</button>
						<button 
							class="size-btn" 
							classList=${() => ({selected: store.order.selectedSize === '48 (2XL)' && !store.customMeasurement})}
							onclick=${() => this.#onSizeButtonClick('48 (2XL)')}
						>
							48 (2XL)
						</button>
						<button 
							class="size-btn" 
							classList=${() => ({selected: store.order.selectedSize === '50 (3XL)' && !store.customMeasurement})}
							onclick=${() => this.#onSizeButtonClick('50 (3XL)')}
						>
							50 (3XL)
						</button>
						<button 
							class="size-btn" 
							classList=${() => ({selected: store.order.selectedSize === '52 (4XL)' && !store.customMeasurement})}
							onclick=${() => this.#onSizeButtonClick('52 (4XL)')}
						>
							52 (4XL)
						</button>
						<button 
							class="size-btn custom" 
							classList=${() => ({selected: store.order.selectedSize === 'Custom' || !!store.customMeasurement})}
							onclick=${() => this.#onSizeButtonClick('Custom')}
						>
							Custom size
						</button>
					</div>
				</div>

				<!-- Shipping Address -->
				<div class="shipping-section">
					<h3 class="section-title">Shipping address</h3>
					<div class="form-fields">
						<div class="field-group">
							<input 
								type="text" 
								class="form-input" 
								placeholder=" " 
								value=${() => store.order.shippingAddress.firstName}
								oninput=${this.#onFirstNameInput}
							/>
							<label class="floating-label">First name</label>
						</div>
						<div class="field-group">
							<input 
								type="text" 
								class="form-input" 
								placeholder=" " 
								value=${() => store.order.shippingAddress.lastName}
								oninput=${this.#onLastNameInput}
							/>
							<label class="floating-label">Last name</label>
						</div>
						<div class="field-group">
							<input 
								type="email" 
								class="form-input" 
								placeholder=" " 
								value=${() => store.order.email || ''}
								oninput=${this.#onEmailInput}
							/>
							<label class="floating-label">Email</label>
						</div>
						<div class="field-group">
							<input 
								type="text" 
								class="form-input" 
								placeholder=" " 
								value=${() => store.order.shippingAddress.address}
								oninput=${this.#onAddressInput}
							/>
							<label class="floating-label">Address</label>
						</div>
						<div class="field-group">
							<input 
								type="text" 
								class="form-input" 
								placeholder=" " 
								value=${() => store.order.shippingAddress.apartment}
								oninput=${this.#onApartmentInput}
							/>
							<label class="floating-label">Apartment, suite, etc. (optional)</label>
						</div>
						<div class="field-group">
							<input 
								type="text" 
								class="form-input" 
								placeholder=" " 
								value=${() => store.order.shippingAddress.city}
								oninput=${this.#onCityInput}
							/>
							<label class="floating-label">City</label>
						</div>
						<div class="field-group">
							<input 
								type="text" 
								class="form-input" 
								placeholder=" " 
								value=${() => store.order.shippingAddress.postalCode}
								oninput=${this.#onPostalCodeInput}
							/>
							<label class="floating-label">Postal code (optional)</label>
						</div>
						<div class="field-group">
							<input 
								type="text" 
								class="form-input" 
								placeholder=" " 
								value=${() => store.order.shippingAddress.phone}
								oninput=${this.#onPhoneInput}
							/>
							<label class="floating-label">Phone</label>
						</div>
					</div>
				</div>

				<!-- Order Button -->
				<button 
					class="order-button" 
					onclick=${this.#onBuyItClick}
					disabled=${() => store.order.status === 'submitting'}
				>
					${() =>
						store.order.status === 'submitting'
							? html`<div class="loading-spinner"></div>
									Submitting order...`
							: html`<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
										<path
											d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
											stroke="currentColor"
											stroke-width="2"
											stroke-linecap="round"
											stroke-linejoin="round"
										/></svg
									>Send my order to LOGO`}
				</button>
				
				<!-- Error Display -->
				${() => (store.order.error ? html`<div class="error-message">${store.order.error}</div>` : '')}
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
			font-size: 12px;
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
			background: linear-gradient(136deg, #e56be8 1.67%, #495cff 100.68%);
			color: white;
			border-color: transparent;
			-webkit-text-fill-color: white;
			background-clip: unset;
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

		/* Loading spinner */
		.loading-spinner {
			width: 16px;
			height: 16px;
			border: 2px solid #ffffff40;
			border-top: 2px solid #ffffff;
			border-radius: 50%;
			animation: spin 1s linear infinite;
			margin-right: 8px;
		}

		@keyframes spin {
			0% {
				transform: rotate(0deg);
			}
			100% {
				transform: rotate(360deg);
			}
		}

		.order-button:disabled {
			opacity: 0.7;
			cursor: not-allowed;
		}

		.error-message {
			margin-top: 10px;
			padding: 10px;
			background: #fee2e2;
			color: #dc2626;
			border-radius: 8px;
			font-size: 14px;
			text-align: center;

			:host-context([data-theme='dark']) & {
				background: #7f1d1d;
				color: #fca5a5;
			}
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
