import {batch, createMemo, css, Element, element, html, signal} from 'lume'
import {fabrics} from '../consts/fabrics.js'
import {templates} from '../consts/templates.js'
import {spaces} from '../consts/spaces.js'
import '../elements/connection-warning.js'
import '../elements/logic/show-when.js'
import '../elements/login-ui.js'
import '../elements/theme-switch.js'
import '../elements/video-loading.js'
import '../routes.js' // track page visits
import {pushState, searchParams} from '../routes.js'
import type {Block, BlockCategory} from '../types/block.js'
import type {Fabric} from '../types/fabric.js'
import type {Template, TemplateCategory} from '../types/template.js'
import type {Space} from '../types/types.js'
import {getSpacePrimaryCollection} from '../utils.js'
import './app-guard.js'
import './avatar-selection.js'
import './brand-view.js'
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
import {parseSpaceQualifiedEntry, store} from './store.js'
import './success-view.js'
import './template-view.js'

// const avatar = createMemo(() => searchParams().get('avatar'))
// const scene = createMemo(() => searchParams().get('scene') as Space | null)
const isPreview = createMemo(() => searchParams().get('isPreview'))
const hasBrandParam = createMemo(() => !!searchParams().get('brand'))

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
				if (store.selectedSpace) {
					this.#loadFromUrlParameters(store.selectedSpace)
				}

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

		// Monitor URL params: if brand exists with other params, remove brand
		this.createEffect(() => {
			const params = searchParams()
			const hasBrand = params.has('brand')
			const paramKeys = Array.from(params.keys())
			const otherParams = paramKeys.filter(k => k !== 'brand')

			if (hasBrand && otherParams.length > 0) {
				// Brand exists but there are other params → remove brand
				params.delete('brand')
				pushState()
			}
		})

		this.createEffect(() => {
			if (
				store.view !== 'avatar' &&
				store.view !== 'space' &&
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

		if (!store.selectedSpace || store.selectedTemplates.size > 0) {
			return
		}

		const fallbackSpace = store.getEffectiveSpace() ?? space ?? null
		const garmentGroups = new Map<string, {space: Space; ids: string[]}>()
		const fabricGroups = new Map<string, string[]>()

		if (garmentsParam) {
			const garmentEntries = garmentsParam
				.split(',')
				.map(entry => entry.trim())
				.filter(Boolean)
			for (const entry of garmentEntries) {
				const {spaceSlug, value} = parseSpaceQualifiedEntry(entry)
				if (!value) continue

				const resolvedSpace = this.#resolveSpace(spaceSlug) ?? (!spaceSlug ? fallbackSpace : null)

				if (!resolvedSpace) continue

				const key = resolvedSpace.slug
				const group = garmentGroups.get(key)
				if (group) group.ids.push(value)
				else garmentGroups.set(key, {space: resolvedSpace, ids: [value]})
			}
		}

		if (fabricsParam) {
			const fabricEntries = fabricsParam
				.split(',')
				.map(entry => entry.trim())
				.filter(Boolean)
			for (const entry of fabricEntries) {
				const {spaceSlug, value} = parseSpaceQualifiedEntry(entry)
				if (!value) continue

				const resolvedSpace = this.#resolveSpace(spaceSlug) ?? (!spaceSlug ? fallbackSpace : null)
				if (!resolvedSpace) continue

				const key = resolvedSpace.slug
				const group = fabricGroups.get(key)
				if (group) group.push(value)
				else fabricGroups.set(key, [value])
			}
		}

		if (garmentGroups.size === 0) {
			return
		}

		const aggregatedTemplates = new Map<TemplateCategory, Template>()
		const aggregatedBlocks = new Map<TemplateCategory, Map<BlockCategory, Block>>()
		const aggregatedFabrics = new Map<TemplateCategory, Map<BlockCategory, Map<string, Fabric>>>()

		for (const {space: targetSpace, ids} of garmentGroups.values()) {
			// Check if there's a collection param for this space, otherwise use primary
			const collectionParam = searchParams().get('collection')
			let effectiveCollection: string | null = null

			if (collectionParam && targetSpace.collections.includes(collectionParam)) {
				effectiveCollection = collectionParam
			} else {
				effectiveCollection = getSpacePrimaryCollection(targetSpace)
			}

			const spaceTemplates = effectiveCollection ? templates[effectiveCollection] : undefined
			if (!spaceTemplates) continue

			const spaceFabrics = effectiveCollection ? fabrics[effectiveCollection] : undefined
			const fabricEntriesForSpace = fabricGroups.get(targetSpace.slug) ?? []
			const fabricOverrides =
				fabricEntriesForSpace.length > 0 && spaceFabrics
					? blockManager.buildFabricOverridesFromUrl(fabricEntriesForSpace.join(','), spaceFabrics)
					: new Map<TemplateCategory, Map<BlockCategory, Map<string, Fabric>>>()

			for (const garmentId of ids) {
				const trimmedId = garmentId.trim()
				if (!trimmedId) continue

				const template = spaceTemplates.find(t => t._id === trimmedId)
				if (!template) continue

				aggregatedTemplates.set(template.category, template)

				const templateBlockData = blockManager.convertTemplateToBlockData(template, effectiveCollection)
				const templateFabricOverrides = fabricOverrides.get(template.category)

				const {newBlocksMap, newFabricsMap} = blockManager.getBlocksAndFabricsMapFromTemplateData(
					templateBlockData,
					effectiveCollection,
					templateFabricOverrides,
				)

				aggregatedBlocks.set(template.category, newBlocksMap)
				aggregatedFabrics.set(template.category, newFabricsMap)
			}
		}

		if (aggregatedTemplates.size === 0) return

		batch(() => {
			store.selectedFabrics = aggregatedFabrics
			console.log('selected fabrics from url', aggregatedFabrics)

			// @ts-expect-error FIXME we should avoid having two different
			// ways of setting the same thing (see store.setSelectedBlocks
			// and onItemClick in template-view.ts). This will get more
			// difficult to manage and error prone/buggy.
			store.__selectedBlocks = aggregatedBlocks

			store.selectedTemplates = aggregatedTemplates
		})
	}

	#resolveSpace(spaceSlug: string | null): Space | null {
		if (!spaceSlug) return null
		return spaces.find(space => space.slug === spaceSlug) ?? null
	}

	template = () => html`
		<show-when
			condition=${() => this.appLoaded}
			fallback=${() => html`<div class="loading">Loading...</div>`}
			content=${() => html`
				<connection-warning></connection-warning>
				<div id="app-container">
					<show-when
						condition=${() => !hasBrandParam()}
						content=${() => html`
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
								condition=${() => store.view === 'space'}
								content=${() => html`<spaces-selection></spaces-selection>`}
							></show-when>

							<show-when
								condition=${() => store.view === 'template'}
								content=${() => html`<template-view></template-view>`}
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
						`}
					></show-when>

					<show-when condition=${() => hasBrandParam()} content=${() => html`<brand-view></brand-view>`}></show-when>
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
