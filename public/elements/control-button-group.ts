import {css, element, Element, html, type ElementAttributes} from 'lume'

type ControlButtonGroupAttributes = keyof {}

/**
 * Groups control buttons (undo, redo, reload) together with a shared background.
 *
 * Usage:
 * ```html
 * <control-button-group>
 *   <undo-button></undo-button>
 *   <redo-button></redo-button>
 *   <reload-button></reload-button>
 * </control-button-group>
 * ```
 */
@element
export class ControlButtonGroup extends Element {
	static readonly elementName = 'control-button-group'

	template = () => html`
		<div class="control-button-group">
			<slot></slot>
		</div>
	`

	css = css/*css*/ `
		:host {
			display: inline-block;
		}

		.control-button-group {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 0;
			background-color: #12131680;
			backdrop-filter: blur(50px);
			border-radius: 9999px;
			margin: 6px auto;
		}
	`
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			[ControlButtonGroup.elementName]: ElementAttributes<ControlButtonGroup, ControlButtonGroupAttributes>
		}
	}
}

declare global {
	interface HTMLElementTagNameMap {
		[ControlButtonGroup.elementName]: ControlButtonGroup
	}
}
