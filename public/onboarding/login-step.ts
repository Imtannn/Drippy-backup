import {css, Element, element, html, type ElementAttributes} from 'lume'
import '../elements/login-ui.js'
import {onboardingStyles} from '../styles/onboarding-styles.js'

const logoLight = '/images/logo-light-fullsize.webp'
const createAccountImg = '/images/create-account.webp'

type LoginStepAttributes = keyof {}

@element
export class LoginStep extends Element {
	static readonly elementName = 'login-step'

	#onCreateAccount = () => {
		this.dispatchEvent(new CustomEvent('show-login-form', {bubbles: true, composed: true}))
	}

	#onSignIn = () => {
		console.log('Sign In')
		this.dispatchEvent(new CustomEvent('show-login-form', {bubbles: true, composed: true}))
	}

	template = () => html`
		<div class="onboarding-step">
			<div class="onboarding-step-content">
				<header class="onboarding-header">
					<img src=${logoLight} alt="Drippy Logo" class="header-logo" />
					<h1 class="title step3-title">Gamify your fashion shopping experience.</h1>
					<p class="sub-title step3-sub-title">Browse it. Drip it. Shop it IRL!</p>
				</header>
				<div class="login-section">
					<button class="btn btn-primary" onclick=${this.#onCreateAccount}>Create a new account</button>
					<button
						class="btn btn-primary"
						style="background-color: var(--uiColorPrimaryLightGrey); color: var(--uiColorPrimaryBlack);"
						onclick=${this.#onSignIn}
					>
						Sign In
					</button>
				</div>
			</div>
			<img src=${createAccountImg} alt="Create Account" />
		</div>
	`

	css = css/*css*/ `
		${onboardingStyles}

		.onboarding-step {
			max-width: none;
			width: 100%;
			padding: var(--uiSpacing);
			box-sizing: border-box;
		}

		.login-section {
			width: 100%;
			margin-top: var(--uiSpacingLarge);
		}
	`
}

declare global {
	interface HTMLElementTagNameMap {
		'login-step': LoginStep
	}
}

declare module 'lume' {
	interface IntrinsicElements {
		'login-step': ElementAttributes<LoginStep, LoginStepAttributes>
	}
}
