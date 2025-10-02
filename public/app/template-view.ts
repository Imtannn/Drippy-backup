import {batch, css, Element, element, html, signal, type ElementAttributes} from 'lume'
import {templates} from '../consts/templates.js'
import {onboardingStyles} from '../styles/onboarding-styles.js'
import type {Block, BlockCategory} from '../types/block.js'
import type {Fabric} from '../types/fabric.js'
import type {Template, TemplateCategory} from '../types/template.js'
import {blockManager} from './block-manager.js'
import {currentUser, store} from './store.js'

import '../elements/animation-select.js'
import '../elements/avatar-dropdown.js'
import '../elements/back-button.js'
import '../elements/bottom-navigation.js'
import '../elements/bottom-sheet.js'
import '../elements/cube-button.js'
import '../elements/dialog-element.js'
import '../elements/home-button.js'
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
import {updateGarmentsInUrl, updateFabricsInUrl, searchParams, pushState} from '../routes.js'
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

			const defaultCategories: TemplateCategory[] = ['Dress', 'Shirt', 'Top', 'Jacket', 'Skirt', 'Pants', 'Jumpsuit']
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
		this.createEffect(() => updateGarmentsInUrl(store.selectedTemplates))

		// Update URL when fabrics change
		this.createEffect(() => updateFabricsInUrl(store.selectedFabrics))
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

		const newTemplates = new Map<TemplateCategory, Template>(store.selectedTemplates)
		const newBlocks = new Map<TemplateCategory, Map<BlockCategory, Block>>(store.selectedBlocks)
		const newFabrics = new Map<TemplateCategory, Map<BlockCategory, Map<string, Fabric>>>(store.selectedFabrics)

		// check if the template with same category already exists
		const interchangeableCategories = blockManager.checkInterchangeableCategories(
			template.category,
			store.selectedTemplates,
		)
		if (interchangeableCategories.length > 0) {
			for (const category of interchangeableCategories) {
				if (store.selectedTemplates.has(category as TemplateCategory)) {
					newTemplates.delete(category as TemplateCategory)
					newBlocks.delete(category as TemplateCategory)
					newFabrics.delete(category as TemplateCategory)
				}
			}
		}

		newTemplates.set(template.category, template)
		const templateBlockData = blockManager.convertTemplateToBlockData(template, store.selectedSpace!)
		const {newBlocksMap, newFabricsMap} = blockManager.getBlocksAndFabricsMapFromTemplateData(
			templateBlockData,
			store.selectedSpace!,
		)
		newBlocks.set(template.category, newBlocksMap)
		newFabrics.set(template.category, newFabricsMap)

		store.selectedFabrics = newFabrics

		// @ts-expect-error FIXME we should avoid having different ways of
		// setting the same thing (see store.setSelectedBlocks, and
		// loadFromUrlParameters in drippy-app.ts).  This will get more
		// difficult to manage and error prone/buggy.
		store.__selectedBlocks = newBlocks

		store.selectedTemplates = newTemplates

		// Check if remix is available for this template
		const {available} = blockManager.isRemixAvailableForTemplate(template.category, {
			selectedBlocks: newBlocks,
			selectedSpace: store.selectedSpace,
		})

		if (available) {
			this.#handleTemplateOverlayRemix(template.category)
		}
	}

	#isTemplateActive = (template: Template) => {
		return store.selectedTemplates.get(template.category)?._id === template._id
	}

	#onPreviewButtonClick = () => {
		batch(() => {
			const user = currentUser()

			if (user) {
				searchParams().set('isPreview', 'true')
				store.isPreview = true
				this.showAvatarSelection = false
				this.showPoseSelection = false
				this.showRemixOverlay = false
				this.showTemplateOverlay = null
				pushState()
			} else {
				this.showLoginDialog = true
			}
		})
	}

	#onBackButtonClick = () => {
		batch(() => {
			// FIXME This logic is "go back to home" logic, however it is inaccessible
			// here to any other code that may want to go back to home. We need
			// to make code re-usable, and consistent, without repeating.

			// Reset UI state
			this.showAvatarSelection = false
			this.showPoseSelection = false
			this.showLoginDialog = false
			this.showRemixOverlay = false
			this.showTemplateOverlay = null

			store.resetSelectedTemplates()
			store.view = 'scene'
		})
	}

	#onAvatarDropdownClick = () => {
		batch(() => {
			this.showAvatarSelection = !this.showAvatarSelection
			this.showPoseSelection = false
			this.showRemixOverlay = false
			this.showTemplateOverlay = null
		})
	}

	#onNavTabChange = (e: CustomEvent) => {
		batch(() => {
			const tab = e.detail.tab
			if (tab === 'pose') {
				this.showPoseSelection = true
				this.showAvatarSelection = false
			} else {
				this.showPoseSelection = false
				this.showAvatarSelection = false
			}
			this.showRemixOverlay = false
			this.showTemplateOverlay = null
		})
	}

	#closeRemixOverlay = () => {
		batch(() => {
			this.showRemixOverlay = false
			store.setRemixOverlayTemplateCategory = null
		})
	}

	#onTemplateOverlayClose = () => {
		batch(() => {
			this.showTemplateOverlay = null
			this.isOpeningOverlay = false
		})
	}

	#handleTemplateOverlayRemix = (templateCategory: TemplateCategory) => {
		batch(() => {
			this.showTemplateOverlay = null
			this.isOpeningOverlay = false
			store.setRemixOverlayTemplateCategory = templateCategory
			this.showRemixOverlay = true
		})
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
					<remix-overlay
						selected-template-category=${() => store.remixOverlayTemplateCategory}
						onclose=${this.#closeRemixOverlay}
					></remix-overlay>
				`}
			></show-when>
			<bottom-navigation
				classList=${() => ({
					hidden: this.showRemixOverlay && store.remixOverlayTemplateCategory !== null,
				})}
			>
				<avatar-dropdown
					open=${() => this.showAvatarSelection}
					show-popup
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
			width: 100%;
			display: flex;
			flex-direction: column;
			gap: var(--uiSpacingTiny);
			position: relative;
		}

		.template-item-container {
			position: relative;
			width: 100%;
			height: 100%;
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

		.hidden {
			display: none;
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
