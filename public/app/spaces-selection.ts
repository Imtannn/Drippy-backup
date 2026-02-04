import {batch, css, Element, element, html, signal} from 'lume'
import type {Accessor} from 'solid-js'
import {avatars} from '../consts/avatars.js'
import {countItemsInSpace, spaces} from '../consts/spaces.js'
import {templates} from '../consts/templates.js'
import '../elements/avatar-dropdown.js'
import '../elements/placeholder-image.js'
import {pushState, searchParams} from '../routes.js'
import type {Space, TemplateBlocksMap, TemplateFabricsMap} from '../types/types.js'
import type {Template, TemplateCategory} from '../types/template.js'
import {currentUser, isLoggedIn, store, updateGarmentsSelectionInUrl} from './store.js'
import {templateHelpers} from './TemplateHelpers.js'

import '../elements/dialog-element.js'
import '../elements/heart-button.js'
import '../elements/logic/for-each.js'
import '../elements/logic/index-each.js'
import '../elements/logic/show-when.js'
import '../elements/login-ui.js'
import '../elements/tabs.js'
import './item-card.js'
import {getSpaceThumbnail, getSpaceCollectionSlugs, size} from '../utils.js'

@element
export class SpacesSelection extends Element {
	static override elementName = 'spaces-selection'

	@signal filteredSpace: Space[] = []
	@signal showLoginDialog = false
	@signal selectedTab: string = 'All'

	override connectedCallback() {
		super.connectedCallback()

		this.createEffect(() => {
			const brandParam = searchParams().get('brand')
			if (brandParam) this.classList.add('has-brand')
			else this.classList.remove('has-brand')
		})

		// Show all spaces regardless of gender
		this.createEffect(() => {
			let filteredSpaces = store.isAdmin
				? spaces().filter(space => !space.isHidden)
				: spaces().filter(space => !space.isWorkInProgress && !space.isHidden)

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

		// Ensure selectedTab is always set to a valid value
		this.createEffect(() => {
			const tabs = ['All', 'Space', 'Items']
			if (!this.selectedTab || !tabs.includes(this.selectedTab)) this.selectedTab = 'All'
		})

		// Sync selectedTab with tabs-provider on mount
		this.createEffect(() => {
			// Ensure selectedTab is set before tabs-provider initializes
			if (!this.selectedTab) this.selectedTab = 'All'
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

	#getSpaceTemplates = (space: Space): Template[] => {
		const spaceCollections = getSpaceCollectionSlugs(space)
		const allTemplates: Template[] = []

		for (const collectionSlug of spaceCollections) {
			const collectionTemplates = templates().filter(template => template.collection === collectionSlug)
			allTemplates.push(...collectionTemplates)
		}

		return allTemplates
	}

	#onSpaceSelectedWithTemplates = (space: Space, selectedTemplate?: Template) => {
		// Get all templates for this space
		const allTemplates = this.#getSpaceTemplates(space)

		if (allTemplates.length === 0) {
			// If no templates found, just navigate to space normally
			this.#onSpaceSelected(space)
			return
		}

		// Use selected template or first template
		const template = selectedTemplate || allTemplates[0]
		const templateCategory = template.category as TemplateCategory

		// Convert template to blocks and fabrics maps
		const aggregatedBlocks: TemplateBlocksMap = {}
		const aggregatedFabrics: TemplateFabricsMap = {}
		const aggregatedTemplates: Record<TemplateCategory, Template> = {}

		// Store template
		aggregatedTemplates[templateCategory] = template

		// Convert template to block data
		const spaceCollections = getSpaceCollectionSlugs(space)
		const collectionHint = template.collection ?? spaceCollections[0] ?? null
		const templateBlockData = templateHelpers.convertTemplateToBlockData(template, collectionHint)
		const {newBlocksMap, newFabricsMap} = templateHelpers.getBlocksAndFabricsMapFromTemplateData(
			templateBlockData,
			collectionHint,
		)

		// Aggregate blocks
		if (size(newBlocksMap) > 0) aggregatedBlocks[templateCategory] = newBlocksMap

		// Aggregate fabrics
		if (size(newFabricsMap) > 0) aggregatedFabrics[templateCategory] = newFabricsMap

		// Build selected garments from maps
		const selectedGarments = templateHelpers.buildSelectedGarmentsFromMaps(aggregatedBlocks, aggregatedFabrics)

		// Set templates and garments in store first
		batch(() => {
			store.replaceSelectedGarments(aggregatedBlocks, aggregatedFabrics)
			store.selectedTemplates = aggregatedTemplates
			store.selectSpace = space
		})

		// Set space and avatar in URL
		searchParams().set('space', space.slug)

		// Ensure avatar is set (use current if matches gender, otherwise default for space gender)
		const currentAvatar = avatars().find(a => a.name === store.selectedAvatar)
		const avatarMatchesGender = currentAvatar && currentAvatar.gender === space.gender

		if (!searchParams().get('avatar') || !avatarMatchesGender) {
			const defaultAvatar = avatars().find(a => a.gender === space.gender && a.default)
			if (defaultAvatar) searchParams().set('avatar', defaultAvatar.name)
			else if (avatarMatchesGender && store.selectedAvatar) searchParams().set('avatar', store.selectedAvatar)
		}

		// Update URL with blocks and fabrics from selected garments
		updateGarmentsSelectionInUrl(selectedGarments)

		// Navigate to template view
		batch(() => {
			store.view = 'template'
			pushState()
		})
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

			<!-- Main Title and Description -->
			<show-when
				condition=${() => !searchParams().has('brand')}
				content=${() => html`
					<div class="header">
						<h1 class="main-title">Discover & immerse.</h1>
						<p class="description">Step into the space of each curated collection.</p>
						<p class="description">Remix, customize, and shop the drip.</p>
					</div>
					<div class="tab-container">
						<div class="search-container">
							<div class="search-bar">
								<img src="/images/action-buttons/search-button.svg" alt="Search" class="search-icon" />
								<input type="text" placeholder="Search all" class="search-input" />
							</div>
						</div>
						<tabs-provider
							selected-value=${() => this.selectedTab || 'All'}
							default-value=${() => this.selectedTab || 'All'}
							ontabchange=${(e: CustomEvent) => {
								this.selectedTab = e.detail.value
								console.log('selectedTab changed to:', this.selectedTab)
							}}
						>
							<div class="tabs-container">
								<tabs-list>
									<for-each
										items=${() => ['All', 'Space', 'Items']}
										content=${() => (tab: string) => html` <tabs-trigger selected-value=${tab}>${tab}</tabs-trigger> `}
									></for-each>
								</tabs-list>
								<div class="tabs-action-buttons">
									<img src="/images/icons/heart.svg" alt="Heart" />
								</div>
							</div>

							<!-- Hidden until content is ready -->
							<for-each
								items=${() => ['All', 'Space', 'Items']}
								content=${() => (tab: string) => html`
									<tabs-content selected-value=${tab} style="display: none; visibility: hidden;"></tabs-content>
								`}
							></for-each>
						</tabs-provider>
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
								<div class="garments-count">${countItemsInSpace(space())} garments</div>
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

			<show-when
				condition=${() => !searchParams().has('brand')}
				content=${() => html`
					<div class="title-container">
						<div class="title-container_left">
							<p class="left_title">Collect now</p>
							<p class="left_subtitle">Check out these hot items</p>
						</div>
						<div class="title-container_right">
							<a>See all</a>
						</div>
					</div>

					<div class="trending-section">
						<div class="trending-header">
							<div class="trending-header-left">
								<p class="trending-title">🔥 Trending now</p>
							</div>
							<div class="trending-tabs">
								<button class="trending-tab">Newest drop</button>
								<button class="trending-tab">For you</button>
							</div>
						</div>
						<div class="trending-cards-container">
							<index-each
								items=${() => {
									const allTemplates: Array<{template: Template; space: Space}> = []
									for (const space of this.filteredSpace) {
										const spaceTemplates = this.#getSpaceTemplates(space)
										for (const template of spaceTemplates) allTemplates.push({template, space})
									}
									return allTemplates
								}}
								content=${() => (item: Accessor<{template: Template; space: Space}>) => {
									const template = item().template
									const space = item().space
									return html`
										<div class="trending-card">
											<div class="trending-card-header">
												<div class="trending-logo-circle">
													<span>Logo</span>
												</div>
												<a class="trending-logo-text">Logo</a>
											</div>
											<div
												class="trending-card-image"
												onclick=${() => this.#onSpaceSelectedWithTemplates(space, template)}
											>
												<placeholder-image
													src=${template.thumb}
													alt=${template.name}
													image-style="width: 140px;height: 190px;margin: auto;"
												/>
											</div>
											<div class="trending-card-footer">
												<svg
													width="16"
													height="16"
													viewBox="0 0 16 16"
													fill="none"
													xmlns="http://www.w3.org/2000/svg"
													class="eye-icon"
												>
													<path
														d="M8 3C4.67 3 2.07 5.13 1 8C2.07 10.87 4.67 13 8 13C11.33 13 13.93 10.87 15 8C13.93 5.13 11.33 3 8 3ZM8 11.33C6.16 11.33 4.67 9.84 4.67 8C4.67 6.16 6.16 4.67 8 4.67C9.84 4.67 11.33 6.16 11.33 8C11.33 9.84 9.84 11.33 8 11.33ZM8 6C7.08 6 6.33 6.75 6.33 7.67C6.33 8.58 7.08 9.33 8 9.33C8.92 9.33 9.67 8.58 9.67 7.67C9.67 6.75 8.92 6 8 6Z"
														fill="#BBBBBB"
													/>
												</svg>
												<span class="trending-view-count">11.4K viewing</span>
											</div>
										</div>
									`
								}}
							></index-each>
						</div>
					</div>

					<div class="title-container">
						<div class="title-container_left">
							<p class="left_title">Collect now</p>
							<p class="left_subtitle">Check out these hot items</p>
						</div>
						<div class="title-container_right">
							<a>See all</a>
						</div>
					</div>
					<div class="cards-container">
						<index-each
							items=${() => this.filteredSpace}
							content=${() => (space: Accessor<Space>) => html`
								<!-- Bloom Realm Card -->
								<!-- FIXME: avoid duplicate code with the space card above -->
								<div class="space-card">
									<div class="scene-preview">
										<div class="scene-placeholder" onclick=${() => this.#onSpaceSelected(space())}>
											<placeholder-image src=${getSpaceThumbnail(space())} alt=${space().name} object-fit="cover" />
										</div>
										<div class="garments-count">${countItemsInSpace(space())} garments</div>
									</div>
									<div class="card-content_block">
										<div class="text-content">
											<h3 class="card-title_block">${space().name}</h3>
											<div class="content-icons">
												<div class="item">
													<img src="/images/icons/heart.svg" alt="Item" />
													135
												</div>
												<div class="item">
													<img src="/images/icons/user.svg" alt="Item" />
													13K
												</div>
											</div>
										</div>
									</div>
								</div>
							`}
						></index-each>
					</div>
				`}
			></show-when>
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
		.tab-container {
			max-width: 400px;
			margin: 0 auto;
		}

		.search-container {
			padding: 0 20px 15px 20px;
		}

		.search-bar {
			display: flex;
			align-items: center;
			gap: 0.5rem;
			padding: 5px 20px;
			background: var(--uiColorPrimaryLightGrey);
			border-radius: 100px;
			width: 100%;
			box-sizing: border-box;
		}

		.search-icon {
			width: 25px;
			height: 25px;
			flex-shrink: 0;
		}

		.search-input {
			flex: 1;
			border: none;
			background: transparent;
			outline: none;
			font-size: var(--fontSizeTextXs);
			color: var(--uiColorPrimaryBlack);
			font-weight: var(--fontWeightNormal);
		}

		.search-input::placeholder {
			color: #666;
		}

		:host-context([data-theme='dark']) .search-bar {
			background: #333;
		}

		:host-context([data-theme='dark']) .search-input {
			color: var(--uiColorPrimaryWhite);
		}

		:host-context([data-theme='dark']) .search-input::placeholder {
			color: #999;
		}

		.tabs-container {
			display: flex;
			align-items: center;
			gap: var(--uiSpacingSmall);
			padding: 0 20px var(--uiSpacingSmall) 20px;
			background: var(--uiColorPrimaryWhite);
			position: relative;
			justify-content: space-between;

			:host-context([data-theme='dark']) & {
				background: #1a1a1a;
			}
		}

		.tabs-action-buttons {
			display: flex;
			gap: var(--uiSpacingSmall);
			height: 13px;
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
			font-weight: var(--fontWeightSemiBold);
			color: var(--uiColorPrimaryBlack);
			margin-bottom: 1rem;
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
			font-weight: var(--fontWeightSemiBold);
			color: var(--uiColorPrimaryBlack);
			margin: 0;

			:host-context([data-theme='dark']) & {
				color: var(--uiColorPrimaryBlack);
			}
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
			font-weight: var(--fontWeightNormal);
			color: #666;
			text-decoration: underline;
			margin: 0;
			display: block;
			cursor: pointer;

			:host-context([data-theme='dark']) & {
				color: #666;
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

			.description {
				padding: 0 1rem;
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
				gap: 1rem;
				position: absolute;
				bottom: 5%;
				width: 95%;
				left: 50%;
				transform: translate(-50%, 0%);
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
			.card-title {
				color: var(--uiColorPrimaryWhite);
			}
			.card-subtitle {
				color: var(--uiColorPrimaryWhite);
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
