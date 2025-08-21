import {css, Element, element, html, signal, type ElementAttributes} from 'lume'
import {store} from './store.js'
import './item-card.js'
import '../elements/bottom-sheet.js'
import '../elements/tabs.js'

const avatarThumb = new URL('../images/avatar-female-tmp.png', import.meta.url)

type AvatarSelectionAttributes = keyof {}

@element
export class AvatarSelection extends Element {
	static readonly elementName = 'avatar-selection'

	@signal selectedTab = 'female'

	connectedCallback() {
		super.connectedCallback()
	}

	#onItemClick = (e: CustomEvent) => {
		const value = e.detail.itemValue
		console.log('value', value)
		// TODO: set the selected avatar. This is a temporary solution.
		const searchParams = new URLSearchParams(window.location.search)
		searchParams.set('avatar', 'male')
		window.history.replaceState({}, '', `?${searchParams.toString()}`)
		store.selectAvatar = 'male'
	}

	template = () => html`
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
						<item-card item-active=false item-src=${avatarThumb.href} item-alt="Female avatar" item-value="female" oncardselected=${this.#onItemClick}></item-card>
						<item-card item-active=false item-src=${avatarThumb.href} item-alt="Female avatar" item-value="female" oncardselected=${this.#onItemClick}></item-card>
					</div>
				</tabs-content>
				<tabs-content selected-value="male">
					<div class="items-grid">
						<item-card item-active=false item-src=${avatarThumb.href} item-alt="Male avatar" item-value="male" oncardselected=${this.#onItemClick}></item-card>
						<item-card item-active=false item-src=${avatarThumb.href} item-alt="Male avatar" item-value="male" oncardselected=${this.#onItemClick}></item-card>
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
