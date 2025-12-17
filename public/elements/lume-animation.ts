import {
	booleanAttribute,
	createEffect,
	createSignal,
	css,
	Element,
	element,
	Element3D,
	GltfModel,
	onCleanup,
	stringAttribute,
	type ElementAttributes,
} from 'lume'
import * as THREE from 'three'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js'
import {getArmatureObject, onModelLoad} from '../utils.js'

type LumeAnimationAttributes = 'src' | 'clipName' | 'additive' | 'paused'

const gltfLoader = new GLTFLoader()

/**
 * Animation helper element that can be added to a FBX or GLTF model as a child to control its
 * animations.
 */
@element
export class LumeAnimation extends Element {
	static override elementName = 'lume-animation'

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

	/**
	 * Creates a clip action based on `clipName` for the current model.
	 * @returns `null` if clip is not found, or model/clip data is not set.
	 */
	#getClipActionEffect(
		clipName: string | null,
		clips: THREE.AnimationClip[],
		mixer: THREE.AnimationMixer,
	): THREE.AnimationAction | null {
		if (!clipName) return null

		const clip = THREE.AnimationClip.findByName(clips, clipName)
		if (!clip) return null

		return this.additive ? mixer.clipAction(THREE.AnimationUtils.makeClipAdditive(clip)) : mixer.clipAction(clip)
	}
	override connectedCallback() {
		super.connectedCallback()

		this.createEffect(() => {
			// TODO Maybe make this class `Element3D` and use `parentLumeElement` so that it's
			// reactive.
			const parent = this.parentElement
			if (!(parent instanceof GltfModel)) throw new Error('<lume-animation> must be a child of a GltfModel')

			const parentModelLoaded = onModelLoad(parent)

			createEffect(() => {
				if (!parentModelLoaded()) return

				const [clips, setClips] = createSignal<THREE.AnimationClip[]>([])

				// Load animations frome external source.
				createEffect(() => {
					if (!this.src) {
						// If no external source, use parent animations (when they are loaded).
						setClips(this.parentElement!.behaviors?.get?.('gltf-model')?.model?.animations ?? [])
						return
					}

					let cleaned = false

					gltfLoader.load(this.src, loadedModel => {
						if (cleaned) return
						setClips(loadedModel.animations)
						// console.log('Loaded external animations:', clips().map(c => c.name))
					})

					onCleanup(() => (cleaned = true))
				})

				// When animations load, create mixer, clock, and animation action.
				createEffect(() => {
					if (!clips().length) return

					const armatureObject = getArmatureObject((this.parentElement as Element3D).three)
					if (!armatureObject) return

					const mixer = new THREE.AnimationMixer(armatureObject)

					// Update clip if `additive` changes.
					createEffect(() => {
						if (!this.clipName) return

						// TODO: Make this a map of clip actions so they can be cached.
						const clipAction = this.#getClipActionEffect(this.clipName, clips(), mixer)
						const clock = new THREE.Clock()

						let frame = 0

						const anim = () => {
							const delta = clock.getDelta()

							mixer.update(delta)

							const parent = this.parentElement as Element3D

							parent.needsUpdate()
							parent.scene!.needsUpdate()

							frame = requestAnimationFrame(anim)
						}

						// Start/stop animation loop when `paused` or `stopped` changes.
						createEffect(() => {
							if (this.stopped) {
								mixer?.stopAllAction()
								return
							}

							if (this.paused) return

							// not stopped, not paused, anim is running

							clipAction?.startAt(mixer.time).play()

							if (!frame) frame = requestAnimationFrame(anim)
							onCleanup(() => (cancelAnimationFrame(frame), (frame = 0)))
						})

						onCleanup(() => mixer.stopAllAction())
					})
				})
			})
		})
	}
	override css = css/*css*/ `
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