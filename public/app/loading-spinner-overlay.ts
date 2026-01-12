import {css, Element, element, html, type ElementAttributes} from 'lume'

@element
export class LoadingSpinnerOverlay extends Element {
	static override readonly elementName = 'loading-spinner-overlay'

	override template = () => html`
		<div class="loading-overlay">
			<div class="spinner"></div>
		</div>
	`

	override css = css/*css*/ `
		:host {
			display: block;
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			z-index: 5;
			border-radius: 12px;
			overflow: hidden;
		}

		.loading-overlay {
			width: 100%;
			height: 100%;
			background: rgba(0, 0, 0, 0.4);
			display: flex;
			align-items: center;
			justify-content: center;
		}

		.spinner {
			width: 25px;
			height: 25px;
			border: 3px solid rgba(255, 255, 255, 0.3);
			border-top-color: var(--uiColorAccentViolet);
			border-radius: 50%;
			animation: spin 0.8s linear infinite;
		}

		@keyframes spin {
			to {
				transform: rotate(360deg);
			}
		}
	`
}

declare global {
	interface HTMLElementTagNameMap {
		'loading-spinner-overlay': LoadingSpinnerOverlay
	}
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			'loading-spinner-overlay': ElementAttributes<LoadingSpinnerOverlay>
		}
	}
}
