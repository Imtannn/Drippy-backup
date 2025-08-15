import {Element, element, html, signal} from 'lume'
import '../elements/PreviewMeasurementPage.js'
import '../elements/PreviewPage.js'
import '../elements/SpacesPage.js'
import '../elements/SuccessPage.js'
import '../elements/back-button.js'
import '../elements/bottom-sheet.js'
import '../elements/login-ui.js'
import {RouteViews, type RouteViewsConfig} from '../elements/route-views.js'
import '../elements/show-when.js'
import '../elements/tabs.js'
import '../elements/theme-switch.js'
import '../routes.js' // track page visits
import './drippy-scene.js'

// Background image for the drippy scene
// const sceneBackground = new URL('../images/background-1.jpeg', import.meta.url)
const avatarThumb = new URL('../images/avatar-female-tmp.png', import.meta.url)

// const blocks: Block[] = [
// 	{
// 		_id: '1',
// 		thumb: new URL('../images/piece_1.png', import.meta.url),
// 		modelFile: new URL('../models/Bodice 228.gltf', import.meta.url),
// 		blockName: 'Bodice 228',
// 		avatar: 'Female',
// 		category: 'Bodice',
// 	},
// 	{
// 		_id: '2',
// 		thumb: new URL('../images/piece_2.png', import.meta.url),
// 		modelFile: new URL('../models/Bodice 350.gltf', import.meta.url),
// 		blockName: 'Bodice 350',
// 		avatar: 'Female',
// 		category: 'Bodice',
// 	},
// 	{
// 		_id: '3',
// 		thumb: new URL('../images/piece_3.png', import.meta.url),
// 		modelFile: new URL('../models/skirt-168.gltf', import.meta.url),
// 		blockName: 'skirt168',
// 		avatar: 'Female',
// 		category: 'Skirt',
// 	},
// 	{
// 		_id: '4',
// 		thumb: new URL('../images/piece_4.png', import.meta.url),
// 		modelFile: new URL('../models/Bodice 358.gltf', import.meta.url),
// 		blockName: 'Bodice 358',
// 		avatar: 'Female',
// 		category: 'Bodice',
// 	},
// 	{
// 		_id: '6',
// 		thumb: new URL('../images/piece_6.png', import.meta.url),
// 		modelFile: new URL('../models/Skirt 351.gltf', import.meta.url),
// 		blockName: 'Skirt 351',
// 		avatar: 'Female',
// 		category: 'Skirt',
// 	},
// 	{
// 		_id: '7',
// 		thumb: new URL('../images/piece_1.png', import.meta.url),
// 		modelFile: new URL('../models/Sleeves 399.gltf', import.meta.url),
// 		blockName: 'Sleeves 399',
// 		avatar: 'Female',
// 		category: 'Sleeves',
// 	},
// ]
// Legacy view switching - kept for potential console debugging
// const [view, setView] = createSignal('avatar')
// ;(window as any).setView = setView

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

	@signal selectedTab = 'blocks'
	@signal selectedCategory = 'Bodice'
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
		console.log('$$$$$$$$$$$$$ next step', this.currentStep, steps.indexOf(this.currentStep))
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
						html`<drippy-scene></drippy-scene>

							<section id="panel">
								<div class="genders">
									<button class="female selected">Women</button>
									<button class="male">Men</button>
								</div>

								<div class="grid">
									<div class="block">
										<img src=${avatarThumb} alt="Female avatar" />
									</div>
									<div class="block">
										<img src=${avatarThumb} alt="Female avatar" />
									</div>
									<div class="block">
										<img src=${avatarThumb} alt="Female avatar" />
									</div>
									<div class="block">
										<img src=${avatarThumb} alt="Female avatar" />
									</div>
									<div class="block">
										<img src=${avatarThumb} alt="Female avatar" />
									</div>
									<div class="block">
										<img src=${avatarThumb} alt="Female avatar" />
									</div>
								</div>
							</section>
							<div class="">
								<button class="save-btn" onClick=${() => routeViews.nextStep()}>Save</button>
							</div>`,
						() => routeViews.previousStep(),
					),
			},
			// {
			// 	id: 'blocks',
			// 	template: (routeViews: RouteViews) =>
			// 		appStepFlow(
			// 			{showBackButton: true},
			// 			html`
			// 					<drippy-scene
			// 						id="drippy-scene"
			// 						style=${`background: url(${sceneBackground.href}) center / cover no-repeat`}
			// 					></drippy-scene>

			// 					<div class="step-header">
			// 						<back-button onclick=${() => routeViews.previousStep()}></back-button>
			// 						<button class="preview-btn">Preview</button>
			// 					</div>
			// 					<bottom-sheet>

			// 						<tabs-provider
			// 							default-value=${() => this.selectedTab}
			// 							ontabchange=${(e: CustomEvent) => {
			// 								console.log('onchange', e)
			// 								this.selectedTab = e.detail.value
			// 							}}
			// 						>
			// 							<div class="tabs-container">
			// 								<tabs-list>
			// 									<tabs-trigger selected-value="blocks">Blocks</tabs-trigger>
			// 									<tabs-trigger selected-value="fabrics">Fabrics</tabs-trigger>
			// 									<tabs-trigger selected-value="accessories">Accessories</tabs-trigger>
			// 								</tabs-list>
			// 							</div>

			// 							<div class="divider"></div>

			// 							<div class="tabs-content-container">
			// 								<tabs-content selected-value="blocks">
			// 									<div class="category-tabs">
			// 										<button class="category-tab" classList=${() => ({active: this.selectedCategory === 'Bodice'})} onclick=${() => (this.selectedCategory = 'Bodice')}>Bodice</button>
			// 										<button class="category-tab" classList=${() => ({active: this.selectedCategory === 'Skirt'})} onclick=${() => (this.selectedCategory = 'Skirt')}>Skirt</button>
			// 										<button class="category-tab" classList=${() => ({active: this.selectedCategory === 'Sleeves'})} onclick=${() => (this.selectedCategory = 'Sleeves')}>Sleeves</button>
			// 									</div>
			// 									<div class="items-grid">
			// 										<${For} each=${() => blocks.filter(block => block.category === this.selectedCategory)}>
			// 										${(block: (typeof blocks)[number]) => html`
			// 											<div
			// 												class="item-card"
			// 												classList=${() => ({
			// 													active: store.selectedBlocks.get(block.category)?._id === block._id,
			// 												})}
			// 												onclick=${() => {
			// 													store.setSelectedBlocks = block
			// 												}}
			// 											>
			// 												<div class="item-preview">
			// 													<img class="item-thumb" src=${() => block.thumb} alt=${() => block.blockName} />
			// 												</div>
			// 											</div>
			// 										`}
			// 										</>
			// 								</tabs-content>

			// 								<tabs-content selected-value="fabrics">
			// 									<div class="items-grid">
			// 										<div class="item-card">
			// 											<div class="item-preview fabric"></div>
			// 										</div>
			// 										<div class="item-card">
			// 											<div class="item-preview fabric"></div>
			// 										</div>
			// 										<div class="item-card">
			// 											<div class="item-preview fabric"></div>
			// 										</div>
			// 									</div>
			// 								</tabs-content>

			// 								<tabs-content selected-value="accessories">
			// 									<div class="items-grid">
			// 										<div class="item-card">
			// 											<div class="item-preview accessory"></div>
			// 										</div>
			// 										<div class="item-card">
			// 											<div class="item-preview accessory"></div>
			// 										</div>
			// 									</div>
			// 								</tabs-content>
			// 							</div>
			// 						</tabs-provider>
			// 					</bottom-sheet>
			// 				`,
			// 			() => routeViews.previousStep(),
			// 		),
			// },
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

	template = () => html` <route-views current-step=${() => this.currentStep} config=${this.#appConfig}></route-views> `
}
