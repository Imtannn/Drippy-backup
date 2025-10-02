import {css, Element, element, eventAttribute, html, type ElementAttributes} from 'lume'
import {Meteor} from 'meteor/meteor'
import type {OrderData} from '../types/types.js'

import '../elements/back-button.js'
import '../elements/home-button.js'
import '../elements/logic/show-when.js'
import '../elements/logo-button.js'
import '../elements/person-button.js'
import '../elements/show-on-device.js'
import '../elements/theme-switch-button.js'
import {href} from '../routes.js'
import {appStyles} from '../styles/app-styles.js'
import './app-buttons.js'
import './buy-button.js'
import './share-button.js'
import {store} from './store.js'

type OrderViewAttributes = 'onclick'

@element
export class OrderView extends Element {
	static readonly elementName = 'order-view'

	@eventAttribute onclick = null

	#onBackButtonClick = () => {
		store.view = 'order-size'
	}

	#onHomeButtonClick = () => {
		// const currentAvatar = store.selectedAvatar || 'moidien'
		// history.pushState(null, '', `/?avatar=${currentAvatar}`)
		store.view = 'scene'
		store.resetState()
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

		const isWholesale = store.selectedSpace?.isWholesale || false
		const orderType: 'wholesale' | 'retail' = isWholesale ? 'wholesale' : 'retail'

		const orderItems = []
		const retailOrderItems = []

		for (const [category, template] of store.selectedTemplates.entries()) {
			// Only include items that are selected in the order
			if (store.selectedOrderItems.get(category)) {
				if (isWholesale) {
					// Wholesale order processing (existing logic)
					const sizes = []
					let totalQuantity = 0
					let totalPrice = 0

					// Get size quantities from the store
					const sizeMap = store.orderSizeQuantities.get(category)
					if (sizeMap) {
						for (const [size, quantity] of sizeMap.entries()) {
							if (quantity > 0) {
								const price = 125 * quantity // $125 per item
								sizes.push({
									size,
									quantity,
									price,
								})
								totalQuantity += quantity
								totalPrice += price
							}
						}
					}

					if (totalQuantity > 0) {
						orderItems.push({
							templateCategory: category,
							templateName: template.name || `${category} Item`,
							templateId: template._id || category,
							sizes,
							totalQuantity,
							totalPrice,
						})
					}
				} else {
					// Retail order processing (new logic)
					const quantity = store.getRetailItemQuantity(category)
					const selectedSize = store.getRetailItemSize(category)
					const customMeasurement = store.getRetailItemCustomMeasurement(category)
					const price = 125 // Base price per item
					const totalPrice = quantity * price

					if (quantity > 0) {
						retailOrderItems.push({
							templateCategory: category,
							templateName: template.name || `${category} Item`,
							templateId: template._id || category,
							selectedSize,
							quantity,
							price,
							totalPrice,
							customMeasurement: customMeasurement || undefined, // Include custom measurement if available
						})
					}
				}
			}
		}

		const designUrl = href()

		const orderData: OrderData = {
			// Customer information
			email: store.order.email || '',
			customerEmail:
				store.order.customerEmail || 'thidieuanhle@gmail.com' || shippingAddress.firstName + '@example.com', // Placeholder
			firstName: shippingAddress.firstName,
			lastName: shippingAddress.lastName,
			phone: shippingAddress.phone,

			// Order type
			orderType,

			// Order items (wholesale)
			orderItems,

			// Retail order items (retail only)
			retailOrderItems: retailOrderItems.length > 0 ? retailOrderItems : undefined,

			// Shipping information
			shippingAddress,

			designUrl,

			spaceDescription: store.selectedSpace?.description,
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

			// Validate order items based on order type
			if (orderData.orderType === 'wholesale') {
				if (!orderData.orderItems || orderData.orderItems.length === 0) {
					throw new Error('Please select at least one item to order')
				}
			} else if (orderData.orderType === 'retail') {
				if (!orderData.retailOrderItems || orderData.retailOrderItems.length === 0) {
					throw new Error('Please select at least one item to order')
				}
				// Validate that retail items have selected sizes
				for (const item of orderData.retailOrderItems) {
					if (!item.selectedSize) {
						throw new Error(`Please select a size for ${item.templateName}`)
					}
				}
			}

			console.log('📦 Submitting order:', orderData)

			// Call Meteor method to submit order
			const result = await Meteor.callAsync('order.submit', orderData)

			if (result.success) {
				console.log('Order submitted successfully:', result.orderId)
				store.setOrderStatus = 'success'
				store.view = 'success'
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
				<logo-button brand-name="MoiDien"></logo-button>
			</app-buttons-group>
		</app-buttons-right>

		<bottom-sheet float-direction="right" max-height="calc(100vh - 20rem)" default-snap="0.88">
			<div class="order-container">
				<!-- Scrollable content area -->
				<div class="scrollable-content">
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
				</div>

				<!-- Sticky button at bottom -->
				<div class="sticky-button-container">
					<!-- Order Button -->
					<button
						class="order-button order-button-moidien"
						onclick=${this.#onBuyItClick}
						disabled=${() => store.order.status === 'submitting'}
					>
						<show-when
							condition=${() => store.order.status === 'submitting'}
							content=${() => html`
								<div class="loading-spinner"></div>
								<span>Submitting order...</span>
							`}
							fallback=${() => html`
								<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
									<path
										d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
								</svg>
								<span>Send my order to ${store.selectedSpace?.description}</span>
							`}
						></show-when>
					</button>

					<!-- Error Display -->
					<show-when
						condition=${() => store.order.error}
						content=${() => html`<div class="error-message">${() => store.order.error}</div>`}
					></show-when>
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

		.order-button-moidien {
			background: var(--uiColorAccentViolet);
		}

		/* Form Styles */
		.form-fields {
			display: flex;
			flex-direction: column;
			gap: var(--uiSpacingMedium);
		}

		.field-group {
			position: relative;
		}

		.section-title {
			font-size: var(--fontSizeTextMd);
			font-weight: var(--fontWeightSemiBold);
			font-family: var(--fontFamily);
			color: var(--uiColorPrimaryBlack);
			margin: 0 0 var(--uiSpacingMedium) 0;
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
