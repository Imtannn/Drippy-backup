import {css, element, Element, html, type ElementAttributes} from 'lume'

type HeartButtonAttributes = keyof {}

@element
export class HeartButton extends Element {
	static readonly elementName = 'heart-button'

	#onClick = () => {}

	template = () =>
		html`<button class="heart-button" onclick=${this.#onClick}>
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
