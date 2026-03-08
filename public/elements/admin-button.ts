import {css, element, eventAttribute, html, type ElementAttributes} from 'lume'
import {IconButton, type IconButtonAttributes} from './icon-button.js'
import {store} from '../app/store.js'

type AdminButtonAttributes = IconButtonAttributes

const tag = 'admin-button'

@element(tag)
export class AdminButton extends IconButton {
	@eventAttribute override onclick: EventListener | null = () => (store.showAdminContent = !store.showAdminContent)

	override defaultContent() {
		return html` <span>🐞</span> `
	}

	// @ts-expect-error this.template is already defined in the parent class
	#originalTemplate = this.template

	override template = () => html`
		<div style="display: contents">${() => (store.isAdmin ? this.#originalTemplate.call(this) : [])}</div>
	`

	override css: string = css /*css*/ `
		${(this as any) /*super css already exists*/.css}

		span {
			text-shadow:
				0px 0px 1px white,
				0px 0px 1px white,
				0px 0px 1px white,
				0px 0px 1px white,
				0px 0px 1px white,
				0px 0px 1px white,
				0px 0px 1px white,
				0px 0px 1px white,
				0px 0px 1px white,
				0px 0px 1px white;
		}
	`
}

declare global {
	interface HTMLElementTagNameMap {
		[tag]: AdminButton
	}
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			[tag]: ElementAttributes<AdminButton, AdminButtonAttributes>
		}
	}
}
