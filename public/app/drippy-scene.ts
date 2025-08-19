import {css, Element, element, For, html, onCleanup, signal} from 'lume'
import type {Block} from '../types/block.js'
import {store} from './store.js'

const femaleAvatar = new URL('../models/EM-Female.glb', import.meta.url)

@element
export class DrippyScene extends Element {
	static elementName = 'drippy-scene'

	@signal isDark = false

	connectedCallback() {
		super.connectedCallback()

		this.isDark = document.documentElement.dataset.theme === 'dark'

		const onThemeChange = () => (this.isDark = document.documentElement.dataset.theme === 'dark')

		this.createEffect(() => {
			const mo = new MutationObserver(onThemeChange)
			mo.observe(document.documentElement, {attributes: true, attributeFilter: ['data-theme']})
			onCleanup(() => mo.disconnect())
		})
	}

	template = () => html`
		<lume-scene webgl>
			<lume-point-light position="500 -500 500" intensity="2000"></lume-point-light>
			<lume-point-light position="-500 500 -500" intensity="2000"></lume-point-light>
			<lume-point-light position="500 -500 -500" intensity="2000"></lume-point-light>
			<lume-point-light position="-500 500 500" intensity="2000"></lume-point-light>

			<lume-camera-rig
				min-distance="1.5"
				max-distance="8"
				distance="4"
				dolly-speed="0.01"
				position="0 -1 0"
			></lume-camera-rig>

			<lume-box
				visible="false"
				cast-shadow="false"
				size="1 1 1"
				color="skyblue"
				roughness="0.3"
				metalness="0.7"
				mount-point="0.5 0.5 0.5"
			></lume-box>

			<lume-gltf-model src=${femaleAvatar.href}></lume-gltf-model>

			<${For} each=${() => Array.from(store.selectedBlocks.values())}>
				${(item: Block) => html`
					<lume-gltf-model src=${() => item.modelFile.href}></lume-gltf-model>
					${item.category === 'Sleeves'
						? html`<lume-gltf-model src=${() => item.modelFile.href} scale="-1 1 1"></lume-gltf-model>`
						: ''}
				`}
			</>
		</lume-scene>
	`

	css = css/*css*/ `
		:host {
			width: 600px;
			height: 400px;

			touch-action: none;
		}
	`
}
