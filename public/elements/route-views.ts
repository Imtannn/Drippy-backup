import {attribute, css, element, Element, html} from 'lume'
import {appStyles} from './app-styles.js'
import {onboardingStyles} from './onboarding-styles.js'
export interface RouteViews {
	nextStep(): void
	previousStep(): void
}

export interface StepConfig {
	id: string
	template: (routeViews: RouteViews) => Node | Node[]
}

export interface RouteViewsConfig {
	steps: StepConfig[]
	css?: string
}

@element
export class RouteViews extends Element {
	static readonly elementName = 'route-views'

	config: RouteViewsConfig = {steps: []}
	@attribute currentStep: string = ''

	template = () => {
		return html`<div class="route-content">
			${() => {
				const config = this.config
				const currentStep = this.currentStep

				console.log('RouteViews reactive template - config:', config, 'currentStep:', currentStep)

				if (!config || !config.steps.length) {
					return html`<div>Loading...</div>`
				}

				const currentStepConfig = config.steps.find(s => s.id === currentStep)

				if (!currentStepConfig) {
					return html`<div>Step "${currentStep}" not found. Available: ${config.steps.map(s => s.id).join(', ')}</div>`
				}

				return currentStepConfig.template(this)
			}}
		</div>`
	}

	nextStep() {
		console.log('RouteViews nextStep() called - dispatching next-step event')
		this.dispatchEvent(
			new CustomEvent('next-step', {
				bubbles: true,
				composed: true,
			}),
		)
	}

	previousStep() {
		console.log('RouteViews previousStep() called - dispatching back-step event')
		this.dispatchEvent(
			new CustomEvent('back-step', {
				bubbles: true,
				composed: true,
			}),
		)
	}

	css = css`
		${onboardingStyles}
		${appStyles}

		:host {
			display: block;
			width: 100%;
			height: 100vh;
		}

		.route-content {
			width: 100%;
			height: 100%;
		}
	`
}
declare global {
	interface HTMLElementTagNameMap {
		'route-views': RouteViews
	}
}
