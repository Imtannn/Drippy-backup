import {booleanAttribute, element, Element, eventAttribute, html, type ElementAttributes} from 'lume'
import './icon-button.js'

type HomeButtonAttributes = 'disabled' | 'onclick'

@element
export class HomeButton extends Element {
	static readonly elementName = 'home-button'

	@booleanAttribute disabled = false

	@eventAttribute onclick = null

	home = () => html`
		<svg width="14" height="16" viewBox="0 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path
				d="M1 6.00004L7 1.33337L13 6.00004V13.3334C13 13.687 12.8595 14.0261 12.6095 14.2762C12.3594 14.5262 12.0203 14.6667 11.6667 14.6667H2.33333C1.97971 14.6667 1.64057 14.5262 1.39052 14.2762C1.14048 14.0261 1 13.687 1 13.3334V6.00004Z"
				stroke="white"
				stroke-width="1.2"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M5 14.6667V8H9V14.6667"
				stroke="white"
				stroke-width="1.2"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	`

	#onClick = () => {
		this.dispatchEvent(new CustomEvent('click', {bubbles: true}))
	}

	template = () =>
		html`<icon-button disabled=${() => this.disabled} onclick=${this.#onClick}>${() => this.home()}</icon-button>`
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			[HomeButton.elementName]: ElementAttributes<HomeButton, HomeButtonAttributes>
		}
	}
}

declare global {
	interface HTMLElementTagNameMap {
		[HomeButton.elementName]: HomeButton
	}
}
