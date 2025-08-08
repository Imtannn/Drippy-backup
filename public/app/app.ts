import {css, Element, element, html} from 'lume'
import {createSignal} from 'solid-js'
import '../elements/PreviewMeasurementPage.js'
import '../elements/PreviewPage.js'
import '../elements/SpacesPage.js'
import '../elements/SuccessPage.js'
import '../elements/login-ui.js'
import {sharedUIStyles} from '../elements/shared-ui-styles.js'
import '../elements/show-when.js'
import '../elements/theme-switch.js'
import '../routes.js' // track page visits
import './drippy-scene.js'

// Simple signal for view switching
const [view, setView] = createSignal('success')

// Make it global for testing in browser console
;(window as any).setView = setView

const avatarThumb = new URL('../images/avatar-female-tmp.png', import.meta.url)

// Hide the loading cover
const loadingCover = document.getElementById('loadingCover')
loadingCover?.classList.add('invisible')
loadingCover?.addEventListener('transitionend', () => loadingCover.remove())

@element
export class DrippyApp extends Element {
	static elementName = 'drippy-app'

	template = () => html`
		<!-- show-when conditionals -->
		<show-when
			condition=${() => view() === 'preview-measurement'}
			content=${() => html`<preview-measurement-page></preview-measurement-page>`}
		></show-when>
		<show-when condition=${() => view() === 'preview'} content=${() => html`<preview-page></preview-page>`}></show-when>

		<show-when condition=${() => view() === 'space'} content=${() => html`<spaces-page></spaces-page>`}></show-when>

		<show-when condition=${() => view() === 'success'} content=${() => html`<success-page></success-page>`}></show-when>

		<show-when
			condition=${() => view() === 'avatar'}
			content=${() => html`
				<drippy-scene></drippy-scene>
				<section id="panel">
					<div class="genders">
						<button class="female selected">Women</button>
						<button class="male">Men</button>
					</div>

					<div class="grid">
						<div class="block"><img src=${avatarThumb} alt="Female avatar" /></div>
						<div class="block"><img src=${avatarThumb} alt="Female avatar" /></div>
						<div class="block"><img src=${avatarThumb} alt="Female avatar" /></div>
						<div class="block"><img src=${avatarThumb} alt="Female avatar" /></div>
						<div class="block"><img src=${avatarThumb} alt="Female avatar" /></div>
						<div class="block"><img src=${avatarThumb} alt="Female avatar" /></div>
					</div>
				</section>
			`}
		></show-when>
	`

	css = css`
		${sharedUIStyles}

		* {
			box-sizing: border-box;
		}

		:host {
			width: 600px;
			height: 400px;
		}

		drippy-scene {
			width: 100%;
			height: 100%;

			background: #ccc;
			:host-context([data-theme='dark']) & {
				background: #333;
			}
		}

		.genders {
			display: flex;
			gap: var(--uiSpacingSmall);
			margin-bottom: var(--uiSpacing);

			button {
				border: none;
				padding: 5px 10px;
				font-size: 0.7rem;
				line-height: 0.7rem;
				height: calc(0.7rem + 10px);
				border-radius: calc((0.7rem + 10px) / 2);

				background: #e0e1e4;
				color: #424347;

				&.selected {
					background: var(--appBackgroundDark);
					color: white;
				}

				:host-context([data-theme='dark']) & {
					background: #2b2b2c;
					color: #d0d0d0;

					&.selected {
						background: var(--appBackground);
						color: black;
					}
				}
			}
		}

		.grid {
			/* A grid with 3 columns, and infinite rows. */
			display: flex;
			gap: var(--uiSpacingSmall);
			flex-wrap: wrap;

			.block {
				--aspectRatio: 0.7;
				--width: calc((var(--panelWidth) - 2 * var(--uiSpacing) - 2 * var(--uiSpacingSmall)) / 3);
				width: var(--width);
				height: calc(var(--width) / var(--aspectRatio));
				overflow: hidden;

				background: #ebeced;
				:host-context([data-theme='dark']) & {
					background: #1b1b1b;
				}

				border: 1px solid transparent;
				border-radius: 10px;

				&:hover {
					border: 1px solid blue;

					:host-context([data-theme='dark']) & {
						border: 1px solid lightblue;
					}
				}

				img {
					pointer-events: none;
					position: relative;
					left: 50%;
					top: -20%;
					transform: translateX(-50%);
					width: 200%;
					height: auto;
				}
			}
		}
	`
}
