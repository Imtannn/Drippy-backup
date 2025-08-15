import {booleanAttribute, element, Element, html, type ElementAttributes} from 'lume'
import './icon-button.js'

type CubeButtonAttributes = 'disabled'

@element
export class CubeButton extends Element {
	static readonly elementName = 'cube-button'

	@booleanAttribute disabled = false

	icon = () => html`
		<svg width="12" height="14" viewBox="0 0 12 14" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path
				d="M11 9.19949V4.75505C10.9998 4.5602 10.9484 4.36883 10.8509 4.20014C10.7533 4.03144 10.6132 3.89136 10.4444 3.79393L6.55556 1.57171C6.38665 1.47419 6.19504 1.42285 6 1.42285C5.80496 1.42285 5.61335 1.47419 5.44444 1.57171L1.55556 3.79393C1.38681 3.89136 1.24666 4.03144 1.14915 4.20014C1.05163 4.36883 1.0002 4.5602 1 4.75505V9.19949C1.0002 9.39434 1.05163 9.58571 1.14915 9.7544C1.24666 9.92309 1.38681 10.0632 1.55556 10.1606L5.44444 12.3828C5.61335 12.4803 5.80496 12.5317 6 12.5317C6.19504 12.5317 6.38665 12.4803 6.55556 12.3828L10.4444 10.1606C10.6132 10.0632 10.7533 9.92309 10.8509 9.7544C10.9484 9.58571 10.9998 9.39434 11 9.19949Z"
				stroke="white"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M1.15039 4.17725L6.00039 6.9828L10.8504 4.17725"
				stroke="white"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path d="M6 12.5775V6.97754" stroke="white" stroke-linecap="round" stroke-linejoin="round" />
		</svg>
	`

	template = () => html`<icon-button disabled=${() => this.disabled}>${() => this.icon()}</icon-button>`
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			[CubeButton.elementName]: ElementAttributes<CubeButton, CubeButtonAttributes>
		}
	}
}

declare global {
	interface HTMLElementTagNameMap {
		[CubeButton.elementName]: CubeButton
	}
}
