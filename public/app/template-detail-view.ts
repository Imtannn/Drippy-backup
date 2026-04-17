import {css, Element, element, eventAttribute, html, signal, type ElementAttributes} from 'lume'
import '../elements/logic/show-when.js'
import type {BlockCategory} from '../types/block.js'
import type {Fabric} from '../types/fabric.js'
import type {Template} from '../types/template.js'
import {pushHistory} from './history.js'
import {store} from './store.js'
import {templateHelpers} from './TemplateHelpers.js'

type TemplateDetailViewAttributes = 'selectedTemplate' | 'onclose'

@element
export class TemplateDetailView extends Element {
	static override readonly elementName = 'template-detail-view'

	@signal selectedTemplate: Template | null = null
	@signal selectedSize: string = 'S'

	@eventAttribute override onclose: () => void = () => {}

	private readonly sizes = ['XS', 'S', 'M', 'L', 'XL']

	#onClose = () => {
		this.dispatchEvent(new CustomEvent('close', {bubbles: true}))
	}

	#onViewSite = () => {
		const url = this.selectedTemplate?.productUrl
		if (url) window.open(url, '_blank', 'noopener')
	}

	#getAvailableFabrics = (): Fabric[] => {
		if (!this.selectedTemplate) return []
		const {fabrics} = templateHelpers.isRemixAvailableForTemplate(this.selectedTemplate, {
			selectedGarments: store.selectedGarments,
			selectedSpace: store.getEffectiveSpace(),
			sourceCollection: store.getEffectiveCollection(),
		})

		const unique = new Map<string, Fabric>()
		for (const list of Object.values(fabrics)) {
			for (const fabric of list) {
				if (!fabric?._id || !fabric.thumb) continue
				if (!unique.has(fabric._id)) unique.set(fabric._id, fabric)
			}
		}
		return [...unique.values()]
	}

	#isFabricSelected = (fabric: Fabric) => {
		if (!this.selectedTemplate) return false
		const templateSelection = store.getTemplateSelection(this.selectedTemplate.category)
		if (!templateSelection) return false
		return Object.values(templateSelection).some(selection =>
			Object.values(selection.fabrics || {}).some(selectedFabric => selectedFabric?._id === fabric._id),
		)
	}

	#onFabricSelect = (fabric: Fabric) => {
		if (!this.selectedTemplate) return
		const templateSelection = store.getTemplateSelection(this.selectedTemplate.category)
		if (!templateSelection) return

		pushHistory()

		const blockCategories = Object.entries(templateSelection)
			.filter(([, selection]) => selection?.block)
			.map(([blockCategory]) => blockCategory as BlockCategory)

		store.setSelectedFabrics = blockCategories.map(blockCategory => ({
			fabric,
			blockCategory,
			templateCategory: this.selectedTemplate!.category,
			assignedMesh: fabric.assignedMesh || 'default',
		}))
	}

	override template = () => html`
		<div class="detail-view">
			<div class="top-bar">
				<span class="top-bar-title">${() => this.selectedTemplate?.name || 'Product'}</span>
				<button class="close-btn" onclick=${this.#onClose}>Close</button>
			</div>

			<div class="scrollable-content">
				<div class="photo-area">
					<div class="photo-scroll">
						<div class="photo-item"></div>
						<div class="photo-item"></div>
						<div class="photo-item"></div>
					</div>
					<div class="photo-dots" aria-hidden="true">
						<span class="photo-dot active"></span>
						<span class="photo-dot"></span>
						<span class="photo-dot"></span>
					</div>
				</div>

				<div class="section">
					<div class="section-row">
						<span class="section-label">Size</span>
						<span class="section-value">${() => this.selectedSize}</span>
					</div>
					<div class="pills-row">
						${this.sizes.map(
							size => html`
								<button
									class="size-pill"
									classList=${() => ({selected: this.selectedSize === size})}
									onclick=${() => (this.selectedSize = size)}
								>
									${size}
								</button>
							`,
						)}
					</div>
				</div>

				<div class="divider"></div>

				<div class="section">
					<div class="section-row">
						<span class="section-label">Fabric</span>
					</div>
					<div class="fabric-row">
						<for-each
							items=${this.#getAvailableFabrics}
							content=${() => (fabric: Fabric) => html`
								<button
									class="fabric-thumb"
									classList=${() => ({selected: this.#isFabricSelected(fabric)})}
									onclick=${() => this.#onFabricSelect(fabric)}
									title=${fabric.materialName}
								>
									<img src=${fabric.thumb} alt=${fabric.materialName} />
								</button>
							`}
						></for-each>
					</div>
				</div>

				<div class="divider"></div>

				<div class="section">
					<div class="text-section-label">Description</div>
					<div class="text-section-body">
						A striking garment with a sculpted silhouette and playful details. Features a deep V-neckline and
						elegantly pleated shoulder sleeves that create a voluminous, architectural upper body.
					</div>
				</div>

				<div class="divider"></div>

				<div class="section">
					<div class="text-section-label">Composition</div>
					<div class="text-section-body">100% Polyester. Lining: 100% Viscose. Dry clean only.</div>
				</div>
			</div>

			<div class="cta-area">
				<button class="view-site-btn" onclick=${this.#onViewSite}>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<circle cx="12" cy="12" r="9.5" stroke="white" stroke-width="1.5" />
						<path
							d="M12 2.5C12 2.5 8.5 7 8.5 12C8.5 17 12 21.5 12 21.5M12 2.5C12 2.5 15.5 7 15.5 12C15.5 17 12 21.5 12 21.5M2.5 12H21.5"
							stroke="white"
							stroke-width="1.5"
						/>
					</svg>
					View site
				</button>
			</div>
		</div>
	`

	override css = css /*css*/ `
		:host {
			display: block;
			height: 100%;
			color: #fff;
		}

		.detail-view {
			display: flex;
			flex-direction: column;
			height: 100%;
			background: rgba(18, 19, 22, 0.26);
			backdrop-filter: blur(12px) saturate(1.04);
			-webkit-backdrop-filter: blur(12px) saturate(1.04);
			border: 1px solid rgba(255, 255, 255, 0.16);
			border-radius: 0;
			overflow: hidden;
		}

		.top-bar {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 16px;
			flex-shrink: 0;
			background: rgba(255, 255, 255, 0.03);
			border-bottom: 1px solid rgba(255, 255, 255, 0.09);
		}

		.top-bar-title {
			font-size: 14px;
			font-weight: 600;
			color: rgba(255, 255, 255, 0.95);
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
			max-width: 70%;
		}

		.close-btn {
			background: none;
			border: none;
			cursor: pointer;
			font-size: 13px;
			color: rgba(255, 255, 255, 0.78);
			padding: 0;
			font-family: inherit;
			flex-shrink: 0;
		}

		.scrollable-content {
			flex: 1;
			overflow-y: auto;
			scrollbar-width: none;
		}

		.scrollable-content::-webkit-scrollbar {
			display: none;
		}

		.photo-area {
			height: 320px;
			margin: 12px 16px 0;
			border-radius: 12px;
			overflow: hidden;
			position: relative;
		}

		.photo-scroll {
			display: flex;
			height: 100%;
			overflow-x: auto;
			scroll-snap-type: x mandatory;
			-webkit-overflow-scrolling: touch;
			scrollbar-width: none;
			gap: 12px;
		}

		.photo-scroll::-webkit-scrollbar {
			display: none;
		}

		.photo-item {
			flex: 0 0 calc(100% - 8px);
			height: 100%;
			scroll-snap-align: start;
			border-radius: 12px;
			background: rgba(255, 255, 255, 0.08);
			border: 1px solid rgba(255, 255, 255, 0.14);
		}

		.photo-dots {
			position: absolute;
			left: 50%;
			bottom: 12px;
			transform: translateX(-50%);
			display: flex;
			justify-content: center;
			align-items: center;
			gap: 6px;
			padding: 6px 8px;
			border-radius: 999px;
			background: rgba(18, 19, 22, 0.28);
			backdrop-filter: blur(4px);
			-webkit-backdrop-filter: blur(4px);
			z-index: 2;
		}

		.photo-dot {
			width: 6px;
			height: 6px;
			border-radius: 999px;
			background: rgba(255, 255, 255, 0.36);
		}

		.photo-dot.active {
			background: rgba(255, 255, 255, 0.9);
		}

		.section {
			padding: 16px;
		}

		.divider {
			height: 1px;
			background: rgba(255, 255, 255, 0.08);
			margin: 0;
		}

		.section-row {
			display: flex;
			align-items: center;
			gap: 8px;
			margin-bottom: 12px;
		}

		.section-label {
			font-size: 12px;
			font-weight: 600;
			color: rgba(255, 255, 255, 0.92);
		}

		.section-value {
			font-size: 12px;
			font-weight: 400;
			color: rgba(255, 255, 255, 0.62);
		}

		.pills-row {
			display: flex;
			gap: 8px;
			flex-wrap: wrap;
		}

		.size-pill {
			min-width: 48px;
			height: 30px;
			border-radius: 999px;
			border: 1px solid rgba(255, 255, 255, 0.22);
			padding: 0 12px;
			font-size: 11px;
			background: rgba(255, 255, 255, 0.08);
			color: rgba(255, 255, 255, 0.92);
			cursor: pointer;
			font-family: inherit;
			transition: all 0.15s ease;
			display: flex;
			align-items: center;
			justify-content: center;
			flex-shrink: 0;
		}

		.size-pill.selected {
			background: #000;
			color: white;
			border-color: rgba(255, 255, 255, 0.22);
			box-shadow: none;
		}

		.fabric-row {
			display: flex;
			gap: 10px;
			flex-wrap: wrap;
		}

		.fabric-thumb {
			width: 38px;
			height: 38px;
			border-radius: 10px;
			border: 1px solid transparent;
			background: transparent;
			cursor: pointer;
			padding: 0;
			overflow: hidden;
		}

		.fabric-thumb img {
			width: 100%;
			height: 100%;
			object-fit: cover;
			display: block;
		}

		.fabric-thumb.selected {
			border-color: #fff;
			box-shadow: 0 0 0 2px rgba(178, 138, 255, 0.7);
		}

		.text-section-label {
			font-size: 13px;
			font-weight: 600;
			color: rgba(255, 255, 255, 0.95);
			margin-bottom: 8px;
		}

		.text-section-body {
			font-size: 12px;
			font-weight: 400;
			color: rgba(255, 255, 255, 0.72);
			line-height: 1.6;
		}

		.cta-area {
			position: sticky;
			bottom: 0;
			background: rgba(18, 19, 22, 0.3);
			backdrop-filter: blur(8px);
			-webkit-backdrop-filter: blur(8px);
			padding: 12px 16px 16px;
			flex-shrink: 0;
		}

		.view-site-btn {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 8px;
			width: 100%;
			height: 48px;
			background: rgba(255, 255, 255, 0.12);
			color: white;
			border: 1px solid rgba(255, 255, 255, 0.22);
			border-radius: 12px;
			font-size: 14px;
			font-weight: 600;
			cursor: pointer;
			font-family: inherit;
			transition: opacity 0.15s ease;
		}

		.view-site-btn:hover {
			opacity: 0.9;
		}
	`
}

declare global {
	interface HTMLElementTagNameMap {
		'template-detail-view': TemplateDetailView
	}
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			'template-detail-view': ElementAttributes<TemplateDetailView, TemplateDetailViewAttributes>
		}
	}
}
