import {attribute, css, element, Element, html, type ElementAttributes} from 'lume'
import {appStyles} from './app-styles.js'
import {onboardingStyles} from './onboarding-styles.js'

export type StepConfig = {
	id: string
	template: (routeViews: RouteViews) => Node | Node[]
}

export type RouteViewsConfig = {
	steps: StepConfig[]
	css?: string
}

type RouteViewsAttributes = 'currentStep'

@element
export class RouteViews extends Element {
	static readonly elementName = 'route-views'

	config: RouteViewsConfig = {steps: []}
	@attribute currentStep: string = ''

	template = () => {
		return html`<div class="route-content">
			${() => {
				const configData = this.config
				const currentStep = this.currentStep

				console.log('RouteViews reactive template - config:', configData, 'currentStep:', currentStep)

				if (!configData || !configData.steps.length) {
					return html`<div>Loading...</div>`
				}

				const currentStepConfig = configData.steps.find(s => s.id === currentStep)

				if (!currentStepConfig) {
					return html`<div>
						Step "${currentStep}" not found. Available: ${configData.steps.map(s => s.id).join(', ')}
					</div>`
				}

				return currentStepConfig.template(this)
			}}
		</div> `
	}

	nextStep() {
		this.dispatchEvent(
			new CustomEvent('next-step', {
				bubbles: true,
				composed: true,
			}),
		)
	}

	previousStep() {
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
		}

		.route-content {
			width: 100%;
			height: 100%;
		}
	`
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			'route-views': ElementAttributes<RouteViews, RouteViewsAttributes>
		}
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'route-views': RouteViews
	}
}
