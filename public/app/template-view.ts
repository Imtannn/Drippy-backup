import {batch, css, Element, element, html, memo, onCleanup, signal, type ElementAttributes} from 'lume'
import {Meteor} from 'meteor/meteor'
import {getTemplatesByCollection, templates} from '../consts/templates.js'
import {collections} from '../consts/collections.js'
import {animations} from '../consts/poses.js'
import {onboardingStyles} from '../styles/onboarding-styles.js'
import type {Template, TemplateCategory} from '../types/template.js'
import type {Avatar, TemplateMap} from '../types/types.js'
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
import {pushHistory} from './history.js'
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
import './item-card.js'
import './loading-spinner-overlay.js'
import './remix-overlay.js'
import './template-detail-view.js'
import './template-item-overlay.js'

type TemplateViewAttributes = keyof object // no attributes yet

type AvatarsTab = 'character' | 'animation'
const HIDDEN_TEMPLATE_IDS_KEY = 'hiddenTemplateIds'

@element
export class TemplateView extends Element {
	static override readonly elementName = 'template-view'

	@signal private selectedTab: TemplateCategory | null = null
	@signal private templateCategories: Record<TemplateCategory, Template[]> = {} as Record<TemplateCategory, Template[]>
	@signal private spaceCollection: string | string[] | null = null
	@signal private showLoginDialog = false
	@signal private showAvatarSelection = false
	@signal private avatarsSelectedTab: AvatarsTab = 'character'
@signal private showRemixOverlay = false
	@signal private showTemplateOverlay: Template | null = null
	@signal private hoveredTemplateId: string | null = null
	@signal private showAvatarSwapSheet = false
	@signal private avatarSwapTemplate: Template | null = null
	@signal private showDetailView = false
	@signal private detailTemplate: Template | null = null
	@signal private showBottomNavigation = true
	@signal private hiddenTemplateIds: string[] = []
	@signal private showHiddenItemsView = false

	@signal private disabledScroll = false
	@signal private showWishlistOnly = false
	@signal private selectedBrandFilter: string | null = null
	private isOpeningOverlay = false

	@signal private documentElementMutations = createMutationsSignal(document.documentElement, {
		attributes: true,
		attributeFilter: ['class'],
	})

	@memo private get isDragging() {
		this.documentElementMutations()
		return document.documentElement.classList.contains('is-dragging')
	}

	@memo private get hiddenTemplates() {
		const hiddenIds = new Set(this.hiddenTemplateIds)
		return templates().filter(template => hiddenIds.has(template._id))
	}

	@memo private get visibleGridTemplates() {
		if (this.showHiddenItemsView) return this.hiddenTemplates
		if (this.showWishlistOnly) return this.#filterByBrand(this.templateCategories.All ?? [])
		if (!this.selectedTab) return []
		const selectedItems =
			this.selectedTab === 'All' ? (this.templateCategories.All ?? []) : (this.templateCategories[this.selectedTab] ?? [])
		return this.#filterByBrand(selectedItems)
	}

	@memo private get visibleItemCount() {
		return this.visibleGridTemplates.length
	}

	override connectedCallback() {
		super.connectedCallback()

		if (typeof window !== 'undefined') {
			const raw = localStorage.getItem(HIDDEN_TEMPLATE_IDS_KEY)
			if (raw) {
				try {
					const parsed = JSON.parse(raw) as string[]
					if (Array.isArray(parsed)) this.hiddenTemplateIds = parsed
				} catch {
					this.hiddenTemplateIds = []
				}
			}
		}

		// Add click handler to close overlay when clicking outside
		document.addEventListener('click', this.#onDocumentClick)

		this.addEventListener('close', this.#onDetailViewClose)
		// Listen for show-login event on document to catch events from nested components
		document.addEventListener('show-login', this.#onShowLogin as EventListener)
		document.addEventListener('open-hidden-items', this.#onOpenHiddenItems as EventListener)

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

			// Hide templates with problematic thumbnails until assets are replaced.
			collectionTemplates = collectionTemplates.filter(template => template.name !== 'Dress V127')
			collectionTemplates = collectionTemplates.filter(template => !this.hiddenTemplateIds.includes(template._id))

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

		this.createEffect(() => {
			if (!this.#shouldShowBrandFilter() && this.selectedBrandFilter) this.selectedBrandFilter = null
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

	#audioCtx: AudioContext | null = null

	#brainrotPhrases = [
		'Bombardiro Crocodilo',
		'Tralalero Tralala',
		'Bombombini Gusini',
		'Skibidi',
		'No cap fr fr',
		'Sigma',
		'Ohio',
		'W rizz',
		'Bussin',
		'It is giving',
		'Bro is so cooked',
		'Slay',
		'Based',
		'Bro fell off',
		'Lil bro is cooked no cap',
	]

	#playBrainrot() {
		// 1 in 4 chance
		if (Math.random() > 0.25) return
		if (!window.speechSynthesis) return

		const phrase = this.#brainrotPhrases[Math.floor(Math.random() * this.#brainrotPhrases.length)]!
		const utter = new SpeechSynthesisUtterance(phrase)
		utter.pitch = 0.5 + Math.random() * 1.5   // random pitch 0.5–2.0
		utter.rate = 1.0
		utter.volume = 0.7
		window.speechSynthesis.cancel()
		window.speechSynthesis.speak(utter)
	}

	#playEquipSound() {
		this.#audioCtx ??= new AudioContext()
		const ctx = this.#audioCtx

		// Two-tone "equip" blip: a quick high sweep + soft body
		const now = ctx.currentTime

		const osc1 = ctx.createOscillator()
		const osc2 = ctx.createOscillator()
		const gain1 = ctx.createGain()
		const gain2 = ctx.createGain()

		osc1.type = 'sine'
		osc1.frequency.setValueAtTime(520, now)
		osc1.frequency.exponentialRampToValueAtTime(880, now + 0.08)
		gain1.gain.setValueAtTime(0.18, now)
		gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15)

		osc2.type = 'sine'
		osc2.frequency.setValueAtTime(880, now + 0.06)
		osc2.frequency.exponentialRampToValueAtTime(1200, now + 0.14)
		gain2.gain.setValueAtTime(0.0, now)
		gain2.gain.setValueAtTime(0.12, now + 0.06)
		gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.22)

		osc1.connect(gain1).connect(ctx.destination)
		osc2.connect(gain2).connect(ctx.destination)

		osc1.start(now); osc1.stop(now + 0.15)
		osc2.start(now + 0.06); osc2.stop(now + 0.22)
	}

	#onItemClick = async (e: CustomEvent) => {
		const template = e.detail.itemValue as Template
		// Prevent document click-away handler from closing immediately on the same click.
		this.isOpeningOverlay = true
		this.showTemplateOverlay = template

		const isAlreadySelected =
			store.selectedTemplates[template.category] && store.selectedTemplates[template.category]!._id === template._id

		if (isAlreadySelected) {
			setTimeout(() => {
				this.isOpeningOverlay = false
			}, 0)
			return
		}

		this.#playEquipSound()
		this.#playBrainrot()
		store.setLoadingTemplate(template._id, template.category)
		this.#selectTemplate(template)
		setTimeout(() => {
			this.isOpeningOverlay = false
		}, 0)

		const {fabrics} = templateHelpers.isRemixAvailableForTemplate(template, {
			selectedGarments: store.selectedGarments,
			selectedSpace: store.getEffectiveSpace(),
			sourceCollection: store.getEffectiveCollection(),
		})
		const hasFabricOptions = values(fabrics).some(fabricOptions => fabricOptions.length > 1)

		if (hasFabricOptions) this.#handleTemplateOverlayRemix(template)
	}

	#isTemplateActive = (template: Template) => {
		return store.selectedTemplates[template.category]?._id === template._id
	}

	#onAnimationClick = (e: CustomEvent) => {
		const animation = e.detail.itemValue
		store.selectedAnimation = animation.value
	}

	#getCurrentAnimationsData = () => {
		const currentAvatar = avatars().find(a => a.name === store.selectedAvatar)
		return currentAvatar?.gender === 'male' ? animations.male : animations.female
	}

	#renderCharacterItem = (avatar: Avatar) => {
		return html`
			<div style="min-width:0; overflow:hidden;">
				<item-card
					class=${() => (store.selectedAvatar === avatar.name ? 'item-preview' : '')}
					item-active=${() => store.selectedAvatar === avatar.name}
					item-src=${avatar.thumbnail}
					item-alt=${avatar.name}
					item-value=${avatar.name}
					oncardselected=${(e: CustomEvent) => (store.selectedAvatar = e.detail.itemValue)}
					object-fit="cover"
					object-position="top"
					aspect-ratio="0.79"
					image-style="scale: 2; top: 42%;"
					style="
						--appBackground: rgba(255, 255, 255, 0.12);
						--item-preview-border: 1px solid rgba(255, 255, 255, 0.22);
						--item-preview-hover-border-color: rgba(255, 255, 255, 0.4);
						--item-preview-active-border-color: #b28aff;
						--item-preview-active-shadow: 0 0 0 2px rgba(178, 138, 255, 0.35);
					"
				></item-card>
			</div>
		`
	}

	#renderAnimationItem = (animation: (typeof animations.female)[number]) => {
		return html`
			<div style="min-width:0; overflow:hidden;">
				<item-card
					class=${() => (store.selectedAnimation === animation.value ? 'item-preview' : '')}
					item-active=${() => store.selectedAnimation === animation.value}
					item-src=${animation.thumbnail}
					item-alt=${animation.name}
					item-value=${animation}
					oncardselected=${this.#onAnimationClick}
					object-fit="contain"
					object-position="center"
					aspect-ratio="0.79"
					style="
						--appBackground: rgba(255, 255, 255, 0.12);
						--item-preview-border: 1px solid rgba(255, 255, 255, 0.22);
						--item-preview-hover-border-color: rgba(255, 255, 255, 0.4);
						--item-preview-active-border-color: #b28aff;
						--item-preview-active-shadow: 0 0 0 2px rgba(178, 138, 255, 0.35);
					"
				></item-card>
			</div>
		`
	}

	#renderTemplateItem = (template: Template) => {
		const brandName = this.#getTemplateBrandName(template)

		return html`
			<div
				class="template-item"
				onmouseenter=${() => (this.hoveredTemplateId = template._id)}
				onmouseleave=${() => {
					if (this.hoveredTemplateId === template._id) this.hoveredTemplateId = null
				}}
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
						condition=${() =>
							this.#isTemplateActive(template) &&
							(this.showTemplateOverlay?._id === template._id || this.hoveredTemplateId === template._id)}
						content=${() => html`
							<template-item-overlay
								selected-template=${() => template}
								onclose=${this.#onTemplateOverlayClose}
								onremix=${this.#onTemplateOverlayRemix}
								onviewitem=${this.#onTemplateOverlayViewItem}
								onhideitem=${this.#onTemplateOverlayHideItem}
							></template-item-overlay>
						`}
					></show-when>
					<show-when
						condition=${() => store.isTemplateLoading(template._id)}
						content=${() => html` <loading-spinner-overlay></loading-spinner-overlay> `}
					></show-when>
				</div>
				<div class="template-item-meta">
					<div class="template-product-name">${template.name}</div>
					<div class="template-brand-name">${brandName}</div>
				</div>
			</div>
		`
	}

	#renderHiddenTemplateItem = (template: Template) => {
		const brandName = this.#getTemplateBrandName(template)
		return html`
			<div class="template-item">
				<div class="template-item-container">
					<item-card
						item-active=${false}
						item-src=${template.thumb}
						item-alt=${template.name}
						item-value=${template}
						object-fit="contain"
						object-position="center"
						aspect-ratio="0.79"
						data-show-wishlist="false"
					></item-card>
				</div>
				<div class="template-item-meta">
					<div class="template-product-name">${template.name}</div>
					<div class="template-brand-name">${brandName}</div>
					<button class="hidden-grid-restore-btn" onclick=${() => this.#restoreHiddenTemplate(template._id)}>Restore</button>
				</div>
			</div>
		`
	}

	#getTemplateBrandName = (template: Template) => {
		return collections().find(collection => collection.slug === template.collection)?.name ?? template.collection
	}

	#getBrandOptions = () => {
		const source = this.templateCategories.All ?? []
		const seen = new Set<string>()
		const brands: Array<{slug: string; name: string}> = []
		for (const template of source) {
			if (seen.has(template.collection)) continue
			seen.add(template.collection)
			brands.push({slug: template.collection, name: this.#getTemplateBrandName(template)})
		}
		return brands
	}

	#onBrandChipClick = (brandSlug: string) => {
		this.selectedBrandFilter = this.selectedBrandFilter === brandSlug ? null : brandSlug
	}

	#filterByBrand = (items: Template[]) => {
		if (!this.selectedBrandFilter) return items
		return items.filter(template => template.collection === this.selectedBrandFilter)
	}

	#shouldShowBrandFilter = () => this.#getBrandOptions().length > 1

	#onBackButtonClick = () => {
		batch(() => {
			// FIXME This logic is "go back to home" logic, however it is inaccessible
			// here to any other code that may want to go back to home. We need
			// to make code re-usable, and consistent, without repeating.

			// Reset UI state
			this.showAvatarSelection = false
			this.showLoginDialog = false
			this.showRemixOverlay = false
			store.setSelectingPiece = null
			this.showDetailView = false
			this.showTemplateOverlay = null
			this.showAvatarSwapSheet = false
			this.avatarSwapTemplate = null
			this.showHiddenItemsView = false
		})
	}

	#onAvatarDropdownClick = () => {
		batch(() => {
			this.showAvatarSelection = !this.showAvatarSelection
			this.showRemixOverlay = false
			store.setSelectingPiece = null
			this.showTemplateOverlay = null
			this.showAvatarSwapSheet = false
			this.avatarSwapTemplate = null
			this.showHiddenItemsView = false
		})
	}

	#onNavTabChange = (_e: CustomEvent) => {
		batch(() => {
			this.showAvatarSelection = false
			this.showRemixOverlay = false
			store.setSelectingPiece = null
			this.showTemplateOverlay = null
			this.showAvatarSwapSheet = false
			this.avatarSwapTemplate = null
			this.showHiddenItemsView = false
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

	#onTemplateOverlayViewItem = (e: CustomEvent<{template: Template}>) => {
		const template = e.detail?.template
		if (!template) return
		batch(() => {
			this.showTemplateOverlay = null
			this.showRemixOverlay = false
			store.setSelectingPiece = null
			store.setRemixOverlayTemplate = null
			this.disabledScroll = false
			this.detailTemplate = template
			this.showDetailView = true
		})
	}

	#onTemplateOverlayHideItem = (e: CustomEvent<{template: Template}>) => {
		const template = e.detail?.template
		if (!template) return

		const next = [...new Set([...this.hiddenTemplateIds, template._id])]
		this.hiddenTemplateIds = next
		if (typeof window !== 'undefined') localStorage.setItem(HIDDEN_TEMPLATE_IDS_KEY, JSON.stringify(next))
		this.showTemplateOverlay = null
	}

	#onOpenHiddenItems = () => {
		batch(() => {
			this.showAvatarSelection = false
			this.showRemixOverlay = false
			store.setSelectingPiece = null
			this.showTemplateOverlay = null
			this.showAvatarSwapSheet = false
			this.avatarSwapTemplate = null
			this.showHiddenItemsView = !this.showHiddenItemsView
		})
	}

	#restoreHiddenTemplate = (templateId: string) => {
		const next = this.hiddenTemplateIds.filter(id => id !== templateId)
		this.hiddenTemplateIds = next
		if (typeof window !== 'undefined') localStorage.setItem(HIDDEN_TEMPLATE_IDS_KEY, JSON.stringify(next))
	}

	#restoreAllHiddenTemplates = () => {
		this.hiddenTemplateIds = []
		if (typeof window !== 'undefined') localStorage.setItem(HIDDEN_TEMPLATE_IDS_KEY, '[]')
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
		this.detailTemplate = null
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
		this.selectedBrandFilter = null

		// Set tab to "wishlist" when wishlist filter is activated, so tabs-content can display
		if (newWishlistState) this.selectedTab = 'wishlist' as TemplateCategory
		else {
			// Reset to first category when wishlist is deactivated
			const categories = Object.keys(this.templateCategories)
			if (categories.length > 0) this.selectedTab = categories[0] as TemplateCategory
		}

		// Hide/clear brand filtering when only one brand is available.
		if (!this.#shouldShowBrandFilter()) this.selectedBrandFilter = null
	}

	#onBuildStoreButtonClick = () => {
		window.location.href = '/brand-experiences'
	}

	// FIXME too much mapping (see selectTemplate in brand-view.ts)
	// too much duplication (see brand-view.ts)
	#selectTemplate = (template: Template) => {
		const effectiveSpace = store.getEffectiveSpace()
		if (!effectiveSpace) return

		pushHistory()
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
		const clickPath = e.composedPath()
		const clickedInsideBottomSheet = clickPath.some(
			target =>
				target instanceof HTMLElement &&
				(target.tagName === 'BOTTOM-SHEET' ||
					target.tagName === 'REMIX-OVERLAY' ||
					target.closest?.('bottom-sheet, remix-overlay')),
		)

		// Close fabric/options overlay when clicking outside the side panel (e.g. 3D viewport)
		if (this.showRemixOverlay && !clickedInsideBottomSheet) {
			this.#closeRemixOverlay()
			return
		}

		// Close overlay when clicking outside
		if (
			this.showTemplateOverlay &&
			!clickPath.some(el => el instanceof HTMLElement && el.tagName === 'TEMPLATE-ITEM-OVERLAY')
		) {
			this.showTemplateOverlay = null
		}
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
		document.removeEventListener('open-hidden-items', this.#onOpenHiddenItems as EventListener)
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


		<bottom-sheet
			show-remix-overlay=${() => this.showRemixOverlay && store.remixOverlayTemplate !== null}
			disabled-scroll=${() => this.disabledScroll}
			float-direction="right"
			default-snap=${() => (this.showDetailView ? '0.88' : '0.41') /*TODO no duplicate magic numbers*/}
			snap-points="0.02,0.2,0.41,0.6,0.88"
			max-height="100vh"
			onsnap=${this.#onBottomSheetSnapChange}
			style="
				--bottom-sheet-bg: var(--panel-sheet-bg);
				--bottom-sheet-border-color: var(--panel-sheet-border);
				--bottom-sheet-panel-backdrop-filter: var(--panel-sheet-backdrop);
				--bottom-sheet-panel-shadow: var(--panel-sheet-shadow);
				--bottom-sheet-panel-desktop-left-radius: var(--borderRadiusXl);
				--bottom-sheet-content-desktop-radius: 0;
				--bottom-sheet-content-desktop-top-left-radius: var(--borderRadiusXl);
				--bottom-sheet-content-desktop-bottom-left-radius: var(--borderRadiusXl);
				--bottom-sheet-content-desktop-top-right-radius: 0;
				--bottom-sheet-content-desktop-bottom-right-radius: 0;
				--bottom-sheet-handle-bg: var(--panel-handle-bg);
				--bottom-sheet-handle-indicator-bg: var(--panel-handle-indicator);
				--bottom-sheet-collapse-pill-bg: var(--panel-collapse-pill-bg);
				--bottom-sheet-collapse-pill-border: var(--panel-collapse-pill-border);
				--bottom-sheet-collapse-pill-backdrop: var(--panel-collapse-pill-backdrop);
				--bottom-sheet-collapse-pill-shadow: var(--panel-collapse-pill-shadow);
				--bottom-sheet-collapse-pill-arrow: var(--panel-collapse-pill-arrow);
			"
		>
			<show-when
				condition=${() => this.showRemixOverlay && store.remixOverlayTemplate !== null}
				content=${() => html`<div class="template-sheet-overlay" onclick=${this.#closeRemixOverlay}></div>`}
			></show-when>

			<show-on-device desktop>
				<div class="template-view-buttons" classList=${() => ({hidden: this.showDetailView})}>
					<nav-bar
						position="top"
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
							<div class="item-count-badge">${() => `${this.visibleItemCount} items`}</div>
						</div>
					</nav-bar>
				</div>
			</show-on-device>
			<show-when
				condition=${() => this.showDetailView}
				content=${() => html`
					<template-detail-view
						selected-template=${() => this.detailTemplate}
						onclose=${this.#onDetailViewClose}
					></template-detail-view>
				`}
			></show-when>
			<show-when
				condition=${() => this.showAvatarSelection}
				content=${() => html`
					<tabs-provider
						selected-value=${() => this.avatarsSelectedTab}
						default-value="character"
						ontabchange=${(e: CustomEvent) => (this.avatarsSelectedTab = e.detail.value as AvatarsTab)}
					>
						<bottom-sheet-header>
							<div class="tabs-container avatar-tabs-container">
								<tabs-list>
									<tabs-trigger selected-value="character">Characters</tabs-trigger>
									<tabs-trigger selected-value="animation">Animations</tabs-trigger>
								</tabs-list>
							</div>
						</bottom-sheet-header>
						<div style="padding: 0 20px 60px; box-sizing: border-box;">
							<tabs-content selected-value="character">
								<div style="display:grid; grid-template-columns:repeat(3,1fr); gap:10px; overflow:hidden;">
									<for-each
										items=${() => avatars().filter((a: Avatar) => a.gender === 'female')}
										content=${() => (avatar: Avatar) => this.#renderCharacterItem(avatar)}
									></for-each>
								</div>
							</tabs-content>
							<tabs-content selected-value="animation">
								<div style="display:flex; justify-content:flex-end; margin-bottom:12px;">
									<button
										onclick=${() => (store.autoplayAnimations = !store.autoplayAnimations)}
										style=${() => `
											padding: 7px 14px;
											border-radius: 999px;
											border: 1px solid ${store.autoplayAnimations ? 'rgba(178, 138, 255, 0.65)' : 'rgba(255, 255, 255, 0.3)'};
											background: ${store.autoplayAnimations ? 'rgba(178, 138, 255, 0.2)' : 'rgba(255, 255, 255, 0.08)'};
											backdrop-filter: blur(6px);
											-webkit-backdrop-filter: blur(6px);
											color: white;
											font-size: 11px;
											font-weight: 700;
											cursor: pointer;
											letter-spacing: 0.04em;
											display: inline-flex;
											align-items: center;
											gap: 6px;
											box-shadow: ${store.autoplayAnimations ? '0 0 0 1px rgba(178, 138, 255, 0.35) inset' : 'none'};
										`}
									>${() => (store.autoplayAnimations ? '● AUTOPLAY ON' : '○ AUTOPLAY OFF')}</button>
								</div>
								<div style="display:grid; grid-template-columns:repeat(3,1fr); gap:10px; overflow:hidden;">
									<for-each
										items=${() => this.#getCurrentAnimationsData()}
										content=${() => (animation: (typeof animations.female)[number]) =>
											this.#renderAnimationItem(animation)}
									></for-each>
								</div>
							</tabs-content>
						</div>
					</tabs-provider>
				`}
			></show-when>
			<show-when
				condition=${() =>
					!this.showAvatarSelection &&
					!this.showDetailView &&
					(this.showHiddenItemsView || this.selectedTab !== null || this.showWishlistOnly)}
				content=${() => html`
					<show-when
						condition=${() => this.showHiddenItemsView}
						content=${() => html`
							<bottom-sheet-header class="hidden-grid-header-shell">
								<div class="tabs-container template-tabs-container hidden-grid-header">
									<div class="hidden-grid-title">Hidden items (${() => this.hiddenTemplates.length})</div>
									<div class="hidden-grid-actions">
										<button class="hidden-grid-header-btn" onclick=${this.#restoreAllHiddenTemplates}>
											Restore all
										</button>
										<button class="hidden-grid-header-btn" onclick=${this.#onOpenHiddenItems}>Done</button>
									</div>
								</div>
							</bottom-sheet-header>
							<div class="tabs-content-container">
								<show-when
									condition=${() => this.hiddenTemplates.length > 0}
									content=${() => html`
										<div class="items-grid">
											<for-each
												items=${() => this.hiddenTemplates}
												content=${() => (template: Template) => this.#renderHiddenTemplateItem(template)}
											></for-each>
										</div>
									`}
								></show-when>
								<show-when
									condition=${() => this.hiddenTemplates.length === 0}
									content=${() => html`<div class="hidden-items-empty">No hidden items.</div>`}
								></show-when>
							</div>
						`}
					></show-when>
					<show-when
						condition=${() => !this.showHiddenItemsView}
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
								<bottom-sheet-header>
									<div class="tabs-container template-tabs-container">
										<div class="tabs-action-buttons">
											<heart-button
												active=${() => this.showWishlistOnly}
												onclick=${this.#onHeartButtonClick}
											></heart-button>
										</div>
										<tabs-list>
											<for-each
												items=${() => Object.keys(this.templateCategories)}
												content=${() => (category: TemplateCategory) => html`
													<tabs-trigger
														selected-value=${category}
													>${category}</tabs-trigger>
												`}
											></for-each>
										</tabs-list>
									</div>
								</bottom-sheet-header>

								<div class="tabs-content-container">
									<show-when
										condition=${() => this.#shouldShowBrandFilter()}
										content=${() => html`
											<div class="brands-strip">
												<for-each
													items=${this.#getBrandOptions}
													content=${() => (brand: {slug: string; name: string}) => html`
														<button
															class="brand-logo-chip"
															classList=${() => ({active: this.selectedBrandFilter === brand.slug})}
															onclick=${() => this.#onBrandChipClick(brand.slug)}
														>
															<div class="brand-logo-mark">${brand.name.slice(0, 2).toUpperCase()}</div>
															<div class="brand-logo-label">${brand.name}</div>
														</button>
													`}
												></for-each>
											</div>
										`}
									></show-when>
									<!-- Show wishlist items when wishlist filter is active -->
									<show-when
										condition=${() => this.showWishlistOnly}
										content=${() => html`
											<tabs-content selected-value="wishlist">
												<div class="items-grid">
													<for-each
														items=${() => this.#filterByBrand(this.templateCategories.All ?? [])}
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
															this.#filterByBrand(
																category === 'All'
																	? (this.templateCategories.All ?? [])
																	: this.templateCategories[category],
															)}
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
			--panel-sheet-bg: rgba(255, 255, 255, 0.2);
			--panel-sheet-border: rgba(255, 255, 255, 0.18);
			--panel-sheet-backdrop: blur(5px) saturate(1.04);
			--panel-sheet-shadow: 0 6px 18px rgba(0, 0, 0, 0.1);
			--panel-handle-bg: rgba(255, 255, 255, 0.9);
			--panel-handle-indicator: rgba(140, 140, 140, 0.45);
			--panel-top-bg-desktop: rgba(255, 255, 255, 0.14);
			--panel-top-bg-mobile: rgba(255, 255, 255, 0.12);
			--panel-top-border: rgba(255, 255, 255, 0.1);
			--panel-tabs-bg: rgba(255, 255, 255, 0.08);
			--panel-tabs-trigger-inactive-bg: rgba(255, 255, 255, 0.36);
			--panel-tabs-trigger-color: rgba(18, 19, 22, 0.86);
			--panel-item-card-bg: rgba(255, 255, 255, 0.14);
			--panel-brand-chip-bg: rgba(255, 255, 255, 0.08);
			--panel-brand-chip-border: rgba(255, 255, 255, 0.2);
			--panel-collapse-pill-bg: rgba(255, 255, 255, 0.7);
			--panel-collapse-pill-border: rgba(255, 255, 255, 0.82);
			--panel-collapse-pill-backdrop: blur(8px) saturate(1.08);
			--panel-collapse-pill-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
			--panel-collapse-pill-arrow: rgba(0, 0, 0, 0.92);
		}

		:host-context([data-theme='dark']) {
			--panel-sheet-bg: rgba(18, 19, 22, 0.22);
			--panel-sheet-border: rgba(255, 255, 255, 0.12);
			--panel-sheet-backdrop: blur(10px) saturate(1.04);
			--panel-sheet-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
			--panel-handle-bg: rgba(18, 19, 22, 0.18);
			--panel-handle-indicator: rgba(255, 255, 255, 0.35);
			--panel-top-bg-desktop: rgba(18, 19, 22, 0.56);
			--panel-top-bg-mobile: rgba(18, 19, 22, 0.5);
			--panel-top-border: rgba(255, 255, 255, 0.12);
			--panel-tabs-bg: rgba(18, 19, 22, 0.5);
			--panel-tabs-trigger-inactive-bg: rgba(255, 255, 255, 0.2);
			--panel-tabs-trigger-color: rgba(255, 255, 255, 0.9);
			--panel-item-card-bg: rgba(18, 19, 22, 0.22);
			--panel-brand-chip-bg: rgba(18, 19, 22, 0.22);
			--panel-brand-chip-border: rgba(255, 255, 255, 0.16);
			--panel-collapse-pill-bg: rgba(18, 19, 22, 0.72);
			--panel-collapse-pill-border: rgba(255, 255, 255, 0.3);
			--panel-collapse-pill-backdrop: blur(24px) saturate(1.1);
			--panel-collapse-pill-shadow: 0 8px 22px rgba(0, 0, 0, 0.32);
			--panel-collapse-pill-arrow: rgba(255, 255, 255, 0.92);
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
				background: var(--panel-top-bg-desktop);
				backdrop-filter: blur(16px);
				-webkit-backdrop-filter: blur(16px);
				z-index: 1000;
				width: 100%;
				min-height: 52px;
				border-bottom: 1px solid var(--panel-top-border);
			}

			tabs-provider bottom-sheet-header {
				position: sticky;
				top: 52px;
				z-index: 10;
				background: var(--panel-top-bg-desktop);
				backdrop-filter: blur(16px);
				-webkit-backdrop-filter: blur(16px);
				border-top: none;
				padding-top: 0;
			}

			tabs-provider .tabs-container {
				background: var(--panel-top-bg-desktop) !important;
				border-bottom: 1px solid var(--panel-top-border);
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
			padding-top: 10px;
			padding-bottom: var(--uiSpacingSmall);
			background: var(--panel-tabs-bg);
			border-bottom: 1px solid var(--panel-top-border);
			--tabs-active-indicator-bg: rgba(18, 19, 22, 0.72);
			--tabs-hover-indicator-bg: rgba(255, 255, 255, 0.12);
			--tabs-trigger-inactive-bg: var(--panel-tabs-trigger-inactive-bg);
			--tabs-trigger-color: var(--panel-tabs-trigger-color);
			--tabs-trigger-active-color: #ffffff;
		}

		.template-tabs-container tabs-trigger {
			font-family: 'Anton', sans-serif;
			font-weight: 700;
			text-transform: uppercase;
			line-height: 0.98;
			text-shadow: none;
			-webkit-text-stroke: 0;
			font-synthesis: none;
		}

		.avatar-tabs-container tabs-trigger {
			font-family: 'Poppins', sans-serif;
			font-weight: 600;
			text-transform: none;
			line-height: 1.1;
			text-shadow: none;
			-webkit-text-stroke: 0;
			font-synthesis: none;
		}

		/* Remove tab-container boder-bottom on mobile */
		@media (max-width: 768px) {
			bottom-sheet {
				--bottom-sheet-bg: var(--panel-sheet-bg) !important;
				--bottom-sheet-border-color: var(--panel-sheet-border) !important;
				--bottom-sheet-panel-backdrop-filter: var(--panel-sheet-backdrop) !important;
				--bottom-sheet-panel-shadow: var(--panel-sheet-shadow) !important;
				--bottom-sheet-handle-bg: var(--panel-handle-bg) !important;
				--bottom-sheet-handle-indicator-bg: var(--panel-handle-indicator) !important;
			}

			tabs-provider bottom-sheet-header {
				position: sticky;
				top: var(--bottom-sheet-handle-height, 15px);
				z-index: 11;
				background: var(--panel-top-bg-mobile);
				backdrop-filter: blur(16px);
				-webkit-backdrop-filter: blur(16px);
				padding-top: 0;
			}

			.tabs-container {
				border-bottom: 1px solid var(--panel-top-border);
				padding-top: 4px;
				padding-bottom: var(--uiSpacingMedium);
				background: var(--panel-top-bg-mobile);
			}

			.tabs-content-container {
				background: transparent;
			}

			.template-item-container item-card {
				--appBackground: var(--panel-item-card-bg);
			}
		}

		.tabs-action-buttons {
			display: flex;
			gap: var(--uiSpacingSmall);
			margin-right: var(--uiSpacingSmall);
			border: none;
		}

		.hidden-grid-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 12px;
			background: rgba(0, 0, 0, 0.14);
			border-bottom: 1px solid rgba(255, 255, 255, 0.08);
			backdrop-filter: blur(6px);
			-webkit-backdrop-filter: blur(6px);
		}

		.hidden-grid-header-shell {
			position: sticky;
			top: 52px;
			z-index: 11;
			background: transparent !important;
			border: none !important;
			box-shadow: none !important;
		}

		@media (max-width: 768px) {
			.hidden-grid-header-shell {
				top: 0;
			}
		}

		.hidden-grid-title {
			font-family: 'Anton', sans-serif;
			font-size: 16px;
			text-transform: uppercase;
			line-height: 0.98;
			color: rgba(255, 255, 255, 0.92);
			white-space: nowrap;
		}

		.hidden-grid-actions {
			display: flex;
			align-items: center;
			gap: 8px;
		}

		.hidden-grid-header-btn,
		.hidden-grid-restore-btn {
			border: 1px solid rgba(255, 255, 255, 0.22);
			background: rgba(178, 138, 255, 0.18);
			color: rgba(255, 255, 255, 0.96);
			border-radius: 999px;
			padding: 6px 12px;
			font-size: 11px;
			font-weight: 700;
			cursor: pointer;
			white-space: nowrap;
			backdrop-filter: blur(6px);
			-webkit-backdrop-filter: blur(6px);
			box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
		}

		.hidden-grid-restore-btn {
			margin-top: 6px;
			width: 100%;
		}

		.hidden-items-empty {
			padding: 16px 0 6px;
			font-size: 13px;
			opacity: 0.8;
		}



		.tabs-content-container {
			padding: var(--uiSpacing);
			padding-top: 0;
			padding-bottom: var(--uiSpacingXxl);
			background: transparent;
		}

		.brands-strip {
			display: flex;
			gap: 8px;
			overflow-x: auto;
			overflow-y: hidden;
			padding: 10px 0 12px;
			margin-bottom: 4px;
			scrollbar-width: none;
		}

		.brands-strip::-webkit-scrollbar {
			display: none;
		}

		.brand-logo-chip {
			display: inline-flex;
			align-items: center;
			gap: 8px;
			border: 1px solid var(--panel-brand-chip-border);
			background: var(--panel-brand-chip-bg);
			color: rgba(255, 255, 255, 0.95);
			border-radius: 999px;
			padding: 6px 10px 6px 6px;
			cursor: pointer;
			flex: 0 0 auto;
		}

		.brand-logo-chip.active {
			background: rgba(178, 138, 255, 0.28);
			border-color: rgba(178, 138, 255, 0.65);
		}

		.brand-logo-mark {
			width: 24px;
			height: 24px;
			border-radius: 999px;
			background: #000;
			color: #fff;
			display: inline-flex;
			align-items: center;
			justify-content: center;
			font-size: 10px;
			font-weight: 700;
			letter-spacing: 0.02em;
		}

		.brand-logo-label {
			font-size: 11px;
			font-weight: 500;
			white-space: nowrap;
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
			background: transparent;
		}

		.template-item {
			min-width: 0;
			width: 100%;
			display: flex;
			flex-direction: column;
			gap: 10px;
			position: relative;
		}

		.template-item-meta {
			display: flex;
			flex-direction: column;
			gap: 2px;
		}

		.template-item-container {
			position: relative;
			width: 100%;
			height: 100%;
			flex: 1;

			item-card {
				--appBackground: var(--panel-item-card-bg);
			}

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
			font-weight: 700;
			color: #ffffff;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
			height: auto;
			margin: 0;
			text-align: center;
			font-family: 'Anton', sans-serif;
			text-transform: uppercase;
			line-height: 0.98;
			text-shadow: none;
			-webkit-text-stroke: 0;
			font-synthesis: none;
		}

		.template-brand-name {
			font-size: 11px;
			font-weight: 400;
			color: #ffffff;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
			text-align: center;
			font-family: 'Poppins', sans-serif;
			line-height: 1.2;
			margin: 0;
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
			font-weight: 700;
			color: var(--uiColorPrimaryBlack);
			margin: 0;
			font-family: 'Anton', sans-serif;
			text-transform: uppercase;
			line-height: 0.98;
			text-shadow: none;
			-webkit-text-stroke: 0;
			font-synthesis: none;
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

		.item-count-badge {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			margin-left: 8px;
			color: rgba(255, 255, 255, 0.9);
			font-size: 12px;
			font-weight: 500;
			letter-spacing: 0.02em;
			white-space: nowrap;
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
