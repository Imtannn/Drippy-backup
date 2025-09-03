import {Element, html, css, element, type ElementAttributes, eventAttribute, booleanAttribute} from 'lume'

type DripItButtonAttributes = 'onclick' | 'buttonDisabled'

@element
export class DripItButton extends Element {
	static readonly elementName = 'drip-it-button'

	@booleanAttribute buttonDisabled = false

	@eventAttribute onclick = null

	#onClick = () => {
		if (this.buttonDisabled) return
		this.dispatchEvent(new CustomEvent('click', {bubbles: true}))
	}

	template = () => html`
		<button class="drip-it-button" onclick=${this.#onClick} disabled=${() => this.buttonDisabled}>Drip it!</button>
	`

	css = css/*css*/ `
		.drip-it-button {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 5px;
			padding: 8.5px 20.5px;
			border-radius: 100px;
			color: #ffffff;
			background-color: #121316;
			box-shadow: 0px 1px 2px 0px #ffffff40 inset;
			cursor: pointer;
			border: none;
			outline: none;
			font-weight: 600;
			font-size: 14px;
			width: 100px;
		}

		.drip-it-button:disabled {
			opacity: 0;
			cursor: not-allowed;
		}
	`
}

declare global {
	interface HTMLElementTagNameMap {
		'drip-it-button': DripItButton
	}
}

declare global {
	interface IntrinsicElements {
		'drip-it-button': ElementAttributes<DripItButton, DripItButtonAttributes>
	}
}
