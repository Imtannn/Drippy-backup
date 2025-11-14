import {css, Element, element, html} from 'lume'

@element
export class BuyButton extends Element {
	static readonly elementName = 'buy-button'

	template = () => html`
		<button class="buy-button">
			<img src="/images/bag-icon.svg" alt="Bag" class="bag-icon" />
			View bag
		</button>
	`

	css = css/*css*/ `
		.buy-button {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: var(--uiGapSmall);
			padding: 8.5px 20.5px;
			border-radius: var(--borderRadiusPill);
			color: var(--uiColorPrimaryBlack);
			background-color: rgba(255, 255, 255, 0.7);
			backdrop-filter: blur(10px);
			border: var(--borderWidth) solid var(--uiColorBorderColor);
			box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.1);
			cursor: pointer;
			outline: none;
			font-weight: var(--fontWeightNormal);
			font-size: var(--fontSizeTextXs);
		}

		.bag-icon {
			width: 16px;
			height: 16px;
		}
	`
}
