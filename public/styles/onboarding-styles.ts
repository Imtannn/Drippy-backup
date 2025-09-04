import {css} from 'lume'

export const onboardingStyles = css`
	:host {
		display: block;
		width: 100%;
		height: 100vh;
	}

	.onboarding-flow {
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.onboarding-step {
		max-width: 393px;
		margin: 0 auto;
		padding: var(--uiSpacing);
		text-align: center;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
	}

	.title {
		font-size: var(--fontSizeTextXlMobile);
		font-weight: var(--fontWeightSemiBold);
		padding: 0 var(--uiSpacingMedium);
		color: var(--uiColorPrimaryBlack);
		line-height: var(--lineHeightRelaxed);
		margin: var(--uiSpacingLarge) 0;
	}

	.sub-title {
		font-size: var(--fontSizeTextSm);
		font-weight: var(--fontWeightMedium);
		color: var(--uiColorPrimaryBlack);
	}

	.back-btn-container {
		margin-top: var(--uiSpacing);
	}

	.form-section input,
	button {
		font-size: var(--fontSizeTextSm);
	}

	.form-input {
		width: 100%;
		height: var(--uiSpacingXl);
		padding: var(--uiGap);
		border-radius: var(--borderRadius);
		font-size: var(--fontSizeTextSm);
		margin-bottom: var(--uiGap);
		box-sizing: border-box;
		background: #f8f8f8;
		border: var(--borderWidth) solid #ccc;
		color: #333;
		transition: var(--transitionSlow);
		pointer-events: auto;
	}

	.form-input:focus {
		outline: none;
		border: var(--borderWidth) solid transparent;
		background:
			linear-gradient(white, white) padding-box,
			linear-gradient(45deg, #e56be8, #495cff) border-box;
	}

	.form-input::placeholder {
		color: #999;
	}

	input[type='date']::-webkit-calendar-picker-indicator {
		display: none;
	}

	input[type='date']::-webkit-inner-spin-button,
	input[type='date']::-webkit-outer-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	.btn {
		margin-top: var(--uiSpacing);
		margin-bottom: var(--uiSpacing);
		padding: var(--uiSpacingMedium) var(--fontSizeTextXlMobile);
		border: none;
		border-radius: var(--borderRadius);
		font-size: var(--fontSizeTextSm);
		font-weight: var(--fontWeightSemiBold);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-primary {
		background: #000;
		color: var(--uiColorPrimaryWhite);
		width: 100%;
	}

	.btn-primary:hover {
		background: #333;
	}

	.back-btn-container {
		text-align: left;
	}

	.back-btn {
		background: none;
		border: none;
		font-size: var(--fontSizeTextXlMobile);
		cursor: pointer;
		color: #000;
		padding: var(--uiSpacingSmall);
		border-radius: var(--borderRadiusCircular);
		transition: background-color 0.2s ease;
	}

	.back-btn:hover {
		background-color: rgba(0, 0, 0, 0.1);
	}

	.header-logo {
		width: 56px;
		height: 56px;
		margin: var(--uiSpacing) auto 0px;
		display: block;
	}

	.form-section {
		margin: 0 0 var(--uiSpacingMedium) 0;
	}

	.privacy-note {
		font-size: var(--fontSizeTextMd);
		color: #666;
		margin: var(--uiSpacingTiny) 0 var(--fontSizeTextSm) 0;
		padding: 0;
		text-align: center;
	}

	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	@media (max-width: 480px) {
		.onboarding-step {
			padding: 0px;
		}

		.title {
			font-size: var(--fontSizeTextXlMobile);
			padding: 0;
		}
	}
`
