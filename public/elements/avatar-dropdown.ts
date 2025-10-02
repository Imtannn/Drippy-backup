import {booleanAttribute, css, Element, element, html, signal, type ElementAttributes} from 'lume'
import {store} from '../app/store.js'
import {avatars} from '../consts/avatars.js'

type AvatarDropdownAttributes = 'open' | 'hideChevron'

@element
export class AvatarDropdown extends Element {
	static readonly elementName = 'avatar-dropdown'

	@booleanAttribute open = false
	@booleanAttribute hideChevron = false
	@signal currentAvatarThumbnail = ''
	@signal private showPopup = true

	connectedCallback() {
		super.connectedCallback()

		const urlParams = new URLSearchParams(window.location.search)
		const hasSceneParam = urlParams.has('scene')
		this.showPopup = hasSceneParam

		if (this.showPopup) {
			setTimeout(() => {
				this.showPopup = false
			}, 20000)
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

	template = () => html`
		<div class="avatar-container" onclick=${() => (!this.hideChevron ? this.#onAvatarDropdownClick() : null)}>
			<!-- Popup notification -->
			<div class="popup-notification" style=${() => (this.showPopup ? 'display: flex' : 'display: none')}>
				<span class="popup-text">swap avatar here</span>
				<button
					class="popup-close"
					onclick=${(e: MouseEvent) => {
						e.stopPropagation()
						this.showPopup = false
					}}
				>
					×
				</button>
			</div>

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
	`

	css = css/*css*/ `
		:host {
			display: flex;
			align-items: center;
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

		.avatar-container:has(.popup-notification[style*='display: flex']) .avatar-image-wrapper {
			border-color: #8b5cf6;
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
			top: -60px;
			left: 100%;
			transform: translateX(-35%);
			background: #8b5cf6;
			color: white;
			padding: 12px 16px;
			border-radius: 12px;
			font-size: 14px;
			font-weight: 500;
			z-index: 1000;
			align-items: center;
			gap: 8px;
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
			animation: slideInDown 0.3s ease-out;
		}

		.popup-notification::after {
			content: '';
			position: absolute;
			bottom: -7px;
			left: 10%;
			transform: translateX(-35%);
			width: 0;
			height: 0;
			border-left: 8px solid transparent;
			border-right: 8px solid transparent;
			border-top: 8px solid #8b5cf6;
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

		@keyframes slideInDown {
			from {
				opacity: 0;
				transform: translateX(-50%) translateY(-10px);
			}
			to {
				opacity: 1;
				transform: translateX(-50%) translateY(0);
			}
		}
	`
}

declare global {
	interface HTMLElementTagNameMap {
		'avatar-dropdown': AvatarDropdown
	}
}

declare module 'lume' {
	interface IntrinsicElements {
		'avatar-dropdown': ElementAttributes<AvatarDropdown, AvatarDropdownAttributes>
	}
}
