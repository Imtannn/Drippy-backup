import * as AWS from 'aws-sdk'
import * as fs from 'fs'
import * as https from 'https'
import * as path from 'path'
import sharp from 'sharp'
import * as THREE from 'three'

type TODO = any

// Google Drive API Key (you can get this from Google Cloud Console for free)
const API_KEY = process.env.GOOGLE_API_KEY || 'GOOGLE_API_KEY'

// AWS S3 Configuration
const S3_BUCKET = process.env.S3_BUCKET || 'your-bucket-name'
const S3_REGION = process.env.S3_REGION || 'us-east-1'
const S3_ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID
const S3_SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY

// Configure AWS
AWS.config.update({
	accessKeyId: S3_ACCESS_KEY,
	secretAccessKey: S3_SECRET_KEY,
	region: S3_REGION,
})

const s3 = new AWS.S3()

// Brand configurations with Google Drive folder IDs
const BRAND_CONFIGS = [
	{
		brand: 'vaishnavi',
		rootFolderId: '1BlQcj37sCkY7PhQijHP5HjC0jyrlmzWt',
	},
	{
		brand: 'haruki',
		rootFolderId: '1-_x-GVUxGBn4S1VDI6t3dFN990IG-VWu',
	},
	{
		brand: 'lostCause',
		rootFolderId: '1Numw3ThiF4y2kcADnzKf2T9xaYqPMute',
	},
	{
		brand: 'shri',
		rootFolderId: '1hAUwnocS029C_Jvep_-3NdQMxfppwg7r',
	},
	{
		brand: 'eliseF',
		rootFolderId: '1k2wrq4CUoLBhKMww0JEWU66DjLIzucsB',
	},
	{
		brand: 'oofya',
		rootFolderId: '1ymJMcl0S3Em6fteG_qsUMiDXn9lH2Isd',
	},
	{
		brand: 'theSoul',
		rootFolderId: '19Oq6abu1SnMTLSJHS0VY_GT1pAvpdU0T',
	},
	{
		brand: 'moidien',
		rootFolderId: '11fS4TFpvw2EGraj1Dp3IbbVhlxEXwdC-',
	},
	{
		brand: 'emwear',
		rootFolderId: '15zHjnYVfII_Z2cr17_6Vp7kscWm9UIAU',
	},
	{
		brand: 'atelierGourney',
		rootFolderId: '17aBfgFcD7Liq9fB_KC57rl5S2w-O4LYf',
	},
	// {
	// 	brand: 'baroudeuses',
	// 	rootFolderId: '1Eu5LyK8R-DGEkCys50KJ-7EatssA3X2w',
	// },
	// Add more brands here as needed
	// {
	//   brand: 'another-brand',
	//   rootFolderId: 'another-folder-id',
	// },
]

const allFabrics: TODO[] = []
const rootMaterials: Map<string, TODO> = new Map() // materialName -> material data
const categoryMaterialAssignments: Map<string, Set<string>> = new Map() // categoryName -> Set of materialNames

// Retry wrapper function
async function withRetry<T>(operation: () => Promise<T>, maxRetries: number = 3, delayMs: number = 1000): Promise<T> {
	let lastError: Error

	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			return await operation()
		} catch (error) {
			lastError = error as Error
			console.log(`⚠️  Attempt ${attempt}/${maxRetries} failed: ${lastError.message}`)

			if (attempt < maxRetries) {
				const delay = delayMs * attempt // Exponential backoff
				console.log(`   Retrying in ${delay}ms...`)
				await new Promise(resolve => setTimeout(resolve, delay))
			}
		}
	}

	throw lastError!
}

// Helper function to make HTTP requests
function makeRequest<T = unknown>(url: string): Promise<T> {
	return withRetry(() => {
		return new Promise<T>((resolve, reject) => {
			https
				.get(url, res => {
					let data = ''
					res.on('data', chunk => {
						data += chunk
					})
					res.on('end', () => {
						try {
							resolve(JSON.parse(data))
						} catch (e) {
							reject(e)
						}
					})
				})
				.on('error', reject)
		})
	})
}

// Get Google Drive download URL for a file
function getDriveDownloadUrl(fileId: string): string {
	return `https://drive.google.com/uc?export=download&id=${fileId}`
}

// Upload buffer to S3 and return the public URL
async function uploadToS3(
	buffer: Buffer,
	key: string,
	contentType: string,
	lossless: boolean = false,
	toWebp: boolean = true,
): Promise<string> {
	let uploadBuffer = buffer
	let uploadKey = key
	let uploadContentType = contentType

	if (contentType.startsWith('image/')) {
		try {
			let sharpInstance = sharp(buffer)

			// Resize to 200px width if not lossless
			if (!lossless) {
				sharpInstance = sharpInstance.resize(200, null, {
					withoutEnlargement: true,
				})
			}
			if (toWebp) {
				uploadBuffer = await sharpInstance.webp({lossless: lossless, quality: lossless ? 100 : 75}).toBuffer()
				uploadContentType = 'image/webp'
				uploadKey = path.extname(uploadKey) ? uploadKey.replace(/\.[^./]+$/, '.webp') : `${uploadKey}.webp`
			}
		} catch (error) {
			console.error('Error converting image to WebP:', error)
		}
	}

	const params = {
		Bucket: S3_BUCKET,
		Key: uploadKey.replace(/ /g, '_'),
		Body: uploadBuffer,
		ContentType: uploadContentType,
		ACL: 'public-read',
	}

	try {
		const result = await s3.upload(params).promise()
		return result.Location
	} catch (error) {
		console.error('Error uploading to S3:', error)
		throw error
	}
}

// Download file to buffer instead of saving locally
function downloadToBuffer(url: string): Promise<Buffer> {
	return withRetry(() => {
		return new Promise<Buffer>((resolve, reject) => {
			https
				.get(url, response => {
					// Handle redirects
					if (response.statusCode === 302 || response.statusCode === 301 || response.statusCode === 303) {
						const location = response.headers.location
						if (!location) {
							reject(new Error('Redirect location not provided'))
							return
						}
						return downloadToBuffer(location).then(resolve).catch(reject)
					}

					if (response.statusCode !== 200) {
						reject(new Error(`Download failed with status ${response.statusCode}`))
						return
					}

					const chunks: Buffer[] = []
					response.on('data', chunk => {
						chunks.push(chunk)
					})

					response.on('end', () => {
						const buffer = Buffer.concat(chunks)
						resolve(buffer)
					})

					response.on('error', reject)
				})
				.on('error', reject)
		})
	})
}

async function fetchFolderContents(folderId: string): Promise<TODO[]> {
	try {
		const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType,parents)&key=${API_KEY}`
		const response = await makeRequest<{files: TODO[]}>(url)
		return response.files || []
	} catch (error) {
		console.error('Error fetching folder contents:', error)
		return []
	}
}

function normalizeName(name: string): string {
	// Remove _ characters in name and trim all spaces
	// Trim double spaces
	return name.replace(/_/g, ' ').trim().replace(/\s+/g, ' ')
}

function capitalize(name: string): string {
	return name.toLowerCase().replace(/\b\w/g, char => char.toUpperCase())
}

function normalizeBlockCategory(folderName: string): string {
	// Normalize block type folder names to exact category names
	if (folderName.toLowerCase().includes('bodice')) return 'Bodice'
	if (folderName.toLowerCase().includes('pants')) return 'Pants'
	if (folderName.toLowerCase().includes('sleeves')) return 'Sleeves'
	if (folderName.toLowerCase().includes('dress')) return 'Dress'
	if (folderName.toLowerCase().includes('coat')) return 'Coat'
	if (folderName.toLowerCase().includes('skirt')) return 'Skirt'
	if (folderName.toLowerCase().includes('fullbody')) return 'Full Body'
	if (folderName.toLowerCase().includes('hat')) return 'Hat'
	if (folderName.toLowerCase().includes('bag')) return 'Bag'
	if (folderName.toLowerCase().includes('accessory')) return 'Accessory'
	return folderName // fallback to original name
}

// Process a template folder and extract template info and blocks
async function processTemplateFolder(
	templateFolder: TODO,
	category: string,
	brand: string,
): Promise<{template: TODO; blocks: TODO[]; unsucceeded: TODO[]}> {
	console.log(`  📂 Processing template: ${templateFolder.name}`)

	const templateContents = await fetchFolderContents(templateFolder.id)

	// Find template thumbnail (PNG file in root of template folder)
	const templateThumbnail = templateContents.find(
		file => file.mimeType !== 'application/vnd.google-apps.folder' && file.name.toLowerCase().endsWith('.png'),
	)

	if (!templateThumbnail) {
		console.warn(`  ⚠️  No template thumbnail found for ${templateFolder.name}`)
		return {template: null, blocks: [], unsucceeded: []}
	}

	// Find block type folders
	const blockTypeFolders = templateContents.filter(
		item =>
			item.mimeType === 'application/vnd.google-apps.folder' &&
			['bodice', 'pants', 'sleeves', 'hat', 'dress', 'skirt', 'fullbody', 'bag', 'accessory', 'coat'].some(blockType =>
				item.name.toLowerCase().includes(blockType.toLowerCase()),
			),
	)

	const materialFolders = templateContents.filter(
		item => item.mimeType === 'application/vnd.google-apps.folder' && normalizeName(item.name) === 'Materials',
	)

	let materialFolder = materialFolders?.[0] as TODO
	if (!materialFolder) {
		console.warn(`  ⚠️  No material folders found for ${templateFolder.name}`)
	} else {
		console.log(`    Found ${materialFolder.name} material folder`)
	}

	// Find Extra Materials folder in template
	const extraMaterialsFolders = templateContents.filter(
		item => item.mimeType === 'application/vnd.google-apps.folder' && normalizeName(item.name) === 'Extra Materials',
	)

	let extraMaterials: {mesh: string; materialId: string}[] = []
	if (extraMaterialsFolders.length > 0) {
		extraMaterials = await processExtraMaterialsFolder(extraMaterialsFolders[0])
	}

	let materialContents: TODO[] = []
	if (materialFolder) {
		materialContents = await fetchFolderContents(materialFolder.id)
	}

	// Find material reference folders in template
	const materialReferenceFolders = materialContents.filter(
		item => item.mimeType === 'application/vnd.google-apps.folder',
	)

	if (blockTypeFolders.length === 0) {
		console.warn(`  ⚠️  No block type folders found for ${templateFolder.name}`)
		return {template: null, blocks: [], unsucceeded: []}
	}

	console.log(`    Found ${blockTypeFolders.length} block type folders`)
	if (materialReferenceFolders.length > 0) {
		console.log(`    Found ${materialReferenceFolders.length} material reference folders`)
	}

	// Download template thumbnail
	const templateThumbnailUrl = getDriveDownloadUrl(templateThumbnail.id)
	const templateThumbnailBuffer = await downloadToBuffer(templateThumbnailUrl)
	const templateS3Url = await uploadToS3(
		templateThumbnailBuffer,
		`images/${brand}/templates/${category}/${templateFolder.name}.png`,
		'image/png',
	)

	// Process material references if they exist
	let materialId: string | null = null
	if (materialReferenceFolders.length > 0) {
		console.log(`    📁 Processing material references for template`)

		// Get material reference (just use the first one for template reference)
		materialId = await getTemplateMaterialReference(materialReferenceFolders[0])
		console.log(`     📎 Material reference: ${materialId}`)

		// Add this category to the material's templateCategories
		if (materialId && rootMaterials.has(materialId)) {
			console.log(`     🔗 Adding category "${category}" to material "${materialId}"`)
			console.log(
				`     📊 Before: templateCategories = ${Array.from(rootMaterials.get(materialId)!.templateCategories)}`,
			)
			rootMaterials.get(materialId)!.templateCategories.add(category)
			console.log(
				`     📊 After: templateCategories = ${Array.from(rootMaterials.get(materialId)!.templateCategories)}`,
			)
		} else if (materialId) {
			console.warn(`     ⚠️ Material "${materialId}" not found in rootMaterials`)
			console.log(`     📋 Available materials: ${Array.from(rootMaterials.keys()).join(', ')}`)
		}
	}

	// Parse template name and price from folder name
	const folderNameParts = templateFolder.name.split('-')
	let templateName = normalizeName(templateFolder.name)
	let templatePrice = 'N/A'

	if (folderNameParts.length >= 2) {
		templateName = normalizeName(folderNameParts[0].trim())
		// Extract only numeric part from price (including decimals)
		const priceMatch = folderNameParts[1].trim().match(/\d+(\.\d+)?/)
		templatePrice = priceMatch ? priceMatch[0] : 'N/A'
	}

	const template = {
		name: templateName,
		price: templatePrice,
		category,
		thumbUrl: templateS3Url,
		materialId,
		folderId: templateFolder.id, // Add unique Google Drive folder ID
		...(extraMaterials.length > 0 && {extraMaterials}),
	}

	// Process blocks in each block type folder
	const allBlocks: TODO[] = []
	const unsucceeded: TODO[] = []

	for (const blockTypeFolder of blockTypeFolders) {
		console.log(`    📁 Processing block type: ${blockTypeFolder.name}`)

		const blockTypeContents = await fetchFolderContents(blockTypeFolder.id)
		if (blockTypeContents.length === 0) {
			console.warn(`      ⚠️ No block type files found for ${blockTypeFolder.name}`)
			continue
		}
		const gltfFiles = blockTypeContents.filter(
			(f: TODO) => f.name.toLowerCase().endsWith('.gltf') || f.name.toLowerCase().endsWith('.glb'),
		)
		let pngFiles = blockTypeContents.filter((f: TODO) => f.name.toLowerCase().endsWith('.png'))

		if (pngFiles.length === 0) {
			console.warn(`      ⚠️ No Block PNG files found for ${blockTypeFolder.name}`)
			console.log('      📥 Using template thumbnail as block thumbnail')
			pngFiles = [templateThumbnail]
		}
		console.log(
			`      📁 Found ${gltfFiles.length} GLTF files and ${pngFiles.length} PNG files, block type: ${gltfFiles[0]?.name || ''} ${pngFiles[0]?.name || ''}`,
		)

		// Match GLTF and PNG pairs
		for (const gltfFile of gltfFiles) {
			const baseName = path.basename(gltfFile.name, path.extname(gltfFile.name)).toLowerCase()
			const matchingPng = pngFiles[0]

			if (matchingPng) {
				console.log(`      📥 Processing block: ${baseName}`)

				try {
					// Download block files
					const [pngBuffer, gltfBuffer] = await Promise.all([
						downloadToBuffer(getDriveDownloadUrl(matchingPng.id)),
						downloadToBuffer(getDriveDownloadUrl(gltfFile.id)),
					])

					// Upload to S3
					const [blockThumbS3Url, blockModelS3Url] = await Promise.all([
						uploadToS3(
							pngBuffer,
							`images/${brand}/blocks/${category}/${blockTypeFolder.name}/${baseName}.png`,
							'image/png',
						),
						uploadToS3(
							gltfBuffer,
							`models/${brand}/blocks/${category}/${blockTypeFolder.name}/${baseName}${path.extname(gltfFile.name)}`,
							'model/gltf+json',
						),
					])

					allBlocks.push({
						blockName: normalizeName(baseName),
						category: normalizeBlockCategory(blockTypeFolder.name),
						templateName: templateName,
						templateCategory: category,
						templateFolderId: templateFolder.id, // Add unique template folder ID
						thumbUrl: blockThumbS3Url,
						modelUrl: blockModelS3Url,
					})

					console.log(`      ✅ Uploaded block ${baseName}`)
				} catch (error) {
					console.error(`      ❌ Failed to process block ${baseName}:`, error)
				}
			} else {
				console.error(`      ❌ No matching PNG file found for ${baseName}`)
				unsucceeded.push(baseName)
			}
		}
	}

	return {template, blocks: allBlocks, unsucceeded: unsucceeded}
}

function generateTemplateData(
	processedData: TODO[],
	brand: string,
): {templates: TODO; templateFolderIdToIdMap: Map<string, string>} {
	const templates: TODO = {}
	const templateFolderIdToIdMap = new Map<string, string>()
	let idCounter = 1

	processedData.forEach(({template}) => {
		if (!template) return

		const templateId = idCounter.toString()
		templates[brand] = templates[brand] || []
		templates[brand].push({
			_id: templateId,
			thumb: template.thumbUrl,
			name: template.name,
			price: template.price,
			avatar: 'Female',
			category: template.category,
			materialId: template.materialId,
			...(template.extraMaterials && {extraMaterials: template.extraMaterials}),
		})

		// Store mapping using unique Google Drive folder ID - guaranteed to be unique
		templateFolderIdToIdMap.set(template.folderId, templateId)
		idCounter++
	})

	return {templates, templateFolderIdToIdMap}
}

function generateBlockData(processedData: TODO[], brand: string, templateFolderIdToIdMap: Map<string, string>): TODO {
	const blocks: TODO = {}
	let idCounter = 1

	processedData.forEach(({blocks: templateBlocks}) => {
		templateBlocks.forEach((block: TODO) => {
			blocks[brand] = blocks[brand] || []
			// Use unique Google Drive folder ID to find the correct template ID
			const templateId = templateFolderIdToIdMap.get(block.templateFolderId) || block.templateName // Fallback to name if ID not found
			blocks[brand].push({
				_id: idCounter.toString(),
				thumb: block.thumbUrl,
				modelFile: block.modelUrl,
				blockName: block.blockName,
				avatar: 'Female',
				category: block.category,
				templateId: templateId, // Now using actual template _id with guaranteed unique identification
				templateName: block.templateName,
				templateCategory: block.templateCategory,
			})
			idCounter++
		})
	})

	return blocks
}

function generateFabricData(brand: string): TODO {
	const fabrics: TODO = {}
	let idCounter = 1

	console.log(`🎨 Generating fabric data for brand: ${brand}`)
	console.log(`📦 Total root materials available: ${rootMaterials.size}`)

	// Convert root materials to fabric data
	rootMaterials.forEach((material, materialKey) => {
		console.log(`   📎 Processing material: ${materialKey}`)
		console.log(`   📋 Template categories: ${Array.from(material.templateCategories).join(', ') || 'NONE'}`)
		console.log(`   📏 Template categories size: ${material.templateCategories.size}`)

		fabrics[brand] = fabrics[brand] || []
		fabrics[brand].push({
			_id: idCounter.toString(),
			thumb: material.thumbUrl,
			normal: material.normal,
			baseColor: material.baseColor,
			displacement: material.displacement,
			roughness: material.roughness,
			alpha: material.alpha,
			materialName: material.materialName,
			category: material.category,
			templateCategories: material.templateCategories.size > 0 ? Array.from(material.templateCategories) : [], // Convert Set to Array
		})
		idCounter++
	})

	return fabrics
}

function generateTemplatesFileContent(templates: TODO): string {
	const finalTemplatesContent: TODO = {}
	for (const collectionName in templates) {
		const templatesArray = templates[collectionName]
		finalTemplatesContent[collectionName] = templatesArray
			.map((template: TODO) => {
				const extraMaterialsString = template.extraMaterials
					? `,\n\t\textraMaterials: [\n${template.extraMaterials
							.map(
								(extra: {mesh: string; materialId: string}) =>
									`\t\t\t{\n\t\t\t\tmesh: '${extra.mesh}',\n\t\t\t\tmaterialId: '${extra.materialId}',\n\t\t\t}`,
							)
							.join(',\n')}\n\t\t]`
					: ''

				return `	{
		_id: '${template._id}',
		thumb: '${template.thumb}',
		name: '${template.name}',
		price: '${template.price}',
		avatar: '${template.avatar}',
		category: '${template.category}',
		materialId: '${template.materialId || ''}'${extraMaterialsString}
	}`
			})
			.join(',\n')
	}

	return `import type {Template} from '../types/template'

export const templates: Record<string, Template[]> = {
	${Object.entries(finalTemplatesContent)
		.map(
			([collectionName, templatesArray]) => `${collectionName}: [
${templatesArray}
	]`,
		)
		.join(',\n\t')}
}
`
}

function generateBlocksFileContent(blocks: TODO): string {
	const finalBlocksContent: TODO = {}
	for (const collectionName in blocks) {
		const blocksArray = blocks[collectionName]
		finalBlocksContent[collectionName] = blocksArray
			.map(
				(block: TODO) => `	{
		_id: '${block._id}',
		thumb: '${block.thumb}',
		modelFile: '${block.modelFile}',
		blockName: '${block.blockName}',
		avatar: '${block.avatar}',
		category: '${block.category}',
		templateId: '${block.templateId}',
		templateName: '${block.templateName}',
		templateCategory: '${block.templateCategory}',
	}`,
			)
			.join(',\n')
	}

	return `import type {Block} from '../types/block'

export const blocks: Record<string, Block[]> = {
	${Object.entries(finalBlocksContent)
		.map(
			([collectionName, blocksArray]) => `
		${collectionName}: [
${blocksArray}
]`,
		)
		.join(',\n')}
}
`
}

function generateFabricsFileContent(fabrics: TODO): string {
	const finalFabricsContent: TODO = {}
	for (const collectionName in fabrics) {
		const fabricsArray = fabrics[collectionName]
		finalFabricsContent[collectionName] = fabricsArray
			.map(
				(fabric: TODO) => `	{
		_id: '${fabric._id}',
		thumb: '${fabric.thumb || ''}',
		normal: '${fabric.normal || ''}',
		baseColor: '${fabric.baseColor || ''}',
		displacement: '${fabric.displacement || ''}',
		roughness: '${fabric.roughness || ''}',
		alpha: '${fabric.alpha || ''}',
		materialName: '${fabric.materialName}',
		category: '${fabric.category || ''}',
		templateCategories: [${fabric.templateCategories.map((cat: string) => `'${cat}'`).join(', ')}],
	}`,
			)
			.join(',\n')
	}

	return `import type {Fabric} from '../types/fabric'

export const fabrics: Record<string, Fabric[]> = {
	${Object.entries(finalFabricsContent)
		.map(
			([collectionName, fabricsArray]) => `${collectionName}: [
${fabricsArray}
	]`,
		)
		.join(',\n\t')}
}
`
}

async function updateTemplatesFile(content: string): Promise<void> {
	const templatesPath = path.join(__dirname, '../../public/consts/templates.ts')
	fs.writeFileSync(templatesPath, content, 'utf8')
	console.log('✅ templates.ts updated successfully')
}

async function updateBlocksFile(content: string): Promise<void> {
	const blocksPath = path.join(__dirname, '../../public/consts/blocks.ts')
	fs.writeFileSync(blocksPath, content, 'utf8')
	console.log('✅ blocks.ts updated successfully')
}

async function updateFabricsFile(content: string): Promise<void> {
	const fabricsPath = path.join(__dirname, '../../public/consts/fabrics.ts')
	fs.writeFileSync(fabricsPath, content, 'utf8')
	console.log('✅ fabrics.ts updated successfully')
}

// Process root Materials folder and store all materials
async function processRootMaterials(rootMaterialsFolder: TODO, brand: string): Promise<void> {
	console.log(`📁 Processing root Materials folder`)

	const materialsContents = await fetchFolderContents(rootMaterialsFolder.id)
	const materialFolders = materialsContents.filter(item => item.mimeType === 'application/vnd.google-apps.folder')

	console.log(`  Found ${materialFolders.length} root material folders`)

	for (const materialFolder of materialFolders) {
		console.log(`  📁 Processing root material: ${materialFolder.name}`)

		const materialContents = await fetchFolderContents(materialFolder.id)
		const materialFiles = materialContents.filter(item => item.mimeType !== 'application/vnd.google-apps.folder')

		// Process texture files
		const textureUrls: {[key: string]: string} = {}
		let thumbUrl = ''

		// Parse material name from folder name: "${materialCategory} - ${materialName}"
		const folderNameParts = materialFolder.name.split('-')
		if (folderNameParts.length < 2) {
			console.warn(`    ⚠️ Invalid material folder name format: ${materialFolder.name}. Expected: "Category - Name"`)
			continue
		}

		const materialCategory = capitalize(normalizeName(folderNameParts[0].trim()))
		const materialName = capitalize(normalizeName(folderNameParts[1].trim()))
		const materialKey = `${materialCategory} - ${materialName}`

		// Check if already processed
		if (rootMaterials.has(materialKey)) {
			console.log(`    ⚠️ Material ${materialKey} already processed, skipping...`)
			continue
		}

		// First, look for thumbnail file (RENDER)
		const thumbnailFile = materialFiles.find(file => file.name.toLowerCase().includes('render'))
		if (thumbnailFile) {
			try {
				console.log(`    📸 Processing thumbnail: ${thumbnailFile.name}`)

				const thumbBuffer = await downloadToBuffer(getDriveDownloadUrl(thumbnailFile.id))
				thumbUrl = await uploadToS3(
					thumbBuffer,
					`fabrics/${brand}/root/${materialFolder.name}/${thumbnailFile.name}`,
					'image/png',
				)

				console.log(`     ✅ Uploaded thumbnail ${thumbnailFile.name}`)
			} catch (error) {
				console.error(`     ❌ Failed to process thumbnail ${thumbnailFile.name}:`, error)
			}
		}

		for (const file of materialFiles) {
			// Skip thumbnail file as we've already processed it
			if (file.name.toLowerCase().includes('render')) continue

			try {
				console.log(`    📥 Processing texture: ${file.name}`)

				const fileBuffer = await downloadToBuffer(getDriveDownloadUrl(file.id))
				const extension = path.extname(file.name).toLowerCase()
				let contentType = 'application/octet-stream'

				if (extension === '.jpg' || extension === '.jpeg') contentType = 'image/jpeg'
				else if (extension === '.png') contentType = 'image/png'
				else if (extension === '.webp') contentType = 'image/webp'

				const fileS3Url = await uploadToS3(
					fileBuffer,
					`fabrics/${brand}/root/${materialFolder.name}/${file.name}`,
					contentType,
					true,
					false,
				)

				// Map files based on name
				const fileName = path.basename(file.name, path.extname(file.name)).toLowerCase()
				if (fileName.includes('normal')) {
					textureUrls.normal = fileS3Url
				} else if (fileName.includes('base')) {
					textureUrls.baseColor = fileS3Url
				} else if (fileName.includes('displace')) {
					textureUrls.displacement = fileS3Url
				} else if (fileName.includes('rough')) {
					textureUrls.roughness = fileS3Url
				} else if (fileName.includes('alpha')) {
					textureUrls.alpha = fileS3Url
				}

				console.log(`     ✅ Uploaded texture ${file.name}`)
			} catch (error) {
				console.error(`     ❌ Failed to process texture ${file.name}:`, error)
			}
		}

		// Store material data
		const materialData = {
			materialName,
			category: materialCategory,
			thumbUrl,
			...textureUrls,
			templateCategories: new Set<string>(), // Will be populated later
		}

		rootMaterials.set(materialKey, materialData)
		console.log(`   🥳 Processed root material: ${materialKey}`)
	}
}

// Scan category Materials folder to determine material assignments
async function scanCategoryMaterials(categoryMaterialsFolder: TODO, categoryName: string): Promise<void> {
	console.log(`  📁 Scanning category Materials folder for ${categoryName}`)

	const materialsContents = await fetchFolderContents(categoryMaterialsFolder.id)
	const materialReferenceFolders = materialsContents.filter(
		item => item.mimeType === 'application/vnd.google-apps.folder',
	)

	console.log(`    Found ${materialReferenceFolders.length} material references`)

	for (const materialRef of materialReferenceFolders) {
		// Parse and normalize the material folder name to match root materials format
		const folderNameParts = materialRef.name.split('-')
		if (folderNameParts.length < 2) {
			console.warn(
				`    ⚠️ Invalid category material reference format: ${materialRef.name}. Expected: "Category - Name"`,
			)
			continue
		}

		const materialCategory = capitalize(normalizeName(folderNameParts[0].trim()))
		const materialName = capitalize(normalizeName(folderNameParts[1].trim()))
		const materialKey = `${materialCategory} - ${materialName}`

		console.log(`    🔧 Normalizing material reference: "${materialRef.name}" -> "${materialKey}"`)

		if (!categoryMaterialAssignments.has(categoryName)) {
			categoryMaterialAssignments.set(categoryName, new Set())
		}
		categoryMaterialAssignments.get(categoryName)!.add(materialKey)
		console.log(`    ✅ Assigned material ${materialKey} to category ${categoryName}`)
	}
}

// Get material reference from template and return material key
async function getTemplateMaterialReference(materialFolder: TODO): Promise<string | null> {
	// Template material folders are just reference folders (empty)
	// The folder name is the material key: "${materialCategory} - ${materialName}"
	const folderNameParts = materialFolder.name.split('-')
	if (folderNameParts.length < 2) {
		console.warn(
			`    ⚠️ Invalid template material reference format: ${materialFolder.name}. Expected: "Category - Name"`,
		)
		return null
	}
	const materialCategory = capitalize(normalizeName(folderNameParts[0].trim()))
	const materialName = capitalize(normalizeName(folderNameParts[1].trim()))
	return `${materialCategory} - ${materialName}`
}

// Process 'Extra Materials' folder and return mesh -> materialId mappings
async function processExtraMaterialsFolder(extraMaterialsFolder: TODO): Promise<{mesh: string; materialId: string}[]> {
	console.log(`  📁 Processing Extra Materials folder`)

	const extraMaterialsContents = await fetchFolderContents(extraMaterialsFolder.id)
	const meshFolders = extraMaterialsContents.filter(item => item.mimeType === 'application/vnd.google-apps.folder')

	console.log(`    Found ${meshFolders.length} mesh folders`)

	const materialToMeshes: Map<string, string[]> = new Map()

	for (const meshFolder of meshFolders) {
		console.log(`    📁 Processing mesh folder: ${meshFolder.name}`)

		// Mesh name should be trimmed and lowercase
		const meshName = meshFolder.name.trim().toLowerCase()

		// Get contents of mesh folder to find material reference folder
		const meshContents = await fetchFolderContents(meshFolder.id)
		const materialReferenceFolders = meshContents.filter(item => item.mimeType === 'application/vnd.google-apps.folder')

		if (materialReferenceFolders.length === 0) {
			console.warn(`      ⚠️ No material reference found in mesh folder: ${meshFolder.name}`)
			continue
		}

		// Use the first material reference folder (assuming one per mesh)
		const materialReferenceFolder = materialReferenceFolders[0]
		console.log(`      📎 Found material reference: ${materialReferenceFolder.name}`)

		// Parse and normalize the material folder name to match root materials format
		const folderNameParts = materialReferenceFolder.name.split('-')
		if (folderNameParts.length < 2) {
			console.warn(
				`      ⚠️ Invalid material reference format: ${materialReferenceFolder.name}. Expected: "Category - Name"`,
			)
			continue
		}

		const materialCategory = capitalize(normalizeName(folderNameParts[0].trim()))
		const materialName = capitalize(normalizeName(folderNameParts[1].trim()))
		const materialId = `${materialCategory} - ${materialName}`

		console.log(`      ✅ Mesh "${meshName}" -> Material "${materialId}"`)

		const sanitizedMeshName = THREE.PropertyBinding.sanitizeNodeName(meshName)

		// Group meshes by materialId
		if (!materialToMeshes.has(materialId)) {
			materialToMeshes.set(materialId, [])
		}
		materialToMeshes.get(materialId)!.push(sanitizedMeshName)
	}

	// Convert grouped materials to final format
	const extraMaterials: {mesh: string; materialId: string}[] = []
	materialToMeshes.forEach((meshes, materialId) => {
		const combinedMeshKey = meshes.join('-')
		console.log(`      🔗 Grouped material "${materialId}" -> meshes: "${combinedMeshKey}"`)
		extraMaterials.push({
			mesh: combinedMeshKey,
			materialId: materialId,
		})
	})

	return extraMaterials
}

async function processCategoryMaterialsFolder(materialsFolder: TODO, categoryName: string): Promise<void> {
	// Process category Materials folder for material assignments if it exists
	if (materialsFolder) {
		await scanCategoryMaterials(materialsFolder, categoryName)
	}
}

// Apply category material assignments to populate templateCategories
function applyCategoryAssignments(): void {
	console.log(`📋 Applying category material assignments to materials`)
	console.log(`📦 Total category assignments: ${categoryMaterialAssignments.size}`)
	console.log(`📦 Total root materials: ${rootMaterials.size}`)

	categoryMaterialAssignments.forEach((materialKeys, categoryName) => {
		console.log(`  📂 Processing category: ${categoryName} with ${materialKeys.size} materials`)
		materialKeys.forEach(materialKey => {
			if (rootMaterials.has(materialKey)) {
				console.log(
					`    📊 Before adding "${categoryName}": templateCategories = ${Array.from(rootMaterials.get(materialKey)!.templateCategories)}`,
				)
				rootMaterials.get(materialKey)!.templateCategories.add(categoryName)
				console.log(
					`    📊 After adding "${categoryName}": templateCategories = ${Array.from(rootMaterials.get(materialKey)!.templateCategories)}`,
				)
				console.log(`  ✅ Added category ${categoryName} to material ${materialKey}`)
			} else {
				console.warn(`  ⚠️ Material ${materialKey} not found in root materials`)
				console.log(`  📋 Available materials: ${Array.from(rootMaterials.keys()).join(', ')}`)
			}
		})
	})
}

async function main(): Promise<void> {
	try {
		console.log('🚀 Fetching combined assets from Google Drive and uploading to S3...')

		if (API_KEY === 'GOOGLE_API_KEY') {
			console.log('⚠️  No Google Drive API key provided. Set GOOGLE_API_KEY environment variable.')
			console.log('   You can get a free API key from Google Cloud Console.')
			return
		}

		if (!S3_ACCESS_KEY || !S3_SECRET_KEY) {
			console.log(
				'⚠️  AWS credentials not provided. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.',
			)
			return
		}

		if (S3_BUCKET === 'your-bucket-name') {
			console.log('⚠️  S3 bucket not configured. Set S3_BUCKET environment variable.')
			return
		}

		console.log(`📦 Using S3 bucket: ${S3_BUCKET}`)
		console.log(`🌍 S3 region: ${S3_REGION}`)
		console.log(`🏷️  Processing ${BRAND_CONFIGS.length} brands: ${BRAND_CONFIGS.map(c => c.brand).join(', ')}`)

		// Initialize combined data structures
		const allTemplates: TODO = {}
		const allBlocks: TODO = {}
		const allCombinedFabrics: TODO = {}
		const allUnsucceeded: TODO[] = []

		// Process each brand
		for (const brandConfig of BRAND_CONFIGS) {
			const {brand, rootFolderId} = brandConfig
			console.log(`\n🏢 Processing brand: ${brand}`)
			console.log(`🗂️  Root folder ID: ${rootFolderId}`)

			// Reset data for this brand
			rootMaterials.clear()
			categoryMaterialAssignments.clear()

			// Get root contents (categories + root Materials folder)
			const rootContents = await fetchFolderContents(rootFolderId)
			const categoryFolders = rootContents.filter(
				item => item.mimeType === 'application/vnd.google-apps.folder' && normalizeName(item.name) !== 'Materials',
			)
			const rootMaterialsFolder = rootContents.find(
				item => item.mimeType === 'application/vnd.google-apps.folder' && normalizeName(item.name) === 'Materials',
			)

			console.log(`📁 Found ${categoryFolders.length} category folders`)

			// Step 1: Process root Materials folder
			if (rootMaterialsFolder) {
				await processRootMaterials(rootMaterialsFolder, brand)
			} else {
				console.warn(`⚠️  No root Materials folder found for brand ${brand}`)
			}

			const brandProcessedData: TODO[] = []

			// Step 2: Process each category
			for (const categoryFolder of categoryFolders) {
				console.log(`\n📂 Processing category: ${categoryFolder.name}`)

				const categoryContents = await fetchFolderContents(categoryFolder.id)
				const templateFolders = categoryContents.filter(
					item => item.mimeType === 'application/vnd.google-apps.folder' && normalizeName(item.name) !== 'Materials',
				)
				const categoryMaterialsFolder = categoryContents.find(
					item => item.mimeType === 'application/vnd.google-apps.folder' && normalizeName(item.name) === 'Materials',
				)

				console.log(`  Found ${templateFolders.length} template folders`)

				// Step 2a: Scan category Materials folder for material assignments
				if (categoryMaterialsFolder) {
					await processCategoryMaterialsFolder(categoryMaterialsFolder, categoryFolder.name)
				}

				// Step 2b: Process each template in this category
				for (const templateFolder of templateFolders) {
					const processedTemplate = await processTemplateFolder(templateFolder, categoryFolder.name, brand)
					if (processedTemplate.template) {
						brandProcessedData.push(processedTemplate)
					}
					allUnsucceeded.push(...processedTemplate.unsucceeded)
				}
			}

			// Step 3: Apply category material assignments to materials
			applyCategoryAssignments()

			// Debug: Check final state of materials before generating fabric data
			console.log(`🔍 Final state check before generating fabric data for brand: ${brand}`)
			console.log(`📦 Total root materials: ${rootMaterials.size}`)
			rootMaterials.forEach((material, materialKey) => {
				console.log(`  📎 Material: ${materialKey}`)
				console.log(`    📋 Template categories: ${Array.from(material.templateCategories).join(', ') || 'NONE'}`)
				console.log(`    📏 Size: ${material.templateCategories.size}`)
			})

			// Generate data for this brand
			const {templates: brandTemplates, templateFolderIdToIdMap} = generateTemplateData(brandProcessedData, brand)
			const brandBlocks = generateBlockData(brandProcessedData, brand, templateFolderIdToIdMap)
			const brandFabricsData = generateFabricData(brand)

			// Merge with combined data
			Object.assign(allTemplates, brandTemplates)
			Object.assign(allBlocks, brandBlocks)
			Object.assign(allCombinedFabrics, brandFabricsData)

			console.log(`✅ Completed processing brand: ${brand}`)
		}

		console.log(`\n📊 Generated ${Object.keys(allTemplates).length} template collections`)
		console.log(`📊 Generated ${Object.keys(allBlocks).length} block collections`)
		console.log(`📊 Generated ${Object.keys(allCombinedFabrics).length} fabric collections`)

		// Generate and write the files
		const templatesContent = generateTemplatesFileContent(allTemplates)
		const blocksContent = generateBlocksFileContent(allBlocks)
		const fabricsContent = generateFabricsFileContent(allCombinedFabrics)

		await updateTemplatesFile(templatesContent)
		await updateBlocksFile(blocksContent)
		await updateFabricsFile(fabricsContent)

		console.log('🎉 Script completed successfully!')
		console.log('\n📋 Summary:')

		// Summary
		const templateCount = Object.values(allTemplates).flat().length
		const blockCount = Object.values(allBlocks).flat().length
		const fabricCount = Object.values(allCombinedFabrics).flat().length

		console.log(`📄 Templates: ${templateCount} items generated`)
		console.log(`🧱 Blocks: ${blockCount} items generated`)
		console.log(`🎨 Fabrics: ${fabricCount} items generated`)
		console.log(`❌ Unsucceeded: ${allUnsucceeded.length} items`)

		console.log(`\n📁 Assets organized as:`)
		BRAND_CONFIGS.forEach(({brand}) => {
			console.log(`   ${brand} Template Images: images/${brand}/templates/{category}/`)
			console.log(`   ${brand} Template Materials: materials/${brand}/templates/{category}/{templateName}/`)
			console.log(`   ${brand} Block Images: images/${brand}/blocks/{category}/{blockType}/`)
			console.log(`   ${brand} Fabric Textures: fabrics/${brand}/{category}/{materialName}/`)
			console.log(`   ${brand} Block Models: models/${brand}/blocks/{category}/{blockType}/`)
		})

		process.exit(0)
	} catch (error) {
		console.error('❌ Script failed:', error)
		process.exit(1)
	}
}

// Run main function if this file is executed directly
main()
