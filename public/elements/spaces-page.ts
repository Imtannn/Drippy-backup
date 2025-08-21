import {css, Element, element, html} from 'lume'

@element
export class SpacesPage extends Element {
	static elementName = 'spaces-page'

	template = () => html`
		<div class="spaces-container">
			<!-- Main Title and Description -->
			<div class="header">
				<h1 class="main-title">Discover & immerse.</h1>
				<p class="description">Step into the space of each curated collection. Remix, customize, and shop the drip.</p>
			</div>

			<!-- Space Cards -->
			<div class="cards-container">
				<!-- Bloom Realm Card -->
				<div class="space-card">
					<div class="scene-preview">
						<div class="scene-placeholder">
							<img src="../images/space-zero.png" alt="Bloom Realm Scene" />
						</div>
						<div class="garments-count">10 garments</div>
					</div>
					<div class="card-content">
						<div class="text-content">
							<h3 class="card-title">Bloom realm</h3>
							<p class="card-subtitle">One million roses</p>
						</div>
						<button class="explore-button">Explore space →</button>
					</div>
				</div>

				<!-- Neon Future Card -->
				<div class="space-card">
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
						<button class="explore-button">Explore space →</button>
					</div>
				</div>
			</div>
		</div>
	`

	css = css/*css*/ `
		/* SpacesPage-specific styles */
		.spaces-container {
			padding: var(--uiSpacing);
			background: white;
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
			font-weight: 600;
			color: black;
			margin-bottom: 1rem;

			:host-context([data-theme='dark']) & {
				color: white;
			}
		}

		.description {
			font-size: 14px;
			font-weight: 500;
			color: Eerie black;
			line-height: 1.5;
			max-width: 600px;
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
			background: white;
			border-radius: 15px;
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
		}

		.scene-placeholder img {
			width: 100%;
			height: 100%;
			object-fit: cover;
			object-position: center;
		}

		.garments-count {
			position: absolute;
			top: 10px;
			right: 10px;
			background: rgba(0, 0, 0, 0.7);
			color: white;
			padding: 4px 8px;
			border-radius: 4px;
			font-size: 0.8rem;
		}

		.card-content {
			padding: 1.5rem;
			display: flex;
			justify-content: space-between;
			align-items: flex-start;
		}

		.text-content {
			flex: 1;
			margin-right: 1rem;
		}

		.card-title {
			font-size: 16px;
			font-weight: 600;
			color: black;
			margin: 0;

			:host-context([data-theme='dark']) & {
				color: white;
			}
		}

		.card-subtitle {
			font-size: 12px;
			font-weight: 400;
			color: #666;
			text-decoration: underline;
			margin: 0.5rem 0 0 0;
			display: block;

			:host-context([data-theme='dark']) & {
				color: #ccc;
			}
		}

		.explore-button {
			font-size: 12px;
			padding: 0.5rem 1rem;
			background: #121316;
			border: 2px solid black;
			border-radius: 100px;
			cursor: pointer;
			font-weight: 600;
			color: white;
			white-space: nowrap;

			:host-context([data-theme='dark']) & {
				background: #333;
				border-color: white;
				color: white;
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
				flex-direction: column;
				align-items: flex-start;
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
