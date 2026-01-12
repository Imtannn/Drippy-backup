import {css, Element, element, html, type ElementAttributes} from 'lume'

type TopNavigationAttributes = keyof object // no attributes yet

@element
export class TopNavigation extends Element {
	static override readonly elementName = 'top-navigation'
	override template = () => html`
		<nav class="top-nav">
			<slot></slot>
		</nav>
	`
	override css = css /*css*/ `
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
				width: 32rem;
				padding-right: var(--uiSpacing);
			}
		}

		.top-nav {
			display: flex;
			align-items: center;
			justify-content: space-between;
			position: relative;
			z-index: 100;
			margin-top: -5px;
			padding-left: var(--uiSpacing);
		}
	`
}

declare global {
	interface HTMLElementTagNameMap {
		'top-navigation': TopNavigation
	}
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			'top-navigation': ElementAttributes<TopNavigation, TopNavigationAttributes>
		}
	}
}
