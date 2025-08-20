import {css, Element, element, html, signal} from 'lume'

import '../elements/avatar-page.js'
import '../elements/back-button.js'
import '../elements/blocks-page.js'

import '../elements/back-button.js'
import '../elements/preview-measurement-page.js'
import '../elements/preview-page.js'
import '../elements/spaces-page.js'
import '../elements/success-page.js'

import '../elements/bottom-sheet.js'
import '../elements/cube-button.js'
import '../elements/login-ui.js'

import {RouteViews, type RouteViewsConfig} from '../elements/route-views.js'

import '../elements/person-button.js'
import '../elements/redo-button.js'
import '../elements/refresh-button.js'

import '../elements/show-when.js'
import '../elements/tabs.js'
import '../elements/theme-switch.js'

import '../elements/undo-button.js'

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
) => html` <div class="app-step">${content}</div>`

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
					appStepFlow({showBackButton: false}, html` <avatar-page></avatar-page>`, () => routeViews.previousStep()),
			},
			{
				id: 'space',
				template: (routeViews: RouteViews) =>
					appStepFlow({showBackButton: true}, html` <spaces-page></spaces-page>`, () => routeViews.previousStep()),
			},
			{
				id: 'blocks',
				template: (routeViews: RouteViews) =>
					appStepFlow({showBackButton: true}, html` <blocks-page></blocks-page> `, () => routeViews.previousStep()),
			},
			{
				id: 'preview',
				template: (routeViews: RouteViews) =>
					appStepFlow({showBackButton: true}, html` <preview-page></preview-page>`, () => routeViews.previousStep()),
			},
			{
				id: 'preview-measurement',
				template: (routeViews: RouteViews) =>
					appStepFlow({showBackButton: true}, html` <preview-measurement-page></preview-measurement-page>`, () =>
						routeViews.previousStep(),
					),
			},
			{
				id: 'success',
				template: (routeViews: RouteViews) =>
					appStepFlow({showBackButton: false}, html` <success-page></success-page>`, () => routeViews.previousStep()),
			},
		],
	}

	template = () => html`
		<div class="app-layout">
			<drippy-scene
				class=${() => (this.currentStep === 'space' ? 'hidden' : '')}
				style=${`background: url(${sceneBackground.href}) center / cover no-repeat`}
			></drippy-scene>
			<route-views
				config=${this.#appConfig}
				current-step=${() => this.currentStep}
				class=${() => (this.currentStep === 'space' ? 'full-screen' : '')}
			></route-views>
			<div class="button-overlay">${() => this.#renderButtons()}</div>
		</div>
	`

	#renderButtons() {
		switch (this.currentStep) {
			case 'avatar':
				return html`<button class="save-btn" onClick=${() => this.#handleNextStep()}>Save</button>`
			case 'space':
				return html`
					<button class="space-btn-back" onClick=${() => this.#handleBackStep()}>Back</button>
					<button class="space-btn-next" onClick=${() => this.#handleNextStep()}>Next</button>
				`
			case 'blocks':
				return html`
					<back-button onclick=${() => this.#handleBackStep()}></back-button>
					<button class="preview-btn" onClick=${() => this.#handleNextStep()}>Preview</button>
				`
			case 'preview':
				return html`
					<button class="preview-btn-back" onclick=${() => this.#handleBackStep()}>Back</button>
					<button class="preview-btn-next" onclick=${() => this.#handleNextStep()}>Next</button>
				`
			case 'preview-measurement':
				return html`
					<button class="preview-m-btn-back" onclick=${() => this.#handleBackStep()}>Back</button>
					<button class="preview-m-btn-next" onclick=${() => this.#handleNextStep()}>Next</button>
				`
			case 'success':
				return html`<button class="success-btn-back" onclick=${() => this.#handleBackStep()}>Back</button>`
			default:
				return ''
		}
	}

	css = css`
		:host {
			display: block;
			position: relative;
			width: 100%;
			height: 100%;
			overflow: hidden;
			box-sizing: border-box;
		}

		.app-layout {
			position: relative;
			width: 100%;
			height: 100%;
			overflow: hidden;
		}

		drippy-scene {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			z-index: 1;
		}

		drippy-scene.hidden {
			display: none;
		}

		route-views {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			z-index: 2;
			pointer-events: none;
			overflow: hidden;
		}

		route-views.full-screen {
			width: 100vw;
			height: 100vh;
			left: 0;
			top: 0;
			overflow: hidden;
		}

		.button-overlay {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			z-index: 3;
			pointer-events: none;
		}

		.button-overlay > * {
			pointer-events: auto;
		}
	`
}
