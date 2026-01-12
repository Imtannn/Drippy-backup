import {element, eventAttribute, html, type ElementAttributes} from 'lume'
import {IconButton, type IconButtonAttributes} from './icon-button.js'
import {store} from '../app/store.js'

type AdminButtonAttributes = IconButtonAttributes

@element
// @ts-expect-error override readonly elementName
export class AdminButton extends IconButton {
	static override readonly elementName = 'admin-button'

	@eventAttribute override onclick: EventListener | null = () => (store.showAdminContent = !store.showAdminContent)

	override defaultContent() {
		return html` <span>🔒</span> `
	}

	// @ts-expect-error this.template is already defined in the parent class
	#originalTemplate = this.template

	override template = () => html`
		<div style="display: contents">${() => (store.isAdmin ? this.#originalTemplate.call(this) : [])}</div>
	`
}

declare global {
	interface HTMLElementTagNameMap {
		'admin-button': AdminButton
	}
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			'admin-button': ElementAttributes<AdminButton, AdminButtonAttributes>
		}
	}
}
