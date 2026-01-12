import {batch, css, Element, element, html, signal, type ElementAttributes} from 'lume'
import type {Accessor} from 'solid-js'
import {spaces} from '../consts/spaces.js'
import {templates} from '../consts/templates.js'
import {pushState, searchParams} from '../routes.js'
import type {Template, TemplateCategory} from '../types/template.js'
import type {TemplateMap} from '../types/types.js'
import {store, updateGarmentsSelectionInUrl} from './store.js'
import {templateHelpers} from './template-helpers.js'

import '../elements/avatar-dropdown.js'
import '../elements/dialog-element.js'
import '../elements/logic/index-each.js'
import '../elements/logic/show-when.js'
import '../elements/login-ui.js'
import '../elements/tabs.js'
import './item-card.js'
import './loading-spinner-overlay.js'
import './spaces-selection.js'
import './template-item-overlay.js'
import {formatNumber} from '../utils.js'

type BrandViewAttributes = keyof object // no attributes yet

@element
export class BrandView extends Element {
	static override readonly elementName = 'brand-view'

	@signal selectedTab: TemplateCategory | null = null
	@signal showLoginDialog = false
	@signal showTemplateOverlay: Template | null = null

	private isOpeningOverlay = false
	override connectedCallback() {
		super.connectedCallback()
		document.addEventListener('click', this.#onDocumentClick)

		// Update URL when garments selection changes
		this.createEffect(() => {
			updateGarmentsSelectionInUrl(store.selectedGarments)
		})
	}
	override disconnectedCallback() {
		super.disconnectedCallback()
		document.removeEventListener('click', this.#onDocumentClick)
		// Clear brand param from URL and reset view when component is unmounted
		if (searchParams().get('brand')) {
			searchParams().delete('brand')
			pushState()
		}
	}

	#onItemClick = async (e: CustomEvent) => {
		const template = e.detail.itemValue as Template

		store.setLoadingTemplate(template._id, template.category)

		// Brand-view only displays when brand param exists, so we always navigate
		const brandParam = searchParams().get('brand')
		if (brandParam) {
			const space = spaces.find(s => s.collections.includes(brandParam))
			if (space) {
				// Remove brand parameter and set scene parameter in URL
				searchParams().delete('brand')
				searchParams().set('space', space.slug)

				// Ensure avatar parameter is set
				if (!searchParams().get('avatar')) searchParams().set('avatar', store.selectedAvatar)

				// Set space in store if not already set
				if (!store.selectedSpace) store.selectSpace = space

				// Navigate to template view
				store.view = 'template'
				pushState()
			}
		}

		this.#selectTemplate(template)
	}

	#selectTemplate = (template: Template) => {
		const effectiveSpace = store.getEffectiveSpace()
		if (!effectiveSpace) return

		const newTemplates: TemplateMap = {...store.selectedTemplates}
		let nextSelection = templateHelpers.cloneSelectedGarments(store.selectedGarments)

		// check if the template with same category already exists
		const overridingCategories = templateHelpers.checkOverridingCategories(
			template.category,
			store.selectedTemplates,
		) as TemplateCategory[]

		if (overridingCategories.length > 0) {
			nextSelection = templateHelpers.omitTemplateCategories(nextSelection, overridingCategories)
			for (const category of overridingCategories)
				if (category in store.selectedTemplates) delete newTemplates[category]
		}

		newTemplates[template.category] = template
		const effectiveCollection = store.getEffectiveCollection()
		const templateBlockData = templateHelpers.convertTemplateToBlockData(template, effectiveCollection)
		const {newBlocksMap, newFabricsMap} = templateHelpers.getBlocksAndFabricsMapFromTemplateData(
			templateBlockData,
			effectiveCollection,
		)
		const templateSelection = templateHelpers.buildTemplateSelectionFromMaps(newBlocksMap, newFabricsMap)
		nextSelection = templateHelpers.withTemplateSelection(nextSelection, template.category, templateSelection)

		batch(() => {
			store.selectedGarments = nextSelection
			store.selectedTemplates = newTemplates
		})

		// Immediately update URL parameters after selecting template
		updateGarmentsSelectionInUrl(store.selectedGarments)
	}

	#onTemplateOverlayClose = () => {
		batch(() => {
			this.showTemplateOverlay = null
			this.isOpeningOverlay = false
		})
	}

	#handleTemplateOverlayRemix = (template: Template) => {
		batch(() => {
			this.showTemplateOverlay = null
			this.isOpeningOverlay = false
			store.setRemixOverlayTemplate = template
			// Navigate to template view to show remix overlay
			const brandParam = searchParams().get('brand')
			if (brandParam) {
				const space = spaces.find(s => s.collections.includes(brandParam))
				if (space) {
					searchParams().delete('brand')
					searchParams().set('space', space.slug)
					store.selectSpace = space
					store.view = 'template'
					pushState()
				}
			}
		})
	}

	#onTemplateOverlayRemix = (e: CustomEvent) => {
		const template = e.detail.template
		this.#handleTemplateOverlayRemix(template)
	}

	#onDocumentClick = (e: Event) => {
		if (this.isOpeningOverlay) return

		if (
			this.showTemplateOverlay &&
			!e.composedPath().some(el => el instanceof Element && el.tagName === 'TEMPLATE-ITEM-OVERLAY')
		)
			this.showTemplateOverlay = null
	}

	#isTemplateActive = (template: Template) => {
		return store.selectedTemplates[template.category]?._id === template._id
	}
	override template = () => html`
		<div class="brand-container">
			<!-- Navigation -->

			<!-- Main Title and Description -->

			${() => {
				const brandParam = searchParams().get('brand')
				const space = spaces.find(space => space.collections.includes(brandParam || ''))

				if (!brandParam) return null

				if (!space) return null

				return html`
					<div class="header">
						<div class="brand-logo">
							<img src=${space.logo} alt=${space.name} />
						</div>
						<h1 class="main-title brand">${space.description}</h1>
						<p class="description brand">${space.collections[0]}@paris</p>
						<p class="sub-description brand">
							Welcome to the enchanting world of the <strong>${space.collections[0]}</strong> , where high fashion meets
							artistic innovation. <strong>Read more</strong>
						</p>
					</div>
				`
			}}

			<!-- Tabs and Content -->
			<tabs-provider
				default-value="Spaces"
				ontabchange=${(e: CustomEvent) => {
					this.selectedTab = e.detail.value
				}}
			>
				<tabs-list>
					<tabs-trigger selected-value="Spaces">Spaces</tabs-trigger>
					<tabs-trigger selected-value="Items">Items</tabs-trigger>
				</tabs-list>

				<tabs-content selected-value="Spaces">
					<!-- Space Cards -->
					<spaces-selection></spaces-selection>
				</tabs-content>

				<tabs-content selected-value="Items">
					${() => {
						const brandParam = searchParams().get('brand')
						const collection = brandParam || store.selectedSpace?.collections[0] || 'gap'
						const collectionTemplates = (templates as any)[collection] || []

						// Apply same ordering logic as template-view
						const defaultCategories: TemplateCategory[] = [
							'Dress',
							'Shirt',
							'Top',
							'Jacket',
							'Skirt',
							'Pants',
							'Jumpsuit',
						]
						const orderedTemplates: Template[] = []

						for (const category of defaultCategories) {
							const templatesForCategory = collectionTemplates.filter(
								(template: Template) => template.category === category,
							)
							if (templatesForCategory.length > 0) orderedTemplates.push(...templatesForCategory)
						}

						const accessoryTemplates = collectionTemplates.filter(
							(template: Template) => !defaultCategories.includes(template.category as TemplateCategory),
						)

						if (accessoryTemplates.length > 0) orderedTemplates.push(...accessoryTemplates)

						return html`
							<div class="items-grid">
								<index-each
									items=${() => orderedTemplates}
									content=${() => (template: Accessor<Template>) => html`
										<div class="template-item">
											<div class="template-item-container">
												<item-card
													item-active=${() => this.#isTemplateActive(template())}
													item-src=${template().thumb}
													item-alt=${template().name}
													item-value=${template()}
													oncardselected=${this.#onItemClick}
													object-fit="contain"
													object-position="center"
													aspect-ratio="0.79"
												></item-card>
												<show-when
													condition=${() =>
														this.showTemplateOverlay?._id === template()._id &&
														!store.isTemplateLoading(template()._id)}
													content=${() => html`
														<template-item-overlay
															selected-template=${() => template()}
															onclose=${this.#onTemplateOverlayClose}
															onremix=${this.#onTemplateOverlayRemix}
														></template-item-overlay>
													`}
												></show-when>
												<show-when
													condition=${() => store.isTemplateLoading(template()._id)}
													content=${() => html` <loading-spinner-overlay></loading-spinner-overlay> `}
												></show-when>
											</div>
											<div class="template-product-name">${template().name}</div>
											<div
												class="template-product-price-container"
												classList=${() => ({viewOnly: store.selectedSpace?.viewOnly})}
											>
												<div
													class="template-product-price"
													classList=${() => ({wholesale: store.selectedSpace?.isWholesale})}
												>
													${() => {
														const price = template().price
														if (!price || price === 'N/A') return 'N/A'

														const numericPrice = Number(price)
														return Number.isFinite(numericPrice) ? formatNumber(numericPrice) : price
													}}
												</div>
												<show-when
													condition=${() => store.selectedSpace?.isWholesale}
													content=${() => html`<div class="template-product-wholesale">MOQ: 5pcs</div>`}
												></show-when>
											</div>
										</div>
									`}
								></index-each>
							</div>
						`
					}}
				</tabs-content>
			</tabs-provider>

			<dialog-element
				open=${() => this.showLoginDialog}
				onclose=${() => {
					this.showLoginDialog = false
				}}
			>
				<div style="display: flex; justify-content: center; align-items: flex-start; width: 100%; height: 100%;">
					<login-ui expanded style="position: relative;"></login-ui>
				</div>
				<style>
					login-ui {
						display: contents;
					}
				</style>
			</dialog-element>
		</div>
	`
	override css = css /*css*/ `
		:host {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: white;
			z-index: 100;
			opacity: 0;
			animation: fadeIn 0.3s ease-out forwards;
			overflow-y: auto;

			:host-context([data-theme='dark']) {
				background: #1a1a1a;
			}
		}

		@keyframes fadeIn {
			from {
				opacity: 0;
				transform: translateY(10px);
			}
			to {
				opacity: 1;
				transform: translateY(0);
			}
		}

		@keyframes fadeOut {
			from {
				opacity: 1;
				transform: translateY(0);
			}
			to {
				opacity: 0;
				transform: translateY(10px);
			}
		}

		:host(.fade-out) {
			animation: fadeOut 0.3s ease-out forwards;
		}

		/* SpacesPage-specific styles */
		.brand-container {
			background: var(--uiColorPrimaryWhite);
			min-height: 100vh;

			:host-context([data-theme='dark']) & {
				background: #1a1a1a;
			}
		}

		.navigation {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 2rem;
			padding-top: var(--uiSpacing);
		}

		.avatar-link {
			text-decoration: none;
		}

		.nav-links {
			display: flex;
			align-items: center;
			gap: 0.5rem;
		}

		.learn-more-link,
		.sign-in-button {
			font-size: var(--fontSizeTextXs);
			padding: 0.5rem 1rem;
			border-radius: var(--borderRadiusPill);
			cursor: pointer;
			font-weight: var(--fontWeightNormal);
			white-space: nowrap;
			text-decoration: none;
			display: inline-block;
			box-sizing: border-box;
			line-height: 1;
			vertical-align: middle;
		}

		.learn-more-link {
			background: var(--uiColorPrimaryLightGrey);
			border: 1px solid var(--uiColorPrimaryLightGrey);
			color: var(--uiColorPrimaryBlack);

			&:hover {
				background: var(--uiColorLightGrey);

				:host-context([data-theme='dark']) & {
					background: #333;
				}
			}
		}

		.sign-in-button {
			background: var(--uiColorPrimaryBlack);
			border: 2px solid var(--uiColorPrimaryBlack);
			color: var(--uiColorPrimaryWhite);

			&:hover {
				background: var(--uiColorLightGrey);
				color: var(--uiColorPrimaryBlack);

				:host-context([data-theme='dark']) & {
					background: #333;
					color: var(--uiColorPrimaryWhite);
				}
			}
		}

		.header {
			text-align: center;
			margin: 30px 15px 15px 15px;
		}

		.brand-logo {
			width: 58px;
			height: 58px;
			margin: 0 auto;
		}

		.brand-logo img {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}

		.main-title {
			font-size: 28px;
			font-weight: var(--fontWeightSemiBold);
			color: var(--uiColorPrimaryBlack);
			margin-bottom: 1rem;

			:host-context([data-theme='dark']) & {
				color: var(--uiColorPrimaryWhite);
			}
		}

		.main-title.brand {
			font-size: 24px;
			margin-bottom: 0rem;
			margin-top: 0.2rem;
		}

		.description {
			font-size: var(--fontSizeTextXs);
			font-weight: var(--fontWeightNormal);
			line-height: var(--lineHeightLoose);
			margin: 0 auto;

			:host-context([data-theme='dark']) & {
				color: #ccc;
			}
		}

		.description.brand {
			margin-bottom: 15px;
			margin-top: -4px;
		}

		.sub-description {
			font-size: var(--fontSizeTextXs);
			font-weight: var(--fontWeightNormal);
			line-height: var(--lineHeightLoose);
			margin: 0 auto;
			padding: 0 15px;
			:host-context([data-theme='dark']) & {
				color: #ccc;
			}
		}

		/* Center tabs without modifying tabs component */

		tabs-provider {
			display: flex;
			flex-direction: column;
			align-items: center;
			margin-top: 1rem;
		}

		/* Force tabs-list to be centered by overriding its width */
		tabs-provider tabs-list {
			width: auto !important;
			max-width: fit-content !important;
			margin: 0 auto !important;
		}
		tabs-provider .tab {
			padding: 10px 16px !important;
		}

		/* Ensure tabs-content containers are also centered */
		tabs-provider tabs-content {
			width: 100%;
			display: flex;
			justify-content: center;
			margin-top: 1rem;
		}

		.items-grid {
			display: grid;
			grid-template-columns: repeat(2, 1fr);
			gap: var(--gridGapMobile);
			max-width: var(--breakpointLargeDesktop);
			margin: 0 auto;
			padding: 0 15px;
		}

		@media (min-width: 768px) {
			.items-grid {
				grid-template-columns: repeat(4, 1fr);
				gap: var(--gridGapTablet);
			}
			.sub-description {
				font-size: var(--fontSizeTextXs);
			}
		}

		@media (min-width: 1024px) {
			.items-grid {
				grid-template-columns: repeat(6, 1fr);
				gap: var(--gridGapDesktop);
			}
		}

		.template-item {
			min-width: 0;
			width: 100%;
			display: flex;
			flex-direction: column;
			gap: var(--uiSpacingTiny);
			position: relative;
		}

		.template-item-container {
			position: relative;
			width: 100%;
			aspect-ratio: 0.79;
			border-radius: var(--borderRadiusLarge);
			overflow: hidden;
		}

		.template-product-name {
			font-size: var(--fontSizeTextXs);
			font-weight: var(--fontWeightSemiBold);
			color: var(--uiColorPrimaryBlack);
			text-align: start;
			margin: 0;

			:host-context([data-theme='dark']) & {
				color: var(--uiColorPrimaryWhite);
			}
		}

		.template-product-price-container {
			display: flex;
			flex-direction: column;
			align-items: start;
			gap: 2px;
		}

		.template-product-price {
			font-size: var(--fontSizeTextXxs);
			font-weight: var(--fontWeightSemiBold);
			color: var(--uiColorPrimaryBlack);
			display: flex;
			justify-content: start;
			align-items: center;

			:host-context([data-theme='dark']) & {
				color: #ccc;
			}

			&.wholesale {
				color: var(--uiColorPrimaryBlack);
				font-weight: var(--fontWeightSemiBold);

				:host-context([data-theme='dark']) & {
					color: var(--uiColorPrimaryWhite);
				}
			}
		}

		.template-product-price img {
			margin-right: 6px;
			width: 12px;
			height: 9.5px;
		}

		.template-product-wholesale {
			font-size: 10px;
			color: #999;
			text-align: center;

			:host-context([data-theme='dark']) & {
				color: #777;
			}
		}

		/* Override spaces-container from spaces-selection component */
		spaces-selection .spaces-container {
		}

		/* Mobile responsive */
		@media (max-width: 768px) {
			.description {
				padding: 0 1rem;
			}
		}
	`
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			[BrandView.elementName]: ElementAttributes<BrandView, BrandViewAttributes>
		}
	}
}

declare global {
	interface HTMLElementTagNameMap {
		[BrandView.elementName]: BrandView
	}
}
