import {css, Element, element, html} from 'lume'

const loadingVideoUrl = new URL('../videos/landing.mp4', import.meta.url).href

@element
export class VideoLoading extends Element {
	static elementName = 'video-loading'

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

			// Force black background on all elements
			if (videoContainer) {
				videoContainer.style.backgroundColor = '#000'
				videoContainer.style.background = '#000'
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
				// Scale only on mobile screens <480px
				const isMobile = window.innerWidth < 480
				video.style.transform = isMobile ? 'translateZ(0) scale(1.3)' : 'translateZ(0) scale(1)'
				video.style.maxWidth = '100vw'
				video.style.maxHeight = '100vh'

				video.addEventListener('loadeddata', () => {
					// Force play after data is loaded
					video.play().catch(() => {
						console.log('Video play failed on loadeddata')
					})
				})

				video.addEventListener('canplay', () => {
					// Force play when video can play
					video.play().catch(() => {
						console.log('Video play failed on canplay')
					})
				})

				video.addEventListener('canplaythrough', () => {
					// Force play when video can play through
					video.play().catch(() => {
						console.log('Video play failed on canplaythrough')
					})
				})

				video.addEventListener('playing', () => {
					// Video is now playing
				})

				video.addEventListener('error', e => {
					console.error('Video error:', e)
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
			.loading-video {
				-webkit-transform: translateZ(0) scale(1.3);
				transform: translateZ(0) scale(1.3);
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
