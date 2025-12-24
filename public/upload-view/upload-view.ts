import {css, element, Element, html, signal} from 'lume'
import * as THREE from 'three'
import '../app/app-buttons.js'
import '../app/drippy-scene.js'
import '../app/item-card.js'
// import {store} from '../app/store.js'
import {DEFAULT_TEXTURE_CONFIG, textureManager} from '../app/texture-manager.js'
import {avatars} from '../consts/avatars.js'
import {spaces} from '../consts/spaces.js'
import '../elements/bottom-sheet.js'
import '../elements/home-button.js'
import '../elements/logic/for-each.js'
import '../elements/logic/show-when.js'
import '../elements/tabs.js'
import type {Block, BlockCategory, TemplateCategory as BlockTemplateCategory} from '../types/block.js'
import type {Fabric, FabricCategory} from '../types/fabric.js'
import type {Template, TemplateCategory} from '../types/template.js'
import type {
	BlockFabricsMap,
	CategoryBlocksMap,
	PieceFabricsMap,
	SelectedGarments,
	Space,
	TemplateBlocksMap,
	TemplateCategorySelection,
	TemplateFabricsMap,
	TemplateMap,
} from '../types/types.js'

interface UploadedMaterial {
	_id: string
	thumb: string
	normal?: string
	baseColor?: string
	displacement?: string
	roughness?: string
	alpha?: string
	materialName: string
	category: FabricCategory
	templateCategories: string[]
	assignedMesh?: string
}

interface UploadedBlock {
	_id: string
	blockName: string
	category: BlockCategory
	templateName: string
	thumbUrl: string
	modelUrl: string
}

interface ParsedTemplate {
	templateName: string
	templateThumbnail?: string
	materials: UploadedMaterial[]
	blocks: UploadedBlock[]
	extraMaterials: {mesh: string; materialId: string}[]
}

// Block categories that can have materials applied
const BLOCK_CATEGORIES: BlockCategory[] = [
	'Bodice',
	'Sleeves',
	'Pants',
	'Skirt',
	'Full Body',
	'Hat',
	'Bag',
	'Accessory',
]

@element
export class UploadView extends Element {
	static override elementName = 'upload-view'

	// Reactive properties
	@signal selectedTab: string = BLOCK_CATEGORIES[0]
	@signal uploadedTemplates: ParsedTemplate[] = []
	@signal selectedMaterials = new Map<string, UploadedMaterial>() // blockCategory -> material
	@signal isUploading = false
	@signal uploadProgress = ''
	@signal convertedTemplate: Template | null = null
	@signal convertedBlocks: Block[] = []
	@signal convertedFabrics: Fabric[] = []
	@signal selectedSpace: Space | null = null
	@signal selectedAvatar: string | null = null
	@signal selectedFabrics: TemplateFabricsMap = new Map()
	@signal selectedBlocks: TemplateBlocksMap = new Map()
	@signal selectedTemplates: TemplateMap = {}
	@signal fabricScaleX = 2
	@signal fabricScaleY = 2
	@signal fabricOffsetX = DEFAULT_TEXTURE_CONFIG.offset[0]
	@signal fabricOffsetY = DEFAULT_TEXTURE_CONFIG.offset[1]
	@signal fabricCoef = DEFAULT_TEXTURE_CONFIG.coef
	@signal fabricRotate = DEFAULT_TEXTURE_CONFIG.rotate
	@signal showConfigPanel = false
	@signal isDragging = false
	@signal panelX = -212
	@signal panelY = -371
	@signal isMinimized = false

	// DOM elements
	private fileInput?: HTMLInputElement

	#getSelectedGarments = (): SelectedGarments => {
		const selection: SelectedGarments = {}

		for (const [templateCategory, blocksMap] of this.selectedBlocks.entries()) {
			if (!selection[templateCategory]) {
				selection[templateCategory] = {} as TemplateCategorySelection
			}
			const templateSelection = selection[templateCategory] as TemplateCategorySelection

			for (const [blockCategory, block] of blocksMap.entries()) {
				if (!templateSelection[blockCategory]) {
					templateSelection[blockCategory] = {
						block,
						fabrics: {},
					}
				} else {
					templateSelection[blockCategory]!.block = block
				}
			}
		}

		for (const [templateCategory, blockMap] of this.selectedFabrics.entries()) {
			if (!selection[templateCategory]) {
				selection[templateCategory] = {} as TemplateCategorySelection
			}
			const templateSelection = selection[templateCategory] as TemplateCategorySelection

			for (const [blockCategory, fabricMap] of blockMap.entries()) {
				if (!templateSelection[blockCategory]) {
					templateSelection[blockCategory] = {
						block: null,
						fabrics: {},
					}
				}

				const fabricsObject: Record<string, Fabric> = {}
				for (const [piece, fabric] of fabricMap.entries()) {
					fabricsObject[piece] = fabric
				}

				templateSelection[blockCategory]!.fabrics = fabricsObject
			}
		}

		return selection
	}
	override connectedCallback() {
		super.connectedCallback()
		this.#createFileInput()
	}

	#createFileInput = () => {
		this.fileInput = document.createElement('input')
		this.fileInput.type = 'file'
		this.fileInput.webkitdirectory = true
		this.fileInput.multiple = true
		this.fileInput.style.display = 'none'
		this.fileInput.accept = 'image/*'
		this.fileInput.addEventListener('change', this.#handleFileSelect)
		document.body.appendChild(this.fileInput)
	}

	#handleUploadClick = () => {
		if (this.fileInput) {
			this.fileInput.files = null
		}

		this.fileInput?.click()
	}

	#clearUploadState = () => {
		// Clear all upload-related state for fresh start
		this.uploadedTemplates = []
		this.selectedMaterials = new Map()
		this.convertedTemplate = null
		this.convertedBlocks = []
		this.convertedFabrics = []
		this.selectedFabrics = new Map()
		this.selectedBlocks = new Map()
		this.selectedTemplates = {}
		this.uploadProgress = ''
		this.showConfigPanel = false
		this.fabricScaleX = 9
		this.fabricScaleY = 9
		this.fabricOffsetX = DEFAULT_TEXTURE_CONFIG.offset[0]
		this.fabricOffsetY = DEFAULT_TEXTURE_CONFIG.offset[1]
		this.fabricCoef = DEFAULT_TEXTURE_CONFIG.coef
		this.fabricRotate = DEFAULT_TEXTURE_CONFIG.rotate
		this.isDragging = false
		this.panelX = -212
		this.panelY = -371
		this.isMinimized = false
	}

	#handleFileSelect = async (event: Event) => {
		const input = event.target as HTMLInputElement
		const files = input.files

		if (!files || files.length === 0) return

		// Clear all previous upload state for fresh start
		this.#clearUploadState()

		this.isUploading = true
		this.uploadProgress = 'Processing files...'

		try {
			await this.#parseUploadedFiles(files)
			this.uploadProgress = 'Processing template...'
			await this.#convertToSystemFormat()
			this.uploadProgress = 'Upload complete!'

			// Auto-select the uploaded template after 1 second
			setTimeout(() => {
				this.#autoSelectUploadedTemplate()
			}, 1000)
		} catch (error) {
			console.error('Upload failed:', error)
			this.uploadProgress = 'Upload failed. Please try again.'
		} finally {
			this.isUploading = false
			// Clear progress after 3 seconds
			setTimeout(() => {
				this.uploadProgress = ''
			}, 3000)
		}
	}

	#parseUploadedFiles = async (files: FileList) => {
		const parsedTemplates: ParsedTemplate[] = []
		const templateGroups = new Map<string, File[]>()

		// Check if files have directory structure or are individual files
		const hasDirectoryStructure = Array.from(files).some(
			file => file.webkitRelativePath && file.webkitRelativePath.includes('/'),
		)

		if (hasDirectoryStructure) {
			// Group files by template folder structure
			Array.from(files).forEach(file => {
				const pathParts = file.webkitRelativePath.split('/')
				if (pathParts.length < 2) return

				// Expected structure: TemplateName/...
				const templateName = pathParts[0]

				if (!templateGroups.has(templateName)) {
					templateGroups.set(templateName, [])
				}
				templateGroups.get(templateName)?.push(file)
			})
		} else {
			// Handle individual file selection - group all files under a default template
			const defaultTemplateName = 'Uploaded_Materials'
			templateGroups.set(defaultTemplateName, Array.from(files))
		}

		this.uploadProgress = 'Processing templates...'

		// Process each template folder
		for (const [templateName, templateFiles] of templateGroups) {
			const processedTemplate = await this.#processTemplateFolder(templateFiles, templateName)

			if (processedTemplate) {
				parsedTemplates.push(processedTemplate)
			}
		}

		this.uploadedTemplates = parsedTemplates
	}

	#processTemplateFolder = async (files: File[], templateName: string): Promise<ParsedTemplate | null> => {
		console.log(`📂 Processing template: ${templateName}`)

		// Check if we have directory structure
		const hasDirectoryStructure = files.some(file => file.webkitRelativePath && file.webkitRelativePath.includes('/'))

		if (!hasDirectoryStructure) {
			console.warn(`⚠️ Expected template folder structure with subdirectories for ${templateName}`)
			return null
		}

		// Find template thumbnail (PNG file in root of template folder)
		const templateThumbnail = files.find(file => {
			const pathParts = file.webkitRelativePath.split('/')
			return (
				pathParts.length === 2 && // File in root of template folder
				pathParts[0] === templateName &&
				file.name.toLowerCase().endsWith('.png')
			)
		})

		if (!templateThumbnail) {
			console.warn(`⚠️ No template thumbnail found in root of ${templateName}. Expected a PNG file.`)
			return null
		}

		console.log(`📸 Found template thumbnail: ${templateThumbnail.name}`)

		// Find Materials folder
		const materialsFolderFiles = files.filter(file => {
			const pathParts = file.webkitRelativePath.split('/')
			return (
				pathParts.length > 2 && // Has at least template/Materials/file structure
				pathParts[0] === templateName &&
				pathParts[1].toLowerCase() === 'materials'
			)
		})

		if (materialsFolderFiles.length === 0) {
			console.warn(`⚠️ No Materials folder found in ${templateName}. Expected: ${templateName}/Materials/`)
			return null
		}

		console.log(`📁 Found ${materialsFolderFiles.length} files in Materials folder`)

		// Find Extra Materials folder
		const extraMaterialsFolderFiles = files.filter(file => {
			const pathParts = file.webkitRelativePath.split('/')
			return (
				pathParts.length > 2 && // Has at least template/Extra Materials/file structure
				pathParts[0] === templateName &&
				pathParts[1].toLowerCase().replace(/\s+/g, ' ').trim() === 'extra materials'
			)
		})

		console.log(`📁 Found ${extraMaterialsFolderFiles.length} files in Extra Materials folder`)

		// Find block type folders (Bodice, Pants, Sleeves, etc.)
		const blockTypeFolders = files.filter(file => {
			const pathParts = file.webkitRelativePath.split('/')
			if (pathParts.length < 3) return false // Need at least template/blockType/file

			const folderName = pathParts[1].toLowerCase()
			return (
				pathParts[0] === templateName &&
				pathParts.length >= 3 &&
				['bodice', 'pants', 'sleeves', 'hat', 'dress', 'skirt', 'fullbody', 'bag', 'accessory'].some(blockType =>
					folderName.includes(blockType),
				)
			)
		})

		console.log(`📁 Found ${blockTypeFolders.length > 0 ? 'block type files' : 'no block type files'}`)

		// Process materials from Materials folder
		const materials = await this.#processMaterialsInTemplate(materialsFolderFiles, templateName)

		// Process blocks from block type folders
		const blocks = await this.#processBlocksInTemplate(blockTypeFolders, templateName)

		// Process extra materials from Extra Materials folder
		const {extraMaterials, processedMaterials: extraMaterialFiles} = await this.#processExtraMaterialsInTemplate(
			extraMaterialsFolderFiles,
			templateName,
		)

		// Add extra materials to the main materials list
		materials.push(...extraMaterialFiles)

		// Create blob URL for template thumbnail if it exists
		let templateThumbnailUrl: string | undefined
		if (templateThumbnail) {
			try {
				// Validate file data
				if (!templateThumbnail.name || !templateThumbnail.name.trim()) {
					console.warn('Template thumbnail has no filename, skipping')
					return null
				}

				// Create blob URL for template thumbnail
				templateThumbnailUrl = URL.createObjectURL(templateThumbnail)
				console.log(`📸 Created blob URL for template thumbnail: ${templateThumbnailUrl}`)
			} catch (error) {
				console.error(`Failed to create blob URL for template thumbnail:`, error)
			}
		}

		return {
			templateName,
			templateThumbnail: templateThumbnailUrl,
			materials,
			blocks,
			extraMaterials,
		}
	}

	#processMaterialsInTemplate = async (files: File[], templateName: string): Promise<UploadedMaterial[]> => {
		const materials: UploadedMaterial[] = []
		const materialGroups = new Map<string, File[]>()

		// Group files by material folder
		// Expected structure: TemplateName/Materials/MaterialFolderName/texturefiles...
		files.forEach(file => {
			const pathParts = file.webkitRelativePath.split('/')

			if (pathParts.length >= 4) {
				// TemplateName/Materials/MaterialFolderName/file
				const materialFolderName = pathParts[2] // The material folder name

				if (!materialGroups.has(materialFolderName)) {
					materialGroups.set(materialFolderName, [])
				}
				materialGroups.get(materialFolderName)?.push(file)
			}
		})

		console.log(`Found ${materialGroups.size} material folders:`, Array.from(materialGroups.keys()))

		// Process each material group
		for (const [materialFolderName, materialFiles] of materialGroups) {
			const material = await this.#processMaterialFiles(materialFiles, materialFolderName, templateName)
			if (material) {
				materials.push(material)
			}
		}

		return materials
	}

	#processMaterialFiles = async (
		files: File[],
		materialName: string,
		_templateName: string,
		_subfolder?: string,
		meshName?: string,
	): Promise<UploadedMaterial | null> => {
		try {
			const uploadedFiles = new Map<string, string>()

			// Process all material files and create blob URLs
			for (const file of files) {
				// Validate file data
				if (!file.name || !file.name.trim()) {
					console.warn(`Skipping file with no name in material ${materialName}`)
					continue
				}

				try {
					// Create blob URL for local file access
					const blobUrl = URL.createObjectURL(file)
					const fileName = file.name.toLowerCase()

					// Categorize file by name patterns
					if (fileName.includes('render') || fileName.includes('thumb')) {
						uploadedFiles.set('thumb', blobUrl)
					} else if (fileName.includes('normal')) {
						uploadedFiles.set('normal', blobUrl)
					} else if (fileName.includes('base')) {
						uploadedFiles.set('baseColor', blobUrl)
					} else if (fileName.includes('displace')) {
						uploadedFiles.set('displacement', blobUrl)
					} else if (fileName.includes('rough')) {
						uploadedFiles.set('roughness', blobUrl)
					} else if (fileName.includes('alpha')) {
						uploadedFiles.set('alpha', blobUrl)
					}

					console.log(`Created blob URL for ${file.name}: ${blobUrl}`)
				} catch (error) {
					console.error(`Failed to create blob URL for ${file.name}:`, error)
				}
			}

			// Parse material name and category from folder name
			// Expected format: "Category - Name" (following fetch-combined-assets.ts structure)
			const nameParts = materialName.split(' - ')
			const category = nameParts.length > 1 ? this.#capitalize(nameParts[0].trim()) : 'Unknown'
			const name = nameParts.length > 1 ? this.#capitalize(nameParts[1].trim()) : this.#capitalize(materialName)

			return {
				_id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
				thumb: uploadedFiles.get('thumb') || '',
				normal: uploadedFiles.get('normal'),
				baseColor: uploadedFiles.get('baseColor'),
				displacement: uploadedFiles.get('displacement'),
				roughness: uploadedFiles.get('roughness'),
				alpha: uploadedFiles.get('alpha'),
				materialName: name,
				category: category as FabricCategory,
				templateCategories: [], // Will be populated based on usage
				assignedMesh: meshName,
			}
		} catch (error) {
			console.error(`Failed to process material ${materialName}:`, error)
			return null
		}
	}

	#processBlocksInTemplate = async (files: File[], templateName: string): Promise<UploadedBlock[]> => {
		const blocks: UploadedBlock[] = []
		const blockTypeGroups = new Map<string, File[]>()

		// Group files by block type folder
		// Expected structure: TemplateName/BlockTypeFolder/blockfiles...
		files.forEach(file => {
			const pathParts = file.webkitRelativePath.split('/')

			if (pathParts.length >= 3) {
				// TemplateName/BlockTypeFolder/file
				const blockTypeFolder = pathParts[1] // The block type folder name

				if (!blockTypeGroups.has(blockTypeFolder)) {
					blockTypeGroups.set(blockTypeFolder, [])
				}
				blockTypeGroups.get(blockTypeFolder)?.push(file)
			}
		})

		console.log(`Found ${blockTypeGroups.size} block type folders:`, Array.from(blockTypeGroups.keys()))

		// Process each block type folder
		for (const [blockTypeFolder, blockFiles] of blockTypeGroups) {
			const blockTypeBlocks = await this.#processBlockTypeFolder(blockFiles, blockTypeFolder, templateName)
			blocks.push(...blockTypeBlocks)
		}

		return blocks
	}

	#processBlockTypeFolder = async (
		files: File[],
		blockTypeFolder: string,
		templateName: string,
	): Promise<UploadedBlock[]> => {
		const blocks: UploadedBlock[] = []

		// Find GLTF/GLB files and PNG files
		const gltfFiles = files.filter(
			file => file.name.toLowerCase().endsWith('.gltf') || file.name.toLowerCase().endsWith('.glb'),
		)
		const pngFiles = files.filter(file => file.name.toLowerCase().endsWith('.png'))

		console.log(`  📁 Processing block type: ${blockTypeFolder}`)
		console.log(`  📄 Found ${gltfFiles.length} GLTF files and ${pngFiles.length} PNG files`)

		// Match GLTF and PNG pairs
		for (const gltfFile of gltfFiles) {
			const baseName = this.#getFileBaseName(gltfFile.name)

			// Find matching PNG (use first one if no exact match)
			let matchingPng = pngFiles.find(png => this.#getFileBaseName(png.name) === baseName)
			if (!matchingPng && pngFiles.length > 0) {
				matchingPng = pngFiles[0] // Use first PNG as fallback
			}

			if (matchingPng) {
				console.log(`    📥 Processing block: ${baseName}`)

				try {
					// Create blob URLs for block files
					const pngBlobUrl = URL.createObjectURL(matchingPng)
					const gltfBlobUrl = URL.createObjectURL(gltfFile)

					blocks.push({
						_id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
						blockName: this.#capitalize(baseName),
						category: this.#normalizeBlockCategory(blockTypeFolder) as BlockCategory,
						templateName: templateName,
						thumbUrl: pngBlobUrl,
						modelUrl: gltfBlobUrl,
					})

					console.log(`    ✅ Created blob URLs for block ${baseName}`)
					console.log(`    📸 Thumb: ${pngBlobUrl}`)
					console.log(`    📦 Model: ${gltfBlobUrl}`)
				} catch (error) {
					console.error(`    ❌ Failed to process block ${baseName}:`, error)
				}
			} else {
				console.warn(`    ⚠️ No matching PNG file found for ${baseName}`)
			}
		}

		return blocks
	}

	#getFileBaseName = (fileName: string): string => {
		return fileName.replace(/\.[^/.]+$/, '') // Remove extension
	}

	#normalizeBlockCategory = (folderName: string): string => {
		// Normalize block type folder names to exact category names
		const lowerName = folderName.toLowerCase()
		if (lowerName.includes('bodice')) return 'Bodice'
		if (lowerName.includes('pants')) return 'Pants'
		if (lowerName.includes('sleeves')) return 'Sleeves'
		if (lowerName.includes('dress')) return 'Dress'
		if (lowerName.includes('skirt')) return 'Skirt'
		if (lowerName.includes('fullbody')) return 'Full Body'
		if (lowerName.includes('hat')) return 'Hat'
		if (lowerName.includes('bag')) return 'Bag'
		if (lowerName.includes('accessory')) return 'Accessory'
		return folderName // fallback to original name
	}

	#processExtraMaterialsInTemplate = async (
		files: File[],
		templateName: string,
	): Promise<{extraMaterials: {mesh: string; materialId: string}[]; processedMaterials: UploadedMaterial[]}> => {
		if (files.length === 0) {
			return {extraMaterials: [], processedMaterials: []}
		}

		console.log(`📁 Processing Extra Materials for template: ${templateName}`)

		const extraMaterials: {mesh: string; materialId: string}[] = []
		const processedMaterials: UploadedMaterial[] = []
		const meshFolderGroups = new Map<string, File[]>()

		// Group files by mesh folder
		// Expected structure: TemplateName/Extra Materials/MeshName/MaterialFolder/materialfiles...
		files.forEach(file => {
			const pathParts = file.webkitRelativePath.split('/')

			if (pathParts.length >= 4) {
				// TemplateName/Extra Materials/MeshName/file or deeper
				const meshName = pathParts[2] // The mesh folder name

				if (!meshFolderGroups.has(meshName)) {
					meshFolderGroups.set(meshName, [])
				}
				meshFolderGroups.get(meshName)?.push(file)
			}
		})

		console.log(`  Found ${meshFolderGroups.size} mesh folders:`, Array.from(meshFolderGroups.keys()))

		// Process each mesh folder
		for (const [meshName, meshFiles] of meshFolderGroups) {
			console.log(`  📁 Processing mesh: ${meshName}`)

			// Group files by material folder within this mesh folder
			// Expected: TemplateName/Extra Materials/MeshName/Category - MaterialName/materialfiles...
			const materialGroups = new Map<string, File[]>()

			meshFiles.forEach(file => {
				const pathParts = file.webkitRelativePath.split('/')
				if (pathParts.length >= 5) {
					// TemplateName/Extra Materials/MeshName/MaterialFolder/file
					const materialFolderName = pathParts[3]

					if (!materialGroups.has(materialFolderName)) {
						materialGroups.set(materialFolderName, [])
					}
					materialGroups.get(materialFolderName)?.push(file)
				}
			})

			if (materialGroups.size === 0) {
				console.warn(`    ⚠️ No material folders found in mesh folder: ${meshName}`)
				continue
			}

			// Process each material folder in this mesh
			for (const [materialFolderName, materialFiles] of materialGroups) {
				console.log(`    📁 Processing material folder: ${materialFolderName}`)

				// Parse and normalize the material folder name
				// Expected format: "Category - MaterialName"
				const folderNameParts = materialFolderName.split(' - ')
				if (folderNameParts.length < 2) {
					console.warn(`    ⚠️ Invalid material folder format: ${materialFolderName}. Expected: "Category - Name"`)
					continue
				}

				const materialCategory = this.#capitalize(folderNameParts[0].trim())
				const materialName = this.#capitalize(folderNameParts[1].trim())
				const materialLabel = `${materialCategory} - ${materialName}`

				// Process the material files and upload them
				const processedMaterial = await this.#processMaterialFiles(
					materialFiles,
					materialFolderName,
					templateName,
					`extra_materials/${meshName}`,
					meshName,
				)

				// Sanitize mesh name (similar to THREE.PropertyBinding.sanitizeNodeName)
				const sanitizedMeshName = THREE.PropertyBinding.sanitizeNodeName(meshName).toLowerCase()

				if (!processedMaterial) {
					console.warn(`    ⚠️ Failed to process extra material: ${materialLabel}`)
					continue
				}

				// Add the processed material to our collection
				processedMaterials.push(processedMaterial)

				console.log(`    ✅ Processed extra material: ${materialLabel} (fabricId: ${processedMaterial._id})`)

				extraMaterials.push({
					mesh: sanitizedMeshName,
					materialId: processedMaterial._id,
				})

				console.log(`    🔗 Mesh "${meshName}" -> Fabric "${processedMaterial._id}" (${materialLabel})`)
			}
		}

		console.log(`📎 Processed ${extraMaterials.length} extra material mappings`)
		console.log(`🎨 Processed ${processedMaterials.length} extra materials`)

		return {extraMaterials, processedMaterials}
	}

	#capitalize = (name: string): string => {
		return name.toLowerCase().replace(/\b\w/g, char => char.toUpperCase())
	}

	#convertToSystemFormat = async (): Promise<void> => {
		if (this.uploadedTemplates.length === 0) return

		const uploadedTemplate = this.uploadedTemplates[0] // Use first template

		console.log('🔍 Converting to system format...')
		console.log(`📦 Found ${uploadedTemplate.materials.length} materials:`)
		uploadedTemplate.materials.forEach(material => {
			console.log(`   📎 ${material.materialName} (fabricId: ${material._id})`)
		})

		console.log(`🔗 Found ${uploadedTemplate.extraMaterials.length} extra material mappings:`)
		uploadedTemplate.extraMaterials.forEach(extra => {
			console.log(`   🔗 ${extra.mesh} -> ${extra.materialId}`)
		})

		// Convert materials to fabrics
		const convertedFabrics: Fabric[] = uploadedTemplate.materials.map(material => ({
			_id: material._id,
			thumb: material.thumb,
			normal: material.normal || '',
			baseColor: material.baseColor || '',
			displacement: material.displacement || '',
			roughness: material.roughness || '',
			alpha: material.alpha || '',
			materialName: material.materialName,
			category: material.category as Fabric['category'],
			templateCategories: material.templateCategories,
			assignedMesh: THREE.PropertyBinding.sanitizeNodeName(material.assignedMesh || '').toLowerCase(),
			scaleX: this.fabricScaleX,
			scaleY: this.fabricScaleY,
			offsetX: this.fabricOffsetX,
			offsetY: this.fabricOffsetY,
			coef: this.fabricCoef,
			rotate: this.fabricRotate,
		}))

		console.log(`✅ All extra materials processed and added to materials list`)

		const templateId = Date.now().toString() + Math.random().toString(36).substr(2, 9)

		// Convert blocks to system format
		const convertedBlocks: Block[] = uploadedTemplate.blocks.map(block => ({
			_id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
			thumb: block.thumbUrl,
			modelFile: block.modelUrl,
			blockName: block.blockName,
			avatar: 'female' as const,
			category: block.category as BlockCategory,
			templateId: templateId, // Will be set properly
			templateName: uploadedTemplate.templateName,
			templateCategory: 'Dress' as BlockTemplateCategory, // Default category for uploaded templates
		}))

		// Convert template to system format
		const convertedTemplate: Template = {
			_id: templateId,
			thumb: uploadedTemplate.templateThumbnail || '',
			name: uploadedTemplate.templateName,
			avatar: 'female' as const,
			category: 'Dress' as TemplateCategory, // Default category for uploaded templates
			materialId: convertedFabrics[0]?._id ?? '',
			...(uploadedTemplate.extraMaterials.length > 0 && {
				extraMaterials: uploadedTemplate.extraMaterials,
			}),
		}

		// Update signals
		this.convertedTemplate = convertedTemplate
		this.convertedBlocks = convertedBlocks
		this.convertedFabrics = convertedFabrics

		console.log('🎯 Converted template:', convertedTemplate)
		console.log('🧱 Converted blocks:', convertedBlocks)
		console.log('🎨 Converted fabrics:', convertedFabrics)
	}

	#autoSelectUploadedTemplate = async (): Promise<void> => {
		if (!this.convertedTemplate) return

		const template = this.convertedTemplate

		// Mimic the #onItemClick logic from template-view.ts
		this.selectedTemplates[template.category] = template

		if (template) {
			// Create a temporary fabric for the template using the first converted fabric
			let templateFabric: Fabric | undefined
			if (this.convertedFabrics.length > 0) {
				templateFabric = this.convertedFabrics[0]
			}

			// Get extra fabrics if they exist
			const extraFabrics: Fabric[] = []
			if (template.extraMaterials) {
				console.log(`🔍 Looking for extra fabrics...`)
				console.log(`📋 Available converted fabrics:`)
				this.convertedFabrics.forEach(fabric => {
					console.log(`   📎 ${fabric.materialName} (fabricId: ${fabric._id})`)
				})

				console.log(`🔗 Extra materials to find:`)
				for (const extraMaterial of template.extraMaterials) {
					console.log(`   🔗 ${extraMaterial.mesh} -> ${extraMaterial.materialId}`)

					const extraFabric = this.convertedFabrics.find(fabric => fabric._id === extraMaterial.materialId)
					if (extraFabric) {
						extraFabrics.push(extraFabric)
						console.log(`   ✅ Found fabric ${extraFabric.materialName} (fabricId: ${extraFabric._id})`)
					} else {
						console.warn(`   ❌ Extra fabric not found for materialId: ${extraMaterial.materialId}`)
						console.warn(
							`      Available fabrics: ${this.convertedFabrics.map(f => `${f.materialName} (${f._id})`).join(', ')}`,
						)
					}
				}

				console.log(`📦 Total extra fabrics found: ${extraFabrics.length}`)
			}

			// Collect all fabrics to preload (main + extras)
			const fabricsToPreload = []
			if (templateFabric) {
				fabricsToPreload.push(templateFabric)
			}
			fabricsToPreload.push(...extraFabrics)

			console.log('fabricsToPreload', fabricsToPreload)

			if (fabricsToPreload.length > 0) {
				// CONTINUE: handle loading? The store.loadingMaterialIds was unused (now deleted)
				// const loadingId = Symbol(`fabric-${templateFabric?._id || 'uploaded'}`)
				// store.addLoadingMaterial(loadingId)
				try {
					// Preload fabric textures (blocks are already uploaded and ready)
					await Promise.all(fabricsToPreload.map(fabric => textureManager.preloadFabricBaseTextures(fabric)))
				} catch (error) {
					console.warn('Failed to preload fabric textures:', error)
				} finally {
					// store.removeLoadingMaterial(loadingId)
				}
			}
		}

		const blocks: TemplateBlocksMap = new Map()
		const fabrics: TemplateFabricsMap = new Map()

		blocks.set(template.category, new Map() as CategoryBlocksMap)
		fabrics.set(template.category, new Map() as BlockFabricsMap)

		const blockMap = blocks.get(template.category)
		const fabricMap = fabrics.get(template.category)

		for (const block of this.convertedBlocks) {
			blockMap?.set(block.category, block)
			const blockFabrics: PieceFabricsMap = new Map()
			for (const fabric of this.convertedFabrics) {
				blockFabrics.set(fabric.assignedMesh || 'default', fabric)
			}
			fabricMap?.set(block.category as BlockCategory, blockFabrics)
		}

		// Replace blocks with uploaded blocks
		this.selectedBlocks = blocks
		this.selectedFabrics = fabrics

		console.log('🚀 Selected blocks:', blocks)
		console.log('🚀 Selected fabrics:', fabrics)

		console.log('🚀 Auto-selected uploaded template')
	}

	#toggleConfigPanel = () => {
		this.showConfigPanel = !this.showConfigPanel
		// Reset panel position when opening
		if (this.showConfigPanel) {
			this.panelX = -212
			this.panelY = -371
		}
	}

	#minimizeConfigPanel = () => {
		this.isMinimized = !this.isMinimized
	}

	#updateFabricProperties = () => {
		// Update all converted fabrics with new values
		this.convertedFabrics = this.convertedFabrics.map(fabric => ({
			...fabric,
			scaleX: this.fabricScaleX,
			scaleY: this.fabricScaleY,
			offsetX: this.fabricOffsetX,
			offsetY: this.fabricOffsetY,
			coef: this.fabricCoef,
			rotate: this.fabricRotate,
		}))

		// Update selected fabrics as well
		const updatedSelectedFabrics = new Map(this.selectedFabrics)
		for (const [, blockMap] of updatedSelectedFabrics) {
			for (const [, fabricMap] of blockMap) {
				for (const [meshName, fabric] of fabricMap) {
					fabricMap.set(meshName, {
						...fabric,
						scaleX: this.fabricScaleX,
						scaleY: this.fabricScaleY,
						offsetX: this.fabricOffsetX,
						offsetY: this.fabricOffsetY,
						coef: this.fabricCoef,
						rotate: this.fabricRotate,
					})
				}
			}
		}
		this.selectedFabrics = updatedSelectedFabrics

		console.log('Updated fabric properties:', {
			scaleX: this.fabricScaleX,
			scaleY: this.fabricScaleY,
			offsetX: this.fabricOffsetX,
			offsetY: this.fabricOffsetY,
			coef: this.fabricCoef,
			rotate: this.fabricRotate,
		})
		console.log('Updated selected fabrics:', this.selectedFabrics)
	}

	#handleScaleXChange = (e: Event) => {
		const value = parseFloat((e.target as HTMLInputElement).value)
		this.fabricScaleX = isNaN(value) ? 1 : value
		this.#updateFabricProperties()
	}

	#handleScaleYChange = (e: Event) => {
		const value = parseFloat((e.target as HTMLInputElement).value)
		this.fabricScaleY = isNaN(value) ? 1 : value
		this.#updateFabricProperties()
	}

	#handleOffsetXChange = (e: Event) => {
		const value = parseFloat((e.target as HTMLInputElement).value)
		this.fabricOffsetX = isNaN(value) ? DEFAULT_TEXTURE_CONFIG.offset[0] : value
		this.#updateFabricProperties()
	}

	#handleOffsetYChange = (e: Event) => {
		const value = parseFloat((e.target as HTMLInputElement).value)
		this.fabricOffsetY = isNaN(value) ? DEFAULT_TEXTURE_CONFIG.offset[1] : value
		this.#updateFabricProperties()
	}

	#handleCoefChange = (e: Event) => {
		const value = parseFloat((e.target as HTMLInputElement).value)
		this.fabricCoef = isNaN(value) ? DEFAULT_TEXTURE_CONFIG.coef : value
		this.#updateFabricProperties()
	}

	#handleRotateChange = (e: Event) => {
		const value = parseFloat((e.target as HTMLInputElement).value)
		this.fabricRotate = isNaN(value) ? DEFAULT_TEXTURE_CONFIG.rotate : value
		this.#updateFabricProperties()
	}

	#resetFabricProperties = () => {
		this.fabricScaleX = 9
		this.fabricScaleY = 9
		this.fabricOffsetX = DEFAULT_TEXTURE_CONFIG.offset[0]
		this.fabricOffsetY = DEFAULT_TEXTURE_CONFIG.offset[1]
		this.fabricCoef = DEFAULT_TEXTURE_CONFIG.coef
		this.fabricRotate = DEFAULT_TEXTURE_CONFIG.rotate
		this.#updateFabricProperties()
	}

	#handleDragStart = (e: MouseEvent | TouchEvent) => {
		e.preventDefault()
		this.isDragging = true

		const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
		const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

		const startX = clientX - this.panelX
		const startY = clientY - this.panelY

		const handleDragMove = (moveEvent: MouseEvent | TouchEvent) => {
			if (!this.isDragging) return

			const moveClientX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX
			const moveClientY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY

			this.panelX = moveClientX - startX
			this.panelY = moveClientY - startY
		}

		const handleDragEnd = () => {
			this.isDragging = false
			document.removeEventListener('mousemove', handleDragMove as EventListener)
			document.removeEventListener('mouseup', handleDragEnd)
			document.removeEventListener('touchmove', handleDragMove as EventListener)
			document.removeEventListener('touchend', handleDragEnd)
		}

		document.addEventListener('mousemove', handleDragMove as EventListener)
		document.addEventListener('mouseup', handleDragEnd)
		document.addEventListener('touchmove', handleDragMove as EventListener)
		document.addEventListener('touchend', handleDragEnd)
	}
	override template = () => html`
		<drippy-scene
			selected-space=${() => this.selectedSpace}
			selected-avatar=${() => this.selectedAvatar}
			selected-garments=${() => this.#getSelectedGarments()}
		></drippy-scene>

		<app-buttons-right>
			<app-buttons-group>
				<select
					id="avatar-select"
					onchange=${(e: Event) => {
						const value = (e.target as HTMLSelectElement).value
						this.selectedAvatar = value
					}}
				>
					<option disabled selected value>-- select an avatar --</option>
					<for-each
						items=${() => avatars}
						content=${() => (avatar: (typeof avatars)[number]) => html`
							<option value=${avatar.name}>${avatar.name}</option>
						`}
					></for-each>
				</select>
				<select
					id="space-select"
					onchange=${(e: Event) => {
						const value = (e.target as HTMLSelectElement).value
						this.selectedSpace = spaces.find(space => space.slug === value) ?? null
					}}
				>
					<option disabled selected value>-- select a space --</option>
					<for-each
						items=${() => spaces}
						content=${() => (space: (typeof spaces)[number]) => html`
							<option value=${space.slug}>${space.slug}</option>
						`}
					></for-each>
				</select>
			</app-buttons-group>
		</app-buttons-right>

		<app-buttons-left class="show-on-desktop">
			<app-buttons-group>
				<button class="upload-button" onclick=${this.#handleUploadClick} disabled=${() => this.isUploading}>
					${() => (this.isUploading ? 'Uploading...' : '📁 Upload Template Folder')}
				</button>
				<show-when
					condition=${() => this.convertedTemplate}
					content=${() => html`
						<button class="config-button left" onclick=${this.#toggleConfigPanel}>⚙️ Configure Fabric</button>
					`}
				></show-when>
			</app-buttons-group>
		</app-buttons-left>

		<app-buttons-right class="show-on-mobile" layout="bottom">
			<app-buttons-group>
				<show-when
					condition=${() => this.convertedTemplate}
					content=${() => html`
						<button class="config-button" onclick=${this.#toggleConfigPanel}>⚙️ Configure</button>
					`}
				></show-when>
				<button class="upload-button" onclick=${this.#handleUploadClick} disabled=${() => this.isUploading}>
					${() => (this.isUploading ? 'Uploading...' : '📁 Upload Template Folder')}
				</button>
			</app-buttons-group>
		</app-buttons-right>

		${() => this.uploadProgress && html` <div class="upload-progress">${this.uploadProgress}</div> `}

		<show-when
			condition=${() => this.showConfigPanel && this.convertedTemplate}
			content=${() => html`
				<div class="config-panel" style=${() => `transform: translate(${this.panelX}px, ${this.panelY}px);`}>
					<div class="config-panel-header" onmousedown=${this.#handleDragStart} ontouchstart=${this.#handleDragStart}>
						<h3>Fabric Configuration</h3>
						<div class="config-panel-header-right">
							<button class="minimize-button" onclick=${this.#minimizeConfigPanel}>
								${() => (this.isMinimized ? '📂' : '📁')}
							</button>
							<button class="close-button" onclick=${this.#toggleConfigPanel}>❌</button>
						</div>
					</div>
					<show-when
						condition=${() => !this.isMinimized}
						content=${() => html`
							<div class="config-panel-content">
								<div class="config-row">
									<div class="config-row-label">
										<label for="scale-x">Scale X:</label>
										<input
											id="scale-x"
											type="number"
											min="-99"
											max="99"
											step="1"
											value=${() => this.fabricScaleX}
											oninput=${this.#handleScaleXChange}
										/>
									</div>
									<input
										id="scale-x"
										type="range"
										min="-99"
										max="99"
										step="1"
										value=${() => this.fabricScaleX}
										oninput=${this.#handleScaleXChange}
									/>
								</div>
								<div class="config-row">
									<div class="config-row-label">
										<label for="scale-y">Scale Y:</label>
										<input
											id="scale-y"
											type="number"
											min="-99"
											max="99"
											step="1"
											value=${() => this.fabricScaleY}
											oninput=${this.#handleScaleYChange}
										/>
									</div>
									<input
										id="scale-y"
										type="range"
										min="-99"
										max="99"
										step="1"
										value=${() => this.fabricScaleY}
										oninput=${this.#handleScaleYChange}
									/>
								</div>
								<div class="config-row">
									<div class="config-row-label">
										<label for="offset-x">Offset X:</label>
										<input
											id="offset-x"
											type="number"
											min="0"
											max="1"
											step="0.0.1"
											value=${() => this.fabricOffsetX}
											oninput=${this.#handleOffsetXChange}
										/>
									</div>
									<input
										id="offset-x"
										type="range"
										min="0"
										max="1"
										step="0.01"
										value=${() => this.fabricOffsetX}
										oninput=${this.#handleOffsetXChange}
									/>
								</div>
								<div class="config-row">
									<div class="config-row-label">
										<label for="offset-y">Offset Y:</label>
										<input
											id="offset-y"
											type="number"
											min="0"
											max="1"
											step="0.01"
											value=${() => this.fabricOffsetY}
											oninput=${this.#handleOffsetYChange}
										/>
									</div>
									<input
										id="offset-y"
										type="range"
										min="0"
										max="1"
										step="0.01"
										value=${() => this.fabricOffsetY}
										oninput=${this.#handleOffsetYChange}
									/>
								</div>
								<div class="config-row">
									<div class="config-row-label">
										<label for="coef">Coefficient:</label>
										<input
											id="coef"
											type="number"
											min="0.1"
											max="1000"
											step="0.1"
											value=${() => this.fabricCoef}
											oninput=${this.#handleCoefChange}
										/>
									</div>
									<input
										id="coef"
										type="range"
										min="0.1"
										max="1000"
										step="0.1"
										value=${() => this.fabricCoef}
										oninput=${this.#handleCoefChange}
									/>
								</div>
								<div class="config-row">
									<div class="config-row-label">
										<label for="rotate">Rotation:</label>
										<input
											id="rotate"
											type="number"
											min="0"
											max="6.28"
											step="0.1"
											value=${() => this.fabricRotate}
											oninput=${this.#handleRotateChange}
										/>
									</div>
									<input
										id="rotate"
										type="range"
										min="0"
										max="6.28"
										step="0.1"
										value=${() => this.fabricRotate}
										oninput=${this.#handleRotateChange}
									/>
								</div>
								<div class="config-actions">
									<button class="reset-button" onclick=${this.#resetFabricProperties}>Reset to Default</button>
								</div>
							</div>
						`}
					></show-when>
				</div>
			`}
		></show-when>

		<bottom-sheet>
			<show-when
				condition=${() => this.convertedTemplate}
				content=${() => html`
					<bottom-sheet-header>
						<div class="template-header">
							<h2>Uploaded Template</h2>
							<p>Template uploaded successfully and ready to use</p>
						</div>
					</bottom-sheet-header>
					<div class="template-display-container">
						<div class="template-item">
							<item-card
								item-active=${true}
								item-src=${this.convertedTemplate?.thumb}
								item-alt=${this.convertedTemplate?.name}
								item-value=${this.convertedTemplate}
								object-fit="contain"
								object-position="center"
								aspect-ratio="0.79"
							></item-card>
							<div class="template-product-name">${this.convertedTemplate?.name}</div>
							<div class="template-product-price-container">
								<div class="template-product-price">Custom Template</div>
								<div class="template-product-wholesale">Ready to Drip</div>
							</div>
						</div>
					</div>
				`}
			></show-when>
		</bottom-sheet>
	`
	override css = css/*css*/ `
		* {
			box-sizing: border-box;
			user-select: none;
		}

		:host {
			width: 100%;
			height: 100%;
		}

		drippy-scene {
			width: 100%;
			height: 100%;
			overflow: hidden;
			box-sizing: border-box;
		}

		.upload-button {
			background: #007bff;
			color: white;
			border: none;
			border-radius: 8px;
			padding: 12px 24px;
			font-size: 14px;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.2s ease;
			display: flex;
			align-items: center;
			gap: 8px;
			min-width: 140px;
			justify-content: center;
		}

		.upload-button:hover:not(:disabled) {
			background: #0056b3;
			transform: translateY(-1px);
		}

		.upload-button:disabled {
			background: #6c757d;
			cursor: not-allowed;
		}

		.config-row-label {
			display: flex;
			align-items: center;
			gap: 8px;
			justify-content: space-between;
			width: 100%;

			input[type='number'] {
				width: 50px;
			}
		}

		.config-button {
			background: #28a745;
			color: white;
			border: none;
			border-radius: 8px;
			padding: 12px 24px;
			font-size: 14px;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.2s ease;
			display: flex;
			align-items: center;
			gap: 8px;
			min-width: 140px;
			justify-content: center;
		}

		.config-button.left {
			margin-left: 0;
			margin-right: auto;
		}

		.config-button:hover {
			background: #218838;
			transform: translateY(-1px);
		}

		.upload-progress {
			position: fixed;
			bottom: 20px;
			right: 20px;
			background: #28a745;
			color: white;
			padding: 12px 20px;
			border-radius: 8px;
			font-weight: 500;
			z-index: 1000;
			box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		}

		.config-panel {
			position: fixed;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			background: white;
			border-radius: 12px;
			box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
			z-index: 1001;
			min-width: 400px;
			max-width: 90vw;
			transition: box-shadow 0.2s ease;
		}

		.config-panel:has(.config-panel-header:active) {
			box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);
		}

		.config-panel-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 20px 24px 16px;
			border-bottom: 1px solid #e9ecef;
			cursor: move;
			cursor: grab;
			user-select: none;
		}

		.config-panel-header:active {
			cursor: grabbing;
		}

		.config-panel-header h3 {
			margin: 0;
			color: #343a40;
			font-size: 18px;
			font-weight: 600;
		}

		.config-panel-header-right {
			display: flex;
			align-items: center;
			gap: 8px;
		}

		.minimize-button {
			background: none;
			border: none;
			font-size: 18px;
			color: #6c757d;
			cursor: pointer;
		}

		.minimize-button:hover {
			background: #f8f9fa;
			color: #495057;
		}

		.close-button {
			background: none;
			border: none;
			font-size: 18px;
			color: #6c757d;
			cursor: pointer;
			padding: 4px;
			border-radius: 4px;
			transition: all 0.2s ease;
			z-index: 1;
			position: relative;
		}

		.close-button:hover {
			background: #f8f9fa;
			color: #495057;
		}

		.config-panel-content {
			padding: 24px;
		}

		.config-row {
			display: flex;
			flex-direction: column;
			gap: 8px;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 20px;
		}

		.config-row:last-child {
			margin-bottom: 0;
		}

		.config-row label {
			font-weight: 500;
			color: #495057;
			font-size: 14px;
		}

		.config-row input {
			width: 100%;
			padding: 8px 0px;
			border: 1px solid #ced4da;
			border-radius: 6px;
			font-size: 14px;
			text-align: right;
		}

		.config-row input:focus {
			outline: none;
			border-color: #007bff;
			box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
		}

		.config-actions {
			margin-top: 24px;
			padding-top: 20px;
			border-top: 1px solid #e9ecef;
		}

		.reset-button {
			width: 100%;
			background: #6c757d;
			color: white;
			border: none;
			border-radius: 6px;
			padding: 10px 16px;
			font-size: 14px;
			font-weight: 500;
			cursor: pointer;
			transition: all 0.2s ease;
		}

		.reset-button:hover {
			background: #5a6268;
		}

		.tabs-container {
			width: 100%;
		}

		.tabs-content-container {
			padding: 20px;
		}

		.materials-info {
			text-align: center;
			margin-bottom: 20px;
			padding: 16px;
			background: rgba(0, 123, 255, 0.1);
			border-radius: 8px;
		}

		.materials-info h3 {
			margin: 0 0 8px 0;
			color: #007bff;
			font-size: 18px;
		}

		.materials-info p {
			margin: 0;
			color: #6c757d;
			font-size: 14px;
		}

		.folder-structure-info {
			margin-top: 16px;
			padding: 12px;
			background: rgba(40, 167, 69, 0.1);
			border-radius: 6px;
			border-left: 4px solid #28a745;
		}

		.folder-structure-info h4 {
			margin: 0 0 8px 0;
			color: #28a745;
			font-size: 14px;
			font-weight: 600;
		}

		.folder-structure-info pre {
			margin: 0;
			font-size: 11px;
			line-height: 1.4;
			color: #495057;
			background: rgba(255, 255, 255, 0.8);
			padding: 8px;
			border-radius: 4px;
			overflow-x: auto;
			white-space: pre;
			font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		}

		.items-grid {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
			gap: 16px;
			max-height: 400px;
			overflow-y: auto;
		}

		.material-info {
			position: absolute;
			bottom: 0;
			left: 0;
			right: 0;
			background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
			color: white;
			padding: 8px;
			font-size: 12px;
		}

		.material-name {
			display: block;
			font-weight: 600;
			margin-bottom: 2px;
		}

		.material-category {
			display: block;
			opacity: 0.8;
			font-size: 10px;
		}

		.no-materials {
			text-align: center;
			padding: 40px 20px;
			color: #6c757d;
		}

		.no-materials p {
			margin: 8px 0;
		}

		.template-header {
			text-align: center;
			padding: 20px;
			background: var(--uiColorPrimaryWhite);
		}

		.template-header h2 {
			margin: 0 0 8px 0;
			color: #28a745;
			font-size: 20px;
			font-weight: 600;
		}

		.template-header p {
			margin: 0;
			color: #6c757d;
			font-size: 14px;
		}

		.template-display-container {
			padding: 20px;
			background: var(--uiColorPrimaryWhite);
			display: flex;
			justify-content: center;
		}

		.template-item {
			min-width: 0;
			min-height: 0;
			width: 200px;
			display: flex;
			flex-direction: column;
			gap: var(--uiSpacingTiny);
		}

		.template-product-name {
			font-size: var(--fontSizeTextXs);
			font-weight: var(--fontWeightSemiBold);
			color: #424347;
			text-align: center;
		}

		.template-product-price-container {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 4px;
		}

		.template-product-price {
			font-size: var(--fontSizeTextXs);
			font-weight: var(--fontWeightNormal);
			color: #28a745;
			text-align: center;
		}

		.template-product-wholesale {
			font-size: var(--fontSizeTextXxs);
			font-weight: var(--fontWeightNormal);
			color: #6c757d;
			text-align: center;
		}

		.show-on-desktop {
			display: block;
		}

		.show-on-mobile {
			display: none;
		}

		@media (max-width: 767px) {
			.upload-progress {
				right: unset;
				bottom: unset;
				top: 20px;
				left: 20px;
			}

			.show-on-desktop {
				display: none;
			}

			.show-on-mobile {
				display: block;
			}

			.items-grid {
				grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
				gap: 12px;
			}

			.config-panel {
				min-width: unset;
				width: 90vw;
				max-width: 400px;
			}

			.config-panel-header {
				padding: 16px 20px 12px;
			}

			.config-panel-content {
				padding: 20px;
			}

			.config-row {
				flex-direction: column;
				align-items: flex-start;
				gap: 8px;
				margin-bottom: 16px;
			}

			.config-row input {
				width: 100%;
				text-align: left;
			}
		}
	`
}
