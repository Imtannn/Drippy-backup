import {css, Element, element, html, Index, signal, type ElementAttributes} from 'lume'
import {store} from './store.js'
import './item-card.js'
import '../elements/bottom-sheet.js'
import '../elements/tabs.js'
import '../elements/save-button.js'
import '../elements/theme-switch-button.js'

const avatarThumb = new URL('../images/avatar-female-tmp.png', import.meta.url)

type AvatarSelectionAttributes = keyof {}

const avatars = [
	{
		src: avatarThumb,
		alt: 'Female avatar',
		value: 'female',
	},
	{
		src: avatarThumb,
		alt: 'Male avatar',
		value: 'male',
	},
]

@element
export class AvatarSelection extends Element {
	static readonly elementName = 'avatar-selection'

	@signal selectedTab = 'male'

	connectedCallback() {
		super.connectedCallback()
	}

	#onItemClick = (e: CustomEvent) => {
		store.setTempSelectedAvatar = e.detail.itemValue
	}

	#onSaveClick = () => {
		const value = store.tempSelectedAvatar
		console.log(value)
		// TODO: set the selected avatar. This is a temporary solution.
		const searchParams = new URLSearchParams(window.location.search)
		searchParams.set('avatar', 'male')
		window.history.replaceState({}, '', `?${searchParams.toString()}`)
		store.selectAvatar = 'male'
	}

	template = () => html`
	<app-buttons-right>
		<app-buttons-group>
			<theme-switch-button></theme-switch-button>
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
					<tabs-trigger selected-value="male">Male</tabs-trigger>
					<tabs-trigger selected-value="female">Female</tabs-trigger>
				</tabs-list>
			</div>
			</bottom-sheet-header>
			<div class="tabs-content-container">
				<tabs-content selected-value="male">
					<div class="items-grid">
						<${Index} each=${avatars.filter(avatar => avatar.value === 'male')}>
							${(avatar: () => (typeof avatars)[number]) => html`
								<item-card
									item-active=${() => store.tempSelectedAvatar === avatar().value}
									item-src=${avatar().src}
									item-alt=${avatar().alt}
									item-value=${avatar().value}
									oncardselected=${this.#onItemClick}
									object-fit="contain"
								></item-card>
							`}
						</>
					</div>
				</tabs-content>
				<tabs-content selected-value="female">
				<div class="items-grid">
				<${Index} each=${avatars.filter(avatar => avatar.value === 'female')}>
					${(avatar: () => (typeof avatars)[number]) => html`
						<item-card
							item-active=${() => store.tempSelectedAvatar === avatar().value}
							item-src=${avatar().src}
							item-alt=${avatar().alt}
							item-value=${avatar().value}
							oncardselected=${this.#onItemClick}
							object-fit="contain"
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
			border-bottom: 1px solid #e0e1e4;
		}

		.items-grid {
			display: grid;
			grid-template-columns: repeat(3, 1fr);
			gap: 10px;
		}

		.tabs-content-container {
			padding: 20px;
			padding-top: 0;
		}

		.tabs-container {
			padding: 20px;
			padding-top: 0;
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
