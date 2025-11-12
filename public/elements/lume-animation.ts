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
import {getArmatureObject, nodesOfTrees, object3DsInTree, onModelLoad} from '../utils.js'

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

	connectedCallback() {
		super.connectedCallback()

		this.createEffect(() => {
			// TODO Maybe make this class `Element3D` and use `parentLumeElement` so that it's
			// reactive.
			const parent = this.parentElement
			if (!(parent instanceof GltfModel)) throw new Error('<lume-animation> must be a child of a GltfModel')

			const parentModelLoaded = onModelLoad(parent)

			const grandParent = this.parentElement?.parentElement?.parentElement as GltfModel | null
			console.log('grandParent is', grandParent)
			// if (!(grandParent instanceof GltfModel))
			// 	throw new Error('<lume-animation> must be a grand grand child of a GltfModel')

			const grandParentModelLoaded = grandParent ? onModelLoad(grandParent) : () => true

			createEffect(() => {
				if (!parentModelLoaded() && !grandParentModelLoaded()) return

				// WIP: Try to make parent (clothes) use grandparent (avatar) skeleton.
				const attemptToUseGrandParentSkeleton = false

				if (attemptToUseGrandParentSkeleton && grandParent) {
					console.log(' $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ checking grand parent vs parent bones...')

					let grandParentRootBone
					for (const node of object3DsInTree(grandParent.three)) {
						if (node.type !== 'Bone') continue
						grandParentRootBone = node as THREE.Bone
						break
					}
					let parentRootBone
					for (const node of object3DsInTree(parent.three)) {
						if (node.type !== 'Bone') continue
						parentRootBone = node as THREE.Bone
						break
					}

					if (!grandParentRootBone || !parentRootBone) throw new Error('<lume-animation> could not find skeletons')

					for (const [gpBone, pBone] of nodesOfTrees(grandParentRootBone, parentRootBone)) {
						console.log(' ################### ')
						console.log('matching bones:', gpBone.name, pBone.name)

						if (gpBone.name !== pBone.name) {
							throw new Error(
								'⚠️ Bone name mismatch between grand parent and parent: ' + gpBone.name + ' != ' + pBone.name,
							)
						}
					}

					let grandParentSkeleton
					let grandParentSkeletonBindMatrix
					for (const node of object3DsInTree(grandParent.three)) {
						if (node.type !== 'SkinnedMesh') continue
						const skinnedMesh = node as THREE.SkinnedMesh
						grandParentSkeleton = skinnedMesh.skeleton
						grandParentSkeletonBindMatrix = skinnedMesh.bindMatrix
						break
					}

					if (!grandParentSkeleton) throw new Error('No grandparent skeleton')

					// Ref: https://www.google.com/search?q=threejs+make+mesh+use+skeleton+from+other+mesh&gs_lcrp=EgRlZGdlKgYIABBFGDkyBggAEEUYOTIKCAEQABiABBiiBDIKCAIQABiABBiiBDIKCAMQABiiBBiJBTIHCAQQABjvBTIKCAUQABiABBiiBDIHCAYQ6wcYQNIBCDY3NjlqMGoxqAIAsAIA&sourceid=chrome&ie=UTF-8&udm=50&fbs=AIIjpHxU7SXXniUZfeShr2fp4giZud1z6kQpMfoEdCJxnpm_3W-pLdZZVzNY_L9_ftx08kwv-_tUbRt8pOUS8_MjaceHuSAD6YvWZ0rfFzwmtmaBgLepZn2IJkVH-w3cPU5sPVz9l1Pp06apNShUnFfpGUJOF8p91U6HxH3ukND0OVTTVy0CGuHNdViLZqynGb0mLSRGeGVO46qnJ_2yk3F0uV6R6BW9rQ&ved=2ahUKEwictNq22Y2QAxW4JkQIHdZnC1sQ0NsOegQIMBAA&aep=10&ntc=1&mtid=qsDiaKTkLeTCkPIPotmUwAU&mstk=AUtExfAbqLBFqPjljtxim23XXfJRKcaHECya5zMP6EwJ1-YsJZ0mJ9Iy9zh5f2m8hW7kIhTyoRFyyCmCvYXNZSmWw9jdeewg4dWLhkzQ9Gdvp8o1xqoMyMsH8hy7ubRzrtU_ESQO0YHDMxKmQZs1CIg49gDi-lgq9LN4HYLew0nAbOlEkeZ3DyypKRo0MG4sw4ywjLtAIiFGHCRFgPYjX4-q5usRusOMT8XPVfflrQbMumKU_wh_p-9xilEIhAYZdah3jT90yoXA4gzByw&csuir=1

					// Make the parent (clothes) uses the grand parent skeleton (avatar).
					for (const node of object3DsInTree(parent.three)) {
						if (node.type !== 'SkinnedMesh') continue
						const skinnedMesh = node as THREE.SkinnedMesh
						skinnedMesh.skeleton = grandParentSkeleton

						// Is this needed? If is it not needed if the skeletons
						// are already the same? Is it needed because the
						// skinned meshes differ?
						//
						// skinnedMesh.bind(grandParentSkeleton, grandParentSkeletonBindMatrix)
						//
						// Not sure if we need the grandParentSkeletonBindMatrix.
						remapAndBindSkeleton(skinnedMesh, grandParentSkeleton, grandParentSkeletonBindMatrix)

						console.log('*** Rebound skinned mesh to grand parent skeleton:', skinnedMesh)
					}

					return // Exit, The grand parent's <lume-animation> handles animating the skeleton.
				}

				console.log('********** Using parent model animations for <lume-animation>', parent.id)

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

/**
 * Applies the given skeleton to the skinned mesh, remapping bones if necessary.
 * @param skinnedMesh The skinned mesh to bind a skeleton to.
 * @param skeletonToBind The skeleton to bind to the skinned mesh.
 * @param bindMatrix Optional bind matrix to use when binding the skeleton.
 */
function remapAndBindSkeleton(
	skinnedMesh: THREE.SkinnedMesh,
	skeletonToBind: THREE.Skeleton,
	bindMatrix?: THREE.Matrix4,
) {
	// 1. Build a map of the target skeleton's bones by name for easy lookup
	const boneMap: Record<string, THREE.Bone> = {}
	for (const bone of skeletonToBind.bones) boneMap[bone.name] = bone

	// 2. Create a new bones array based on the target skeleton's order
	const newBones: THREE.Bone[] = []

	for (const bone of skinnedMesh.skeleton.bones) {
		const targetBone = boneMap[bone.name]
		if (targetBone) newBones.push(targetBone)
		else console.warn(`Bone '${bone.name}' not found in target skeleton. Animation may be incorrect.`)
	}

	// 3. Update the skinned mesh's bone references
	skinnedMesh.skeleton.bones = newBones

	// 4. Update the skeleton's internal structure
	skinnedMesh.skeleton.update()

	// 5. Re-bind the target skeleton to the skinned mesh
	// Do we need the bind matrix?
	skinnedMesh.bind(skeletonToBind, bindMatrix)
}
