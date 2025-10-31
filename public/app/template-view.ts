import {batch, css, Element, element, html, onCleanup, signal, type ElementAttributes} from 'lume'
import {templates} from '../consts/templates.js'
import {spaces} from '../consts/spaces.js'
import {onboardingStyles} from '../styles/onboarding-styles.js'
import type {Block, BlockCategory} from '../types/block.js'
import type {Fabric} from '../types/fabric.js'
import type {Template, TemplateCategory} from '../types/template.js'
import type {Space} from '../types/types.js'
import {blockManager} from './block-manager.js'
import {currentUser, store} from './store.js'

import '../elements/animation-select.js'
import '../elements/avatar-dropdown.js'
import '../elements/avatar-swap-bottom-sheet.js'
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
import '../elements/nav-items.js'
import '../elements/person-button.js'
import '../elements/placeholder-image.js'
import '../elements/preview-button.js'
import '../elements/save-button.js'
import '../elements/show-on-device.js'
import '../elements/tabs.js'
import '../elements/theme-switch-button.js'
import '../elements/top-navigation.js'
import {pushState, searchParams} from '../routes.js'
import {formatNumber} from '../utils.js'
import './app-buttons-preset.js'
import './app-buttons.js'
import './avatar-selection.js'
import './item-card.js'
import './loading-spinner-overlay.js'
import './pose-selection.js'
import './remix-overlay.js'
import {updateFabricsInUrl, updateGarmentsInUrl} from './store.js'
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
	private defaultCollection = 'moidien'

	connectedCallback() {
		super.connectedCallback()

		// Add click handler to close overlay when clicking outside
		document.addEventListener('click', this.#onDocumentClick)

		this.addEventListener('close', this.#onDetailViewClose)

		this.createEffect(() => {
			// If we're in 'drippy' mode (all spaces), use drippySelectedSpace, otherwise use store.selectedSpace
			if (store.selectedSpace?.collection === 'drippy') {
				this.spaceCollection = store.drippySelectedSpace?.collection ?? this.defaultCollection
			} else {
				this.spaceCollection = store.selectedSpace?.collection ?? this.defaultCollection
			}
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
		this.createEffect(() => {
			console.log('Fabrics to update URL:', store.selectedFabrics)
			updateFabricsInUrl(store.selectedFabrics)
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

		store.setLoadingTemplate(template._id)

		// If clicking on already selected template, show overlay instead of toggling
		this.isOpeningOverlay = true
		this.showTemplateOverlay = template
		this.#selectTemplate(template)
		setTimeout(() => {
			this.isOpeningOverlay = false
		}, 0)
		return

		// Check if template requires different gender avatar
		// const currentAvatar = avatars.find(a => a.name === store.selectedAvatar)
		// const currentGender = currentAvatar?.gender
		// const templateGender = template.avatar

		// if (currentGender && templateGender && currentGender !== templateGender) {
		// 	// Show avatar swap bottom sheet
		// 	batch(() => {
		// 		this.avatarSwapTemplate = template
		// 		this.showAvatarSwapSheet = true
		// 	})
		// 	return
		// }

		// Proceed with template selection
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
			this.showDetailView = false
			this.showTemplateOverlay = null
			this.showAvatarSwapSheet = false
			this.avatarSwapTemplate = null

			store.goBackHomeAndResetState()
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

	#onDrippySpaceSelect = (space: Space) => {
		store.drippySelectedSpace = space
	}

	#selectTemplate = (template: Template) => {
		const effectiveSpace = store.getEffectiveSpace()
		if (!effectiveSpace) return

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
		const templateBlockData = blockManager.convertTemplateToBlockData(template, effectiveSpace)
		const {newBlocksMap, newFabricsMap} = blockManager.getBlocksAndFabricsMapFromTemplateData(
			templateBlockData,
			effectiveSpace,
		)
		newBlocks.set(template.category, newBlocksMap)
		newFabrics.set(template.category, newFabricsMap)

		batch(() => {
			store.selectedFabrics = newFabrics

			// @ts-expect-error FIXME we should avoid having different ways of
			// setting the same thing (see store.setSelectedBlocks, and
			// loadFromUrlParameters in drippy-app.ts).  This will get more
			// difficult to manage and error prone/buggy.
			store.__selectedBlocks = newBlocks

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
			show-animation=${() => store.getEffectiveSpace()?.collection === 'moidien'}
			disable-person-button=${false}
			disable-cube-button=${false}
			hide-preview-button=${() => this.showRemixOverlay}
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
			onback=${this.#onBackButtonClick}
			onpreview=${this.#onPreviewButtonClick}
			ondone=${this.#closeRemixOverlay}
			show-remix-overlay=${() => this.showRemixOverlay}
			default-snap=${() => (this.showDetailView ? '0.88' : undefined)}
		>
			<app-buttons-left>
				<app-buttons-group group-direction="row" custom-class="button-group-spread">
					<show-when
						condition=${() => !this.showRemixOverlay}
						content=${() => html`<back-button onclick=${this.#onBackButtonClick}></back-button>`}
					></show-when>

					<show-when
						condition=${() => !this.showRemixOverlay}
						content=${() => html`
							<preview-button
								class="align-right"
								button-disabled=${() => store.selectedTemplates.size === 0}
								onclick=${this.#onPreviewButtonClick}
							></preview-button>
						`}
					></show-when>
					<show-when
						condition=${() => this.showRemixOverlay}
						content=${() => html`
							<button class="done-button align-right" onclick=${this.#closeRemixOverlay}>Done</button>
						`}
					></show-when>
				</app-buttons-group>
			</app-buttons-left>
			<show-on-device device="desktop">
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
				<show-when
					condition=${() => store.selectedSpace?.collection === 'drippy'}
					content=${() => html`
						<top-navigation>
							<div class="spaces-scroll-container">
								<for-each
									items=${() => spaces.filter(space => !space.isHidden)}
									content=${() => (space: Space) => html`
										<button
											class="space-logo-button"
											classList=${() => ({active: store.drippySelectedSpace?.slug === space.slug})}
											onclick=${() => this.#onDrippySpaceSelect(space)}
										>
											<img src=${space.logo || space.sceneThumbnail} alt=${space.name} />
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
					!this.showAvatarSelection &&
					!this.showPoseSelection &&
					!this.showDetailView &&
					this.selectedTab !== null &&
					!this.showRemixOverlay}
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
							<show-on-device device="mobile">
								<show-when
									condition=${() => store.selectedSpace?.collection === 'drippy'}
									content=${() => html`
										<div class="spaces-scroll-container">
											<for-each
												items=${() => spaces.filter(space => !space.isHidden)}
												content=${() => (space: Space) => html`
													<button
														class="space-logo-button"
														classList=${() => ({active: store.drippySelectedSpace?.slug === space.slug})}
														onclick=${() => this.#onDrippySpaceSelect(space)}
													>
														<img src=${space.logo || space.sceneThumbnail} alt=${space.name} />
													</button>
												`}
											></for-each>
										</div>
									`}
								></show-when>
							</show-on-device>
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
		@media (min-width: 768px) {
			app-buttons-left {
				position: relative;
				z-index: 0;
				display: block;
				--app-buttons-left-transform: translateX(0) !important;
				--app-buttons-left-transform: translateY(-10px) !important;
			}
		}

		.align-right {
			margin-left: auto;
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

		.spaces-scroll-container {
			display: flex;
			gap: var(--uiSpacingSmall);
			overflow-x: auto;
			align-items: center;
			scrollbar-width: none;
		}

		.spaces-scroll-container::-webkit-scrollbar {
			display: none;
		}

		.space-logo-button {
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

		.space-logo-button:hover {
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
		}

		.space-logo-button.active {
			border-color: var(--uiColorAccentViolet);
			box-shadow: 0 2px 8px rgba(138, 43, 226, 0.3);
		}

		.space-logo-button img {
			width: 100%;
			height: 100%;
			object-fit: cover;
			object-position: center;
			margin-top: 0;
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
