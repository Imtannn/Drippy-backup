import {css, Element, element, html, type ElementAttributes} from 'lume'

type TopNavigationAttributes = keyof {}

@element
export class TopNavigation extends Element {
	static readonly elementName = 'top-navigation'

	template = () => html`
		<nav class="top-nav">
			<slot></slot>
		</nav>
	`

	css = css/*css*/ `
		:host {
			display: block;
		}

		/* Mobile: Fixed position floating at top of screen */
		@media (max-width: 767px) {
			:host {
				position: fixed;
				top: 0;
				left: 0;
				right: 0;
				z-index: 1000;
				background: transparent;
			}
		}

		/* Desktop: Position at top of top-sheet */
		@media (min-width: 768px) {
			:host {
				width: 30rem;
				margin: 60px auto 0 auto;
				padding-bottom: 14px;
			}
		}

		.top-nav {
			display: flex;
			align-items: center;
			justify-content: space-between;
			position: relative;
			z-index: 100;
			margin-top: -5px;
		}
	`
}

declare global {
	interface HTMLElementTagNameMap {
		'top-navigation': TopNavigation
	}
}

declare module 'lume' {
	interface IntrinsicElements {
		'top-navigation': ElementAttributes<TopNavigation, TopNavigationAttributes>
	}
}
