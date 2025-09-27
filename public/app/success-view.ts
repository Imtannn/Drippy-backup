import {css, Element, element, html} from 'lume'
import {appStyles} from '../styles/app-styles.js'
import {store} from './store.js'

@element
export class SuccessView extends Element {
	static elementName = 'success-view'

	#onDripAnotherDesignClick = () => {
		const url = new URL(window.location.href)
		window.history.replaceState({}, '', url.pathname)
		store.resetState()
		store.navigateTo = 'avatar'
	}

	#onBackButtonClick = () => {
		store.navigateTo = 'order-items'
	}

	#onHomeButtonClick = () => {
		store.resetState()
		window.location.href = '/app?avatar=moidien'
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

		<bottom-sheet float-direction="right" max-height="calc(100vh - 20rem)" default-sheet-height="270px">
			<div class="success-container">
				<!-- Success Header -->
				<div class="success-header">
					<h2 class="success-title">Boom — it's in!</h2>
					<p class="success-message"><strong>LOGO</strong> just got your order. You? Iconic. 😎</p>
				</div>

				<!-- Action Button -->
				<button class="success-button" onclick=${this.#onDripAnotherDesignClick}>Drip another design</button>

				<!-- Rating Section -->
				<div class="rating-section">
					<div class="stars">
						<input type="radio" name="rating" value="1" id="star1" class="rating-input" />
						<input type="radio" name="rating" value="2" id="star2" class="rating-input" />
						<input type="radio" name="rating" value="3" id="star3" class="rating-input" />
						<input type="radio" name="rating" value="4" id="star4" class="rating-input" />
						<input type="radio" name="rating" value="5" id="star5" class="rating-input" />

						<label for="star1" class="star-box star1"></label>
						<label for="star2" class="star-box star2"></label>
						<label for="star3" class="star-box star3"></label>
						<label for="star4" class="star-box star4"></label>
						<label for="star5" class="star-box star5"></label>
					</div>
					<p class="rating-text">Rate your experience</p>
				</div>
			</div>
		</bottom-sheet>
	`

	css = css/*css*/ `
		${appStyles}

		.success-container {
			padding: 20px;
			padding-top: 0;
			display: flex;
			flex-direction: column;
			align-items: center;
			text-align: center;
		}

		.panel-content {
			padding: 20px;
			display: flex;
			flex-direction: column;
			align-items: center;
			text-align: center;
		}

		/* Success Header */
		.success-header {
			margin-bottom: 30px;
		}

		.success-title {
			font-size: 18px;
			font-weight: 600;
			color: #000;
			margin: 0 0 10px 0;

			:host-context([data-theme='dark']) & {
				color: #fff;
			}
		}

		.success-message {
			font-size: 16px;
			font-weight: 400;
			color: #000000;
			margin: 0;
			line-height: 1.4;

			:host-context([data-theme='dark']) & {
				color: #ccc;
			}
		}

		/* Success Button */
		.success-button {
			width: 100%;
			background: #000;
			color: white;
			border: none;
			border-radius: 25px;
			padding: 15px 20px;
			font-size: 14px;
			font-weight: 600;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			margin-bottom: 30px;

			:host-context([data-theme='dark']) & {
				background: #fff;
				color: #000;
			}
		}

		/* Rating Section */
		.rating-section {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 10px;
		}

		.stars {
			display: flex;
			gap: 10px;
		}

		.rating-input {
			display: none;
		}

		.star-box {
			width: 30px;
			height: 30px;
			border-radius: 5px;
			background: var(--Lighter-grey, #f6f6f6);
			cursor: pointer;
			transition: all 0.2s ease;
			position: relative;

			:host-context([data-theme='dark']) & {
				background: #2a2a2a;
			}
		}

		.star-box::before {
			content: '';
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			width: 21px;
			height: 20px;
			background-image: url('../images/star-icon.svg');
			background-size: contain;
			background-repeat: no-repeat;
			background-position: center;
			transition: filter 0.2s ease;
		}

		/* Dark mode initial star color */
		:host-context([data-theme='dark']) .star-box::before {
			filter: brightness(0) saturate(100%) invert(0%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(0%)
				contrast(100%);
		}

		.star-box:hover {
			background: var(--Lighter-grey, #e0e0e0);

			:host-context([data-theme='dark']) & {
				background: #3a3a3a;
			}
		}

		/* Fill all stars up to the selected one */
		#star1:checked ~ .star-box.star1::before,
		#star2:checked ~ .star-box.star1::before,
		#star2:checked ~ .star-box.star2::before,
		#star3:checked ~ .star-box.star1::before,
		#star3:checked ~ .star-box.star2::before,
		#star3:checked ~ .star-box.star3::before,
		#star4:checked ~ .star-box.star1::before,
		#star4:checked ~ .star-box.star2::before,
		#star4:checked ~ .star-box.star3::before,
		#star4:checked ~ .star-box.star4::before,
		#star5:checked ~ .star-box.star1::before,
		#star5:checked ~ .star-box.star2::before,
		#star5:checked ~ .star-box.star3::before,
		#star5:checked ~ .star-box.star4::before,
		#star5:checked ~ .star-box.star5::before {
			filter: brightness(0) saturate(100%) invert(0%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(0%)
				contrast(100%);
		}

		/* Dark mode star colors */
		:host-context([data-theme='dark']) #star1:checked ~ .star-box.star1::before,
		:host-context([data-theme='dark']) #star2:checked ~ .star-box.star1::before,
		:host-context([data-theme='dark']) #star2:checked ~ .star-box.star2::before,
		:host-context([data-theme='dark']) #star3:checked ~ .star-box.star1::before,
		:host-context([data-theme='dark']) #star3:checked ~ .star-box.star2::before,
		:host-context([data-theme='dark']) #star3:checked ~ .star-box.star3::before,
		:host-context([data-theme='dark']) #star4:checked ~ .star-box.star1::before,
		:host-context([data-theme='dark']) #star4:checked ~ .star-box.star2::before,
		:host-context([data-theme='dark']) #star4:checked ~ .star-box.star3::before,
		:host-context([data-theme='dark']) #star4:checked ~ .star-box.star4::before,
		:host-context([data-theme='dark']) #star5:checked ~ .star-box.star1::before,
		:host-context([data-theme='dark']) #star5:checked ~ .star-box.star2::before,
		:host-context([data-theme='dark']) #star5:checked ~ .star-box.star3::before,
		:host-context([data-theme='dark']) #star5:checked ~ .star-box.star4::before,
		:host-context([data-theme='dark']) #star5:checked ~ .star-box.star5::before {
			filter: brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%)
				contrast(100%);
		}

		.rating-text {
			font-size: 14px;
			font-weight: 400;
			color: #8b8b8b;
			margin: 0;

			:host-context([data-theme='dark']) & {
				color: #aaa;
			}
		}
	`
}
