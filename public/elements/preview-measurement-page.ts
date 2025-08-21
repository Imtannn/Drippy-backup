import {css, Element, element, html} from 'lume'
import {appStyles} from './app-styles.js'

@element
export class PreviewMeasurementPage extends Element {
	static elementName = 'preview-measurement-page'

	template = () => html`
		<section id="panel" class="panel-right">
			<div class="panel-content">
				<!-- Header -->
				<div class="measurement-header">
					<div class="back-icon">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="12" viewBox="0 0 20 12" fill="none">
							<path
								d="M19 6.75C19.4142 6.75 19.75 6.41421 19.75 6C19.75 5.58579 19.4142 5.25 19 5.25V6.75ZM0.469536 5.46967C0.176643 5.76256 0.176643 6.23744 0.469536 6.53033L5.24251 11.3033C5.5354 11.5962 6.01027 11.5962 6.30317 11.3033C6.59606 11.0104 6.59606 10.5355 6.30317 10.2426L2.06053 6L6.30317 1.75736C6.59606 1.46447 6.59606 0.989593 6.30317 0.696699C6.01027 0.403806 5.5354 0.403806 5.24251 0.696699L0.469536 5.46967ZM19 6V5.25L0.999866 5.25V6V6.75L19 6.75V6Z"
								fill="#191A1D"
							/>
						</svg>
					</div>
					<h2 class="page-title">Your measurements</h2>
				</div>

				<!-- Measurement Input Fields -->
				<div class="measurement-fields">
					<div class="field-row">
						<div class="field-group">
							<input type="text" class="form-input" placeholder=" " value="0 cm" />
							<label class="floating-label">Bust</label>
						</div>
						<div class="field-group">
							<input type="text" class="form-input" placeholder=" " value="0 cm" />
							<label class="floating-label">Waist</label>
						</div>
					</div>

					<div class="field-row">
						<div class="field-group">
							<input type="text" class="form-input" placeholder=" " value="0 cm" />
							<label class="floating-label">Hips</label>
						</div>
						<div class="field-group">
							<input type="text" class="form-input" placeholder=" " value="0 cm" />
							<label class="floating-label">Shoulder</label>
						</div>
					</div>

					<div class="field-row">
						<div class="field-group">
							<input type="text" class="form-input" placeholder=" " value="0 cm" />
							<label class="floating-label">Shoulder to knee</label>
						</div>
						<div class="field-group">
							<input type="text" class="form-input" placeholder=" " value="0 cm" />
							<label class="floating-label">Shoulder</label>
						</div>
					</div>
				</div>

				<!-- Spacer to push button to bottom -->
				<div class="button-spacer"></div>

				<button class="measurement-button">Save my measurements</button>
			</div>
		</section>
	`

	css = css/*css*/ `
		${appStyles}
		/* Measurement page specific styles */
		.measurement-header {
			margin-bottom: 30px;
		}

		.back-icon {
			margin-bottom: 15px;
			width: 24px;
			height: 20px;
			display: flex;
			align-items: center;
			justify-content: center;
			cursor: pointer;
		}

		.back-icon svg {
			color: #000;
		}

		.back-icon svg path {
			fill: #000;
		}

		:host-context([data-theme='dark']) .back-icon svg path {
			fill: #fff;
		}

		.measurement-fields {
			margin-bottom: 40px;
		}

		.field-group {
			flex: 1;
		}

		.button-spacer {
			flex: 1;
			min-height: 0;
		}

		/* Override panel styles for measurement layout */
		#panel {
			background-color: white;
			width: 400px;
			position: static;
			margin-top: 80px;

			:host-context([data-theme='dark']) & {
				background-color: var(--appBackgroundDark);
			}
		}

		.panel-content {
			padding: 20px;
			display: flex;
			flex-direction: column;
			height: calc(85vh - 20px);
		}

		.measurement-fields {
			margin-bottom: 60px;
		}

		/* Mobile Layout */
		@media (width < 720px) {
			#panel {
				width: 100%;
				height: 50vh;
				margin-top: 0;
				border-radius: 20px 20px 0 0;
				position: static;
				padding: 0;
				left: unset;
				right: unset;
			}

			.panel-content {
				height: calc(50vh - 40px);
				overflow-y: auto;
				overflow-x: hidden;
			}
		}
	`
}
