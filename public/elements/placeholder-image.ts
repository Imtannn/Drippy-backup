import {attribute, css, element, Element, html, signal, stringAttribute, type ElementAttributes} from 'lume'

type PlaceholderImageAttributes = 'src' | 'alt' | 'objectFit' | 'objectPosition' | 'imageStyle'

@element
export class PlaceholderImage extends Element {
	static override readonly elementName = 'placeholder-image'

	@stringAttribute src = ''
	@stringAttribute alt = ''
	@stringAttribute objectFit = 'cover'
	@stringAttribute objectPosition = 'center'
	@attribute imageStyle = ''
	@signal private hasLoaded = false

	#onLoad = () => {
		this.hasLoaded = true
	}

	#computeImgStyle() {
		const styles: string[] = []
		const objectFit = (this.objectFit || '').trim()
		const objectPosition = (this.objectPosition || '').trim()
		if (objectFit) styles.push(`object-fit: ${objectFit}`)
		if (objectPosition) styles.push(`object-position: ${objectPosition}`)
		if (this.imageStyle) styles.push(this.imageStyle)
		return styles.join('; ')
	}
	override template = () => html`
		<div class="image-wrapper">
			<div
				alt=""
				aria-hidden="true"
				class="placeholder animate-pulse"
				classList=${() => ({hidden: this.hasLoaded})}
			></div>
			<img
				src=${() => this.src}
				alt=${() => this.alt}
				onload=${this.#onLoad}
				class="actual"
				style=${() => this.#computeImgStyle()}
			/>
		</div>
	`
	override css = css/*css*/ `
		:host {
			display: block;
			width: 100%;
			height: 100%;
		}

		.image-wrapper {
			position: relative;
			inline-size: 100%;
			block-size: 100%;
			display: flex;
		}

		img {
			display: block;
			inline-size: 100%;
			block-size: 100%;
		}

		img.placeholder {
			position: absolute;
			top: 0;
			left: 0;
			inline-size: 100%;
			block-size: 100%;
			z-index: 1;
			opacity: 1;
			transition: opacity 0.2s ease;
			pointer-events: none;
			background: var(--appBackground);
		}

		img.placeholder.hidden {
			opacity: 0;
		}

		img.actual {
			position: relative;
			z-index: 0;
		}

		@keyframes pulse {
			50% {
				opacity: 0.5;
			}
		}

		.animate-pulse {
			animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
		}
	`
}

declare global {
	interface HTMLElementTagNameMap {
		'placeholder-image': PlaceholderImage
	}
}

declare module 'lume' {
	interface IntrinsicElements {
		'placeholder-image': ElementAttributes<PlaceholderImage, PlaceholderImageAttributes>
	}
}
