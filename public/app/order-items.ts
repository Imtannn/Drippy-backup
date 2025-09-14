import {css, Element, element, html} from 'lume'
import '../elements/back-button.js'
import '../elements/bottom-sheet.js'
import '../elements/home-button.js'
import '../elements/logic/for-each.js'
import '../elements/logo-button.js'
import '../elements/show-on-device.js'
import '../elements/theme-switch-button.js'
import {appStyles} from '../styles/app-styles.js'
import type {Template, TemplateCategory} from '../types/template.js'
import './app-buttons.js'
import './buy-button.js'
import './share-button.js'
import {store} from './store.js'

@element
export class OrderItems extends Element {
	static elementName = 'order-items'

	// Load existing selections when component connects
	connectedCallback() {
		super.connectedCallback()

		// Initialize all selected templates as checked
		store.initializeOrderItems()
	}

	#onBackButtonClick = () => {
		store.navigateTo = 'preview'
	}

	#onHomeButtonClick = () => {
		const url = window.location.pathname
		let search = window.location.search
		search = search.replace('isPreview=true', '')
		window.history.replaceState({}, '', `${url}${search}`)
		store.resetState()
		store.navigateTo = 'template'
	}

	#onNextClick = () => {
		store.navigateTo = 'order-size'
	}

	#onItemToggle = (category: TemplateCategory) => {
		store.toggleOrderItem(category)
	}

	#onShareClick = () => {
		// copy current url to clipboard
		console.log('Share my drip clicked')
		navigator.clipboard.writeText(window.location.href)
		alert('Link copied to clipboard')
	}

	#onBuyItClick = () => {
		store.navigateTo = 'preview'
	}

	#captureItemScreenshot = (category: TemplateCategory): string => {
		console.log('captureItemScreenshot for category:', category)

		// Find the drippy-app element
		const app = document.querySelector('drippy-app') as any
		if (!app?.shadowRoot) return ''

		// Get the drippy-scene
		const scene = app.shadowRoot.querySelector('drippy-scene') as any
		if (!scene?.shadowRoot) return ''

		// Get the lume-scene
		const lumeScene = scene.shadowRoot.querySelector('lume-scene') as any
		if (!lumeScene?.shadowRoot) return ''

		// Get all garment models (cloth items) - they're direct children of lume-scene
		const clothModels = lumeScene.querySelectorAll('lume-gltf-model[data-cloth]')
		console.log('found cloth models:', clothModels.length)

		// Debug: log model IDs
		clothModels.forEach((model: any, index: number) => {
			console.log(`model ${index} ID:`, model.getAttribute('id'))
		})

		// Simple approach: hide all garments except the target category
		const modelsToHide: any[] = []
		console.log(`hiding models that don't start with "${category}-"`)

		clothModels.forEach((model: any) => {
			const modelId = model.getAttribute('id') || ''
			const shouldKeep = modelId.startsWith(category + '-')
			console.log(`model ${modelId}: ${shouldKeep ? 'KEEP' : 'HIDE'}`)

			if (!shouldKeep) {
				// Hide the Three.js object instead of CSS display
				console.log(`hiding model: ${modelId}`)
				if (model.three) {
					console.log(`setting model.three.visible = false for ${modelId}`)
					model.three.visible = false
					modelsToHide.push(model)
				} else {
					console.log(`no model.three found for ${modelId}`)
				}
			}
		})

		console.log(`total models to hide: ${modelsToHide.length}`)

		// Also hide avatar, scene, and other elements
		const otherModelsToHide: any[] = []

		// Hide avatar
		const avatarModel = lumeScene.querySelector('#avatar')
		if (avatarModel?.three) {
			console.log('hiding avatar')
			avatarModel.three.visible = false
			otherModelsToHide.push(avatarModel)
		}

		// Hide scene/background
		const sceneModel = lumeScene.querySelector('#scene')
		if (sceneModel?.three) {
			console.log('hiding scene')
			sceneModel.three.visible = false
			otherModelsToHide.push(sceneModel)
		}

		// Hide shoes and any other non-cloth models
		const allOtherModels = lumeScene.querySelectorAll('lume-gltf-model:not([data-cloth])')
		console.log('found other models (non-cloth):', allOtherModels.length)
		allOtherModels.forEach((model: any) => {
			const modelId = model.getAttribute('id') || 'unnamed'
			if (model.three && modelId !== 'avatar' && modelId !== 'scene') {
				console.log(`hiding other model: ${modelId}`)
				model.three.visible = false
				otherModelsToHide.push(model)
			}
		})

		// Move lume-camera-rig using position to focus on the item
		const cameraRig = lumeScene.querySelector('lume-camera-rig')
		let originalPosition: string | null = null
		let originalDistance: string | null = null

		if (cameraRig) {
			// Store original values
			originalPosition = cameraRig.getAttribute('position') || '0 -1 0'
			originalDistance = cameraRig.getAttribute('distance') || '9'

			console.log(`moving camera-rig for ${category} - original position: ${originalPosition}`)

			// Move camera-rig position to focus on the specific garment
			if (category === 'Shirt') {
				cameraRig.setAttribute('position', '0 0.5 0') // Focus higher for shirt
				cameraRig.setAttribute('distance', '4')
			} else if (category === 'Pants') {
				cameraRig.setAttribute('position', '0 -0.5 0') // Focus lower for pants
				cameraRig.setAttribute('distance', '4')
			} else {
				cameraRig.setAttribute('position', '0 0 0') // Center for other items
				cameraRig.setAttribute('distance', '4')
			}
		}

		// Get canvas and renderer
		const canvas = lumeScene.shadowRoot.querySelector('canvas')
		if (!canvas) return ''

		const renderer = lumeScene.glRenderer || lumeScene._glRenderer || lumeScene.renderer
		let screenshot = ''

		if (renderer) {
			const threeScene = lumeScene.three || renderer.scene
			const threeCamera = lumeScene.camera?.three || lumeScene.three?.camera

			if (threeScene && threeCamera) {
				renderer.render(threeScene, threeCamera)
				screenshot = renderer.domElement.toDataURL('image/png')
			}
		}

		if (!screenshot) {
			screenshot = canvas.toDataURL('image/png')
		}

		// Restore hidden models
		modelsToHide.forEach(model => {
			if (model.three) {
				console.log(`restoring model.three.visible = true for ${model.getAttribute('id')}`)
				model.three.visible = true
			}
		})

		// Restore avatar and scene
		otherModelsToHide.forEach(model => {
			if (model.three) {
				console.log(`restoring ${model.getAttribute('id')}`)
				model.three.visible = true
			}
		})

		// Restore camera-rig position
		if (cameraRig && originalPosition && originalDistance) {
			console.log(`restoring camera-rig - position: ${originalPosition}, distance: ${originalDistance}`)
			cameraRig.setAttribute('position', originalPosition)
			cameraRig.setAttribute('distance', originalDistance)
		}

		return screenshot
	}

	template = () => html`
		<app-buttons-left>
			<app-buttons-group group-direction="row">
				<back-button onclick=${this.#onBackButtonClick}></back-button>
				<home-button onclick=${this.#onHomeButtonClick}></home-button>
			</app-buttons-group>
		</app-buttons-left>

		<app-buttons-right>
			<app-buttons-group>
				<!-- <theme-switch-button></theme-switch-button> -->
				<logo-button brand-name="MoiDien"></logo-button>
			</app-buttons-group>
		</app-buttons-right>

		<show-on-device device="desktop">
			<app-buttons-right layout="bottom">
				<app-buttons-group custom-style="gap: 34px;" group-direction="row">
					<share-button onclick=${this.#onShareClick}></share-button>
					<buy-button onclick=${this.#onBuyItClick}></buy-button>
				</app-buttons-group>
			</app-buttons-right>
		</show-on-device>

		<bottom-sheet float-direction="right" max-height="calc(100vh - 20rem)">
			<div class="order-container">
				<!-- Items List -->
				<div class="items-list">
					<for-each
						items=${() => Array.from(store.selectedTemplates.entries())}
						content=${() =>
							([category, template]: [TemplateCategory, Template]) => html`
								<div class="item-row">
									<div
										class="checkbox-icon"
										classList=${() => ({checked: store.selectedOrderItems.get(category) || false})}
										onclick=${() => this.#onItemToggle(category)}
									>
										<svg width="15" height="16" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
											<rect y="0.569336" width="15" height="15" rx="7.5" fill="var(--uiColorAccentViolet)" />
											<path
												d="M11 5.56934L7.64637 9.63434C7.24639 10.1192 6.50361 10.1192 6.10363 9.63434L5 8.29661"
												stroke="white"
												stroke-width="1.2"
												stroke-linecap="round"
												stroke-linejoin="round"
											/>
										</svg>
									</div>
									<div class="item-image">
										<img src=${() => this.#captureItemScreenshot(category) || template.thumb} alt=${template.name} />
									</div>
									<div class="item-details">
										<div class="item-name">Product name</div>
										<div class="item-price-row">
											<span class="item-price">$125.00</span>
											<span class="item-moq" classList=${() => ({visible: store.selectedSpace?.isWholesale})}
												>MOQ: 5 pcs</span
											>
										</div>
									</div>
								</div>
							`}
					></for-each>
				</div>

				<!-- Spacer to push button to bottom -->
				<div class="button-spacer"></div>

				<button class="order-button" onclick=${this.#onNextClick}>Continue to order</button>
			</div>
		</bottom-sheet>
	`

	css = css/*css*/ `
		${appStyles}

		.items-list {
			display: flex;
			flex-direction: column;
			gap: var(--uiSpacingMedium);
			padding-top: var(--uiSpacing);
		}

		.item-row {
			display: flex;
			align-items: center;
			gap: var(--uiSpacingMedium);
		}

		.checkbox-icon {
			cursor: pointer;
			opacity: 0.1;
			transition: var(--transitionFast);

			&.checked {
				opacity: 1 !important;

				&:hover {
					opacity: 1;
				}
			}

			&:not(.checked) {
				opacity: 0.1 !important;

				&:hover {
					opacity: 0.3;
				}
			}
		}

		.item-image {
			width: 60px;
			height: 60px;
			border-radius: var(--borderRadiusSmall);
			overflow: hidden;
			background: var(--uiColorPrimaryLightGrey);

			img {
				width: 100%;
				height: 100%;
				object-fit: cover;
			}
		}

		.item-details {
			flex: 1;
		}

		.item-name {
			font-size: var(--fontSizeTextMd);
			font-weight: var(--fontWeightSemiBold);
			font-family: var(--fontFamily);
			color: var(--uiColorPrimaryBlack);
			margin-bottom: var(--uiSpacingTiny);
		}

		.item-price-row {
			display: flex;
			align-items: center;
			gap: var(--uiSpacingSmall);
		}

		.item-price {
			font-size: var(--fontSizeTextSm);
			font-family: var(--fontFamily);
			color: var(--uiColorSecondaryLightGrey);
		}

		.item-moq {
			font-size: var(--fontSizeTextSm);
			font-family: var(--fontFamily);
			color: var(--uiColorSecondaryLightGrey);
			opacity: 0;

			&.visible {
				opacity: 1;
			}
		}

		.button-spacer {
			flex: 1;
			min-height: 40px;
		}

		.item-image {
			width: 60px;
			height: 60px;
			border-radius: var(--borderRadiusSmall);
			overflow: hidden;
			background: var(--uiColorPrimaryLightGrey);

			img {
				width: 100%;
				height: 100%;
				object-fit: cover;
			}
		}

		.item-details {
			flex: 1;
		}

		.item-name {
			font-size: var(--fontSizeTextMd);
			font-weight: var(--fontWeightSemiBold);
			font-family: var(--fontFamily);
			color: var(--uiColorPrimaryBlack);
			margin-bottom: var(--uiSpacingTiny);
		}

		.item-price-row {
			display: flex;
			align-items: center;
			gap: var(--uiSpacingSmall);
		}

		.item-price {
			font-size: var(--fontSizeTextSm);
			font-family: var(--fontFamily);
			color: var(--uiColorSecondaryLightGrey);
		}

		.item-moq {
			font-size: var(--fontSizeTextSm);
			font-family: var(--fontFamily);
			color: var(--uiColorSecondaryLightGrey);
			opacity: 0;

			&.visible {
				opacity: 1;
			}
		}
	`
}

declare global {
	interface HTMLElementTagNameMap {
		'order-items': OrderItems
	}
}
