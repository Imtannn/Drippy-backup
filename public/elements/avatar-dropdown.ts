import {booleanAttribute, css, Element, element, html, signal, type ElementAttributes} from 'lume'
import {store} from '../app/store.js'
import {avatars} from '../consts/avatars.js'

type AvatarDropdownAttributes = 'open' | 'hideChevron'

@element
export class AvatarDropdown extends Element {
	static override readonly elementName = 'avatar-dropdown'

	@booleanAttribute open = false
	@booleanAttribute hideChevron = false
	@signal currentAvatarThumbnail = ''
	override connectedCallback() {
		super.connectedCallback()
		this.createEffect(() => {
			const selectedAvatar = store.selectedAvatar
			if (selectedAvatar) {
				const avatar = avatars().find(a => a.name === selectedAvatar)
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
	override template = () => html`
		<div class="avatar-wrapper">
			<div
				class="avatar-container"
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

		.avatar-dropdown-btn img {
			filter: brightness(0) invert(1);
		}

		.avatar-dropdown-btn.active img {
			filter: none;
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
