import {css, Element, element, html, signal, type ElementAttributes} from 'lume'

type NavItemsAttributes = 'activeTab'

@element
export class NavItems extends Element {
	static override readonly elementName = 'nav-items'

	@signal activeTab = 'items'
	override template = () => html`
		<div class="nav-items-container"></div>
	`
	override css = css /*css*/ `
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

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			'nav-items': ElementAttributes<NavItems, NavItemsAttributes>
		}
	}
}
