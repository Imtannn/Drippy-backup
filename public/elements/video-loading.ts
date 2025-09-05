import {booleanAttribute, css, Element, element, html, type ElementAttributes} from 'lume'

type VideoLoadingAttributes = 'isVisible'

const loadingUrl = new URL('../videos/logogif.gif', import.meta.url).href

@element
export class VideoLoading extends Element {
	static elementName = 'video-loading'

	@booleanAttribute isVisible = false
 
	private hideTimeout: number | null = null
	private isActuallyVisible = false

	connectedCallback() {
		super.connectedCallback()

		console.log('VideoLoading connected, isVisible:', this.isVisible)

		// Force show loading cho landing page
		this.isVisible = true
		if (this.isVisible) {
			console.log('Auto showing loading...')
			this.showLoading()
		}

		this.createEffect(() => {
			console.log('Effect triggered, isVisible:', this.isVisible, 'isActuallyVisible:', this.isActuallyVisible)
			if (this.isVisible && !this.isActuallyVisible) {
				this.showLoading()
			} else if (!this.isVisible && this.isActuallyVisible) {
				this.hideLoading()
			}
		})
	}

	showLoading() {
		this.isActuallyVisible = true
		this.style.setProperty('--opacity', '1')

		if (this.hideTimeout) {
			clearTimeout(this.hideTimeout)
			this.hideTimeout = null
		}

		// this.hideTimeout = setTimeout(() => {
		// 	console.log('Auto hiding after', this.minDisplayTime, 'ms at:', Date.now())
		// 	this.isVisible = false

		// 	setTimeout(() => {
		// 		if (this.parentNode) {
		// 			this.parentNode.removeChild(this)
		// 		}
		// 	}, 500)
		// }, this.minDisplayTime) as unknown as number
	}

	hideLoading() {
		this.isActuallyVisible = false
		this.style.setProperty('--opacity', '0')

		if (this.hideTimeout) {
			clearTimeout(this.hideTimeout)
			this.hideTimeout = null
		}
	}

	template = () => html`
		<div class="video-loading">
			<img class="loading-gif" src=${loadingUrl} alt="Loading..." />
			<div class="fallback-loader">
				<div class="spinner"></div>
			</div>
		</div>
	`

	css = css/*css*/ `
		:host {
			--opacity: 0;
			opacity: var(--opacity);
			transition: opacity 0.5s ease-in-out;
			/* Full page loading */
			display: block;
			width: 100vw;
			height: 100vh;
			position: fixed;
			top: 0;
			left: 0;
			z-index: 9999;
		}

		.video-loading {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 100%;
			height: 100%;
			position: relative;
			background: rgba(0, 0, 0, 0.8);
		}

		.loading-gif {
			max-width: 100%;
			max-height: 100%;
			width: auto;
			height: auto;
			position: relative;
			z-index: 10;
			object-fit: contain;
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
			background: rgba(0, 0, 0, 0.9);
			z-index: 5;
		}

		.spinner {
			width: 80px;
			height: 80px;
			border: 6px solid rgba(76, 169, 195, 0.2);
			border-top: 6px solid rgba(76, 169, 195, 1);
			background: rgba(76, 169, 195, 0.1);
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

		/* Dark theme support */
		[data-theme='dark'] .fallback-loader {
			background: rgba(0, 0, 0, 0.95);
		}

		[data-theme='dark'] .spinner {
			border-color: rgba(76, 169, 195, 0.3);
			border-top-color: rgba(76, 169, 195, 1);
		}
	`
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			[VideoLoading.elementName]: ElementAttributes<VideoLoading, VideoLoadingAttributes>
		}
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'video-loading': VideoLoading
	}
}
