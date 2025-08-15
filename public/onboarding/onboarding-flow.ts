import {element, Element, html, signal} from 'lume'
import {createSignal} from 'solid-js'
import {onboardingStyles} from '../elements/onboarding-styles.js'
import {RouteViews, type RouteViewsConfig} from '../elements/route-views.js'

const createAccountImg = '/images/create-account.png'
const step3Img = '/images/img-3-big.png'
const step4Img = '/images/img-4-big.png'

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
		}
	}

	template = () => {
		return html`
			<div class="onboarding-flow">
				<route-views config=${() => this.onboardingConfig} current-step=${() => this.currentStep}></route-views>
			</div>
		`
	}

	css = onboardingStyles
}
declare global {
	interface HTMLElementTagNameMap {
		'onboarding-flow': OnboardingFlow
	}
}
