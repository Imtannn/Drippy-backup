import {batch, css, Element, element, html, signal} from 'lume'
import type {Accessor} from 'solid-js'
import {spaces} from '../consts/spaces.js'
import '../elements/avatar-dropdown.js'
import '../elements/placeholder-image.js'
import {pushState, searchParams} from '../routes.js'
import type {Space} from '../types/types.js'
import {currentUser, isLoggedIn, store} from './store.js'

import '../elements/dialog-element.js'
import '../elements/heart-button.js'
import '../elements/logic/index-each.js'
import '../elements/logic/show-when.js'
import '../elements/login-ui.js'
import './item-card.js'
import {getSpaceThumbnail} from '../utils.js'

@element
export class SpacesSelection extends Element {
	static override readonly elementName = 'spaces-selection'

	@signal filteredSpace: Space[] = []
	@signal showLoginDialog = false

	override connectedCallback() {
		super.connectedCallback()

		this.createEffect(() => {
			const brandParam = searchParams().get('brand')
			if (brandParam) this.classList.add('has-brand')
			else this.classList.remove('has-brand')
		})

		// Show all spaces regardless of gender
		this.createEffect(() => {
			let filteredSpaces = spaces().filter(space => !space.isHidden)

			// Filter by brand if brand query parameter exists
			const brandParam = searchParams().get('brand')
			if (brandParam) filteredSpaces = filteredSpaces.filter((space: Space) => space.collections.includes(brandParam))

			this.filteredSpace = filteredSpaces
		})

		// Close login dialog when user successfully logs in
		this.createEffect(() => {
			// FIXME: STOP making duplicate auth code. See the duplication in template-view.ts
			if (isLoggedIn(currentUser()) && this.showLoginDialog) this.showLoginDialog = false
		})

	}

	fadeOut(callback?: () => void) {
		this.classList.add('fade-out')
		setTimeout(() => {
			callback?.()
		}, 300) // Match animation duration
	}

	#onSpaceSelected = (space: Space) => {
		searchParams().set('space', space.slug)

		batch(() => {
			pushState()
			store.selectSpace = space
			store.view = 'template'
		})
	}

	#onSignInClick = () => {
		this.showLoginDialog = true
	}

	#onAvatarClick = (e: Event) => {
		e.preventDefault()
		store.view = 'avatar'
	}

	#onBrandViewClick = (brand: string) => {
		console.log('onBrandViewClick', brand)
		const params = searchParams()
		// Clear all existing params first
		const paramKeys = Array.from(params.keys())
		paramKeys.forEach(key => params.delete(key))
		// Set only brand param
		params.set('brand', brand)
		pushState()
	}

	override template = () => html`
		<div class="spaces-container">
			<!-- Navigation -->
			<show-when
				condition=${() => !searchParams().has('brand')}
				content=${() => html`
					<div class="navigation">
						<a href="#" class="avatar-link" onclick=${this.#onAvatarClick}>
							<avatar-dropdown hide-chevron></avatar-dropdown>
						</a>
						<div class="nav-links">
							<a href="/brand-experiences" class="learn-more-link">Learn more</a>
							${() => {
								return isLoggedIn(currentUser())
									? html`<login-ui></login-ui>`
									: html`<button class="sign-in-button" onclick=${this.#onSignInClick}>Sign in</button>`
							}}
						</div>
					</div>
				`}
			></show-when>

			<!-- Space Cards -->
			<show-when
				condition=${() => !searchParams().has('brand')}
				content=${() => html` <p class="featured-collections-title">Featured collections</p> `}
			></show-when>

			<div class="cards-container">
				<index-each
					items=${() => this.filteredSpace}
					content=${() => (space: Accessor<Space>) => html`
						<!-- Bloom Realm Card -->
						<!-- FIXME: avoid duplicate code with the space card below -->
						<div class="space-card">
							<div class="scene-preview">
								<div class="scene-placeholder" onclick=${() => this.#onSpaceSelected(space())}>
									<placeholder-image src=${getSpaceThumbnail(space())} alt=${space().name} object-fit="cover" />
								</div>
							</div>
							<div class="card-content">
								<div class="text-content">
									<h3 class="card-title">${space().name}</h3>
									<p class="card-subtitle" onclick=${() => this.#onBrandViewClick(space().collections[0])}>
										${space().description}
									</p>
								</div>
								<button class="explore-button" onclick=${() => this.#onSpaceSelected(space())}>Explore →</button>
							</div>
						</div>
					`}
				></index-each>

				<show-when
					condition=${() => this.filteredSpace.length === 0}
					content=${() => html`
						<div class="no-spaces-container">
							<p class="no-spaces-text">Spaces for this avatar are coming soon!</p>
							<button class="no-spaces-button" onclick=${() => (store.view = 'avatar')}>Select avatar →</button>
						</div>
					`}
				></show-when>
			</div>
		</div>

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
	`
	override css = css /*css*/ `
		:host {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: white;
			z-index: 1000;
			opacity: 0;
			animation: fadeIn 0.3s ease-out forwards;
			overflow-y: auto;
		}

		:host(.has-brand) {
			position: unset;
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

		.no-spaces-container {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			height: 100%;
			width: 250px;
			margin: auto;
			gap: var(--uiGap);
		}

		.no-spaces-text {
			font-size: var(--fontSizeTextMd);
			font-weight: var(--fontWeightNormal);
			color: var(--uiColorSecondaryLightGrey);
			text-align: center;
			margin: 0;
		}

		.no-spaces-button {
			font-size: var(--fontSizeTextXs);
			padding: 0.5rem 1rem;
			background: var(--uiColorPrimaryBlack);
			border: 2px solid var(--uiColorPrimaryBlack);
			border-radius: var(--borderRadiusPill);
			cursor: pointer;
			font-weight: var(--fontWeightSemiBold);
			color: var(--uiColorPrimaryWhite);
			white-space: nowrap;

			:host-context([data-theme='dark']) & {
				background: #333;
				border-color: var(--uiColorPrimaryWhite);
				color: var(--uiColorPrimaryWhite);
			}
		}

		/* SpacesPage-specific styles */
		.spaces-container {
			padding: var(--uiSpacing);
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
			border: 1px solid var(--uiColorPrimaryBlack);
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

		.cards-container {
			display: grid;
			grid-template-columns: 1fr;
			gap: var(--gridGapMobile);
			max-width: var(--breakpointLargeDesktop);
			margin: 0 auto;
		}

		/* Desktop: 3 columns */
		@media (min-width: 1024px) {
			.cards-container {
				grid-template-columns: repeat(3, 1fr);
				gap: var(--gridGapDesktop);
			}
		}

		/* Tablet: 2 columns */
		@media (min-width: 768px) and (max-width: 1023px) {
			.cards-container {
				grid-template-columns: repeat(2, 1fr);
				gap: var(--gridGapTablet);
			}
		}

		.featured-collections-title {
			font-size: var(--fontSizeTextMdTablet);
			font-weight: 700;
			color: var(--uiColorPrimaryBlack);
			margin-bottom: 1rem;
			font-family: 'Anton', sans-serif;
			text-transform: uppercase;
			line-height: 0.98;
			text-shadow: none;
			-webkit-text-stroke: 0;
			font-synthesis: none;
		}

		.space-card {
			position: relative;
			background: var(--uiColorPrimaryWhite);
			border-radius: var(--borderRadiusLarge);
			overflow: hidden;
			width: 100%;

			:host-context([data-theme='dark']) & {
				background: #333;
			}
		}

		.scene-preview {
			position: relative;
			width: 100%;
			height: var(--cardHeightMobile);
			overflow: hidden;
		}

		.scene-preview::after {
			content: '';
			position: absolute;
			inset: 0;
			background: linear-gradient(to top, rgba(0, 0, 0, 0.82) 0%, rgba(0, 0, 0, 0.42) 45%, rgba(0, 0, 0, 0.18) 100%);
			pointer-events: none;
			opacity: 0;
			transition: opacity 0.2s ease;
		}

		.space-card:hover .scene-preview::after,
		.space-card:focus-within .scene-preview::after {
			opacity: 1;
		}

		.scene-placeholder {
			width: 100%;
			height: 100%;
			display: flex;
			align-items: center;
			justify-content: center;
			overflow: hidden;
			border-radius: var(--borderRadiusLarge);
			cursor: pointer;

			img {
				object-fit: cover;
				object-position: center;
			}
		}

		.scene-placeholder img {
			width: 100%;
			height: 100%;
			object-fit: cover;
			object-position: center;
			border-radius: var(--borderRadiusLarge);
			cursor: pointer;
		}

		.card-content {
			position: absolute;
			left: 20px;
			right: 20px;
			bottom: 20px;
			display: flex;
			justify-content: space-between;
			align-items: flex-end;
			gap: 1rem;
			z-index: 2;
			opacity: 0;
			transform: translateY(8px);
			pointer-events: none;
			transition:
				opacity 0.2s ease,
				transform 0.2s ease;
		}

		.space-card:hover .card-content,
		.space-card:focus-within .card-content {
			opacity: 1;
			transform: translateY(0);
			pointer-events: auto;
		}
		.card-content_block {
			padding-top: 15px;
			padding-left: 0;
			padding-right: 0;
			display: flex;
			justify-content: space-between;
			align-items: center;
		}

		.text-content {
			flex: 1;
			margin-right: 1rem;
		}

		.card-title {
			font-size: var(--fontSizeTextXsTablet);
			font-weight: 700;
			color: var(--uiColorPrimaryWhite);
			margin: 0;
			font-family: 'Anton', sans-serif;
			text-transform: uppercase;
			line-height: 0.98;
			text-shadow: none;
			-webkit-text-stroke: 0;
			font-synthesis: none;
		}
		.card-title_block {
			font-size: var(--fontSizeTextXsTablet);
			font-weight: var(--fontWeightSemiBold);
			color: var(--uiColorPrimaryBlack);
			margin: 0;

			:host-context([data-theme='dark']) & {
				color: var(--uiColorPrimaryBlack);
			}
		}

		.card-subtitle {
			font-size: var(--fontSizeTextXs);
			font-weight: 300;
			color: rgba(255, 255, 255, 0.92);
			text-decoration: none;
			margin: 0;
			display: block;
			cursor: pointer;
			font-family: 'Poppins', sans-serif;
			text-transform: none;
			line-height: 1.2;
			text-shadow: none;
			-webkit-text-stroke: 0;
			font-synthesis: none;
		}

		.explore-button {
			font-size: var(--fontSizeTextXs);
			padding: 0.7rem 1.7rem;
			background: #0d1322;
			border: 1px solid rgba(255, 255, 255, 0.12);
			border-radius: var(--borderRadiusPill);
			cursor: pointer;
			font-weight: var(--fontWeightSemiBold);
			color: var(--uiColorPrimaryWhite);
			white-space: nowrap;

			:host-context([data-theme='dark']) & {
				background: #333;
				border-color: var(--uiColorPrimaryWhite);
				color: var(--uiColorPrimaryWhite);
			}
		}

		.content-icons {
			display: flex;
			gap: 11px;
		}
		.content-icons .item {
			font-size: var(--fontSizeTextXs);
			color: #bbbbbb;
		}
		.content-icons .item img {
			margin-right: 5px;
		}

		/* Large screen scaling */
		@media (min-width: 1200px) {
			.scene-preview {
				height: var(--cardHeightLarge);
			}
		}

		/* Mobile responsive */
		@media (max-width: 768px) {
			.navigation {
				padding: 0 1rem;
				margin-bottom: 1.5rem;
			}
			.spaces-container {
				padding: 10px;
			}

			.nav-links {
				gap: 0.5rem;
			}

			.cards-container {
				display: flex;
				flex-direction: row;
				overflow-x: auto;
				overflow-y: hidden;
				gap: 15px;
				padding: 0;
				margin: 0;
				scroll-snap-type: x mandatory;
				-webkit-overflow-scrolling: touch;
				scrollbar-width: none; /* Firefox */
				-ms-overflow-style: none; /* IE and Edge */
			}

			.cards-container::-webkit-scrollbar {
				display: none; /* Chrome, Safari, Opera */
			}

			.space-card {
				position: relative;
				flex: 0 0 90vw;
				max-width: 90vw;
				width: 90vw;
				scroll-snap-align: center;
			}

			.card-content {
				left: 16px;
				right: 16px;
				bottom: 16px;
			}
			.card-content_block {
				gap: 1rem;
			}

			.explore-button {
				align-self: flex-end;
			}

			.text-content {
				margin-right: 0;
			}
		}

		.title-container {
			display: flex;
			justify-content: space-between;
			margin-bottom: 1rem;
			margin-top: 27px;
		}

		.title-container .left_title {
			font-size: var(--fontSizeTextSmTablet);
			font-weight: var(--fontWeightSemiBold);
			color: var(--uiColorPrimaryBlack);
			padding: 0;
			margin: 0;
		}
		.title-container .left_subtitle {
			font-size: var(--fontSizeTextSm);
			font-weight: var(--fontWeightNormal);
			color: #bbbbbb;

			padding: 0;
			margin: 0;
		}
		.title-container_right a {
			color: #787880;
			font-size: var(--fontSizeTextSm);

			font-weight: var(--fontWeightNormal);
			text-decoration: none;
		}

		.trending-section {
			margin-bottom: 2rem;
		}

		.trending-header {
			display: flex;
			align-items: center;
			margin-bottom: 1rem;
		}

		.trending-header-left {
			display: flex;
			align-items: center;
		}

		.trending-title {
			font-size: var(--fontSizeTextMd);
			font-weight: var(--fontWeightSemiBold);
			color: var(--uiColorPrimaryBlack);
			margin: 0;

			:host-context([data-theme='dark']) & {
				color: var(--uiColorPrimaryWhite);
			}
		}

		.trending-tabs {
			display: flex;
		}

		.trending-tab {
			background: none;
			border: none;
			font-size: var(--fontSizeTextMd);
			font-weight: var(--fontWeightSemiBold);
			color: #e0e1e4;
			cursor: pointer;
			padding: 0 10px;

			:host-context([data-theme='dark']) & {
				color: #e0e1e4;
			}
		}

		.trending-tab.active {
			color: var(--uiColorPrimaryBlack);
			font-weight: var(--fontWeightSemiBold);

			:host-context([data-theme='dark']) & {
				color: var(--uiColorPrimaryWhite);
			}
		}

		.trending-cards-container {
			display: flex;
			flex-direction: row;
			overflow-x: auto;
			overflow-y: hidden;
			gap: 15px;
			padding: 0;
			scroll-snap-type: x mandatory;
			-webkit-overflow-scrolling: touch;
			scrollbar-width: none;
			-ms-overflow-style: none;
		}

		.trending-cards-container::-webkit-scrollbar {
			display: none;
		}

		.trending-card {
			flex: 0 0 170px;
			max-width: 170px;
			width: 170px;
			background: var(--uiColorPrimaryWhite);
			overflow: hidden;
			scroll-snap-align: start;
			position: relative;

			:host-context([data-theme='dark']) & {
				background: #333;
			}
		}

		.trending-card:first-child {
			margin-left: 0;
		}

		.trending-card:last-child {
			margin-right: 0;
		}

		.trending-card-header {
			position: absolute;
			top: 12px;
			left: 12px;
			right: 12px;
			display: flex;
			align-items: center;
			gap: 8px;
			z-index: 2;
		}

		.trending-logo-circle {
			width: 24px;
			height: 24px;
			border-radius: 50%;
			background: var(--uiColorPrimaryBlack);
			display: flex;
			align-items: center;
			justify-content: center;
			flex-shrink: 0;
		}

		.trending-logo-circle span {
			font-size: 9px;
			font-weight: var(--fontWeightSemiBold);
			color: var(--uiColorPrimaryWhite);
		}

		.trending-logo-text {
			font-size: var(--fontSizeTextXxs);
			font-weight: 500;
			color: var(--uiColorPrimaryBlack);
			text-decoration: underline;
			cursor: pointer;

			:host-context([data-theme='dark']) & {
				color: var(--uiColorPrimaryWhite);
			}
		}

		.trending-card-image {
			width: 100%;
			aspect-ratio: 0.75;
			overflow: hidden;
			cursor: pointer;
			border-radius: 10px;
			background: var(--appBackground);
		}

		.trending-card-image img {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}

		.trending-card-footer {
			padding: 12px;
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 6px;
		}

		.eye-icon {
			width: 16px;
			height: 16px;
			flex-shrink: 0;
		}

		.trending-view-count {
			font-size: var(--fontSizeTextXs);
			font-weight: var(--fontWeightNormal);
			color: #bbbbbb;
		}

		@media (max-width: 768px) {
			.featured-collections-title {
				font-size: var(--fontSizeTextMdDesktop);
			}
			.title-container {
				margin-top: 35px;
			}
			.left_title {
				font-size: var(--fontSizeTextXsTablet);
			}
			.left_subtitle {
				font-size: var(--fontSizeTextXs);
			}
			.title-container_right a {
				font-size: var(--fontSizeTextXs);
			}
		}
	`
}
