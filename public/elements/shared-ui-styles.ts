import {css} from 'lume'

/**
 * Shared UI styles that can be reused across components
 */
export const sharedUIStyles = css`
	/* Container and Layout */
	.preview-container {
		width: 100%;
		height: 100vh;
		position: relative;
		overflow: hidden;
		background-image: url('../images/background.jpg');
		background-size: cover;
		background-position: center;
		background-attachment: fixed;
	}

	.content-wrapper {
		display: flex;
		height: 100vh;
		position: relative;
	}

	.scene-area {
		flex: 1;
		background: transparent;
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

	/* Panel Base Styles */
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

	/* Mobile Layout */
	@media (width < 720px) {
		.content-wrapper {
			flex-direction: column;
		}

		.scene-area {
			height: 50vh;
		}

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
`
