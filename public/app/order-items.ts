import {css, Element, element, For, html, signal} from 'lume'
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
export class OrderItems extends Element {
	static elementName = 'order-items'

	@signal selectedOrderItems: Map<TemplateCategory, boolean> = new Map()

	// Load existing selections when component connects
	connectedCallback() {
		super.connectedCallback()

		// Initialize all selected templates as checked
		this.createEffect(() => {
			const newSelectedItems = new Map<TemplateCategory, boolean>()
			for (const [category] of store.selectedTemplates.entries()) {
				newSelectedItems.set(category, true)
			}
			this.selectedOrderItems = newSelectedItems
		})
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
		const newSelectedItems = new Map(this.selectedOrderItems)
		const currentlySelected = newSelectedItems.get(category) || false

		// Check if this would leave no items selected
		const selectedCount = Array.from(newSelectedItems.values()).filter(Boolean).length
		if (currentlySelected && selectedCount <= 1) {
			// Don't allow unchecking if it's the last selected item
			return
		}

		newSelectedItems.set(category, !currentlySelected)
		this.selectedOrderItems = newSelectedItems
	}

	#onShareClick = () => {
		// copy current url to clipboard
		console.log('Share my drip clicked')
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
			<div class="items-section">

				<!-- Items List -->
				<div class="items-list">
					<${For} each=${() => Array.from(store.selectedTemplates.entries())}>
					${([category, template]: [TemplateCategory, Template]) => html`
						<div class="item-row">
							<div class="item-checkbox">
								<input
									type="checkbox"
									id="item-${category}"
									checked=${() => this.selectedOrderItems.get(category) || false}
									onchange=${() => this.#onItemToggle(category)}
								/>
								<label for="item-${category}"></label>
							</div>
							<div class="item-content">
								<div class="item-image">
									<img src=${template.thumb} alt=${template.name} />
								</div>
								<div class="item-details">
									<div class="item-name">Product Name</div>
									<div class="item-price-container">
										<div class="item-price" classList=${() => ({wholesale: store.selectedSpace?.isWholesale})}>
											€ 125.00
										</div>
										<div class="item-moq" classList=${() => ({wholesale: store.selectedSpace?.isWholesale})}>
											MOQ: 5pcs
										</div>
									</div>
								</div>
							</div>
						</div>
					`}
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
		'order-items': OrderItems
	}
}
