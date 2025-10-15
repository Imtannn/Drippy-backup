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

import '../elements/placeholder-image.js'

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
	static readonly elementName = 'item-card'

	@booleanAttribute itemActive = false
	@stringAttribute itemSrc = ''
	@stringAttribute itemAlt = ''
	@attribute itemValue = null
	@attribute objectFit = 'cover'
	@attribute objectPosition = 'center'
	@attribute aspectRatio = '1'
	@eventAttribute oncardselected = null
	@attribute imageStyle = ''

	connectedCallback() {
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

	template = () => html`
		<div class="item-card" onclick=${this.#onClick} classList=${() => ({active: this.itemActive})}>
			<div class="item-preview">
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

	css = css/*css*/ `
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

declare module 'lume' {
	interface IntrinsicElements {
		'item-card': ElementAttributes<ItemCard, ItemCardAttributes>
	}
}
