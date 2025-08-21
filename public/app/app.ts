import {css, Element, element, html, onCleanup, signal} from 'lume'
import '../elements/login-ui.js'
import '../elements/show-when.js'
import '../routes.js' // track page visits
import './avatar-selection.js'
import './blocks-selection.js'
import './drippy-scene.js'
import './spaces-selection.js'
import './outfit-preview.js'
import './order-view.js'
import './custom-measurement.js'
import './success-view.js'
import '../elements/theme-switch.js'
import {store, type Avatar, type Scene} from './store.js'

const scenes = [
	{
		name: 'bloom realms',
		description: 'One million roses',
		image: new URL('../images/background-2.jpeg', import.meta.url),
	},
]

// Hide the loading cover
const loadingCover = document.getElementById('loadingCover')
loadingCover?.classList.add('invisible')
loadingCover?.addEventListener('transitionend', () => loadingCover.remove())
@element
export class DrippyApp extends Element {
	static elementName = 'drippy-app'

	@signal appLoaded = false
	@signal sceneUrl = ''

	connectedCallback() {
		super.connectedCallback()

		this.createEffect(() => {
			console.log('store.view', store.view)
			const scene = this.shadowRoot?.getElementById('drippy-scene')
			if (scene) {
				if (store.view === 'preview') {
					scene.style.setProperty('--scene-transform', 'translateY(0)')
				} else {
					scene.style.setProperty('--scene-transform', 'translateY(-120px)')
				}
			} else {
				const setProperty = () => {
					const scene = this.shadowRoot?.getElementById('drippy-scene')
					if (scene) {
						if (store.view === 'preview') {
							scene.style.setProperty('--scene-transform', 'translateY(0)')
						} else {
							scene.style.setProperty('--scene-transform', 'translateY(-120px)')
						}
					} else {
						setTimeout(setProperty, 100)
					}
				}
				setProperty()
				this.shadowRoot?.addEventListener('DOMContentLoaded', setProperty)
				onCleanup(() => this.shadowRoot?.removeEventListener('DOMContentLoaded', setProperty))
			}
		})

		this.createEffect(() => {
			console.log('store.selectedScene', store.selectedScene)
			if (store.selectedScene) {
				const scene = scenes.find(scene => scene.name === store.selectedScene)
				if (scene) {
					this.sceneUrl = scene.image.href
				}
			}
		})

		this.createEffect(() => {
			try {
				const searchParams = new URLSearchParams(window.location.search)
				const avatar = searchParams.get('avatar')
				const scene = searchParams.get('scene')
				const isPreview = searchParams.get('isPreview')

				// If no avatar is selected and no avatar is provided in search params, navigate to avatar selection. Else, use the provided avatar.
				if (!store.selectedAvatar) {
					if (avatar) {
						store.selectAvatar = avatar as Avatar
					} else {
						store.navigateTo = 'avatar'
						return
					}
				}

				// If no scene is selected and no scene is provided in search params, navigate to scene selection. Else, use the provided scene.
				if (!store.selectedScene) {
					console.log('scene', scene, store.selectedScene)
					if (scene) {
						store.selectScene = scene as Scene
					} else {
						store.navigateTo = 'scene'
						return
					}
				}

				if (store.isPreview || isPreview === 'true') {
					store.navigateTo = 'preview'
					return
				}

				// If both avatar and scene are selected, navigate to blocks.
				store.navigateTo = 'blocks'
			} catch (error) {
				console.error('Error loading app', error)
			} finally {
				this.appLoaded = true
			}
		})
	}

	template = () => html`
		<show-when
			condition=${() => this.appLoaded}
			fallback=${() => html`<div class="loading">Loading...</div>`}
			content=${() => html`
				<div id="app-container">
					<drippy-scene
						id="drippy-scene"
						style=${() => `background: url(${this.sceneUrl}) center bottom / cover no-repeat`}
					></drippy-scene>

					<show-when
						condition=${() => store.view === 'avatar'}
						content=${() => html`<avatar-selection></avatar-selection>`}
					>
					</show-when>

					<show-when
						condition=${() => store.view === 'scene'}
						content=${() => html`<spaces-selection></spaces-selection>`}
					>
					</show-when>

					<show-when
						condition=${() => store.view === 'blocks'}
						content=${() => html`<blocks-selection></blocks-selection>`}
					>
					</show-when>

					<show-when
						condition=${() => store.view === 'preview'}
						content=${() => html`<outfit-preview></outfit-preview>`}
					>
					</show-when>

					<show-when condition=${() => store.view === 'order'} content=${() => html`<order-view></order-view>`}>
					</show-when>

					<show-when
						condition=${() => store.view === 'custom-measurement'}
						content=${() => html`<custom-measurement></custom-measurement>`}
					>
					</show-when>

					<show-when condition=${() => store.view === 'success'} content=${() => html`<success-view></success-view>`}>
					</show-when>
				</div>
			`}
		>
		</show-when>
	`

	css = css`
		* {
			box-sizing: border-box;
		}

		:host {
			--scene-transform: translateY(-120px);
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

		#app-container {
			position: relative;
			width: 100%;
			height: 100%;
			overflow: hidden;
		}

		.app-buttons {
			position: absolute;
			z-index: 1;
			top: 135px;
			right: 1.5rem;
			display: flex;
			flex-direction: column;
			gap: 25px;
		}

		.app-buttons-group {
			display: flex;
			flex-direction: column;
			gap: 5px;
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

		.tabs-container {
			padding: 20px;
			padding-top: 0;
		}

		.bottom-sheet-header {
			position: sticky;
			top: 0;
			background: var(--appBackground);
			z-index: 10;
			border-bottom: 1px solid #e0e1e4;
		}

		.tabs-content-container {
			padding: 20px;
			padding-top: 0;
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

		.container {
			max-width: 600px;
			margin: 0 auto;
			background: white;
			padding: 20px;
			border-radius: 16px;
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		}

		.category-tabs {
			display: flex;
			gap: 15px;
			margin-bottom: 16px;
		}

		.category-tab {
			background: transparent;
			padding: 0;
			border: none;
			border-radius: 12px;
			font-size: 14px;
			color: #99999a;
			cursor: pointer;
			transition: all 0.2s ease;
		}

		.category-tab.active {
			color: #121316;
		}

		.items-grid {
			display: grid;
			grid-template-columns: repeat(3, 1fr);
			gap: 10px;
		}

		.item-card {
			aspect-ratio: 1;
			/* Two-layer background: inner fill on padding-box, gradient border on border-box */
			background:
				linear-gradient(#f8f8f8, #f8f8f8) padding-box,
				var(--item-card-border, linear-gradient(#0000, #0000)) border-box;
			border-radius: 12px;
			overflow: hidden;
			cursor: pointer;
			border: 1px solid transparent; /* needed so the border-box layer shows */
			transition:
				transform 0.2s ease,
				background 0.2s ease;
		}

		.item-card:hover {
			transform: scale(1.02);
			--item-card-border: linear-gradient(136.36deg, #e56be8 1.67%, #495cff 100.68%);
		}

		@media (max-width: 768px) {
			.item-card:hover {
				transform: none;
				--item-card-border: none;
			}
		}

		.item-card.active {
			--item-card-border: linear-gradient(136.36deg, #e56be8 1.67%, #495cff 100.68%);
		}

		.item-preview {
			width: 100%;
			height: 100%;
			background: #e0e0e0;
			display: flex;
			align-items: center;
			justify-content: center;
			position: relative;

			img {
				width: 100%;
				height: 100%;
				object-fit: cover;
			}
		}

		.item-preview.fabric {
			background: linear-gradient(45deg, #ff6b6b, #ffd93d);
		}

		.item-preview.accessory {
			background: linear-gradient(45deg, #6c5ce7, #a29bfe);
		}

		@media (max-width: 768px) {
			.category-tab {
				font-size: 12px;
			}

			.item-card {
				border-radius: 10px;
			}
		}

		#drippy-scene {
			transition: transform 0.2s ease-in-out;
		}

		@media (max-width: 767px) {
			#drippy-scene {
				transform: var(--scene-transform);
			}
		}
	`
}
