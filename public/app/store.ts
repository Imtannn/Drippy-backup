import {createMutable} from 'solid-js/store'
import type {Block, BlockCategory} from '../types/block.js'
import type {Fabric} from '../types/fabric.js'
import type {Template} from '../types/template.js'

export type AppRoute =
	| 'avatar'
	| 'blocks'
	| 'preview'
	| 'custom-measurement'
	| 'success'
	| 'scene'
	| 'order'
	| 'template'

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
	tempSelectedAvatar: 'male' as Avatar,
	selectedAvatar: null as Avatar,
	selectedScene: null as Scene,
	isPreview: false,
	selectedTemplate: null as Template | null,
	selectedBlocks: new Map<BlockCategory, Block>(),
	selectedFabric: null as Fabric | null,
	customMeasurement: null as CustomMeasurement | null,
	set setSelectedBlocks(blocks: Block[] | Block) {
		if (!Array.isArray(blocks)) {
			blocks = [blocks]
		}
		const newBlocks = new Map<BlockCategory, Block>(this.selectedBlocks)
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
	set replaceSelectedBlocks(blocks: Block[]) {
		// Completely replace selectedBlocks with new blocks (used for template selection)
		const newBlocks = new Map<BlockCategory, Block>()
		for (const block of blocks) {
			newBlocks.set(block.category, block)
		}
		this.selectedBlocks = newBlocks
	},
	set setSelectedFabrics(fabric: Fabric | null) {
		console.log('setSelectedFabrics', fabric, this.selectedFabric)
		if (fabric?._id === this.selectedFabric?._id) {
			this.selectedFabric = null
			return
		}
		this.selectedFabric = fabric
	},
	set setSelectedTemplate(template: Template | null) {
		this.selectedTemplate = template
	},
	set navigateTo(route: AppRoute) {
		this.view = route
	},
	set setTempSelectedAvatar(avatar: Avatar) {
		this.tempSelectedAvatar = avatar
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
		this.selectedTemplate = null as Template | null
		this.selectedBlocks = new Map<BlockCategory, Block>()
		this.selectedFabric = null as Fabric | null
		this.isPreview = false
		this.customMeasurement = null as CustomMeasurement | null
	},
})
