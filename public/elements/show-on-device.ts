import {Element, html, css, element, attribute} from 'lume'
import type {ElementAttributes} from 'lume'

type ShowOnDeviceAttributes = 'device'

@element
export class ShowOnDevice extends Element {
	static override readonly elementName = 'show-on-device'

	@attribute device: 'mobile' | 'desktop' = 'mobile'
	override template = () => html`
		<div
			classList=${() => ({
				'show-on-mobile': this.device === 'mobile',
				'show-on-desktop': this.device === 'desktop',
			})}
		>
			<slot></slot>
		</div>
	`
	override css = css/*css*/ `
		:host {
			display: contents;
		}

		.show-on-desktop,
		.show-on-mobile {
			display: contents;
		}

		@media (min-width: 767px) {
			.show-on-desktop {
				visibility: visible;
			}
			.show-on-mobile {
				visibility: hidden;
			}
		}

		@media (max-width: 767px) {
			.show-on-desktop {
				visibility: hidden;
			}
			.show-on-mobile {
				visibility: visible;
			}
		}
	`
}

declare global {
	interface HTMLElementTagNameMap {
		'show-on-device': ShowOnDevice
	}
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			'show-on-device': ElementAttributes<ShowOnDevice, ShowOnDeviceAttributes>
		}
	}
}
