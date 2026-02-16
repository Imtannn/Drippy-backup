import {
	booleanAttribute,
	css,
	element,
	Element,
	eventAttribute,
	html,
	attribute,
	stringAttribute,
	type ElementAttributes,
} from 'lume'
import {Meteor} from 'meteor/meteor'
import type {Template} from '../types/template.js'
import {store, wishlist, pendingWishlistId, setPendingWishlistId} from './store.js'
import '../elements/placeholder-image.js'
import {getWishlistHeartIcon} from '../consts/icons.js'

// Track templates that are being unfavorited (optimistic update)
// This Set is shared across all ItemCard instances
const unfavoritingTemplates = new Set<string>()

type ItemCardAttributes =
	| 'itemValue'
	| 'itemSrc'
	| 'itemAlt'
	| 'itemActive'
	| 'oncardselected'
	| 'objectFit'
	| 'objectPosition'
	| 'aspectRatio'
	| 'imageStyle'
	| 'itemName'

@element
export class ItemCard extends Element {
	static override readonly elementName = 'item-card'

	@booleanAttribute itemActive = false
	@stringAttribute itemSrc = ''
	@stringAttribute itemAlt = ''
	@attribute itemValue = null
	@attribute objectFit = 'cover'
	@attribute objectPosition = 'center'
	@attribute aspectRatio = '1'
	@eventAttribute oncardselected = null
	@attribute imageStyle = ''
	@stringAttribute itemName = ''

	// Helper function to check if template is in wishlist (reactive)
	#isInWishlist = () => {
		const template = this.itemValue as Template | null
		if (!template?._id) return false

		// If template is being unfavorited, return false immediately (optimistic update)
		if (unfavoritingTemplates.has(template._id)) return false

		const userWishlist = wishlist()
		const inWishlist = userWishlist.some(item => item.templateId === template._id)
		const user = store.user
		const isPending = user ? pendingWishlistId() === template._id : false
		return inWishlist || isPending
	}
	override connectedCallback() {
		super.connectedCallback()

		this.createEffect(() => {
			this.style.setProperty('--aspect-ratio', this.aspectRatio)
		})

		this.createEffect(() => {
			this.style.setProperty('--object-position', this.objectPosition)
		})

		this.createEffect(() => {
			this.style.setProperty('--object-fit', this.objectFit)
		})
	}

	#onClick = () => {
		this.dispatchEvent(
			new CustomEvent('cardselected', {
				detail: {itemValue: this.itemValue},
				bubbles: true,
			}),
		)
	}

	#onHeartClick = async (e: Event) => {
		e.stopPropagation() // Prevent triggering card click

		const template = this.itemValue as Template | null
		if (!template?._id) return

		const user = store.user
		if (!user) {
			// Dispatch event to show login dialog with templateId
			const event = new CustomEvent('show-login', {
				bubbles: true,
				composed: true,
				detail: {templateId: template._id},
			})
			this.dispatchEvent(event)
			return
		}

		try {
			// Check current state: is it in database or just pending?
			const userWishlist = wishlist()
			const isInDatabase = userWishlist.some(item => item.templateId === template._id)
			const currentPendingId = pendingWishlistId()
			const isPending = currentPendingId === template._id
			const wasFavorited = isInDatabase || isPending

			// Clear pendingWishlistId if it matches
			if (isPending) setPendingWishlistId(null)

			if (wasFavorited) unfavoritingTemplates.add(template._id)
			else unfavoritingTemplates.delete(template._id)

			await Meteor.callAsync('wishlist.toggle', template._id)
			let retryCount = 0
			const maxRetries = 20 // Max 2 seconds (20 * 100ms)
			const checkSync = () => {
				const currentWishlist = wishlist()
				const isStillInWishlist = currentWishlist.some(item => item.templateId === template._id)

				// If subscription has synced (item removed from wishlist), remove from unfavoriting set
				if (wasFavorited && !isStillInWishlist) unfavoritingTemplates.delete(template._id)
				else if (!wasFavorited && isStillInWishlist)
					// If we favorited and it's now in wishlist, also remove (in case it was there before)
					unfavoritingTemplates.delete(template._id)
				else if (retryCount < maxRetries) {
					// Retry after a short delay if subscription hasn't synced yet
					retryCount++
					setTimeout(checkSync, 100)
				} else
					// Max retries reached, remove from set anyway to prevent memory leak
					unfavoritingTemplates.delete(template._id)
			}

			// Start checking after a short delay to allow subscription to sync
			setTimeout(checkSync, 50)
		} catch (error) {
			console.error('Error toggling wishlist:', error)
			// On error, remove from unfavoriting set to restore correct state
			unfavoritingTemplates.delete(template._id)
		}
	}

	get #shouldShowWishlist() {
		return this.hasAttribute('data-show-wishlist')
	}

	override template = () => html`
		<div class="item-card" onclick=${this.#onClick} classList=${() => ({active: this.itemActive})}>
			<div class="item-preview">
				${() =>
					this.#shouldShowWishlist
						? html`
								<button
									class="wishlist-heart"
									onclick=${this.#onHeartClick}
									classList=${() => ({active: this.#isInWishlist()})}
								>
									${getWishlistHeartIcon}
								</button>
							`
						: null}
				<placeholder-image
					src=${() => this.itemSrc}
					alt=${() => this.itemAlt}
					object-fit=${() => this.objectFit}
					object-position=${() => this.objectPosition}
					image-style=${() => this.imageStyle}
				></placeholder-image>
			</div>
			${() => (this.itemName ? html`<p class="item-card-name">${this.itemName}</p>` : null)}
		</div>
	`
	override css = css /*css*/ `
		:host {
			display: contents;
			--aspect-ratio: 1;
			--object-position: center;
			--object-fit: cover;
		}

		.item-card {
			display: flex;
			flex-direction: column;
			border-radius: 12px;
			cursor: pointer;
			position: relative;
			transition: transform 0.2s ease;
		}

		.item-card:hover {
			transform: scale(1.02);
		}

		@media (max-width: 768px) {
			.item-card:hover {
				transform: none;
			}
		}

		.item-preview {
			background: var(--appBackground);
			display: flex;
			align-items: center;
			justify-content: center;
			position: relative;
			width: 100%;
			aspect-ratio: var(--aspect-ratio);
			overflow: visible;
			border-radius: 10px;
			border: 2px solid transparent;
			transition: border-color 0.2s ease;
		}

		.item-preview > * {
			overflow: hidden;
			border-radius: 8px;
		}

		.item-card:hover .item-preview {
			border-color: var(--uiColorAccentViolet);
		}

		.item-card.active .item-preview {
			border-color: var(--uiColorAccentViolet);
		}

		.item-preview img {
			width: 100%;
			height: 100%;
			object-fit: var(--object-fit);
			object-position: var(--object-position);
		}
		.item-card-name {
			font-size: 12px;
			font-weight: 600;
			color: var(--uiColorPrimaryBlack);
			text-align: center;
			margin: 0;
			padding: 0;
		}

		.wishlist-heart {
			position: absolute;
			top: 6px;
			right: 8px;
			background: none;
			border: none;
			cursor: pointer;
			z-index: 4;
			padding: 0;
		}

		.wishlist-heart svg {
			width: 13px;
			height: 14px;
			color: #8c8c8c;
			transition: color 0.2s ease;
		}

		.wishlist-heart.active svg {
			color: #f40000;
		}

		.item-preview.fabric {
			background: linear-gradient(45deg, #ff6b6b, #ffd93d);
		}

		.item-preview.accessory {
			background: linear-gradient(45deg, #6c5ce7, #a29bfe);
		}

		@media (max-width: 768px) {
			.item-card {
				border-radius: 10px;
			}
		}
	`
}

declare global {
	interface HTMLElementTagNameMap {
		'item-card': ItemCard
	}
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			'item-card': ElementAttributes<ItemCard, ItemCardAttributes>
		}
	}
}
