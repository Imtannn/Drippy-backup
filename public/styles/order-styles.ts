import {css} from 'lume'

export const orderStyles = css`
	.order-container {
		padding: var(--uiSpacing);
		padding-top: 0;
		padding-bottom: 5px;
		background: var(--uiColorPrimaryWhite);
	}

	.product-info {
		display: flex;
		align-items: center;
		gap: var(--uiGapLarge);
		margin-bottom: var(--uiSpacingLarge);
	}

	.product-image {
		width: 60px;
		height: 60px;
		border-radius: var(--borderRadius);
		overflow: hidden;
	}

	.product-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.product-details {
		flex: 1;
	}

	.product-name {
		font-size: var(--fontSizeTextSm);
		font-weight: var(--fontWeightSemiBold);
		color: var(--uiColorPrimaryBlack);
		margin: 0 0 var(--uiSpacingTiny) 0;

		:host-context([data-theme='dark']) & {
			color: var(--uiColorPrimaryWhite);
		}
	}

	.product-price {
		font-size: var(--fontSizeTextXs);
		font-weight: var(--fontWeightNormal);
		color: #666;
		margin: 0;

		:host-context([data-theme='dark']) & {
			color: #ccc;
		}
	}

	.quantity-controls {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 80px;
		height: var(--uiSpacingLarge);
		background: #f5f5f5;
		border-radius: var(--borderRadiusPill);
		padding: 0 var(--uiSpacingSmall);

		:host-context([data-theme='dark']) & {
			background: #2a2a2a;
		}
	}

	.quantity-btn {
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: var(--fontSizeTextSm);
		font-weight: var(--fontWeightMedium);
		transition: var(--transitionSlow);
		user-select: none;
		color: var(--uiColorPrimaryBlack);

		:host-context([data-theme='dark']) & {
			color: var(--uiColorPrimaryWhite);
		}
	}

	.quantity-btn:hover {
		opacity: 0.7;
	}

	.quantity-btn:active {
		transform: scale(0.95);
	}

	.quantity {
		font-size: 14px;
		font-weight: 600;
		text-align: center;
		user-select: none;
		flex: 1;
		color: #000;

		:host-context([data-theme='dark']) & {
			color: #fff;
		}
	}

	.size-section {
		margin-bottom: 30px;
	}

	.size-options {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}

	.size-btn {
		padding: 8px 16px;
		border: 1px solid #ddd;
		background: #f5f5f5;
		border-radius: 20px;
		cursor: pointer;
		font-size: 12px;
		font-weight: 400;
		transition: all 0.2s;
		color: #000;

		:host-context([data-theme='dark']) & {
			background: #2a2a2a;
			border-color: #444;
			color: #fff;
		}
	}

	.size-btn:hover:not(.selected) {
		background: #f5f5f5;
		border-color: #bbb;

		:host-context([data-theme='dark']) & {
			background: #3a3a3a;
			border-color: #555;
		}
	}

	.size-btn.selected {
		background: #000;
		color: white;
		border-color: #000;

		:host-context([data-theme='dark']) & {
			background: #fff;
			color: #000;
			border-color: #fff;
		}
	}

	.size-btn.custom {
		position: relative;
		background: linear-gradient(136deg, #e56be8 1.67%, #495cff 100.68%);
		background-clip: text;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		border: none;
	}

	.size-btn.custom::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(136deg, #e56be8 1.67%, #495cff 100.68%);
		border-radius: 20px;
		z-index: -1;
	}

	.size-btn.custom::after {
		content: '';
		position: absolute;
		top: 1px;
		left: 1px;
		right: 1px;
		bottom: 1px;
		background: white;
		border-radius: 19px;
		z-index: -1;
	}

	.size-btn.custom:active {
		opacity: 0.8;
		transition: opacity 0.1s ease;
	}

	.size-btn.custom:hover {
		opacity: 0.9;
		transform: translateY(-1px);
	}

	.size-btn.custom.selected {
		background: linear-gradient(136deg, #e56be8 1.67%, #495cff 100.68%);
		color: white;
		border-color: transparent;
		-webkit-text-fill-color: white;
		background-clip: unset;
	}

	.shipping-section {
		margin-bottom: 30px;
	}

	/* Dark mode for order button */
	.order-button {
		:host-context([data-theme='dark']) & {
			background: #fff;
			color: #000;
		}
	}

	.quantity-btn {
		width: var(--icon-button-size);
		height: var(--icon-button-size);
		border: 1px solid var(--color-border);
		background: var(--color-background);
		border-radius: 50%;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 18px;
	}

	.size-btn.selected {
		background: #000;
		color: white;
		border-color: #000;
	}

	.shipping-section {
		margin-bottom: 30px;
	}

	/* Loading spinner */
	.loading-spinner {
		width: 16px;
		height: 16px;
		border: 2px solid #ffffff40;
		border-top: 2px solid #ffffff;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-right: 8px;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.order-button:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.error-message {
		margin-top: 10px;
		padding: 10px;
		background: #fee2e2;
		color: #dc2626;
		border-radius: 8px;
		font-size: 14px;
		text-align: center;

		:host-context([data-theme='dark']) & {
			background: #7f1d1d;
			color: #fca5a5;
		}
	}
`
