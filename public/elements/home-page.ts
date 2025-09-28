import type {ElementAttributes} from '@lume/element'
import {css, Element, element, html, numberAttribute} from 'lume'
import '../imports/collections/Users.js'
import './login-ui.js'

type HomePageAttributes = keyof {} // no attributes yet

const hasParams = window.location.search
if (!hasParams) {
	history.pushState(null, '', '?avatar=moidien')
}

@element
export class HomePage extends Element {
	static readonly elementName = 'home-page'

	@numberAttribute count = 0

	connectedCallback() {
		super.connectedCallback()
	}

	template = () => html`
		<style>
			/* Hide the #root we're not using from the imported HTML. */
			#root:first-of-type {
				display: none;
			}

			body {
				overflow: auto;
				pointer-events: auto;
			}

			login-ui {
				pointer-events: auto;
				display: block;
				position: absolute;
				top: 10px;
				right: 10px;
				z-index: 2;
			}
		</style>

		<drippy-app></drippy-app>
		<style>
			drippy-app {
				width: 100%;
				height: 100%;
			}
		</style>
	`

	css = css/*css*/ `
		:host {
			width: 100%;
			height: 100%;
			display: contents;
		}

		* {
			pointer-events: auto;
		}

		login-ui {
			display: block;
			position: absolute;
			top: 10px;
			right: 10px;
			z-index: 2;
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
