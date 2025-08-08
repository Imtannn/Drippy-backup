import {css, Element, element, html} from 'lume'
import {sharedUIStyles} from './shared-ui-styles.js'

@element
export class SuccessPage extends Element {
	static elementName = 'success-page'

	template = () => html`
		<div class="preview-container">
			<!-- Top Navigation -->
			<div class="top-nav">
				<div class="nav-left">
					<button class="nav-button back-button">
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
							<path
								d="M19 12H5M12 19L5 12L12 5"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</button>
					<button class="nav-button home-button">
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
							<path
								d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</button>
				</div>
			</div>

			<!-- Logo positioned separately -->
			<div class="logo-circle logo-positioned">Logo</div>

			<!-- Main Content Area -->
			<section class="content-wrapper">
				<!-- 3D Scene Area -->
				<div class="scene-area">
					<!-- This would contain the 3D scene -->
				</div>

				<!-- Success Panel -->
				<section id="panel">
					<div class="panel-content">
						<!-- Success Header -->
						<div class="success-header">
							<h2 class="success-title">Boom — it's in!</h2>
							<p class="success-message"><strong>LOGO</strong> just got your order. You? Iconic. 😎</p>
						</div>

						<!-- Action Button -->
						<button class="success-button">Drip another design</button>

						<!-- Rating Section -->
						<div class="rating-section">
							<div class="stars">
								<div class="star-box">
									<img src="../images/star-icon.svg" alt="Star" />
								</div>
								<div class="star-box">
									<img src="../images/star-icon.svg" alt="Star" />
								</div>
								<div class="star-box">
									<img src="../images/star-icon.svg" alt="Star" />
								</div>
								<div class="star-box">
									<img src="../images/star-icon.svg" alt="Star" />
								</div>
								<div class="star-box">
									<img src="../images/star-icon.svg" alt="Star" />
								</div>
							</div>
							<p class="rating-text">Rate your experience</p>
						</div>
					</div>
				</section>
			</section>
		</div>
	`

	css = css/*css*/ `
		${sharedUIStyles}

		/* Override panel styles for success layout */
		#panel {
			background-color: white;
			width: 400px;
			position: static;
			margin-top: 80px;
			border-radius: 20px 0 0 0;
			box-shadow: -10px 0 30px rgba(0, 0, 0, 0.1);
		}

		.panel-content {
			padding: 20px;
			display: flex;
			flex-direction: column;
			align-items: center;
			text-align: center;
		}

		/* Success Header */
		.success-header {
			margin-bottom: 30px;
		}

		.success-title {
			font-size: 18px;
			font-weight: 600;
			color: #000;
			margin: 0 0 10px 0;
		}

		.success-message {
			font-size: 14px;
			font-weight: 400;
			color: #000000;
			margin: 0;
			line-height: 1.4;
		}

		/* Success Button */
		.success-button {
			width: 100%;
			background: #000;
			color: white;
			border: none;
			border-radius: 25px;
			padding: 15px 20px;
			font-size: 12px;
			font-weight: 600;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			margin-bottom: 30px;
		}

		/* Rating Section */
		.rating-section {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 10px;
		}

		.stars {
			display: flex;
			gap: 10px;
		}

		.star-box {
			display: flex;
			width: 30px;
			height: 30px;
			justify-content: center;
			align-items: center;
			gap: 10px;
			aspect-ratio: 1/1;
			border-radius: 5px;
			background: var(--Lighter-grey, #f6f6f6);
		}

		.star-box img {
			width: 21px;
			height: 20px;
		}

		.rating-text {
			font-size: 12px;
			font-weight: 400;
			color: #8b8b8b;
			margin: 0;
		}

		/* Mobile Layout */
		@media (width < 720px) {
			#panel {
				width: 100%;
				height: 30vh;
				margin-top: 0;
				border-radius: 20px 20px 0 0;
				position: static;
				padding: 0;
				left: unset;
				right: unset;
			}

			.panel-content {
				height: calc(30vh - 40px);
				overflow-y: auto;
			}
		}
	`
}
