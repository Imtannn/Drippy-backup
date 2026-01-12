import type {ElementAttributes} from '@lume/element'
import {css, Element, element, html, numberAttribute} from 'lume'
import '../app/drippy-app.js'
import '../imports/collections/Users.js'
import './login-ui.js'

type HomePageAttributes = keyof object // no attributes yet

@element
export class HomePage extends Element {
	static override readonly elementName = 'home-page'

	@numberAttribute count = 0

	onPointerCancel = (event: PointerEvent) => {
		// Prevent drippy-app pointercancel from being interrupted by parent.
		event.preventDefault()
		event.stopPropagation()
	}
	override template = () => html`
		<drippy-app on:pointercancel=${this.onPointerCancel}></drippy-app>
		<style>
			drippy-app {
				width: 100%;
				height: 100%;
			}
		</style>
	`
	override css = css /*css*/ `
		:host {
			width: 100%;
			height: 100%;
			display: contents;
		}

		* {
			pointer-events: auto;
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
