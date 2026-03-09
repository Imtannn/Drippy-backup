import {Element, html, css, element, booleanAttribute} from 'lume'
import type {ElementAttributes} from 'lume'

@element
export class ShowOnDevice extends Element {
	static override readonly elementName = 'show-on-device'

	/* enable this attribute to show content on desktop (attribute ONLY, not JS prop (TODO attribute reflection in @lume/element)) */
	@booleanAttribute desktop = false
	/* enable this attribute to show content on mobile  (attribute ONLY, not JS prop (TODO attribute reflection in @lume/element)) */
	@booleanAttribute mobile = false

	override template = () => html`<slot></slot>`

	override css = css /*css*/ `
		:host {
			display: none; /* hide */
		}

		/* desktop */
		@media (min-width: 768px) {
			:host([desktop]) {
				display: contents; /* show */
			}
		}

		/* mobile */
		@media (max-width: 767px) {
			:host([mobile]) {
				display: contents; /* show */
			}
		}
	`
}

declare global {
	interface HTMLElementTagNameMap {
		'show-on-device': ShowOnDevice
	}
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			'show-on-device': ElementAttributes<ShowOnDevice>
		}
	}
}
