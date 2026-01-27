import '../elements/connection-warning.js'
import '../elements/iframe-popup.js'
import '../elements/logic/show-when.js'
import './avatar-selection.js'
import './brand-view.js'
import './custom-measurement.js'
import './drippy-scene.js'
import './order-items.js'
import './order-size.js'
import './order-view.js'
import './outfit-preview.js'
import './share-view.js'
import './spaces-selection.js'
import './success-view.js'
import './template-view.js'

import {batch, css, Element, element, html, signal, effect} from 'lume'
import '../routes.js' // track page visits
import {hasBrandParam, isPreview, pushState, searchParams} from '../routes.js'
import type {BlockCategory} from '../types/block.js'
import type {Template, TemplateCategory} from '../types/template.js'
import type {BlockFabricsMap, TemplateBlocksMap, TemplateFabricsMap, TemplateMap} from '../types/types.js'
import {setDefaultSpaceAndAvatar, store} from './store.js'
import {templateHelpers} from './TemplateHelpers.js'
import {entries, size} from '../utils.js'

@element
export class DrippyApp extends Element {
	static override elementName = 'drippy-app'

	@signal appLoaded = false

	override connectedCallback() {
		super.connectedCallback()
		setDefaultSpaceAndAvatar()
	}

	// FIXME this needs re-work, currently can cause an infinite loop (the
	// console.logs in loadFromUrlParameters will log repeatedly)
	@effect loadParamsEffect() {
		try {
			// Load garments and fabrics from URL parameters if present
			if (store.selectedSpace) this.#loadFromUrlParameters()

			if (store.isPreview || isPreview() === 'true') {
				store.view = 'preview'
				return
			}
		} catch (error) {
			console.error('Error loading app', error)
		} finally {
			this.appLoaded = true
			// Mark URL params as loaded so default garments can apply after user interactions
			store.urlParamsLoaded = true
		}
	}

	// Monitor URL params: if brand exists with other params, remove brand
	@effect urlBrandEffect() {
		const params = searchParams()
		const hasBrand = params.has('brand')
		const paramKeys = Array.from(params.keys())
		const otherParams = paramKeys.filter(k => k !== 'brand')

		if (hasBrand && otherParams.length > 0) {
			// Brand exists but there are other params → remove brand
			params.delete('brand')
			pushState()
		}
	}

	/**
	 * Load garments and fabrics from URL parameters
	 * @param space - Selected space
	 */
	#loadFromUrlParameters() {
		const garmentsParam = searchParams().get('garments')
		const blocksParam = searchParams().get('blocks')
		const fabricsParam = searchParams().get('fabrics')

		if (size(store.selectedTemplates) > 0) return

		const aggregatedTemplates: TemplateMap = {}
		const aggregatedBlocks: TemplateBlocksMap = {}
		const aggregatedFabrics: TemplateFabricsMap = {}
		// FIXME stop using Maps unless they solve a problem such as a static cache or iteration speed
		const templateCollectionHints = new Map<TemplateCategory, string | null>()
		const templatesWithExplicitBlocks = new Set<TemplateCategory>()

		const rememberTemplate = (template: Template, collectionHint: string | null) => {
			aggregatedTemplates[template.category] = template
			if (!templateCollectionHints.has(template.category))
				templateCollectionHints.set(template.category, collectionHint)
		}

		const mergeBlockFabrics = (existing: BlockFabricsMap | undefined, defaults: BlockFabricsMap): BlockFabricsMap => {
			// FIXME stop using Maps unless they solve a problem such as a static cache or iteration speed
			const merged = new Map() as BlockFabricsMap

			if (existing) for (const [blockCategory, fabricsMap] of entries(existing)) merged[blockCategory] = {...fabricsMap}

			for (const [blockCategory, fabricsMap] of entries(defaults)) {
				const existingPieces = merged[blockCategory]
				if (!existingPieces) {
					merged[blockCategory] = {...fabricsMap}
					continue
				}

				for (const [pieceKey, fabric] of entries(fabricsMap))
					if (!existingPieces[pieceKey]) existingPieces[pieceKey] = fabric
			}

			return merged
		}

		if (garmentsParam) {
			const garmentEntries = garmentsParam
				.split(',')
				.map(entry => entry.trim())
				.filter(Boolean)

			for (const entry of garmentEntries) {
				const {collectionSlug, value: templateId} = templateHelpers.parseCollectionQualifiedEntry(entry)
				if (!templateId) continue

				const template = templateHelpers.findTemplateById(templateId, collectionSlug)
				if (!template) continue

				const collectionKey = template.collection ?? collectionSlug ?? null
				rememberTemplate(template, collectionKey)
			}
		}

		if (blocksParam) {
			const blockEntries = blocksParam
				.split(',')
				.map(entry => entry.trim())
				.filter(Boolean)

			for (const entry of blockEntries) {
				const {collectionSlug, value: blockId} = templateHelpers.parseCollectionQualifiedEntry(entry)
				if (!blockId) continue

				const block = templateHelpers.findBlockById(blockId, collectionSlug)
				if (!block) continue

				const templateCategory = block.templateCategory as TemplateCategory
				templatesWithExplicitBlocks.add(templateCategory)

				const hintFromBlock = block.collection ?? collectionSlug ?? null
				// Always update template from block's templateId to ensure UI selection matches rendered blocks
				if (block.templateId) {
					const templateForBlock = templateHelpers.findTemplateById(block.templateId, hintFromBlock)
					if (templateForBlock) rememberTemplate(templateForBlock, hintFromBlock ?? templateForBlock.collection ?? null)
				}

				// Ensure the template referenced by this block is present in the aggregated templates,
				// so URL sharing keeps working even when only block overrides are provided.
				let templateBlocks = aggregatedBlocks[templateCategory]
				if (!templateBlocks) {
					templateBlocks = {}
					aggregatedBlocks[templateCategory] = templateBlocks
				}
				templateBlocks[block.category] = block
			}
		}

		if (fabricsParam) {
			const fabricEntries = fabricsParam
				.split(',')
				.map(entry => entry.trim())
				.filter(Boolean)

			for (const entry of fabricEntries) {
				const {collectionSlug, value} = templateHelpers.parseCollectionQualifiedEntry(entry)
				if (!value) continue

				const [keyPart, fabricId] = value.split(':')
				if (!keyPart || !fabricId) continue

				const dashIndex1 = keyPart.indexOf('-')
				if (dashIndex1 === -1) continue
				const templateCategory = keyPart.substring(0, dashIndex1) as TemplateCategory
				const remaining = keyPart.substring(dashIndex1 + 1)

				const dashIndex2 = remaining.indexOf('-')
				if (dashIndex2 === -1) continue
				const blockCategory = remaining.substring(0, dashIndex2) as BlockCategory
				const piece = remaining.substring(dashIndex2 + 1)

				if (!templateCategory || !blockCategory || !piece) continue

				const fabric = templateHelpers.findFabricById(fabricId, collectionSlug)
				if (!fabric) continue

				const existingTemplate = aggregatedTemplates[templateCategory]
				if (existingTemplate) {
					const hintFromFabric = collectionSlug ?? existingTemplate.collection ?? null
					rememberTemplate(existingTemplate, hintFromFabric)
				}

				let templateFabrics = aggregatedFabrics[templateCategory]
				if (!templateFabrics) {
					templateFabrics = {}
					aggregatedFabrics[templateCategory] = templateFabrics
				}

				let blockFabrics = templateFabrics[blockCategory]
				if (!blockFabrics) {
					blockFabrics = {}
					templateFabrics[blockCategory] = blockFabrics
				}

				blockFabrics[piece === 'default' ? 'default' : piece] = fabric
			}
		}

		if (size(aggregatedTemplates) === 0) return

		for (const [templateCategory, template] of entries(aggregatedTemplates)) {
			const hasExplicitBlocks = templatesWithExplicitBlocks.has(templateCategory)
			let templateBlocks = aggregatedBlocks[templateCategory]

			if (!templateBlocks || size(templateBlocks) === 0) {
				const collectionHint = templateCollectionHints.get(templateCategory) ?? template.collection ?? null

				if (!hasExplicitBlocks) {
					const templateBlockData = templateHelpers.convertTemplateToBlockData(template, collectionHint)
					const {newBlocksMap, newFabricsMap} = templateHelpers.getBlocksAndFabricsMapFromTemplateData(
						templateBlockData,
						collectionHint,
					)

					if (size(newBlocksMap) > 0) {
						aggregatedBlocks[templateCategory] = newBlocksMap
						templateBlocks = newBlocksMap
					} else if (!templateBlocks) aggregatedBlocks[templateCategory] = {}

					if (size(newFabricsMap) > 0) {
						const merged = mergeBlockFabrics(aggregatedFabrics[templateCategory], newFabricsMap)
						if (size(merged) > 0) aggregatedFabrics[templateCategory] = merged
					}
				} else if (!templateBlocks) aggregatedBlocks[templateCategory] = {}
			}
		}

		batch(() => {
			store.replaceSelectedGarments(aggregatedBlocks, aggregatedFabrics)
			store.selectedTemplates = aggregatedTemplates
		})
	}

	override template = () => html`
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
								selected-space=${() => store.selectedSpace}
								selected-avatar=${() => store.selectedAvatar}
								selected-garments=${() => store.selectedGarments}
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
								condition=${() => store.view === 'iframe-popup'}
								content=${() => html`<iframe-popup url=${() => store.iframePopupUrl || ''}></iframe-popup>`}
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
	override css = css`
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
