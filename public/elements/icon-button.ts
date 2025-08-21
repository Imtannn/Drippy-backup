import {booleanAttribute, css, element, Element, eventAttribute, html, type ElementAttributes} from 'lume'

type IconButtonAttributes = 'disabled' | 'onclick'

@element
export class IconButton extends Element {
	static readonly elementName = 'icon-button'

	@booleanAttribute disabled = false

	@eventAttribute onclick = null

	#onClick = () => {
		this.dispatchEvent(new CustomEvent('click', {bubbles: true}))
	}

	template = () => html`
		<button class="icon-button" disabled=${() => this.disabled} onclick=${this.#onClick}>
			<div class="icon-button-icon"><slot></slot></div>
		</button>
	`

	css = css/*css*/ `
		.icon-button {
			border-radius: 9999px;
			background-color: #12131680;
			backdrop-filter: blur(50px);
			padding: 0.5rem 0.75rem;
			width: 2rem;
			height: 2rem;
			display: flex;
			align-items: center;
			justify-content: center;
			cursor: pointer;
			transition: background-color 0.2s ease-in-out;
			user-select: none;
			pointer-events: auto;
			will-change: background-color;
			border: none;
		}

		.icon-button:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
	`
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			[IconButton.elementName]: ElementAttributes<IconButton, IconButtonAttributes>
		}
	}
}

declare global {
	interface HTMLElementTagNameMap {
		[IconButton.elementName]: IconButton
	}
}
