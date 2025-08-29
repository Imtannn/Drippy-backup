import {css, Element, element, html, Index, signal} from 'lume'
import type {Accessor} from 'solid-js'
import {store} from './store.js'

const SPACES = [
	{
		name: 'Bloom Realm',
		description: 'One million roses',
		image: '../images/doina-bg.webp',
		gender: 'male',
		garmentsCount: 10,
	},
]

@element
export class SpacesSelection extends Element {
	static elementName = 'spaces-selection'

	@signal filterdSpace: (typeof SPACES)[number][] = []

	connectedCallback() {
		super.connectedCallback()

		this.createEffect(() => {
			console.log(store.selectedAvatar, SPACES)
			this.filterdSpace = SPACES.filter(space => space.gender === store.selectedAvatar)
			console.log(this.filterdSpace)
		})
	}

	fadeOut(callback?: () => void) {
		this.classList.add('fade-out')
		setTimeout(() => {
			callback?.()
		}, 300) // Match animation duration
	}

	#onSceneSelected = () => {
		const searchParams = new URLSearchParams(window.location.search)
		searchParams.set('scene', 'bloom realms')
		window.history.replaceState({}, '', `?${searchParams.toString()}`)
		store.selectScene = 'bloom realms'
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
			<${Index} each=${() => this.filterdSpace}>
			${(space: Accessor<(typeof SPACES)[number]>) => html`
				<!-- Bloom Realm Card -->
				<div class="space-card">
					<div class="scene-preview">
						<div class="scene-placeholder">
							<img src=${space().image} alt="Bloom Realm Scene" />
						</div>
						<div class="garments-count">${space().garmentsCount} garments</div>
					</div>
					<div class="card-content">
						<div class="text-content">
							<h3 class="card-title">${space().name}</h3>
							<p class="card-subtitle">${space().description}</p>
						</div>
						<button class="explore-button" onclick=${this.#onSceneSelected}>Explore space →</button>
					</div>
				</div>
			`}
			</>

				<!-- Neon Future Card -->
				<!--<div class="space-card">
					<div class="scene-preview">
						<div class="scene-placeholder">
							<img src="../images/space-one.png" alt="Neon Future Scene" />
						</div>
						<div class="garments-count">8 garments</div>
					</div>
					<div class="card-content">
						<div class="text-content">
							<h3 class="card-title">Neon future</h3>
							<p class="card-subtitle">Neon chic</p>
						</div>
						<button class="explore-button" onclick=${this.#onSceneSelected}>Explore space →</button>
					</div>
				</div> -->
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
			font-weight: var(--fontWeightSemibold);
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
			display: flex;
			flex-direction: column;
			gap: 2rem;
			max-width: 800px;
			margin: 0 auto;
		}

		.space-card {
			background: var(--uiColorPrimaryWhite);
			border-radius: var(--borderRadiusLarge);
			overflow: hidden;
			width: 100%;
			max-width: 354px;
			margin: 0 auto;

			:host-context([data-theme='dark']) & {
				background: #333;
			}
		}

		.scene-preview {
			position: relative;
			width: 100%;
			height: 220px;
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
		}

		.scene-placeholder img {
			width: 100%;
			height: 100%;
			object-fit: cover;
			object-position: center;
			border-radius: var(--borderRadiusLarge);
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
			padding: 1.5rem;
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
			font-weight: var(--fontWeightSemibold);
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
			font-weight: var(--fontWeightSemibold);
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
			.space-card {
				max-width: 500px;
			}

			.scene-preview {
				height: 310px;
			}
		}

		@media (min-width: 1600px) {
			.space-card {
				max-width: 600px;
			}

			.scene-preview {
				height: 372px;
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
