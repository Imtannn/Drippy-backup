import {attribute, css, element, Element, html, type ElementAttributes} from 'lume'

type LogoButtonAttributes = 'brandName'

const BRANDS = [
	{
		name: 'Drippy',
		image: new URL('../images/drippy-logo.webp', import.meta.url),
	},
	{
		name: 'Speed',
		image: new URL('../images/moidien-logo.webp', import.meta.url),
	},
	{
		name: 'MoiDien',
		image: new URL('../images/MoiDien-logo.webp', import.meta.url),
	},
]

@element
export class LogoButton extends Element {
	static readonly elementName = 'logo-button'

	@attribute brandName = 'Drippy'

	template = () =>
		html`<button
			class="logo-button"
			style=${() =>
				`background-image: url(${BRANDS.find(brand => brand.name === this.brandName)?.image}); background-size: cover; background-position: center;`}
		>
			LOGO
		</button>`

	css = css/*css*/ `
		.logo-button {
			background-color: #121316;
			color: #ffffff;
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
			overflow: hidden;

			img {
				width: 100%;
				height: 100%;
				object-fit: cover;
				object-position: center;
			}
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
