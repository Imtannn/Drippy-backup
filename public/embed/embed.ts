import '../app/drippy-scene.js'
import type {DrippyScene} from '../app/drippy-scene.js'
import {avatars} from '../consts/avatars.js'
import {blocks as allBlocks} from '../consts/blocks.js'
import {spaces} from '../consts/spaces.js'
import type {BlockCategory} from '../types/block.js'
import type {Fabric} from '../types/fabric.js'
import type {TemplateCategory} from '../types/template.js'
import type {SelectedGarments, Space, TemplateCategorySelection} from '../types/types.js'
import {getSpacePrimaryCollection} from '../utils.js'

// Parse query parameters from URL
const params = new URLSearchParams(window.location.search)

// Get values from query params
const spaceParam = params.get('space') // e.g., "GAP"
const collectionParam = params.get('collection') // e.g., "moidien"
const avatarParam = params.get('avatar') // e.g., "em"
const fabricsParam = params.get('fabrics') // e.g., "Shirt-Bodice-default:3"
const garmentsParam = params.get('garments') // e.g., "10" or "10,11,12"

// Find the space by slug
let selectedSpace: Space | null = null
let selectedCollection: string | null = null

if (spaceParam) {
	selectedSpace = spaces.find(s => s.slug === spaceParam) || null

	// Determine the collection to use
	if (selectedSpace) {
		if (collectionParam && selectedSpace.collections.includes(collectionParam)) {
			selectedCollection = collectionParam
		} else {
			selectedCollection = getSpacePrimaryCollection(selectedSpace)
		}
	}
}

// Find the avatar by name
let selectedAvatar: string | null = null
if (avatarParam) {
	const avatar = avatars.find(a => a.name === avatarParam)
	if (avatar) {
		selectedAvatar = avatarParam
	}
}

// Parse fabrics and blocks into unified selection object
const selectedGarments: SelectedGarments = {}

const ensureSelection = (templateCategory: TemplateCategory, blockCategory: BlockCategory) => {
	if (!selectedGarments[templateCategory]) {
		selectedGarments[templateCategory] = {} as TemplateCategorySelection
	}
	const templateSelection = selectedGarments[templateCategory]!

	if (!templateSelection[blockCategory]) {
		templateSelection[blockCategory] = {
			block: null,
			fabrics: {},
		}
	}

	return templateSelection[blockCategory]!
}

if (fabricsParam) {
	const fabricsList = fabricsParam.split(',')

	for (const fabricStr of fabricsList) {
		// Parse format: "TemplateCategory-BlockCategory-fabricName:fabricId"
		const match = fabricStr.match(/^([^-]+)-([^-]+)-([^:]+):(\d+)$/)
		if (match) {
			const [, templateCategory, blockCategory, fabricName, fabricId] = match

			const selection = ensureSelection(templateCategory as TemplateCategory, blockCategory as BlockCategory)

			selection.fabrics[fabricName] = {
				_id: fabricId,
				materialName: fabricName,
			} as Fabric
		}
	}
}

// Parse garments (blocks) from query param
// Format: "10" or "10,11,12" (block IDs)
if (garmentsParam && selectedCollection) {
	const garmentIds = garmentsParam.split(',').map(id => id.trim())

	// Get blocks for the selected collection
	const collectionBlocks = allBlocks[selectedCollection as keyof typeof allBlocks] ?? []

	for (const garmentId of garmentIds) {
		const block = collectionBlocks.find(b => b._id === garmentId)

		if (block) {
			const templateCategory = block.templateCategory
			const blockCategory = block.category

			const selection = ensureSelection(templateCategory, blockCategory)
			selection.block = block
		}
	}
}

// Create and render the drippy-scene element
const drippyScene = document.createElement('drippy-scene') as DrippyScene

// Set properties directly
drippyScene.selectedSpace = selectedSpace
drippyScene.selectedAvatar = selectedAvatar
drippyScene.selectedGarments = selectedGarments

// Append to body
document.body.appendChild(drippyScene)

// Force override sceneTranslateY after element is created
// This ensures we override any inline styles set by drippy-scene
setTimeout(() => {
	const scene = document.querySelector('drippy-scene') as HTMLElement
	if (scene) {
		scene.style.setProperty('--sceneTranslateY', 'translateY(0)', 'important')

		// Also directly target the scene container
		const sceneContainer = scene.querySelector('#lume-scene-container') as HTMLElement
		if (sceneContainer) {
			sceneContainer.style.setProperty('transform', 'translateY(0)', 'important')
			sceneContainer.style.setProperty('-webkit-transform', 'translateY(0)', 'important')
		}
	}
}, 100)
