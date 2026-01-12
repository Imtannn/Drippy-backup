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

	// Track templates that are being unfavorited (optimistic update)
	// This Set is shared across all ItemCard instances
	private static readonly unfavoritingTemplates = new Set<string>()

	// Helper function to check if template is in wishlist (reactive)
	#isInWishlist = () => {
		const template = this.itemValue as Template | null
		if (!template?._id) return false

		// If template is being unfavorited, return false immediately (optimistic update)
		if (ItemCard.unfavoritingTemplates.has(template._id)) return false

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

			if (wasFavorited) ItemCard.unfavoritingTemplates.add(template._id)
			else ItemCard.unfavoritingTemplates.delete(template._id)

			await Meteor.callAsync('wishlist.toggle', template._id)
			let retryCount = 0
			const maxRetries = 20 // Max 2 seconds (20 * 100ms)
			const checkSync = () => {
				const currentWishlist = wishlist()
				const isStillInWishlist = currentWishlist.some(item => item.templateId === template._id)

				// If subscription has synced (item removed from wishlist), remove from unfavoriting set
				if (wasFavorited && !isStillInWishlist) ItemCard.unfavoritingTemplates.delete(template._id)
				else if (!wasFavorited && isStillInWishlist)
					// If we favorited and it's now in wishlist, also remove (in case it was there before)
					ItemCard.unfavoritingTemplates.delete(template._id)
				else if (retryCount < maxRetries) {
					// Retry after a short delay if subscription hasn't synced yet
					retryCount++
					setTimeout(checkSync, 100)
				} else
					// Max retries reached, remove from set anyway to prevent memory leak
					ItemCard.unfavoritingTemplates.delete(template._id)
			}

			// Start checking after a short delay to allow subscription to sync
			setTimeout(checkSync, 50)
		} catch (error) {
			console.error('Error toggling wishlist:', error)
			// On error, remove from unfavoriting set to restore correct state
			ItemCard.unfavoritingTemplates.delete(template._id)
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
			aspect-ratio: var(--aspect-ratio);
			/* Two-layer background: inner fill on padding-box, gradient border on border-box */
			background: var(--item-card-border);
			border-radius: 12px;
			overflow: hidden;
			cursor: pointer;
			border: 2px solid transparent; /* needed so the border-box layer shows */
			position: relative;
			left: 0; /* needed because the border shifted the element to the right */
			transition:
				transform 0.2s ease,
				background 0.2s ease;
		}

		.item-card:hover {
			transform: scale(1.02);
			--item-card-border: var(--uiColorAccentViolet);
		}

		@media (max-width: 768px) {
			.item-card:hover {
				transform: none;
				--item-card-border: none;
			}
		}

		.item-card.active {
			--item-card-border: var(--uiColorAccentViolet);
		}

		.item-preview {
			background: var(--appBackground);
			display: flex;
			align-items: center;
			justify-content: center;
			position: relative;
			width: 100%;
			height: 100%;

			img {
				width: 100%;
				height: 100%;
				object-fit: var(--object-fit);
				object-position: var(--object-position);
			}
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
