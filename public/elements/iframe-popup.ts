import {css, Element, element, html, signal, type ElementAttributes} from 'lume'
import '../app/app-buttons-preset.js'
import '../app/store.js'
import {store} from '../app/store.js'
import './bottom-sheet.js'
import './logic/show-when.js'

type IframePopupAttributes = 'url'

@element
export class IframePopup extends Element {
	static override readonly elementName = 'iframe-popup'

	@signal url = ''
	@signal isLoading = true
	@signal showError = false

	// Get proxied URL for iframe
	#getProxiedUrl = (originalUrl: string): string => {
		return `/api/proxy?url=${encodeURIComponent(originalUrl)}`
	}

	#iframeRef: HTMLIFrameElement | null = null
	#cspHandler: ((e: SecurityPolicyViolationEvent) => void) | null = null
	#cspViolationDetected = false

	override connectedCallback() {
		super.connectedCallback()

		// Setup CSP violation listener
		this.#setupCSPHandler()

		// Reset and sync url from store when view becomes iframe-popup
		this.createEffect(() => {
			if (store.view === 'iframe-popup') {
				// Reset state when entering iframe-popup view
				this.isLoading = true
				this.showError = false
				this.#cspViolationDetected = false

				// Sync url from store
				if (store.iframePopupUrl) this.url = store.iframePopupUrl
			} else {
				// Clear state when leaving iframe-popup view
				this.url = ''
				this.isLoading = true
				this.showError = false
				this.#cspViolationDetected = false
			}
		})

		// Note: iframe src is set via template binding, so we don't need to update it here
		// The template binding will handle src updates when this.url changes
	}

	override disconnectedCallback() {
		super.disconnectedCallback()
		this.#cleanupCSPHandler()
	}

	#setupCSPHandler = () => {
		this.#cspHandler = (e: SecurityPolicyViolationEvent) => {
			console.log('CSP violation detected:', e.violatedDirective, e.blockedURI)
			if (e.violatedDirective === 'frame-ancestors' || e.violatedDirective.includes('frame')) {
				this.#cspViolationDetected = true
				// Automatically open in new tab when CSP violation is detected
				if (this.url) window.open(this.url, '_blank')

				// Close bottom sheet
				this.close()
			}
		}
		window.addEventListener('securitypolicyviolation', this.#cspHandler)
	}

	#cleanupCSPHandler = () => {
		if (this.#cspHandler) {
			window.removeEventListener('securitypolicyviolation', this.#cspHandler)
			this.#cspHandler = null
		}
	}

	#onIframeLoad = () => {
		console.log('onIframeLoad called, cspViolationDetected:', this.#cspViolationDetected)
		if (this.#cspViolationDetected) return

		// For cross-origin iframes, we can't check content, so just hide loading after a short delay
		setTimeout(() => {
			if (!this.#cspViolationDetected) {
				console.log('Hiding loading indicator')
				this.isLoading = false
			}
		}, 300)
	}

	#onIframeError = () => {
		console.error('Iframe error event fired for URL:', this.url)
		// Automatically open in new tab when iframe error occurs
		if (this.url) window.open(this.url, '_blank')

		// Close popup and go back
		this.close()
	}

	#onOpenInNewTab = () => {
		window.open(this.url, '_blank')
		this.close()
	}

	close = () => {
		// Go back to previous view (order-items)
		store.view = 'order-items'
		store.iframePopupUrl = null
		this.dispatchEvent(new CustomEvent('close', {bubbles: true, composed: true}))
	}

	override template = () => html`
		<!-- Overlay backdrop to close on click outside -->
		<show-when
			condition=${() => store.view === 'iframe-popup' && !!this.url}
			content=${() => html` <div class="iframe-overlay" onclick=${() => this.close()}></div> `}
		></show-when>

		<show-when
			condition=${() => store.view === 'iframe-popup' && !!this.url}
			content=${() => html`
				<app-buttons-preset preset="order-flow"></app-buttons-preset>

				<bottom-sheet float-direction="right" max-height="calc(100vh - 20rem)" default-snap="0.88">
					<div class="iframe-container">
						<!-- Loading indicator -->
						<show-when
							condition=${() => this.isLoading && !this.showError}
							content=${() => html`
								<div class="loading-indicator">
									<img src="/images/drippy-logo.webp" alt="Loading" class="loading-logo" />
								</div>
							`}
						></show-when>

						<!-- Error fallback -->
						<show-when
							condition=${() => this.showError}
							content=${() => html`
								<div class="error-fallback">
									<div class="error-title">Trang này không thể hiển thị trong popup</div>
									<p class="error-message">
										Website này không cho phép hiển thị trong iframe. Vui lòng mở trong tab mới.
									</p>
									<button class="open-tab-button" onclick=${this.#onOpenInNewTab}>Mở trong tab mới</button>
								</div>
							`}
						></show-when>

						<!-- Iframe -->
						<iframe
							ref=${(el: HTMLIFrameElement) => {
								if (el && el !== this.#iframeRef) {
									this.#iframeRef = el
									console.log('Iframe ref set, URL:', this.url)
									// Add fallback timeout in case onload doesn't fire (e.g., cross-origin)
									if (this.url) {
										// Check if iframe loads successfully after timeout
										setTimeout(() => {
											if (this.isLoading && !this.#cspViolationDetected && !this.showError) {
												console.log('Fallback: Hiding loading after timeout (assuming success)')
												this.isLoading = false
											}
										}, 3000)

										// Longer timeout to detect if iframe completely failed to load
										setTimeout(() => {
											if (this.isLoading && !this.#cspViolationDetected && !this.showError) {
												console.warn('Iframe still loading after 10s, may have failed silently')
												// Try to detect if iframe src loaded properly
												try {
													// If we can access contentWindow and it's still loading, might be an issue
													const iframeDoc = el.contentDocument || el.contentWindow?.document
													if (!iframeDoc || !iframeDoc.body || iframeDoc.body.children.length === 0) {
														// Iframe appears to be empty or blocked, open in new tab
														console.log('Iframe appears blocked, opening in new tab')
														window.open(this.url, '_blank')
														this.close()
													}
												} catch (e) {
													console.error('Error accessing iframe content, may be cross-origin:', e)
													// Cross-origin, can't check - assume it's OK
													this.isLoading = false
												}
											}
										}, 10000)
									}
								}
							}}
							src=${() => (this.url ? this.#getProxiedUrl(this.url) : '')}
							class="iframe-content"
							style=${() => ({
								opacity: this.isLoading && !this.showError ? '0' : '1',
								pointerEvents: this.isLoading && !this.showError ? 'none' : 'auto',
							})}
							allow="fullscreen"
							onload=${() => {
								console.log('Iframe onload event fired')
								this.#onIframeLoad()
							}}
							onerror=${() => {
								console.log('Iframe onerror event fired')
								this.#onIframeError()
							}}
						></iframe>
					</div>
				</bottom-sheet>
			`}
		></show-when>
	`

	override css = css /*css*/ `
		:host {
			display: block;
		}

		.iframe-overlay {
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background: rgba(0, 0, 0, 0.3);
			z-index: 49;
			cursor: pointer;
		}

		.iframe-container {
			position: relative;
			width: 100%;
			height: 100%;
			min-height: 300px;
			background: var(--uiColorPrimaryWhite);
			z-index: 1;
		}

		.iframe-content {
			width: 100%;
			height: 100%;
			border: none;
			display: block;
			transition: opacity 0.3s ease;
		}

		.loading-indicator {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			display: flex;
			align-items: center;
			justify-content: center;
			background: var(--uiColorPrimaryWhite);
			z-index: 1;
		}

		.loading-logo {
			width: 80px;
			height: 80px;
			object-fit: contain;
			animation: pulse 1.5s ease-in-out infinite;
		}

		@keyframes pulse {
			0%,
			100% {
				opacity: 0.6;
				transform: scale(1);
			}
			50% {
				opacity: 1;
				transform: scale(1.05);
			}
		}

		.error-fallback {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: var(--uiSpacing);
			padding: var(--uiSpacingLarge);
			text-align: center;
			background: var(--uiColorPrimaryWhite);
			z-index: 1;
		}

		.error-title {
			font-family: var(--fontFamily);
			font-size: var(--fontSizeTextMd);
			font-weight: var(--fontWeightSemiBold);
			color: var(--uiColorPrimaryBlack);
			margin-bottom: var(--uiSpacingSmall);
		}

		.error-message {
			font-family: var(--fontFamily);
			font-size: var(--fontSizeTextSm);
			color: var(--uiColorSecondaryLightGrey);
			margin: 0;
			margin-bottom: var(--uiSpacing);
		}

		.open-tab-button {
			padding: var(--uiSpacingSmall) var(--uiSpacing);
			background: var(--uiColorAccentViolet);
			color: white;
			border: none;
			border-radius: var(--borderRadiusSmall);
			cursor: pointer;
			font-family: var(--fontFamily);
			font-size: var(--fontSizeTextSm);
			font-weight: var(--fontWeightSemiBold);
			transition: opacity 0.2s ease;
		}

		.open-tab-button:hover {
			opacity: 0.9;
		}

		.sticky-button-container {
			position: sticky;
			bottom: 2%;
			max-width: 160px;
			margin: auto auto 0 auto;
			background: transparent;
		}

		.close-button {
			padding: var(--uiSpacingSmall) var(--uiSpacing);
			background: var(--uiColorPrimaryBlack);
			color: var(--uiColorPrimaryWhite);
			border: none;
			border-radius: var(--borderRadiusPill);
			cursor: pointer;
			font-family: var(--fontFamily);
			font-size: var(--fontSizeTextSm);
			font-weight: var(--fontWeightSemiBold);
			transition: opacity 0.2s ease;
			width: 100%;
		}

		.close-button:hover {
			opacity: 0.8;
		}
	`
}

declare global {
	interface HTMLElementTagNameMap {
		'iframe-popup': IframePopup
	}
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			'iframe-popup': ElementAttributes<IframePopup, IframePopupAttributes>
		}
	}
}
