import {attribute, css, Element, element, html, type ElementAttributes} from 'lume'

type NavBarPosition = 'top' | 'bottom'

type NavBarAttributes = 'position'

const elementName = 'nav-bar'

@element
export class NavBar extends Element {
	static override readonly elementName = elementName

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
			--nav-bottom-bg: rgba(255, 255, 255, 0.8);
			--nav-bottom-backdrop: blur(20px);
			--nav-bottom-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
			--nav-bottom-border: rgba(255, 255, 255, 0.2);
		}

		:host-context([data-theme='dark']) {
			--nav-bottom-bg: rgba(18, 19, 22, 0.22);
			--nav-bottom-backdrop: blur(12px);
			--nav-bottom-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
			--nav-bottom-border: rgba(255, 255, 255, 0.14);
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
			background: var(--nav-bottom-bg);
			backdrop-filter: var(--nav-bottom-backdrop);
			border-radius: var(--borderRadiusPill);
			box-shadow: var(--nav-bottom-shadow);
			border: 1px solid var(--nav-bottom-border);
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
