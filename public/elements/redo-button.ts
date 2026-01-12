import {attribute, booleanAttribute, element, Element, html, type ElementAttributes} from 'lume'
import './icon-button.js'

type RedoButtonAttributes = 'disabled' | 'group'

@element
export class RedoButton extends Element {
	static override readonly elementName = 'redo-button'

	@booleanAttribute disabled = false
	@attribute group: string | null = null

	icon = () => html`
		<svg width="10" height="12" viewBox="0 0 10 12" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M7 1.32227L9.00001 3.31903L7 5.3158" stroke="#F6F6F6" stroke-linecap="round" stroke-linejoin="round" />
			<path
				d="M1.24993 10.6782C1.24993 10.6782 0.301433 7.89306 2.09995 5.36461C3.86489 2.88337 8.33336 3.38686 8.33336 3.38686"
				stroke="#F6F6F6"
				stroke-linecap="round"
			/>
		</svg>
	`
	override template = () =>
		html`<icon-button disabled=${() => this.disabled} group=${() => this.group}>${() => this.icon()}</icon-button>`
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			[RedoButton.elementName]: ElementAttributes<RedoButton, RedoButtonAttributes>
		}
	}
}

declare global {
	interface HTMLElementTagNameMap {
		[RedoButton.elementName]: RedoButton
	}
}
