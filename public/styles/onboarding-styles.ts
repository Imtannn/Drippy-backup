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
		padding: 19.5px;
		text-align: center;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
	}

	.title {
		font-size: 24px;
		font-weight: 600;
		padding: 0 15px;
		color: #121316;
		line-height: 1.4;
		margin: 30px 0;
	}

	.sub-title {
		font-size: 14px;
		font-weight: 500;
		color: #121316;
	}

	.back-btn-container {
		margin-top: 20px;
	}

	.email-section {
		margin-top: 20px;
		margin-bottom: 20px;
	}

	.email-section input,
	button {
		font-size: 14px;
	}

	.form-section input,
	button {
		font-size: 14px;
	}

	.form-input {
		width: 100%;
		height: 40px;
		padding: 10px;
		border-radius: 10px;
		font-size: 14px;
		margin-bottom: 10px;
		box-sizing: border-box;
		background: #f8f8f8;
		border: 1px solid #ccc;
		color: #333;
		transition: all 0.3s ease;
		pointer-events: auto;
	}

	.form-input:focus {
		outline: none;
		border: 1px solid transparent;
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
		margin-top: 20px;
		margin-bottom: 20px;
		padding: 12px 24px;
		border: none;
		border-radius: 10px;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-primary {
		background: #000;
		color: white;
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
		font-size: 24px;
		cursor: pointer;
		color: #000;
		padding: 8px;
		border-radius: 50%;
		transition: background-color 0.2s ease;
	}

	.back-btn:hover {
		background-color: rgba(0, 0, 0, 0.1);
	}

	.header-logo {
		width: 56px;
		height: 56px;
		margin: 20px auto 0px;
		display: block;
	}

	.form-section {
		margin: 0 0 15px 0;
	}

	.privacy-note {
		font-size: 16px;
		color: #666;
		margin: 6px 0 14px 0;
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
			font-size: 24px;
			padding: 0;
		}
	}
`
