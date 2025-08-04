import {html, Element, element, css, signal, onCleanup} from 'lume'
import '../routes.js' // track page visits
import '../elements/login-ui.js'
import '../elements/theme-switch.js'

const avatarThumb = new URL('../images/avatar-female-tmp.png', import.meta.url)
const femaleAvatar = new URL('../models/EM-Female.glb', import.meta.url)

// Hide the loading cover
const loadingCover = document.getElementById('loadingCover')
loadingCover?.classList.add('invisible')
loadingCover?.addEventListener('transitionend', () => loadingCover.remove())

@element
export class DrippyApp extends Element {
	static elementName = 'drippy-app'

	template = () => html`
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
	`

	css = css/*css*/ `
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

		#panel {
			overflow: auto;

			padding: var(--uiSpacing);

			border-radius: 15px;
			position: absolute;

			top: var(--uiSpacing);
			left: var(--uiSpacing);
			bottom: var(--uiSpacing);

			--panelWidth: 300px;
			width: var(--panelWidth);

			@media (width < 720px) {
				--panelWidth: calc(100vw - 2 * var(--uiSpacing));

				top: unset;
				left: var(--uiSpacing);
				right: var(--uiSpacing);
				bottom: 0;

				width: unset;
				height: 400px;

				border-bottom-right-radius: 0;
				border-bottom-left-radius: 0;
			}

			background: var(--appBackground);
			:host-context([data-theme='dark']) & {
				background: var(--appBackgroundDark);
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

@element
export class DrippyScene extends Element {
	static elementName = 'drippy-scene'

	@signal isDark = false

	connectedCallback() {
		super.connectedCallback()

		this.isDark = document.documentElement.dataset.theme === 'dark'

		const onThemeChange = () => (this.isDark = document.documentElement.dataset.theme === 'dark')

		this.createEffect(() => {
			const mo = new MutationObserver(onThemeChange)
			mo.observe(document.documentElement, {attributes: true, attributeFilter: ['data-theme']})
			onCleanup(() => mo.disconnect())
		})
	}

	template = () => html`
		<lume-scene webgl>
			<lume-point-light
				position="500 -500 500"
				intensity="2000"
				prop:color=${() => (this.isDark ? 'cyan' : 'white')}
			></lume-point-light>
			<lume-point-light
				position="-500 500 -500"
				intensity="2000"
				prop:color=${() => (this.isDark ? 'deeppink' : 'white')}
			></lume-point-light>
			<lume-point-light
				position="500 -500 -500"
				intensity="2000"
				prop:color=${() => (this.isDark ? 'royalblue' : 'white')}
			></lume-point-light>
			<lume-point-light
				position="-500 500 500"
				intensity="2000"
				prop:color=${() => (this.isDark ? 'orange' : 'white')}
			></lume-point-light>

			<lume-camera-rig
				min-distance="1.5"
				max-distance="8"
				distance="4"
				dolly-speed="0.01"
				position="0 -1 0"
			></lume-camera-rig>

			<lume-box
				visible="false"
				cast-shadow="false"
				size="1 1 1"
				color="skyblue"
				roughness="0.3"
				metalness="0.7"
				mount-point="0.5 0.5 0.5"
			></lume-box>

			<lume-gltf-model src=${femaleAvatar.href}></lume-gltf-model>
		</lume-scene>
	`

	css = css/*css*/ `
		:host {
			width: 600px;
			height: 400px;

			touch-action: none;
		}
	`
}
