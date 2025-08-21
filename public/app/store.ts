import {createMutable} from 'solid-js/store'
import type {Block} from '../types/block.js'
import type {Fabric} from '../types/fabric.js'

export type AppRoute = 'avatar' | 'blocks' | 'preview' | 'custom-measurement' | 'success' | 'scene' | 'order'

export type Avatar = 'female' | 'male' | null

export type Scene = 'bloom realms' | null

export type CustomMeasurement = {
	bust: number
	waist: number
	hips: number
	shoulder: number
	shoulderToKnee: number
}

export const store = createMutable({
	// key is the block category, value is the block
	view: 'avatar' as AppRoute,
	selectedAvatar: null as Avatar,
	selectedScene: null as Scene,
	isPreview: false,
	selectedBlocks: new Map<string, Block>(),
	selectedFabric: null as Fabric | null,
	customMeasurement: null as CustomMeasurement | null,
	set setSelectedBlocks(blocks: Block[] | Block) {
		if (!Array.isArray(blocks)) {
			blocks = [blocks]
		}
		const newBlocks = new Map<string, Block>(this.selectedBlocks)
		// check if the block with same category already exists
		for (const block of blocks) {
			if (this.selectedBlocks.has(block.category)) {
				// if it exists, check if the block is the same, if so, remove it
				if (this.selectedBlocks.get(block.category)?._id === block._id) {
					newBlocks.delete(block.category)
				} else {
					newBlocks.set(block.category, block)
				}
			} else {
				// if not, add it
				newBlocks.set(block.category, block)
			}
		}
		this.selectedBlocks = newBlocks
	},
	set setSelectedFabrics(fabric: Fabric) {
		this.selectedFabric = fabric
	},
	set navigateTo(route: AppRoute) {
		this.view = route
	},
	set selectAvatar(avatar: Avatar) {
		this.selectedAvatar = avatar
	},
	set selectScene(scene: Scene) {
		this.selectedScene = scene
	},
	set setIsPreview(isPreview: boolean) {
		this.isPreview = isPreview
	},
	set setCustomMeasurement(measurement: CustomMeasurement) {
		this.customMeasurement = measurement
	},
	resetState() {
		this.view = 'avatar' as AppRoute
		this.selectedAvatar = null as Avatar
		this.selectedScene = null as Scene
		this.selectedBlocks = new Map<string, Block>()
		this.selectedFabric = null as Fabric | null
		this.isPreview = false
		this.customMeasurement = null as CustomMeasurement | null
	},
})
