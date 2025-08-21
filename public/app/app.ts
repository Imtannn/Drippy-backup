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
			overflow: hidden;
			box-sizing: border-box;
		}

		.app-layout {
			position: relative;
			width: 100%;
			height: 100%;
			overflow: hidden;
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
