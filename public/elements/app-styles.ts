import {css} from 'lume'

export const appStyles = css`
	/* Re-enable pointer events for UI elements */
	route-views * {
		pointer-events: auto;
	}

	/* Navigation */
	.top-nav {
		position: absolute;
		top: 20px;
		left: 20px;
		right: 20px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		z-index: 1000;
	}

	.nav-left {
		display: flex;
		gap: 10px;
	}

	.nav-button {
		width: 50px;
		height: 50px;
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.5);
		border: none;
		color: white;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* Logo */
	.logo-circle {
		width: 50px;
		height: 50px;
		border-radius: 50%;
		background: #000;
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 10px;
		font-weight: 600;
	}

	.logo-positioned {
		position: absolute;
		top: 20px;
		right: 400px;
		z-index: 1000;
	}

	/* Form Styles */
	.form-input {
		width: 100%;
		padding: 12px 15px;
		padding-top: 18px;
		border: 1px solid #ddd;
		border-radius: 8px;
		font-size: 10px;
		font-weight: 500;
		box-sizing: border-box;
		background-color: #f5f5f5;
		transition: border-color 0.2s ease;
	}

	.form-input:focus {
		border-color: #e56be8;
		outline: none;
	}

	.floating-label {
		position: absolute;
		top: 12px;
		left: 15px;
		font-size: 12px;
		font-weight: 400;
		color: #999;
		transition: all 0.2s ease;
		pointer-events: none;
	}

	.form-input:focus + .floating-label,
	.form-input:not(:placeholder-shown) + .floating-label {
		top: 6px;
		font-size: 7px;
		color: #666;
	}

	.page-title {
		font-size: 12px;
		font-weight: 600;
		color: #000;
		margin: 0;

		:host-context([data-theme='dark']) & {
			color: #fff;
		}
	}

	/* Layout and Field Styles */
	.form-fields {
		display: flex;
		flex-direction: column;
		gap: 7px;
	}

	.field-row {
		display: flex;
		gap: 15px;
		margin-bottom: 15px;
	}

	.field-group {
		position: relative;
	}

	/* Button Styles */
	.order-button,
	.measurement-button {
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

		:host-context([data-theme='dark']) & {
			background: #fff;
			color: #000;
		}
	}

	.order-button {
		gap: 10px;
	}

	/* Section Styles */
	.section-title {
		font-size: 12px;
		font-weight: 600;
		color: #000;
		margin: 0 0 15px 0;

		:host-context([data-theme='dark']) & {
			color: #fff;
		}
	}

	/* Mobile Layout Adjustments */
	@media (width < 720px) {
		.top-nav {
			top: 30px;
			left: 30px;
			right: 100px;
		}

		.logo-positioned {
			top: 30px;
			right: 30px;
		}
	}

	.app-step {
		width: 100%;
		height: 100vh;
		position: relative;
	}

	.step-header {
		position: absolute;
		top: 20px;
		left: 20px;
		right: 20px;
		z-index: 1000;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	* {
		box-sizing: border-box;
	}

	/* Base panel styles */
	#panel {
		overflow: auto;
		padding: var(--uiSpacing);
		border-radius: 15px;
		position: absolute;
		top: var(--uiSpacing);
		left: var(--uiSpacing);
		bottom: var(--uiSpacing);
		--panelWidth: 300px;
		width: var(--panelWidth);

		@media (width < 720px) {
			--panelWidth: calc(100vw - 2 * var(--uiSpacing));
			top: unset;
			left: var(--uiSpacing);
			right: var(--uiSpacing);
			bottom: 0;
			width: unset;
			height: 400px;
			border-bottom-right-radius: 0;
			border-bottom-left-radius: 0;
		}

		background: var(--appBackground);
		:host-context([data-theme='dark']) & {
			background: var(--appBackgroundDark);
		}
	}

	#panel.panel-right {
		position: absolute;
		right: 0;
		top: 80px;
		left: unset;
		width: 400px;
		background-color: white;
		border-radius: 20px 0 0 0;
		box-shadow: -10px 0 30px rgba(0, 0, 0, 0.1);

		:host-context([data-theme='dark']) & {
			background-color: var(--appBackgroundDark);
			box-shadow: -10px 0 30px rgba(255, 255, 255, 0.1);
		}

		@media (width < 720px) {
			width: 100%;
			height: 50vh;
			top: 50vh;
			right: 0;
			left: 0;
			bottom: 0;
			border-radius: 20px 20px 0 0;
			padding: 20px;
			overflow-y: auto;
		}
	}

	.divider {
		border-top: 1px solid #e0e1e4;
	}

	.tabs-container {
		padding: 20px;
		padding-top: 0;
	}

	.tabs-content-container {
		padding: 20px;
		padding-top: 0;
	}

	.panel-header {
		text-align: center;
		margin-bottom: var(--uiSpacing);

		h2 {
			margin: 0 0 8px 0;
			font-size: 1.2rem;
			color: var(--textColor);
		}

		p {
			margin: 0;
			font-size: 0.9rem;
			color: var(--textColorMuted);
		}
	}

	.save-btn,
	.preview-btn,
	.space-btn-next,
	.preview-btn-next,
	.preview-m-btn-next {
		position: absolute;
		top: 20px;
		right: 60px;
		z-index: 1000;
		background: var(--primaryColor, #000000);
		color: white;
		border: none;
		border-radius: 8px;
		padding: 8px 16px;
		font-size: 0.9rem;
		cursor: pointer;
		transition: background 0.2s ease;

		&:hover {
			background: var(--primaryColorHover, #0056b3);
		}
	}

	.space-btn-back,
	.preview-btn-back,
	.preview-m-btn-back,
	.success-btn-back {
		position: absolute;
		top: 20px;
		left: 60px;
		z-index: 1000;
		background: var(--primaryColor, #000000);
		color: white;
		border: none;
		border-radius: 8px;
		padding: 8px 16px;
		font-size: 0.9rem;
		cursor: pointer;
		transition: background 0.2s ease;

		&:hover {
			background: var(--primaryColorHover, #0056b3);
		}
	}

	.step-container {
		width: 100%;
		height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.success-actions {
		display: flex;
		gap: 16px;
		justify-content: center;
		padding: 20px;

		.btn {
			padding: 12px 24px;
			border-radius: 8px;
			font-size: 1rem;
			cursor: pointer;
			transition: all 0.2s ease;

			&.btn-primary {
				background: var(--primaryColor, #007aff);
				color: white;
				border: none;

				&:hover {
					background: var(--primaryColorHover, #0056b3);
				}
			}

			&.btn-secondary {
				background: transparent;
				color: var(--textColor);
				border: 1px solid #e0e1e4;

				&:hover {
					background: #f5f5f5;
				}
			}
		}
	}

	.genders {
		display: flex;
		gap: var(--uiSpacingSmall);
		margin-bottom: var(--uiSpacing);

		button {
			border: none;
			padding: 5px 10px;
			font-size: 0.7rem;
			line-height: 0.7rem;
			height: calc(0.7rem + 10px);
			border-radius: calc((0.7rem + 10px) / 2);

			background: #e0e1e4;
			color: #424347;

			&.selected {
				background: var(--appBackgroundDark);
				color: white;
			}

			:host-context([data-theme='dark']) & {
				background: #2b2b2c;
				color: #d0d0d0;

				&.selected {
					background: var(--appBackground);
					color: black;
				}
			}
		}
	}

	.grid {
		/* A grid with 3 columns, and infinite rows. */
		display: flex;
		gap: var(--uiSpacingSmall);
		flex-wrap: wrap;

		.block {
			--aspectRatio: 0.7;
			--width: calc((var(--panelWidth) - 2 * var(--uiSpacing) - 2 * var(--uiSpacingSmall)) / 3);
			width: var(--width);
			height: calc(var(--width) / var(--aspectRatio));
			overflow: hidden;

			background: #ebeced;
			:host-context([data-theme='dark']) & {
				background: #1b1b1b;
			}

			border: 1px solid transparent;
			border-radius: 10px;

			&:hover {
				border: 1px solid blue;

				:host-context([data-theme='dark']) & {
					border: 1px solid lightblue;
				}
			}

			img {
				pointer-events: none;
				position: relative;
				left: 50%;
				top: -20%;
				transform: translateX(-50%);
				width: 200%;
				height: auto;
			}
		}
	}

	.container {
		max-width: 600px;
		margin: 0 auto;
		background: white;
		padding: 20px;
		border-radius: 16px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.category-tabs {
		display: flex;
		gap: 15px;
		margin-bottom: 16px;
	}

	.category-tab {
		background: transparent;
		padding: 0;
		border: none;
		border-radius: 12px;
		font-size: 14px;
		color: #99999a;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.category-tab.active {
		color: #121316;
	}

	.items-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 10px;
	}

	.item-card {
		aspect-ratio: 1;
		/* Two-layer background: inner fill on padding-box, gradient border on border-box */
		background:
			linear-gradient(#f8f8f8, #f8f8f8) padding-box,
			var(--item-card-border, linear-gradient(#0000, #0000)) border-box;
		border-radius: 12px;
		overflow: hidden;
		cursor: pointer;
		border: 1px solid transparent; /* needed so the border-box layer shows */
		transition:
			transform 0.2s ease,
			background 0.2s ease;
	}

	.item-card:hover {
		transform: scale(1.02);
		--item-card-border: linear-gradient(136.36deg, #e56be8 1.67%, #495cff 100.68%);
	}

	.item-card.active {
		--item-card-border: linear-gradient(136.36deg, #e56be8 1.67%, #495cff 100.68%);
	}

	.item-preview {
		width: 100%;
		height: 100%;
		background: #e0e0e0;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;

		img {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}
	}

	.item-preview.fabric {
		background: linear-gradient(45deg, #ff6b6b, #ffd93d);
	}

	.item-preview.accessory {
		background: linear-gradient(45deg, #6c5ce7, #a29bfe);
	}

	@media (max-width: 768px) {
		.category-tab {
			font-size: 12px;
		}

		.item-card {
			border-radius: 10px;
		}
	}

	#drippy-scene {
		transition: transform 0.2s ease-in-out;
	}

	@media (max-width: 768px) {
		#drippy-scene {
			transform: translateY(-120px);
		}
	}
`
