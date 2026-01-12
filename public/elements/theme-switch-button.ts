import {html, css, element, Element, type ElementAttributes} from 'lume'

type ThemeSwitchButtonAttributes = keyof object // no attributes yet

@element
export class ThemeSwitchButton extends Element {
	static override readonly elementName = 'theme-switch-button'
	override template = () => html`
		<div class="theme-switch-container">
			<theme-switch></theme-switch>
		</div>
	`
	override css = css/*css*/ `
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

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			'theme-switch-button': ElementAttributes<ThemeSwitchButton, ThemeSwitchButtonAttributes>
		}
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'theme-switch-button': ThemeSwitchButton
	}
}
