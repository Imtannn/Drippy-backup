import {booleanAttribute, css, Element, element, html, signal, type ElementAttributes} from 'lume'
import {avatars} from '../consts/avatars.js'
import {store} from './store.js'

import '../elements/bottom-sheet.js'
import '../elements/logic/for-each.js'
import '../elements/placeholder-image.js'
import '../elements/save-button.js'
import '../elements/tabs.js'
import '../elements/theme-switch-button.js'
import './item-card.js'

type AvatarSelectionAttributes = 'contentOnly'

@element
export class AvatarSelection extends Element {
	static readonly elementName = 'avatar-selection'

	@signal selectedTab = 'female'
	@booleanAttribute contentOnly = false

	connectedCallback() {
		super.connectedCallback()

		this.createEffect(() => {
			if (this.contentOnly && store.selectedAvatar) {
				const avatar = avatars.find(a => a.name === store.selectedAvatar)
				if (avatar) {
					this.selectedTab = avatar.gender
				}
			}
		})
	}

	#onAvatarThumbClick = (e: CustomEvent) => {
		store.selectedAvatar = e.detail.itemValue
	}

	#onSaveClick = () => {
		store.view = 'scene'
	}

	#renderAvatarContent = () => html`
		<tabs-provider
			default-value=${() => this.selectedTab}
			ontabchange=${(e: CustomEvent) => (this.selectedTab = e.detail.value)}
		>
			<bottom-sheet-header>
				<div class="tabs-container">
					<tabs-list>
						<tabs-trigger selected-value="female">Female</tabs-trigger>
						<tabs-trigger selected-value="male">Male</tabs-trigger>
					</tabs-list>
				</div>
			</bottom-sheet-header>

			<div class="tabs-content-container">
				<tabs-content selected-value="female">
					<div class="items-grid">
						<for-each
							items=${() => avatars.filter(avatar => avatar.gender === 'female')}
							content=${() => (avatar: (typeof avatars)[number]) => html`
								<item-card
									class=${() => (store.selectedAvatar === avatar.name ? 'item-preview' : '')}
									item-active=${() => store.selectedAvatar === avatar.name}
									item-src=${avatar.thumbnail}
									item-alt=${avatar.name}
									item-value=${avatar.name}
									oncardselected=${this.#onAvatarThumbClick}
									object-fit="cover"
									object-position="top"
									aspect-ratio="0.79"
									image-style="scale: 2; top: 42%;"
								></item-card>
							`}
						></for-each>
					</div>
				</tabs-content>

				<tabs-content selected-value="male">
					<div class="items-grid">
						<for-each
							items=${() => avatars.filter(avatar => avatar.gender === 'male')}
							content=${() => (avatar: (typeof avatars)[number]) => html`
								<item-card
									class=${() => (store.selectedAvatar === avatar.name ? 'item-preview' : '')}
									item-active=${() => store.selectedAvatar === avatar.name}
									item-src=${avatar.thumbnail}
									item-alt=${avatar.name}
									item-value=${avatar.name}
									oncardselected=${this.#onAvatarThumbClick}
									object-fit="cover"
									object-position="top"
									aspect-ratio="0.79"
									image-style="position: absolute; scale: 2; top: 42%;"
								></item-card>
							`}
						></for-each>
					</div>
				</tabs-content>
			</div>
		</tabs-provider>
	`

	template = () => {
		return html`
			<show-when condition=${() => this.contentOnly} content=${this.#renderAvatarContent}></show-when>

			<show-when
				condition=${() => !this.contentOnly}
				content=${() => html`
					<app-buttons-right layout="bottom">
						<app-buttons-group>
							<save-button onclick=${this.#onSaveClick}></save-button>
						</app-buttons-group>
					</app-buttons-right>

					<bottom-sheet> ${this.#renderAvatarContent} </bottom-sheet>
				`}
			></show-when>
		`
	}

	css = css/*css*/ `
		:host {
			display: contents;
		}

		.bottom-sheet-header {
			position: sticky;
			top: 0;
			background: var(--appBackground);
			z-index: 10;
			border-bottom: var(--borderWidth) solid var(--uiColorBorderColor);
		}

		.items-grid {
			display: grid;
			grid-template-columns: repeat(3, 1fr);
			gap: var(--uiGap);
		}

		.tabs-content-container {
			padding: var(--uiSpacing);
			padding-top: 0;
		}

		.tabs-container {
			padding: var(--uiSpacing);
			padding-top: 0;
			padding-bottom: 5px;
			background: var(--uiColorPrimaryWhite);
		}
	`
}

declare global {
	interface HTMLElementTagNameMap {
		'avatar-selection': AvatarSelection
	}
}

declare module 'lume' {
	interface IntrinsicElements {
		'avatar-selection': ElementAttributes<AvatarSelection, AvatarSelectionAttributes>
	}
}
