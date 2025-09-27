import type {ElementAttributes} from '@lume/element'
import {css, Element, element, html, numberAttribute} from 'lume'
import '../app/app.js'
import '../imports/collections/Users.js'
import './login-ui.js'
import './theme-switch.js'

const logoUrl = new URL('../images/logo.svg', import.meta.url)
const logoUrlDark = new URL('../images/logo-dark.svg', import.meta.url)

type HomePageAttributes = keyof {} // no attributes yet

// If no query parameters, redirect to app with default avatar
// If query parameters exist, show the app directly
const hasParams = window.location.search
if (!hasParams) {
	window.location.href = '?avatar=moidien'
}

@element
export class HomePage extends Element {
	static readonly elementName = 'home-page'

	@numberAttribute count = 0

	connectedCallback() {
		super.connectedCallback()

		this.createEffect(() => {
			console.log(this.count)
		})
	}

	template = () => {
		const hasParams = window.location.search

		if (hasParams) {
			// Show the app when there are query parameters
			return html`<drippy-app></drippy-app>`
		} else {
			// Show the dev navigation page when no parameters
			return html`
				<img src="${logoUrl.href}" alt="Lume logo" />
				<img src="${logoUrlDark.href}" alt="Lume logo" class="dark" />

				<h1>Drippy</h1>

				<nav>
					<a href="/landing">Landing Page - Marketing page for Drippy</a>
					<a href="/onboarding">Onboarding - Get started with Drippy</a>
					<a href="/stats">Stats - View page visits and number of users</a>
					<a href="/profile">Profile - View and edit your username</a>
					<a href="/app">App - New app WIP</a>
				</nav>

				<login-ui
					custom-style=${() => css/*css*/ `
						#loginButtons a.login-link-text {
							:host-context([data-theme='dark']) & {
								color: white;
							}
						}
					`}
				></login-ui>

				<theme-switch></theme-switch>
			`
		}
	}

	css = css/*css*/ `
		:host {
			width: 100%;
			height: 100%;
		}

		/* Styles for the dev navigation page */
		:host:not(:has(drippy-app)) {
			display: flex;
			align-items: center;
			justify-content: center;
			flex-direction: column;
			gap: 1rem;
			opacity: 0;
		}

		/* Styles for the app view */
		:host:has(drippy-app) {
			display: contents;
		}

		* {
			pointer-events: auto;
		}

		h1 {
			font-size: 3vw;
			margin: 0;
		}

		img {
			/* Example of using a style variable that was defined in styleVars.js. */
			width: var(--logoWidth);

			:host-context([data-theme='dark']) &:not(.dark) {
				display: none;
			}

			&.dark {
				display: none;

				:host-context([data-theme='dark']) & {
					display: initial;
				}
			}
		}

		nav {
			display: flex;
			flex-direction: column;
			align-items: center;

			& > * {
				display: block;
				color: inherit;
			}
		}

		login-ui {
			display: block;
			position: absolute;
			top: 10px;
			right: 10px;
			z-index: 2;
		}

		theme-switch {
			position: absolute;
			top: 30px;
			right: 10px;
			z-index: 1;

			--theme-switch-icon-color: rgb(29, 29, 29);

			:host-context([data-theme='dark']) & {
				--theme-switch-icon-color: rgb(219, 219, 219);
			}
		}
	`
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			[HomePage.elementName]: ElementAttributes<HomePage, HomePageAttributes>
		}
	}
}

declare global {
	interface HTMLElementTagNameMap {
		[HomePage.elementName]: HomePage
	}
}
