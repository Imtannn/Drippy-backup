import {batch, css, Element, element, html, onCleanup, signal, type ElementAttributes} from 'lume'
import {Meteor} from 'meteor/meteor'
import {templates} from '../consts/templates.js'
import {onboardingStyles} from '../styles/onboarding-styles.js'
import type {Template, TemplateCategory} from '../types/template.js'
import type {Collection, TemplateMap} from '../types/types.js'
import {getCollectionBySlug, getSpaceCollections, spaceHasMultipleCollections} from '../utils.js'
import {
	currentUser,
	store,
	updateGarmentsSelectionInUrl,
	wishlist,
	pendingWishlistId,
	setPendingWishlistId,
	isLoggedIn,
} from './store.js'
import {templateHelpers} from './TemplateHelpers.js'

import {collections} from '../consts/collections.js'
import '../elements/animation-select.js'
import '../elements/avatar-dropdown.js'
import '../elements/avatar-swap-bottom-sheet.js'
import '../elements/back-button.js'
import '../elements/bottom-sheet.js'
import '../elements/cube-button.js'
import '../elements/dialog-element.js'
import '../elements/heart-button.js'
import '../elements/home-button.js'
import '../elements/logic/for-each.js'
import '../elements/logic/index-each.js'
import '../elements/logic/show-when.js'
import '../elements/login-ui.js'
import '../elements/nav-bar.js'
import '../elements/nav-items.js'
import '../elements/person-button.js'
import '../elements/placeholder-image.js'
import '../elements/preview-button.js'
import '../elements/save-button.js'
import '../elements/search-button.js'
import '../elements/show-on-device.js'
import '../elements/tabs.js'
import '../elements/theme-switch-button.js'

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

type TemplateViewAttributes = keyof object // no attributes yet

@element
export class TemplateView extends Element {
	static override readonly elementName = 'template-view'

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
	@signal showBottomNavigation = true

	// Drag scroll state
	@signal isDragging = false
	@signal startX = 0
	@signal override scrollLeft = 0
	private hasDragged = false

	@signal disabledScroll = false
	@signal showWishlistOnly = false
	private isOpeningOverlay = false
	private defaultCollection = 'gap'
	override connectedCallback() {
		super.connectedCallback()

		// Add click handler to close overlay when clicking outside
		document.addEventListener('click', this.#onDocumentClick)

		this.addEventListener('close', this.#onDetailViewClose)
		// Listen for show-login event on document to catch events from nested components
		document.addEventListener('show-login', this.#onShowLogin as EventListener)

		this.createEffect(() => {
			const effectiveCollection = store.getEffectiveCollection()
			// For multi-collection spaces, allow null to show all templates
			// For single-collection spaces, fallback to defaultCollection
			if (spaceHasMultipleCollections(store.selectedSpace)) this.spaceCollection = effectiveCollection
			else this.spaceCollection = effectiveCollection ?? this.defaultCollection
		})

		// Update template categories when templates change
		this.createEffect(() => {
			const defaultCategories: TemplateCategory[] = ['Dress', 'Shirt', 'Top', 'Jacket', 'Skirt', 'Pants', 'Jumpsuit']
			let collectionTemplates: Template[] = []

			// When filtering by wishlist, search across all collections in the space (or all collections if no space)
			// Otherwise, filter by selected collection
			if (this.showWishlistOnly) {
				if (store.selectedSpace) {
					// For wishlist filter, get templates from all collections in the space
					const spaceCollections = getSpaceCollections(store.selectedSpace)
					for (const collectionSlug of spaceCollections) collectionTemplates.push(...(templates[collectionSlug] ?? []))
				}
				// If no space selected, search across all collections
				else {
					for (const collectionTemplatesList of Object.values(templates))
						collectionTemplates.push(...(collectionTemplatesList ?? []))
				}
			} else if (!this.spaceCollection && spaceHasMultipleCollections(store.selectedSpace)) {
				// If no collection selected and multi-collection space, aggregate from all collections
				const spaceCollections = getSpaceCollections(store.selectedSpace)
				for (const collectionSlug of spaceCollections) collectionTemplates.push(...(templates[collectionSlug] ?? []))
			} else if (this.spaceCollection) collectionTemplates = templates[this.spaceCollection] ?? []
			else collectionTemplates = templates[this.defaultCollection] ?? []

			// Filter by wishlist if showWishlistOnly is true
			if (this.showWishlistOnly) {
				const userWishlist = store.wishlist
				const wishlistTemplateIds = new Set(userWishlist.map(item => item.templateId))
				// Include pending wishlist ID to show items that were just favorited but not yet synced
				// Only check pending if user is logged in (consistent with item-card logic)
				const user = store.user
				if (user) {
					const pendingId = pendingWishlistId()
					if (pendingId) wishlistTemplateIds.add(pendingId)
				}
				collectionTemplates = collectionTemplates.filter(template => wishlistTemplateIds.has(template._id))
			}

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
			// Auto-select first category only if wishlist filter is not active
			if (!this.showWishlistOnly) {
				const categories = Object.keys(this.templateCategories)
				// Reset to first category if currently on wishlist
				if (this.selectedTab === 'wishlist' || !this.selectedTab)
					if (categories.length > 0) this.selectedTab = categories[0] as TemplateCategory
			} else if (this.selectedTab !== 'wishlist')
				// When wishlist is activated, ensure selectedTab is set to 'wishlist'
				this.selectedTab = 'wishlist' as TemplateCategory
		})

		// Close login dialog and auto-favorite pending template when user successfully logs in
		this.createEffect(() => {
			// FIXME: STOP making duplicate auth code. See the duplication in spaces-selection.ts
			const user = currentUser()
			if (isLoggedIn(user) && this.showLoginDialog) {
				this.showLoginDialog = false

				// Auto-favorite pending template if exists
				const templateId = pendingWishlistId()
				if (templateId) {
					// Add to wishlist (don't clear pending yet - keep it active until wishlist syncs)
					let checkTimeoutId: ReturnType<typeof setTimeout> | null = null
					const addTimeoutId = setTimeout(async () => {
						try {
							await Meteor.callAsync('wishlist.add', templateId)

							// Wait for wishlist to sync, then clear pending
							let retryCount = 0
							const maxRetries = 15
							const checkWishlist = () => {
								const currentWishlist = wishlist()
								const isInWishlist = currentWishlist.some(item => item.templateId === templateId)
								if (isInWishlist) {
									setPendingWishlistId(null)
									if (checkTimeoutId) clearTimeout(checkTimeoutId)
								} else if (retryCount < maxRetries) {
									retryCount++
									checkTimeoutId = setTimeout(checkWishlist, 200)
								} else setPendingWishlistId(null)
							}
							checkTimeoutId = setTimeout(checkWishlist, 300)
						} catch (error: unknown) {
							console.error('Error adding to wishlist after login:', error)
							setPendingWishlistId(null)
						}
					}, 500) // Wait a bit for subscription to be ready

					onCleanup(() => {
						clearTimeout(addTimeoutId)
						if (checkTimeoutId) clearTimeout(checkTimeoutId)
					})
				}
			}
		})
		// Update URL when fabrics change
		this.createEffect(() => {
			updateGarmentsSelectionInUrl(store.selectedGarments)
		})
	}

	#onDragStart = (e: MouseEvent) => {
		const container = e.currentTarget as HTMLElement
		this.isDragging = true
		this.hasDragged = false
		this.startX = e.pageX - container.offsetLeft
		this.scrollLeft = container.scrollLeft
		container.style.cursor = 'grabbing'
	}

	#onDragEnd = (e: MouseEvent) => {
		const container = e.currentTarget as HTMLElement
		this.isDragging = false
		container.style.cursor = 'grab'
		// Reset hasDragged after a short delay to allow click to be blocked
		setTimeout(() => (this.hasDragged = false), 0)
	}

	#onDragMove = (e: MouseEvent) => {
		if (!this.isDragging) return
		e.preventDefault()
		const container = e.currentTarget as HTMLElement
		const x = e.pageX - container.offsetLeft
		const walk = (x - this.startX) * 1.5 // Scroll speed multiplier
		// Mark as dragged if moved more than 5px
		if (Math.abs(x - this.startX) > 5) this.hasDragged = true
		container.scrollLeft = this.scrollLeft - walk
	}

	#onItemClick = async (e: CustomEvent) => {
		const template = e.detail.itemValue as Template

		const isAlreadySelected =
			store.selectedTemplates[template.category] && store.selectedTemplates[template.category]._id === template._id

		if (!isAlreadySelected) {
			store.setLoadingTemplate(template._id, template.category)
			this.#selectTemplate(template)
			setTimeout(() => {
				this.isOpeningOverlay = false
			}, 0)
		}

		this.showTemplateOverlay = template
		this.isOpeningOverlay = true
	}

	#isTemplateActive = (template: Template) => {
		return store.selectedTemplates[template.category]?._id === template._id
	}

	#renderTemplateItem = (template: Template) => {
		return html`
			<div
				class="template-item"
				classList=${() => ({
					'item-active':
						this.showRemixOverlay &&
						store.remixOverlayTemplate !== null &&
						store.remixOverlayTemplate._id === template._id,
				})}
			>
				<div
					class="template-item-container"
					classList=${() => ({
						'item-active':
							this.showRemixOverlay &&
							store.remixOverlayTemplate !== null &&
							store.remixOverlayTemplate._id === template._id,
					})}
				>
					<item-card
						item-active=${() =>
							this.showRemixOverlay && store.remixOverlayTemplate !== null
								? store.remixOverlayTemplate._id === template._id
								: this.#isTemplateActive(template)}
						item-src=${template.thumb}
						item-alt=${template.name}
						item-value=${template}
						oncardselected=${this.#onItemClick}
						object-fit="contain"
						object-position="center"
						aspect-ratio="0.79"
						data-show-wishlist="true"
					></item-card>
					<show-when
						condition=${() => this.showTemplateOverlay?._id === template._id && !store.isTemplateLoading(template._id)}
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
				<div class="template-product-price-container" classList=${() => ({viewOnly: store.selectedSpace?.viewOnly})}>
					<div class="template-product-price" classList=${() => ({wholesale: store.selectedSpace?.isWholesale})}>
						${() => (template.price !== 'N/A' ? 'EU ' + template.price : 'N/A')}
					</div>
					<show-when
						condition=${() => store.selectedSpace?.isWholesale}
						content=${() => html`<div class="template-product-wholesale">MOQ: 5pcs</div>`}
					></show-when>
				</div>
			</div>
		`
	}

	// #onPreviewButtonClick = () => {
	// 	batch(() => {
	// 		const user = currentUser()

	// 		if (user) {
	// 			searchParams().set('isPreview', 'true')
	// 			store.isPreview = true
	// 			this.showAvatarSelection = false
	// 			this.showPoseSelection = false
	// 			this.showRemixOverlay = false
	// 			this.showTemplateOverlay = null
	// 			store.setSelectingPiece = null
	// 			pushState()
	// 		} else {
	// 			this.showLoginDialog = true
	// 		}
	// 	})
	// }

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
			store.setSelectingPiece = null
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
			store.setSelectingPiece = null
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
			store.setSelectingPiece = null
			this.showTemplateOverlay = null
			this.showAvatarSwapSheet = false
			this.avatarSwapTemplate = null
		})
	}

	#closeRemixOverlay = () => {
		batch(() => {
			this.showRemixOverlay = false
			store.setSelectingPiece = null
			store.setRemixOverlayTemplate = null
			this.disabledScroll = false
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
			this.disabledScroll = true
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

	#onShowLogin = (e: Event) => {
		const customEvent = e as CustomEvent<{templateId: string}>
		if (customEvent.detail?.templateId)
			// Store pending template id (persisted to localStorage)
			setPendingWishlistId(customEvent.detail.templateId)

		this.showLoginDialog = true
	}

	#onCollectionSelect = (collection: Collection) => {
		if (this.hasDragged) return
		// Toggle: if already selected, unselect to show all templates
		if (store.getEffectiveCollection() === collection.slug) store.setSelectedCollection = null
		else store.setSelectedCollection = collection.slug
	}

	#onHeartButtonClick = () => {
		const newWishlistState = !this.showWishlistOnly
		this.showWishlistOnly = newWishlistState

		// Set tab to "wishlist" when wishlist filter is activated, so tabs-content can display
		if (newWishlistState) this.selectedTab = 'wishlist' as TemplateCategory
		else {
			// Reset to first category when wishlist is deactivated
			const categories = Object.keys(this.templateCategories)
			if (categories.length > 0) this.selectedTab = categories[0] as TemplateCategory
		}
	}

	#selectTemplate = (template: Template) => {
		const effectiveSpace = store.getEffectiveSpace()
		if (!effectiveSpace) return

		const newTemplates: TemplateMap = {...store.selectedTemplates}
		let nextSelection = templateHelpers.cloneSelectedGarments(store.selectedGarments)

		// check if the template with same category already exists
		const overridingCategories = templateHelpers.checkOverridingCategories(
			template.category,
			store.selectedTemplates,
		) as TemplateCategory[]

		if (overridingCategories.length > 0) {
			nextSelection = templateHelpers.omitTemplateCategories(nextSelection, overridingCategories)
			for (const category of overridingCategories) if (store.selectedTemplates[category]) delete newTemplates[category]
		}

		newTemplates[template.category] = template
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
		)
			this.showTemplateOverlay = null
	}

	#onBottomSheetSnapChange = (e: CustomEvent) => {
		const snapPoint = e.detail.snapPoint
		const drippyScene = document.querySelector('body')
		if (snapPoint < 0.1) {
			this.showBottomNavigation = false
			drippyScene?.style.setProperty('--overrideSceneTranslateY', 'translateY(0)')
		} else {
			drippyScene?.style.setProperty('--overrideSceneTranslateY', 'translateY(-100px)')
			this.showBottomNavigation = true
		}
	}
	override disconnectedCallback() {
		super.disconnectedCallback()
		document.removeEventListener('click', this.#onDocumentClick)
		document.removeEventListener('show-login', this.#onShowLogin as EventListener)
	}
	override template = () => html`
		<app-buttons-preset
			preset="template-flow"
			brand-name="MoiDien"
			show-animation=${() => store.showAnimationSelect}
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
			show-remix-overlay=${() => this.showRemixOverlay && store.remixOverlayTemplate !== null}
			disabled-scroll=${() => this.disabledScroll}
			float-direction="right"
			scale-scene
			default-snap=${() => (this.showDetailView ? '0.88' : '0.41')}
			snap-points="0.02,0.2,0.41,0.6,0.88"
			max-height="100vh"
			onsnap=${this.#onBottomSheetSnapChange}
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
				<show-when
					condition=${() => !(this.showRemixOverlay && store.remixOverlayTemplate !== null)}
					content=${() => html`
						<div class="template-view-buttons">
							<nav-bar
								position="top"
								classList=${() => ({
									hidden: this.showDetailView,
								})}
							>
								<div
									class="template-info"
									classList=${() => {
										const templates = Object.values(store.selectedTemplates)
										return {hidden: templates.length === 0 || true}
									}}
								>
									${() => {
										const templates = Object.values(store.selectedTemplates)
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
										const templates = Object.values(store.selectedTemplates)
										return {hidden: templates.length === 0 || true}
									}}
									disabled
								>
									View details
								</button>
								<div
									class="default-nav"
									classList=${() => {
										const templates = Object.values(store.selectedTemplates)
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
							</nav-bar>
						</div>
					`}
				></show-when>
			</show-on-device>
			<show-when
				condition=${() => this.showDetailView}
				content=${() => html`
					<template-detail-view
						selected-template=${() => Object.values(store.selectedTemplates)[0] || null}
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
					(this.selectedTab !== null || this.showWishlistOnly)}
				content=${() => html`
					<tabs-provider
						selected-value=${() => (this.showWishlistOnly ? 'wishlist' : this.selectedTab || '')}
						default-value=${() => this.selectedTab || ''}
						ontabchange=${(e: CustomEvent) => {
							// Disable wishlist filter when a tab is selected (not wishlist)
							if (e.detail.value !== 'wishlist') this.showWishlistOnly = false

							this.selectedTab = e.detail.value as TemplateCategory
						}}
					>
						<show-when
							condition=${() => !(this.showRemixOverlay && store.remixOverlayTemplate !== null)}
							content=${() => html`
								<bottom-sheet-header>
									<div class="tabs-container">
										<div class="tabs-action-buttons">
											<heart-button
												active=${() => this.showWishlistOnly}
												onclick=${this.#onHeartButtonClick}
											></heart-button>
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
									<show-when
										condition=${() =>
											spaceHasMultipleCollections(store.selectedSpace) &&
											!this.showAvatarSelection &&
											!this.showPoseSelection &&
											!this.showDetailView &&
											this.selectedTab !== null}
										content=${() => html`
											<div class="collections-navigation">
												<div
													class="collections-scroll-container"
													onmousedown=${this.#onDragStart}
													onmouseleave=${this.#onDragEnd}
													onmouseup=${this.#onDragEnd}
													onmousemove=${this.#onDragMove}
												>
													<for-each
														items=${() =>
															getSpaceCollections(store.selectedSpace).map(c => getCollectionBySlug(collections, c))}
														content=${() => (collection: Collection) => html`
															<button
																draggable=${false}
																class="collection-logo-button"
																classList=${() => ({active: store.getEffectiveCollection() === collection.slug})}
																onclick=${() => this.#onCollectionSelect(collection)}
															>
																<img
																	draggable=${false}
																	src=${collection.logo || '/images/drippy-logo.webp'}
																	alt=${collection.name}
																/>
															</button>
														`}
													></for-each>
												</div>
											</div>
										`}
									></show-when>
								</bottom-sheet-header>
							`}
						></show-when>

						<div class="tabs-content-container">
							<!-- Show wishlist items when wishlist filter is active -->
							<show-when
								condition=${() => this.showWishlistOnly}
								content=${() => html`
									<tabs-content selected-value="wishlist">
										<div class="items-grid">
											<for-each
												items=${() => this.templateCategories.All ?? []}
												content=${() => (template: Template) => this.#renderTemplateItem(template)}
											></for-each>
										</div>
									</tabs-content>
								`}
							></show-when>
							<!-- Show category tabs when wishlist is not active -->
							<show-when
								condition=${() => !this.showWishlistOnly}
								content=${() => html`
									<for-each
										items=${() => Object.keys(this.templateCategories)}
										content=${() => (category: TemplateCategory) => html`
											<tabs-content selected-value=${category}>
												<div class="items-grid">
													<for-each
														items=${() =>
															category === 'All'
																? (this.templateCategories.All ?? [])
																: this.templateCategories[category]}
														content=${() => (template: Template) => this.#renderTemplateItem(template)}
													></for-each>
												</div>
											</tabs-content>
										`}
									></for-each>
								`}
							></show-when>
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
						disabled-scroll=${() => this.disabledScroll}
					></remix-overlay>
				`}
			></show-when>
			<show-on-device device="mobile">
				<nav-bar
					position="bottom"
					classList=${() => ({
						hidden:
							(this.showRemixOverlay && store.remixOverlayTemplate !== null) ||
							this.showDetailView ||
							!this.showBottomNavigation,
					})}
				>
					<div
						class="template-info"
						classList=${() => {
							const templates = Object.values(store.selectedTemplates)
							return {hidden: templates.length === 0 || true}
						}}
					>
						${() => {
							const templates = Object.values(store.selectedTemplates)
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
							const templates = Object.values(store.selectedTemplates)
							return {hidden: templates.length === 0 || true}
						}}
						disabled
					>
						View details
					</button>
					<div
						class="default-nav"
						classList=${() => {
							const templates = Object.values(store.selectedTemplates)
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
				</nav-bar>
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
	override css = css /*css*/ `
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
				z-index: 1000;
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

		/* Remove tab-container boder-bottom on mobile */
		@media (max-width: 768px) {
			.tabs-container {
				border-bottom: none;
				padding-top: var(--uiSpacingSmall);
				padding-bottom: var(--uiSpacingMedium);
			}
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

		@media (min-width: 768px) {
			.template-item-container.item-active {
				z-index: 2001;
				position: relative;
			}
		}

		.template-product-name {
			font-size: var(--fontSizeTextXs);
			font-weight: var(--fontWeightSemiBold);
			color: #424347;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
			height: 20px;
			text-align: center;
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
			font-weight: var(--fontWeightMedium);
			color: #424347;
			text-align: center;
			width: 100%;
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
			display: block;
			padding-right: 0;
			padding-left: var(--uiSpacing);
			padding-top: 0;
			padding-bottom: var(--uiSpacingSmall);
			background: var(--uiColorPrimaryWhite);
		}

		.collections-scroll-container {
			display: flex;
			gap: var(--uiSpacingSmall);
			overflow-x: auto;
			align-items: center;
			scrollbar-width: none;
			padding-right: 20px;
			cursor: grab;
			user-select: none;
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
			background: var(--uiColorPrimaryWhite);
			cursor: pointer;
			transition: all var(--transitionFast);
			display: flex;
			align-items: center;
			justify-content: center;
			overflow: hidden;
			border: 1px solid #e9e9ea;
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

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			'template-view': ElementAttributes<TemplateView, TemplateViewAttributes>
		}
	}
}
