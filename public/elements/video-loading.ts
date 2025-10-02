import {css, Element, element, html, signal} from 'lume'

const loadingVideoUrl = new URL('../videos/landing.mp4', import.meta.url).href

@element
export class VideoLoading extends Element {
	static elementName = 'video-loading'

	@signal private videoError = false

	connectedCallback() {
		super.connectedCallback()

		// Prevent body scroll when video is showing
		document.body.style.overflow = 'hidden'
		document.documentElement.style.overflow = 'hidden'

		// Force black background on host element
		this.style.backgroundColor = '#000'
		this.style.background = '#000'

		// Set up video event listeners after template is rendered
		setTimeout(() => {
			const video = this.shadowRoot?.querySelector('.loading-video') as HTMLVideoElement
			const videoContainer = this.shadowRoot?.querySelector('.video-loading') as HTMLElement
			const fallbackLoader = this.shadowRoot?.querySelector('.fallback-loader') as HTMLElement

			// Force black background on all elements
			if (videoContainer) {
				videoContainer.style.backgroundColor = '#000'
				videoContainer.style.background = '#000'
			}
			if (fallbackLoader) {
				fallbackLoader.style.backgroundColor = '#000'
				fallbackLoader.style.background = '#000'
			}
			if (video) {
				// iPhone specific fixes
				video.setAttribute('webkit-playsinline', 'true')
				video.setAttribute('playsinline', 'true')
				video.setAttribute('x-webkit-airplay', 'allow')
				video.muted = true
				video.defaultMuted = true
				video.preload = 'auto'
				video.style.backgroundColor = '#000'
				// Prevent scaling
				video.style.transform = 'translateZ(0) scale(1.5)'
				video.style.maxWidth = '100vw'
				video.style.maxHeight = '100vh'

				video.addEventListener('loadeddata', () => {
					this.videoError = false
					// Force play after data is loaded
					video.play().catch(() => {
						this.videoError = true
					})
				})

				video.addEventListener('canplay', () => {
					// Force play when video can play
					video.play().catch(() => {
						this.videoError = true
					})
				})

				video.addEventListener('canplaythrough', () => {
					// Force play when video can play through
					video.play().catch(() => {
						this.videoError = true
					})
				})

				video.addEventListener('playing', () => {
					// Video is now playing
				})

				video.addEventListener('error', e => {
					console.error('Video error:', e)
					this.videoError = true
				})

				// Add user interaction fallback for iOS
				const tryPlay = () => {
					if (video.paused) {
						video.play().catch(error => {
							console.log('Play failed, waiting for user interaction:', error)
						})
					}
				}

				// Try to play immediately
				setTimeout(tryPlay, 100)
				setTimeout(tryPlay, 500)
				setTimeout(tryPlay, 1000)

				// Add click listener to play video on user interaction
				document.addEventListener('touchstart', tryPlay, {once: true})
				document.addEventListener('click', tryPlay, {once: true})

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
			background: #000;
			overflow: hidden;
		}

		.video-loading {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 100%;
			height: 100%;
			background: #000;
		}
		.text-xl {
			font-size: var(--fontSizeTextXl);
		}

		.loading-video {
			width: 100%;
			height: 100%;
			object-fit: contain;
			object-position: center;
			background: #000;
			-webkit-transform: translateZ(0) scale(0.5);
			transform: translateZ(0) scale(0.5);
			/* iOS specific fixes */
			-webkit-playsinline: true;
			playsinline: true;
			/* Force hardware acceleration */
			-webkit-backface-visibility: hidden;
			backface-visibility: hidden;
			/* Ensure video is not paused by iOS */
			pointer-events: none;
		}

		.loading-text {
			position: absolute;
			top: 5%;
			left: 50%;
			transform: translateX(-50%);
			font-size: 24px;
			font-weight: 600;
			color: #333;
			z-index: 20;
			text-align: center;
			white-space: nowrap;
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
			background: #000;
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

		/* Mobile responsive text */
		@media (max-width: 768px) {
			.loading-text {
				top: 12%;
				padding: 0 20px;
			}
		}

		@media (max-width: 480px) {
			.text-xl {
				font-size: var(--fontSizeTextXlMobile);
			}
			.loading-text {
				top: 12%;
				padding: 0 15px;
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
