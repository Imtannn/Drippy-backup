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
				console.log(`Generated screenshot for ${category}, length: ${screenshot.length}`)

				// Update the signal to trigger reactive updates
				const newCache = new Map(this.screenshotCache)
				newCache.set(category, screenshot)
				this.screenshotCache = newCache

				console.log(`Cache updated for ${category}, cache size: ${this.screenshotCache.size}`)
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
		console.log('Share my drip clicked')
		navigator.clipboard.writeText(window.location.href)
		alert('Link copied to clipboard')
	}

	#onBuyItClick = () => {
		store.navigateTo = 'preview'
	}

	#captureItemScreenshot = async (category: TemplateCategory): Promise<string> => {
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

		// Simple approach: hide all garments except the target category (no scaling)
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
			} else {
				console.log(`keeping model: ${modelId} at original scale`)
			}
		})

		console.log(`total models to hide: ${modelsToHide.length}`)

		// Hide scene and other elements
		const otherModelsToHide: any[] = []

		// Use drippy-scene's avatarModel property to hide avatar
		const drippyScene = scene as any
		let originalAvatarVisible: boolean | undefined

		if (drippyScene && drippyScene.avatarModel) {
			console.log('🔍 EXTENSIVE AVATAR MODEL DEBUG:')
			console.log('avatarModel type:', typeof drippyScene.avatarModel)
			console.log('avatarModel constructor:', drippyScene.avatarModel.constructor?.name)
			console.log('avatarModel properties:', Object.getOwnPropertyNames(drippyScene.avatarModel))

			// Check if it has three property
			if (drippyScene.avatarModel.three) {
				console.log('📊 avatarModel.three analysis:')
				console.log('  - three type:', typeof drippyScene.avatarModel.three)
				console.log('  - three constructor:', drippyScene.avatarModel.three.constructor?.name)
				console.log('  - children count:', drippyScene.avatarModel.three.children?.length)
				console.log('  - visible:', drippyScene.avatarModel.three.visible)

				// Analyze children
				if (drippyScene.avatarModel.three.children) {
					drippyScene.avatarModel.three.children.forEach((child: any, index: number) => {
						console.log(`  - Child ${index}:`, {
							name: child.name,
							type: child.constructor?.name,
							visible: child.visible,
							childrenCount: child.children?.length || 0,
						})

						// Look deeper into children for garments
						if (child.children && child.children.length > 0) {
							child.children.forEach((subChild: any, subIndex: number) => {
								const hasGarmentName =
									subChild.name &&
									(subChild.name.toLowerCase().includes('shirt') ||
										subChild.name.toLowerCase().includes('pants') ||
										subChild.name.toLowerCase().includes('accessories') ||
										subChild.name.toLowerCase().includes(category.toLowerCase()))
								console.log(`    - SubChild ${subIndex}:`, {
									name: subChild.name,
									type: subChild.constructor?.name,
									hasGarmentName,
									visible: subChild.visible,
								})
							})
						}
					})
				}
			}

			// Selectively hide only avatar body (not garments)
			console.log('🎯 SELECTIVELY HIDING AVATAR BODY ONLY')
			let hiddenAvatarParts: any[] = []

			drippyScene.avatarModel.three.children.forEach((child: any, index: number) => {
				const childName = child.name || ''
				const isGarment =
					childName.includes('LUME-GLTF-MODEL#') &&
					(childName.toLowerCase().includes('shirt') ||
						childName.toLowerCase().includes('pants') ||
						childName.toLowerCase().includes('accessories'))

				console.log(`Child ${index}: "${childName}", isGarment: ${isGarment}`)

				if (!isGarment) {
					// This is avatar body - hide it
					console.log(`hiding avatar body part: ${childName}`)
					child.visible = false
					hiddenAvatarParts.push(child)
				} else {
					console.log(`keeping garment visible: ${childName}`)
				}
			})

			if (hiddenAvatarParts.length > 0) {
				otherModelsToHide.push({restore: 'avatarParts', parts: hiddenAvatarParts})
				// Wait for the change to take effect
				await new Promise(resolve => requestAnimationFrame(resolve))
				console.log(`waited one frame after hiding ${hiddenAvatarParts.length} avatar parts`)
			}
		} else {
			console.log('avatarModel not found on drippy-scene')
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

		// Create a new lume-perspective-camera for screenshot
		console.log('🎥 Creating separate lume-perspective-camera for screenshot')
		const screenshotCamera = document.createElement('lume-perspective-camera')

		// Set camera attributes based on garment type - using smaller values since Lume transforms them
		screenshotCamera.setAttribute('fov', '50') // Field of view
		screenshotCamera.setAttribute('near', '0.1') // Near clipping
		screenshotCamera.setAttribute('far', '1000') // Far clipping

		if (category === 'Shirt') {
			screenshotCamera.setAttribute('position', '0 -1.1 0.8') // Close to chest/torso area
			screenshotCamera.setAttribute('look-at', '0 -0.3 0') // Look at torso area
		} else if (category === 'Pants') {
			screenshotCamera.setAttribute('position', '0 -0.6 0.8') // Close to legs area
			screenshotCamera.setAttribute('look-at', '0 -0.8 0') // Look at legs area
		} else if (category === 'Accessories') {
			screenshotCamera.setAttribute('position', '0 0.3 0.6') // Close to head/neck area
			screenshotCamera.setAttribute('look-at', '0 0.3 0') // Look at head area
		} else {
			screenshotCamera.setAttribute('position', '0 0 1') // Default position
			screenshotCamera.setAttribute('look-at', '0 0 0') // Look at center
		}

		// Add camera to scene and make it active
		lumeScene.appendChild(screenshotCamera)
		screenshotCamera.setAttribute('active', 'true')

		console.log(`📍 Screenshot camera positioned for ${category}`)

		// Wait for camera to be positioned and activated
		await new Promise(resolve => requestAnimationFrame(resolve))
		console.log('waited one frame for screenshot camera to activate')

		// Directly manipulate the Three.js camera object to override Lume transforms
		const threeCamera = (screenshotCamera as any).three
		if (threeCamera) {
			console.log('🎯 Directly setting Three.js camera position')
			console.log('  - before position:', threeCamera.position)

			// Set position directly on Three.js camera - adjust Y position to frame garments properly
			console.log(`Positioning camera for ${category}`)
			if (category === 'Shirt') {
				threeCamera.position.set(0, 1.2, 3) // Move camera up more to show shirt lower in frame
				threeCamera.lookAt(0, 0, 0) // Look at center
			} else if (category === 'Pants') {
				threeCamera.position.set(0, 0.7, 3) // Move camera up to show pants lower in frame
				threeCamera.lookAt(0, -0.3, 0) // Look at lower center
			} else if (category === 'Accessories') {
				threeCamera.position.set(0, 1.1, 3) // Move camera up to show accessories lower in frame
				threeCamera.lookAt(0, 0.8, 0) // Look at upper center
			} else {
				threeCamera.position.set(0, 0.4, 4) // Move camera up for default view
				threeCamera.lookAt(0, 0, 0) // Look at center
			}

			// Reset rotation to look straight ahead
			console.log('  - rotation before reset:', threeCamera.rotation)
			threeCamera.rotation.set(0, 0, 0) // Reset rotation to look straight
			threeCamera.updateMatrix()
			threeCamera.updateMatrixWorld(true)
			console.log('  - rotation after reset:', threeCamera.rotation)

			console.log('  - after position:', threeCamera.position)
			console.log('  - camera rotation:', threeCamera.rotation)

			// Wait another frame for the direct position change
			await new Promise(resolve => requestAnimationFrame(resolve))
			console.log('waited one frame after direct positioning')

			// Debug: Check what's actually in the scene for the camera to see
			console.log('🔍 Scene content analysis:')
			const threeScene = lumeScene.three
			if (threeScene && threeScene.children) {
				console.log('  - scene children count:', threeScene.children.length)
				threeScene.children.forEach((child: any, i: number) => {
					console.log(`    - Scene child ${i}:`, {
						name: child.name,
						type: child.constructor?.name,
						visible: child.visible,
						position: child.position,
						childrenCount: child.children?.length || 0,
					})

					// Look at children of each scene child
					if (child.children && child.children.length > 0) {
						child.children.forEach((subChild: any, j: number) => {
							console.log(`      - SubChild ${j}:`, {
								name: subChild.name,
								type: subChild.constructor?.name,
								visible: subChild.visible,
								position: subChild.position,
							})
						})
					}
				})
			}
		} else {
			console.log('❌ No three camera object found')
		}

		// Add delay to ensure 3D scene is rendered after scaling
		await new Promise(resolve => setTimeout(resolve, 100))

		// Get canvas and renderer
		const canvas = lumeScene.shadowRoot.querySelector('canvas')
		if (!canvas) {
			console.log('ERROR: Canvas not found')
			return ''
		}

		console.log('Canvas found:', canvas.width, 'x', canvas.height)

		const renderer = lumeScene.glRenderer || lumeScene._glRenderer || lumeScene.renderer
		let screenshot = ''

		if (renderer) {
			console.log('Renderer found:', renderer.constructor.name)
			const threeScene = lumeScene.three || renderer.scene
			const threeCamera = (screenshotCamera as any).three || lumeScene.camera?.three || lumeScene.three?.camera

			console.log('📊 Renderer debug:')
			console.log('  - threeScene:', !!threeScene)
			console.log('  - screenshot camera three object:', !!(screenshotCamera as any).three)
			console.log('  - fallback camera:', !!lumeScene.camera?.three)
			console.log('  - using camera:', threeCamera?.constructor?.name)

			if (threeScene && threeCamera) {
				console.log('Rendering with Three.js scene and camera')

				// Debug camera position before rendering
				console.log('  - camera position:', threeCamera.position)
				console.log('  - camera rotation:', threeCamera.rotation)
				console.log('  - scene children count:', threeScene.children?.length)

				// Set a clean light background for product shots
				const originalBackground = renderer.getClearColor(new THREE.Color())
				const originalAlpha = renderer.getClearAlpha()
				renderer.setClearColor(0xf5f5f5, 1.0) // Light gray background

				renderer.render(threeScene, threeCamera)
				screenshot = renderer.domElement.toDataURL('image/png')

				// Restore original background
				renderer.setClearColor(originalBackground, originalAlpha)
			} else {
				console.log('Missing Three.js scene or camera')
				console.log('  - threeScene exists:', !!threeScene)
				console.log('  - threeCamera exists:', !!threeCamera)
			}
		} else {
			console.log('No renderer found, using canvas directly')
		}

		if (!screenshot) {
			console.log('Using canvas toDataURL fallback')
			screenshot = canvas.toDataURL('image/png')
		}

		console.log('Screenshot length:', screenshot.length)
		console.log('Screenshot preview:', screenshot.substring(0, 50))

		// Check if screenshot is just empty/transparent
		if (
			screenshot ===
			'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
		) {
			console.log('WARNING: Screenshot appears to be empty/transparent')
		}

		// Test if the image data is valid by creating a test image
		const testImg = new Image()
		testImg.onload = () =>
			console.log(`✅ Screenshot for ${category} is a valid image: ${testImg.width}x${testImg.height}`)
		testImg.onerror = () => console.log(`❌ Screenshot for ${category} is corrupted or invalid`)
		testImg.src = screenshot

		// Restore hidden models
		modelsToHide.forEach(model => {
			if (model.three) {
				console.log(`restoring model.three.visible = true for ${model.getAttribute('id')}`)
				model.three.visible = true
			}
		})

		// No scaling restoration needed anymore

		// Restore avatar and scene
		otherModelsToHide.forEach(model => {
			if (model.restore === 'avatarParts') {
				console.log('restoring avatar parts visibility')
				model.parts.forEach((part: any) => {
					console.log(`restoring avatar part: ${part.name}`)
					part.visible = true
				})
			} else {
				const modelId = model.getAttribute('id')
				if (model.three) {
					console.log(`restoring ${modelId}`)
					model.three.visible = true
				}
			}
		})

		// Remove screenshot camera and revert to main camera
		console.log('🎥 Removing screenshot camera and reverting to main camera')
		screenshotCamera.removeAttribute('active')
		lumeScene.removeChild(screenshotCamera)
		console.log('screenshot camera removed and main camera restored')

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
												const cached = this.screenshotCache.get(category)
												console.log(`Template render for ${category}: cached=${!!cached}, fallback=${template.thumb}`)
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
