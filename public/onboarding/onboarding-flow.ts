import {css, element, Element, html, signal} from 'lume'
import {createSignal} from 'solid-js'
import {RouteViews, type RouteViewsConfig} from '../elements/route-views.js'

const createAccountImg = '/images/create-account.png'
const step3Img = '/images/step3.png'
const step4Img = '/images/step4.png'

const stepConfigs = {
	step1: {
		title: 'Gamify your fashion shopping experience.',
		subtitle: 'Browse it. Drip it. Shop it IRL!',
		showBackButton: false,
		image: createAccountImg,
	},
	step2: {
		title: 'First, enter your username & date of birth.',
		subtitle: '',
		showBackButton: true,
		image: null,
	},
	step3: {
		title: 'Did you know? Every garment on Drippy can be shopped IRL.',
		subtitle: '',
		showBackButton: true,
		image: step3Img,
	},
	step4: {
		title: "Ready to discover your unique style? Let's get started!",
		subtitle: '',
		showBackButton: true,
		image: step4Img,
	},
}

const onboardingHeader = (
	config: {
		title: string
		subtitle: string
		showBackButton: boolean
		image?: string | null
	},
	onBack: () => void,
) => html`
	<header>
		${config.showBackButton
			? html`
					<div class="back-btn-container">
						<button class="back-btn" onclick=${onBack}>←</button>
					</div>
				`
			: ''}
		<h1 class="title">${config.title}</h1>
		${config.subtitle ? html`<p class="sub-title">${config.subtitle}</p>` : ''}
	</header>
`

const onboardingStepFlow = (
	config: {
		title: string
		subtitle: string
		showBackButton: boolean
		image?: string | null
	},
	content: any,
	onBack: () => void,
) => html` <div class="onboarding-step">${onboardingHeader(config, onBack)} ${content}</div> `

@element
export class OnboardingFlow extends Element {
	static readonly elementName = 'onboarding-flow'

	#email = createSignal('')
	#username = createSignal('')
	#dateOfBirth = createSignal('')

	@signal currentStep = 'step1'

	connectedCallback() {
		super.connectedCallback()
		// Listen for navigation events from the child component
		this.addEventListener('next-step', this.#handleNextStep)
		this.addEventListener('back-step', this.#handleBackStep)
	}

	disconnectedCallback() {
		super.disconnectedCallback()
		this.removeEventListener('next-step', this.#handleNextStep)
		this.removeEventListener('back-step', this.#handleBackStep)
	}

	#handleNextStep = () => {
		const steps = this.onboardingConfig.steps.map(s => s.id)
		const currentIndex = steps.indexOf(this.currentStep)
		if (currentIndex !== -1 && currentIndex < steps.length - 1) {
			this.currentStep = steps[currentIndex + 1]

			// Force attribute update by directly setting it on the route-views element
			const routeViews = this.querySelector('route-views')
			if (routeViews) {
				console.log('Setting current-step attribute manually to:', this.currentStep)
				routeViews.setAttribute('current-step', this.currentStep)
			}
		}
	}

	#handleBackStep = () => {
		const steps = this.onboardingConfig.steps.map(s => s.id)
		const currentIndex = steps.indexOf(this.currentStep)
		if (currentIndex !== -1 && currentIndex > 0) {
			this.currentStep = steps[currentIndex - 1]
		}
	}

	get onboardingConfig(): RouteViewsConfig {
		const [email, setEmail] = this.#email
		const [username, setUsername] = this.#username
		const [dateOfBirth, setDateOfBirth] = this.#dateOfBirth
		const handleStep1Submit = (routeViews: RouteViews) => {
			if (email()?.includes('@')) {
				routeViews.nextStep()
			} else {
				alert('Please enter a valid email address')
			}
		}
		const handleStep2Submit = (routeViews: RouteViews) => {
			if (username() && dateOfBirth()) {
				routeViews.nextStep()
			} else {
				alert('Please enter both username and date of birth')
			}
		}

		return {
			steps: [
				{
					id: 'step1',
					template: (routeViews: RouteViews) =>
						onboardingStepFlow(
							stepConfigs.step1,
							html`
								<div class="email-section">
									<input
										type="email"
										placeholder="Enter your email"
										class="form-input"
										oninput=${(e: InputEvent) => setEmail((e.target as HTMLInputElement).value)}
										value=${() => email()}
									/>
									<button class="btn btn-primary" onclick=${() => handleStep1Submit(routeViews)}>Count me in 🔥</button>
								</div>
								<img src=${stepConfigs.step1.image} alt="Create Account" />
							`,
							() => {},
						),
				},
				{
					id: 'step2',
					template: (routeViews: RouteViews) =>
						onboardingStepFlow(
							stepConfigs.step2,
							html`
								<div class="form-section">
									<input
										type="text"
										placeholder="@username"
										class="form-input"
										oninput=${(e: InputEvent) => setUsername((e.target as HTMLInputElement).value)}
										value=${() => username()}
									/>
									<input
										type="date"
										class="form-input"
										onchange=${(e: Event) => setDateOfBirth((e.target as HTMLInputElement).value)}
										value=${() => dateOfBirth()}
									/>
									<p class="privacy-note">Don't worry, we won't tell about it. 😉</p>
								</div>
								<button class="btn btn-primary" onclick=${() => handleStep2Submit(routeViews)}>OK!</button>
							`,
							() => routeViews.previousStep(),
						),
				},
				{
					id: 'step3',
					template: (routeViews: RouteViews) =>
						onboardingStepFlow(
							stepConfigs.step3,
							html`
								<div class="action-section">
									<button class="btn btn-primary" onclick=${() => routeViews.nextStep()}>Yesss!</button>
								</div>
								<img src=${stepConfigs.step3.image} alt="Step 3" />
							`,
							() => routeViews.previousStep(),
						),
				},
				{
					id: 'step4',
					template: (routeViews: RouteViews) =>
						onboardingStepFlow(
							stepConfigs.step4,
							html`
								<div class="action-section">
									<button class="btn btn-primary" onclick=${() => (window.location.href = '/app')}>Let's Go!</button>
								</div>
								<img src=${stepConfigs.step4.image} alt="Step 4" />
							`,
							() => routeViews.previousStep(),
						),
				},
			],
			css: this.onboardingCSS,
		}
	}

	template = () => {
		return html`
			<div class="onboarding-flow">
				<route-views config=${() => this.onboardingConfig} current-step=${() => this.currentStep}></route-views>
			</div>
		`
	}

	css = css`
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

		input[type='date']::-webkit-calendar-picker-indicator {
			display: none;
		}

		input[type='date']::-webkit-inner-spin-button,
		input[type='date']::-webkit-outer-spin-button {
			-webkit-appearance: none;
			margin: 0;
		}

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

	get onboardingCSS(): string {
		return css`
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

			input[type='date']::-webkit-calendar-picker-indicator {
				display: none;
			}

			input[type='date']::-webkit-inner-spin-button,
			input[type='date']::-webkit-outer-spin-button {
				-webkit-appearance: none;
				margin: 0;
			}

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
}
declare global {
	interface HTMLElementTagNameMap {
		'onboarding-flow': OnboardingFlow
	}
}
