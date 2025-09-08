import {booleanAttribute, css, Element, element, html, signal, type ElementAttributes} from 'lume'

type VideoLoadingAttributes = 'isVisible'

const loadingVideoUrl = new URL('../videos/landing.mp4', import.meta.url).href

@element
export class VideoLoading extends Element {
	static elementName = 'video-loading'

	@booleanAttribute isVisible = false

	private hideTimeout: number | null = null
	private isActuallyVisible = false
	@signal private videoError = false

	connectedCallback() {
		super.connectedCallback()

		// Initialize visibility based on the actual isVisible prop
		if (this.isVisible) {
			this.showLoading()
		}

		this.createEffect(() => {
			if (this.isVisible && !this.isActuallyVisible) {
				this.showLoading()
			} else if (!this.isVisible && this.isActuallyVisible) {
				this.hideLoading()
			}
		})

		// Set up video event listeners after template is rendered
		setTimeout(() => {
			const video = this.shadowRoot?.querySelector('.loading-video') as HTMLVideoElement
			if (video) {
				video.addEventListener('loadeddata', () => {
					this.videoError = false
				})

				video.addEventListener('error', e => {
					console.error('[video-loading] Video error:', e, video.error)
					this.videoError = true
				})

				video.addEventListener('canplay', () => {
					if (video.paused) {
						video.play().catch(e => {
							console.warn('[video-loading] Video autoplay failed:', e)
							this.videoError = true
						})
					}
				})
			}
		}, 0)
	}

	showLoading() {
		this.isActuallyVisible = true

		// Clear any existing timeout when showing
		if (this.hideTimeout) {
			clearTimeout(this.hideTimeout)
			this.hideTimeout = null
		}

		// Small delay to ensure smooth transition instead of abrupt appearance
		requestAnimationFrame(() => {
			this.style.setProperty('--opacity', '1')
		})
	}

	hideLoading() {
		this.isActuallyVisible = false
		this.style.setProperty('--opacity', '0')

		// Clear any existing timeout when hiding
		if (this.hideTimeout) {
			clearTimeout(this.hideTimeout)
			this.hideTimeout = null
		}
	}

	template = () => html`
		<div class="video-loading">
			<video class="loading-video" autoplay muted loop playsinline>
				<source src=${loadingVideoUrl} type="video/mp4" />
			</video>
			<!-- Fallback spinner shown when video fails to load -->
			<div class="fallback-loader" style=${() => (this.videoError ? 'display: flex' : 'display: none')}>
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
			background: #010304;
		}

		.loading-video {
			width: 100vw;
			height: 100vh;
			position: absolute;
			top: 0;
			left: 0;
			z-index: 10;
			object-fit: cover;
			object-position: center;
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
			background: #010304;
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
			background: #010304;
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
