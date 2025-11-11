import {attribute, css, Element, element, html, signal, type ElementAttributes} from 'lume'
import type {Template} from '../types/template.js'
import {blockManager} from './block-manager.js'
import {store} from './store.js'

type TemplateItemOverlayAttributes = 'selectedTemplate'

@element
export class TemplateItemOverlay extends Element {
	static readonly elementName = 'template-item-overlay'

	@attribute selectedTemplate: Template | null = null

	@signal isRemixAvailable = false

	connectedCallback() {
		super.connectedCallback()

		// Check if remix is available for this template
		this.createEffect(() => {
			if (!this.selectedTemplate) {
				this.isRemixAvailable = false
				return
			}

			const {available} = blockManager.isRemixAvailableForTemplate(this.selectedTemplate, {
				selectedBlocks: store.selectedBlocks,
				selectedSpace: store.getEffectiveSpace(),
				sourceCollection: store.getEffectiveCollection(),
			})

			this.isRemixAvailable = available
		})

		this.createEffect(() => {
			void this.selectedTemplate
			this.scrollTo({top: 0, behavior: 'instant'})
		})
	}

	#onUnselectClick = () => {
		if (!this.selectedTemplate) return

		// Unselect the template
		store.unselectTemplate = this.selectedTemplate

		// Dispatch close event
		this.dispatchEvent(new CustomEvent('close', {bubbles: true}))
	}

	#onRemixClick = () => {
		if (!this.selectedTemplate) return

		// Open remix overlay
		this.dispatchEvent(
			new CustomEvent('remix', {
				detail: {template: this.selectedTemplate},
				bubbles: true,
			}),
		)
	}

	template = () => html`
		<div class="overlay-container">
			<button class="overlay-button unselect-button" onclick=${this.#onUnselectClick}>Unselect</button>
			${() =>
				this.isRemixAvailable
					? html`
							<button class="overlay-button remix-button" onclick=${this.#onRemixClick}>
								<svg width="13" height="10" viewBox="0 0 13 10" fill="none" xmlns="http://www.w3.org/2000/svg">
									<mask
										id="mask0_23200_10107"
										style="mask-type:luminance"
										maskUnits="userSpaceOnUse"
										x="6"
										y="5"
										width="7"
										height="5"
									>
										<path d="M6.69775 5.42993H12.4998V9.7256H6.69775V5.42993Z" fill="white" />
									</mask>
									<g mask="url(#mask0_23200_10107)">
										<path
											d="M11.0467 6.37526C10.8687 6.19725 10.5738 6.2077 10.4094 6.40653C10.2661 6.57986 10.2918 6.83815 10.4508 6.99718L11.1187 7.6652H10.4796C9.42741 7.6652 8.42189 7.0651 7.64839 5.97538L7.28976 5.47008C7.25542 5.42176 7.18366 5.42176 7.14932 5.47008L6.72684 6.06527C6.70564 6.09507 6.70564 6.1351 6.72684 6.16491L6.94618 6.47391C7.88571 7.79742 9.14061 8.52636 10.4796 8.52636H10.9023L10.4523 8.97642C10.2788 9.14997 10.2694 9.44345 10.449 9.61071C10.5315 9.68761 10.6368 9.72603 10.7422 9.72603C10.8524 9.72603 10.9626 9.684 11.0467 9.59987L12.3545 8.29204C12.5226 8.12386 12.5226 7.85128 12.3545 7.6831L11.0467 6.37526Z"
											fill="white"
										/>
									</g>
									<path
										d="M10.1421 2.43977H11.0099L10.4518 2.998C10.2783 3.17155 10.2689 3.46503 10.4484 3.63228C10.531 3.70919 10.6363 3.7476 10.7416 3.7476C10.8519 3.7476 10.9621 3.70558 11.0461 3.62145L12.3539 2.31362C12.522 2.14544 12.522 1.87285 12.3539 1.70468L11.0593 0.40998C10.9003 0.250946 10.642 0.225132 10.4686 0.368339C10.2696 0.532596 10.2592 0.827768 10.4372 1.00578L11.0099 1.57861H10.1421C8.65284 1.57861 7.2114 2.40588 6.18729 3.84855L6.16301 3.88274L6.13874 3.84848C5.1147 2.40596 3.67326 1.57861 2.18396 1.57861H0.949028C0.724154 1.57861 0.523326 1.74302 0.502045 1.96697C0.477537 2.2238 0.678902 2.43977 0.93059 2.43977H2.18396C3.39061 2.43977 4.57614 3.13498 5.43653 4.34709L5.63498 4.62667L5.05554 5.44296L4.67832 5.97445C4.64797 6.01725 4.61663 6.05789 4.58551 6.09914C4.10542 6.73681 3.54288 7.19255 2.93879 7.44194C2.58615 7.58753 2.21968 7.6642 1.84714 7.6642H0.93059C0.722464 7.6642 0.54891 7.81186 0.508729 8.00808C0.500509 8.04826 0.497896 8.09052 0.501738 8.134C0.521559 8.3588 0.721234 8.52551 0.946954 8.52551H1.84714C2.60466 8.52551 3.33514 8.29181 3.99701 7.84943C4.505 7.50993 4.97257 7.04773 5.38052 6.47299L6.88957 4.34709C7.74996 3.13498 8.93549 2.43977 10.1421 2.43977Z"
										fill="white"
									/>
								</svg>
								Remix
							</button>
						`
					: null}
		</div>
	`

	css = css/*css*/ `
		:host {
			position: absolute;
			top: 0;
			z-index: 5;
			pointer-events: auto;
			width: 100%;
			height: 100%;
			background: #12131680;
			border: 0px solid transparent;
			border-radius: 12px;
		}

		.overlay-container {
			display: flex;
			flex-direction: column;
			gap: var(--uiSpacingSmall);
			justify-content: center;
			align-items: center;
			height: 100%;
			width: 100%;
		}

		.overlay-button {
			padding: var(--uiSpacingSmall) var(--uiSpacingMedium);
			border-radius: 999px;
			border: none;
			font-size: var(--fontSizeTextXs);
			cursor: pointer;
			transition: var(--transitionFast);
			min-width: 60px;
			max-width: 80px;
			white-space: nowrap;
			width: 80%;
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 2px;
		}

		.unselect-button {
			background: var(--uiColorPrimaryWhite);
			color: var(--uiColorPrimaryBlack);
			border: 1px solid var(--uiColorBorderColor);
		}

		.remix-button {
			font-weight: var(--fontWeightSemiBold);
			background: var(--uiColorAccentViolet);
			color: var(--uiColorPrimaryWhite);
		}
	`
}

declare global {
	interface HTMLElementTagNameMap {
		'template-item-overlay': TemplateItemOverlay
	}
}

declare module 'lume' {
	interface IntrinsicElements {
		'template-item-overlay': ElementAttributes<TemplateItemOverlay, TemplateItemOverlayAttributes>
	}
}
