import {createEffect, GltfModel} from 'lume'
import * as THREE from 'three'
import {getArmatureObject, onModelLoad, size} from '../utils.js'

class AvatarBone {
	private restPosition: THREE.Vector3

	private three: THREE.Bone

	constructor(bone: THREE.Bone) {
		this.three = bone

		this.restPosition = new THREE.Vector3()

		bone.getWorldPosition(this.restPosition)
	}

	getRestPosition() {
		return this.restPosition
	}

	getCurrentPosition() {
		const currentPosition = new THREE.Vector3()

		this.three.getWorldPosition(currentPosition)

		return currentPosition
	}
}

interface BoneTarget {
	/**
	 * The bone for `obj` to target.
	 */
	bone: AvatarBone

	/**
	 * The object to update every frame.
	 */
	obj: THREE.Object3D

	/**
	 * Initial position of `obj`.
	 */
	initialPosition: THREE.Vector3
}

interface QueuedBoneTarget {
	boneName: string
	obj: THREE.Object3D
}

/**
 * Helper class/wrapper for using Three's `Skeleton`.
 *
 * This saves all the bone's positions at time of creation, so if the skeleton is animating we can
 * get a bone's rest position at any time.
 *
 * With this, it allows targeting meshes to bones, even if they are targeted during an animation.
 */
export class AvatarSkeleton {
	private skeleton: THREE.Skeleton | null = null

	/**
	 * Mapping of bone names to their corresponding `AvatarBone`.
	 */
	private boneMap: {[name: string]: AvatarBone} = {}

	/**
	 * Map of mesh UUIDs to their corresponding bone to target. This is referenced in the animation
	 * loop.
	 */
	private boneTargets: {[uuid: string]: BoneTarget} = {}

	/**
	 * In the case of a block loading before the avatar, we have this ready to build `boneTargets`
	 * as soon as the avatar loads. Basically a queue for bone targets.
	 */
	private queuedBoneTargets: {[uuid: string]: QueuedBoneTarget} = {}

	private frame = 0

	constructor() {}

	setAvatar(avatar: GltfModel) {
		const avatarLoaded = onModelLoad(avatar)
		createEffect(() => {
			if (!avatarLoaded()) return

			this.skeleton = getArmatureObject(avatar.three)?.skeleton ?? null

			this.boneMap = {}
			this.skeleton?.bones.forEach(bone => {
				this.boneMap[bone.name] = new AvatarBone(bone)
			})

			if (!this.skeleton) return

			for (const uuid in this.queuedBoneTargets) {
				const queuedBoneTarget = this.queuedBoneTargets[uuid]

				const initialPosition = new THREE.Vector3()
				queuedBoneTarget.obj.getWorldPosition(initialPosition)

				this.boneTargets[uuid] = {
					bone: this.boneMap[queuedBoneTarget.boneName],
					obj: queuedBoneTarget.obj,
					initialPosition,
				}
			}

			this.queuedBoneTargets = {}
		})
	}

	get three() {
		return this.skeleton
	}

	getBone(name: string) {
		return this.boneMap[name]
	}

	createBoneTarget(obj: THREE.Object3D, boneName: string) {
		if (!this.skeleton) {
			this.queuedBoneTargets[obj.uuid] = {boneName, obj}

			return
		}

		const initialPosition = new THREE.Vector3()
		obj.getWorldPosition(initialPosition)

		this.boneTargets[obj.uuid] = {bone: this.boneMap[boneName], obj, initialPosition}

		if (!this.frame) this.frame = requestAnimationFrame(this.anim)
	}

	removeBoneTarget(obj: THREE.Object3D) {
		if (!this.skeleton) {
			delete this.queuedBoneTargets[obj.uuid]

			return
		}

		delete this.boneTargets[obj.uuid]
	}

	/**
	 * Stops animation loop and removes all bone targets.
	 */
	cancelTargets() {
		// Set back to original position. This way, we can call `cancelTargets` when animations
		// stop.
		for (const uuid in this.boneTargets) {
			const boneTarget = this.boneTargets[uuid]

			boneTarget.obj.position.copy(boneTarget.initialPosition)
		}

		this.boneTargets = {}

		this.queuedBoneTargets = {}

		cancelAnimationFrame(this.frame)
	}

	private anim = () => {
		if (size(this.boneTargets) == 0) {
			this.frame = 0

			return
		}

		this.frame = requestAnimationFrame(this.anim)

		for (const id in this.boneTargets) {
			const boneTarget = this.boneTargets[id]

			const delta = new THREE.Vector3()
			delta.copy(boneTarget.bone.getRestPosition())
			delta.sub(boneTarget.bone.getCurrentPosition())

			const newPosition = new THREE.Vector3()
			newPosition.copy(boneTarget.initialPosition)
			newPosition.sub(delta)

			boneTarget.obj.position.copy(newPosition)

			boneTarget.obj.updateMatrixWorld()
			boneTarget.obj.updateMatrix()
		}
	}
}
