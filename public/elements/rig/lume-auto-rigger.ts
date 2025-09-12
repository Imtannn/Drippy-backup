import {
	attribute,
	booleanAttribute,
	css,
	Element,
	element,
	eventAttribute,
	signal,
	untrack,
	type ElementAttributes,
} from 'lume'

import type {Element3D, GltfModel} from 'lume'

import {AutoRigger} from './AutoRigger.js'

function onModelLoad(model: GltfModel, callback: () => void) {
	if (model.behaviors?.get?.('gltf-model')?.model) {
		callback()

		return
	}

	const modelLoad = () => {
		model.off('MODEL_LOAD', modelLoad)

		callback()
	}

	model.on('MODEL_LOAD', modelLoad)
}

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

	@signal private riggedMeshLoaded = false

	@signal private meshToRigLoaded = false

	private meshToRig: Element | null = null

	private riggedMesh: Element | null = null

	private autoRigger: AutoRigger | null = null

	connectedCallback() {
		super.connectedCallback()

		this.createEffect(() => {
			if (!this.parentElement?.parentElement || this.disabled) return

			const meshToRig = this.parentElement
			const riggedMesh = this.parentElement.parentElement

			if (untrack(() => meshToRig == this.meshToRig) && untrack(() => riggedMesh == this.riggedMesh)) return

			this.meshToRig = meshToRig as Element
			this.riggedMesh = riggedMesh as Element

			this.meshToRigLoaded = false
			this.riggedMeshLoaded = false

			// For now, we'll only rig GLTF models.

			if (meshToRig.tagName !== 'LUME-GLTF-MODEL' || riggedMesh.tagName !== 'LUME-GLTF-MODEL') return

			onModelLoad(meshToRig as GltfModel, () => {
				this.meshToRigLoaded = true
			})

			onModelLoad(riggedMesh as GltfModel, () => {
				this.riggedMeshLoaded = true
			})
		})

		this.createEffect(() => {
			if (!this.meshToRigLoaded || !this.riggedMeshLoaded || !this.riggedMesh || !this.meshToRig) return

			this.autoRigger = new AutoRigger({avatar: this.riggedMesh as GltfModel, excludedBones: this.excludedBones})
			this.autoRigger.rig((this.meshToRig as Element3D).three)

			if (this.autoRigger.skinnedMeshes.length == 0) return

			this.dispatchEvent(new Event('rig'))
		})

		this.createEffect(() => {
			if (!this.disabled || !this.autoRigger) return

			this.autoRigger.unrig()
		})
	}

	disconnectedCallback() {
		super.disconnectedCallback()

		if (!this.autoRigger) return

		this.autoRigger.unrig()
	}

	css = css/*css*/ `
		:host {
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
