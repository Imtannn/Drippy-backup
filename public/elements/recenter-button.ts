import {element, Element, html, type ElementAttributes} from 'lume'
import './icon-button.js'
import {store} from '../app/store.js'

@element
export class RecenterButton extends Element {
	static override readonly elementName = 'recenter-button'

	#onClick = () => {
		store.cameraResetTick++
	}

	override template = () => html`
		<icon-button onclick=${this.#onClick}>
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M8 3H5a2 2 0 0 0-2 2v3"/>
				<path d="M16 3h3a2 2 0 0 1 2 2v3"/>
				<path d="M21 16v3a2 2 0 0 1-2 2h-3"/>
				<path d="M8 21H5a2 2 0 0 1-2-2v-3"/>
			</svg>
		</icon-button>
	`
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			[RecenterButton.elementName]: ElementAttributes<RecenterButton, never>
		}
	}
}

declare global {
	interface HTMLElementTagNameMap {
		[RecenterButton.elementName]: RecenterButton
	}
}
