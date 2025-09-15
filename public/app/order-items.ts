import {css, Element, element, html, signal} from 'lume'
import * as THREE from 'three'
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

	// Cache for screenshots using Lume signals
	@signal private screenshotCache = new Map<TemplateCategory, string>()

	// Load existing selections when component connects
	connectedCallback() {
		super.connectedCallback()

		// Initialize all selected templates as checked
		store.initializeOrderItems()

		// Pre-generate screenshots for all selected templates
		this.generateScreenshots()
	}

	private async generateScreenshots() {
		for (const [category] of store.selectedTemplates.entries()) {
			try {
				const screenshot = await this.#captureItemScreenshot(category)

				// Update the signal to trigger reactive updates
				const newCache = new Map(this.screenshotCache)
				newCache.set(category, screenshot)
				this.screenshotCache = newCache
			} catch (error) {
				console.warn(`Failed to generate screenshot for ${category}:`, error)
			}
		}
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
		navigator.clipboard.writeText(window.location.href)
		alert('Link copied to clipboard')
	}

	#onBuyItClick = () => {
		store.navigateTo = 'preview'
	}

	#captureItemScreenshot = async (category: TemplateCategory): Promise<string> => {
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

		// Simple approach: hide all garments except the target category (no scaling)
		const modelsToHide: any[] = []

		clothModels.forEach((model: any) => {
			const modelId = model.getAttribute('id') || ''
			const shouldKeep = modelId.startsWith(category + '-')

			if (!shouldKeep) {
				// Hide the Three.js object instead of CSS display
				if (model.three) {
					model.three.visible = false
					modelsToHide.push(model)
				}
			}
		})

		// Hide scene and other elements
		const otherModelsToHide: any[] = []

		// Use drippy-scene's avatarModel property to hide avatar
		const drippyScene = scene as any

		if (drippyScene && drippyScene.avatarModel) {
			// Selectively hide only avatar body (not garments)
			let hiddenAvatarParts: any[] = []

			drippyScene.avatarModel.three.children.forEach((child: any) => {
				const childName = child.name || ''
				const isGarment =
					childName.includes('LUME-GLTF-MODEL#') &&
					(childName.toLowerCase().includes('shirt') ||
						childName.toLowerCase().includes('pants') ||
						childName.toLowerCase().includes('accessories'))

				if (!isGarment) {
					// This is avatar body - hide it
					child.visible = false
					hiddenAvatarParts.push(child)
				}
			})

			if (hiddenAvatarParts.length > 0) {
				otherModelsToHide.push({restore: 'avatarParts', parts: hiddenAvatarParts})
				// Wait for the change to take effect
				await new Promise(resolve => requestAnimationFrame(resolve))
			}
		}

		// Hide scene/background
		const sceneModel = lumeScene.querySelector('#scene')
		if (sceneModel?.three) {
			sceneModel.three.visible = false
			otherModelsToHide.push(sceneModel)
		}

		// Hide shoes and any other non-cloth models
		const allOtherModels = lumeScene.querySelectorAll('lume-gltf-model:not([data-cloth])')
		allOtherModels.forEach((model: any) => {
			const modelId = model.getAttribute('id') || 'unnamed'
			if (model.three && modelId !== 'avatar' && modelId !== 'scene') {
				model.three.visible = false
				otherModelsToHide.push(model)
			}
		})

		// Create a new lume-perspective-camera for screenshot
		const screenshotCamera = document.createElement('lume-perspective-camera')

		// Set camera attributes based on garment type - using smaller values since Lume transforms them
		screenshotCamera.setAttribute('fov', '50') // Field of view
		screenshotCamera.setAttribute('near', '0.1') // Near clipping
		screenshotCamera.setAttribute('far', '1000') // Far clipping

		if (category === 'Shirt' || category === 'Dress') {
			screenshotCamera.setAttribute('position', '0 -1.1 0.5') // Closer to chest/torso area
			screenshotCamera.setAttribute('look-at', '0 -0.3 0') // Look at torso area
		} else if (category === 'Pants' || category === 'Skirt') {
			screenshotCamera.setAttribute('position', '0 -0.6 0.5') // Closer to legs area
			screenshotCamera.setAttribute('look-at', '0 -0.8 0') // Look at legs area
		} else {
			screenshotCamera.setAttribute('position', '0 0 0.7') // Closer default position
			screenshotCamera.setAttribute('look-at', '0 0 0') // Look at center
		}

		// Add camera to scene and make it active
		lumeScene.appendChild(screenshotCamera)
		screenshotCamera.setAttribute('active', 'true')

		// Wait for camera to be positioned and activated
		await new Promise(resolve => requestAnimationFrame(resolve))

		// Directly manipulate the Three.js camera object to override Lume transforms
		const threeCamera = (screenshotCamera as any).three
		if (threeCamera) {
			// Set position directly on Three.js camera - adjust Y position to frame garments properly
			if (category === 'Shirt' || category === 'Dress') {
				threeCamera.position.set(0, 1.2, 1) // Much closer for bigger appearance
				threeCamera.lookAt(0, 0, 0)
			} else if (category === 'Pants' || category === 'Skirt') {
				threeCamera.position.set(0, 0.7, 1) // Much closer for bigger appearance
				threeCamera.lookAt(0, -0.3, 0)
			} else {
				threeCamera.position.set(0, 0.4, 1) // Closer for default view
				threeCamera.lookAt(0, 0, 0) // Look at center
			}

			// Reset rotation to look straight ahead
			threeCamera.rotation.set(0, 0, 0) // Reset rotation to look straight
			threeCamera.updateMatrix()
			threeCamera.updateMatrixWorld(true)

			// Wait another frame for the direct position change
			await new Promise(resolve => requestAnimationFrame(resolve))
		}

		// Add delay to ensure 3D scene is rendered after scaling
		await new Promise(resolve => setTimeout(resolve, 100))

		// Get canvas and renderer
		const canvas = lumeScene.shadowRoot.querySelector('canvas')
		if (!canvas) {
			return ''
		}

		const renderer = lumeScene.glRenderer || lumeScene._glRenderer || lumeScene.renderer
		let screenshot = ''

		if (renderer) {
			const threeScene = lumeScene.three || renderer.scene
			const threeCamera = (screenshotCamera as any).three || lumeScene.camera?.three || lumeScene.three?.camera

			if (threeScene && threeCamera) {
				// Set a clean light background for product shots
				const originalBackground = renderer.getClearColor(new THREE.Color())
				const originalAlpha = renderer.getClearAlpha()
				renderer.setClearColor(0xf5f5f5, 1.0) // Light gray background

				renderer.render(threeScene, threeCamera)
				screenshot = renderer.domElement.toDataURL('image/png')

				// Restore original background
				renderer.setClearColor(originalBackground, originalAlpha)
			}
		}

		if (!screenshot) {
			screenshot = canvas.toDataURL('image/png')
		}

		// Restore hidden models
		modelsToHide.forEach(model => {
			if (model.three) {
				model.three.visible = true
			}
		})

		// Restore avatar and scene
		otherModelsToHide.forEach(model => {
			if (model.restore === 'avatarParts') {
				model.parts.forEach((part: any) => {
					part.visible = true
				})
			} else {
				if (model.three) {
					model.three.visible = true
				}
			}
		})

		// Remove screenshot camera and revert to main camera
		screenshotCamera.removeAttribute('active')
		lumeScene.removeChild(screenshotCamera)

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
										<img
											src=${() => {
												if (category === 'Accessories') {
													return template.thumb
												}
												const cached = this.screenshotCache.get(category)
												return cached || template.thumb
											}}
											alt=${template.name}
										/>
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
