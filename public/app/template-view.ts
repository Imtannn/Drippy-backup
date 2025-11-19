import {batch, css, Element, element, html, onCleanup, signal, type ElementAttributes} from 'lume'
import {templates} from '../consts/templates.js'
import {onboardingStyles} from '../styles/onboarding-styles.js'
import type {Template, TemplateCategory} from '../types/template.js'
import type {Collection, TemplateMap} from '../types/types.js'
import {getCollectionBySlug, getSpaceCollections, spaceHasMultipleCollections} from '../utils.js'
import {currentUser, store, updateGarmentsSelectionInUrl} from './store.js'
import {templateHelpers} from './template-helpers.js'

import {collections} from '../consts/collections.js'
import '../elements/animation-select.js'
import '../elements/avatar-dropdown.js'
import '../elements/avatar-swap-bottom-sheet.js'
import '../elements/back-button.js'
import '../elements/bottom-navigation.js'
import '../elements/bottom-sheet.js'
import '../elements/cube-button.js'
import '../elements/dialog-element.js'
import '../elements/heart-button.js'
import '../elements/home-button.js'
import '../elements/logic/for-each.js'
import '../elements/logic/index-each.js'
import '../elements/logic/show-when.js'
import '../elements/login-ui.js'
import '../elements/nav-items.js'
import '../elements/person-button.js'
import '../elements/placeholder-image.js'
import '../elements/preview-button.js'
import '../elements/save-button.js'
import '../elements/search-button.js'
import '../elements/show-on-device.js'
import '../elements/tabs.js'
import '../elements/theme-switch-button.js'
import '../elements/top-navigation.js'
import {pushState, searchParams} from '../routes.js'
import {formatNumber} from '../utils.js'
import './app-buttons-preset.js'
import './app-buttons.js'
import './avatar-selection.js'
import './buy-button.js'
import './item-card.js'
import './loading-spinner-overlay.js'
import './pose-selection.js'
import './remix-overlay.js'
import './template-detail-view.js'
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
	@signal showAvatarSwapSheet = false
	@signal avatarSwapTemplate: Template | null = null
	@signal showDetailView = false

	private isOpeningOverlay = false
	private defaultCollection = 'gap'

	connectedCallback() {
		super.connectedCallback()

		// Add click handler to close overlay when clicking outside
		document.addEventListener('click', this.#onDocumentClick)

		this.addEventListener('close', this.#onDetailViewClose)

		this.createEffect(() => {
			this.spaceCollection = store.getEffectiveCollection() ?? this.defaultCollection
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
		// Update URL when fabrics change
		this.createEffect(() => {
			updateGarmentsSelectionInUrl(store.selectedGarments)
		})

		// Sync showRemixOverlay with store.remixOverlayTemplate
		this.createEffect(() => {
			if (store.remixOverlayTemplate === null && this.showRemixOverlay) {
				this.showRemixOverlay = false
			}
		})

		// Auto-trigger preview button after 15s if conditions are met
		this.createEffect(() => {
			const user = currentUser()
			// If user is not logged in or is getting user info from server, return
			if (user !== null) return

			const canShowPreview = !this.showAvatarSelection && !this.showPoseSelection
			const hasSelectedTemplates = store.selectedTemplates.size > 0

			// Start timer if: button is visible, and has selected templates
			if (canShowPreview && hasSelectedTemplates) {
				const timer = window.setTimeout(() => {
					this.#onPreviewButtonClick()
				}, 65000) // 65 seconds

				onCleanup(() => {
					clearTimeout(timer)
				})
			}
		})
	}

	#onItemClick = async (e: CustomEvent) => {
		const template = e.detail.itemValue as Template

		// If clicking on already selected template, show overlay instead of toggling
		if (
			store.selectedTemplates.has(template.category) &&
			store.selectedTemplates.get(template.category)?._id === template._id
		) {
			this.showTemplateOverlay = template
			this.isOpeningOverlay = true
			return
		}

		store.setLoadingTemplate(template._id)
		this.#selectTemplate(template)
		setTimeout(() => {
			this.isOpeningOverlay = false
		}, 0)
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

	#onBuyButtonClick = () => {
		store.view = 'order-items'
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
			this.showDetailView = false
			this.showTemplateOverlay = null
			this.showAvatarSwapSheet = false
			this.avatarSwapTemplate = null
		})
	}

	#onAvatarDropdownClick = () => {
		batch(() => {
			this.showAvatarSelection = !this.showAvatarSelection
			this.showPoseSelection = false
			this.showRemixOverlay = false
			this.showTemplateOverlay = null
			this.showAvatarSwapSheet = false
			this.avatarSwapTemplate = null
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
			this.showAvatarSwapSheet = false
			this.avatarSwapTemplate = null
		})
	}

	#closeRemixOverlay = () => {
		batch(() => {
			this.showRemixOverlay = false
			store.setRemixOverlayTemplate = null
		})
	}

	#onTemplateOverlayClose = () => {
		batch(() => {
			this.showTemplateOverlay = null
			this.isOpeningOverlay = false
		})
	}

	#handleTemplateOverlayRemix = (template: Template) => {
		batch(() => {
			this.showTemplateOverlay = null
			this.isOpeningOverlay = false
			store.setRemixOverlayTemplate = template
			this.showRemixOverlay = true
		})
	}

	#onTemplateOverlayRemix = (e: CustomEvent) => {
		const template = e.detail.template
		this.#handleTemplateOverlayRemix(template)
	}

	#onAvatarSwapped = () => {
		// Close the avatar swap sheet
		batch(() => {
			this.showAvatarSwapSheet = false
			this.avatarSwapTemplate = null
			this.showAvatarSelection = true
		})
	}

	#onAvatarSwapCancel = () => {
		batch(() => {
			this.showAvatarSwapSheet = false
			this.avatarSwapTemplate = null
		})
	}

	// #onViewDetailsClick = () => {
	// 	batch(() => {
	// 		this.showDetailView = true
	// 		this.showAvatarSelection = false
	// 		this.showPoseSelection = false
	// 		this.showRemixOverlay = false
	// 		this.showTemplateOverlay = null
	// 	})
	// }

	#onDetailViewClose = () => {
		this.showDetailView = false
	}

	#onCollectionSelect = (collection: Collection) => {
		store.setSelectedCollection = collection.slug
	}

	#selectTemplate = (template: Template) => {
		const effectiveSpace = store.getEffectiveSpace()
		if (!effectiveSpace) return

		const newTemplates: TemplateMap = new Map(store.selectedTemplates)
		let nextSelection = templateHelpers.cloneSelectedGarments(store.selectedGarments)

		// check if the template with same category already exists
		const overridingCategories = templateHelpers.checkOverridingCategories(
			template.category,
			store.selectedTemplates,
		) as TemplateCategory[]

		if (overridingCategories.length > 0) {
			nextSelection = templateHelpers.omitTemplateCategories(nextSelection, overridingCategories)
			for (const category of overridingCategories) {
				if (store.selectedTemplates.has(category)) {
					newTemplates.delete(category)
				}
			}
		}

		newTemplates.set(template.category, template)
		const effectiveCollection = store.getEffectiveCollection()
		const templateBlockData = templateHelpers.convertTemplateToBlockData(template, effectiveCollection)
		const {newBlocksMap, newFabricsMap} = templateHelpers.getBlocksAndFabricsMapFromTemplateData(
			templateBlockData,
			effectiveCollection,
		)
		const templateSelection = templateHelpers.buildTemplateSelectionFromMaps(newBlocksMap, newFabricsMap)
		nextSelection = templateHelpers.withTemplateSelection(nextSelection, template.category, templateSelection)

		batch(() => {
			store.selectedGarments = nextSelection
			store.selectedTemplates = newTemplates
		})
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
		<app-buttons-preset
			preset="template-flow"
			brand-name="MoiDien"
			show-animation=${() => store.getEffectiveCollection() === 'gap'}
			disable-person-button=${false}
			disable-cube-button=${false}
			on:backclick=${this.#onBackButtonClick}
		>
			<show-on-device device="mobile">
				<show-when
					condition=${() => this.showRemixOverlay}
					content=${() => html`
						<app-buttons-right layout="bottom">
							<app-buttons-group>
								<button class="done-button" onclick=${this.#closeRemixOverlay}>Done</button>
							</app-buttons-group>
						</app-buttons-right>
					`}
				></show-when>
			</show-on-device>
		</app-buttons-preset>

		<bottom-sheet
			show-remix-overlay=${() => this.showRemixOverlay}
			float-direction="right"
			default-snap=${() => (this.showDetailView ? '0.88' : undefined)}
			max-height="100vh"
		>
			<app-buttons-left layout="bottom">
				<app-buttons-group group-direction="row" custom-class="button-group-spread">
					<show-when
						condition=${() => !this.showRemixOverlay}
						content=${() => html` <buy-button class="align-right" onclick=${this.#onBuyButtonClick}></buy-button> `}
					></show-when>
					<show-when
						condition=${() => this.showRemixOverlay}
						content=${() => html`
							<button class="done-button align-right" onclick=${this.#closeRemixOverlay}>Done</button>
						`}
					></show-when>
				</app-buttons-group>
			</app-buttons-left>

			<show-when
				condition=${() => this.showRemixOverlay && store.remixOverlayTemplate !== null}
				content=${() => html`<div class="template-sheet-overlay" onclick=${this.#closeRemixOverlay}></div>`}
			></show-when>

			<show-on-device device="desktop">
				<div class="template-view-buttons">
					<top-navigation
						classList=${() => ({
							hidden: (this.showRemixOverlay && store.remixOverlayTemplate !== null) || this.showDetailView,
						})}
					>
						<div
							class="template-info"
							classList=${() => {
								const templates = Array.from(store.selectedTemplates.values())
								return {hidden: templates.length === 0 || true}
							}}
						>
							${() => {
								const templates = Array.from(store.selectedTemplates.values())
								if (templates.length > 0) {
									const selectedTemplate = templates[0]
									return html`
										<div class="template-image-wrapper">
											<img src=${selectedTemplate.thumb} alt=${selectedTemplate.name} class="template-image" />
										</div>
										<div class="template-details">
											<div class="template-name">${selectedTemplate.name}</div>
											<div class="template-price">€ ${selectedTemplate.price || '125.00'}</div>
										</div>
									`
								}
								return ''
							}}
						</div>
						<button
							class="view-details-btn"
							classList=${() => {
								const templates = Array.from(store.selectedTemplates.values())
								return {hidden: templates.length === 0 || true}
							}}
							disabled
						>
							View details
						</button>
						<div
							class="default-nav"
							classList=${() => {
								const templates = Array.from(store.selectedTemplates.values())
								return {hidden: templates.length > 0 && false}
							}}
						>
							<avatar-dropdown
								open=${() => this.showAvatarSelection}
								show-popup
								onavatar-dropdown-click=${this.#onAvatarDropdownClick}
							></avatar-dropdown>
							<nav-items ontab-change=${this.#onNavTabChange}></nav-items>
						</div>
					</top-navigation>
				</div>
				<show-when
					condition=${() =>
						spaceHasMultipleCollections(store.selectedSpace) &&
						!this.showAvatarSelection &&
						!this.showPoseSelection &&
						!this.showDetailView &&
						this.selectedTab !== null}
					content=${() => html`
						<top-navigation class="collections-navigation">
							<div class="collections-scroll-container">
								<for-each
									items=${() => getSpaceCollections(store.selectedSpace).map(c => getCollectionBySlug(collections, c))}
									content=${() => (collection: Collection) => html`
										<button
											class="collection-logo-button"
											classList=${() => ({active: store.getEffectiveCollection() === collection.slug})}
											onclick=${() => this.#onCollectionSelect(collection)}
										>
											<img src=${collection.logo || '/images/drippy-logo.webp'} alt=${collection.name} />
										</button>
									`}
								></for-each>
							</div>
						</top-navigation>
					`}
				></show-when>
			</show-on-device>
			<show-when
				condition=${() => this.showDetailView}
				content=${() => html`
					<template-detail-view
						selected-template=${() => Array.from(store.selectedTemplates.values())[0] || null}
						onclose=${this.#onDetailViewClose}
					></template-detail-view>
				`}
			></show-when>
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
					!this.showAvatarSelection && !this.showPoseSelection && !this.showDetailView && this.selectedTab !== null}
				content=${() => html`
					<tabs-provider
						default-value=${() => this.selectedTab}
						ontabchange=${(e: CustomEvent) => (this.selectedTab = e.detail.value)}
					>
						<show-on-device device="mobile">
							<show-when
								condition=${() => spaceHasMultipleCollections(store.selectedSpace)}
								content=${() => html`
									<div class="collections-mobile-navigation">
										<div class="collections-scroll-container">
											<for-each
												items=${() =>
													getSpaceCollections(store.selectedSpace).map(c => getCollectionBySlug(collections, c))}
												content=${() => (collection: Collection) => html`
													<button
														class="collection-logo-button"
														classList=${() => ({active: store.getEffectiveCollection() === collection.slug})}
														onclick=${() => this.#onCollectionSelect(collection)}
													>
														<img src=${collection.logo} alt=${collection.name} />
													</button>
												`}
											></for-each>
										</div>
									</div>
								`}
							></show-when>
						</show-on-device>
						<bottom-sheet-header>
							<div class="tabs-container">
								<div class="tabs-action-buttons">
									<heart-button></heart-button>
									<search-button></search-button>
								</div>
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
																condition=${() =>
																	this.showTemplateOverlay?._id === template._id &&
																	!store.isTemplateLoading(template._id)}
																content=${() => html`
																	<template-item-overlay
																		selected-template=${() => template}
																		onclose=${this.#onTemplateOverlayClose}
																		onremix=${this.#onTemplateOverlayRemix}
																	></template-item-overlay>
																`}
															></show-when>
															<show-when
																condition=${() => store.isTemplateLoading(template._id)}
																content=${() => html` <loading-spinner-overlay></loading-spinner-overlay> `}
															></show-when>
														</div>
														<div class="template-product-name">${template.name}</div>
														<div
															class="template-product-price-container"
															classList=${() => ({viewOnly: store.selectedSpace?.viewOnly})}
														>
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
				condition=${() => this.showRemixOverlay && store.remixOverlayTemplate !== null}
				content=${() => html`
					<remix-overlay
						selected-template=${() => store.remixOverlayTemplate}
						onclose=${this.#closeRemixOverlay}
					></remix-overlay>
				`}
			></show-when>
			<show-on-device device="mobile">
				<bottom-navigation
					classList=${() => ({
						hidden: (this.showRemixOverlay && store.remixOverlayTemplate !== null) || this.showDetailView,
					})}
				>
					<div
						class="template-info"
						classList=${() => {
							const templates = Array.from(store.selectedTemplates.values())
							return {hidden: templates.length === 0 || true}
						}}
					>
						${() => {
							const templates = Array.from(store.selectedTemplates.values())
							if (templates.length > 0) {
								const selectedTemplate = templates[0]
								return html`
									<div class="template-image-wrapper">
										<img src=${selectedTemplate.thumb} alt=${selectedTemplate.name} class="template-image" />
									</div>
									<div class="template-details">
										<div class="template-name">${selectedTemplate.name}</div>
										<div class="template-price">€ ${selectedTemplate.price || '125.00'}</div>
									</div>
								`
							}
							return ''
						}}
					</div>
					<button
						class="view-details-btn"
						classList=${() => {
							const templates = Array.from(store.selectedTemplates.values())
							return {hidden: templates.length === 0 || true}
						}}
						disabled
					>
						View details
					</button>
					<div
						class="default-nav"
						classList=${() => {
							const templates = Array.from(store.selectedTemplates.values())
							return {hidden: templates.length > 0 && false}
						}}
					>
						<avatar-dropdown
							open=${() => this.showAvatarSelection}
							show-popup
							onavatar-dropdown-click=${this.#onAvatarDropdownClick}
						></avatar-dropdown>
						<nav-items ontab-change=${this.#onNavTabChange}></nav-items>
					</div>
				</bottom-navigation>
			</show-on-device>
		</bottom-sheet>

		<dialog-element
			open=${() => this.showLoginDialog}
			closeable="false"
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

		<avatar-swap-bottom-sheet
			open=${() => this.showAvatarSwapSheet}
			selected-template=${() => this.avatarSwapTemplate}
			onavatar-swapped=${this.#onAvatarSwapped}
			onclose=${this.#onAvatarSwapCancel}
		></avatar-swap-bottom-sheet>
	`

	css = css/*css*/ `
		${onboardingStyles}
		:host {
			display: contents;
		}

		app-buttons-left {
			display: none;
			pointer-events: auto;
			z-index: 100;
		}
		.template-sheet-overlay {
			position: fixed;
			left: 0;
			right: 0;
			bottom: 0;
			top: 0;
			background: rgba(0, 0, 0, 0.5);
			z-index: 1999;
			pointer-events: auto;
			touch-action: none;
			-webkit-touch-callout: none;
			-webkit-user-select: none;
			user-select: none;
			border-top-left-radius: 1rem;
			border-top-right-radius: 1rem;
		}

		@media (min-width: 768px) {
			app-buttons-left {
				z-index: 0;
				display: block;
				--app-buttons-left-transform: translateX(0) !important;
				--app-buttons-left-transform: translateY(-10px) !important;
			}

			show-on-device[device='desktop'] {
				display: contents;
			}

			.template-view-buttons {
				position: sticky;
				top: 0;
				display: flex;
				align-items: center;
				background: var(--uiColorPrimaryWhite);
				z-index: 11;
				width: 100%;
				min-height: 52px;
			}

			tabs-provider bottom-sheet-header {
				position: sticky;
				top: 52px;
				z-index: 10;
				background: var(--uiColorPrimaryWhite);
				border-top: var(--borderWidth) solid var(--uiColorBorderColor);
				padding-top: var(--uiSpacingMedium);
			}

			tabs-provider .tabs-container {
				border-bottom: none;
			}
			.template-sheet-overlay {
				border-top-left-radius: 1rem;
				border-top-right-radius: unset;
				border-bottom-left-radius: 1rem;
			}
		}

		.align-right {
			margin-left: auto;
		}

		.tabs-container {
			display: flex;
			align-items: center;
			gap: var(--uiSpacingSmall);
			padding: var(--uiSpacing);
			padding-top: 0;
			padding-bottom: var(--uiSpacingSmall);
			background: var(--uiColorPrimaryWhite);
			border-bottom: var(--borderWidth) solid var(--uiColorBorderColor);
		}

		.tabs-action-buttons {
			display: flex;
			gap: var(--uiSpacingSmall);
			margin-right: var(--uiSpacingSmall);
			border: none;
		}

		.tabs-content-container {
			padding: var(--uiSpacing);
			padding-top: 0;
			padding-bottom: var(--uiSpacingXxl);
			background: var(--uiColorPrimaryWhite);
		}
		.items-grid {
			display: grid;
			grid-template-columns: repeat(3, 1fr);
			gap: var(--uiGap);
		}

		/* Add bottom padding on desktop to prevent content hiding behind navigation */
		@media (min-width: 768px) {
			.tabs-content-container {
				padding-bottom: 80px;
			}
			.items-grid {
				grid-template-columns: repeat(4, 1fr);
			}
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

		.template-product-price-container.viewOnly {
			display: none;
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

		/* Done button styles */
		.done-button {
			background: var(--uiColorPrimaryBlack);
			color: var(--uiColorPrimaryWhite);
			border: none;
			border-radius: var(--borderRadiusPill);
			height: var(--buttonHeight);
			padding: var(--uiSpacingSmall) var(--uiSpacingMedium);
			font-size: var(--fontSizeTextXs);
			font-weight: var(--fontWeightSemiBold);
			cursor: pointer;
			transition: var(--transitionFast);
		}

		.done-button:hover {
			background: var(--uiColorPrimaryBlack);
			opacity: 0.8;
		}

		.hidden {
			display: none;
		}

		.template-info {
			display: flex;
			align-items: center;
			gap: 12px;
		}

		.template-image-wrapper {
			position: relative;
			width: 40px;
			height: 40px;
			overflow: hidden;
			border-radius: var(--borderRadiusCircular);
			border: 1px solid var(--uiColorAccentViolet);
			transition: border-color 0.3s ease;
			background: var(--appBackground);
		}

		.template-image {
			width: 100%;
			height: 100%;
			object-fit: contain;
			object-position: center;
			margin-top: 0;
		}

		.template-details {
			display: flex;
			flex-direction: column;
			gap: 2px;
		}

		.template-name {
			font-size: 10px;
			font-weight: var(--fontWeightSemiBold);
			color: var(--uiColorPrimaryBlack);
			margin: 0;
		}

		.template-price {
			font-size: 12px;
			color: #424347;
			margin: 0;
		}

		.view-details-btn {
			background: #f6f6f6;
			border-radius: var(--borderRadiusPill);
			border: var(--borderWidth) solid #8c8c8c;
			padding: 8px 16px;
			font-size: 10px;
			font-weight: 500;
			color: #8c8c8c;
			cursor: pointer;
			transition: background 0.2s ease;
		}

		.view-details-btn:hover:not(:disabled) {
			background: #eeeeee;
		}

		.view-details-btn:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}

		.default-nav {
			display: contents;
		}

		.hidden {
			display: none !important;
		}

		/* Floating spaces selector */
		.floating-spaces-selector {
			display: flex;
			justify-content: center;
			align-items: center;
		}

		.collections-navigation {
			margin-top: 0;
			display: none;
		}

		.collections-mobile-navigation {
			padding: 0 20px 12px;
			display: block;
		}

		.collections-scroll-container {
			display: flex;
			gap: var(--uiSpacingSmall);
			overflow-x: auto;
			align-items: center;
			scrollbar-width: none;
		}

		.collections-scroll-container::-webkit-scrollbar {
			display: none;
		}

		.collection-logo-button {
			width: 42px;
			height: 42px;
			min-width: 42px;
			min-height: 42px;
			border-radius: var(--borderRadiusCircular);
			background: var(--uiColorPrimaryBlack);
			cursor: pointer;
			transition: all var(--transitionFast);
			display: flex;
			align-items: center;
			justify-content: center;
			overflow: hidden;
			border: 2px solid transparent;
			padding: 0;
		}

		.collection-logo-button:hover {
		}

		.collection-logo-button.active {
			border-color: var(--uiColorAccentViolet);
		}

		.collection-logo-button img {
			width: 100%;
			height: 100%;
			object-fit: cover;
			object-position: center;
			margin-top: 0;
		}

		remix-overlay {
			margin-top: -60px;
		}

		@media (min-width: 768px) {
			.collections-mobile-navigation {
				display: none;
			}

			.collections-navigation {
				display: block;
			}

			remix-overlay {
				margin-top: -85px;
			}
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
