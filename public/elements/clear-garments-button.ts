import {batch, element, Element, html, type ElementAttributes} from 'lume'
import './icon-button.js'
import {store, updateGarmentsSelectionInUrl} from '../app/store.js'
import {pushHistory} from '../app/history.js'
import {values} from '../utils.js'

@element
export class ClearGarmentsButton extends Element {
	static override readonly elementName = 'clear-garments-button'

	#onClick = () => {
		pushHistory()
		updateGarmentsSelectionInUrl({})
		batch(() => {
			store.selectedTemplates = {}
			store.selectedGarments = {}
		})
	}

	override template = () => html`
		<icon-button
			onclick=${this.#onClick}
			title="Revert outfit"
			style=${() => (values(store.selectedTemplates).length > 0 ? '' : 'display:none')}
		>
			<svg
				width="13"
				height="13"
				viewBox="0 0 24 24"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				stroke="white"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M3 12a9 9 0 1 0 3-6.7" />
				<polyline points="3 3 3 9 9 9" />
			</svg>
		</icon-button>
	`
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			[ClearGarmentsButton.elementName]: ElementAttributes<ClearGarmentsButton, never>
		}
	}
}

declare global {
	interface HTMLElementTagNameMap {
		[ClearGarmentsButton.elementName]: ClearGarmentsButton
	}
}
