import '../app/drippy-scene.js'
import {spaces} from '../consts/spaces.js'
import {avatars} from '../consts/avatars.js'
import {blocks as allBlocks} from '../consts/blocks.js'
import type {DrippyScene} from '../app/drippy-scene.js'
import type {Space} from '../types/types.js'
import type {Block, BlockCategory} from '../types/block.js'
import type {Fabric} from '../types/fabric.js'
import type {TemplateCategory} from '../types/template.js'

// Parse query parameters from URL
const params = new URLSearchParams(window.location.search)

// Get values from query params
const sceneParam = params.get('scene') // e.g., "GAP"
const avatarParam = params.get('avatar') // e.g., "em"
const fabricsParam = params.get('fabrics') // e.g., "Shirt-Bodice-default:3"
const garmentsParam = params.get('garments') // e.g., "10" or "10,11,12"

// Find the space by slug
let selectedSpace: Space | null = null
if (sceneParam) {
	selectedSpace = spaces.find(s => s.slug === sceneParam) || null
}

// Find the avatar by name
let selectedAvatar: string | null = null
if (avatarParam) {
	const avatar = avatars.find(a => a.name === avatarParam)
	if (avatar) {
		selectedAvatar = avatarParam
	}
}

// Parse fabrics from query param
// Format: "Shirt-Bodice-default:3" or multiple separated by comma
const selectedFabrics: Map<TemplateCategory, Map<BlockCategory, Map<string, Fabric>>> = new Map()

if (fabricsParam) {
	const fabricsList = fabricsParam.split(',')

	for (const fabricStr of fabricsList) {
		// Parse format: "TemplateCategory-BlockCategory-fabricName:fabricId"
		const match = fabricStr.match(/^([^-]+)-([^-]+)-([^:]+):(\d+)$/)
		if (match) {
			const [, templateCategory, blockCategory, fabricName, fabricId] = match

			// Create the nested map structure
			if (!selectedFabrics.has(templateCategory as TemplateCategory)) {
				selectedFabrics.set(templateCategory as TemplateCategory, new Map())
			}
			const templateMap = selectedFabrics.get(templateCategory as TemplateCategory)!

			if (!templateMap.has(blockCategory as BlockCategory)) {
				templateMap.set(blockCategory as BlockCategory, new Map())
			}
			const categoryMap = templateMap.get(blockCategory as BlockCategory)!

			// Create a fabric object with the required materialName property
			const fabric: Fabric = {
				_id: fabricId,
				materialName: fabricName,
			}

			categoryMap.set(fabricName, fabric)
		}
	}
}

// Parse garments (blocks) from query param
// Format: "10" or "10,11,12" (block IDs)
const selectedBlocks: Map<TemplateCategory, Map<BlockCategory, Block>> = new Map()

if (garmentsParam && selectedSpace) {
	const garmentIds = garmentsParam.split(',').map(id => id.trim())

	// Get blocks for the selected space's collection
	const collectionBlocks = allBlocks[selectedSpace.collection] || []

	for (const garmentId of garmentIds) {
		const block = collectionBlocks.find(b => b._id === garmentId)

		if (block) {
			const templateCategory = block.templateCategory
			const blockCategory = block.category

			// Create the nested map structure
			if (!selectedBlocks.has(templateCategory)) {
				selectedBlocks.set(templateCategory, new Map())
			}
			const templateMap = selectedBlocks.get(templateCategory)!

			// Store the block (overwrite if same category - this matches the app behavior)
			templateMap.set(blockCategory, block)
		}
	}
}

// Create and render the drippy-scene element
const drippyScene = document.createElement('drippy-scene') as DrippyScene

// Set properties directly
drippyScene.selectedSpace = selectedSpace
drippyScene.selectedAvatar = selectedAvatar
drippyScene.selectedFabrics = selectedFabrics
drippyScene.selectedBlocks = selectedBlocks

// Append to body
document.body.appendChild(drippyScene)
