import {css, element, Element, html, type ElementAttributes} from 'lume'

type SearchButtonAttributes = keyof object // no attributes yet

@element
export class SearchButton extends Element {
	static override readonly elementName = 'search-button'

	#onClick = () => {}
	override template = () =>
		html`<button class="search-button" onclick=${this.#onClick}>
			<img src="/images/action-buttons/search-button.svg" alt="Search" />
		</button>`
	override css = css /*css*/ `
		.search-button {
			background: none;
			border: none;
			padding: 0;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
		}

		.search-button img {
			display: block;
		}
	`
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			[SearchButton.elementName]: ElementAttributes<SearchButton, SearchButtonAttributes>
		}
	}
}

declare global {
	interface HTMLElementTagNameMap {
		[SearchButton.elementName]: SearchButton
	}
}
