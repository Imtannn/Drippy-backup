import {attribute, booleanAttribute, css, Element, element, html, type ElementAttributes} from 'lume'

type ProgressLoaderAttributes = 'isVisible' | 'progress'

@element
export class ProgressLoader extends Element {
	static elementName = 'progress-loader'

	@booleanAttribute isVisible = false
	@attribute progress = 0

	connectedCallback() {
		super.connectedCallback()

		this.createEffect(() => {
			this.style.setProperty('--display', this.isVisible ? 'flex' : 'none')
		})
	}

	template = () => html`
		<div class="loading-overlay">
			<div class="loading-content">
				<img src="/images/D.webp" alt="Drippy Logo" class="loading-logo" />
				<div class="progress-container">
					<div class="progress-bar-bg"></div>
					<div class="progress-bar-fill" style=${() => `width: ${this.progress}%`}></div>
				</div>
			</div>
		</div>
	`

	css = css/*css*/ `
		:host {
			--display: none;
			display: var(--display);
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			z-index: 10000;
		}

		.loading-overlay {
			width: 100%;
			height: 100%;
			background: var(--appBackground);
			display: flex;
			align-items: center;
			justify-content: center;
			pointer-events: none;
			transform: var(--sceneTranslateX, translateX(0));
			-webkit-transform: var(--sceneTranslateX, translateX(0));
			transition: transform var(--transitionFast);
			-webkit-transition: transform var(--transitionFast);
		}

		@media (max-width: 767px) {
			.loading-overlay {
				transform: translateX(0);
				-webkit-transform: translateX(0);
				align-items: flex-start;
				padding-top: 35%;
			}
		}

		.loading-content {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 2rem;
		}

		.loading-logo {
			width: 120px;
			height: auto;
			object-fit: contain;
		}

		.progress-container {
			position: relative;
			width: 200px;
			height: 8px;
		}

		.progress-bar-bg {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: #e0e1e4;
			border: 1px solid #000;
			border-radius: 4px;
			box-shadow: 0 2px 4px rgba(0, 0, 0, 0.25);
		}

		.progress-bar-fill {
			position: absolute;
			top: 0px;
			bottom: 1px;
			left: 0px;
			height: calc(100% + 1px);
			background: #2a2c31;
			border-radius: 3px;
			z-index: 1;
			transition: width 0.3s ease-out;
		}
	`
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			[ProgressLoader.elementName]: ElementAttributes<ProgressLoader, ProgressLoaderAttributes>
		}
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'progress-loader': ProgressLoader
	}
}
