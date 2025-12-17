import {batch, createMemo, css, Element, element, html, signal} from 'lume'
import '../elements/connection-warning.js'
import '../elements/logic/show-when.js'
import '../elements/login-ui.js'
import '../elements/theme-switch.js'
import '../elements/video-loading.js'
import '../routes.js' // track page visits
import {pushState, searchParams} from '../routes.js'
import type {BlockCategory} from '../types/block.js'
import type {Template, TemplateCategory} from '../types/template.js'
import type {
	BlockFabricsMap,
	CategoryBlocksMap,
	PieceFabricsMap,
	Space,
	TemplateBlocksMap,
	TemplateFabricsMap,
	TemplateMap,
} from '../types/types.js'
import './app-guard.js'
import './avatar-selection.js'
import './blocks-selection.js'
import './brand-view.js'
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
import {templateHelpers} from './template-helpers.js'
import './template-view.js'

const isPreview = createMemo(() => searchParams().get('isPreview'))
const hasBrandParam = createMemo(() => !!searchParams().get('brand'))

@element
export class DrippyApp extends Element {
	static override elementName = 'drippy-app'

	@signal appLoaded = false
	@signal showLoadingCover = false

	override connectedCallback() {
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
				// Mark URL params as loaded so default garments can apply after user interactions
				store.urlParamsLoaded = true
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
				store.isDrippySceneLoading
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
	#loadFromUrlParameters(_space: Space) {
		const garmentsParam = searchParams().get('garments')
		const blocksParam = searchParams().get('blocks')
		const fabricsParam = searchParams().get('fabrics')

		if (Object.keys(store.selectedTemplates).length > 0) {
			return
		}

		const aggregatedTemplates: TemplateMap = {}
		const aggregatedBlocks: TemplateBlocksMap = new Map()
		const aggregatedFabrics: TemplateFabricsMap = new Map()
		const templateCollectionHints = new Map<TemplateCategory, string | null>()
		const templatesWithExplicitBlocks = new Set<TemplateCategory>()

		const rememberTemplate = (template: Template, collectionHint: string | null) => {
			aggregatedTemplates[template.category] = template
			if (!templateCollectionHints.has(template.category)) {
				templateCollectionHints.set(template.category, collectionHint)
			}
		}

		const mergeBlockFabrics = (existing: BlockFabricsMap | undefined, defaults: BlockFabricsMap): BlockFabricsMap => {
			const merged = new Map() as BlockFabricsMap

			if (existing) {
				for (const [blockCategory, fabricsMap] of existing.entries()) {
					merged.set(blockCategory, new Map(fabricsMap) as PieceFabricsMap)
				}
			}

			for (const [blockCategory, fabricsMap] of defaults.entries()) {
				const existingPieces = merged.get(blockCategory)
				if (!existingPieces) {
					merged.set(blockCategory, new Map(fabricsMap) as PieceFabricsMap)
					continue
				}

				for (const [pieceKey, fabric] of fabricsMap.entries()) {
					if (!existingPieces.has(pieceKey)) {
						existingPieces.set(pieceKey, fabric)
					}
				}
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
					if (templateForBlock) {
						rememberTemplate(templateForBlock, hintFromBlock ?? templateForBlock.collection ?? null)
					}
				}

				// Ensure the template referenced by this block is present in the aggregated templates,
				// so URL sharing keeps working even when only block overrides are provided.
				let templateBlocks = aggregatedBlocks.get(templateCategory)
				if (!templateBlocks) {
					templateBlocks = new Map() as CategoryBlocksMap
					aggregatedBlocks.set(templateCategory, templateBlocks)
				}
				templateBlocks.set(block.category, block)
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

				let templateFabrics = aggregatedFabrics.get(templateCategory)
				if (!templateFabrics) {
					templateFabrics = new Map() as BlockFabricsMap
					aggregatedFabrics.set(templateCategory, templateFabrics)
				}

				let blockFabrics = templateFabrics.get(blockCategory)
				if (!blockFabrics) {
					blockFabrics = new Map() as PieceFabricsMap
					templateFabrics.set(blockCategory, blockFabrics)
				}

				blockFabrics.set(piece === 'default' ? 'default' : piece, fabric)
			}
		}

		if (Object.keys(aggregatedTemplates).length === 0) return

		for (const [templateCategory, template] of Object.entries(aggregatedTemplates)) {
			const hasExplicitBlocks = templatesWithExplicitBlocks.has(templateCategory)
			let templateBlocks = aggregatedBlocks.get(templateCategory)

			if (!templateBlocks || templateBlocks.size === 0) {
				const collectionHint = templateCollectionHints.get(templateCategory) ?? template.collection ?? null

				if (!hasExplicitBlocks) {
					const templateBlockData = templateHelpers.convertTemplateToBlockData(template, collectionHint)
					const {newBlocksMap, newFabricsMap} = templateHelpers.getBlocksAndFabricsMapFromTemplateData(
						templateBlockData,
						collectionHint,
					)

					if (newBlocksMap.size > 0) {
						aggregatedBlocks.set(templateCategory, newBlocksMap)
						templateBlocks = newBlocksMap
					} else if (!templateBlocks) {
						aggregatedBlocks.set(templateCategory, new Map() as CategoryBlocksMap)
					}

					if (newFabricsMap.size > 0) {
						const merged = mergeBlockFabrics(aggregatedFabrics.get(templateCategory), newFabricsMap)
						if (merged.size > 0) {
							aggregatedFabrics.set(templateCategory, merged)
						}
					}
				} else if (!templateBlocks) {
					aggregatedBlocks.set(templateCategory, new Map() as CategoryBlocksMap)
				}
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
								selected-space=${() => (console.log('selected space', store.selectedSpace), store.selectedSpace)}
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
