import {css, element, Element, html, eventAttribute, signal, type ElementAttributes} from 'lume'

type HeartButtonAttributes = 'onclick' | 'active'

@element
export class HeartButton extends Element {
	static readonly elementName = 'heart-button'

	@eventAttribute onclick: ((e: MouseEvent) => void) | null = null
	@signal active = false

	template = () =>
		html`<button
			class="heart-button"
			classList=${() => ({active: this.active})}
			onclick=${(e: MouseEvent) => this.onclick?.(e)}
		>
			<img src="/images/action-buttons/heart-button.svg" alt="Favorites" />
		</button>`

	css = css/*css*/ `
		.heart-button {
			background: none;
			border: none;
			padding: 0;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			transition: opacity 0.2s ease;
		}

		.heart-button:hover {
			opacity: 0.7;
		}

		.heart-button.active img {
		}

		.heart-button img {
			display: block;
		}
	`
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			[HeartButton.elementName]: ElementAttributes<HeartButton, HeartButtonAttributes>
		}
	}
}

declare global {
	interface HTMLElementTagNameMap {
		[HeartButton.elementName]: HeartButton
	}
}
