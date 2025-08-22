import {html, css, element, Element, type ElementAttributes, attribute} from 'lume'
import {store} from './store.js'

// ============================================================================
// APP BUTTONS LEFT - Left side of the app buttons
// ============================================================================
type AppButtonsLeftAttributes = 'layout'

type AppButtonsLeftLayout = 'top' | 'bottom'

@element
export class AppButtonsLeft extends Element {
	static readonly elementName = 'app-buttons-left'

	@attribute layout: AppButtonsLeftLayout = 'top'

	connectedCallback() {
		super.connectedCallback()
		this.createEffect(() => {
			if (
				store.view === 'preview' ||
				store.view === 'order' ||
				store.view === 'custom-measurement' ||
				store.view === 'success'
			) {
				this.style.setProperty('--app-buttons-left-transform', 'translateX(0)')
			} else {
				this.style.setProperty('--app-buttons-left-transform', 'translateX(394px)')
			}
		})
	}

	template = () => html`
		<div
			id="app-buttons-left"
			class="app-buttons-left"
			classList=${() => ({
				top: this.layout === 'top',
				bottom: this.layout === 'bottom',
			})}
		>
			<slot></slot>
		</div>
	`

	css = css/*css*/ `
		:host {
			--app-buttons-left-transform: translateX(394px);
		}

		.app-buttons-left {
			position: absolute;
			left: 5px;
			z-index: 1;
			transform: translateX(0);
		}

		.top {
			top: 20px;
		}

		.bottom {
			bottom: calc(100dvh * 0.41 + 20px);
		}

		@media (min-width: 767px) {
			.bottom {
				bottom: unset;
				top: 20px;
				left: 42px;
			}

			.app-buttons-left {
				left: 10px;
				transform: var(--app-buttons-left-transform);
			}
		}
	`
}

// ============================================================================
// APP BUTTONS RIGHT - Right side of the app buttons
// ============================================================================
type AppButtonsRightAttributes = 'layout'

type AppButtonsRightLayout = 'top' | 'bottom'

@element
export class AppButtonsRight extends Element {
	static readonly elementName = 'app-buttons-right'

	@attribute layout: AppButtonsRightLayout = 'top'

	template = () => html`
		<div
			class="app-buttons-right"
			classList=${() => ({
				top: this.layout === 'top',
				bottom: this.layout === 'bottom',
			})}
		>
			<slot></slot>
		</div>
	`

	css = css/*css*/ `
		.app-buttons-right {
			position: absolute;
			z-index: 1;
			right: 5px;
			display: flex;
			flex-direction: column;
			gap: 25px;
		}

		.top {
			top: 20px;
		}

		.bottom {
			bottom: calc(100dvh * 0.41 + 20px);
		}

		@media (min-width: 767px) {
			.bottom {
				bottom: unset;
				top: 20px;
				right: 37px;
			}

			.app-buttons-right {
				right: 10px;
			}
		}
	`
}

// ============================================================================
// APP BUTTONS GROUP - Group of app buttons
// ============================================================================

type AppButtonsGroupAttributes = 'groupDirection' | 'customStyle'

@element
export class AppButtonsGroup extends Element {
	static readonly elementName = 'app-buttons-group'

	@attribute groupDirection: 'column' | 'row' = 'column'
	@attribute customStyle: string = ''
	connectedCallback() {
		super.connectedCallback()
		this.createEffect(() => {
			if (this.groupDirection === 'row') {
				this.style.setProperty('--app-buttons-group-direction', 'row')
			} else {
				this.style.setProperty('--app-buttons-group-direction', 'column')
			}
		})
	}

	template = () => html`
		<div class="app-buttons-group" id="app-buttons-group" style=${() => this.customStyle}>
			<slot></slot>
		</div>
	`

	css = css/*css*/ `
		:host {
			--app-buttons-group-direction: column;
		}

		.app-buttons-group {
			display: flex;
			flex-direction: var(--app-buttons-group-direction);
			gap: 5px;
		}
	`
}

declare global {
	interface HTMLElementTagNameMap {
		'app-buttons-left': AppButtonsLeft
		'app-buttons-right': AppButtonsRight
		'app-buttons-group': AppButtonsGroup
	}
}

declare global {
	interface IntrinsicElements {
		'app-buttons-left': ElementAttributes<AppButtonsLeft, AppButtonsLeftAttributes>
		'app-buttons-right': ElementAttributes<AppButtonsRight, AppButtonsRightAttributes>
		'app-buttons-group': ElementAttributes<AppButtonsGroup, AppButtonsGroupAttributes>
	}
}
