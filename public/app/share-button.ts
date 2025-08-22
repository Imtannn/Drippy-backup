import {Element, html, css, element} from 'lume'

@element
export class ShareButton extends Element {
	static readonly elementName = 'share-button'

	shareIcon = () =>
		html` <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path
				d="M7.95508 0.789062C8.09295 0.728048 8.25237 0.739447 8.37891 0.818359L8.43066 0.856445L13.5928 5.20605C13.6921 5.28956 13.75 5.41293 13.75 5.54395C13.75 5.67525 13.6915 5.79748 13.5928 5.88086L8.43066 10.2314C8.29797 10.3434 8.11265 10.3695 7.95508 10.2998V10.2988C7.79709 10.2287 7.68922 10.0728 7.68945 9.89453V7.55859C6.2545 7.62185 5.11944 8.00003 4.11426 8.79688C3.04172 9.64726 2.09532 10.9904 1.10254 13C1.02455 13.1582 0.86472 13.25 0.699219 13.25C0.665513 13.25 0.632487 13.2464 0.600586 13.2393V13.2383C0.399611 13.1938 0.25012 13.0181 0.25 12.8066C0.25 7.91087 3.51414 3.8324 7.68945 3.55664V1.19336C7.6895 1.01574 7.79658 0.859396 7.95508 0.789062ZM8.58789 3.98242C8.58789 4.23418 8.38018 4.42676 8.13867 4.42676C4.93521 4.42689 2.18576 7.04467 1.38477 10.6484C2.16724 9.41121 2.98691 8.48998 3.91699 7.84668C5.12002 7.01473 6.48477 6.6623 8.13867 6.66211L8.22754 6.6709C8.4291 6.71107 8.58788 6.8852 8.58789 7.10547V8.93262L12.6074 5.54395L8.58789 2.1543V3.98242Z"
				fill="white"
				stroke="white"
				stroke-width="0.5"
			/>
		</svg>`

	template = () => html` <button class="share-button">${this.shareIcon()}</button> `

	css = css/*css*/ `
		.share-button {
			border-radius: 999px;
			cursor: pointer;
			padding: 0;
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 10px;
			width: 100%;
			border: none;
			font-size: 16px;
			font-weight: 600;
			text-align: center;
			width: 32px;
			height: 32px;
			background: #121316;
			color: #ffffff;
			box-shadow: 0px 1px 2px 0px #ffffff40 inset;
		}
	`
}
