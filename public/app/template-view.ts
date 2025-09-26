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
import '../elements/home-button.js'
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
import '../elements/placeholder-image.js'
import '../elements/preview-button.js'
import '../elements/save-button.js'
import '../elements/tabs.js'
import '../elements/theme-switch-button.js'
import {updateGarmentsInUrl, updateUrlWithParams} from '../routes.js'
import {formatNumber} from '../utils.js'
import './app-buttons.js'
import './avatar-selection.js'
import './item-card.js'
import './pose-selection.js'
import './remix-overlay.js'
import './template-item-overlay.js'

type TemplateViewAttributes = keyof {}

@element
export class TemplateView extends Element {
	static readonly elementName = 'template-view'

	@signal selectedTab: TemplateCategory | null = null
	@signal templateCategories: Record<TemplateCategory, Template[]> = {} as Record<TemplateCategory, Template[]>
	@signal spaceCollection: string | null = null
	@signal showLoginDialog = false
	@signal showAvatarSelection = false
	@signal showPoseSelection = false
	@signal pendingActiveTemplateIds: Partial<Record<TemplateCategory, string | null>> = {}
	@signal showRemixOverlay = false
	@signal showTemplateOverlay: Template | null = null

	private isOpeningOverlay = false

	private defaultCollection = 'moidien'

	connectedCallback() {
		super.connectedCallback()

		// Add click handler to close overlay when clicking outside
		document.addEventListener('click', this.#onDocumentClick)

		this.createEffect(() => {
			this.spaceCollection = store.selectedSpace?.collection ?? this.defaultCollection
		})

		// Update template categories when templates change
		this.createEffect(() => {
			if (!this.spaceCollection) return

			const defaultCategories: TemplateCategory[] = ['Dress', 'Shirt', 'Top', 'Jacket', 'Skirt', 'Pants']
			const collectionTemplates = templates[this.spaceCollection] ?? []
			const orderedTemplates: Template[] = []
			const categories = new Map<TemplateCategory, Template[]>()
			categories.set('All', [])

			for (const category of defaultCategories) {
				const templatesForCategory = collectionTemplates.filter(template => template.category === category)
				if (templatesForCategory.length > 0) {
					orderedTemplates.push(...templatesForCategory)
					categories.set(category, templatesForCategory)
				}
			}

			const accessoryTemplates = collectionTemplates.filter(
				template => !defaultCategories.includes(template.category as TemplateCategory),
			)

			if (accessoryTemplates.length > 0) {
				orderedTemplates.push(...accessoryTemplates)
				categories.set('Accessories', accessoryTemplates)
			}

			categories.set('All', orderedTemplates)

			this.templateCategories = Object.fromEntries(categories) as Record<TemplateCategory, Template[]>
		})

		this.createEffect(() => {
			// Auto-select first category
			const categories = Object.keys(this.templateCategories)
			if (categories.length > 0) {
				this.selectedTab = categories[0] as TemplateCategory
			}
		})

		// Close login dialog when user successfully logs in
		this.createEffect(() => {
			const user = currentUser()
			if (user !== null && this.showLoginDialog) {
				this.showLoginDialog = false
			}
		})

		// Update URL when garments change
		this.createEffect(() => {
			const selectedTemplates = store.selectedTemplates
			updateGarmentsInUrl(selectedTemplates)
		})

		// Convert templates to blocks for 3D rendering
		this.createEffect(() => {
			void store.selectedTemplates
			this.#convertTemplatesToBlocks()
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

		const isCurrentlySelected = this.#isTemplateActive(template)

		// If clicking on already selected template, show overlay instead of toggling
		if (isCurrentlySelected) {
			this.isOpeningOverlay = true
			this.showTemplateOverlay = template
			setTimeout(() => {
				this.isOpeningOverlay = false
			}, 0)
			return
		}

		this.#setPendingActiveTemplate(template.category, template._id)

		let loadingId: symbol | null = null

		const templateFabric = getFabricForTemplate(template, store.selectedSpace?.collection)

		// Get extra fabrics if they exist
		const extraFabrics: Fabric[] = []
		if (template.extraMaterials) {
			const brandFabrics = fabrics[store.selectedSpace?.collection ?? 'moidien'] || []
			for (const extraMaterial of template.extraMaterials) {
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
			loadingId = Symbol(`fabric-${templateFabric?._id || 'extra'}`)
			store.addLoadingMaterial(loadingId)
			try {
				// Preload all fabric textures and template blocks separately
				await Promise.all([
					Promise.all(fabricsToPreload.map(fabric => textureManager.preloadFabricBaseTextures(fabric))),
					Promise.all(blockManager.preloadTemplateBlocks(template, store.selectedSpace!)),
				])
			} catch (error) {
				console.warn('Failed to preload fabric textures:', error)
			} finally {
				if (loadingId) {
					store.removeLoadingMaterial(loadingId)
				}
			}
		}

		// If this is the first template selected, show remix overlay for this item
		if (store.selectedTemplates.size === 0) {
			this.#handleTemplateOverlayRemix(template.category)
		}

		store.setSelectedTemplates = template
		this.#clearPendingActiveTemplate(template.category)
	}

	#setPendingActiveTemplate = (category: TemplateCategory, templateId: string | null) => {
		this.pendingActiveTemplateIds = {
			...this.pendingActiveTemplateIds,
			[category]: templateId,
		}
	}

	#clearPendingActiveTemplate = (category: TemplateCategory) => {
		if (!(category in this.pendingActiveTemplateIds)) return
		const {[category]: _, ...rest} = this.pendingActiveTemplateIds
		this.pendingActiveTemplateIds = rest
	}

	#isTemplateActive = (template: Template) => {
		const pendingId = this.pendingActiveTemplateIds[template.category]
		if (pendingId !== undefined) {
			return pendingId === template._id
		}
		return store.selectedTemplates.get(template.category)?._id === template._id
	}

	#onPreviewButtonClick = () => {
		const searchParams = new URLSearchParams(window.location.search)
		searchParams.set('isPreview', 'true')
		store.setIsPreview = true
		updateUrlWithParams(searchParams)
	}

	#onBackButtonClick = () => {
		// Reset UI state
		this.showAvatarSelection = false
		this.showPoseSelection = false
		this.showLoginDialog = false
		this.showRemixOverlay = false
		this.showTemplateOverlay = null

		store.resetSelectedTemplates()
		const searchParams = new URLSearchParams(window.location.search)
		searchParams.delete('scene')
		updateUrlWithParams(searchParams)
		store.selectSpace = null
		store.navigateTo = 'scene'
	}

	#onHomeButtonClick = () => {
		store.resetState()
		window.location.href = '/app?avatar=moidien'
	}

	#onAvatarDropdownClick = () => {
		this.showAvatarSelection = !this.showAvatarSelection
		this.showPoseSelection = false
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

		// Dispatch event to reset nav activeTab back to 'items'
		document.dispatchEvent(
			new CustomEvent('avatar-dropdown-click', {
				bubbles: true,
				composed: true,
				detail: {
					isOpening: false, // Closing the avatar selection
				},
			}),
		)
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

	#closeRemixOverlay = () => {
		this.showRemixOverlay = false
		store.setRemixOverlayTemplateCategory = null
	}

	#onTemplateOverlayClose = () => {
		this.showTemplateOverlay = null
		this.isOpeningOverlay = false
	}

	#handleTemplateOverlayRemix = (templateCategory: TemplateCategory) => {
		this.showTemplateOverlay = null
		this.isOpeningOverlay = false
		store.setRemixOverlayTemplateCategory = templateCategory
		this.showRemixOverlay = true
	}

	#onTemplateOverlayRemix = (e: CustomEvent) => {
		const templateCategory = e.detail.templateCategory
		this.#handleTemplateOverlayRemix(templateCategory)
	}

	#onDocumentClick = (e: Event) => {
		// Skip the first click that originated from opening the overlay
		if (this.isOpeningOverlay) return

		// Close overlay when clicking outside
		if (
			this.showTemplateOverlay &&
			!e.composedPath().some(el => el instanceof Element && el.tagName === 'TEMPLATE-ITEM-OVERLAY')
		) {
			this.showTemplateOverlay = null
		}
	}

	disconnectedCallback() {
		super.disconnectedCallback()
		document.removeEventListener('click', this.#onDocumentClick)
	}

	template = () => html`
		<app-buttons-left>
			<app-buttons-group>
				<back-button onclick=${this.#onBackButtonClick}></back-button>
				<home-button onclick=${this.#onHomeButtonClick}></home-button>
			</app-buttons-group>
		</app-buttons-left>

		<app-buttons-right>
			<app-buttons-group>
				<logo-button brand-name="MoiDien"></logo-button>
			</app-buttons-group>
			<app-buttons-group>
				<person-button></person-button>
				<cube-button></cube-button>
				<show-when
					condition=${() => store.selectedSpace?.collection === 'moidien'}
					content=${() => html`<animation-select></animation-select>`}
				></show-when>
			</app-buttons-group>
		</app-buttons-right>

		<app-buttons-right layout="bottom">
			<app-buttons-group>
				<show-when
					condition=${() => !this.showAvatarSelection && !this.showPoseSelection}
					content=${() => html`
						<preview-button
							button-disabled=${() => store.selectedTemplates.size === 0}
							onclick=${this.#onPreviewButtonClick}
						></preview-button>
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
				condition=${() =>
					!this.showAvatarSelection && !this.showPoseSelection && this.selectedTab !== null && !this.showRemixOverlay}
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
													category === 'All' ? (this.templateCategories.All ?? []) : this.templateCategories[category]}
												content=${() => (template: Template) => html`
													<div class="template-item">
														<div class="template-item-container">
															<item-card
																item-active=${() => this.#isTemplateActive(template)}
																item-src=${template.thumb}
																item-alt=${template.name}
																item-value=${template}
																oncardselected=${this.#onItemClick}
																object-fit="contain"
																object-position="center"
																aspect-ratio="0.79"
															></item-card>
															<show-when
																condition=${() => this.showTemplateOverlay?._id === template._id}
																content=${() => html`
																	<template-item-overlay
																		selected-template=${() => template}
																		onclose=${this.#onTemplateOverlayClose}
																		onremix=${this.#onTemplateOverlayRemix}
																	></template-item-overlay>
																`}
															></show-when>
														</div>
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
																content=${() => html`<div class="template-product-wholesale">MOQ: 5pcs</div>`}
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
			<show-when
				condition=${() => this.showRemixOverlay && store.remixOverlayTemplateCategory !== null}
				content=${() => html`
					<div class="remix-overlay-container">
						<remix-overlay
							selected-template-category=${() => store.remixOverlayTemplateCategory}
							onclose=${this.#closeRemixOverlay}
						></remix-overlay>
					</div>
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
			}}
		>
			<div style="display: flex; justify-content: center; align-items: flex-start; width: 100%; height: 100%;">
				<login-ui expanded style="position: relative;"></login-ui>
			</div>
			<style>
				login-ui {
					display: contents;
				}
			</style>
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
			padding-bottom: var(--uiSpacingXxl);
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

		.template-item-container {
			position: relative;
			width: 100%;
			flex: 1;
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

		.remix-overlay-container {
			padding: var(--uiSpacing);
			padding-top: 0;
			padding-bottom: var(--uiSpacingXxl);
			background: var(--uiColorPrimaryWhite);
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
