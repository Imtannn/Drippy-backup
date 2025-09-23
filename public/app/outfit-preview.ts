import {css, Element, element, html, type ElementAttributes} from 'lume'
import '../elements/back-button.js'
import '../elements/cube-button.js'
import '../elements/home-button.js'
import '../elements/logo-button.js'
import '../elements/person-button.js'
import '../elements/animation-select.js'

import '../elements/show-on-device.js'
import '../elements/theme-switch-button.js'
import './app-buttons.js'
import './buy-button.js'
import './share-button.js'
import {store} from './store.js'
import {updateUrlWithParams} from '../routes.js'

type OutfitPreviewAttributes = keyof {}

@element
export class OutfitPreview extends Element {
	static readonly elementName = 'outfit-preview'

	#onBackButtonClick = () => {
		store.setIsPreview = false
		const searchParams = new URLSearchParams(window.location.search)
		searchParams.delete('isPreview')
		updateUrlWithParams(searchParams)
		store.navigateTo = 'blocks'
	}

	#onHomeButtonClick = () => {
		const url = window.location.pathname
		let search = window.location.search
		search = search.replace('isPreview=true', '')
		window.history.replaceState({}, '', `${url}${search}`)
		store.resetState()
		store.navigateTo = 'template'
	}

	#onBuyItClick = () => {
		store.navigateTo = 'order-items'
	}

	shareIcon = () => html`
		<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path
				d="M7.95508 0.789062C8.09295 0.728048 8.25237 0.739447 8.37891 0.818359L8.43066 0.856445L13.5928 5.20605C13.6921 5.28956 13.75 5.41293 13.75 5.54395C13.75 5.67525 13.6915 5.79748 13.5928 5.88086L8.43066 10.2314C8.29797 10.3434 8.11265 10.3695 7.95508 10.2998V10.2988C7.79709 10.2287 7.68922 10.0728 7.68945 9.89453V7.55859C6.2545 7.62185 5.11944 8.00003 4.11426 8.79688C3.04172 9.64726 2.09532 10.9904 1.10254 13C1.02455 13.1582 0.86472 13.25 0.699219 13.25C0.665513 13.25 0.632487 13.2464 0.600586 13.2393V13.2383C0.399611 13.1938 0.25012 13.0181 0.25 12.8066C0.25 7.91087 3.51414 3.8324 7.68945 3.55664V1.19336C7.6895 1.01574 7.79658 0.859396 7.95508 0.789062ZM8.58789 3.98242C8.58789 4.23418 8.38018 4.42676 8.13867 4.42676C4.93521 4.42689 2.18576 7.04467 1.38477 10.6484C2.16724 9.41121 2.98691 8.48998 3.91699 7.84668C5.12002 7.01473 6.48477 6.6623 8.13867 6.66211L8.22754 6.6709C8.4291 6.71107 8.58788 6.8852 8.58789 7.10547V8.93262L12.6074 5.54395L8.58789 2.1543V3.98242Z"
				fill="white"
				stroke="white"
				stroke-width="0.5"
			/>
		</svg>
	`

	buyIcon = () => html`
		<svg width="15" height="16" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path
				d="M3.16667 0.777832L1 3.66672V13.7778C1 14.1609 1.15218 14.5283 1.42307 14.7992C1.69395 15.0701 2.06135 15.2223 2.44444 15.2223H12.5556C12.9386 15.2223 13.306 15.0701 13.5769 14.7992C13.8478 14.5283 14 14.1609 14 13.7778V3.66672L11.8333 0.777832H3.16667Z"
				fill="#F6F6F6"
				stroke="#121316"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path d="M1 3.66675H14" stroke="#121316" stroke-linecap="round" stroke-linejoin="round" />
			<path
				d="M10.3891 6.55566C10.3891 7.32185 10.0847 8.05665 9.54297 8.59842C9.0012 9.14019 8.2664 9.44455 7.50022 9.44455C6.73404 9.44455 5.99924 9.14019 5.45746 8.59842C4.91569 8.05665 4.61133 7.32185 4.61133 6.55566"
				stroke="#121316"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	`

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
					<buy-button onclick=${this.#onBuyItClick}></buy-button>
				</app-buttons-group>
			</app-buttons-right>
		</show-on-device>

		<app-buttons-right>
			<app-buttons-group>
				<logo-button brand-name="MoiDien"></logo-button>
			</app-buttons-group>

			<app-buttons-group>
				<person-button disabled></person-button>
				<cube-button disabled></cube-button>
				<animation-select disabled></animation-select>
			</app-buttons-group>
		</app-buttons-right>

		<show-on-device device="mobile">
			<div class="bottom-buttons">
				<button class="buy-button" onclick=${this.#onBuyItClick}>${this.buyIcon()} Buy it!</button>
			</div>
		</show-on-device>
	`

	css = css/*css*/ `
		:host {
			display: contents;
		}

		.bottom-buttons {
			position: fixed;
			bottom: 20px;
			left: 50%;
			transform: translateX(-50%);
			display: flex;
			flex-direction: column;
			gap: var(--uiSpacingTiny);
			z-index: 100;
			width: 90vw;
			min-width: 254px;
		}

		.buy-button,
		.share-button {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: var(--uiGap);
			width: 100%;
			padding: var(--uiSpacingMedium) 32px;
			border-radius: var(--borderRadius);
			border: none;
			font-size: var(--fontSizeTextXs);
			font-weight: var(--fontWeightSemiBold);
			cursor: pointer;
			text-align: center;
		}

		.buy-button {
			background: var(--uiColorPrimaryBlack);
			color: var(--uiColorPrimaryWhite);
			box-shadow: 0px 1px 2px 0px var(--uiColorWhiteShadow) inset;
		}

		.share-button {
			background: #12131680;
			color: var(--uiColorPrimaryWhite);
			backdrop-filter: blur(50px);
		}
	`
}

declare global {
	interface HTMLElementTagNameMap {
		'outfit-preview': OutfitPreview
	}
}

declare global {
	interface IntrinsicElements {
		'outfit-preview': ElementAttributes<OutfitPreview, OutfitPreviewAttributes>
	}
}
