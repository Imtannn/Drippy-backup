import {booleanAttribute, element, Element, html, type ElementAttributes} from 'lume'
import './icon-button.js'

type BackButtonAttributes = 'disabled'

@element
export class BackButton extends Element {
	static readonly elementName = 'back-button'

	@booleanAttribute disabled = false

	arrow = () => html`
		<svg fill="none" height="8" viewBox="0 0 16 8" width="16" xmlns="http://www.w3.org/2000/svg">
			<path
				d="m15.0021 4.5c.2761-.00116.499-.22594.4979-.50208-.0012-.27614-.2259-.49907-.5021-.49792zm-14.357124-.79373c-.194447.19608-.193127.51266.002947.7071l3.195217 3.16869c.19607.19445.51265.19313.7071-.00294.19444-.19608.19313-.51266-.00295-.7071l-2.84019-2.81662 2.81661-2.84019c.19445-.19607.19313-.512652-.00294-.707099-.19608-.194447-.51266-.193127-.7071.002947zm14.355024.29373-.0021-.5-13.999984.05835.002084.5.00208.5 14.00002-.05835z"
				fill="#fff"
			/>
		</svg>
	`

	template = () => html`<icon-button disabled=${() => this.disabled}>${() => this.arrow()}</icon-button>`
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			[BackButton.elementName]: ElementAttributes<BackButton, BackButtonAttributes>
		}
	}
}

declare global {
	interface HTMLElementTagNameMap {
		[BackButton.elementName]: BackButton
	}
}
