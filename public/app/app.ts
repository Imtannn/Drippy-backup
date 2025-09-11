import {css, Element, element, html, signal} from 'lume'
import {spaces} from '../consts/spaces.js'
import '../elements/logic/show-when.js'
import '../elements/login-ui.js'
import '../elements/theme-switch.js'
import '../elements/video-loading.js'
import '../routes.js' // track page visits
import './app-guard.js'
import './avatar-selection.js'
import './blocks-selection.js'
import './custom-measurement.js'
import './drippy-scene.js'
import './order-items.js'
import './order-size.js'
import './order-view.js'
import './outfit-preview.js'
import './share-view.js'
import './spaces-selection.js'
import {store} from './store.js'
import './success-view.js'
import './template-view.js'

@element
export class DrippyApp extends Element {
	static elementName = 'drippy-app'

	@signal appLoaded = false
	@signal showLoadingCover = false

	connectedCallback() {
		super.connectedCallback()

		this.createEffect(() => {
			try {
				const searchParams = new URLSearchParams(window.location.search)
				const avatar = searchParams.get('avatar')
				const scene = searchParams.get('scene')
				const isPreview = searchParams.get('isPreview')

				// If no avatar is selected and no avatar is provided in search params, navigate to avatar selection. Else, use the provided avatar.
				if (!store.selectedAvatar) {
					if (avatar) {
						store.selectAvatar = avatar
					} else {
						store.navigateTo = 'avatar'
						return
					}
				}

				// If no scene is selected and no scene is provided in search params, navigate to scene selection. Else, use the provided scene.
				if (!store.selectedSpace) {
					if (scene) {
						const space = spaces.find(space => space.slug === scene)
						if (space) {
							store.selectSpace = space
						} else {
							store.navigateTo = 'scene'
							return
						}
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
				store.navigateTo = 'template'
			} catch (error) {
				console.error('Error loading app', error)
			} finally {
				this.appLoaded = true
			}
		})

		this.createEffect(() => {
			if (
				store.view !== 'avatar' &&
				store.view !== 'scene' &&
				store.selectedAvatar &&
				store.selectedSpace &&
				store.isDrippySceneLoading.length > 0
			) {
				this.showLoadingCover = true
			} else {
				this.showLoadingCover = false
			}
		})
	}

	template = () => html`
		<app-guard>
			<show-when
				condition=${() => this.appLoaded}
				fallback=${() => html`<div class="loading">Loading...</div>`}
				content=${() => html`
					<show-when
						condition=${() => this.showLoadingCover}
						content=${() => html` <video-loading></video-loading> `}
					></show-when>

					<div id="app-container">
						<drippy-scene id="drippy-scene"></drippy-scene>

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
							condition=${() => store.view === 'template'}
							content=${() => html`<template-view></template-view>`}
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
						<show-when condition=${() => store.view === 'share'} content=${() => html`<share-view></share-view>`}>
						</show-when>

						<show-when
							condition=${() => store.view === 'order-items'}
							content=${() => html`<order-items></order-items>`}
						>
						</show-when>

						<show-when condition=${() => store.view === 'order-size'} content=${() => html`<order-size></order-size>`}>
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
		</app-guard>
	`

	css = css`
		* {
			box-sizing: border-box;
			user-select: none;
		}

		:host {
			width: var(--appWidth);
			height: var(--appHeight);
		}

		.loading-cover {
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			width: 100%;
			height: 100%;
			background: var(--appBackground);
			z-index: 1000;
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
	`
}
