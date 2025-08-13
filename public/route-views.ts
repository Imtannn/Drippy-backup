import {element, Element, html, jsonAttribute, signal, type ElementAttributes} from 'lume'

interface RouteViewsConfig {
	steps: {
		id: string
		template: (routeViews: RouteViews) => any
	}[]

	initialStep?: string
}

export type RouteViewsAttributes = 'config'

@element
export class RouteViews extends Element {
	static readonly elementName = 'route-views'

	@jsonAttribute config: RouteViewsConfig = {steps: []}

	@signal currentStep: string = ''

	connectedCallback() {
		super.connectedCallback()

		if (!this.currentStep && this.config.steps.length > 0) {
			this.currentStep = this.config.initialStep || this.config.steps[0].id
		}
	}

	template = () => {
		if (!this.config.steps.length) return html`<div>No steps configured</div>`

		return html`${this.config.steps.map(
			step =>
				html` <show-when
					condition=${() => this.currentStep === step.id}
					content=${() => step.template(this)}
				></show-when>`,
		)}`
	}

	goToStep(stepId: string) {
		const stepExists = this.config.steps.some(step => step.id === stepId)
		if (stepExists) {
			this.currentStep = stepId
		}
	}

	nextStep() {
		const currentIndex = this.config.steps.findIndex(step => step.id === this.currentStep)
		if (currentIndex !== -1 && currentIndex < this.config.steps.length - 1) {
			this.currentStep = this.config.steps[currentIndex + 1].id
		}
	}

	previousStep() {
		const currentIndex = this.config.steps.findIndex(step => step.id === this.currentStep)
		if (currentIndex !== -1 && currentIndex > 0) {
			this.currentStep = this.config.steps[currentIndex - 1].id
		}
	}

	getCurrentStepIndex() {
		return this.config.steps.findIndex(step => step.id === this.currentStep)
	}

	isFirstStep() {
		return this.getCurrentStepIndex() === 0
	}

	isLastStep() {
		return this.getCurrentStepIndex() === this.config.steps.length - 1
	}

	render() {
		return html`<div>RouteViews</div>`
	}
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
