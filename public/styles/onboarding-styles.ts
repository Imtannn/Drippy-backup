import {css} from 'lume'

export const onboardingStyles = css`
	:host {
		display: block;
		width: 100%;
		height: 100vh;
	}

	.onboarding-flow {
		width: 100%;
		height: min-content;
		display: flex;
		justify-content: center;
		overflow: auto;
	}

	.onboarding-step {
		max-width: 393px;
		padding: var(--uiSpacing);
		text-align: center;
		font-family: var(--fontFamily);
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
		text-align: left;
	}

	.form-section {
		& input,
		& button {
			font-size: var(--fontSizeTextSm);
		}
	}

	.onboarding-step .form-input {
		width: 100%;
		height: var(--uiSpacingXl);
		padding: var(--uiGapSmall);
		border-radius: var(--borderRadius);
		font-size: var(--fontSizeTextSm);
		margin-bottom: var(--uiGap);
		box-sizing: border-box;
		background: #f8f8f8;
		border: var(--borderWidth) solid #ccc;
		color: #333;
		transition: var(--transitionSlow);
		pointer-events: auto;

		&:focus {
			outline: none;
			border: var(--borderWidth) solid transparent;
			background:
				linear-gradient(white, white) padding-box,
				linear-gradient(45deg, #e56be8, #495cff) border-box;
		}

		&:not(:focus) {
			border: var(--borderWidth) solid #ccc;
		}

		&::placeholder {
			color: #999;
		}
	}

	input[type='date'] {
		&::-webkit-calendar-picker-indicator {
			display: none;
		}

		&::-webkit-inner-spin-button,
		&::-webkit-outer-spin-button {
			-webkit-appearance: none;
			margin: 0;
		}
	}

	.btn {
		margin-top: var(--uiSpacingSmall);
		margin-bottom: var(--uiSpacing);
		padding: var(--uiSpacingMedium) var(--fontSizeTextXlMobile);
		border: none;
		border-radius: var(--borderRadius);
		font-size: var(--fontSizeTextSm);
		font-weight: var(--fontWeightSemiBold);
		cursor: pointer;
		transition: all 0.2s ease;

		&.btn-primary {
			background: #000;
			color: var(--uiColorPrimaryWhite);
			width: 100%;

			&:hover {
				background: #333;
			}
		}
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

		&:hover {
			background-color: rgba(0, 0, 0, 0.1);
		}
	}

	.header-logo {
		width: 56px;
		height: 56px;
		margin: var(--uiSpacing) auto 0px;
		display: block;
	}

	.privacy-note {
		font-size: var(--fontSizeTextMd);
		color: #666;
		margin: var(--uiSpacingTiny) 0 var(--fontSizeTextSm) 0;
		padding: 0;
		text-align: center;
	}

	.error-message {
		background: #fee;
		border: var(--borderWidth) solid #f88;
		border-radius: var(--borderRadiusSmall);
		color: #c33;
		font-size: var(--fontSizeTextSm);
		font-weight: var(--fontWeightMedium);
		margin: var(--uiGapSmall) 0;
		padding: var(--uiGapSmall) var(--uiGap);
		text-align: center;
	}

	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
`
