import {booleanAttribute, css, Element, element, html, type ElementAttributes} from 'lume'

type LoadingIndicatorAttributes = 'isVisible'

@element
export class LoadingIndicator extends Element {
	static elementName = 'loading-indicator'

	@booleanAttribute isVisible = false

	connectedCallback() {
		super.connectedCallback()
		this.createEffect(() => {
			this.style.setProperty('--opacity', this.isVisible ? '1' : '0')
		})
	}

	template = () => html` <div class="loader"></div> `

	css = css/*css*/ `
		:host {
			--opacity: 0;
			opacity: var(--opacity);
			transition: opacity 0.2s ease-in-out;
		}

		.loader {
			width: 1rem;
			aspect-ratio: 0.577;
			color: #121316;
			display: grid;
			background:
				linear-gradient(currentColor 0 0) top / 100% 1px,
				linear-gradient(currentColor 0 0) bottom/100% 1px,
				linear-gradient(to bottom right, #0000 calc(50% - 2px), currentColor calc(50% - 1px), #0000 50%) top/100%
					calc(100% + 2px),
				linear-gradient(to bottom left, #0000 calc(50% - 2px), currentColor calc(50% - 1px), #0000 50%) top/100%
					calc(100% + 2px);
			background-repeat: no-repeat;
			animation: l17 4s infinite linear;
		}
		.loader::before,
		.loader::after {
			content: '';
			grid-area: 1/1;
			background: inherit;
			border: inherit;
			animation: inherit;
		}
		.loader::after {
			animation-duration: 2s;
		}
		@keyframes l17 {
			100% {
				transform: rotate(1turn);
			}
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
