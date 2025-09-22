import {css, Element, element, html, type ElementAttributes} from 'lume'

type BottomNavigationAttributes = keyof {}

@element
export class BottomNavigation extends Element {
	static readonly elementName = 'bottom-navigation'

	template = () => html`
		<nav class="bottom-nav">
			<slot></slot>
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
