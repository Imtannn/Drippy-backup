import {attribute, booleanAttribute, element, Element, html, type ElementAttributes} from 'lume'
import './icon-button.js'

type UndoButtonAttributes = 'disabled' | 'group'

@element
export class UndoButton extends Element {
	static override readonly elementName = 'undo-button'

	@booleanAttribute disabled = false
	@attribute group: string | null = null

	icon = () => html`
		<svg width="10" height="11" viewBox="0 0 10 11" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M3 1L0.999994 2.99676L3 4.99353" stroke="#F6F6F6" stroke-linecap="round" stroke-linejoin="round" />
			<path
				d="M8.75007 10.356C8.75007 10.356 9.69857 7.57079 7.90005 5.04234C6.13511 2.5611 1.66664 3.0646 1.66664 3.0646"
				stroke="#F6F6F6"
				stroke-linecap="round"
			/>
		</svg>
	`
	override template = () => html`<icon-button disabled=${() => this.disabled} group=${() => this.group}>${() => this.icon()}</icon-button>`
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			[UndoButton.elementName]: ElementAttributes<UndoButton, UndoButtonAttributes>
		}
	}
}

declare global {
	interface HTMLElementTagNameMap {
		[UndoButton.elementName]: UndoButton
	}
}
