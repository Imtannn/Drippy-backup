import {batch, css, Element, element, html, signal, type ElementAttributes} from 'lume'
import '../elements/back-button.js'
import '../elements/home-button.js'
import {pushState, searchParams} from '../routes.js'
import './app-buttons.js'
import {store} from './store.js'

type ShareViewAttributes = keyof {}

@element
export class ShareView extends Element {
	static elementName = 'share-view'

	@signal shareUrl = window.location.href
	@signal isCopied = false

	#onBackButtonClick = () => {
		batch(() => {
			store.isPreview = false
			searchParams().delete('isPreview')
			pushState()
			store.view = 'preview'
		})
	}

	#onHomeButtonClick = () => {
		const currentAvatar = store.selectedAvatar || 'moidien'
		batch(() => {
			history.pushState(null, '', `/?avatar=${currentAvatar}`)
			store.resetState()
		})
	}

	#onCopyLink = async () => {
		try {
			await navigator.clipboard.writeText(this.shareUrl)
			this.isCopied = true
			setTimeout(() => {
				this.isCopied = false
			}, 2000)
		} catch (err) {
			console.error('Failed to copy link:', err)
		}
	}

	#onShare = (platform: string) => {
		const url = encodeURIComponent(this.shareUrl)
		const text = encodeURIComponent('Check out my drippy design! 💧✨')

		let shareUrl = ''

		switch (platform) {
			case 'instagram':
				// Instagram doesn't have a direct share URL, just copy the content to clipboard for manual sharing
				const instagramText = `${text}\n\n${this.shareUrl}`
				navigator.clipboard.writeText(instagramText)
				console.log('Instagram content copied to clipboard!')
				// Open Instagram app/site
				window.open('https://instagram.com/', '_blank')
				break

			case 'twitter':
				shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`
				break

			case 'facebook':
				shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`
				break

			case 'discord':
				// Discord doesn't have a direct share URL, just copy content
				const discordText = `${text}\n${this.shareUrl}`
				navigator.clipboard.writeText(discordText)
				console.log('Discord content copied to clipboard!')
				// Open Discord
				window.open('https://discord.com/', '_blank')
				break

			default:
				console.warn(`Unknown platform: ${platform}`)
				return
		}

		if (shareUrl) {
			window.open(shareUrl, '_blank', 'width=600,height=400')
		}
	}

	template = () => html`
		<app-buttons-left>
			<app-buttons-group group-direction="row">
				<back-button onclick=${this.#onBackButtonClick}></back-button>
				<home-button onclick=${this.#onHomeButtonClick}></home-button>
			</app-buttons-group>
		</app-buttons-left>

		<app-buttons-right>
			<app-buttons-group>
				<!-- <theme-switch-button></theme-switch-button> -->
				<logo-button brand-name="MoiDien"></logo-button>
			</app-buttons-group>
		</app-buttons-right>

		<bottom-sheet float-direction="right" max-height="calc(100vh - 20rem)">
			<div class="share-container">
				<!-- Header -->
				<div class="share-header">
					<h2 class="share-title">Share to social media</h2>
				</div>

				<!-- Social Media Buttons -->
				<div class="social-buttons">
					<button class="social-btn instagram" onclick=${() => this.#onShare('instagram')}>
						<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
							<g clip-path="url(#clip0_20179_10095)">
								<path
									d="M9 1.6C11.2711 1.6 11.54 1.60996 12.4332 1.6498C13.2633 1.68633 13.7115 1.82578 14.0104 1.94199C14.4055 2.09473 14.691 2.28066 14.9865 2.57617C15.2854 2.875 15.468 3.15723 15.6207 3.55234C15.7369 3.85117 15.8764 4.30273 15.9129 5.12949C15.9527 6.02598 15.9627 6.29492 15.9627 8.5627C15.9627 10.8338 15.9527 11.1027 15.9129 11.9959C15.8764 12.826 15.7369 13.2742 15.6207 13.573C15.468 13.9682 15.282 14.2537 14.9865 14.5492C14.6877 14.848 14.4055 15.0307 14.0104 15.1834C13.7115 15.2996 13.26 15.4391 12.4332 15.4756C11.5367 15.5154 11.2678 15.5254 9 15.5254C6.72891 15.5254 6.45996 15.5154 5.5668 15.4756C4.73672 15.4391 4.28848 15.2996 3.98965 15.1834C3.59453 15.0307 3.30898 14.8447 3.01348 14.5492C2.71465 14.2504 2.53203 13.9682 2.3793 13.573C2.26309 13.2742 2.12363 12.8227 2.08711 11.9959C2.04727 11.0994 2.0373 10.8305 2.0373 8.5627C2.0373 6.2916 2.04727 6.02266 2.08711 5.12949C2.12363 4.29941 2.26309 3.85117 2.3793 3.55234C2.53203 3.15723 2.71797 2.87168 3.01348 2.57617C3.3123 2.27734 3.59453 2.09473 3.98965 1.94199C4.28848 1.82578 4.74004 1.68633 5.5668 1.6498C6.45996 1.60996 6.72891 1.6 9 1.6ZM9 0.0693359C6.69238 0.0693359 6.40352 0.0792969 5.49707 0.119141C4.59395 0.158984 3.97305 0.305078 3.43516 0.514258C2.87402 0.733398 2.39922 1.02227 1.92773 1.49707C1.45293 1.96855 1.16406 2.44336 0.944922 3.00117C0.735742 3.54238 0.589648 4.15996 0.549805 5.06309C0.509961 5.97285 0.5 6.26172 0.5 8.56934C0.5 10.877 0.509961 11.1658 0.549805 12.0723C0.589648 12.9754 0.735742 13.5963 0.944922 14.1342C1.16406 14.6953 1.45293 15.1701 1.92773 15.6416C2.39922 16.1131 2.87402 16.4053 3.43184 16.6211C3.97305 16.8303 4.59062 16.9764 5.49375 17.0162C6.4002 17.0561 6.68906 17.066 8.99668 17.066C11.3043 17.066 11.5932 17.0561 12.4996 17.0162C13.4027 16.9764 14.0236 16.8303 14.5615 16.6211C15.1193 16.4053 15.5941 16.1131 16.0656 15.6416C16.5371 15.1701 16.8293 14.6953 17.0451 14.1375C17.2543 13.5963 17.4004 12.9787 17.4402 12.0756C17.4801 11.1691 17.49 10.8803 17.49 8.57266C17.49 6.26504 17.4801 5.97617 17.4402 5.06973C17.4004 4.1666 17.2543 3.5457 17.0451 3.00781C16.8359 2.44336 16.5471 1.96855 16.0723 1.49707C15.6008 1.02559 15.126 0.733398 14.5682 0.517578C14.027 0.308398 13.4094 0.162305 12.5063 0.122461C11.5965 0.0792969 11.3076 0.0693359 9 0.0693359Z"
									fill="#F6F6F6"
								/>
								<path
									d="M9 4.20312C6.58945 4.20312 4.63379 6.15879 4.63379 8.56934C4.63379 10.9799 6.58945 12.9355 9 12.9355C11.4105 12.9355 13.3662 10.9799 13.3662 8.56934C13.3662 6.15879 11.4105 4.20312 9 4.20312ZM9 11.4016C7.43613 11.4016 6.16777 10.1332 6.16777 8.56934C6.16777 7.00547 7.43613 5.73711 9 5.73711C10.5639 5.73711 11.8322 7.00547 11.8322 8.56934C11.8322 10.1332 10.5639 11.4016 9 11.4016Z"
									fill="#F6F6F6"
								/>
								<path
									d="M14.5582 4.03032C14.5582 4.59478 14.1 5.04966 13.5389 5.04966C12.9744 5.04966 12.5195 4.59146 12.5195 4.03032C12.5195 3.46587 12.9777 3.01099 13.5389 3.01099C14.1 3.01099 14.5582 3.46919 14.5582 4.03032Z"
									fill="#F6F6F6"
								/>
							</g>
							<defs>
								<clipPath id="clip0_20179_10095">
									<rect width="17" height="17" fill="white" transform="translate(0.5 0.0693359)" />
								</clipPath>
							</defs>
						</svg>
					</button>

					<button class="social-btn twitter" onclick=${() => this.#onShare('twitter')}>
						<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
							<path
								d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
							/>
						</svg>
					</button>

					<button class="social-btn facebook" onclick=${() => this.#onShare('facebook')}>
						<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
							<path
								d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
							/>
						</svg>
					</button>

					<button class="social-btn discord" onclick=${() => this.#onShare('discord')}>
						<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
							<path
								d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0189 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1568 2.4189Z"
							/>
						</svg>
					</button>
				</div>

				<!-- Break Line -->
				<div class="break-line"></div>

				<!-- URL Section -->
				<div class="url-section">
					<div class="url-input-container">
						<input type="text" class="url-input" value=${this.shareUrl} readonly />
						<button class="copy-button" onclick=${this.#onCopyLink}>
							<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
								<path
									d="M5.79199 7.67331C6.05139 8.02009 6.38233 8.30703 6.76236 8.51466C7.1424 8.7223 7.56265 8.84577 7.99461 8.8767C8.42656 8.90764 8.86011 8.84532 9.26586 8.69396C9.67161 8.5426 10.0401 8.30575 10.3462 7.99948L12.1583 6.18745C12.7084 5.61786 13.0128 4.85499 13.0059 4.06314C12.999 3.2713 12.6814 2.51383 12.1215 1.95389C11.5615 1.39395 10.8041 1.07633 10.0122 1.06945C9.22037 1.06257 8.45749 1.36697 7.88791 1.9171L6.84901 2.94996"
									stroke="#121316"
									stroke-width="1.2"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
								<path
									d="M8.20817 6.46526C7.94878 6.11848 7.61784 5.83154 7.2378 5.62391C6.85776 5.41627 6.43751 5.2928 6.00556 5.26187C5.5736 5.23093 5.14005 5.29325 4.7343 5.44461C4.32855 5.59597 3.9601 5.83281 3.65393 6.13909L1.8419 7.95112C1.29178 8.52071 0.987374 9.28358 0.994255 10.0754C1.00114 10.8673 1.31875 11.6247 1.87869 12.1847C2.43863 12.7446 3.1961 13.0622 3.98795 13.0691C4.7798 13.076 5.54267 12.7716 6.11225 12.2215L7.14511 11.1886"
									stroke="#121316"
									stroke-width="1.2"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
						</button>
						<div
							class="copy-message"
							style=${() =>
								this.isCopied ? 'opacity: 1; transform: translateY(0);' : 'opacity: 0; transform: translateY(10px);'}
						>
							Link Copied!
						</div>
					</div>
					<p class="tagline">Tag us <strong>@drippy.3d</strong>, we love to see your drip!</p>
				</div>
			</div>
		</bottom-sheet>
	`

	css = css`
		.share-container {
			padding: var(--uiSpacing);
			padding-top: 0;
		}

		.share-header {
			align-items: center;
		}

		.share-title {
			font-size: var(--fontSizeTextXs);
			font-weight: var(--fontWeightSemiBold);
			color: var(--uiColorPrimaryBlack);
			margin: 0 0 var(--uiGap) 0;
			text-align: center;
		}

		.social-buttons {
			display: flex;
			justify-content: center;
			gap: var(--uiGap);
			margin-bottom: var(--uiGapLarge);
		}

		.social-btn {
			width: 35px;
			height: 35px;
			border: none;
			border-radius: var(--borderRadiusCircular);
			background: #1a1a1a;
			color: var(--uiColorPrimaryWhite);
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			transition: var(--transitionSlow);

			&:hover {
				transform: scale(1.1);
			}

			&.instagram:hover {
				background: #e4405f;
			}

			&.twitter:hover {
				background: #1da1f2;
			}

			&.facebook:hover {
				background: #1877f2;
			}

			&.discord:hover {
				background: #5865f2;
			}

			img {
				filter: brightness(0) invert(1);
				transition: filter 0.2s ease;
			}

			&.instagram:hover img {
				filter: none;
			}
		}

		.break-line {
			width: 100%;
			height: 0.5px;
			background-color: #e0e1e4;
			margin: 20px 0;
		}

		.url-section {
			text-align: center;
		}

		.url-input-container {
			display: flex;
			align-items: center;
			background: #f1f1f1;
			border-radius: 8px;
			padding: 4px;
			margin-bottom: 16px;
			border: 1px solid #e9ecef;
			font-weight: 400;
			height: 35px;
		}

		.url-input {
			flex: 1;
			border: none;
			background: transparent;
			padding: 0 25px 0 15px;
			font-size: 12px;
			color: #99999a;
			outline: none;
			user-select: all;
		}

		.copy-button {
			width: 29px;
			height: 29px;
			border: none;
			background-color: #dfdfdf;
			border-radius: 50%;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			transition: background 0.2s ease;

			&:hover {
				background: #bebbbb;
			}
		}

		.copy-message {
			position: absolute;
			top: calc(100% + 5px); /* Position it 5px below the container */
			left: 50%;
			transform: translateX(-50%);
			background-color: #bebbbb;
			color: #424347;
			padding: 5px 10px;
			border-radius: 5px;
			font-size: 12px;
			white-space: nowrap;
			z-index: 10;
			transition:
				opacity 0.3s ease-in-out,
				transform 0.3s ease-in-out;
			pointer-events: none;
		}

		.tagline {
			font-size: 12px;
			color: #424347;
		}

		/* Dark theme support */
		@media (prefers-color-scheme: dark) {
			.share-title {
				color: #fff;
			}

			.url-input-container {
				background: #2d2d2d;
				border-color: #404040;
			}

			.url-input {
				color: #b0b0b0;
			}

			.tagline {
				color: #b0b0b0;
			}
		}

		/* Mobile responsiveness */
		@media (max-width: 768px) {
			.share-container {
				padding: 16px;
			}

			.social-buttons {
				gap: 12px;
			}

			.social-btn {
				width: 48px;
				height: 48px;
			}
		}
	`
}

declare global {
	interface HTMLElementTagNameMap {
		'share-view': ShareView
	}
}

declare global {
	interface IntrinsicElements {
		'share-view': ElementAttributes<ShareView, ShareViewAttributes>
	}
}
