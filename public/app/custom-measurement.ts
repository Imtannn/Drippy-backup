import {css, Element, element, html, signal} from 'lume'
import '../elements/back-button.js'
import '../elements/bottom-sheet.js'
import '../elements/home-button.js'
import '../elements/logo-button.js'
import '../elements/show-on-device.js'
import '../elements/theme-switch-button.js'
import {appStyles} from '../styles/app-styles.js'
import './app-buttons.js'
import './buy-button.js'
import './share-button.js'
import {store} from './store.js'

@element
export class CustomMeasurement extends Element {
	static elementName = 'custom-measurement'

	@signal bust = 0
	@signal waist = 0
	@signal hips = 0
	@signal shoulder = 0
	@signal shoulderToKnee = 0

	// Load existing measurements from store when component connects
	connectedCallback() {
		super.connectedCallback()

		// Check if we're in retail mode with a specific category
		if (!store.selectedSpace?.isWholesale && store.currentCustomMeasurementCategory) {
			const categoryMeasurement = store.getRetailItemCustomMeasurement(store.currentCustomMeasurementCategory)
			if (categoryMeasurement) {
				this.bust = categoryMeasurement.bust
				this.waist = categoryMeasurement.waist
				this.hips = categoryMeasurement.hips
				this.shoulder = categoryMeasurement.shoulder
				this.shoulderToKnee = categoryMeasurement.shoulderToKnee
			}
		} else if (store.customMeasurement) {
			// Wholesale mode: use global custom measurement
			this.bust = store.customMeasurement.bust
			this.waist = store.customMeasurement.waist
			this.hips = store.customMeasurement.hips
			this.shoulder = store.customMeasurement.shoulder
			this.shoulderToKnee = store.customMeasurement.shoulderToKnee
		}
	}

	#onBackButtonClick = () => {
		store.navigateTo = 'order-size'
	}

	#onHomeButtonClick = () => {
		store.resetState()
		window.location.href = '/app?avatar=moidien'
	}

	#onSaveClick = () => {
		const measurement = {
			bust: this.bust,
			waist: this.waist,
			hips: this.hips,
			shoulder: this.shoulder,
			shoulderToKnee: this.shoulderToKnee,
		}

		// Check if we're in retail mode with a specific category
		if (!store.selectedSpace?.isWholesale && store.currentCustomMeasurementCategory) {
			// Retail mode: save measurement for specific category
			store.setRetailItemCustomMeasurement(store.currentCustomMeasurementCategory, measurement)
			store.setRetailItemSize(store.currentCustomMeasurementCategory, 'Custom')
			// Clear the current category after saving
			store.currentCustomMeasurementCategory = null
		} else {
			// Wholesale mode: save global custom measurement
			store.setCustomMeasurement = measurement
			store.setSelectedSize = 'Custom'
		}

		store.navigateTo = 'order-size'
	}

	#valueWithoutCm = (value: string) => {
		return value.replace(' cm', '')
	}

	#onBustChange = (e: Event) => {
		const valueWithoutCm = this.#valueWithoutCm((e.target as HTMLInputElement).value)
		this.bust = Number(valueWithoutCm)
	}

	#onWaistChange = (e: Event) => {
		const valueWithoutCm = this.#valueWithoutCm((e.target as HTMLInputElement).value)
		this.waist = Number(valueWithoutCm)
	}

	#onHipsChange = (e: Event) => {
		const valueWithoutCm = this.#valueWithoutCm((e.target as HTMLInputElement).value)
		this.hips = Number(valueWithoutCm)
	}

	#onShoulderChange = (e: Event) => {
		const valueWithoutCm = this.#valueWithoutCm((e.target as HTMLInputElement).value)
		this.shoulder = Number(valueWithoutCm)
	}

	#onShoulderToKneeChange = (e: Event) => {
		const valueWithoutCm = this.#valueWithoutCm((e.target as HTMLInputElement).value)
		this.shoulderToKnee = Number(valueWithoutCm)
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
			<div class="measurement-container">
				<!-- Header -->
				<div class="measurement-header">
					<div class="back-icon" onclick=${this.#onBackButtonClick}>
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="12" viewBox="0 0 20 12" fill="none">
							<path
								d="M19 6.75C19.4142 6.75 19.75 6.41421 19.75 6C19.75 5.58579 19.4142 5.25 19 5.25V6.75ZM0.469536 5.46967C0.176643 5.76256 0.176643 6.23744 0.469536 6.53033L5.24251 11.3033C5.5354 11.5962 6.01027 11.5962 6.30317 11.3033C6.59606 11.0104 6.59606 10.5355 6.30317 10.2426L2.06053 6L6.30317 1.75736C6.59606 1.46447 6.59606 0.989593 6.30317 0.696699C6.01027 0.403806 5.5354 0.403806 5.24251 0.696699L0.469536 5.46967ZM19 6V5.25L0.999866 5.25V6V6.75L19 6.75V6Z"
								fill="#191A1D"
							/>
						</svg>
					</div>
					<h2 class="page-title">Your measurements</h2>
				</div>

				<!-- Measurement Input Fields -->
				<div class="measurement-fields">
					<div class="field-row">
						<div class="field-group">
							<input
								type="text"
								class="form-input"
								placeholder=" "
								value=${() => `${this.bust} cm`}
								oninput=${this.#onBustChange}
							/>
							<label class="floating-label">Bust</label>
						</div>
						<div class="field-group">
							<input
								type="text"
								class="form-input"
								placeholder=" "
								value=${() => `${this.waist} cm`}
								oninput=${this.#onWaistChange}
							/>
							<label class="floating-label">Waist</label>
						</div>
					</div>

					<div class="field-row">
						<div class="field-group">
							<input
								type="text"
								class="form-input"
								placeholder=" "
								value=${() => `${this.hips} cm`}
								oninput=${this.#onHipsChange}
							/>
							<label class="floating-label">Hips</label>
						</div>
						<div class="field-group">
							<input
								type="text"
								class="form-input"
								placeholder=" "
								value=${() => `${this.shoulder} cm`}
								oninput=${this.#onShoulderChange}
							/>
							<label class="floating-label">Shoulder</label>
						</div>
					</div>

					<div class="field-row">
						<div class="field-group">
							<input
								type="text"
								class="form-input"
								placeholder=" "
								value=${() => `${this.shoulderToKnee} cm`}
								oninput=${this.#onShoulderToKneeChange}
							/>
							<label class="floating-label">Shoulder to knee</label>
						</div>
					</div>
				</div>

				<!-- Spacer to push button to bottom -->
				<div class="button-spacer"></div>

				<button class="measurement-button" onclick=${this.#onSaveClick}>Save my measurements</button>
			</div>
		</bottom-sheet>
	`

	css = css/*css*/ `
		${appStyles}

		/* Measurement page specific styles */
		.measurement-container {
			padding: var(--uiSpacing);
			padding-top: 0;
			padding-bottom: 5px;
			background: var(--uiColorPrimaryWhite);
		}

		.measurement-header {
			margin-bottom: var(--uiSpacingLarge);
		}

		.back-icon {
			width: 24px;
			height: 35px;
			display: flex;
			align-items: flex-start;
			justify-content: center;
			cursor: pointer;
			padding-right: var(--uiGap);
		}

		.back-icon svg {
			color: var(--uiColorPrimaryBlack);
		}

		.back-icon svg path {
			fill: var(--uiColorPrimaryBlack);
		}

		:host-context([data-theme='dark']) .back-icon svg path {
			fill: var(--uiColorPrimaryWhite);
		}

		.measurement-fields {
			margin-bottom: var(--uiSpacingXl);
		}

		.field-group {
			flex: 1;
		}

		.button-spacer {
			flex: 1;
			min-height: 0;
		}

		/* Override panel styles for measurement layout */
		#panel {
			background-color: var(--uiColorPrimaryWhite);
			width: 400px;
			position: static;
			margin-top: 80px;

			:host-context([data-theme='dark']) & {
				background-color: var(--appBackgroundDark);
			}
		}

		.panel-content {
			padding: var(--uiSpacing);
			display: flex;
			flex-direction: column;
			height: calc(85vh - var(--uiSpacing));
		}

		.measurement-fields {
			margin-bottom: 60px;
		}

		/* Mobile Layout */
		@media (width < 720px) {
			#panel {
				width: 100%;
				height: 50vh;
				margin-top: 0;
				border-radius: 20px 20px 0 0;
				position: static;
				padding: 0;
				left: unset;
				right: unset;
			}

			.panel-content {
				height: calc(50vh - 40px);
				overflow-y: auto;
				overflow-x: hidden;
			}
		}
	`
}
