import {booleanAttribute, css, Element, element, html, signal, type ElementAttributes} from 'lume'
import {avatars} from '../consts/avatars.js'
import {updateUrlWithParams} from '../routes.js'
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
			if (!store.tempSelectedAvatar) {
				store.setTempSelectedAvatar = avatars[0].value
			}
		})
	}

	#onItemClick = (e: CustomEvent) => {
		store.setTempSelectedAvatar = e.detail.itemValue

		if (this.contentOnly) {
			this.#onSaveClick()
		}
	}

	#onSaveClick = () => {
		// TODO: set the selected avatar. This is a temporary solution.
		const value = store.tempSelectedAvatar
		if (!value) return
		const searchParams = new URLSearchParams(window.location.search)
		searchParams.set('avatar', value)
		updateUrlWithParams(searchParams)
		store.selectAvatar = value
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
							items=${() => {
								const femaleAvatars = avatars.filter(avatar => avatar.gender === 'female')
								if (this.contentOnly && store.selectedSpace?.gender) {
									return store.selectedSpace.gender === 'female' ? femaleAvatars : []
								}
								return femaleAvatars
							}}
							content=${() => (avatar: (typeof avatars)[number]) => html`
								<item-card
									class=${() => (store.tempSelectedAvatar === avatar.value ? 'item-preview' : '')}
									item-active=${() => store.tempSelectedAvatar === avatar.value}
									item-src=${avatar.thumbnail}
									item-alt=${avatar.value}
									item-value=${avatar.value}
									oncardselected=${this.#onItemClick}
									object-fit="cover"
									object-position="top"
									aspect-ratio="0.79"
									image-style="position: absolute; scale: 2; top: 42%;"
								></item-card>
							`}
						></for-each>
					</div>
				</tabs-content>

				<tabs-content selected-value="male">
					<div class="items-grid">
						<for-each
							items=${() => {
								const maleAvatars = avatars.filter(avatar => avatar.gender === 'male')
								if (this.contentOnly && store.selectedSpace?.gender) {
									return store.selectedSpace.gender === 'male' ? maleAvatars : []
								}
								return maleAvatars
							}}
							content=${() => (avatar: (typeof avatars)[number]) => html`
								<item-card
									class=${() => (store.tempSelectedAvatar === avatar.value ? 'item-preview' : '')}
									item-active=${() => store.tempSelectedAvatar === avatar.value}
									item-src=${avatar.thumbnail}
									item-alt=${avatar.value}
									item-value=${avatar.value}
									oncardselected=${this.#onItemClick}
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
		if (this.contentOnly) {
			return this.#renderAvatarContent()
		}

		return html`
			<app-buttons-right layout="bottom">
				<app-buttons-group>
					<save-button onclick=${this.#onSaveClick}></save-button>
				</app-buttons-group>
			</app-buttons-right>

			<bottom-sheet> ${this.#renderAvatarContent()} </bottom-sheet>
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
