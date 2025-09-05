import * as fs from 'fs'
import * as path from 'path'
import * as https from 'https'
import * as AWS from 'aws-sdk'

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
		brand: 'moidien',
		rootFolderId: '11fS4TFpvw2EGraj1Dp3IbbVhlxEXwdC-',
	},
	// Add more brands here as needed
	// {
	//   brand: 'another-brand',
	//   rootFolderId: 'another-folder-id',
	// },
]

const allFabrics: TODO[] = []

// Helper function to make HTTP requests
function makeRequest<T = unknown>(url: string): Promise<T> {
	return new Promise((resolve, reject) => {
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
}

// Get Google Drive download URL for a file
function getDriveDownloadUrl(fileId: string): string {
	return `https://drive.google.com/uc?export=download&id=${fileId}`
}

// Upload buffer to S3 and return the public URL
async function uploadToS3(buffer: Buffer, key: string, contentType: string): Promise<string> {
	const params = {
		Bucket: S3_BUCKET,
		Key: key.replace(/ /g, '_'),
		Body: buffer,
		ContentType: contentType,
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
	return new Promise((resolve, reject) => {
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
	return name.replace(/_/g, ' ').trim()
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

	// Find block type folders (Bodice, Pants, Sleeves)
	const blockTypeFolders = templateContents.filter(
		item =>
			item.mimeType === 'application/vnd.google-apps.folder' &&
			['bodice', 'pants', 'sleeves', 'hat', 'dress', 'skirt', 'fullbody', 'bag', 'accessory'].some(blockType =>
				item.name.toLowerCase().includes(blockType.toLowerCase()),
			),
	)

	const materialFolders = templateContents.filter(
		item => item.mimeType === 'application/vnd.google-apps.folder' && item.name.toLowerCase().includes('material'),
	)

	let materialFolder = materialFolders?.[0] as TODO
	if (!materialFolder) {
		console.warn(`  ⚠️  No material folders found for ${templateFolder.name}`)
	} else {
		console.log(`    Found ${materialFolder.name} material folder`)
	}

	let materialContents: TODO[] = []
	if (materialFolder) {
		materialContents = await fetchFolderContents(materialFolder.id)
	}

	// Find material files directly in template folder
	const materialFiles = materialContents.filter(
		file =>
			file.mimeType !== 'application/vnd.google-apps.folder' &&
			(file.name.toLowerCase().includes('normal') ||
				file.name.toLowerCase().includes('basecolor') ||
				file.name.toLowerCase().includes('displace') ||
				file.name.toLowerCase().includes('rough') ||
				file.name.toLowerCase().includes('(render)')),
	)

	if (blockTypeFolders.length === 0) {
		console.warn(`  ⚠️  No block type folders found for ${templateFolder.name}`)
		return {template: null, blocks: [], unsucceeded: []}
	}

	console.log(`    Found ${blockTypeFolders.length} block type folders`)
	if (materialFiles.length > 0) {
		console.log(`    Found ${materialFiles.length} material files`)
	}

	// Download template thumbnail
	const templateThumbnailUrl = getDriveDownloadUrl(templateThumbnail.id)
	const templateThumbnailBuffer = await downloadToBuffer(templateThumbnailUrl)
	const templateS3Url = await uploadToS3(
		templateThumbnailBuffer,
		`images/${brand}/templates/${category}/${templateFolder.name}.png`,
		'image/png',
	)

	// Process material files if they exist
	let materialId: string | null = null
	if (materialFiles.length > 0) {
		console.log(`    📁 Processing material files for template`)

		// Process and upload material files
		materialId = await processMaterialFolder(materialFolder, category, brand)
		console.log(`     📎 Material reference: ${materialId}`)
	}

	const template = {
		name: normalizeName(templateFolder.name),
		category,
		thumbUrl: templateS3Url,
		materialId,
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
							`models/${brand}/blocks/${category}/${blockTypeFolder.name}/${baseName}.${path.extname(gltfFile.name)}`,
							'model/gltf+json',
						),
					])

					allBlocks.push({
						blockName: normalizeName(baseName),
						category: normalizeBlockCategory(blockTypeFolder.name),
						templateName: normalizeName(templateFolder.name),
						templateCategory: category,
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

function generateTemplateData(processedData: TODO[], brand: string): TODO {
	const templates: TODO = {}
	let idCounter = 1

	processedData.forEach(({template}) => {
		if (!template) return

		templates[brand] = templates[brand] || []
		templates[brand].push({
			_id: idCounter.toString(),
			thumb: template.thumbUrl,
			name: template.name,
			avatar: 'Female',
			category: template.category,
			materialId: template.materialId,
		})
		idCounter++
	})

	return templates
}

function generateBlockData(processedData: TODO[], brand: string): TODO {
	const blocks: TODO = {}
	let idCounter = 1

	processedData.forEach(({blocks: templateBlocks}) => {
		templateBlocks.forEach((block: TODO) => {
			blocks[brand] = blocks[brand] || []
			blocks[brand].push({
				_id: idCounter.toString(),
				thumb: block.thumbUrl,
				modelFile: block.modelUrl,
				blockName: block.blockName,
				avatar: 'Female',
				category: block.category,
				templateId: block.templateName, // Using template name as ID for now
				templateName: block.templateName,
				templateCategory: block.templateCategory,
			})
			idCounter++
		})
	})

	return blocks
}

function generateFabricData(fabricsData: TODO[], brand: string): TODO {
	const fabrics: TODO = {}
	let idCounter = 1

	fabricsData.forEach(fabric => {
		fabrics[brand] = fabrics[brand] || []
		fabrics[brand].push({
			_id: idCounter.toString(),
			thumb: fabric.thumbUrl,
			normal: fabric.normal,
			baseColor: fabric.baseColor,
			displacement: fabric.displacement,
			roughness: fabric.roughness,
			materialName: fabric.materialName,
			category: fabric.category,
			templateCategory: fabric.templateCategory,
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
			.map(
				(template: TODO) => `	{
		_id: '${template._id}',
		thumb: '${template.thumb}',
		name: '${template.name}',
		avatar: '${template.avatar}',
		category: '${template.category}',
		materialId: '${template.materialId || ''}',
	}`,
			)
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
],
	`,
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
		materialName: '${fabric.materialName}',
		category: '${fabric.category || ''}',
		templateCategory: '${fabric.templateCategory || ''}',
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

// Get material and return material name as id
async function processMaterialFolder(materialFolder: TODO, categoryName: string, brand: string): Promise<string> {
	// Parse thumbnail file name, the format is "${materialCategory} - ${materialName} - RENDER"
	const materialContents = await fetchFolderContents(materialFolder.id)
	const materialFiles = materialContents.filter(item => item.mimeType !== 'application/vnd.google-apps.folder')

	// Process texture files
	const textureUrls: {[key: string]: string} = {}
	let thumbUrl = ''

	// First, look for thumbnail file matching folder name
	const thumbnailFile = materialFiles.find(file => file.name.includes('RENDER'))
	const thumbnailFileName = thumbnailFile?.name
	const materialCategory = capitalize(normalizeName(thumbnailFileName.split('-')[0].trim()))
	const materialName = capitalize(normalizeName(thumbnailFileName.split('-')[1].trim()))
	console.log(thumbnailFileName, materialCategory, materialName)

	if (thumbnailFile) {
		try {
			const matchingFabric = allFabrics.find(
				fabric =>
					fabric.materialName === materialName &&
					fabric.category === materialCategory &&
					fabric.templateCategory === categoryName,
			)
			if (matchingFabric) {
				console.log(`      ⚠️ Material ${materialName} already exists, skipping...`)
				console.log(`    ✅ Processed fabric: ${materialName} (${materialCategory})`)
				return `${materialName} ${materialCategory} ${categoryName}`
			}

			console.log(`      📸 Processing thumbnail: ${thumbnailFile.name}`)

			const thumbBuffer = await downloadToBuffer(getDriveDownloadUrl(thumbnailFile.id))
			thumbUrl = await uploadToS3(
				thumbBuffer,
				`fabrics/${brand}/${categoryName}/${materialFolder.name}/${thumbnailFile.name}`,
				'image/png',
			)

			console.log(`       ✅ Uploaded thumbnail ${thumbnailFile.name}`)
		} catch (error) {
			console.error(`       ❌ Failed to process thumbnail ${thumbnailFile.name}:`, error)
		}
	}

	for (const file of materialFiles) {
		// Skip thumbnail file as we've already processed it
		if (file.name === thumbnailFileName) continue

		try {
			console.log(`      📥 Processing texture: ${file.name}`)

			const fileBuffer = await downloadToBuffer(getDriveDownloadUrl(file.id))
			const extension = path.extname(file.name).toLowerCase()
			let contentType = 'application/octet-stream'

			if (extension === '.jpg' || extension === '.jpeg') contentType = 'image/jpeg'
			else if (extension === '.png') contentType = 'image/png'
			else if (extension === '.webp') contentType = 'image/webp'

			const fileS3Url = await uploadToS3(
				fileBuffer,
				`fabrics/${brand}/${categoryName}/${materialFolder.name}/${file.name}`,
				contentType,
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
			}

			console.log(`       ✅ Uploaded texture ${file.name}`)
		} catch (error) {
			console.error(`       ❌ Failed to process texture ${file.name}:`, error)
		}
	}

	// Create fabric object
	const fabric = {
		materialName,
		category: materialCategory,
		templateCategory: categoryName,
		thumbUrl,
		...textureUrls,
	}

	allFabrics.push(fabric)
	console.log(`     🥳 Processed fabric: ${materialName} (${materialCategory})`)
	return `${materialName} ${materialCategory} ${categoryName}`
}

async function processMaterialsFolders(materialsFolder: TODO, categoryName: string, brand: string): Promise<void> {
	// Process Materials folder for fabrics if it exists
	if (materialsFolder) {
		console.log(`  📁 Processing Materials folder for ${categoryName} category`)

		const materialsContents = await fetchFolderContents(materialsFolder.id)
		const materialFolders = materialsContents.filter(item => item.mimeType === 'application/vnd.google-apps.folder')

		console.log(`    Found ${materialFolders.length} material folders`)

		for (const materialFolder of materialFolders) {
			console.log(`    📁 Processing material: ${materialFolder.name}`)

			await processMaterialFolder(materialFolder, categoryName, brand)
		}
	}
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

			// Reset fabrics array for this brand
			allFabrics.length = 0

			// Get category folders (Jacket, Shirt, Pants, Accessories)
			const rootContents = await fetchFolderContents(rootFolderId)
			const categoryFolders = rootContents.filter(item => item.mimeType === 'application/vnd.google-apps.folder')

			console.log(`📁 Found ${categoryFolders.length} category folders`)

			const brandProcessedData: TODO[] = []

			// Process each category for this brand
			for (const categoryFolder of categoryFolders) {
				console.log(`\n📂 Processing category: ${categoryFolder.name}`)

				const categoryContents = await fetchFolderContents(categoryFolder.id)
				const templateFolders = categoryContents.filter(
					item => item.mimeType === 'application/vnd.google-apps.folder' && item.name !== 'Materials',
				)
				const materialsFolder = categoryContents.find(
					item => item.mimeType === 'application/vnd.google-apps.folder' && item.name === 'Materials',
				)

				console.log(`  Found ${templateFolders.length} template folders`)

				// Process each template in this category
				for (const templateFolder of templateFolders) {
					const processedTemplate = await processTemplateFolder(templateFolder, categoryFolder.name, brand)
					if (processedTemplate.template) {
						brandProcessedData.push(processedTemplate)
					}
					allUnsucceeded.push(...processedTemplate.unsucceeded)
				}

				// Process fabrics if Materials folder exists inside Template folder
				await processMaterialsFolders(materialsFolder, categoryFolder.name, brand)
			}

			// Generate data for this brand
			const brandTemplates = generateTemplateData(brandProcessedData, brand)
			const brandBlocks = generateBlockData(brandProcessedData, brand)
			const brandFabricsData = generateFabricData(allFabrics, brand)

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
