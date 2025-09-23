import {css, Element, element, html, signal} from 'lume'
import type {Accessor} from 'solid-js'
import {avatars} from '../consts/avatars.js'
import {spaces} from '../consts/spaces.js'
import type {Space} from '../types/types.js'
import {store} from './store.js'
import {updateUrlWithParams} from '../routes.js'

import '../elements/logic/index-each.js'
import '../elements/logic/show-when.js'

@element
export class SpacesSelection extends Element {
	static elementName = 'spaces-selection'

	@signal filterdSpace: Space[] = []

	connectedCallback() {
		super.connectedCallback()

		this.createEffect(() => {
			const avatarGender = avatars.find(avatar => avatar.value === store.selectedAvatar)?.gender
			this.filterdSpace = spaces.filter(space => space.gender === avatarGender)
		})
	}

	fadeOut(callback?: () => void) {
		this.classList.add('fade-out')
		setTimeout(() => {
			callback?.()
		}, 300) // Match animation duration
	}

	#onSceneSelected = (space: Space) => {
		const searchParams = new URLSearchParams(window.location.search)
		searchParams.set('scene', space.slug)
		updateUrlWithParams(searchParams)
		store.selectSpace = space
	}

	template = () => html`
		<div class="spaces-container">
			<!-- Main Title and Description -->
			<div class="header">
				<h1 class="main-title">Discover & immerse.</h1>
				<p class="description">Step into the space of each curated collection.</p>
				<p class="description">Remix, customize, and shop the drip.</p>
			</div>

			<!-- Space Cards -->
			<div class="cards-container">
				<index-each
					items=${() => this.filterdSpace}
					content=${() => (space: Accessor<Space>) => html`
						<!-- Bloom Realm Card -->
						<div class="space-card">
							<div class="scene-preview">
								<div class="scene-placeholder">
									<img src=${space().sceneThumbnail} alt="Bloom Realm Scene" onclick=${() => this.#onSceneSelected(space())} />
								</div>
								<div class="garments-count">${space().garmentsCount} garments</div>
							</div>
							<div class="card-content">
								<div class="text-content">
									<h3 class="card-title">${space().name}</h3>
									<p class="card-subtitle">${space().description}</p>
								</div>
								<button class="explore-button" onclick=${() => this.#onSceneSelected(space())}>Explore space →</button>
							</div>
						</div>
					`}
				></index-each>

				<show-when
					condition=${() => this.filterdSpace.length === 0}
					content=${() => html`
						<div class="no-spaces-container">
							<p class="no-spaces-text">Spaces for this avatar are coming soon!</p>
							<button class="no-spaces-button" onclick=${() => (store.view = 'avatar')}>Select avatar →</button>
						</div>
					`}
				></show-when>
			</div>
		</div>
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
			color: Eerie black;
			line-height: var(--lineHeightLoose);
			max-width: var(--appWidth);
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
			background: rgba(0, 0, 0, 0.1);
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
			.main-title {
				// font-size: 2rem;
			}

			.description {
				// font-size: 1rem;
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
