import {element, Element, html} from 'lume'
import {store} from '../app/store.js'

export const appAnims = [
	{id: 'none', name: null, src: null},
	{id: 'idle', name: 'Animation', src: '/models/Idle01.glb'},
]
@element
export class AnimationSelect extends Element {
	override template = () => html`
		<div>
			<select
				id="animation-select"
				onchange=${(ev: any) => {
					store.selectedAnimation = ev.target.value
				}}
				value=${() => store.selectedAnimation}
			>
				${appAnims.map(
					anim => html`
						<option value=${anim.id} selected=${() => store.selectedAnimation === anim.id}>
							${anim.id.charAt(0).toUpperCase() + anim.id.slice(1)}
						</option>
					`,
				)}
			</select>
		</div>
	`
}
