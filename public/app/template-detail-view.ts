import {css, Element, element, eventAttribute, html, signal, type ElementAttributes} from 'lume'
import {fabrics} from '../consts/fabrics.js'
import '../elements/logic/show-when.js'
import '../elements/tabs.js'
import type {Template} from '../types/template.js'
import {store} from './store.js'

type TemplateDetailViewAttributes = 'selectedTemplate' | 'onclose'

@element
export class TemplateDetailView extends Element {
	static override readonly elementName = 'template-detail-view'

	@signal selectedTemplate: Template | null = null
	@signal activeTab: string = 'details'

	@eventAttribute override onclose: () => void = () => {}

	// Sample detail images
	private detailImages = ['/images/img-detail-1.jpg', '/images/img-detail-2.jpg', '/images/img-detail-3.jpg']

	private getFabricNames = () => {
		if (!this.selectedTemplate) return 'N/A'

		const materialId = this.selectedTemplate.materialId
		if (!materialId) return 'N/A'

		const collection = store.getEffectiveCollection()
		if (!collection) return 'N/A'

		const collectionFabrics = fabrics[collection]
		if (!collectionFabrics) return 'N/A'

		const fabric = collectionFabrics.find(f => f._id === materialId)

		return fabric?.materialName || 'N/A'
	}
	override template = () => html`
		<div class="detail-view">
			<div class="images-container">
				<div class="images-scroll">
					${this.detailImages.map(
						img => html`
							<div class="image-item">
								<img src=${img} alt="Product detail" />
							</div>
						`,
					)}
				</div>
			</div>

			<div class="product-info">
				<div class="product-header">
					<h2 class="product-name">${() => this.selectedTemplate?.name || ''}</h2>
					<div class="product-price">~€ ${() => this.selectedTemplate?.price || '125.00'}</div>
				</div>

				<tabs-provider
					default-value=${() => this.activeTab}
					ontabchange=${(e: CustomEvent) => (this.activeTab = e.detail.value)}
				>
					<div class="tabs-container">
						<tabs-list>
							<tabs-trigger selected-value="details">Details</tabs-trigger>
							<tabs-trigger selected-value="sizing">Sizing</tabs-trigger>
							<tabs-trigger selected-value="shipping">Shipping & returns</tabs-trigger>
							<tabs-trigger selected-value="reviews">Reviews (13)</tabs-trigger>
						</tabs-list>
					</div>

					<tabs-content selected-value="details">
						<div class="tab-content">
							<p class="product-description">
								<strong>${() => this.selectedTemplate?.name}</strong> is a striking garment with a sculpted silhouette
								and playful details. It features a deep V-neckline and elegantly pleated shoulder sleeves that create a
								voluminous and architectural upper body. <span class="read-more">Read more</span>
							</p>

							<div class="product-specs">
								<div class="spec-item">
									<div class="spec-label">Model size</div>
									<div class="spec-value">XS (34)</div>
								</div>
								<div class="spec-item">
									<div class="spec-label">Country of manufacture</div>
									<div class="spec-value">France</div>
								</div>
								<div class="spec-item">
									<div class="spec-label">Materials & fabrics</div>
									<div class="spec-value">${this.getFabricNames}</div>
								</div>
							</div>
						</div>
					</tabs-content>

					<tabs-content selected-value="sizing">
						<div class="tab-content">
							<p>Size chart and fitting information will be displayed here.</p>
						</div>
					</tabs-content>

					<tabs-content selected-value="shipping">
						<div class="tab-content">
							<p>Shipping and return policy information will be displayed here.</p>
						</div>
					</tabs-content>

					<tabs-content selected-value="reviews">
						<div class="tab-content">
							<p>Customer reviews will be displayed here.</p>
						</div>
					</tabs-content>
				</tabs-provider>
			</div>

			<button
				class="done-button"
				onclick=${() => {
					this.dispatchEvent(new CustomEvent('close', {bubbles: true}))
				}}
			>
				Done
			</button>
		</div>
	`
	override css = css/*css*/ `
		:host {
			display: block;
			height: 100%;
		}

		.detail-view {
			display: flex;
			flex-direction: column;
			height: 100%;
			background: var(--uiColorPrimaryWhite);
		}

		.images-container {
			width: 100%;
			overflow: hidden;
			padding: var(--uiSpacing);
		}

		.images-scroll {
			display: flex;
			gap: var(--uiSpacingSmall);
			overflow-x: auto;
			scroll-snap-type: x mandatory;
			-webkit-overflow-scrolling: touch;
			scrollbar-width: none;
		}

		.images-scroll::-webkit-scrollbar {
			display: none;
		}

		.image-item {
			flex: 0 0 50%;
			scroll-snap-align: start;
			background: var(--uiColorPrimaryWhite);
			border-radius: var(--borderRadiusMedium);
			overflow: hidden;
		}

		.image-item img {
			width: 100%;
			height: 100%;
			min-height: 250px;
			max-height: 500px;
			object-fit: cover;
			display: block;
		}

		.product-info {
			flex: 1;
			overflow-y: auto;
			padding: var(--uiSpacing);
			padding-top: 0;
		}

		.product-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: var(--uiSpacingMedium);
		}

		.product-name {
			font-size: var(--fontSizeTextXs);
			font-weight: var(--fontWeightSemiBold);
			color: var(--uiColorPrimaryBlack);
			gap: 0;
		}

		.product-price {
			font-size: var(--fontSizeTextXs);
			color: #424347;
		}

		.tabs-container {
			gap: var(--uiSpacingMedium);
		}

		.tab-content {
			padding: var(--uiSpacingSmall) 0;
		}

		.product-description {
			font-size: var(--fontSizeTextXs);
			line-height: 1.6;
			color: #424347;
			margin: 0 0 var(--uiSpacingMedium) 0;
		}

		.read-more {
			color: var(--uiColorAccentViolet);
			cursor: pointer;
			font-weight: var(--fontWeightSemiBold);
		}

		.product-specs {
			display: flex;
			flex-direction: column;
			gap: var(--uiSpacingMedium);
		}

		.spec-item {
			display: flex;
			flex-direction: column;
			gap: var(--uiSpacingTiny);
		}

		.spec-label {
			font-size: var(--fontSizeTextXs);
			color: #8c8c8c;
		}

		.spec-value {
			font-size: var(--fontSizeTextXs);
			font-weight: var(--fontWeightSemiBold);
			color: var(--uiColorPrimaryBlack);
		}

		.done-button {
			width: calc(100% - var(--uiSpacing) * 2);
			margin: var(--uiSpacingSmall) var(--uiSpacing);
			padding: var(--uiSpacingSmall);
			background: var(--uiColorPrimaryBlack);
			color: var(--uiColorPrimaryWhite);
			border: none;
			border-radius: var(--borderRadiusPill);
			font-size: var(--fontSizeTextSm);
			font-weight: var(--fontWeightSemiBold);
			cursor: pointer;
			transition: var(--transitionFast);
		}

		.done-button:hover {
			opacity: 0.8;
		}

		@media (min-width: 768px) {
			.image-item {
				flex: 0 0 40%;
			}
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
