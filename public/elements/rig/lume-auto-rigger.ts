import {
	attribute,
	booleanAttribute,
	css,
	Element,
	element,
	eventAttribute,
	onCleanup,
	type ElementAttributes,
} from 'lume'

import {GltfModel, type Element3D} from 'lume'

import {_AutoRigger} from './AutoRigger.js'
import {onModelLoad} from '../../utils.js'

type LumeAutoRiggerAttributes = keyof object // no attributes yet

/**
 *
 */
@element
export class LumeAutoRigger extends Element {
	static override readonly elementName = 'lume-auto-rigger'

	/**
	 * Array of bone names to exclude from rigging. All children of the bones are excluded as well.
	 */
	@attribute excludedBones: string[] = []

	@booleanAttribute disabled = false

	@eventAttribute onrig = () => {}
	override connectedCallback() {
		super.connectedCallback()

		// Get the nearest lume-gltf-model ancestor for the rigged model.
		// This is not robust to <slot> composition, but good enough for now.
		let ancestorModel: Element | null | undefined = this.parentElement?.parentElement as Element | null | undefined
		while (ancestorModel && !(ancestorModel instanceof GltfModel))
			ancestorModel = ancestorModel.parentElement as Element | null

		// For now, a particular structure is required: the parent of this
		// element must be the model to rig, and that model must be a
		// descendant of the rigged model.
		// Later on we'll allow meshes in subtrees, and the rigged model to be
		// specified by selector, etc.
		if (!(this.parentElement instanceof GltfModel && ancestorModel instanceof GltfModel)) {
			console.error(
				`<${this.tagName.toLowerCase()}> must be a child of the model to rig, which must be a descendant of the rigged model.`,
			)
			return
		}

		const riggedModel = ancestorModel
		const modelToRig = this.parentElement

		this.createEffect(() => {
			if (this.disabled) return
			if (!modelToRig || !riggedModel) return

			const modelToRigLoaded = onModelLoad(modelToRig)
			const riggedModelLoaded = onModelLoad(riggedModel)

			this.createEffect(() => {
				if (!modelToRigLoaded() || !riggedModelLoaded()) return

				const autoRigger = new _AutoRigger({riggedModel, excludedBones: this.excludedBones})
				autoRigger.rig((modelToRig as Element3D).three)
				onCleanup(() => autoRigger.unrig())

				if (autoRigger.skinnedMeshes.length == 0) return

				this.dispatchEvent(new Event('rig'))
			})
		})
	}
	override css = css /*css*/ `
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
