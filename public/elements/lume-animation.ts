import {
	booleanAttribute,
	css,
	Element,
	element,
	Element3D,
	signal,
	stringAttribute,
	untrack,
	type ElementAttributes,
} from 'lume'
import * as THREE from 'three'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js'

type LumeAnimationAttributes = 'src' | 'clipName' | 'additive' | 'paused'

const gltfLoader = new GLTFLoader()

/**
 * Animation helper element that can be added to a FBX or GLTF model as a child to control its
 * animations.
 */
@element
export class LumeAnimation extends Element {
	static elementName = 'lume-animation'

	/**
	 * Optional file to load animation from. If not set, the parent Lume element's animations will
	 * be searched instead.
	 */
	@stringAttribute src: string | null = null

	/**
	 * Name of the animation clip to play.
	 */
	@stringAttribute clipName: string | null = null

	/**
	 * Use additive blending.
	 */
	@booleanAttribute additive = false

	/**
	 * If `true`, animations will not be played.
	 */
	@booleanAttribute paused = false

	/**
	 * If `true`, animations will be stopped.
	 */
	@booleanAttribute stopped = false

	// TODO: Add attributes like `blending`, `time`, `mixer`, etc.

	@signal isParentModelLoaded = false

	@signal clips: THREE.AnimationClip[] = []

	#mixer: THREE.AnimationMixer | null = null

	#clock = new THREE.Clock()

	// TODO: Make this a map of clip actions so they can be cached.
	#clipAction: THREE.AnimationAction | null = null

	#frame = 0

	/**
	 * Creates a clip action based on `clipName` for the current model.
	 * @returns `null` if clip is not found, or model/clip data is not set.
	 */
	#getClipAction() {
		this.clips
		if (!this.clipName || !this.#mixer) return null

		const clip = THREE.AnimationClip.findByName(this.clips, this.clipName)
		if (!clip) return null

		return this.additive
			? this.#mixer.clipAction(THREE.AnimationUtils.makeClipAdditive(clip))
			: this.#mixer.clipAction(clip)
	}

	connectedCallback() {
		super.connectedCallback()

		this.isParentModelLoaded = false

		this.clips = []

		this.#mixer = null

		this.#clipAction = null

		// Monitor parent's load state.
		this.createEffect(() => {
			// TODO Maybe make this class `Element3D` and use `parentLumeElement` so that it's
			// reactive.
			const parent = this.parentElement as any
			const model = parent?.behaviors?.get?.('gltf-model')?.model

			if (model) {
				this.isParentModelLoaded = true
			} else {
				this.isParentModelLoaded = false
				parent?.on?.('MODEL_LOAD', () => {
					this.isParentModelLoaded = true
				})
			}
		})

		// Load animations frome external source.
		this.createEffect(() => {
			if (!this.src) return

			gltfLoader.load(this.src, loadedModel => {
				this.clips = loadedModel.animations
			})
		})

		// If no external source, use parent animations (when they are loaded).
		this.createEffect(() => {
			if (this.isParentModelLoaded && !this.src) {
				this.clips = this.parentElement!.behaviors?.get?.('gltf-model')?.model?.animations ?? []
			}
		})

		this.#frame = 0
		const anim = () => {
			this.#frame = requestAnimationFrame(anim)

			// This will keep the animation loop active as long as `paused` is false.
			if (!this.#mixer || !this.#clipAction || this.clips.length == 0) return

			const delta = this.#clock.getDelta()

			this.#mixer.update(delta)

			const parent = this.parentElement as Element3D

			parent.needsUpdate()
			parent.scene!.needsUpdate()
		}

		// When animations load, create mixer, clock, and animation action.
		this.createEffect(() => {
			this.clips
			this.clips.length

			if (!this.isParentModelLoaded) return

			if (this.#mixer) this.#mixer.stopAllAction()

			this.#mixer = new THREE.AnimationMixer((this.parentElement as Element3D).three)

			this.#clock = new THREE.Clock()

			if (!this.clipName) {
				this.#clipAction = null

				return
			}

			// Untrack `additive` since it exclusively will update the clip action in another
			// effect.
			const clipAction = untrack(() => this.#getClipAction())
			this.#clipAction = clipAction

			if (untrack(() => !this.paused && !this.stopped)) clipAction?.startAt(this.#mixer.time).play()
		})

		// Update clip if `additive` changes.
		this.createEffect(() => {
			this.#clipAction = this.#getClipAction()
		})

		// Start/stop animation loop when `paused` or `stopped` changes.
		this.createEffect(() => {
			if (this.stopped) {
				this.#mixer?.stopAllAction()

				return
			}

			if (!this.paused) {
				if (!this.#frame) {
					untrack(() => {
						this.#frame = requestAnimationFrame(anim)
					})
				}

				if (this.#mixer) this.#clipAction?.startAt(this.#mixer.time).play()
			} else if (this.#frame) {
				cancelAnimationFrame(this.#frame)

				this.#frame = 0
			}
		})
	}

	disconnectedCallback() {
		super.disconnectedCallback()

		cancelAnimationFrame(this.#frame)

		this.#frame = 0
	}

	css = css/*css*/ `
		:host {
		}
	`
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			[LumeAnimation.elementName]: ElementAttributes<LumeAnimation, LumeAnimationAttributes>
		}
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'lume-animation': LumeAnimation
	}
}
