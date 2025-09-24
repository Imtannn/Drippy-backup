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

			<button
				class="nav-item"
				classList=${{active: () => this.activeTab === 'pose'}}
				onclick=${() => this.#onTabClick('pose')}
			>
				<div class="nav-icon">
					<img src=${() => (this.activeTab === 'pose' ? '/images/pose.svg' : '/images/pose-inactive.svg')} alt="Pose" />
				</div>
				<span class="nav-label">Pose</span>
			</button>
		</div>
	`

	css = css/*css*/ `
		:host {
			display: flex;
			align-items: center;
			flex: 1;
			justify-content: flex-end;
		}

		.nav-items-container {
			display: flex;
			align-items: center;
			padding-right: var(--uiSpacingSmall);
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
