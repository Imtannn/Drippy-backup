import {css, Element, element, For, html, signal, type ElementAttributes} from 'lume'
import '../elements/bottom-sheet.js'
import '../elements/save-button.js'
import '../elements/tabs.js'
import '../elements/theme-switch-button.js'
import './item-card.js'
import {store} from './store.js'

type AvatarSelectionAttributes = keyof {}

const avatars = [
	{
		src: new URL('../images/Em_Underwear.png', import.meta.url),
		alt: 'Female avatar',
		value: 'female',
	},
	{
		src: new URL('../images/Anh_Underwear.png', import.meta.url),
		alt: 'Male avatar',
		value: 'male',
	},
]

@element
export class AvatarSelection extends Element {
	static readonly elementName = 'avatar-selection'

	@signal selectedTab = 'female'

	connectedCallback() {
		super.connectedCallback()
	}

	#onItemClick = (e: CustomEvent) => {
		store.setTempSelectedAvatar = e.detail.itemValue
	}

	#onSaveClick = () => {
		// TODO: set the selected avatar. This is a temporary solution.
		const value = store.tempSelectedAvatar
		if (!value) return
		const searchParams = new URLSearchParams(window.location.search)
		searchParams.set('avatar', value)
		window.history.replaceState({}, '', `?${searchParams.toString()}`)
		store.selectAvatar = value
	}

	template = () => html`
	<app-buttons-right>
		<app-buttons-group>
			<!-- <theme-switch-button></theme-switch-button> -->
		</app-buttons-group>
	</app-buttons-right>

	<app-buttons-right layout="bottom">
		<app-buttons-group>
			<save-button onclick=${this.#onSaveClick}></save-button>
		</app-buttons-group>
	</app-buttons-right>

		<bottom-sheet>
			<tabs-provider
			default-value=${() => this.selectedTab}
			ontabchange=${(e: CustomEvent) => {
				this.selectedTab = e.detail.value
			}}
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
			<${For} each=${avatars.filter(avatar => avatar.value === 'female')}>
				${(avatar: (typeof avatars)[number]) => html`
					<item-card
						item-active=${() => store.tempSelectedAvatar === avatar.value}
						item-src=${avatar.src}
						item-alt=${avatar.alt}
						item-value=${avatar.value}
						oncardselected=${this.#onItemClick}
						object-fit="cover"
						object-position="top"
						aspect-ratio="0.79"
						image-style="position: absolute; scale: 2; top: 42%;"
					></item-card>
				`}
			</>
			</div>
		</tabs-content>

				<tabs-content selected-value="male">
					<div class="items-grid">
						<${For} each=${avatars.filter(avatar => avatar.value === 'male')}>
							${(avatar: (typeof avatars)[number]) => html`
								<item-card
									item-active=${() => store.tempSelectedAvatar === avatar.value}
									item-src=${avatar.src}
									item-alt=${avatar.alt}
									item-value=${avatar.value}
									oncardselected=${this.#onItemClick}
									object-fit="cover"
									object-position="top"
									aspect-ratio="0.79"
									image-style="position: absolute; scale: 2; top: 42%;"
								></item-card>
							`}
						</>
					</div>
				</tabs-content>


		</tabs-provider>
		</bottom-sheet>
	`

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
