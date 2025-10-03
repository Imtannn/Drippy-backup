import {batch, createMemo, css, Element, element, html, signal} from 'lume'
import {fabrics} from '../consts/fabrics.js'
import {templates} from '../consts/templates.js'
import '../elements/logic/show-when.js'
import '../elements/login-ui.js'
import '../elements/theme-switch.js'
import '../elements/video-loading.js'
import '../routes.js' // track page visits
import type {Block, BlockCategory} from '../types/block.js'
import type {Fabric} from '../types/fabric.js'
import type {Template, TemplateCategory} from '../types/template.js'
import type {Space} from '../types/types.js'
import './app-guard.js'
import './avatar-selection.js'
import {blockManager} from './block-manager.js'
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
import {searchParams} from '../routes.js'

// const avatar = createMemo(() => searchParams().get('avatar'))
const scene = createMemo(() => searchParams().get('scene') as Space | null)
const isPreview = createMemo(() => searchParams().get('isPreview'))

@element
export class DrippyApp extends Element {
	static elementName = 'drippy-app'

	@signal appLoaded = false
	@signal showLoadingCover = false

	connectedCallback() {
		super.connectedCallback()

		// FIXME this needs re-work, currently can cause an infinite loop (the
		// console.logs in loadFromUrlParameters will log repeatedly)
		this.createEffect(() => {
			try {
				// Load garments and fabrics from URL parameters if present
				this.#loadFromUrlParameters(scene()!)

				if (store.isPreview || isPreview() === 'true') {
					store.view = 'preview'
					return
				}
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
				store.drippySceneLoads.size > 0
			) {
				this.showLoadingCover = true
			} else {
				this.showLoadingCover = false
			}
		})
	}

	/**
	 * Load garments and fabrics from URL parameters
	 * @param space - Selected space
	 */
	#loadFromUrlParameters(space: Space) {
		const garmentsParam = searchParams().get('garments')
		const fabricsParam = searchParams().get('fabrics')

		if ((garmentsParam || fabricsParam) && store.selectedSpace && store.selectedTemplates.size === 0) {
			const spaceTemplates = templates[store.selectedSpace.collection]
			const spaceFabrics = fabrics[store.selectedSpace.collection]

			if (spaceTemplates) {
				const templates = new Map<TemplateCategory, Template>()
				const newBlocks = new Map<TemplateCategory, Map<BlockCategory, Block>>()
				const newFabrics = new Map<TemplateCategory, Map<BlockCategory, Map<string, Fabric>>>()

				const fabricOverrides =
					fabricsParam && spaceFabrics
						? blockManager.buildFabricOverridesFromUrl(fabricsParam, spaceFabrics)
						: new Map<TemplateCategory, Map<BlockCategory, Map<string, Fabric>>>()

				// Load garments if present
				if (garmentsParam) {
					const garmentIds = garmentsParam.split(',')
					for (const garmentId of garmentIds) {
						const template = spaceTemplates.find(t => t._id === garmentId.trim())
						if (template) {
							templates.set(template.category, template)
							const templateBlockData = blockManager.convertTemplateToBlockData(template, space)

							const templateFabricOverrides = fabricOverrides.get(template.category)

							const {newBlocksMap, newFabricsMap} = blockManager.getBlocksAndFabricsMapFromTemplateData(
								templateBlockData,
								space,
								templateFabricOverrides,
							)
							newBlocks.set(template.category, newBlocksMap)
							newFabrics.set(template.category, newFabricsMap)
						}
					}
				}

				batch(() => {
					store.selectedFabrics = newFabrics
					console.log('selected fabrics from url', newFabrics)

					// @ts-expect-error FIXME we should avoid having two different
					// ways of setting the same thing (see store.setSelectedBlocks
					// and onItemClick in template-view.ts). This will get more
					// difficult to manage and error prone/buggy.
					store.__selectedBlocks = newBlocks

					store.selectedTemplates = templates
				})
			}
		}
	}

	template = () => html`
		<show-when
			condition=${() => this.appLoaded}
			fallback=${() => html`<div class="loading">Loading...</div>`}
			content=${() => html`
				<show-when
					condition=${() => this.showLoadingCover}
					content=${() => html` <video-loading></video-loading> `}
				></show-when>

				<div id="app-container">
					<drippy-scene
						id="drippy-scene"
						selected-space=${() => (console.log('selected space', store.selectedSpace), store.selectedSpace)}
						selected-avatar=${() => store.selectedAvatar}
						selected-fabrics=${() => store.selectedFabrics}
						selected-blocks=${() => store.selectedBlocks}
					></drippy-scene>

					<show-when
						condition=${() => store.view === 'avatar'}
						content=${() => html`<avatar-selection></avatar-selection>`}
					></show-when>

					<show-when
						condition=${() => store.view === 'scene'}
						content=${() => html`<spaces-selection></spaces-selection>`}
					></show-when>

					<show-when
						condition=${() => store.view === 'template'}
						content=${() => html`<template-view></template-view>`}
					></show-when>

					<show-when
						condition=${() => store.view === 'blocks'}
						content=${() => html`<blocks-selection></blocks-selection>`}
					></show-when>

					<show-when
						condition=${() => store.view === 'preview'}
						content=${() => html`<outfit-preview></outfit-preview>`}
					></show-when>

					<show-when
						condition=${() => store.view === 'share'}
						content=${() => html`<share-view></share-view>`}
					></show-when>

					<show-when
						condition=${() => store.view === 'order-items'}
						content=${() => html`<order-items></order-items>`}
					></show-when>

					<show-when
						condition=${() => store.view === 'order-size'}
						content=${() => html`<order-size></order-size>`}
					></show-when>

					<show-when
						condition=${() => store.view === 'order'}
						content=${() => html`<order-view></order-view>`}
					></show-when>

					<show-when
						condition=${() => store.view === 'custom-measurement'}
						content=${() => html`<custom-measurement></custom-measurement>`}
					></show-when>

					<show-when
						condition=${() => store.view === 'success'}
						content=${() => html`<success-view></success-view>`}
					></show-when>
				</div>
			`}
		></show-when>
	`

	css = css`
		* {
			box-sizing: border-box;
			user-select: none;
		}

		:host,
		#app-container {
			width: 100%;
			height: 100%;
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
