import {css, Element, element, html, signal, type ElementAttributes} from 'lume'

type BottomNavigationAttributes = keyof {}

@element
export class BottomNavigation extends Element {
	static readonly elementName = 'bottom-navigation'

	@signal activeTab: string = 'items'

	#onTabClick = (tabName: string) => {
		this.activeTab = tabName
		// Dispatch event for parent components to listen to
		this.dispatchEvent(
			new CustomEvent('tab-change', {
				detail: {tab: tabName},
				bubbles: true,
				composed: true,
			}),
		)
	}

	template = () => html`
		<nav class="bottom-nav">
			<div class="avatar-section">
				<div class="avatar-container">
					<img src="/images/avatar-placeholder.webp" alt="Avatar" class="avatar-image" />
					<button class="avatar-dropdown-btn">
						<img src="/images/chevron-down.svg" alt="Dropdown" />
					</button>
				</div>
			</div>
			<div class="nav-items">
				<button
					class="nav-item"
					classList=${{active: () => this.activeTab === 'items'}}
					onclick=${() => this.#onTabClick('items')}
				>
					<div class="nav-icon">
						<img src="/images/items.svg" alt="Items" />
					</div>
					<span class="nav-label">Items</span>
				</button>

				<button
					class="nav-item"
					classList=${{active: () => this.activeTab === 'pose'}}
					onclick=${() => this.#onTabClick('pose')}
				>
					<div class="nav-icon">
						<img src="/images/pose.svg" alt="Pose" />
					</div>
					<span class="nav-label">Pose</span>
				</button>
			</div>
		</nav>
	`

	css = css/*css*/ `
		:host {
			display: block;
			padding: var(--uiSpacingSmall) var(--uiSpacing);
		}

		/* Mobile: Fixed position floating at bottom of screen */
		@media (max-width: 767px) {
			:host {
				position: fixed;
				bottom: 0;
				left: 0;
				right: 0;
				z-index: 100;
				background: transparent;
			}
		}

		/* Desktop: Position at bottom of bottom-sheet */
		@media (min-width: 768px) {
			:host {
				position: absolute;
				bottom: 0;
				left: 0;
				right: 0;
			}
		}

		.bottom-nav {
			display: flex;
			align-items: center;
			justify-content: space-between;
			background: rgba(255, 255, 255, 0.8);
			backdrop-filter: blur(20px);
			border-radius: 24px;
			position: relative;
			box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
			border: 1px solid rgba(255, 255, 255, 0.2);
		}

		.nav-items {
			display: flex;
			align-items: center;
			flex: 1;
			padding-right: var(--uiSpacingSmall);
			justify-content: flex-end;
		}

		.nav-item {
			display: flex;
			flex-direction: column;
			align-items: center;
			background: none;
			border: none;
			cursor: pointer;
			padding: var(--uiSpacingSmall);
			border-radius: var(--borderRadiusSmall);
			transition: all 0.2s ease;
			color: var(--uiColorSecondaryDark);
			min-width: 27px;
		}

		.nav-item:hover {
			background: var(--uiColorSecondaryLightGrey);
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
			font-size: var(--fontSizeTextXs);
			font-weight: var(--fontWeightMedium);
			line-height: 1;
		}

		.avatar-section {
			display: flex;
			align-items: center;
		}

		.avatar-container {
			display: flex;
			align-items: center;
			cursor: pointer;
			transition: background 0.2s ease;
			padding: 5px;
		}

		.avatar-container:hover {
			background: var(--uiColorSecondaryLightGrey);
		}

		.avatar-image {
			width: 40px;
			height: 40px;
			border-radius: var(--borderRadiusCircular);
			object-fit: cover;
			border: 2px solid var(--uiColorBorderColor);
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
		'bottom-navigation': BottomNavigation
	}
}

declare module 'lume' {
	interface IntrinsicElements {
		'bottom-navigation': ElementAttributes<BottomNavigation, BottomNavigationAttributes>
	}
}
