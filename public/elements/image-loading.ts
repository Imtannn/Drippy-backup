import {css, Element, element, html, signal, type ElementAttributes} from 'lume'

const loadingImageUrl = new URL('../images/loading.webp', import.meta.url).href

@element
export class ImageLoading extends Element {
	static override readonly elementName = 'image-loading'

	@signal private imageError = false

	override connectedCallback() {
		super.connectedCallback()

		// Prevent body scroll when loading is showing
		document.body.style.overflow = 'hidden'
		document.documentElement.style.overflow = 'hidden'

		// Force white background on host element
		this.style.backgroundColor = '#fff'
		this.style.background = '#fff'

		// Set up image event listeners after template is rendered
		setTimeout(() => {
			const image = this.shadowRoot?.querySelector('.loading-image') as HTMLImageElement
			const imageContainer = this.shadowRoot?.querySelector('.image-loading') as HTMLElement
			const fallbackLoader = this.shadowRoot?.querySelector('.fallback-loader') as HTMLElement

			// Force white background on all elements
			if (imageContainer) {
				imageContainer.style.backgroundColor = '#fff'
				imageContainer.style.background = '#fff'
			}
			if (fallbackLoader) {
				fallbackLoader.style.backgroundColor = '#fff'
				fallbackLoader.style.background = '#fff'
			}
			if (image) {
				image.style.backgroundColor = '#fff'

				image.addEventListener('load', () => {
					this.imageError = false
				})

				image.addEventListener('error', e => {
					console.error('Image error:', e)
					this.imageError = true
				})
			}
		}, 0)
	}

	override disconnectedCallback() {
		super.disconnectedCallback()

		// Restore body scroll when component is removed
		document.body.style.overflow = ''
		document.documentElement.style.overflow = ''
	}

	override template = () => html`
		<div class="image-loading">
			<img class="loading-image" src=${loadingImageUrl} alt="Loading" />
			<!-- Fallback spinner shown when image fails to load -->
			<div class="fallback-loader" style=${() => (this.imageError ? 'display: flex' : 'display: none')}>
				<div class="spinner"></div>
			</div>
		</div>
	`

	override css = css /*css*/ `
		:host {
			display: block;
			width: 100vw;
			height: 100vh;
			position: fixed;
			top: 0;
			left: 0;
			z-index: 9999;
			background: #fff;
			overflow: hidden;
		}

		.image-loading {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 100%;
			height: 100%;
			background: #fff;
		}

		.loading-image {
			width: 90px;
			height: 90px;
			object-fit: contain;
			object-position: center;
			background: #fff;
		}

		.fallback-loader {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			display: flex;
			align-items: center;
			justify-content: center;
			background: #fff;
		}

		.spinner {
			width: 80px;
			height: 80px;
			border: 6px solid rgba(76, 169, 195, 0.2);
			border-top: 6px solid rgba(76, 169, 195, 1);
			border-radius: 50%;
			animation: spin 1s linear infinite;
		}

		@keyframes spin {
			0% {
				transform: rotate(0deg);
			}
			100% {
				transform: rotate(360deg);
			}
		}

		/* Mobile responsive */
		@media (max-width: 768px) {
			.loading-image {
				max-width: 100px;
				max-height: 100px;
			}
		}

		@media (max-width: 480px) {
			.loading-image {
				max-width: 100px;
				max-height: 100px;
			}
		}
	`
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			[ImageLoading.elementName]: ElementAttributes<ImageLoading, never>
		}
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'image-loading': ImageLoading
	}
}
