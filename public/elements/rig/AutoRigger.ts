import type {GltfModel} from 'lume'
import type {Object3D} from 'three'
import * as THREE from 'three'
import {findInTree} from '../../utils.js'

/**
 * Gets a list of child bones of `name`.
 * @param name Name of bone
 */
function getChildBoneNames(name: string, root: THREE.Bone) {
	const boneNames: string[] = []

	root.getObjectByName(name)?.traverse((child: Object3D) => {
		boneNames.push(child.name)
	})

	return boneNames
}

function getSkeleton(avatar: GltfModel) {
	const johnSkelton = findInTree(avatar.three, obj => obj instanceof THREE.SkinnedMesh) as THREE.SkinnedMesh | null
	return johnSkelton?.skeleton
}

function makeSkinnedMesh(mesh: THREE.Mesh, skeleton: THREE.Skeleton) {
	// Create a new SkinnedMesh
	const skinned = new THREE.SkinnedMesh(mesh.geometry, mesh.material)

	// Copy transform
	skinned.position.copy(mesh.position)
	skinned.quaternion.copy(mesh.quaternion)
	skinned.scale.copy(mesh.scale)

	// Preserve name
	skinned.name = mesh.name

	// Bind skeleton
	skinned.bind(skeleton)

	return skinned
}

interface AutoRiggerParams {
	/**
	 * A model with a rig (skeleton).
	 */
	riggedModel: GltfModel

	/**
	 * Array of bone names to exclude from rigging (also excludes each bone's children).
	 */
	excludedBones?: string[]

	/**
	 * Maximum distance from a vertex to a bone to have a non-zero weight. Any bone with a distance
	 * further than this to a vertex will automatically have a weight of 0.
	 */
	maxBoneDist?: number
}

/**
 * This is internal, containing implementation details of the <lume-auto-rigger>
 * element, separating the rigging logic from the element definition.
 */
export class _AutoRigger {
	#skinnedMeshes: THREE.SkinnedMesh[] = []

	get skinnedMeshes(): readonly THREE.SkinnedMesh[] {
		return this.#skinnedMeshes
	}

	#riggedModel: GltfModel

	#skeleton: THREE.Skeleton | null = null

	#excludedBones: string[] = []

	#maxBoneDist = -1

	#originalMeshes: THREE.Mesh[] = []

	constructor(params: AutoRiggerParams) {
		this.#riggedModel = params.riggedModel

		this.#skeleton = getSkeleton(this.#riggedModel) ?? null

		this.#excludedBones = params.excludedBones?.flatMap(val => getChildBoneNames(val, this.#skeleton!.bones[0])) ?? []

		this.#maxBoneDist = params.maxBoneDist ?? -1
	}

	/**
	 * Attempts to automatically rig `item` to the avatar.
	 * @param item The garment to rig to the avatar. This doesn't have to be a mesh itself, it
	 * could also have children that are meshes.
	 */
	rig(item: Object3D): readonly THREE.SkinnedMesh[] {
		if (this.#skinnedMeshes.length > 0) {
			console.warn('Item is already rigged.')
			return this.#skinnedMeshes
		}

		// Ensure we have a skeleton to rig to.
		if (!this.#skeleton) {
			console.warn('No skeleton found in avatar, cannot rig item.')
			return []
		}

		if (item instanceof THREE.Mesh) return [this.rigMesh(item)]

		// Rig each sub-mesh
		item.traverse(obj => {
			if (obj instanceof THREE.Mesh) this.#skinnedMeshes.push(this.rigMesh(obj)!)
		})
		// for (const mesh of meshesInTree(item)) this.#skinnedMeshes.push(this.rigMesh(mesh)!) // this one causes an infinite loop

		return this.#skinnedMeshes
	}

	/**
	 * Rig the `mesh` to the model skeleton by making a new `THREE.SkinnedMesh`
	 * and visibly hiding the original mesh. Keep the original mesh so we can
	 * undo the rigging later.
	 * @param mesh
	 * @returns
	 */
	private rigMesh(mesh: THREE.Mesh) {
		this.#originalMeshes.push(mesh)

		const skinnedMesh = makeSkinnedMesh(mesh, this.#skeleton!)

		// Replace in scene graph
		mesh.parent!.add(skinnedMesh)
		/* parent.remove(mesh) */
		mesh.visible = false

		const geometry = skinnedMesh.geometry

		const vertexCount = geometry.attributes.position.count

		// Add random weights
		const skinIndices = new Uint16Array(vertexCount * 4)
		const skinWeights = new Float32Array(vertexCount * 4)

		// TODO: This can be done ahead of time, and only updated when the avatar or excludedBones
		// is updated.
		const bones: {pos: THREE.Vector3; index: number}[] = []
		this.#skeleton!.bones.forEach((bone, index) => {
			if (this.#excludedBones.includes(bone.name)) return

			const pos = new THREE.Vector3()
			bone.getWorldPosition(pos)

			bones.push({pos, index})
		})

		const vertex = new THREE.Vector3()
		const worldVertex = new THREE.Vector3()
		const boneDistances = []

		for (let i = 0; i < vertexCount; i++) {
			vertex.fromBufferAttribute(geometry.attributes.position, i)
			worldVertex.copy(vertex).applyMatrix4(mesh.matrixWorld)

			// Compute distances to bones
			boneDistances.length = 0
			for (let j = 0; j < bones.length; j++) {
				const dist = worldVertex.distanceTo(bones[j].pos)
				boneDistances.push({index: bones[j].index, dist})
			}

			boneDistances.sort((a, b) => a.dist - b.dist)

			// Get the 4 closest bones.
			const closest = boneDistances.slice(0, 4)
			const invWeights = closest.map(b => {
				if (this.#maxBoneDist > 0 && b.dist > this.#maxBoneDist) return 0

				return 1 / (b.dist + 1e-4) // Avoid div by 0
			})
			const total = invWeights.reduce((sum, w) => sum + w, 0)

			for (let k = 0; k < 4; k++) {
				skinIndices[i * 4 + k] = closest[k]?.index ?? 0
				skinWeights[i * 4 + k] = (invWeights[k] ?? 0) / total
			}
		}

		geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4))
		geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4))

		return skinnedMesh
	}

	/**
	 * Undos rigging of all meshes involved.
	 */
	unrig() {
		this.#originalMeshes.forEach(mesh => (mesh.visible = true))
		this.#originalMeshes = []
		for (const skinnedMesh of this.#skinnedMeshes) skinnedMesh.parent?.remove(skinnedMesh)
		this.#skinnedMeshes = []
	}
}
