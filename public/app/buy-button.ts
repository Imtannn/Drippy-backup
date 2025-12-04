import {css, Element, element, html} from 'lume'

@element
export class BuyButton extends Element {
	static readonly elementName = 'buy-button'

	buyIcon = () =>
		html` <svg width="15" height="16" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path
				d="M3.16667 0.777832L1 3.66672V13.7778C1 14.1609 1.15218 14.5283 1.42307 14.7992C1.69395 15.0701 2.06135 15.2223 2.44444 15.2223H12.5556C12.9386 15.2223 13.306 15.0701 13.5769 14.7992C13.8478 14.5283 14 14.1609 14 13.7778V3.66672L11.8333 0.777832H3.16667Z"
				fill="#F6F6F6"
				stroke="#121316"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path d="M1 3.66675H14" stroke="#121316" stroke-linecap="round" stroke-linejoin="round" />
			<path
				d="M10.3891 6.55566C10.3891 7.32185 10.0847 8.05665 9.54297 8.59842C9.0012 9.14019 8.2664 9.44455 7.50022 9.44455C6.73404 9.44455 5.99924 9.14019 5.45746 8.59842C4.91569 8.05665 4.61133 7.32185 4.61133 6.55566"
				stroke="#121316"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>`

	template = () => html` <button class="buy-button">${this.buyIcon()} Shop it</button> `

	css = css/*css*/ `
		.buy-button {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: var(--uiGapSmall);
			padding: 8.5px 20.5px;
			border-radius: var(--borderRadiusPill);
			color: var(--uiColorPrimaryWhite);
			background-color: var(--uiColorPrimaryBlack);
			box-shadow: 0px 1px 2px 0px var(--uiColorWhiteShadow) inset;
			cursor: pointer;
			border: none;
			outline: none;
			font-weight: var(--fontWeightSemiBold);
			font-size: var(--fontSizeTextXs);
		}
	`
}
