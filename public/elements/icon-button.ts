import {attribute, booleanAttribute, css, element, Element, eventAttribute, html, type ElementAttributes} from 'lume'

type IconButtonAttributes = 'disabled' | 'onclick' | 'group'

@element
export class IconButton extends Element {
	static override readonly elementName = 'icon-button'

	@booleanAttribute disabled = false
	@attribute group: string | null = null

	@eventAttribute override onclick = null

	#onClick = () => {
		this.dispatchEvent(new CustomEvent('click', {bubbles: true}))
	}
	override template = () => html`
		<button
			class="icon-button"
			disabled=${() => this.disabled}
			onclick=${this.#onClick}
			classList=${() => ({group: this.group != null})}
		>
			<div class="icon-button-icon"><slot></slot></div>
		</button>
	`
	override css = css/*css*/ `
		.icon-button {
			border-radius: 9999px;
			background-color: rgba(18, 19, 22, 0.75);
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

		/* When inside control-button-group, remove individual background */
		.icon-button.group {
			background-color: unset;
			backdrop-filter: unset;
		}

		.icon-button:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}

		.icon-button-icon {
			display: flex;
			align-items: center;
			justify-content: center;
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
