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

	connectedCallback() {
		super.connectedCallback()

		// Update avatar thumbnail when selected avatar changes
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
					isOpening: !this.open, // Will be opening if currently closed
				},
			}),
		)
	}

	template = () => html`
		<div class="avatar-container" onclick=${() => (!this.hideChevron ? this.#onAvatarDropdownClick() : null)}>
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
		}

		.avatar-image-wrapper {
			position: relative;
			width: 40px;
			height: 40px;
			overflow: hidden;
			border-radius: var(--borderRadiusCircular);
			border: 1px solid var(--uiColorBorderColor);
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
