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
			title="Clear all garments"
			style=${() => (values(store.selectedTemplates).length > 0 ? '' : 'display:none')}
		>
			<svg width="12" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M3 6h18"/>
				<path d="M8 6V4h8v2"/>
				<path d="M19 6l-1 14H6L5 6"/>
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
