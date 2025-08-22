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

// Root folder ID from the Google Drive URL
const ROOT_FOLDER_ID = '1zYLtaDyheX-nIwNgL4Q_tEwjvqFjVVNR'
const BRAND = 'speed'

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
		Key: key,
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

function normalizeBlockCategory(folderName: string): string {
	// Normalize block type folder names to exact category names
	if (folderName.includes('Bodice')) return 'Bodice'
	if (folderName.includes('Pants')) return 'Pants'
	if (folderName.includes('Sleeves')) return 'Sleeves'
	return folderName // fallback to original name
}

// Process a template folder and extract template info and blocks
async function processTemplateFolder(
	templateFolder: TODO,
	category: string,
): Promise<{template: TODO; blocks: TODO[]}> {
	console.log(`  📂 Processing template: ${templateFolder.name}`)

	const templateContents = await fetchFolderContents(templateFolder.id)

	// Find template thumbnail (PNG file in root of template folder)
	const templateThumbnail = templateContents.find(
		file => file.mimeType !== 'application/vnd.google-apps.folder' && file.name.toLowerCase().endsWith('.png'),
	)

	if (!templateThumbnail) {
		console.warn(`  ⚠️  No template thumbnail found for ${templateFolder.name}`)
		return {template: null, blocks: []}
	}

	// Find block type folders (Bodice, Pants, Sleeves)
	const blockTypeFolders = templateContents.filter(
		item =>
			item.mimeType === 'application/vnd.google-apps.folder' &&
			['Bodice', 'Pants', 'Sleeves'].some(blockType => item.name.includes(blockType)),
	)

	// Find Materials folder
	const materialsFolder = templateContents.find(
		item => item.mimeType === 'application/vnd.google-apps.folder' && item.name.includes('Materials'),
	)

	if (!materialsFolder) {
		console.warn(`  ⚠️  No materials folder found for ${templateFolder.name}`)
	}

	if (blockTypeFolders.length === 0) {
		console.warn(`  ⚠️  No block type folders found for ${templateFolder.name}`)
		return {template: null, blocks: []}
	}

	console.log(`    Found ${blockTypeFolders.length} block type folders`)
	if (materialsFolder) {
		console.log(`    Found Materials folder`)
	}

	// Download template thumbnail
	const templateThumbnailUrl = getDriveDownloadUrl(templateThumbnail.id)
	const templateThumbnailBuffer = await downloadToBuffer(templateThumbnailUrl)
	const templateS3Url = await uploadToS3(
		templateThumbnailBuffer,
		`images/${BRAND}/templates/${category}/${templateFolder.name}.png`,
		'image/png',
	)

	// Get material reference if Materials folder exists
	let materialId: string | null = null
	if (materialsFolder) {
		console.log(`    📁 Finding material reference from Materials folder`)

		const materialsContents = await fetchFolderContents(materialsFolder.id)
		const materialFolders = materialsContents.filter((f: TODO) => f.mimeType === 'application/vnd.google-apps.folder')

		// Assuming there's one material folder per template
		if (materialFolders.length > 0) {
			const materialFolder = materialFolders[0] // Take the first material folder
			materialId = materialFolder.name // Use folder name as reference to fabric
			console.log(`      📎 Material reference: ${materialId}`)
		}
	}

	const template = {
		name: normalizeName(templateFolder.name),
		category,
		thumbUrl: templateS3Url,
		materialId,
	}

	// Process blocks in each block type folder
	const allBlocks: TODO[] = []

	for (const blockTypeFolder of blockTypeFolders) {
		console.log(`    📁 Processing block type: ${blockTypeFolder.name}`)

		const blockTypeContents = await fetchFolderContents(blockTypeFolder.id)
		const gltfFiles = blockTypeContents.filter((f: TODO) => f.name.toLowerCase().endsWith('.gltf'))
		const pngFiles = blockTypeContents.filter((f: TODO) => f.name.toLowerCase().endsWith('.png'))

		// Match GLTF and PNG pairs
		for (const gltfFile of gltfFiles) {
			const baseName = path.basename(gltfFile.name, '.gltf')
			const matchingPng = pngFiles.find((png: TODO) => path.basename(png.name, '.png') === baseName)

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
							`images/${BRAND}/blocks/${category}/${blockTypeFolder.name}/${baseName}.png`,
							'image/png',
						),
						uploadToS3(
							gltfBuffer,
							`models/${BRAND}/blocks/${category}/${blockTypeFolder.name}/${baseName}.gltf`,
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
			}
		}
	}

	return {template, blocks: allBlocks}
}

function generateTemplateData(processedData: TODO[]): TODO {
	const templates: TODO = {}
	let idCounter = 1

	processedData.forEach(({template}) => {
		if (!template) return

		templates[BRAND] = templates[BRAND] || []
		templates[BRAND].push({
			_id: idCounter.toString(),
			thumb: template.thumbUrl,
			name: template.name,
			avatar: 'Male',
			category: template.category,
			materialId: template.materialId,
		})
		idCounter++
	})

	return templates
}

function generateBlockData(processedData: TODO[]): TODO {
	const blocks: TODO = {}
	let idCounter = 1

	processedData.forEach(({blocks: templateBlocks}) => {
		templateBlocks.forEach((block: TODO) => {
			blocks[BRAND] = blocks[BRAND] || []
			blocks[BRAND].push({
				_id: idCounter.toString(),
				thumb: block.thumbUrl,
				modelFile: block.modelUrl,
				blockName: block.blockName,
				avatar: 'Male',
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

function generateFabricData(fabricsData: TODO[]): TODO {
	const fabrics: TODO = {}
	let idCounter = 1

	fabricsData.forEach(fabric => {
		fabrics[BRAND] = fabrics[BRAND] || []
		fabrics[BRAND].push({
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
		console.log(`🗂️  Root folder ID: ${ROOT_FOLDER_ID}`)

		// Get category folders (Jacket, Shirt, Pants, Accessories)
		const rootContents = await fetchFolderContents(ROOT_FOLDER_ID)
		const categoryFolders = rootContents.filter(item => item.mimeType === 'application/vnd.google-apps.folder')

		console.log(`📁 Found ${categoryFolders.length} category folders`)

		const allProcessedData: TODO[] = []
		const allFabrics: TODO[] = []

		// Process each category
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
				const processedTemplate = await processTemplateFolder(templateFolder, categoryFolder.name)
				if (processedTemplate.template) {
					allProcessedData.push(processedTemplate)
				}
			}

			// Process Materials folder for fabrics if it exists
			if (materialsFolder) {
				console.log(`  📁 Processing Materials folder for ${categoryFolder.name} category`)

				const materialsContents = await fetchFolderContents(materialsFolder.id)
				const materialFolders = materialsContents.filter(item => item.mimeType === 'application/vnd.google-apps.folder')

				console.log(`    Found ${materialFolders.length} material folders`)

				for (const materialFolder of materialFolders) {
					console.log(`    📁 Processing material: ${materialFolder.name}`)

					// Parse folder name: "${materialName} ${category}"
					const folderNameParts = materialFolder.name.split(' ')
					const materialCategory = folderNameParts[folderNameParts.length - 1] // Last part is category
					const materialName = folderNameParts.slice(0, -1).join(' ') // Everything else is material name

					const materialContents = await fetchFolderContents(materialFolder.id)
					const materialFiles = materialContents.filter(item => item.mimeType !== 'application/vnd.google-apps.folder')

					// Process texture files
					const textureUrls: {[key: string]: string} = {}
					let thumbUrl = ''

					// First, look for thumbnail file matching folder name
					const thumbnailFileName = `${materialFolder.name}.png`
					const thumbnailFile = materialFiles.find(file => file.name === thumbnailFileName)

					if (thumbnailFile) {
						try {
							console.log(`      📸 Processing thumbnail: ${thumbnailFile.name}`)

							const thumbBuffer = await downloadToBuffer(getDriveDownloadUrl(thumbnailFile.id))
							thumbUrl = await uploadToS3(
								thumbBuffer,
								`fabrics/${BRAND}/${categoryFolder.name}/${materialFolder.name}/${thumbnailFile.name}`,
								'image/png',
							)

							console.log(`      ✅ Uploaded thumbnail ${thumbnailFile.name}`)
						} catch (error) {
							console.error(`      ❌ Failed to process thumbnail ${thumbnailFile.name}:`, error)
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
								`fabrics/${BRAND}/${categoryFolder.name}/${materialFolder.name}/${file.name}`,
								contentType,
							)

							// Map files based on name
							const fileName = path.basename(file.name, path.extname(file.name))
							if (fileName === 'Normal') {
								textureUrls.normal = fileS3Url
							} else if (fileName === 'BaseColor') {
								textureUrls.baseColor = fileS3Url
							} else if (fileName === 'Displacement') {
								textureUrls.displacement = fileS3Url
							} else if (fileName === 'Roughness') {
								textureUrls.roughness = fileS3Url
							}

							console.log(`      ✅ Uploaded texture ${file.name}`)
						} catch (error) {
							console.error(`      ❌ Failed to process texture ${file.name}:`, error)
						}
					}

					// Create fabric object
					const fabric = {
						materialName,
						category: materialCategory,
						templateCategory: categoryFolder.name,
						thumbUrl,
						...textureUrls,
					}

					allFabrics.push(fabric)
					console.log(`    ✅ Processed fabric: ${materialName} (${materialCategory})`)
				}
			}
		}

		// Generate templates, blocks, and fabrics data
		const templates = generateTemplateData(allProcessedData)
		const blocks = generateBlockData(allProcessedData)
		const fabrics = generateFabricData(allFabrics)

		console.log(`📊 Generated ${Object.keys(templates).length} template collections`)
		console.log(`📊 Generated ${Object.keys(blocks).length} block collections`)
		console.log(`📊 Generated ${Object.keys(fabrics).length} fabric collections`)

		// Generate and write the files
		const templatesContent = generateTemplatesFileContent(templates)
		const blocksContent = generateBlocksFileContent(blocks)
		const fabricsContent = generateFabricsFileContent(fabrics)

		await updateTemplatesFile(templatesContent)
		await updateBlocksFile(blocksContent)
		await updateFabricsFile(fabricsContent)

		console.log('🎉 Script completed successfully!')
		console.log('\n📋 Summary:')

		// Summary
		const templateCount = Object.values(templates).flat().length
		const blockCount = Object.values(blocks).flat().length
		const fabricCount = Object.values(fabrics).flat().length

		console.log(`📄 Templates: ${templateCount} items generated`)
		console.log(`🧱 Blocks: ${blockCount} items generated`)
		console.log(`🎨 Fabrics: ${fabricCount} items generated`)

		console.log(`\n📁 Assets organized as:`)
		console.log(`   Template Images: images/${BRAND}/templates/{category}/`)
		console.log(`   Template Materials: materials/${BRAND}/templates/{category}/{templateName}/`)
		console.log(`   Block Images: images/${BRAND}/blocks/{category}/{blockType}/`)
		console.log(`   Fabric Textures: fabrics/${BRAND}/{category}/{materialName}/`)
		console.log(`   Block Models: models/${BRAND}/blocks/{category}/{blockType}/`)

		process.exit(0)
	} catch (error) {
		console.error('❌ Script failed:', error)
		process.exit(1)
	}
}

// Run main function if this file is executed directly
main()
