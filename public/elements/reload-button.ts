import {element, Element, html, type ElementAttributes} from 'lume'
import './icon-button.js'

type ReloadButtonAttributes = keyof {}

@element
export class ReloadButton extends Element {
	static readonly elementName = 'reload-button'

	#onClick = () => {}

	template = () =>
		html`<icon-button onclick=${this.#onClick}>
			<img src="/images/controls-buttons/reload-icon.svg" alt="Reload" />
		</icon-button>`
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			[ReloadButton.elementName]: ElementAttributes<ReloadButton, ReloadButtonAttributes>
		}
	}
}

declare global {
	interface HTMLElementTagNameMap {
		[ReloadButton.elementName]: ReloadButton
	}
}
