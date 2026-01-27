import {attribute, batch, booleanAttribute, css, Element, element, html, type ElementAttributes} from 'lume'
import {store} from '../app/store.js'
import {avatars} from '../consts/avatars.js'
import type {Template} from '../types/template.js'

import '../app/item-card.js'
import './bottom-sheet.js'
import './logic/for-each.js'
import './logic/show-when.js'

type AvatarSwapBottomSheetAttributes = 'open' | 'selectedTemplate'

@element
export class AvatarSwapBottomSheet extends Element {
	static override readonly elementName = 'avatar-swap-bottom-sheet'

	@booleanAttribute open = false
	@attribute selectedTemplate: Template | null = null
	@attribute selectedGender: 'male' | 'female' = 'male'
	override connectedCallback() {
		super.connectedCallback()

		// Set the selected gender based on the template when it changes
		this.createEffect(() => {
			if (this.selectedTemplate) this.selectedGender = this.selectedTemplate.avatar
		})
	}

	#getTargetGender = () => {
		return this.selectedTemplate?.avatar || 'male'
	}

	#getBrandName = () => {
		return store.selectedSpace?.description || ''
	}

	#getCollectionName = () => {
		return store.selectedSpace?.name || ''
	}

	#getTargetAvatars = () => {
		const targetGender = this.#getTargetGender()
		return avatars().filter(avatar => avatar.gender === targetGender)
	}

	#selectFirstAvatar = () => {
		const firstAvatar = this.#getTargetAvatars()[0]
		if (firstAvatar) this.#onAvatarSelect({detail: {itemValue: firstAvatar.name}} as CustomEvent)
	}

	#onClose = () => {
		this.open = false
		this.selectedTemplate = null
	}

	#onAvatarSelect = (e: CustomEvent) => {
		const avatarName = e.detail.itemValue as string

		batch(() => {
			// Update the selected avatar
			store.selectedAvatar = avatarName

			// Close the bottom sheet
			this.#onClose()

			// Dispatch event to continue with template selection
			this.dispatchEvent(
				new CustomEvent('avatar-swapped', {
					detail: {
						template: this.selectedTemplate,
						newAvatar: avatarName,
					},
					bubbles: true,
				}),
			)
		})
	}

	#onCancel = () => {
		this.#onClose()
	}

	#onModalClick = (e: Event) => {
		e.stopPropagation()
	}
	override template = () => html`
		<show-when
			condition=${() => this.open && !!this.selectedTemplate}
			content=${() => html`
				<div class="overlay" onclick=${this.#onCancel}></div>
				<bottom-sheet onclick=${this.#onModalClick} default-snap="0.6">
					<div class="modal-content">
						<div class="header">
							<h2>Switch avatar</h2>
							<p>
								You need to switch to ${() => this.#getTargetGender()} avatar to try on garments from${' '}
								<strong>${() => this.#getCollectionName()}</strong> by <strong>${() => this.#getBrandName()}</strong>
							</p>
						</div>

						<div class="actions">
							<button class="select-button" onclick=${this.#selectFirstAvatar}>
								Select a ${() => this.#getTargetGender()} avatar
							</button>
						</div>
					</div>
				</bottom-sheet>
			`}
		></show-when>
	`
	override css = css`
		:host {
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			z-index: 1000;
			display: flex;
			align-items: center;
			justify-content: center;
			pointer-events: none;
		}

		:host([open]) {
			pointer-events: auto;
		}

		.overlay {
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background: rgba(0, 0, 0, 0.5);
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 1rem;
			pointer-events: auto;
		}

		.modal-content {
			padding: var(--uiSpacing);
			pointer-events: auto;
			display: flex;
			flex-direction: column;
			gap: var(--uiSpacing);
			height: calc(100% - var(--uiSpacing) - 15px);
		}

		.header {
			flex: 1;
			text-align: center;
			margin-bottom: var(--uiSpacing);
		}

		.header h2 {
			font-size: var(--fontSizeTextLgTablet);
			font-weight: var(--fontWeightBold);
			color: var(--uiColorPrimaryBlack);
			margin: 0 0 0.5rem 0;
		}

		.header p {
			font-size: var(--fontSizeTextSm);
			color: var(--uiColorPrimaryBlack);
			font-weight: var(--fontWeightSemiBold);
			margin: 0;
			line-height: 1.5;
		}

		.actions {
			display: flex;
			justify-content: center;
		}

		.select-button {
			background: #1f2937;
			color: white;
			border: none;
			border-radius: 2rem;
			padding: 0.875rem 2rem;
			font-size: 0.875rem;
			font-weight: 500;
			cursor: pointer;
			transition: background-color 0.2s;
			width: 100%;
		}

		.select-button:hover {
			background: #374151;
		}

		.select-button:active {
			background: #111827;
		}

		/* Desktop styles */
		@media (min-width: 768px) {
			.header {
				flex: unset;
			}
		}
	`
}

declare global {
	interface HTMLElementTagNameMap {
		'avatar-swap-bottom-sheet': AvatarSwapBottomSheet
	}
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			'avatar-swap-bottom-sheet': ElementAttributes<AvatarSwapBottomSheet, AvatarSwapBottomSheetAttributes>
		}
	}
}
