import {element, Element, html} from 'lume'
import {store} from '../app/store.js'

@element
export class AnimationSelect extends Element {
	template = () =>
		html`<div>
			<select
				id="animation-select"
				onchange=${(ev: any) => {
					store.selectedAnimation = ev.target.value
				}}
			>
				<option value="none">None</option>
				<option value="walk">Walk</option>
				<option value="dance">Dance</option>
			</select>
		</div>`
}
