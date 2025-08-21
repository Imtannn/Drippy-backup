import {html, css, element, Element, type ElementAttributes} from 'lume'

type ThemeSwitchButtonAttributes = keyof {}

@element
export class ThemeSwitchButton extends Element {
	static readonly elementName = 'theme-switch-button'

	template = () => html`
		<div class="theme-switch-container">
			<theme-switch></theme-switch>
		</div>
	`
	css = css/*css*/ `
		.theme-switch-container {
			width: 2rem;
			height: 2rem;
			display: flex;
			align-items: center;
			justify-content: center;
			border-radius: 9999px;
			border: none;
		}

		theme-switch {
			--theme-switch-icon-color: rgb(29, 29, 29);

			[data-theme='dark'] & {
				--theme-switch-icon-color: rgb(219, 219, 219);
			}
		}
	`
}

declare global {
	interface HTMLElementTagNameMap {
		'theme-switch-button': ThemeSwitchButton
	}
}

declare global {
	interface IntrinsicElements {
		'theme-switch-button': ElementAttributes<ThemeSwitchButton, ThemeSwitchButtonAttributes>
	}
}
