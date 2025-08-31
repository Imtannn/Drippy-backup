import {css, element, Element, html, signal, type ElementAttributes} from 'lume'
import '../app/app-buttons.js'
import '../elements/back-button.js'
import '../elements/show-when.js'
import {onboardingStyles} from '../styles/onboarding-styles.js'

const createAccountImg = '/images/create-account.png'
const step3Img = '/images/img-3-big.png'
const step4Img = '/images/img-4-big.png'
const logoLight = '/images/landing/logo-light.png'

type OnboardingStep = 'step1' | 'step2' | 'step3' | 'step4'

type OnboardingFlowAttributes = keyof {}

@element
export class OnboardingFlow extends Element {
	static readonly elementName = 'onboarding-flow'

	@signal email = ''
	@signal username = ''
	@signal dateOfBirth = ''
	@signal currentStep: OnboardingStep = 'step1'

	connectedCallback() {
		super.connectedCallback()

		this.createEffect(() => {
			// Add any initialization logic here if needed
		})
	}

	#nextStep = () => {
		const steps: OnboardingStep[] = ['step1', 'step2', 'step3', 'step4']
		const currentIndex = steps.indexOf(this.currentStep)
		if (currentIndex !== -1 && currentIndex < steps.length - 1) {
			this.currentStep = steps[currentIndex + 1]
		}
	}

	#previousStep = () => {
		const steps: OnboardingStep[] = ['step1', 'step2', 'step3', 'step4']
		const currentIndex = steps.indexOf(this.currentStep)
		if (currentIndex !== -1 && currentIndex > 0) {
			this.currentStep = steps[currentIndex - 1]
		}
	}

	#handleStep1Submit = () => {
		if (this.email.includes('@')) {
			this.#nextStep()
		} else {
			alert('Please enter a valid email address')
		}
	}

	#handleStep2Submit = () => {
		if (this.username && this.dateOfBirth) {
			this.#nextStep()
		} else {
			alert('Please enter both username and date of birth')
		}
	}

	#goToApp = () => {
		window.location.href = '/app'
	}

	template = () => html`
		<div class="onboarding-flow">
			<show-when
				condition=${() => this.currentStep === 'step1'}
				content=${() => html`
					<div class="onboarding-step">
						<header>
							<img src=${logoLight} alt="Drippy Logo" class="header-logo" />
							<h1 class="title">Gamify your fashion shopping experience.</h1>
							<p class="sub-title">Browse it. Drip it. Shop it IRL!</p>
						</header>
						<div class="email-section">
							<input
								type="email"
								placeholder="Enter your email"
								class="form-input"
								oninput=${(e: InputEvent) => (this.email = (e.target as HTMLInputElement).value)}
								value=${() => this.email}
							/>
							<button class="btn btn-primary" onclick=${this.#handleStep1Submit}>Count me in 🔥</button>
						</div>
						<img src=${createAccountImg} alt="Create Account" />
					</div>
				`}
			></show-when>

			<show-when
				condition=${() => this.currentStep === 'step2'}
				content=${() => html`
					<div class="onboarding-step">
						<header>
							<div class="back-btn-container"><back-button onclick=${this.#previousStep}></back-button></div>
							<h1 class="title">First, enter your username & date of birth.</h1>
						</header>
						<div class="form-section">
							<input
								type="text"
								placeholder="@username"
								class="form-input"
								oninput=${(e: InputEvent) => (this.username = (e.target as HTMLInputElement).value)}
								value=${() => this.username}
							/>
							<input
								type="date"
								class="form-input"
								placeholder="Select your date of birth"
								onchange=${(e: Event) => (this.dateOfBirth = (e.target as HTMLInputElement).value)}
								value=${() => this.dateOfBirth}
							/>
							<p class="privacy-note">Don't worry, we won't tell about it. 😉</p>
						</div>
						<button class="btn btn-primary" onclick=${this.#handleStep2Submit}>OK!</button>
					</div>
				`}
			></show-when>

			<show-when
				condition=${() => this.currentStep === 'step3'}
				content=${() => html`
					<div class="onboarding-step">
						<header>
							<div class="back-btn-container"><back-button onclick=${this.#previousStep}></back-button></div>
							<h1 class="title">Did you know? Every garment on Drippy can be shopped IRL.</h1>
						</header>
						<div class="action-section">
							<button class="btn btn-primary" onclick=${this.#nextStep}>Yesss!</button>
						</div>
						<img src=${step3Img} alt="Step 3" />
					</div>
				`}
			></show-when>

			<show-when
				condition=${() => this.currentStep === 'step4'}
				content=${() => html`
					<div class="onboarding-step">
						<header>
							<div class="back-btn-container"><back-button onclick=${this.#previousStep}></back-button></div>
							<h1 class="title">Ready to discover your unique style? Let's get started!</h1>
						</header>
						<div class="action-section">
							<button class="btn btn-primary" onclick=${this.#goToApp}>Let's Go!</button>
						</div>
						<img src=${step4Img} alt="Step 4" />
					</div>
				`}
			></show-when>
		</div>
	`

	css = css`
		${onboardingStyles}
	`
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			'onboarding-flow': ElementAttributes<OnboardingFlow, OnboardingFlowAttributes>
		}
	}
}
declare global {
	interface HTMLElementTagNameMap {
		'onboarding-flow': OnboardingFlow
	}
}
