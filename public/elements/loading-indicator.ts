import {booleanAttribute, css, Element, element, html, type ElementAttributes} from 'lume'

type LoadingIndicatorAttributes = 'isVisible'

@element
export class LoadingIndicator extends Element {
	static elementName = 'loading-indicator'

	@booleanAttribute isVisible = false

	template = () => html` <div class="spinner" style=${() => `display: ${this.isVisible ? 'flex' : 'none'}`}></div> `

	css = css/*css*/ `
		.spinner {
			width: calc(2rem - 1px);
			height: calc(2rem - 1px);
			border: 1px solid rgba(0, 0, 0, 0.1);
			border-top: 1px solid #121316;
			border-radius: 50%;
			animation: spin 1s linear infinite;
		}

		@keyframes spin {
			0% {
				transform: rotate(0deg);
			}
			100% {
				transform: rotate(360deg);
			}
		}

		/* Dark theme support */
		[data-theme='dark'] .spinner {
			border: 1px solid rgba(255, 255, 255, 0.1);
			border-top: 1px solid #ffffff;
		}
	`
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			[LoadingIndicator.elementName]: ElementAttributes<LoadingIndicator, LoadingIndicatorAttributes>
		}
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'loading-indicator': LoadingIndicator
	}
}
