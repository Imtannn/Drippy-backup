import {attribute, css, Element, element, html, type ElementAttributes} from 'lume'

type NavBarPosition = 'top' | 'bottom'

type NavBarAttributes = 'position'

const elementName = 'nav-bar'

@element
export class NavBar extends Element {
	static override elementName = elementName

	/** The position of the nav bar: 'top' or 'bottom' */
	@attribute position: NavBarPosition = 'top'

	override template = () => html`
		<nav
			class="nav-shell"
			classList=${() => ({
				'nav-top': this.position === 'top',
				'nav-bottom': this.position === 'bottom',
			})}
		>
			<slot></slot>
		</nav>
	`

	override css = css /*css*/ `
		:host {
			display: block;
		}

		/* Mobile positioning */
		@media (max-width: 767px) {
			/* Mobile: Fixed position floating at top of screen */
			:host([position='top']) {
				position: fixed;
				top: 0;
				left: 0;
				right: 0;
				z-index: 1000;
				background: transparent;
			}

			/* Mobile: Fixed position floating at bottom of screen */
			:host([position='bottom']) {
				position: fixed;
				bottom: 0;
				left: 0;
				right: 0;
				z-index: 100;
				background: transparent;
				padding: 2px;
			}
		}

		/* Desktop positioning */
		@media (min-width: 768px) {
			/* Desktop: Position at top of top-sheet */
			:host([position='top']) {
				width: 32rem;
				padding-right: var(--uiSpacing);
			}

			/* Desktop: Position at bottom of bottom-sheet */
			:host([position='bottom']) {
				position: absolute;
				bottom: 0;
				left: 0;
				right: 0;
				padding: 2px;
				padding-bottom: 14px;
			}
		}

		.nav-shell {
			display: flex;
			align-items: center;
			justify-content: space-between;
			position: relative;
			z-index: 100;
		}

		/* Top navigation styles */
		.nav-top {
			margin-top: -5px;
			padding-left: var(--uiSpacing);
		}

		/* Bottom navigation styles */
		.nav-bottom {
			background: rgba(255, 255, 255, 0.8);
			backdrop-filter: blur(20px);
			border-radius: var(--borderRadiusPill);
			box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
			border: 1px solid rgba(255, 255, 255, 0.2);
			padding: 2px 4px;
		}
	`
}

declare global {
	interface HTMLElementTagNameMap {
		[elementName]: NavBar
	}
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			[elementName]: ElementAttributes<NavBar, NavBarAttributes>
		}
	}
}
