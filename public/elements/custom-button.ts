import {attribute, booleanAttribute, css, Element, element, html, type ElementAttributes} from 'lume'

export type CustomButtonAttributes = 'variant' | 'size' | 'disabled' | 'loading'

/**
 * Custom Button Element with different variants and sizes
 * Variants: primary, secondary, outline, ghost
 * Sizes: small, medium, large
 */
@element
export class CustomButton extends Element {
	static readonly elementName = 'custom-button'

	@attribute variant = 'primary' // primary, secondary, outline, ghost
	@attribute size = 'medium' // small, medium, large
	@booleanAttribute disabled = false
	@booleanAttribute loading = false

	template = () => html`
		<button
			class="custom-button"
			classList=${() => ({
				'custom-button--primary': this.variant === 'primary',
				'custom-button--secondary': this.variant === 'secondary',
				'custom-button--outline': this.variant === 'outline',
				'custom-button--ghost': this.variant === 'ghost',
				'custom-button--small text-xs': this.size === 'small',
				'custom-button--medium text-md-1': this.size === 'medium',
				'custom-button--large text-md': this.size === 'large',
				'custom-button--disabled': this.disabled || this.loading,
			})}
			disabled=${() => this.disabled || this.loading}
			onclick=${(e: Event) => this.handleClick(e)}
		>
			${() =>
				this.loading
					? html`
							<span class="custom-button__loading">
								<svg class="custom-button__spinner" viewBox="0 0 24 24">
									<circle
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										stroke-width="2"
										fill="none"
										stroke-dasharray="31.416"
										stroke-dashoffset="31.416"
									>
										<animate
											attributeName="stroke-dasharray"
											dur="2s"
											values="0 31.416;15.708 15.708;0 31.416"
											repeatCount="indefinite"
										/>
										<animate
											attributeName="stroke-dashoffset"
											dur="2s"
											values="0;-15.708;-31.416"
											repeatCount="indefinite"
										/>
									</circle>
								</svg>
							</span>
						`
					: html`
							<span class="custom-button__content">
								<slot></slot>
							</span>
						`}
		</button>
	`

	css = css`
		:host {
			display: inline-block;
		}

		.custom-button {
			font-family: 'Poppins', Helvetica;
			font-weight: var(--fontWeightSemiBold);
			padding: 10px 20px;
			border-radius: 100px;
			border: none;
			cursor: pointer;
			transition: all 0.3s ease;
			letter-spacing: 0;
			display: inline-flex;
			align-items: center;
			justify-content: center;
			gap: 8px;
			position: relative;
			overflow: hidden;
		}

		.custom-button--disabled {
			opacity: 0.6;
			cursor: not-allowed;
		}

		/* Size Variants */
		.custom-button--small {
			padding: 8px 16px;
		}

		.custom-button--medium {
			padding: 10px 20px;
		}

		.custom-button--large {
			padding: 12px 24px;
		}

		/* Style Variants */
		.custom-button--primary {
			background-color: #121316;
			color: #ffffff;
		}

		.custom-button--primary:hover:not(.custom-button--disabled) {
			background-color: var(--uiColorLightPurple);
		}

		.custom-button--secondary {
			background-color: transparent;
			color: #121316;
			border: 1px solid #e0e0e0;
		}

		.custom-button--secondary:hover:not(.custom-button--disabled) {
			background-color: #f5f5f5;
		}

		.custom-button--outline {
			background-color: transparent;
			color: #121316;
			border: 2px solid #121316;
		}

		.custom-button--outline:hover:not(.custom-button--disabled) {
			background-color: #121316;
			color: #ffffff;
		}

		.custom-button--ghost {
			background-color: transparent;
			color: #121316;
		}

		.custom-button--ghost:hover:not(.custom-button--disabled) {
			background-color: #f5f5f5;
		}

		/* Loading State */
		.custom-button__loading {
			display: flex;
			align-items: center;
			justify-content: center;
		}

		.custom-button__spinner {
			width: 20px;
			height: 20px;
			animation: spin 1s linear infinite;
		}

		.custom-button--small .custom-button__spinner {
			width: 16px;
			height: 16px;
		}

		.custom-button--large .custom-button__spinner {
			width: 24px;
			height: 24px;
		}

		@keyframes spin {
			from {
				transform: rotate(0deg);
			}
			to {
				transform: rotate(360deg);
			}
		}

		/* Content */
		.custom-button__content {
			display: flex;
			align-items: center;
			gap: inherit;
		}

		/* Focus styles */
		.custom-button:focus {
			outline: 2px solid #007aff;
			outline-offset: 2px;
		}

		/* Responsive */
		@media (max-width: 768px) {
			.custom-button--large {
				padding: 12px 24px;
			}
		}
	`

	handleClick = (e: Event) => {
		if (this.disabled || this.loading) {
			e.preventDefault()
			return
		}

		// Dispatch custom event
		this.dispatchEvent(
			new CustomEvent('button-click', {
				bubbles: true,
				composed: true,
				detail: {
					variant: this.variant,
					size: this.size,
				},
			}),
		)
	}
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			[CustomButton.elementName]: ElementAttributes<CustomButton, CustomButtonAttributes>
		}
	}
}

declare global {
	interface HTMLElementTagNameMap {
		[CustomButton.elementName]: CustomButton
	}
}
