import {booleanAttribute, css, Element, element, type ElementAttributes, eventAttribute, html} from 'lume'

type PreviewButtonAttributes = 'onclick' | 'buttonDisabled'

@element
export class PreviewButton extends Element {
	static readonly elementName = 'preview-button'

	@booleanAttribute buttonDisabled = false

	@eventAttribute onclick = null

	#onClick = () => {
		this.dispatchEvent(new CustomEvent('click', {bubbles: true}))
	}

	previewIcon = () =>
		html` <svg
			fill="none"
			height="11"
			viewBox="0 0 9 11"
			width="9"
			xmlns="http://www.w3.org/2000/svg"
			xmlns:xlink="http://www.w3.org/1999/xlink"
		>
			<filter
				id="a"
				color-interpolation-filters="sRGB"
				filterUnits="userSpaceOnUse"
				height="11"
				width="8"
				x=".5"
				y=".5"
			>
				<feFlood flood-opacity="0" result="BackgroundImageFix" />
				<feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
				<feColorMatrix
					in="SourceAlpha"
					result="hardAlpha"
					type="matrix"
					values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
				/>
				<feOffset dy="1" />
				<feGaussianBlur stdDeviation="1" />
				<feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
				<feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0" />
				<feBlend in2="shape" mode="normal" result="effect1_innerShadow_19952_10650" />
			</filter>
			<g filter="url(#a)">
				<path
					d="m.5 1.06828c0-.448869.494813-.719975.87105-.477244l6.86932 4.431714c.34617.22333.34617.73116 0 .9545l-6.86932 4.43175c-.376239.2427-.87105-.0284-.87105-.47728z"
					fill="#f6f6f6"
				/>
			</g>
		</svg>`

	template = () => html`
		<button class="preview-button" onclick=${this.#onClick} disabled=${() => this.buttonDisabled}>Preview & buy</button>
	`

	css = css/*css*/ `
		.preview-button {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: var(--uiGapSmall);
			padding: 8.5px 20.5px;
			height: var(--buttonHeight);
			border-radius: var(--borderRadiusPill);
			color: var(--uiColorPrimaryWhite);
			background-color: var(--uiColorPrimaryBlack);
			box-shadow: 0px 1px 2px 0px var(--uiColorWhiteShadow) inset;
			cursor: pointer;
			border: none;
			outline: none;
			font-weight: var(--fontWeightSemiBold);
			font-size: var(--fontSizeTextSm);
		}

		.preview-button:disabled {
			opacity: 0;
			cursor: not-allowed;
		}
	`
}

declare global {
	interface HTMLElementTagNameMap {
		'preview-button': PreviewButton
	}
}

declare global {
	interface IntrinsicElements {
		'preview-button': ElementAttributes<PreviewButton, PreviewButtonAttributes>
	}
}
