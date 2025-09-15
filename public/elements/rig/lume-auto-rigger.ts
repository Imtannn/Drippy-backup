import {
	attribute,
	booleanAttribute,
	css,
	Element,
	element,
	eventAttribute,
	onCleanup,
	signal,
	type ElementAttributes,
} from 'lume'

import type {Element3D, GltfModel} from 'lume'

import {AutoRigger} from './AutoRigger.js'
import {onModelLoad} from '../../utils.js'

type LumeAutoRiggerAttributes = keyof {}

/**
 *
 */
@element
export class LumeAutoRigger extends Element {
	static elementName = 'lume-auto-rigger'

	/**
	 * Array of bone names to exclude from rigging. All children of the bones are excluded as well.
	 */
	@attribute excludedBones: string[] = []

	@booleanAttribute disabled = false

	@eventAttribute onrig = () => {}

	@signal private meshToRig: Element | null = null
	@signal private riggedMesh: Element | null = null

	connectedCallback() {
		super.connectedCallback()

		if (
			!(
				this.parentElement?.tagName === 'LUME-GLTF-MODEL' &&
				this.parentElement?.parentElement?.tagName === 'LUME-GLTF-MODEL'
			)
		) {
			console.error('LumeAutoRigger must be a child of the model to rig, which must be a child of the rigged model.')
			return
		}

		this.meshToRig = this.parentElement as Element
		this.riggedMesh = this.parentElement.parentElement as Element

		this.createEffect(() => {
			// TODO this depends on the model (src) and needs to re-run if that changes.
			if (this.disabled) return
			if (!this.meshToRig || !this.riggedMesh) return

			const meshToRigLoaded = onModelLoad(this.meshToRig as GltfModel)
			const riggedMeshLoaded = onModelLoad(this.riggedMesh as GltfModel)

			this.createEffect(() => {
				if (!meshToRigLoaded() || !riggedMeshLoaded()) return

				const autoRigger = new AutoRigger({avatar: this.riggedMesh as GltfModel, excludedBones: this.excludedBones})
				autoRigger.rig((this.meshToRig as Element3D).three)
				onCleanup(() => autoRigger.unrig())

				if (autoRigger.skinnedMeshes.length == 0) return

				this.dispatchEvent(new Event('rig'))
			})
		})
	}

	css = css/*css*/ `
		:host {
			display: none;
		}
	`
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			[LumeAutoRigger.elementName]: ElementAttributes<LumeAutoRigger, LumeAutoRiggerAttributes>
		}
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'lume-auto-rigger': LumeAutoRigger
	}
}
