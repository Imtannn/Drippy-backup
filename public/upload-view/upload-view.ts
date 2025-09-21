import {css, element, Element, html, signal} from 'lume'
import {Meteor} from 'meteor/meteor'
import '../app/app-buttons.js'
import '../app/drippy-scene.js'
import '../app/item-card.js'
import {store} from '../app/store.js'
import {textureManager} from '../app/texture-manager.js'
import {avatars} from '../consts/avatars.js'
import {spaces} from '../consts/spaces.js'
import '../elements/bottom-sheet.js'
import '../elements/logic/for-each.js'
import '../elements/logic/show-when.js'
import '../elements/tabs.js'
import type {Block, BlockCategory, TemplateCategory as BlockTemplateCategory} from '../types/block.js'
import type {Fabric, FabricCategory} from '../types/fabric.js'
import type {Template, TemplateCategory} from '../types/template.js'
import type {Space} from '../types/types.js'
import * as THREE from 'three'

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
	static elementName = 'upload-view'

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
	@signal selectedFabrics: Map<TemplateCategory, Map<BlockCategory, Map<string, Fabric>>> = new Map()
	@signal selectedBlocks: Map<TemplateCategory, Map<BlockCategory, Block>> = new Map()
	@signal selectedTemplates: Map<TemplateCategory, Template> = new Map()

	// DOM elements
	private fileInput?: HTMLInputElement

	connectedCallback() {
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
		this.selectedTemplates = new Map()
		this.uploadProgress = ''
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

		// Upload template thumbnail if it exists
		let templateThumbnailUrl: string | undefined
		if (templateThumbnail) {
			try {
				// Validate file data before upload
				if (!templateThumbnail.name || !templateThumbnail.name.trim()) {
					console.warn('Template thumbnail has no filename, skipping upload')
					return null
				}

				const fileData = await this.#fileToBase64(templateThumbnail)

				// Validate base64 data
				const base64Data = this.#extractBase64Data(fileData)
				if (!base64Data) {
					console.warn('Failed to extract base64 data from template thumbnail, skipping upload')
					return null
				}

				// Determine content type with fallback
				const contentType = this.#getContentType(templateThumbnail)

				const result = await this.#callMeteorMethod('files.upload', {
					fileName: templateThumbnail.name.trim(),
					fileData: base64Data,
					contentType,
					folder: `testing/templates/${templateName}`,
				})
				console.log(result)
				if (result.success) {
					templateThumbnailUrl = result.url
				}
			} catch (error) {
				console.error(`Failed to upload template thumbnail:`, error)
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
		templateName: string,
		subfolder?: string,
		meshName?: string,
	): Promise<UploadedMaterial | null> => {
		try {
			const uploadedFiles = new Map<string, string>()

			// Upload all material files
			for (const file of files) {
				// Validate file data before upload
				if (!file.name || !file.name.trim()) {
					console.warn(`Skipping file with no name in material ${materialName}`)
					continue
				}

				try {
					const fileData = await this.#fileToBase64(file)

					// Validate base64 data
					const base64Data = this.#extractBase64Data(fileData)
					if (!base64Data) {
						console.warn(`Failed to extract base64 data from ${file.name}, skipping upload`)
						continue
					}

					// Determine content type with fallback
					const contentType = this.#getContentType(file)

					const folderPath = subfolder
						? `testing/templates/${templateName}/${subfolder}/${materialName}`
						: `testing/templates/${templateName}/materials/${materialName}`

					const result = await this.#callMeteorMethod('files.upload', {
						fileName: file.name.trim(),
						fileData: base64Data,
						contentType,
						folder: folderPath,
					})

					if (result.success) {
						const fileName = file.name.toLowerCase()

						// Categorize file by name patterns
						if (fileName.includes('render') || fileName.includes('thumb')) {
							uploadedFiles.set('thumb', result.url)
						} else if (fileName.includes('normal')) {
							uploadedFiles.set('normal', result.url)
						} else if (fileName.includes('base')) {
							uploadedFiles.set('baseColor', result.url)
						} else if (fileName.includes('displace')) {
							uploadedFiles.set('displacement', result.url)
						} else if (fileName.includes('rough')) {
							uploadedFiles.set('roughness', result.url)
						} else if (fileName.includes('alpha')) {
							uploadedFiles.set('alpha', result.url)
						}
					}
				} catch (error) {
					console.error(`Failed to upload ${file.name}:`, error)
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

	#fileToBase64 = (file: File): Promise<string> => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader()
			reader.onload = () => resolve(reader.result as string)
			reader.onerror = reject
			reader.readAsDataURL(file)
		})
	}

	#extractBase64Data = (dataUrl: string): string | null => {
		if (!dataUrl || typeof dataUrl !== 'string') {
			return null
		}

		// Check if it's a proper data URL format
		if (!dataUrl.startsWith('data:')) {
			return null
		}

		const commaIndex = dataUrl.indexOf(',')
		if (commaIndex === -1) {
			return null
		}

		const base64Data = dataUrl.substring(commaIndex + 1)

		// Validate that we have actual data
		if (!base64Data || base64Data.trim().length === 0) {
			return null
		}

		return base64Data
	}

	#getContentType = (file: File): string => {
		// First try to use the file's type property
		if (file.type && file.type.trim()) {
			return file.type
		}

		// Fallback to determining content type from file extension
		const fileName = file.name.toLowerCase()

		if (fileName.endsWith('.png')) {
			return 'image/png'
		} else if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) {
			return 'image/jpeg'
		} else if (fileName.endsWith('.gif')) {
			return 'image/gif'
		} else if (fileName.endsWith('.webp')) {
			return 'image/webp'
		} else if (fileName.endsWith('.svg')) {
			return 'image/svg+xml'
		} else if (fileName.endsWith('.bmp')) {
			return 'image/bmp'
		} else if (fileName.endsWith('.tiff') || fileName.endsWith('.tif')) {
			return 'image/tiff'
		}

		// Default fallback for images
		return 'application/octet-stream'
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
					// Upload block files
					const [pngBuffer, gltfBuffer] = await Promise.all([
						this.#fileToBase64(matchingPng),
						this.#fileToBase64(gltfFile),
					])

					// Extract base64 data
					const pngBase64 = this.#extractBase64Data(pngBuffer)
					const gltfBase64 = this.#extractBase64Data(gltfBuffer)

					if (!pngBase64 || !gltfBase64) {
						console.warn(`Failed to extract base64 data for block ${baseName}`)
						continue
					}

					// Upload to server
					const [blockThumbResult, blockModelResult] = await Promise.all([
						this.#callMeteorMethod('files.upload', {
							fileName: matchingPng.name,
							fileData: pngBase64,
							contentType: this.#getContentType(matchingPng),
							folder: `testing/templates/${templateName}/blocks/${blockTypeFolder}`,
						}),
						this.#callMeteorMethod('files.upload', {
							fileName: gltfFile.name,
							fileData: gltfBase64,
							contentType: gltfFile.name.toLowerCase().endsWith('.gltf') ? 'model/gltf+json' : 'model/gltf-binary',
							folder: `testing/templates/${templateName}/blocks/${blockTypeFolder}`,
						}),
					])

					if (blockThumbResult.success && blockModelResult.success) {
						blocks.push({
							_id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
							blockName: this.#capitalize(baseName),
							category: this.#normalizeBlockCategory(blockTypeFolder) as BlockCategory,
							templateName: templateName,
							thumbUrl: blockThumbResult.url,
							modelUrl: blockModelResult.url,
						})

						console.log(`    ✅ Uploaded block ${baseName}`)
					}
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
				const materialId = `${materialCategory} - ${materialName}`

				// Process the material files and upload them
				const processedMaterial = await this.#processMaterialFiles(
					materialFiles,
					materialFolderName,
					templateName,
					`extra_materials/${meshName}`,
					meshName,
				)

				if (processedMaterial) {
					// Add the processed material to our collection
					processedMaterials.push(processedMaterial)

					console.log(`    ✅ Processed extra material: ${materialId}`)
				}

				// Sanitize mesh name (similar to THREE.PropertyBinding.sanitizeNodeName)
				const sanitizedMeshName = THREE.PropertyBinding.sanitizeNodeName(meshName).toLowerCase()

				extraMaterials.push({
					mesh: sanitizedMeshName,
					materialId: materialId,
				})

				console.log(`    🔗 Mesh "${meshName}" -> Material "${materialId}"`)
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
			console.log(`   📎 ${material.category} - ${material.materialName}`)
		})

		console.log(`🔗 Found ${uploadedTemplate.extraMaterials.length} extra material mappings:`)
		uploadedTemplate.extraMaterials.forEach(extra => {
			console.log(`   🔗 ${extra.mesh} -> ${extra.materialId}`)
		})

		// Convert materials to fabrics
		const convertedFabrics: Fabric[] = uploadedTemplate.materials.map((material, index) => ({
			_id: (index + 1).toString(),
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
		}))

		console.log(`✅ All extra materials processed and added to materials list`)

		// Convert blocks to system format
		const convertedBlocks: Block[] = uploadedTemplate.blocks.map((block, index) => ({
			_id: (index + 1).toString(),
			thumb: block.thumbUrl,
			modelFile: block.modelUrl,
			blockName: block.blockName,
			avatar: 'Female' as const,
			category: block.category as BlockCategory,
			templateId: '1', // Will be set properly
			templateName: uploadedTemplate.templateName,
			templateCategory: 'Dress' as BlockTemplateCategory, // Default category for uploaded templates
		}))

		// Convert template to system format
		const convertedTemplate: Template = {
			_id: '1',
			thumb: uploadedTemplate.templateThumbnail || '',
			name: uploadedTemplate.templateName,
			avatar: 'Female' as const,
			category: 'Dress' as TemplateCategory, // Default category for uploaded templates
			materialId:
				convertedFabrics.length > 0 ? `${convertedFabrics[0].category} - ${convertedFabrics[0].materialName}` : '',
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
		this.selectedTemplates.set(template.category, template)
		this.selectedTemplates = new Map(this.selectedTemplates)

		const selectedTemplate = this.selectedTemplates.get(template.category)

		if (selectedTemplate) {
			// Create a temporary fabric for the template using the first converted fabric
			let templateFabric: Fabric | undefined
			if (this.convertedFabrics.length > 0) {
				templateFabric = this.convertedFabrics[0]
			}

			// Get extra fabrics if they exist
			const extraFabrics: Fabric[] = []
			if (selectedTemplate.extraMaterials) {
				console.log(`🔍 Looking for extra fabrics...`)
				console.log(`📋 Available converted fabrics:`)
				this.convertedFabrics.forEach(fabric => {
					console.log(`   📎 ${fabric.category} - ${fabric.materialName}`)
				})

				console.log(`🔗 Extra materials to find:`)
				for (const extraMaterial of selectedTemplate.extraMaterials) {
					console.log(`   🔗 ${extraMaterial.mesh} -> ${extraMaterial.materialId}`)

					const extraFabric = this.convertedFabrics.find(
						fabric => `${fabric.category} - ${fabric.materialName}` === extraMaterial.materialId,
					)
					if (extraFabric) {
						extraFabrics.push(extraFabric)
						console.log(`   ✅ Found fabric for ${extraMaterial.materialId}`)
					} else {
						console.warn(`   ❌ Extra fabric not found for materialId: ${extraMaterial.materialId}`)
						console.warn(
							`      Available fabrics: ${this.convertedFabrics.map(f => `${f.category} - ${f.materialName}`).join(', ')}`,
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
				const loadingId = Symbol(`fabric-${templateFabric?._id || 'uploaded'}`)
				store.addLoadingMaterial(loadingId)
				try {
					// Preload fabric textures (blocks are already uploaded and ready)
					await Promise.all(fabricsToPreload.map(fabric => textureManager.preloadFabricBaseTextures(fabric)))
				} catch (error) {
					console.warn('Failed to preload fabric textures:', error)
				} finally {
					store.removeLoadingMaterial(loadingId)
				}
			}
		}

		const blocks = new Map<TemplateCategory, Map<BlockCategory, Block>>()
		const fabrics = new Map<TemplateCategory, Map<BlockCategory, Map<string, Fabric>>>()

		blocks.set(template.category, new Map<BlockCategory, Block>())
		fabrics.set(template.category, new Map<BlockCategory, Map<string, Fabric>>())

		const blockMap = blocks.get(template.category)
		const fabricMap = fabrics.get(template.category)

		for (const block of this.convertedBlocks) {
			blockMap?.set(block.category, block)
			const blockFabrics = new Map<string, Fabric>()
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

	#callMeteorMethod = (method: string, ...args: any[]): Promise<any> => {
		return new Promise((resolve, reject) => {
			Meteor.call(method, ...args, (error: any, result: any) => {
				if (error) {
					reject(error)
				} else {
					resolve(result)
				}
			})
		})
	}

	template = () => html`
		<drippy-scene
			selected-space=${() => this.selectedSpace}
			selected-avatar=${() => this.selectedAvatar}
			selected-blocks=${() => this.selectedBlocks}
			selected-fabrics=${() => this.selectedFabrics}
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
							<option value=${avatar.value}>${avatar.value}</option>
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
			</app-buttons-group>
		</app-buttons-left>

		<app-buttons-right class="show-on-mobile" layout="bottom">
			<app-buttons-group>
				<button class="upload-button" onclick=${this.#handleUploadClick} disabled=${() => this.isUploading}>
					${() => (this.isUploading ? 'Uploading...' : '📁 Upload Template Folder')}
				</button>
			</app-buttons-group>
		</app-buttons-right>

		${() => this.uploadProgress && html` <div class="upload-progress">${this.uploadProgress}</div> `}

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

	css = css/*css*/ `
		* {
			box-sizing: border-box;
			user-select: none;
		}

		:host {
			width: var(--appWidth);
			height: var(--appHeight);
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
		}
	`
}
