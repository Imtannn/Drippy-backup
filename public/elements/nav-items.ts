import {css, Element, element, html, signal, type ElementAttributes} from 'lume'

type NavItemsAttributes = 'activeTab'

@element
export class NavItems extends Element {
	static readonly elementName = 'nav-items'

	@signal activeTab = 'items'

	connectedCallback() {
		super.connectedCallback()

		document.addEventListener('avatar-dropdown-click', (event: Event) => {
			const customEvent = event as CustomEvent
			if (customEvent.detail?.isOpening) {
				this.activeTab = 'avatar'
			} else {
				this.activeTab = 'items'
			}
		})
	}

	#onTabClick = (tab: string) => {
		this.activeTab = tab
		this.dispatchEvent(
			new CustomEvent('tab-change', {
				bubbles: true,
				detail: {tab},
			}),
		)
	}

	template = () => html`
		<div class="nav-items-container">
			<button class="nav-item" classList=${{active: () => this.activeTab === 'avatars'}} disabled>
				<div class="nav-icon">
					<img src="/images/top-nav/avatars-inactive.svg" alt="Avatars" />
				</div>
				<span class="nav-label">Avatars</span>
			</button>
			<button
				class="nav-item"
				classList=${{active: () => this.activeTab === 'items'}}
				onclick=${() => this.#onTabClick('items')}
			>
				<div class="nav-icon">
					<img
						src=${() => (this.activeTab === 'items' ? '/images/items.svg' : '/images/items-inactive.svg')}
						alt="Items"
					/>
				</div>
				<span class="nav-label">Items</span>
			</button>

			<button class="nav-item" classList=${{active: () => this.activeTab === 'scenes'}} disabled>
				<div class="nav-icon">
					<img src="/images/top-nav/scenes-icon.svg" alt="Scenes" />
				</div>
				<span class="nav-label">Scenes</span>
			</button>

			<button class="nav-item" classList=${{active: () => this.activeTab === 'wardrobe'}} disabled>
				<div class="nav-icon">
					<img src="/images/top-nav/wardrobes.svg" alt="Wardrobe" />
				</div>
				<span class="nav-label">Wardrobe</span>
			</button>

			<button class="nav-item" classList=${{active: () => this.activeTab === 'help'}} disabled>
				<div class="nav-icon">
					<img src="/images/top-nav/help-icon.svg" alt="Help" />
				</div>
				<span class="nav-label">Help</span>
			</button>
		</div>
	`

	css = css/*css*/ `
		:host {
			display: flex;
			align-items: center;
			flex: 1;
		}

		.nav-items-container {
			display: flex;
			align-items: center;
			width: 100%;
			padding-left: var(--uiSpacingLarge);
			justify-content: space-between;
		}

		.nav-item {
			display: flex;
			flex-direction: column;
			align-items: center;
			background: none;
			border: none;
			cursor: pointer;
			border-radius: var(--borderRadiusSmall);
			transition: all 0.2s ease;
			color: var(--uiColorSecondaryDark);
			min-width: 27px;
		}

		.nav-item:disabled {
			opacity: 0.3;
			cursor: not-allowed;
		}

		.nav-item.active {
			color: var(--uiColorPrimaryBlack);
		}

		.nav-icon {
			width: 24px;
			height: 24px;
			display: flex;
			align-items: center;
			justify-content: center;
		}

		.nav-label {
			font-size: var(--fontSizeTextXxxs);
			font-weight: var(--fontWeightMedium);
			line-height: 1;
		}
	`
}

declare global {
	interface HTMLElementTagNameMap {
		'nav-items': NavItems
	}
}

declare module 'lume' {
	interface IntrinsicElements {
		'nav-items': ElementAttributes<NavItems, NavItemsAttributes>
	}
}
