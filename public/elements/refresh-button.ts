import {booleanAttribute, element, Element, html, type ElementAttributes} from 'lume'
import './icon-button.js'

type RefreshButtonAttributes = 'disabled'

@element
export class RefreshButton extends Element {
	static readonly elementName = 'refresh-button'

	@booleanAttribute disabled = false

	icon = () => html`
		<svg width="12" height="14" viewBox="0 0 12 14" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path
				d="M1.12545 7C1.04335 7.36181 1 7.73834 1 8.125C1 10.9209 3.26656 13.1875 6.0625 13.1875C8.85844 13.1875 11.125 10.9209 11.125 8.125C11.125 5.32906 8.85844 3.0625 6.0625 3.0625H2.5M2.5 3.0625L5.125 0.8125M2.5 3.0625L5.125 5.3125"
				stroke="#F6F6F6"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	`

	template = () => html`<icon-button disabled=${() => this.disabled}>${() => this.icon()}</icon-button>`
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			[RefreshButton.elementName]: ElementAttributes<RefreshButton, RefreshButtonAttributes>
		}
	}
}

declare global {
	interface HTMLElementTagNameMap {
		[RefreshButton.elementName]: RefreshButton
	}
}
