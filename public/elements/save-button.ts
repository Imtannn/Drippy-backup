import {Element, html, css, element, type ElementAttributes, eventAttribute} from 'lume'

type SaveButtonAttributes = 'onclick'

@element
export class SaveButton extends Element {
	static override readonly elementName = 'save-button'

	@eventAttribute override onclick = null

	#onClick = () => {
		this.dispatchEvent(new CustomEvent('click', {bubbles: true}))
	}
	override template = () => html` <button class="save-button" onclick=${this.#onClick}>Save</button> `
	override css = css/*css*/ `
		.save-button {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 5px;
			padding: 8.5px 20.5px;
			width: 80px;
			height: 30px;
			border-radius: 100px;
			color: #ffffff;
			background-color: #121316;
			box-shadow: 0px 1px 2px 0px #ffffff40 inset;
			cursor: pointer;
			border: none;
			outline: none;
			font-weight: 600;
			font-size: 14px;
		}
	`
}

declare global {
	interface HTMLElementTagNameMap {
		'save-button': SaveButton
	}
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			'save-button': ElementAttributes<SaveButton, SaveButtonAttributes>
		}
	}
}
