import {booleanAttribute, css, Element, element, html, signal, type ElementAttributes} from 'lume'
import {store} from '../app/store.js'
import {avatars} from '../consts/avatars.js'

type AvatarDropdownAttributes = 'open' | 'hideChevron' | 'showPopup'

@element
export class AvatarDropdown extends Element {
	static override readonly elementName = 'avatar-dropdown'

	@booleanAttribute open = false
	@booleanAttribute hideChevron = false
	@booleanAttribute showPopup = false
	@signal currentAvatarThumbnail = ''
	@signal private shouldShowPopup = false
	override connectedCallback() {
		super.connectedCallback()
		// Check if user has previously dismissed the popup
		const popupDismissed = localStorage.getItem('avatar-popup-dismissed')

		if (this.showPopup && !!store.selectedSpace && !popupDismissed) {
			setTimeout(() => {
				this.shouldShowPopup = true
				// Auto close after 20 seconds and save dismissed state
				setTimeout(() => {
					this.shouldShowPopup = false
					localStorage.setItem('avatar-popup-dismissed', 'true')
				}, 200000)
			}, 1000)
		}

		this.createEffect(() => {
			const selectedAvatar = store.selectedAvatar
			if (selectedAvatar) {
				const avatar = avatars.find(a => a.name === selectedAvatar)
				this.currentAvatarThumbnail = avatar?.thumbnail || ''
			}
		})
	}

	#onAvatarDropdownClick = () => {
		this.shouldShowPopup = false
		this.dispatchEvent(
			new CustomEvent('avatar-dropdown-click', {
				bubbles: true,
				composed: true,
				detail: {
					isOpening: !this.open,
				},
			}),
		)
	}
	override template = () => html`
		<div class="avatar-wrapper">
			<!-- Popup notification -->
			<div class="popup-notification" style=${() => (this.shouldShowPopup ? 'display: flex' : 'display: none')}>
				<span class="popup-text">swap avatar here</span>
				<button
					class="popup-close"
					onclick=${(e: MouseEvent) => {
						e.stopPropagation()
						this.shouldShowPopup = false
						localStorage.setItem('avatar-popup-dismissed', 'true')
					}}
				>
					×
				</button>
			</div>

			<div
				class="avatar-container"
				classList=${() => ({'popup-visible': this.shouldShowPopup})}
				onclick=${() => (!this.hideChevron ? this.#onAvatarDropdownClick() : null)}
			>
				<div class="avatar-image-wrapper">
					<img src=${() => this.currentAvatarThumbnail} alt="Avatar" class="avatar-image" />
				</div>
				${() =>
					!this.hideChevron
						? html`
								<button class="avatar-dropdown-btn" classList=${{active: () => this.open}}>
									<img
										src=${() => (this.open ? '/images/chevron-up-violet.svg' : '/images/chevron-down.svg')}
										alt="Dropdown"
									/>
								</button>
							`
						: ''}
			</div>
		</div>
	`
	override css = css /*css*/ `
		:host {
			display: flex;
			align-items: center;
		}

		.avatar-wrapper {
			display: flex;
			align-items: center;
			position: relative;
		}

		.avatar-container {
			display: flex;
			align-items: center;
			cursor: pointer;
			transition: background 0.2s ease;
			border-radius: var(--borderRadius);
			position: relative;
		}

		.avatar-image-wrapper {
			position: relative;
			width: 40px;
			height: 40px;
			overflow: hidden;
			border-radius: var(--borderRadiusCircular);
			border: 1px solid var(--uiColorBorderColor);
			transition: border-color 0.3s ease;
		}

		.avatar-container.popup-visible .avatar-image-wrapper {
			border-color: #b897fd;
		}

		.avatar-image {
			width: 100%;
			height: 100%;
			object-fit: cover;
			object-position: top;
			position: absolute;
			scale: 2;
			top: 52%;
			left: 0;
		}

		.avatar-dropdown-btn {
			background: none;
			border: none;
			cursor: pointer;
			color: var(--uiColorSecondaryDark);
			display: flex;
			align-items: center;
			justify-content: center;
		}

		.popup-notification {
			position: absolute;
			top: -53px;
			left: 2px;
			transform: translate(0, 0);
			background: #b897fd;
			color: white;
			padding: 10px 12px;
			border-radius: 10px;
			font-size: 14px;
			font-weight: 500;
			z-index: 1000;
			align-items: center;
			gap: 8px;
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
			animation: slideInDown 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
		}

		.popup-notification::after {
			content: '';
			position: absolute;
			bottom: -7px;
			left: unset;
			transform: translate(0, 0);
			width: 0;
			height: 0;
			border-left: 8px solid transparent;
			border-right: 8px solid transparent;
			border-top: 8px solid #b897fd;
		}

		.popup-text {
			white-space: nowrap;
		}

		.popup-close {
			background: #000;
			border: none;
			color: white;
			font-size: 18px;
			font-weight: bold;
			cursor: pointer;
			padding: 0;
			width: 20px;
			height: 20px;
			display: flex;
			align-items: center;
			justify-content: center;
			border-radius: 50%;
			transition: background-color 0.2s ease;
		}

		.popup-close:hover {
			background-color: rgba(255, 255, 255, 0.2);
		}
		@media (min-width: 768px) {
			.popup-notification {
				top: 53px;
			}
			.popup-notification::after {
				bottom: unset;
				top: -7px;
				border-top: none;
				border-bottom: 8px solid #b897fd;
			}
		}

		@keyframes slideInDown {
			0% {
				opacity: 0;
				transform: translateX(-35%) translateY(-20px) scale(0.8);
			}
			50% {
				opacity: 0.8;
				transform: translateX(-35%) translateY(-5px) scale(1.05);
			}
			100% {
				opacity: 1;
				transform: translateX(-35%) translateY(0) scale(1);
			}
		}
	`
}

declare global {
	interface HTMLElementTagNameMap {
		'avatar-dropdown': AvatarDropdown
	}
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			'avatar-dropdown': ElementAttributes<AvatarDropdown, AvatarDropdownAttributes>
		}
	}
}
