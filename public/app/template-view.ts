import {css, Element, element, html, signal, type ElementAttributes} from 'lume'
import {fabrics} from '../consts/fabrics.js'
import {getBlocksForTemplate, getFabricForTemplate} from '../consts/relationships.js'
import {templates} from '../consts/templates.js'
import {onboardingStyles} from '../styles/onboarding-styles.js'
import type {Block} from '../types/block.js'
import type {Fabric} from '../types/fabric.js'
import type {Template, TemplateCategory} from '../types/template.js'
import {blockManager} from './block-manager.js'
import {currentUser, store} from './store.js'
import {textureManager} from './texture-manager.js'

import '../elements/animation-select.js'
import '../elements/avatar-dropdown.js'
import '../elements/back-button.js'
import '../elements/bottom-navigation.js'
import '../elements/bottom-sheet.js'
import '../elements/cube-button.js'
import '../elements/dialog-element.js'
import '../elements/logic/for-each.js'
import '../elements/logic/index-each.js'
import '../elements/logic/show-when.js'
import '../elements/login-ui.js'
import '../elements/logo-button.js'
import '../elements/nav-items.js'
import '../elements/person-button.js'
import '../elements/save-button.js'
import '../elements/tabs.js'
import '../elements/theme-switch-button.js'
import '../onboarding/login-step.js'
import {updateGarmentsInUrl, updateUrlWithParams} from '../routes.js'
import './app-buttons.js'
import './avatar-selection.js'
import './drip-it-button.js'
import './item-card.js'
import '../elements/placeholder-image.js'
import {formatNumber} from '../utils.js'
import './pose-selection.js'

type TemplateViewAttributes = keyof {}

@element
export class TemplateView extends Element {
	static readonly elementName = 'template-view'

	@signal selectedTab: TemplateCategory | null = null
	@signal templateCategories: Record<TemplateCategory, Template[]> = {} as Record<TemplateCategory, Template[]>
	@signal spaceCollection: string | null = null
	@signal showLoginDialog = false
	@signal showLoginForm = false
	@signal showAvatarSelection = false
	@signal showPoseSelection = false

	private defaultCollection = 'moidien'

	connectedCallback() {
		super.connectedCallback()

		// Listen for login form events on document (since dialog content is moved to document.body)
		document.addEventListener('show-login-form', () => {
			this.showLoginForm = true
		})

		this.createEffect(() => {
			this.spaceCollection = store.selectedSpace?.collection ?? this.defaultCollection
		})

		// Update template categories when templates change
		this.createEffect(() => {
			if (!this.spaceCollection) return
			// Define the category order: 'Dress' | 'Jacket' | 'Shirt' | 'Top' | 'Skirt' | 'Pants' | 'Accessories'
			const categoryOrder: TemplateCategory[] = ['Dress', 'Shirt', 'Top', 'Jacket', 'Skirt', 'Pants', 'Accessories']

			// Get available categories from templates
			const availableCategories = [
				...new Set(templates[this.spaceCollection]?.map(template => template.category) || []),
			] as TemplateCategory[]

			// Sort categories in the desired order
			const orderedCategories = categoryOrder.filter(category => availableCategories.includes(category))

			this.templateCategories = ['All', ...orderedCategories].reduce(
				(acc, category) => {
					acc[category as TemplateCategory] = templates[this.spaceCollection!].filter(
						template => template.category === category,
					)
					return acc
				},
				{} as Record<TemplateCategory, Template[]>,
			)
		})

		this.createEffect(() => {
			// Auto-select first category
			const categories = Object.keys(this.templateCategories)
			if (categories.length > 0) {
				this.selectedTab = categories[0] as TemplateCategory
			}
		})

		// Handle successful login - close dialog
		this.createEffect(() => {
			const user = currentUser()
			// If user just logged in (not null and not undefined) and login dialog was open
			if (user !== null && user !== undefined && this.showLoginDialog) {
				this.showLoginDialog = false
				this.showLoginForm = false
			}
		})

		// Update URL when garments change
		this.createEffect(() => {
			const selectedTemplates = store.selectedTemplates
			updateGarmentsInUrl(selectedTemplates)
		})

		// Convert templates to blocks for 3D rendering
		this.createEffect(() => {
			const selectedTemplates = store.selectedTemplates
			if (selectedTemplates.size > 0) {
				this.#convertTemplatesToBlocks()
			}
		})
	}

	#convertTemplatesToBlocks = async () => {
		// Get blocks for ALL selected templates, organized by template category
		const templateBlockData: {
			blocks: Block[]
			templateCategory: TemplateCategory
			materialId: string
			extraMaterials?: {mesh: string; materialId: string}[]
		}[] = []

		for (const [templateCategory, selectedTemplate] of store.selectedTemplates.entries()) {
			const templateBlocks = getBlocksForTemplate(selectedTemplate, store.selectedSpace?.collection)
			templateBlockData.push({
				blocks: templateBlocks,
				templateCategory: templateCategory,
				materialId: selectedTemplate.materialId ?? '',
				extraMaterials: selectedTemplate.extraMaterials,
			})
		}

		// Replace blocks with aggregated blocks from all selected templates
		store.replaceSelectedBlocks = templateBlockData
	}

	#onItemClick = async (e: CustomEvent) => {
		const template = e.detail.itemValue as Template

		store.setSelectedTemplates = template

		const selectedTemplate = store.selectedTemplates.get(template.category)

		if (selectedTemplate) {
			const templateFabric = getFabricForTemplate(template, store.selectedSpace?.collection)

			// Get extra fabrics if they exist
			const extraFabrics: Fabric[] = []
			if (selectedTemplate.extraMaterials) {
				const brandFabrics = fabrics[store.selectedSpace?.collection ?? 'moidien'] || []
				for (const extraMaterial of selectedTemplate.extraMaterials) {
					const extraFabric = brandFabrics.find(
						fabric => `${fabric.category} - ${fabric.materialName}` === extraMaterial.materialId,
					)
					if (extraFabric) {
						extraFabrics.push(extraFabric)
					}
				}
			}

			// Collect all fabrics to preload (main + extras)
			const fabricsToPreload = []
			if (templateFabric) {
				fabricsToPreload.push(templateFabric)
			}
			fabricsToPreload.push(...extraFabrics)

			if (fabricsToPreload.length > 0) {
				const loadingId = Symbol(`fabric-${templateFabric?._id || 'extra'}`)
				store.addLoadingMaterial(loadingId)
				try {
					// Preload all fabric textures and template blocks separately
					await Promise.all([
						Promise.all(fabricsToPreload.map(fabric => textureManager.preloadFabricBaseTextures(fabric))),
						blockManager.preloadTemplateBlocks(template, store.selectedSpace!),
					])
				} catch (error) {
					console.warn('Failed to preload fabric textures:', error)
				} finally {
					store.removeLoadingMaterial(loadingId)
				}
			}
		}

		// Convert templates to blocks (this will be handled by the effect automatically)
		// The effect will trigger since we modified store.selectedTemplates above
	}

	#onDripItClick = () => {
		const user = currentUser()
		// If undefined, means the user is still loading
		if (user === undefined) return

		if (user !== null) {
			store.navigateTo = 'blocks'
		} else {
			this.showLoginDialog = true
		}
	}

	#onBackButtonClick = () => {
		store.resetSelectedTemplates()
		const searchParams = new URLSearchParams(window.location.search)
		searchParams.delete('scene')
		updateUrlWithParams(searchParams)
		store.selectSpace = null
		store.navigateTo = 'scene'
	}

	#onAvatarDropdownClick = () => {
		this.showAvatarSelection = !this.showAvatarSelection
	}

	#onAvatarSaveClick = () => {
		// Save the temp selected avatar to the confirmed selection
		const value = store.tempSelectedAvatar
		if (!value) return

		// Update URL params and store
		const searchParams = new URLSearchParams(window.location.search)
		searchParams.set('avatar', value)
		updateUrlWithParams(searchParams)
		store.selectAvatar = value

		// Close avatar selection (chevron will auto-reset via prop)
		this.showAvatarSelection = false
	}

	#onNavTabChange = (e: CustomEvent) => {
		const tab = e.detail.tab
		if (tab === 'pose') {
			this.showPoseSelection = true
			this.showAvatarSelection = false
		} else {
			this.showPoseSelection = false
			this.showAvatarSelection = false
		}
	}

	#onPoseSaveClick = () => {
		// Save the temp selected pose to the confirmed selection
		const value = store.tempSelectedPose
		if (!value) return

		// Update URL params and store
		const searchParams = new URLSearchParams(window.location.search)
		searchParams.set('pose', value)
		updateUrlWithParams(searchParams)
		store.selectPose = value

		// Close pose selection
		this.showPoseSelection = false
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
				<logo-button brand-name="MoiDien"></logo-button>
			</app-buttons-group>
			<app-buttons-group>
				<person-button></person-button>
				<cube-button></cube-button>
				<show-when
					condition=${() => store.selectedSpace?.collection === 'moidien'}
					content=${() => html` <animation-select></animation-select> `}
				></show-when>
			</app-buttons-group>
		</app-buttons-right>

		<app-buttons-right layout="bottom">
			<app-buttons-group>
				<show-when
					condition=${() => this.showAvatarSelection}
					content=${() => html`<save-button onclick=${this.#onAvatarSaveClick}></save-button>`}
				></show-when>
				<show-when
					condition=${() => this.showPoseSelection}
					content=${() => html`<save-button onclick=${this.#onPoseSaveClick}></save-button>`}
				></show-when>
				<show-when
					condition=${() => !this.showAvatarSelection && !this.showPoseSelection}
					content=${() => html`
						<drip-it-button
							button-disabled=${() => store.selectedTemplates.size === 0}
							onclick=${this.#onDripItClick}
						></drip-it-button>
					`}
				></show-when>
			</app-buttons-group>
		</app-buttons-right>

		<bottom-sheet>
			<show-when
				condition=${() => this.showAvatarSelection}
				content=${() => html`<avatar-selection content-only></avatar-selection>`}
			></show-when>
			<show-when
				condition=${() => this.showPoseSelection}
				content=${() => html`<pose-selection content-only></pose-selection>`}
			></show-when>
			<show-when
				condition=${() => !this.showAvatarSelection && !this.showPoseSelection && this.selectedTab !== null}
				content=${() => html`
					<tabs-provider
						default-value=${() => this.selectedTab}
						ontabchange=${(e: CustomEvent) => (this.selectedTab = e.detail.value)}
					>
						<bottom-sheet-header>
							<div class="tabs-container">
								<tabs-list>
									<for-each
										items=${() => Object.keys(this.templateCategories)}
										content=${() => (category: TemplateCategory) => html`
											<tabs-trigger selected-value=${category}>${category}</tabs-trigger>
										`}
									></for-each>
								</tabs-list>
							</div>
						</bottom-sheet-header>
						<div class="tabs-content-container">
							<for-each
								items=${() => Object.keys(this.templateCategories)}
								content=${() => (category: TemplateCategory) => html`
									<tabs-content selected-value=${category}>
										<div class="items-grid">
											<for-each
												items=${() =>
													category === 'All'
														? Object.values(this.templateCategories).flat()
														: this.templateCategories[category]}
												content=${() => (template: Template) => html`
													<div class="template-item">
														<item-card
															item-active=${() => store.selectedTemplates.get(template.category)?._id === template._id}
															item-src=${template.thumb}
															item-alt=${template.name}
															item-value=${template}
															oncardselected=${this.#onItemClick}
															object-fit="contain"
															object-position="center"
															aspect-ratio="0.79"
														></item-card>
														<div class="template-product-name">${template.name}</div>
														<div class="template-product-price-container">
															<div
																class="template-product-price"
																classList=${() => ({wholesale: store.selectedSpace?.isWholesale})}
															>
																${() => (template.price !== 'N/A' ? formatNumber(Number(template.price)) : 'N/A')}
															</div>
															<show-when
																condition=${() => store.selectedSpace?.isWholesale}
																content=${() => html` <div class="template-product-wholesale">MOQ: 5pcs</div> `}
															></show-when>
														</div>
													</div>
												`}
											></for-each>
										</div>
									</tabs-content>
								`}
							></for-each>
						</div>
					</tabs-provider>
				`}
			></show-when>
			<bottom-navigation>
				<avatar-dropdown
					open=${() => this.showAvatarSelection}
					onavatar-dropdown-click=${this.#onAvatarDropdownClick}
				></avatar-dropdown>
				<nav-items ontab-change=${this.#onNavTabChange}></nav-items>
			</bottom-navigation>
		</bottom-sheet>

		<dialog-element
			open=${() => this.showLoginDialog}
			onclose=${() => {
				this.showLoginDialog = false
				this.showLoginForm = false
			}}
		>
			<show-when condition=${() => !this.showLoginForm} content=${() => html`<login-step></login-step>`}></show-when>
			<show-when
				condition=${() => this.showLoginForm}
				content=${() => html`
					<div style="display: flex; justify-content: center; align-items: flex-start; width: 100%; height: 100%;">
						<login-ui expanded style="position: relative;"></login-ui>
					</div>
					<style>
						#login-dropdown-list {
							position: relative;
							top: -200px;
						}
						.accounts-dialog {
							position: relative;
							transform: none;
						}
					</style>
				`}
			></show-when>
		</dialog-element>
	`

	css = css/*css*/ `
		${onboardingStyles}
		:host {
			display: contents;
		}

		.tabs-container {
			padding: var(--uiSpacing);
			padding-top: 0;
			padding-bottom: var(--uiSpacingSmall);
			background: var(--uiColorPrimaryWhite);
		}

		.bottom-sheet-header {
			position: sticky;
			top: 0;
			background: var(--appBackground);
			z-index: 10;
			border-bottom: var(--borderWidth) solid var(--uiColorBorderColor);
		}

		.tabs-content-container {
			padding: var(--uiSpacing);
			padding-top: 0;
			padding-bottom: 5px;
			background: var(--uiColorPrimaryWhite);
		}

		/* Add bottom padding on desktop to prevent content hiding behind navigation */
		@media (min-width: 768px) {
			.tabs-content-container {
				padding-bottom: 80px;
			}
		}

		.items-grid {
			display: grid;
			grid-template-columns: repeat(3, 1fr);
			gap: var(--uiGap);
		}

		.templates-content-container {
			padding: var(--uiSpacing);
			padding-top: 0;
			padding-bottom: 5px;
			background: var(--uiColorPrimaryWhite);
		}

		.template-item {
			min-width: 0;
			min-height: 0;
			width: 100%;
			height: 100%;
			display: flex;
			flex-direction: column;
			gap: var(--uiSpacingTiny);
		}

		.template-product-name {
			font-size: var(--fontSizeTextXs);
			font-weight: var(--fontWeightSemiBold);
			color: #424347;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
			height: 20px;
		}

		.template-product-price-container {
			display: flex;
			flex-direction: row;
			justify-content: space-between;
			align-items: center;
			flex-wrap: nowrap;
		}

		.template-product-price {
			font-size: var(--fontSizeTextXs);
			font-weight: var(--fontWeightNormal);
			color: #424347;
			text-wrap: nowrap;
		}

		.template-product-price.wholesale {
			font-size: var(--fontSizeTextXxs);
		}

		.template-product-wholesale {
			font-size: var(--fontSizeTextXxs);
			font-weight: var(--fontWeightNormal);
			color: #424347;
			text-wrap: wrap;
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
