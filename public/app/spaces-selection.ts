import {batch, css, Element, element, html, signal} from 'lume'
import type {Accessor} from 'solid-js'
import {spaces} from '../consts/spaces.js'
import '../elements/avatar-dropdown.js'
import '../elements/placeholder-image.js'
import {pushState, searchParams} from '../routes.js'
import type {Space} from '../types/types.js'
import {currentUser, store} from './store.js'

import {scenes} from '../consts/scenes.js'
import '../elements/dialog-element.js'
import '../elements/logic/index-each.js'
import '../elements/logic/show-when.js'
import '../elements/login-ui.js'
import {getSpaceSceneThumbnail} from '../utils.js'

@element
export class SpacesSelection extends Element {
	static elementName = 'spaces-selection'

	@signal filteredSpace: Space[] = []
	@signal showLoginDialog = false

	connectedCallback() {
		super.connectedCallback()

		this.createEffect(() => {
			const brandParam = searchParams().get('brand')
			if (brandParam) {
				this.classList.add('has-brand')
			} else {
				this.classList.remove('has-brand')
			}
		})

		// Show all spaces regardless of gender
		this.createEffect(() => {
			let filteredSpaces = store.isAdmin
				? spaces.filter(space => !space.isHidden)
				: spaces.filter(space => !space.isWorkInProgress && !space.isHidden)

			// Filter by brand if brand query parameter exists
			const brandParam = searchParams().get('brand')
			if (brandParam) {
				filteredSpaces = filteredSpaces.filter((space: Space) => space.collections.includes(brandParam))
			}

			this.filteredSpace = filteredSpaces
		})

		// Close login dialog when user successfully logs in
		this.createEffect(() => {
			const user = currentUser()
			if (user !== null && this.showLoginDialog) {
				this.showLoginDialog = false
			}
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

	template = () => html`
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
							<a href="/landing" class="learn-more-link">Learn more</a>
							${() => {
								const user = currentUser()
								return user !== null
									? html`<login-ui></login-ui>`
									: html`<button class="sign-in-button" onclick=${this.#onSignInClick}>Sign in</button>`
							}}
						</div>
					</div>
				`}
			></show-when>

			<!-- Main Title and Description -->
			<show-when
				condition=${() => !searchParams().has('brand')}
				content=${() => html`
					<div class="header">
						<h1 class="main-title">Discover & immerse.</h1>
						<p class="description">Step into the space of each curated collection.</p>
						<p class="description">Remix, customize, and shop the drip.</p>
					</div>
				`}
			></show-when>

			<!-- Space Cards -->
			<div class="cards-container">
				<index-each
					items=${() => this.filteredSpace}
					content=${() => (space: Accessor<Space>) => html`
						<!-- Bloom Realm Card -->
						<div class="space-card">
							<div class="scene-preview">
								<div class="scene-placeholder" onclick=${() => this.#onSpaceSelected(space())}>
									<placeholder-image
										src=${getSpaceSceneThumbnail(space(), scenes)}
										alt=${space().name}
										object-fit="cover"
									/>
								</div>
								<div class="garments-count">${space().garmentsCount} garments</div>
							</div>
							<div class="card-content">
								<div class="text-content">
									<h3 class="card-title">${space().name}</h3>
									<p class="card-subtitle" onclick=${() => this.#onBrandViewClick(space().collections[0])}>
										${space().description}
									</p>
								</div>
								<button class="explore-button" onclick=${() => this.#onSpaceSelected(space())}>Explore space →</button>
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

	css = css/*css*/ `
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

		.header {
			text-align: center;
			margin-bottom: 2rem;
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

		.description {
			font-size: var(--fontSizeTextXs);
			font-weight: var(--fontWeightNormal);
			line-height: var(--lineHeightLoose);
			margin: 0 auto;

			:host-context([data-theme='dark']) & {
				color: #ccc;
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

		.space-card {
			background: var(--uiColorPrimaryWhite);
			border-radius: var(--borderRadiusLarge);
			border-bottom-left-radius: 0;
			border-bottom-right-radius: 0;
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

		.garments-count {
			position: absolute;
			top: var(--uiGap);
			right: var(--uiGap);
			background: rgba(0, 0, 0, 0.3);
			color: var(--uiColorPrimaryWhite);
			padding: 4px var(--uiSpacingSmall);
			border-radius: 15px;
			font-size: 0.8rem;
			backdrop-filter: blur(50px);
		}

		.card-content {
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
			font-size: var(--fontSizeTextXs);
			font-weight: var(--fontWeightSemiBold);
			color: var(--uiColorPrimaryBlack);
			margin: 0;

			:host-context([data-theme='dark']) & {
				color: var(--uiColorPrimaryWhite);
			}
		}

		.card-subtitle {
			font-size: var(--fontSizeTextXs);
			font-weight: var(--fontWeightNormal);
			color: #666;
			text-decoration: underline;
			margin: 0;
			display: block;
			cursor: pointer;

			:host-context([data-theme='dark']) & {
				color: #ccc;
			}
		}

		.explore-button {
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

			.nav-links {
				gap: 0.5rem;
			}

			.description {
				padding: 0 1rem;
			}

			.cards-container {
				padding: 0 1rem;
			}

			.space-card {
				max-width: 100%;
				width: 100%;
			}

			.card-content {
				gap: 1rem;
			}

			.explore-button {
				align-self: flex-end;
			}

			.text-content {
				margin-right: 0;
			}
		}
	`
}
