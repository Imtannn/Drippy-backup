import {html, css, element, Element, type ElementAttributes, attribute} from 'lume'

type LogoButtonAttributes = 'brandName'

@element
export class LogoButton extends Element {
	static readonly elementName = 'logo-button'

	@attribute brandName = 'Logo'

	template = () => html`<button class="logo-button">${this.brandName}</button>`

	css = css/*css*/ `
		.logo-button {
			background-color: #121316;
			width: 2rem;
			height: 2rem;
			font-size: 8px;
			display: flex;
			font-weight: 600;
			align-items: center;
			justify-content: center;
			border-radius: 9999px;
			border: none;
			cursor: pointer;
			user-select: none;
			pointer-events: auto;
			will-change: background-color;
		}
	`
}

declare global {
	interface HTMLElementTagNameMap {
		'logo-button': LogoButton
	}
}

declare global {
	interface IntrinsicElements {
		'logo-button': ElementAttributes<LogoButton, LogoButtonAttributes>
	}
}
