import {css, Element, element, html, signal} from 'lume'

const loadingVideoUrl = new URL('../videos/loading.mp4', import.meta.url).href

@element
export class VideoLoading extends Element {
	static elementName = 'video-loading'

	@signal private videoError = false

	connectedCallback() {
		super.connectedCallback()

		// Prevent body scroll when video is showing
		document.body.style.overflow = 'hidden'
		document.documentElement.style.overflow = 'hidden'

		// Force white background on host element
		this.style.backgroundColor = '#fff'
		this.style.background = '#fff'

		// Set up video event listeners after template is rendered
		setTimeout(() => {
			const video = this.shadowRoot?.querySelector('.loading-video') as HTMLVideoElement
			const videoContainer = this.shadowRoot?.querySelector('.video-loading') as HTMLElement
			const fallbackLoader = this.shadowRoot?.querySelector('.fallback-loader') as HTMLElement

			// Force white background on all elements
			if (videoContainer) {
				videoContainer.style.backgroundColor = '#fff'
				videoContainer.style.background = '#fff'
			}
			if (fallbackLoader) {
				fallbackLoader.style.backgroundColor = '#fff'
				fallbackLoader.style.background = '#fff'
			}
			if (video) {
				// iPhone specific fixes
				video.setAttribute('webkit-playsinline', 'true')
				video.setAttribute('playsinline', 'true')
				video.muted = true
				video.defaultMuted = true
				video.preload = 'auto'
				video.style.backgroundColor = '#fff'
				// Prevent scaling
				video.style.transform = 'translateZ(0) scale(1)'
				video.style.maxWidth = '100vw'
				video.style.maxHeight = '100vh'

				video.addEventListener('loadeddata', () => {
					this.videoError = false
				})

				video.addEventListener('error', () => {
					this.videoError = true
				})

				video.addEventListener('canplay', () => {
					if (video.paused) {
						video.play().catch(() => {
							this.videoError = true
						})
					}
				})

				// Force load the video
				video.load()
			}
		}, 0)
	}

	disconnectedCallback() {
		super.disconnectedCallback()

		// Restore body scroll when component is removed
		document.body.style.overflow = ''
		document.documentElement.style.overflow = ''
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

		.video-loading {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 100%;
			height: 100%;
			background: #fff;
		}

		.loading-video {
			width: 100%;
			height: 100%;
			object-fit: contain;
			object-position: center;
			background: #fff;
			-webkit-transform: translateZ(0);
			transform: translateZ(0);
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
	`
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			[VideoLoading.elementName]: any
		}
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'video-loading': VideoLoading
	}
}
