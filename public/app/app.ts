import {css, Element, element, html, signal} from 'lume'
import '../elements/avatar-page.js'
import '../elements/back-button.js'
import '../elements/blocks-page.js'
import '../elements/bottom-sheet.js'
import '../elements/login-ui.js'
import '../elements/PreviewMeasurementPage.js'
import '../elements/PreviewPage.js'
import {RouteViews, type RouteViewsConfig} from '../elements/route-views.js'
import '../elements/show-when.js'
import '../elements/SpacesPage.js'
import '../elements/SuccessPage.js'
import '../elements/tabs.js'
import '../elements/theme-switch.js'
import '../routes.js' // track page visits
import './drippy-scene.js'

const sceneBackground = new URL('../images/background-1.jpeg', import.meta.url)

// Hide the loading cover
const loadingCover = document.getElementById('loadingCover')
loadingCover?.classList.add('invisible')
loadingCover?.addEventListener('transitionend', () => loadingCover.remove())

const appStepFlow = (
	_config: {
		// title: string
		showBackButton: boolean
	},
	content: any,
	_onBack: () => void,
) => html` <div class="app-step">${content}</div> `

@element
export class DrippyApp extends Element {
	static elementName = 'drippy-app'

	@signal currentStep = 'avatar'

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
		const steps = this.#appConfig.steps.map(s => s.id)
		const currentIndex = steps.indexOf(this.currentStep)
		if (currentIndex !== -1 && currentIndex < steps.length - 1) {
			this.currentStep = steps[currentIndex + 1]
		}
	}

	#handleBackStep = () => {
		const steps = this.#appConfig.steps.map(s => s.id)
		const currentIndex = steps.indexOf(this.currentStep)
		if (currentIndex !== -1 && currentIndex > 0) {
			this.currentStep = steps[currentIndex - 1]
		}
	}

	#appConfig: RouteViewsConfig = {
		steps: [
			{
				id: 'avatar',
				template: (routeViews: RouteViews) =>
					appStepFlow(
						{showBackButton: false},
						html` <avatar-page></avatar-page>
							<div class="">
								<button class="save-btn" onClick=${() => routeViews.nextStep()}>Save</button>
							</div>`,
						() => routeViews.previousStep(),
					),
			},
			{
				id: 'space',
				template: (routeViews: RouteViews) =>
					appStepFlow(
						{showBackButton: true},
						html`
							<spaces-page></spaces-page>
							<button class="space-btn-back" onClick=${() => routeViews.previousStep()}>Back</button>
							<button class="space-btn-next" onClick=${() => routeViews.nextStep()}>Next</button>
						`,
						() => routeViews.previousStep(),
					),
			},
			{
				id: 'blocks',
				template: (routeViews: RouteViews) =>
					appStepFlow(
						{showBackButton: true},
						html`
							<div class="step-header">
								<back-button onclick=${() => routeViews.previousStep()}></back-button>
								<button class="preview-btn" onClick=${() => routeViews.nextStep()}>Preview</button>
							</div>
							<blocks-page></blocks-page>
						`,
						() => routeViews.previousStep(),
					),
			},
			{
				id: 'preview',
				template: (routeViews: RouteViews) =>
					appStepFlow(
						{showBackButton: true},
						html`
							<preview-page></preview-page>
							<button class="preview-btn-back" onclick=${() => routeViews.previousStep()}>Back</button>
							<button class="preview-btn-next" onclick=${() => routeViews.nextStep()}>Next</button>
						`,
						() => routeViews.previousStep(),
					),
			},
			{
				id: 'preview-measurement',
				template: (routeViews: RouteViews) =>
					appStepFlow(
						{showBackButton: true},
						html`
							<preview-measurement-page></preview-measurement-page>
							<button class="preview-m-btn-back" onclick=${() => routeViews.previousStep()}>Back</button>
							<button class="preview-m-btn-next" onclick=${() => routeViews.nextStep()}>Next</button>
						`,
						() => routeViews.previousStep(),
					),
			},
			{
				id: 'success',
				template: (routeViews: RouteViews) =>
					appStepFlow(
						{showBackButton: false},
						html`
								<success-page></success-page>
								<button class="success-btn-back" onclick=${() => routeViews.previousStep()}>Back</button>
							</div>
						`,
						() => {},
					),
			},
		],
	}

	template = () => html`
		<drippy-scene style=${`background: url(${sceneBackground.href}) center / cover no-repeat`}></drippy-scene>
		<route-views config=${this.#appConfig} current-step=${() => this.currentStep}></route-views>
	`

	css = css`
		:host {
			display: grid;
			grid-template-areas: 'stack';
			width: 100vw;
			height: 100vh;
		}

		drippy-scene {
			grid-area: stack;
			width: 100%;
			height: 100%;
		}

		route-views {
			grid-area: stack;
			width: 100%;
			height: 100%;
		}
	`
}
