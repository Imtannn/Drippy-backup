import {css, Element, element, html, Index, type ElementAttributes} from 'lume'
import {store} from './store.js'
import {templates} from '../consts/templates.js'
import {getBlocksForTemplate, getFabricForTemplate} from '../consts/relationships.js'
import './app-buttons.js'
import './item-card.js'
import '../elements/bottom-sheet.js'
import '../elements/tabs.js'
import './drip-it-button.js'
import '../elements/theme-switch-button.js'
import '../elements/back-button.js'
import '../elements/logo-button.js'
import '../elements/person-button.js'
import '../elements/cube-button.js'

type TemplateViewAttributes = keyof {}

@element
export class TemplateView extends Element {
	static readonly elementName = 'template-view'

	connectedCallback() {
		super.connectedCallback()
	}

	#onItemClick = (e: CustomEvent) => {
		const template = e.detail.itemValue

		// Set the selected template
		store.setSelectedTemplate = template

		// Get blocks for this template using relationships
		const templateBlocks = getBlocksForTemplate(template, 'speed')

		// Get fabric for this template
		const templateFabric = getFabricForTemplate(template, 'speed')

		console.log('template', template)
		console.log('templateBlocks', templateBlocks)
		console.log('templateFabric', templateFabric)

		// Set the blocks and fabric
		store.replaceSelectedBlocks = templateBlocks

		store.setSelectedFabrics = templateFabric || null
	}

	#onDripItClick = () => {
		store.navigateTo = 'blocks'
	}

	#onBackButtonClick = () => {
		const searchParams = new URLSearchParams(window.location.search)
		searchParams.delete('scene')
		window.history.replaceState({}, '', `?${searchParams.toString()}`)
		store.selectScene = null
		store.navigateTo = 'scene'
	}

	template = () => html`
	<app-buttons-left>
		<app-buttons-group>
			<back-button onclick=${this.#onBackButtonClick}></back-button>
		</app-buttons-group>
	</app-buttons-left>

	<app-buttons-right>
	<app-buttons-group>
		<!-- <theme-switch-button></theme-switch-button> -->
		<logo-button brand-name="Speed"></logo-button>
	</app-buttons-group>
	<app-buttons-group>
		<person-button disabled></person-button>
		<cube-button disabled></cube-button>
	</app-buttons-group>
</app-buttons-right>

	<app-buttons-right layout="bottom">
		<app-buttons-group>
			<drip-it-button onclick=${this.#onDripItClick}></drip-it-button>
		</app-buttons-group>
	</app-buttons-right>

	<bottom-sheet>
			<div class="templates-content-container">
					<div class="items-grid">
						<${Index} each=${templates.speed}>
							${(template: () => (typeof templates.speed)[number]) => html`
								<div class="template-item">
									<item-card
										item-active=${() => store.selectedTemplate?._id === template()._id}
										item-src=${template().thumb}
										item-alt=${template().name}
										item-value=${template()}
										oncardselected=${this.#onItemClick}
										object-fit="contain"
										aspect-ratio="0.79"
									></item-card>
									<div class="template-product-name">Product Name</div>
									<div class="template-product-price">~€ 125.00</div>
								</div>
							`}
						</>
			</div>
		</bottom-sheet>
	`

	css = css/*css*/ `
		:host {
			display: contents;
		}

		.items-grid {
			display: grid;
			grid-template-columns: repeat(3, 1fr);
			gap: 10px;
		}

		.templates-content-container {
			padding: 20px;
			padding-top: 5px;
		}

		.template-item {
			width: 100%;
			height: 100%;
			display: flex;
			flex-direction: column;
			gap: 5px;
		}

		.template-product-name {
			font-size: 12px;
			font-weight: 600;
			color: #424347;
		}

		.template-product-price {
			font-size: 12px;
			font-weight: 400;
			color: #424347;
		}
	`
}

declare global {
	interface HTMLElementTagNameMap {
		'template-view': TemplateView
	}
}

declare module 'lume' {
	interface IntrinsicElements {
		'template-view': ElementAttributes<TemplateView, TemplateViewAttributes>
	}
}
