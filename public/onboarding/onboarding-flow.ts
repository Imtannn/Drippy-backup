import {css, element, Element, html, signal, type ElementAttributes} from 'lume'
import {Meteor} from 'meteor/meteor'
import {Tracker} from 'meteor/tracker'
import '../app/app-buttons.js'
import '../elements/back-button.js'
import '../elements/logic/show-when.js'
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
	@signal errorMessage = ''

	connectedCallback() {
		super.connectedCallback()

		// Listen for back-button clicks
		this.addEventListener('click', e => {
			// Check if this is a back-button click by looking at the event path
			const path = e.composedPath()
			const hasBackButton = path.some(el => el instanceof HTMLElement && el.tagName?.toLowerCase() === 'back-button')

			if (hasBackButton) {
				this.#previousStep()
			}
		})

		this.createEffect(() => {
			const searchParams = new URLSearchParams(window.location.search)
			const stepFromUrl = searchParams.get('step') as OnboardingStep

			if (stepFromUrl && ['step1', 'step2', 'step3', 'step4'].includes(stepFromUrl)) {
				this.currentStep = stepFromUrl
			} else {
				this.#updateUrl('step1')
			}
		})

		// When user logs in, advance to next step
		const computation = Tracker.autorun(() => {
			if (Meteor.userId()) {
				this.#nextStep()
			}
		})

		// Clean up Tracker computation when component is destroyed
		this.createEffect(() => {
			return () => computation.stop()
		})
	}

	#updateUrl = (step: OnboardingStep) => {
		const url = new URL(window.location.href)
		url.searchParams.set('step', step)
		window.history.replaceState({}, '', url.toString())
	}

	#nextStep = () => {
		const steps: OnboardingStep[] = ['step1', 'step2', 'step3', 'step4']
		const currentIndex = steps.indexOf(this.currentStep)
		if (currentIndex !== -1 && currentIndex < steps.length - 1) {
			const nextStep = steps[currentIndex + 1]
			this.currentStep = nextStep
			this.#updateUrl(nextStep)
		}
	}

	#previousStep = () => {
		const steps: OnboardingStep[] = ['step1', 'step2', 'step3', 'step4']
		const currentIndex = steps.indexOf(this.currentStep)
		if (currentIndex !== -1 && currentIndex > 0) {
			const prevStep = steps[currentIndex - 1]
			this.currentStep = prevStep
			this.#updateUrl(prevStep)
		}
	}

	#handleStep2Submit = async () => {
		// Clear any previous errors
		this.errorMessage = ''

		if (this.username && this.dateOfBirth) {
			try {
				// Save username and dateOfBirth to current user's profile
				await Meteor.callAsync('users.updateProfile', {
					username: this.username,
					dateOfBirth: this.dateOfBirth,
				})

				this.#nextStep()
			} catch (error: any) {
				console.error('Error saving profile:', error)

				if (error.error === 'username-taken') {
					this.errorMessage = 'This username is already taken. Please choose a different one.'
				} else if (error.error === 'invalid-username') {
					this.errorMessage = error.reason || 'Invalid username format.'
				} else {
					this.errorMessage = 'Failed to save profile. Please try again.'
				}
			}
		} else {
			this.errorMessage = 'Please enter both username and date of birth.'
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
						<div class="login-section">
							<login-ui expanded> </login-ui>
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
							<h1 class="title">First, enter your username & date of birth.</h1>
						</header>
						<div class="form-section">
							<input
								type="text"
								placeholder="@username"
								class="form-input"
								oninput=${(e: InputEvent) => {
									this.username = (e.target as HTMLInputElement).value
									this.errorMessage = '' // Clear error when user starts typing
								}}
								value=${() => this.username}
							/>
							<input
								type="date"
								class="form-input"
								placeholder="Select your date of birth"
								max="9999-12-31"
								min="1950-01-01"
								onchange=${(e: Event) => {
									this.dateOfBirth = (e.target as HTMLInputElement).value
									this.errorMessage = ''
								}}
								oninput=${(e: Event) => {
									this.dateOfBirth = (e.target as HTMLInputElement).value
									this.errorMessage = ''
								}}
								value=${() => this.dateOfBirth}
							/>
							<p class="privacy-note">Don't worry, we won't tell about it. 😉</p>

							<show-when
								condition=${() => this.errorMessage.length > 0}
								content=${() => html`<div class="error-message">${this.errorMessage}</div>`}
							></show-when>
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
							<div class="back-btn-container">
								<back-button onclick=${this.#previousStep}></back-button>
							</div>
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
							<div class="back-btn-container">
								<back-button onclick=${this.#previousStep}></back-button>
							</div>
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
