import {batch, css, Element, element, html, memo, onCleanup, signal, type ElementAttributes} from 'lume'
import {Meteor} from 'meteor/meteor'
import {getTemplatesByCollection} from '../consts/templates.js'
import {poses, animations} from '../consts/poses.js'
import {onboardingStyles} from '../styles/onboarding-styles.js'
import type {Template, TemplateCategory} from '../types/template.js'
import type {TemplateMap} from '../types/types.js'
import {createMutationsSignal, getSpaceCollectionSlugs, values} from '../utils.js'
import {
	currentUser,
	isLoggedIn,
	pendingWishlistId,
	setPendingWishlistId,
	store,
	updateGarmentsSelectionInUrl,
	wishlist,
} from './store.js'
import {templateHelpers} from './TemplateHelpers.js'

import {avatars} from '../consts/avatars.js'
import '../elements/avatar-dropdown.js'
import '../elements/avatar-swap-bottom-sheet.js'
import '../elements/bottom-sheet.js'
import '../elements/dialog-element.js'
import '../elements/heart-button.js'
import '../elements/logic/for-each.js'
import '../elements/logic/show-when.js'
import '../elements/login-ui.js'
import '../elements/nav-bar.js'
import '../elements/nav-items.js'
import '../elements/show-on-device.js'
import '../elements/tabs.js'

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

type AvatarsTab = 'pose' | 'animation'

@element
export class TemplateView extends Element {
	static override readonly elementName = 'template-view'

	@signal private selectedTab: TemplateCategory | null = null
	@signal private templateCategories: Record<TemplateCategory, Template[]> = {} as Record<TemplateCategory, Template[]>
	@signal private spaceCollection: string | string[] | null = null
	@signal private showLoginDialog = false
	@signal private showAvatarSelection = false
	@signal private showAvatarsSelection = false
	@signal private avatarsSelectedTab: AvatarsTab = 'pose'
	@signal private showPoseSelection = false
	@signal private showRemixOverlay = false
	@signal private showTemplateOverlay: Template | null = null
	@signal private showAvatarSwapSheet = false
	@signal private avatarSwapTemplate: Template | null = null
	@signal private showDetailView = false
	@signal private showBottomNavigation = true

	@signal private disabledScroll = false
	@signal private showWishlistOnly = false
	private isOpeningOverlay = false

	@signal private documentElementMutations = createMutationsSignal(document.documentElement, {
		attributes: true,
		attributeFilter: ['class'],
	})

	@memo private get isDragging() {
		this.documentElementMutations()
		return document.documentElement.classList.contains('is-dragging')
	}

	override connectedCallback() {
		super.connectedCallback()

		// Add click handler to close overlay when clicking outside
		document.addEventListener('click', this.#onDocumentClick)

		this.addEventListener('close', this.#onDetailViewClose)
		// Listen for show-login event on document to catch events from nested components
		document.addEventListener('show-login', this.#onShowLogin as EventListener)

		this.createEffect(() => {
			const effectiveCollection = store.getEffectiveCollection()

			this.spaceCollection = effectiveCollection
		})

		// Update template categories when templates change
		this.createEffect(() => {
			const defaultCategories: TemplateCategory[] = ['Dress', 'Shirt', 'Top', 'Jacket', 'Skirt', 'Pants', 'Jumpsuit']
			let collectionTemplates: Template[] = []

			if (this.spaceCollection) collectionTemplates = getTemplatesByCollection(this.spaceCollection)
			else {
				// If no collection selected and multi-collection space, aggregate from all collections
				const spaceCollections = getSpaceCollectionSlugs(store.selectedSpace)
				for (const collectionSlug of spaceCollections)
					collectionTemplates.push(...getTemplatesByCollection(collectionSlug))
			}

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
			// FIXME stop using Maps unless they solve a problem such as a static cache or iteration speed
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

	#onItemClick = async (e: CustomEvent) => {
		const template = e.detail.itemValue as Template

		const isAlreadySelected =
			store.selectedTemplates[template.category] && store.selectedTemplates[template.category]!._id === template._id

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

	#onPoseClick = (e: CustomEvent) => {
		const poseValue = e.detail.itemValue.value
		store.selectedAnimation = poseValue
	}

	#onAnimationClick = (e: CustomEvent) => {
		const animation = e.detail.itemValue
		store.selectedAnimation = animation.value
	}

	#getCurrentPosesData = () => {
		const currentAvatar = avatars().find(a => a.name === store.selectedAvatar)
		return currentAvatar?.gender === 'male' ? poses.male : poses.female
	}

	#getCurrentAnimationsData = () => {
		const currentAvatar = avatars().find(a => a.name === store.selectedAvatar)
		return currentAvatar?.gender === 'male' ? animations.male : animations.female
	}

	#renderPoseItem = (pose: (typeof poses.female)[number]) => {
		return html`
			<item-card
				class=${() => (store.selectedAnimation === pose.value ? 'item-preview' : '')}
				item-active=${() => store.selectedAnimation === pose.value}
				item-src=${pose.thumbnail}
				item-alt=${pose.name}
				item-value=${pose}
				oncardselected=${this.#onPoseClick}
				object-fit="cover"
				object-position="center"
				aspect-ratio="0.79"
				image-style="width: 79px; height: 141px;margin: 0 auto;"
				item-name=${pose.name}
			></item-card>
		`
	}

	#renderAnimationItem = (animation: (typeof animations.female)[number]) => {
		return html`
			<item-card
				class=${() => (store.selectedAnimation === animation.value ? 'item-preview' : '')}
				item-active=${() => store.selectedAnimation === animation.value}
				item-src=${animation.thumbnail}
				item-alt=${animation.name}
				item-value=${animation}
				oncardselected=${this.#onAnimationClick}
				object-fit="cover"
				object-position="center"
				aspect-ratio="0.79"
				image-style="width: 79px; height: 141px;margin: 0 auto;"
				item-name=${animation.name}
			></item-card>
		`
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
				this.showAvatarsSelection = false
			} else if (tab === 'avatars') {
				this.showPoseSelection = false
				this.showAvatarSelection = false
				this.showAvatarsSelection = true
				this.avatarsSelectedTab = 'pose' // Default to pose tab
			} else {
				this.showPoseSelection = false
				this.showAvatarSelection = false
				this.showAvatarsSelection = false
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

	#onBuildStoreButtonClick = () => {
		window.location.href = '/brand-experiences'
	}

	// FIXME too much mapping (see selectTemplate in brand-view.ts)
	// too much duplication (see brand-view.ts)
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
		let translate = 0

		// FIXME leaking of resposbilities, template-view shouldn't be in
		// control translation for some other component that has nothing to do
		// with template-view.
		const drippyScene = document.querySelector('body')
		if (snapPoint < 0.1) {
			translate = 0
			this.showBottomNavigation = false
		} else if (snapPoint <= 0.2) {
			translate = -100
			this.showBottomNavigation = true
		} else if (snapPoint <= 0.41) {
			translate = -200
			this.showBottomNavigation = true
		} else if (snapPoint <= 0.6) {
			translate = -300
			this.showBottomNavigation = true
		} else if (snapPoint <= 0.88) {
			translate = -400
			this.showBottomNavigation = true
		} else {
			translate = -500
			this.showBottomNavigation = true
		}

		drippyScene?.style.setProperty('--overrideSceneTranslateY', translate + 'px')
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
			<show-on-device mobile>
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

		<button
			class="${() => 'build-store-button' + (this.isDragging ? ' isDragging' : '')}"
			onclick=${this.#onBuildStoreButtonClick}
		>
			<div class="build-store-button-icon">
				<div class="build-store-icon-circle">
					<img src="/images/landing/logo.webp" alt="Drippy logo" />
				</div>
			</div>
			<span class="build-store-button-text">Build your own 3D store</span>
			<span class="build-store-button-emoji">🔥</span>
			<span class="build-store-button-arrow">→</span>
		</button>

		<bottom-sheet
			show-remix-overlay=${() => this.showRemixOverlay && store.remixOverlayTemplate !== null}
			disabled-scroll=${() => this.disabledScroll}
			float-direction="right"
			default-snap=${() => (this.showDetailView ? '0.88' : '0.41') /*TODO no duplicate magic numbers*/}
			snap-points="0.02,0.2,0.41,0.6,0.88"
			max-height="100vh"
			onsnap=${this.#onBottomSheetSnapChange}
		>
			<show-when
				condition=${() => this.showRemixOverlay && store.remixOverlayTemplate !== null}
				content=${() => html`<div class="template-sheet-overlay" onclick=${this.#closeRemixOverlay}></div>`}
			></show-when>

			<show-on-device desktop>
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
										const templates = values(store.selectedTemplates)
										return {hidden: templates.length === 0 || true}
									}}
								>
									${() => {
										// TODO why only the first template? Seems wrong.
										const templates = values(store.selectedTemplates)
										const selectedTemplate = templates[0]!
										if (!selectedTemplate) return ''
										return html`
											<div class="template-image-wrapper">
												<img src=${selectedTemplate.thumb} alt=${selectedTemplate.name} class="template-image" />
											</div>
											<div class="template-details">
												<div class="template-name">${selectedTemplate.name}</div>
												<div class="template-price">€ ${selectedTemplate.price || '125.00'}</div>
											</div>
										`
									}}
								</div>
								<button
									class="view-details-btn"
									classList=${() => {
										const templates = values(store.selectedTemplates)
										return {hidden: templates.length === 0 || true}
									}}
									disabled
								>
									View details
								</button>
								<div
									class="default-nav"
									classList=${() => {
										const templates = values(store.selectedTemplates)
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
						selected-template=${() => values(store.selectedTemplates)[0] || null}
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
					(this.showAvatarsSelection || this.selectedTab !== null || this.showWishlistOnly)}
				content=${() => html`
					<tabs-provider
						selected-value=${() => {
							if (this.showAvatarsSelection) return this.avatarsSelectedTab
							return this.showWishlistOnly ? 'wishlist' : this.selectedTab || ''
						}}
						default-value=${() => {
							if (this.showAvatarsSelection) return this.avatarsSelectedTab
							return this.selectedTab || ''
						}}
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
											<show-when
												condition=${() => this.showAvatarsSelection}
												content=${() => html`
													<tabs-trigger selected-value="pose">Pose</tabs-trigger>
													<tabs-trigger selected-value="animation">Animation</tabs-trigger>
												`}
											></show-when>
											<show-when
												condition=${() => !this.showAvatarsSelection}
												content=${() => html`
													<for-each
														items=${() => Object.keys(this.templateCategories)}
														content=${() => (category: TemplateCategory) => html`
															<tabs-trigger selected-value=${category}>${category}</tabs-trigger>
														`}
													></for-each>
												`}
											></show-when>
										</tabs-list>
									</div>
								</bottom-sheet-header>
							`}
						></show-when>

						<div class="tabs-content-container">
							<!-- Show avatars selection (poses and animations) when avatars tab is active -->
							<show-when
								condition=${() => this.showAvatarsSelection}
								content=${() => html`
									<tabs-content selected-value="pose">
										<div class="items-grid">
											<for-each
												items=${() => this.#getCurrentPosesData()}
												content=${() => (pose: (typeof poses.female)[number]) => this.#renderPoseItem(pose)}
											></for-each>
										</div>
									</tabs-content>
									<tabs-content selected-value="animation">
										<div class="items-grid">
											<for-each
												items=${() => this.#getCurrentAnimationsData()}
												content=${() => (animation: (typeof animations.female)[number]) =>
													this.#renderAnimationItem(animation)}
											></for-each>
										</div>
									</tabs-content>
								`}
							></show-when>
							<!-- Show wishlist items when wishlist filter is active -->
							<show-when
								condition=${() => this.showWishlistOnly && !this.showAvatarsSelection}
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
							<!-- Show category tabs when wishlist is not active and avatars selection is not active -->
							<show-when
								condition=${() => !this.showWishlistOnly && !this.showAvatarsSelection}
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
			<show-on-device mobile>
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
							const templates = values(store.selectedTemplates)
							return {hidden: templates.length === 0 || true}
						}}
					>
						${() => {
							// TODO why only the first template? Seems wrong
							const templates = values(store.selectedTemplates)
							const selectedTemplate = templates[0]!
							if (!selectedTemplate) return ''
							return html`
								<div class="template-image-wrapper">
									<img src=${selectedTemplate.thumb} alt=${selectedTemplate.name} class="template-image" />
								</div>
								<div class="template-details">
									<div class="template-name">${selectedTemplate.name}</div>
									<div class="template-price">€ ${selectedTemplate.price || '125.00'}</div>
								</div>
							`
						}}
					</div>
					<button
						class="view-details-btn"
						classList=${() => {
							const templates = values(store.selectedTemplates)
							return {hidden: templates.length === 0 || true}
						}}
						disabled
					>
						View details
					</button>
					<div
						class="default-nav"
						classList=${() => {
							const templates = values(store.selectedTemplates)
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

		.build-store-button {
			display: flex;
			align-items: center;
			gap: 6px;
			padding: 8px 16px;
			background: rgba(18, 19, 22, 0.15);
			border: none;
			border-radius: 999px;
			cursor: pointer;
			margin: 0 auto;
			margin-bottom: var(--uiSpacingSmall);

			position: fixed;
			bottom: 2%;
			left: 2%;
			z-index: 1000;
			margin: 0;
		}

		.build-store-button-icon {
			display: flex;
			align-items: center;
			justify-content: center;
		}

		.build-store-icon-circle {
			width: 24px;
			height: 24px;
			display: flex;
			align-items: center;
			justify-content: center;
		}
		.build-store-icon-circle img {
			height: 100%;
			margin-top: 0 !important;
		}

		.build-store-button-text {
			color: white;
			font-size: var(--fontSizeTextSm);
			font-weight: var(--fontWeightSemiBold);
			white-space: nowrap;
		}

		.build-store-button-emoji {
			font-size: 14px;
		}

		.build-store-button-arrow {
			color: white;
			font-size: 14px;
			font-weight: var(--fontWeightSemiBold);
		}

		@media (max-width: 767px) {
			.build-store-button {
				padding: 7.5px 10px;
				bottom: 9px;
				translate: 0 calc(-1 * var(--bottom-sheet-height, 100dvh * 0.41));

				transition-property: translate;
				transition-timing-function: ease-in-out;

				/* transition-duration: var(--transitionTimeFast); */
				transition-duration: 0; /*FIXME transition disable not working, disable anim for now*/

				will-change: translate;
				left: 10px;

				&.isDragging {
					transition-duration: 0;
				}
			}
			.build-store-icon-circle {
				width: 19px;
				height: 19px;
			}
			.build-store-button-text {
				font-size: var(--fontSizeTextXs);
			}

			.build-store-button-emoji {
				font-size: var(--fontSizeTextXs);
			}

			.build-store-button-arrow {
				font-size: var(--fontSizeTextXs);
			}
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

			&:hover {
				transform: scale(1.02);
			}
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
			word-wrap: break-word;
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
