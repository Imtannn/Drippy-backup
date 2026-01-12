import {css, Element, element, type ElementAttributes, html} from 'lume'
import {store} from '../app/store.js'
import './logic/show-when.js'

@element
export class ConnectionWarning extends Element {
	static override readonly elementName = 'connection-warning'

	private handleClose = () => {
		store.setShowConnectionWarning = false
	}
	override template = () => {
		return html`
			<show-when
				condition=${() => store.showConnectionWarning}
				content=${() => html`
					<div class="warning-container" classList=${{offline: store.connectionStatus === 'offline'}}>
						<div class="warning-content">
							<svg class="warning-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
								${() =>
									store.connectionStatus === 'offline'
										? html`
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3"
												/>
											`
										: html`
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
												/>
											`}
							</svg>
							<span class="warning-text">
								${() =>
									store.connectionStatus === 'offline' ? 'No internet connection' : 'Slow internet connection detected'}
							</span>
						</div>
						<button class="close-button" onClick=${this.handleClose} aria-label="Close warning">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				`}
			/>
		`
	}
	override css = css`
		:host {
			display: block;
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			z-index: 9999;
			pointer-events: none;
		}

		.warning-container {
			display: flex;
			align-items: center;
			justify-content: space-between;
			background: #fbbf24;
			color: #78350f;
			padding: 0.75rem 1rem;
			box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
			animation: slideDown 0.3s ease-out;
			pointer-events: auto;
		}

		.warning-container.offline {
			background: #ef4444;
			color: #ffffff;
		}

		@keyframes slideDown {
			from {
				transform: translateY(-100%);
				opacity: 0;
			}
			to {
				transform: translateY(0);
				opacity: 1;
			}
		}

		.warning-content {
			display: flex;
			align-items: center;
			gap: 0.75rem;
			flex: 1;
		}

		.warning-icon {
			width: 1.5rem;
			height: 1.5rem;
			flex-shrink: 0;
		}

		.warning-text {
			font-size: 0.875rem;
			font-weight: 500;
			line-height: 1.25rem;
		}

		.close-button {
			background: transparent;
			border: none;
			cursor: pointer;
			padding: 0.25rem;
			display: flex;
			align-items: center;
			justify-content: center;
			border-radius: 0.25rem;
			transition: background-color 0.2s;
			color: inherit;
		}

		.close-button:hover {
			background: rgba(0, 0, 0, 0.1);
		}

		.offline .close-button:hover {
			background: rgba(255, 255, 255, 0.1);
		}

		.close-button svg {
			width: 1.25rem;
			height: 1.25rem;
		}

		/* Mobile responsiveness */
		@media (max-width: 640px) {
			.warning-container {
				padding: 0.625rem 0.875rem;
			}

			.warning-icon {
				width: 1.25rem;
				height: 1.25rem;
			}

			.warning-text {
				font-size: 0.8125rem;
			}

			.close-button svg {
				width: 1.125rem;
				height: 1.125rem;
			}
		}
	`
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			[ConnectionWarning.elementName]: ElementAttributes<ConnectionWarning, never>
		}
	}
}

declare global {
	interface HTMLElementTagNameMap {
		[ConnectionWarning.elementName]: ConnectionWarning
	}
}
