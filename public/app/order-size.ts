import {css, Element, element, html, Show} from 'lume'
import '../elements/back-button.js'
import '../elements/bottom-sheet.js'
import '../elements/home-button.js'
import '../elements/logo-button.js'
import '../elements/show-on-device.js'
import '../elements/theme-switch-button.js'
import {appStyles} from '../styles/app-styles.js'
import {orderStyles} from '../styles/order-styles.js'
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

	#onSizeChange = (e: Event) => {
		const target = e.target as HTMLSelectElement
		if (target.value === 'Custom') {
			store.navigateTo = 'custom-measurement'
		} else {
			// Clear custom measurement when selecting a regular size
			store.customMeasurement = null
			store.setSelectedSize = target.value
		}
	}

	#onQuantityChange = (e: Event) => {
		const target = e.target as HTMLInputElement
		store.setQuantity = parseInt(target.value) || 1
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
			<div class="size-section">

				<!-- Size Selection -->
				<div class="size-fields">
					<div class="field-group">
						<select 
							class="form-select"
							value=${() => store.order.selectedSize}
							onchange=${this.#onSizeChange}
						>
							<option value="34 (XS)">34 (XS)</option>
							<option value="36 (S)">36 (S)</option>
							<option value="38 (M)">38 (M)</option>
							<option value="40 (L)">40 (L)</option>
							<option value="42 (XL)">42 (XL)</option>
							<option value="Custom">Custom</option>
						</select>
						<label class="form-label">Size</label>
					</div>

					<${Show} when=${() => store.selectedSpace?.isWholesale}>
						<div class="field-group">
							<input 
								type="number" 
								class="form-input"
								min="1"
								value=${() => store.order.quantity}
								oninput=${this.#onQuantityChange}
							/>
							<label class="form-label">Quantity</label>
						</div>
					</>
				</div>
			</div>

			<!-- Spacer to push button to bottom -->
			<div class="button-spacer"></div>

			<button class="order-button" onclick=${this.#onNextClick}>Continue to order</button>
		</div>
	</bottom-sheet>
	`

	css = css/*css*/ `
		${appStyles}
		${orderStyles}
	`
}

declare global {
	interface HTMLElementTagNameMap {
		'order-size': OrderSize
	}
}
