import {css, Element, element, html, signal} from 'lume'
import '../elements/login-ui.js'
import '../elements/logic/show-when.js'
import '../elements/theme-switch.js'
import '../routes.js' // track page visits
import './avatar-selection.js'
import './blocks-selection.js'
import './custom-measurement.js'
import './drippy-scene.js'
import './order-view.js'
import './outfit-preview.js'
import './share-view.js'
import './spaces-selection.js'
import {store} from './store.js'
import type {Avatar} from '../types/types.js'
import './success-view.js'
import './template-view.js'
import {spaces} from '../consts/spaces.js'
import '../elements/video-loading.js'
import './app-guard.js'

// Hide the loading cover
const loadingCover = document.getElementById('loadingCover')
loadingCover?.classList.add('invisible')
loadingCover?.addEventListener('transitionend', () => loadingCover.remove())

@element
export class DrippyApp extends Element {
	static elementName = 'drippy-app'

	@signal appLoaded = false

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
						store.selectAvatar = avatar as Avatar
					} else {
						store.navigateTo = 'avatar'
						return
					}
				}

				// If no scene is selected and no scene is provided in search params, navigate to scene selection. Else, use the provided scene.
				if (!store.selectedSpace) {
					if (scene) {
						const space = spaces.find(space => space.name === scene)
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
	}

	template = () => html`
		<app-guard></app-guard>
		<show-when
			condition=${() => this.appLoaded}
			fallback=${() => html`<div class="loading">Loading...</div>`}
			content=${() => html`
				<show-when
					condition=${() =>
						store.view !== 'avatar' &&
						store.view !== 'scene' &&
						store.selectedAvatar &&
						store.selectedSpace &&
						store.isDrippySceneLoading.length > 0}
					content=${() => html`
						<div id="loadingCover">
							<video-loading isVisible="true"></video-loading>
						</div>
					`}
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
			width: var(--appWidth);
			height: var(--appHeight);
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

		#loadingCover {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			display: flex;
			align-items: center;
			justify-content: center;
			transition: opacity 0.5s;

			/* TODO Perhaps put the loading cover in the :modal layer so z-index is never needed.  */
			z-index: 1000;

			loading-icon {
				--loading-icon-color: 76, 169, 195;
				--loading-icon-outer-radius: 60px;
				--loading-icon-inner-radius: 30px;
			}

			background: var(--appBackground);

			[data-theme='dark'] & {
				background: var(--appBackgroundDark);
			}
		}
	`
}
