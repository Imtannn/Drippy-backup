import {
	css,
	Element as LumeElement,
	element,
	type ElementAttributes,
	numberAttribute,
	booleanAttribute,
} from '@lume/element'
import html from 'solid-js/html'
import {createSignal} from 'solid-js'
import '../elements/show-when.js'
type OnboardingFlowAttributes = 'step' | 'disabled'

@element('onboarding-flow')
export class OnboardingFlow extends LumeElement {
	@numberAttribute step = 1
	@booleanAttribute disabled = false

	#email = createSignal('')
	#username = createSignal('')
	#dateOfBirth = createSignal('')

	#stepConfigs = [
		{
			step: 1,
			title: 'Gamify your fashion shopping experience.',
			subtitle: 'Browse it. Drip it. Shop it IRL!',
			showBackButton: false,
			image: '/images/create-account.png',
		},
		{
			step: 2,
			title: 'First, enter your username & date of birth.',
			subtitle: '',
			showBackButton: true,
			image: null,
		},
		{
			step: 3,
			title: 'Did you know? Every garment on Drippy can be shopped IRL.',
			subtitle: '',
			showBackButton: true,
			image: '/images/step3.png',
		},
		{
			step: 4,
			title: "Ready to discover your unique style? Let's get started!",
			subtitle: '',
			showBackButton: true,
			image: '/images/step4.png',
		},
	]

	connectedCallback() {
		super.connectedCallback()
		this.#initializeFromURL()
		this.#setupNavigationListener()
	}

	#initializeFromURL = () => {
		const stepMatch = window.location.pathname.match(/\/onboarding\/step(\d+)/)
		if (stepMatch) {
			this.step = parseInt(stepMatch[1])
		}
	}

	#setupNavigationListener = () => {
		window.addEventListener('popstate', () => {
			const stepMatch = window.location.pathname.match(/\/onboarding\/step(\d+)/)
			this.step = stepMatch ? parseInt(stepMatch[1]) : 1
		})
	}

	#navigateToStep = (step: number) => {
		this.step = step
		window.history.pushState({}, '', `/onboarding/step${step}`)
	}

	#nextStep = () => {
		if (this.step < 4) {
			this.#navigateToStep(this.step + 1)
		}
	}

	#goBack = () => {
		if (this.step > 1) {
			this.#navigateToStep(this.step - 1)
		} else {
			window.location.href = '/'
		}
	}

	#handleEmailInput = (e: Event) => {
		this.#email[1]((e.target as HTMLInputElement).value)
	}

	#handleUsernameInput = (e: Event) => {
		this.#username[1]((e.target as HTMLInputElement).value)
	}

	#handleDateInput = (e: Event) => {
		this.#dateOfBirth[1]((e.target as HTMLInputElement).value)
	}

	#handleStep1Submit = () => {
		const email = this.#email[0]()
		if (email?.includes('@')) {
			this.#nextStep()
		} else {
			alert('Please enter a valid email address')
		}
	}

	#handleStep2Submit = () => {
		const username = this.#username[0]()
		const dateOfBirth = this.#dateOfBirth[0]()

		if (username && dateOfBirth) {
			this.#nextStep()
		} else {
			alert('Please enter both username and date of birth')
		}
	}

	#handleStep3Submit = () => this.#nextStep()
	#handleStep4Submit = () => (window.location.href = '/')

	#renderStep = () => {
		const config = this.#stepConfigs[this.step - 1]
		if (!config) return html`<div>Invalid step</div>`

		return html`
			<div class="onboarding-step">
				<header>
					<show-when
						condition=${config.showBackButton}
						content=${() => html`
							<div class="back-btn-container">
								<button class="back-btn" onclick=${this.#goBack}>←</button>
							</div>
						`}
					></show-when>

					<h1 class="title">${config.title}</h1>
					<show-when
						condition=${config.subtitle}
						content=${() => html`<p class="sub-title">${config.subtitle}</p>`}
					></show-when>
				</header>

				${() => this.#renderStepContent(config)}
			</div>
		`
	}

	#renderStepContent = (config: any) => {
		const stepContent = this.#getStepContent(config)

		return html`
			<show-when
				condition=${stepContent}
				content=${() => stepContent}
				fallback=${() => html`<div>Invalid step</div>`}
			></show-when>
		`
	}

	#getStepContent = (config: any) => {
		const stepContentMap = {
			1: () => html`
				<div class="email-section">
					<input
						type="email"
						placeholder="Enter your email"
						class="form-input"
						oninput=${this.#handleEmailInput}
						value=${() => this.#email[0]()}
					/>
					<button class="btn btn-primary" onclick=${this.#handleStep1Submit}>Count me in 🔥</button>
				</div>
				<img src=${config.image} alt="Create Account" />
			`,
			2: () => html`
				<div class="form-section">
					<input
						type="text"
						placeholder="@username"
						class="form-input"
						oninput=${this.#handleUsernameInput}
						value=${() => this.#username[0]()}
					/>
					<input
						type="date"
						class="form-input"
						onchange=${this.#handleDateInput}
						value=${() => this.#dateOfBirth[0]()}
					/>
					<p class="privacy-note">Don't worry, we won't tell about it. 😉</p>
				</div>
				<button class="btn btn-primary" onclick=${this.#handleStep2Submit}>OK!</button>
			`,
			3: () => html`
				<div class="action-section">
					<button class="btn btn-primary" onclick=${this.#handleStep3Submit}>Yesss!</button>
				</div>
				<img src=${config.image} alt="Step 3" />
			`,
			4: () => html`
				<div class="action-section">
					<button class="btn btn-primary" onclick=${this.#handleStep4Submit}>Let's Go!</button>
				</div>
				<img src=${config.image} alt="Step 4" />
			`,
		}

		const renderer = stepContentMap[this.step as keyof typeof stepContentMap]
		return renderer?.() || null
	}

	template = () => html` <div class="onboarding-flow">${() => this.#renderStep()}</div> `

	css = css/*css*/ `
		:host {
			display: block;
			width: 100%;
			height: 100vh;
		}

		.onboarding-flow {
			width: 100%;
			height: 100%;
			display: flex;
			justify-content: center;
			align-items: center;
		}

		.onboarding-step {
			max-width: 393px;
			margin: 0 auto;
			padding: 19.5px;
			text-align: center;
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			min-height: 100vh;
			display: flex;
			flex-direction: column;
		}

		.title {
			font-size: 21px;
			font-weight: bold;
			padding: 0 15px;
			color: #000;
			line-height: 1.4;
			margin: 0 0 16px 0;
		}

		.sub-title {
			font-size: 16px;
			color: #000;
		}

		/* Form inputs */
		.form-input {
			width: 100%;
			padding: 10px;
			border-radius: 10px;
			font-size: 14px;
			margin-bottom: 10px;
			box-sizing: border-box;
			background: #f8f8f8;
			border: 1px solid #ccc;
			color: #333;
			transition: all 0.3s ease;
			pointer-events: auto;
		}

		.form-input:focus {
			outline: none;
			border: 1px solid transparent;
			background:
				linear-gradient(white, white) padding-box,
				linear-gradient(45deg, #e56be8, #495cff) border-box;
		}

		.form-input::placeholder {
			color: #999;
		}

		/* Date input styling */
		input[type='date']::-webkit-calendar-picker-indicator {
			display: none;
		}

		input[type='date']::-webkit-inner-spin-button,
		input[type='date']::-webkit-outer-spin-button {
			-webkit-appearance: none;
			margin: 0;
		}

		/* Buttons */
		.btn {
			padding: 12px 24px;
			border: none;
			border-radius: 10px;
			font-size: 14px;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.2s ease;
		}

		.btn-primary {
			background: #000;
			color: white;
			width: 100%;
		}

		.btn-primary:hover {
			background: #333;
		}

		/* Back button */
		.back-btn-container {
			text-align: left;
		}

		.back-btn {
			background: none;
			border: none;
			font-size: 24px;
			cursor: pointer;
			color: #000;
			padding: 8px;
			border-radius: 50%;
			transition: background-color 0.2s ease;
		}

		.back-btn:hover {
			background-color: rgba(0, 0, 0, 0.1);
		}

		/* Sections */
		.form-section {
			margin: 0 0 15px 0;
		}

		.privacy-note {
			font-size: 14px;
			color: #666;
			margin: 6px 0 14px 0;
			padding: 0;
			text-align: center;
		}
		img {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}

		/* Mobile-first design */
		@media (max-width: 480px) {
			.onboarding-step {
				padding: 0px;
				justify-content: center;
			}

			.title {
				font-size: 24px;
				padding: 0;
			}
		}
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
