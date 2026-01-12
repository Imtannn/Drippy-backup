import {css, element, Element, html, eventAttribute, signal, type ElementAttributes} from 'lume'

type HeartButtonAttributes = 'onclick' | 'active'

@element
export class HeartButton extends Element {
	static override readonly elementName = 'heart-button'

	@eventAttribute override onclick: ((e: MouseEvent) => void) | null = null
	@signal active = false
	override template = () =>
		html`<button
			class="heart-button"
			classList=${() => ({active: this.active})}
			onclick=${(e: MouseEvent) => this.onclick?.(e)}
		>
			${() =>
				this.active
					? html`<svg width="12" height="11" viewBox="0 0 20 17.35" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path
								d="M10 17.35L8.55 16.03C3.4 11.36 0 8.28 0 4.5C0 1.42 2.42 0 4.5 0C6.24 0 7.91 0.81 10 2.09C12.09 0.81 13.76 0 15.5 0C17.58 0 20 1.42 20 4.5C20 8.28 16.6 11.36 11.45 16.04L10 17.35Z"
								fill="#8c8c8c"
							/>
						</svg>`
					: html`<svg width="12" height="11" viewBox="0 0 12 11" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path
								d="M9.829 1.39564C9.58466 1.14339 9.29455 0.94329 8.97523 0.806767C8.65592 0.670244 8.31367 0.599976 7.96804 0.599976C7.6224 0.599976 7.28015 0.670244 6.96084 0.806767C6.64153 0.94329 6.35142 1.14339 6.10707 1.39564L5.59997 1.9189L5.09287 1.39564C4.59931 0.886354 3.9299 0.60024 3.2319 0.60024C2.5339 0.60024 1.86449 0.886354 1.37094 1.39564C0.877376 1.90493 0.600098 2.59567 0.600098 3.31591C0.600098 4.03615 0.877376 4.72689 1.37094 5.23618L1.87804 5.75944L5.59997 9.59998L9.3219 5.75944L9.829 5.23618C10.0735 4.98405 10.2674 4.68469 10.3997 4.3552C10.532 4.02572 10.6001 3.67256 10.6001 3.31591C10.6001 2.95926 10.532 2.6061 10.3997 2.27662C10.2674 1.94713 10.0735 1.64777 9.829 1.39564Z"
								stroke="#8C8C8C"
								stroke-width="1.2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>`}
		</button>`
	override css = css /*css*/ `
		.heart-button {
			background: #f6f6f6;
			border: none;
			padding: 0;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			transition: opacity 0.2s ease;
			border-radius: 50%;
			height: 25px;
			width: 25px;
		}

		.heart-button:hover {
			opacity: 0.7;
		}

		.heart-button svg {
			display: block;
		}
	`
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			[HeartButton.elementName]: ElementAttributes<HeartButton, HeartButtonAttributes>
		}
	}
}

declare global {
	interface HTMLElementTagNameMap {
		[HeartButton.elementName]: HeartButton
	}
}
