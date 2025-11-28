import * as AWS from 'aws-sdk'
import {randomUUID as uuidv4} from 'crypto'
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
const CLOUDFRONT_URL = 'https://d1e6s1h8cqcr26.cloudfront.net'
const S3_URL = 'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com'

// Configure AWS
AWS.config.update({
	accessKeyId: S3_ACCESS_KEY,
	secretAccessKey: S3_SECRET_KEY,
	region: S3_REGION,
})

const s3 = new AWS.S3()

// collection configurations with Google Drive folder IDs
const COLLECTION_CONFIGS = [
	// {
	// 	collection: 'essence-of-her',
	// 	rootFolderId: '1BlQcj37sCkY7PhQijHP5HjC0jyrlmzWt',
	// },
	// {
	// 	collection: 'movement',
	// 	rootFolderId: '1-_x-GVUxGBn4S1VDI6t3dFN990IG-VWu',
	// },
	// {
	// 	collection: 'shadow-grace',
	// 	rootFolderId: '1Numw3ThiF4y2kcADnzKf2T9xaYqPMute',
	// },
	// {
	// 	collection: 'duality-in-radiance',
	// 	rootFolderId: '1hAUwnocS029C_Jvep_-3NdQMxfppwg7r',
	// },
	// {
	// 	collection: '9heure19heure',
	// 	rootFolderId: '1k2wrq4CUoLBhKMww0JEWU66DjLIzucsB',
	// },
	// {
	// 	collection: 'metamorphosis',
	// 	rootFolderId: '1ymJMcl0S3Em6fteG_qsUMiDXn9lH2Isd',
	// },
	// {
	// 	collection: 'the-soul',
	// 	rootFolderId: '19Oq6abu1SnMTLSJHS0VY_GT1pAvpdU0T',
	// },
	// {
	// 	collection: 'gap',
	// 	rootFolderId: '11fS4TFpvw2EGraj1Dp3IbbVhlxEXwdC-',
	// },
	// {
	// 	collection: 'emwear',
	// 	rootFolderId: '15zHjnYVfII_Z2cr17_6Vp7kscWm9UIAU',
	// },
	// {
	// 	collection: 'fige-dans-le-temps',
	// 	rootFolderId: '17aBfgFcD7Liq9fB_KC57rl5S2w-O4LYf',
	// },
	// {
	// 	collection: 'one-thousand-poets',
	// 	rootFolderId: '1T3jYEVfYb0JtROoVAFJDGQEWxOmyDVpT',
	// },
	// {
	// 	collection: 'zove',
	// 	rootFolderId: '1XlxaOIFxxh-8xCmmM6XrDOW6iqq7xNhw',
	// },
	// {
	// 	collection: 'ja-seng-bu',
	// 	rootFolderId: '1BO4szN8246Y0V-AhL9zDyXzJ6rZLL7U8',
	// },
	// {
	// 	collection: 'mss-park',
	// 	rootFolderId: '1uUtAmMj_4gV1P3xuJKWGPbATJcv63GcJ',
	// },
	// {
	// 	collection: 'imzad-man',
	// 	rootFolderId: '1fsA2JrL5ibuWrC_Fp_IDubvZuQj5bwpa',
	// },
	// {
	// 	collection: 'imzad-woman',
	// 	rootFolderId: '1p_yCV5X8RCCPzSvQmnhL_aAtcOw8zvl7',
	// },
	// {
	// 	collection: 'changes',
	// 	rootFolderId: '1yficP672jh2jmHwfmHqKN5f3ca1Hd5rm',
	// },
	// {
	// 	collection: 'animation-test',
	// 	rootFolderId: '1skW21QjedKwrGWVfRlHShth4Zcg4oT4v',
	// },

	{
		collection: 'anyshape',
		rootFolderId: '1k8GM9DJdR4q9emW9pGEPU1o2UYHiRog0',
	},
	{
		collection: 'baum-und-pferdgarten',
		rootFolderId: '14dd0YvtPvanr8owwpG9RMRl-yo4QT44x',
	},
	{
		collection: 'bloom.womenswear',
		rootFolderId: '1Fsyv0mcFup0raVjvv4gXIW6SWVRlgALR',
	},
	{
		collection: 'cecilie-bahnsen',
		rootFolderId: '1oLq3zGmjacJx7cA3UNp6cb2py4k9LBx9',
	},
	{
		collection: 'crescent',
		rootFolderId: '1-_ccZhTYm9pV2fBQjKhjcpjOtGgE2t2f',
	},
	{
		collection: 'dario-mittmann',
		rootFolderId: '1dgfABw4Pv9hch85BPz4So1OeSuPwAO5w',
	},

	{
		collection: 'david-black',
		rootFolderId: '1p6FtdSkIGIA3JxB_sVhccD-zjnoyPhZw',
	},
	{
		collection: 'diane',
		rootFolderId: '1wJWNQbh-tmmKtHH0GGrB1AsGHz5nTniJ',
	},
	{
		collection: 'dico',
		rootFolderId: '1C76QlH0zqGBYLvRXi6AYoLyB6y2uJAiR',
	},
	{
		collection: 'dottie',
		rootFolderId: '1W-68fRdrKAUOKwBDAxc0WaofwqQo6nMJ',
	},
	{
		collection: 'erroris.ltd',
		rootFolderId: '1h1Mt2eq3xx8SQzb06t8E2nqEzBKZ4f_R',
	},
	{
		collection: 'gola',
		rootFolderId: '1ZBcsModfRLPD1tNn_cTSvV-nS7mUyo21',
	},
	{
		collection: 'h2b',
		rootFolderId: '1JCfZOMtSp4EfYLuH4HcBzRItb8_GFLLR',
	},
	{
		collection: 'joie-des-roses',
		rootFolderId: '1zP_KfpEqRx3az3_03DSGWEGRXn6oc3Cm',
	},
	{
		collection: 'jubin-studio',
		rootFolderId: '19faN1x2OpK3d2ftk0YV8WtOTU3sZU6ok',
	},
	{
		collection: 'julian-prohaska',
		rootFolderId: '1BNbvcSYavMSqXUhff7NG3aHbTSSzhNpv',
	},
	{
		collection: 'kido',
		rootFolderId: '1ye_JXheFecOOh9Lbb3EobxEEK3aCdpTD',
	},
	{
		collection: 'levents',
		rootFolderId: '1ML--cFFm0RB3FYjqGcSy5XM3FwZPL16q',
	},
	{
		collection: 'lider',
		rootFolderId: '1nQWCTO2_NloTlB5QR2A5s4j2TP-l1QkZ',
	},
	{
		collection: 'ononmm',
		rootFolderId: '1kzK8olqVK3iRg84DaA4Juf3YQ_zVns61',
	},
	{
		collection: 'paradise-saigon',
		rootFolderId: '1O-rlxQgP6s6NIqGhmK-u-QL-SKi9tq0c',
	},
	{
		collection: 'pindiga-ranjith-kumar',
		rootFolderId: '1TXY8y2y98IcqHSDgfNq_MZWkDJZ3rZau',
	},
	{
		collection: 'pradies',
		rootFolderId: '1JrDxYfDyX5wqupUclec_G-5H1QSQxNnH',
	},
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
		// Return CloudFront URL instead of S3 URL
		return result.Location.replace(S3_URL, CLOUDFRONT_URL)
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

// Process option materials folder and return material IDs
async function processOptionMaterials(optionMaterialsFolder: TODO): Promise<string[]> {
	console.log(`    📁 Processing option materials folder`)

	const optionMaterialsContents = await fetchFolderContents(optionMaterialsFolder.id)
	const materialReferenceFolders = optionMaterialsContents.filter(
		item => item.mimeType === 'application/vnd.google-apps.folder',
	)

	console.log(`      Found ${materialReferenceFolders.length} material reference folders`)

	const fabricOptions: string[] = []

	for (const materialRef of materialReferenceFolders) {
		// Parse and normalize the material folder name to match root materials format
		const nameWithoutSettings = materialRef.name.replace(/\s*<[^>]+>\s*$/, '')
		const folderNameParts = nameWithoutSettings.split('-')
		if (folderNameParts.length < 2) {
			console.warn(
				`      ⚠️ Invalid option material reference format: ${materialRef.name}. Expected: "Category - Name"`,
			)
			continue
		}

		const materialCategory = capitalize(normalizeName(folderNameParts[0].trim()))
		const materialName = capitalize(normalizeName(folderNameParts[1].trim()))
		const materialLabel = `${materialCategory} - ${materialName}`

		if (rootMaterials.has(materialLabel)) {
			const rootMaterial = rootMaterials.get(materialLabel)!
			if (!rootMaterial._id) {
				rootMaterial._id = uuidv4()
			}
			console.log(
				`      🔧 Adding option material: "${materialRef.name}" -> "${materialLabel}" (fabricId: ${rootMaterial._id})`,
			)
			fabricOptions.push(rootMaterial._id)
		} else {
			console.warn(
				`      ⚠️ Option material "${materialRef.name}" -> "${materialLabel}" not found in root materials. Skipping.`,
			)
		}
	}

	return fabricOptions
}

// Process option block folders and return block options
async function processOptionBlocks(
	optionBlockFolders: TODO[],
	templateCategory: string,
	collection: string,
	avatarGender: string,
): Promise<{category: string; blocks: TODO[]}[]> {
	const blockOptions: {category: string; blocks: TODO[]}[] = []

	for (const optionBlockFolder of optionBlockFolders) {
		console.log(`      📁 Processing option block folder: ${optionBlockFolder.name}`)

		// Extract category from folder name "Option Sleeves" -> "Sleeves"
		const categoryMatch = optionBlockFolder.name.match(/^Option\s+(.+)$/i)
		if (!categoryMatch) {
			console.warn(`      ⚠️ Invalid option block folder name: ${optionBlockFolder.name}`)
			continue
		}

		const blockCategory = normalizeBlockCategory(categoryMatch[1])
		console.log(`      📂 Block category: ${blockCategory}`)

		const optionBlockContents = await fetchFolderContents(optionBlockFolder.id)
		const blockFolders = optionBlockContents.filter(item => item.mimeType === 'application/vnd.google-apps.folder')

		console.log(`      Found ${blockFolders.length} block folders`)

		const categoryBlocks: TODO[] = []

		for (const blockFolder of blockFolders) {
			console.log(`        📁 Processing block folder: ${blockFolder.name}`)

			const blockContents = await fetchFolderContents(blockFolder.id)
			const gltfFiles = blockContents.filter(
				(f: TODO) => f.name.toLowerCase().endsWith('.gltf') || f.name.toLowerCase().endsWith('.glb'),
			)
			const pngFiles = blockContents.filter((f: TODO) => f.name.toLowerCase().endsWith('.png'))

			if (gltfFiles.length === 0 || pngFiles.length === 0) {
				console.warn(`        ⚠️ Missing files in block folder: ${blockFolder.name}`)
				continue
			}

			const gltfFile = gltfFiles[0]
			const pngFile = pngFiles[0]

			try {
				console.log(`        📥 Processing option block: ${blockFolder.name}`)

				// Download block files
				const [pngBuffer, gltfBuffer] = await Promise.all([
					downloadToBuffer(getDriveDownloadUrl(pngFile.id)),
					downloadToBuffer(getDriveDownloadUrl(gltfFile.id)),
				])

				// Upload to S3
				const [blockThumbS3Url, blockModelS3Url] = await Promise.all([
					uploadToS3(
						pngBuffer,
						`images/${collection}/options/${templateCategory}/${blockCategory}/${blockFolder.name}.png`,
						'image/png',
					),
					uploadToS3(
						gltfBuffer,
						`models/${collection}/options/${templateCategory}/${blockCategory}/${blockFolder.name}${path.extname(gltfFile.name)}`,
						'model/gltf+json',
					),
				])

				categoryBlocks.push({
					_id: uuidv4(),
					blockName: normalizeName(blockFolder.name),
					category: blockCategory,
					templateCategory: templateCategory,
					thumbUrl: blockThumbS3Url,
					modelUrl: blockModelS3Url,
					avatar: avatarGender,
				})

				console.log(`        ✅ Uploaded option block ${blockFolder.name}`)
			} catch (error) {
				console.error(`        ❌ Failed to process option block ${blockFolder.name}:`, error)
			}
		}

		if (categoryBlocks.length > 0) {
			blockOptions.push({
				category: blockCategory,
				blocks: categoryBlocks,
			})
		}
	}

	return blockOptions
}

// Process a template folder and extract template info and blocks
async function processTemplateFolder(
	templateFolder: TODO,
	category: string,
	collection: string,
): Promise<{template: TODO; blocks: TODO[]; optionBlocks: TODO[]; unsucceeded: TODO[]}> {
	console.log(`  📂 Processing template: ${templateFolder.name}`)

	const templateContents = await fetchFolderContents(templateFolder.id)

	// Find template thumbnail (PNG file in root of template folder)
	const templateThumbnail = templateContents.find(
		file => file.mimeType !== 'application/vnd.google-apps.folder' && file.name.toLowerCase().endsWith('.png'),
	)

	if (!templateThumbnail) {
		console.warn(`  ⚠️  No template thumbnail found for ${templateFolder.name}`)
		return {template: null, blocks: [], optionBlocks: [], unsucceeded: []}
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

	// Find Option folders for exclusive options
	const optionMaterialsFolders = templateContents.filter(
		item => item.mimeType === 'application/vnd.google-apps.folder' && normalizeName(item.name) === 'Option Materials',
	)

	const optionBlockFolders = templateContents.filter(
		item =>
			item.mimeType === 'application/vnd.google-apps.folder' &&
			item.name.toLowerCase().startsWith('option ') &&
			['bodice', 'pants', 'sleeves', 'hat', 'dress', 'skirt', 'fullbody', 'bag', 'accessory', 'coat'].some(blockType =>
				item.name.toLowerCase().includes(blockType.toLowerCase()),
			),
	)

	console.log(`    Found ${optionMaterialsFolders.length} option materials folders`)
	console.log(`    Found ${optionBlockFolders.length} option block folders`)

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
		return {template: null, blocks: [], optionBlocks: [], unsucceeded: []}
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
		`images/${collection}/templates/${category}/${templateFolder.name}.png`,
		'image/png',
	)

	// Process material references if they exist
	let materialKey: string | null = null
	let templateMaterialId: string | null = null
	if (materialReferenceFolders.length > 0) {
		console.log(`    📁 Processing material references for template`)

		// Get material reference (just use the first one for template reference)
		materialKey = await getTemplateMaterialReference(materialReferenceFolders[0])
		console.log(`     📎 Material reference: ${materialKey}`)

		// Add this category to the material's templateCategories and capture fabric id
		if (materialKey && rootMaterials.has(materialKey)) {
			const rootMaterial = rootMaterials.get(materialKey)!
			console.log(`     🔗 Adding category "${category}" to material "${materialKey}" (fabricId: ${rootMaterial._id})`)
			console.log(`     📊 Before: templateCategories = ${Array.from(rootMaterial.templateCategories)}`)
			rootMaterial.templateCategories.add(category)
			console.log(`     📊 After: templateCategories = ${Array.from(rootMaterial.templateCategories)}`)
			templateMaterialId = rootMaterial._id
		} else if (materialKey) {
			console.warn(`     ⚠️ Material "${materialKey}" not found in rootMaterials`)
			console.log(`     📋 Available materials: ${Array.from(rootMaterials.keys()).join(', ')}`)
		}
	}

	// Parse template name, price, and avatar gender from folder name
	let templateName = ''
	let templatePrice = 'N/A'
	let avatarGender = 'female' // Default gender

	// Check for gender prefix in folder name (handles [Male], _[Male]_, and space variations)
	const genderMatch = templateFolder.name.match(/^[\s_]*\[(Male|Female)\][\s_]*/i)
	if (genderMatch) {
		avatarGender = genderMatch[1].toLowerCase()
		// Remove gender prefix from template name processing
		const nameWithoutGender = templateFolder.name.replace(/^[\s_]*\[(Male|Female)\][\s_]*/i, '')
		const namePartsWithoutGender = nameWithoutGender.split('-')

		if (namePartsWithoutGender.length >= 2) {
			templateName = normalizeName(namePartsWithoutGender[0].trim())
			// Extract only numeric part from price (including decimals)
			const priceMatch = namePartsWithoutGender[1].trim().match(/\d+(\.\d+)?/)
			templatePrice = priceMatch ? priceMatch[0] : 'N/A'
		} else {
			templateName = normalizeName(nameWithoutGender)
		}
	} else {
		// No gender prefix, parse normally
		const folderNameParts = templateFolder.name.split('-')
		if (folderNameParts.length >= 2) {
			templateName = normalizeName(folderNameParts[0].trim())
			// Extract only numeric part from price (including decimals)
			const priceMatch = folderNameParts[1].trim().match(/\d+(\.\d+)?/)
			templatePrice = priceMatch ? priceMatch[0] : 'N/A'
		} else {
			templateName = normalizeName(templateFolder.name)
		}
	}

	// Process option materials for fabricOptions
	let fabricOptions: string[] = []
	if (optionMaterialsFolders.length > 0) {
		console.log(`    📁 Processing option materials`)
		fabricOptions = await processOptionMaterials(optionMaterialsFolders[0])
	}

	// Process option blocks for blockOptions
	let blockOptions: {category: string; blocks: TODO[]}[] = []
	if (optionBlockFolders.length > 0) {
		console.log(`    📁 Processing option blocks`)
		blockOptions = await processOptionBlocks(optionBlockFolders, category, collection, avatarGender)
	}

	const template = {
		name: templateName,
		price: templatePrice,
		category,
		thumbUrl: templateS3Url,
		materialId: templateMaterialId,
		avatar: avatarGender,
		folderId: templateFolder.id, // Add unique Google Drive folder ID
		...(extraMaterials.length > 0 && {extraMaterials}),
		...(fabricOptions.length > 0 && {fabricOptions}),
		...(blockOptions.length > 0 && {blockOptions}),
	}

	// Process blocks in each block type folder
	const allBlocks: TODO[] = []
	const allOptionBlocks: TODO[] = []
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
							`images/${collection}/blocks/${category}/${blockTypeFolder.name}/${baseName}.png`,
							'image/png',
						),
						uploadToS3(
							gltfBuffer,
							`models/${collection}/blocks/${category}/${blockTypeFolder.name}/${baseName}${path.extname(gltfFile.name)}`,
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
						avatar: avatarGender, // Include avatar gender from template
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

	// Collect all option blocks from blockOptions
	blockOptions.forEach(option => {
		allOptionBlocks.push(...option.blocks)
	})

	return {template, blocks: allBlocks, optionBlocks: allOptionBlocks, unsucceeded: unsucceeded}
}

function generateTemplateData(
	processedData: TODO[],
	collection: string,
): {templates: TODO; templateFolderIdToIdMap: Map<string, string>} {
	const templates: TODO = {}
	const templateFolderIdToIdMap = new Map<string, string>()

	processedData.forEach(({template}) => {
		if (!template) return

		const templateId = uuidv4()
		templates[collection] = templates[collection] || []
		templates[collection].push({
			_id: templateId,
			thumb: template.thumbUrl,
			name: template.name,
			price: template.price,
			avatar: template.avatar,
			category: template.category,
			collection: collection,
			materialId: template.materialId,
			...(template.extraMaterials && {extraMaterials: template.extraMaterials}),
			...(template.fabricOptions && {fabricOptions: template.fabricOptions}),
			...(template.blockOptions && {blockOptions: template.blockOptions}),
		})

		// Store mapping using unique Google Drive folder ID - guaranteed to be unique
		templateFolderIdToIdMap.set(template.folderId, templateId)
	})

	return {templates, templateFolderIdToIdMap}
}

function generateBlockData(
	processedData: TODO[],
	collection: string,
	templateFolderIdToIdMap: Map<string, string>,
): TODO {
	const blocks: TODO = {}

	processedData.forEach(({blocks: templateBlocks, optionBlocks}) => {
		// Process regular template blocks
		templateBlocks.forEach((block: TODO) => {
			blocks[collection] = blocks[collection] || []
			// Use unique Google Drive folder ID to find the correct template ID
			const templateId = templateFolderIdToIdMap.get(block.templateFolderId) || block.templateName // Fallback to name if ID not found
			blocks[collection].push({
				_id: uuidv4(),
				thumb: block.thumbUrl,
				modelFile: block.modelUrl,
				blockName: block.blockName,
				avatar: block.avatar, // Use avatar gender from block (inherited from template)
				category: block.category,
				collection: collection,
				templateId: templateId, // Now using actual template _id with guaranteed unique identification
				templateName: block.templateName,
				templateCategory: block.templateCategory,
			})
		})

		// Process option blocks (without templateId and templateName)
		optionBlocks.forEach((block: TODO) => {
			blocks[collection] = blocks[collection] || []
			blocks[collection].push({
				_id: uuidv4(),
				thumb: block.thumbUrl,
				modelFile: block.modelUrl,
				blockName: block.blockName,
				avatar: block.avatar,
				category: block.category,
				collection: collection,
				templateCategory: block.templateCategory,
				templateId: '', // Empty string instead of undefined
				templateName: '', // Empty string instead of undefined
			})
		})
	})

	return blocks
}

function generateFabricData(collection: string): TODO {
	const fabrics: TODO = {}

	console.log(`🎨 Generating fabric data for collection: ${collection}`)
	console.log(`📦 Total root materials available: ${rootMaterials.size}`)

	// Convert root materials to fabric data
	rootMaterials.forEach((material, materialKey) => {
		console.log(`   📎 Processing material: ${materialKey}`)
		console.log(`   📋 Template categories: ${Array.from(material.templateCategories).join(', ') || 'NONE'}`)
		console.log(`   📏 Template categories size: ${material.templateCategories.size}`)

		const fabricId = material._id || uuidv4()
		if (!material._id) {
			material._id = fabricId
		}

		fabrics[collection] = fabrics[collection] || []
		fabrics[collection].push({
			_id: fabricId,
			thumb: material.thumbUrl,
			normal: material.normal,
			baseColor: material.baseColor,
			displacement: material.displacement,
			roughness: material.roughness,
			alpha: material.alpha,
			materialName: material.materialName,
			category: material.category,
			collection: collection,
			templateCategories: material.templateCategories.size > 0 ? Array.from(material.templateCategories) : [], // Convert Set to Array
			...(material.scaleX !== undefined && {scaleX: material.scaleX}),
			...(material.scaleY !== undefined && {scaleY: material.scaleY}),
			...(material.offsetX !== undefined && {offsetX: material.offsetX}),
			...(material.offsetY !== undefined && {offsetY: material.offsetY}),
			...(material.rotate !== undefined && {rotate: material.rotate}),
			...(material.coef !== undefined && {coef: material.coef}),
		})
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

				const fabricOptionsString = template.fabricOptions
					? `,\n\t\tfabricOptions: [${template.fabricOptions.map((fabric: string) => `'${fabric}'`).join(', ')}]`
					: ''

				const blockOptionsString = template.blockOptions
					? `,\n\t\tblockOptions: [\n${template.blockOptions
							.map(
								(option: {category: string; blocks: TODO[]}) =>
									`\t\t\t{\n\t\t\t\tcategory: '${option.category}',\n\t\t\t\tblocks: [\n${option.blocks
										.map(
											(block: TODO) =>
												`\t\t\t\t\t{\n\t\t\t\t\t\t_id: '${block._id}',\n\t\t\t\t\t\tthumb: '${block.thumbUrl}',\n\t\t\t\t\t\tmodelFile: '${block.modelUrl}',\n\t\t\t\t\t\tblockName: '${block.blockName}',\n\t\t\t\t\t\tavatar: '${block.avatar}',\n\t\t\t\t\t\tcategory: '${block.category}',\n\t\t\t\t\t\ttemplateCategory: '${block.templateCategory}'\n\t\t\t\t\t}`,
										)
										.join(',\n')}\n\t\t\t\t]\n\t\t\t}`,
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
		collection: '${template.collection}',
		materialId: '${template.materialId || ''}'${extraMaterialsString}${fabricOptionsString}${blockOptionsString}
	}`
			})
			.join(',\n')
	}

	return `import type {Template} from '../types/template'

export const templates: Record<string, Template[]> = {
	${Object.entries(finalTemplatesContent)
		.map(
			([collectionName, templatesArray]) => `'${collectionName}' : [
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
		collection: '${block.collection}',
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
		'${collectionName}' : [
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
			.map((fabric: TODO) => {
				const texturePropsString = [
					fabric.scaleX !== undefined ? `,\n\t\tscaleX: ${fabric.scaleX}` : '',
					fabric.scaleY !== undefined ? `,\n\t\tscaleY: ${fabric.scaleY}` : '',
					fabric.offsetX !== undefined ? `,\n\t\toffsetX: ${fabric.offsetX}` : '',
					fabric.offsetY !== undefined ? `,\n\t\toffsetY: ${fabric.offsetY}` : '',
					fabric.rotate !== undefined ? `,\n\t\trotate: ${fabric.rotate}` : '',
					fabric.coef !== undefined ? `,\n\t\tcoef: ${fabric.coef}` : '',
				].join('')

				return `	{
		_id: '${fabric._id}',
		thumb: '${fabric.thumb || ''}',
		normal: '${fabric.normal || ''}',
		baseColor: '${fabric.baseColor || ''}',
		displacement: '${fabric.displacement || ''}',
		roughness: '${fabric.roughness || ''}',
		alpha: '${fabric.alpha || ''}',
		materialName: '${fabric.materialName}',
		category: '${fabric.category || ''}',
		collection: '${fabric.collection}',
		templateCategories: [${fabric.templateCategories.map((cat: string) => `'${cat}'`).join(', ')}]${texturePropsString}
	}`
			})
			.join(',\n')
	}

	return `import type {Fabric} from '../types/fabric'

export const fabrics: Record<string, Fabric[]> = {
	${Object.entries(finalFabricsContent)
		.map(
			([collectionName, fabricsArray]) => `'${collectionName}' : [
${fabricsArray}
	]`,
		)
		.join(',\n\t')}
}
`
}

async function updateTemplatesFile(content: string): Promise<void> {
	const templatesPath = path.join(__dirname, '../../public/consts/templates_copy.ts')
	fs.writeFileSync(templatesPath, content, 'utf8')
	console.log('✅ templates.ts updated successfully')
}

async function updateBlocksFile(content: string): Promise<void> {
	const blocksPath = path.join(__dirname, '../../public/consts/blocks_copy.ts')
	fs.writeFileSync(blocksPath, content, 'utf8')
	console.log('✅ blocks.ts updated successfully')
}

async function updateFabricsFile(content: string): Promise<void> {
	const fabricsPath = path.join(__dirname, '../../public/consts/fabrics_copy.ts')
	fs.writeFileSync(fabricsPath, content, 'utf8')
	console.log('✅ fabrics.ts updated successfully')
}

// Process root Materials folder and store all materials
async function processRootMaterials(rootMaterialsFolder: TODO, collection: string): Promise<void> {
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

		// Parse material name and texture settings from folder name: "${materialCategory} - ${materialName} <scaleX, scaleY, offsetX, offsetY, coef, rotate>"
		let materialCategory: string
		let materialName: string
		let textureSettings: {
			scaleX: number
			scaleY: number
			offsetX: number
			offsetY: number
			rotate: number
			coef: number
		} | null = null

		// Check for texture settings pattern at the end
		const textureSettingsMatch = materialFolder.name.match(/<([^>]+)>\s*$/)
		let nameWithoutSettings = materialFolder.name

		if (textureSettingsMatch) {
			const settingsStr = textureSettingsMatch[1]
			const settingsValues = settingsStr.split(',').map((s: string) => parseFloat(s.trim()))

			if (settingsValues.length === 6 && settingsValues.every((v: number) => !isNaN(v))) {
				textureSettings = {
					scaleX: settingsValues[0],
					scaleY: settingsValues[1],
					offsetX: settingsValues[2],
					offsetY: settingsValues[3],
					coef: settingsValues[4],
					rotate: settingsValues[5],
				}
				// Remove texture settings from name for parsing
				nameWithoutSettings = materialFolder.name.replace(/\s*<[^>]+>\s*$/, '')
				console.log(`    🎛️ Found texture settings: ${JSON.stringify(textureSettings)}`)
			} else {
				console.warn(`    ⚠️ Invalid texture settings format: ${settingsStr}. Expected 6 numeric values.`)
			}
		}

		const folderNameParts = nameWithoutSettings.split('-')
		if (folderNameParts.length < 2) {
			console.warn(`    ⚠️ Invalid material folder name format: ${materialFolder.name}. Expected: "Category - Name"`)
			continue
		}

		materialCategory = capitalize(normalizeName(folderNameParts[0].trim()))
		materialName = capitalize(normalizeName(folderNameParts[1].trim()))
		const materialLabel = `${materialCategory} - ${materialName}`

		// Check if already processed
		if (rootMaterials.has(materialLabel)) {
			console.log(`    ⚠️ Material ${materialLabel} already processed, skipping...`)
			continue
		}

		const fabricId = uuidv4()

		// First, look for thumbnail file (RENDER)
		const thumbnailFile = materialFiles.find(file => file.name.toLowerCase().includes('render'))
		if (thumbnailFile) {
			try {
				console.log(`    📸 Processing thumbnail: ${thumbnailFile.name}`)

				const thumbBuffer = await downloadToBuffer(getDriveDownloadUrl(thumbnailFile.id))
				thumbUrl = await uploadToS3(
					thumbBuffer,
					`fabrics/${collection}/root/${materialFolder.name}/${thumbnailFile.name}`,
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
					`fabrics/${collection}/root/${materialFolder.name}/${file.name}`,
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
			_id: fabricId,
			materialName,
			category: materialCategory,
			thumbUrl,
			...textureUrls,
			templateCategories: new Set<string>(), // Will be populated later
			...(textureSettings && {
				scaleX: textureSettings.scaleX,
				scaleY: textureSettings.scaleY,
				offsetX: textureSettings.offsetX,
				offsetY: textureSettings.offsetY,
				rotate: textureSettings.rotate,
				coef: textureSettings.coef,
			}),
		}

		rootMaterials.set(materialLabel, materialData)
		console.log(`   🥳 Processed root material: ${materialLabel}`)
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
		// Remove texture settings if present: "Category - Name <settings>" -> "Category - Name"
		const nameWithoutSettings = materialRef.name.replace(/\s*<[^>]+>\s*$/, '')
		const folderNameParts = nameWithoutSettings.split('-')
		if (folderNameParts.length < 2) {
			console.warn(
				`    ⚠️ Invalid category material reference format: ${materialRef.name}. Expected: "Category - Name"`,
			)
			continue
		}

		const materialCategory = capitalize(normalizeName(folderNameParts[0].trim()))
		const materialName = capitalize(normalizeName(folderNameParts[1].trim()))
		const materialLabel = `${materialCategory} - ${materialName}`

		console.log(`    🔧 Normalizing material reference: "${materialRef.name}" -> "${materialLabel}"`)

		if (!categoryMaterialAssignments.has(categoryName)) {
			categoryMaterialAssignments.set(categoryName, new Set())
		}
		categoryMaterialAssignments.get(categoryName)!.add(materialLabel)
		console.log(`    ✅ Assigned material ${materialLabel} to category ${categoryName}`)
	}
}

// Get material reference from template and return the lookup label (used to resolve fabric IDs)
async function getTemplateMaterialReference(materialFolder: TODO): Promise<string | null> {
	// Template material folders are just reference folders (empty)
	// The folder name is the material label: "${materialCategory} - ${materialName}"
	// Remove texture settings if present: "Category - Name <settings>" -> "Category - Name"
	const nameWithoutSettings = materialFolder.name.replace(/\s*<[^>]+>\s*$/, '')
	const folderNameParts = nameWithoutSettings.split('-')
	if (folderNameParts.length < 2) {
		console.warn(
			`    ⚠️ Invalid template material reference format: ${materialFolder.name}. Expected: "Category - Name"`,
		)
		return null
	}
	const materialCategory = capitalize(normalizeName(folderNameParts[0].trim()))
	const materialName = capitalize(normalizeName(folderNameParts[1].trim()))
	const materialLabel = `${materialCategory} - ${materialName}`
	return materialLabel
}

// Process 'Extra Materials' folder and return mesh -> materialId mappings
async function processExtraMaterialsFolder(extraMaterialsFolder: TODO): Promise<{mesh: string; materialId: string}[]> {
	console.log(`  📁 Processing Extra Materials folder`)

	const extraMaterialsContents = await fetchFolderContents(extraMaterialsFolder.id)
	const meshFolders = extraMaterialsContents.filter(item => item.mimeType === 'application/vnd.google-apps.folder')

	console.log(`    Found ${meshFolders.length} mesh folders`)

	const materialToMeshes: Map<string, {meshes: string[]; materialLabel: string}> = new Map()

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
		// Remove texture settings if present: "Category - Name <settings>" -> "Category - Name"
		const nameWithoutSettings = materialReferenceFolder.name.replace(/\s*<[^>]+>\s*$/, '')
		const folderNameParts = nameWithoutSettings.split('-')
		if (folderNameParts.length < 2) {
			console.warn(
				`      ⚠️ Invalid material reference format: ${materialReferenceFolder.name}. Expected: "Category - Name"`,
			)
			continue
		}

		const materialCategory = capitalize(normalizeName(folderNameParts[0].trim()))
		const materialName = capitalize(normalizeName(folderNameParts[1].trim()))
		const materialLabel = `${materialCategory} - ${materialName}`

		if (!rootMaterials.has(materialLabel)) {
			console.warn(
				`      ⚠️ Material reference "${materialReferenceFolder.name}" -> "${materialLabel}" not found in root materials. Skipping.`,
			)
			continue
		}

		const rootMaterial = rootMaterials.get(materialLabel)!
		if (!rootMaterial._id) {
			rootMaterial._id = uuidv4()
		}
		const fabricId = rootMaterial._id

		console.log(`      ✅ Mesh "${meshName}" -> Material "${materialLabel}" (fabricId: ${fabricId})`)

		const sanitizedMeshName = THREE.PropertyBinding.sanitizeNodeName(meshName)

		// Group meshes by materialId
		if (!materialToMeshes.has(fabricId)) {
			materialToMeshes.set(fabricId, {meshes: [], materialLabel})
		}
		materialToMeshes.get(fabricId)!.meshes.push(sanitizedMeshName)
	}

	// Convert grouped materials to final format
	const extraMaterials: {mesh: string; materialId: string}[] = []
	materialToMeshes.forEach(({meshes, materialLabel}, fabricId) => {
		const combinedMeshKey = meshes.join('-')
		console.log(`      🔗 Grouped material "${materialLabel}" (fabricId: ${fabricId}) -> meshes: "${combinedMeshKey}"`)
		extraMaterials.push({
			mesh: combinedMeshKey,
			materialId: fabricId,
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
		console.log(
			`🏷️  Processing ${COLLECTION_CONFIGS.length} collections: ${COLLECTION_CONFIGS.map(c => c.collection).join(', ')}`,
		)

		// Initialize combined data structures
		const allTemplates: TODO = {}
		const allBlocks: TODO = {}
		const allCombinedFabrics: TODO = {}
		const allUnsucceeded: TODO[] = []

		// Process each collection
		for (const collectionConfig of COLLECTION_CONFIGS) {
			const {collection, rootFolderId} = collectionConfig
			console.log(`\n🏢 Processing collection: ${collection}`)
			console.log(`🗂️  Root folder ID: ${rootFolderId}`)

			// Reset data for this collection
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
				await processRootMaterials(rootMaterialsFolder, collection)
			} else {
				console.warn(`⚠️  No root Materials folder found for collection ${collection}`)
			}

			const collectionProcessedData: TODO[] = []

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
					const processedTemplate = await processTemplateFolder(templateFolder, categoryFolder.name, collection)
					if (processedTemplate.template) {
						collectionProcessedData.push(processedTemplate)
					}
					allUnsucceeded.push(...processedTemplate.unsucceeded)
					// Option blocks will be handled separately in block generation
				}
			}

			// Step 3: Apply category material assignments to materials
			applyCategoryAssignments()

			// Debug: Check final state of materials before generating fabric data
			console.log(`🔍 Final state check before generating fabric data for collection: ${collection}`)
			console.log(`📦 Total root materials: ${rootMaterials.size}`)
			rootMaterials.forEach((material, materialKey) => {
				console.log(`  📎 Material: ${materialKey}`)
				console.log(`    📋 Template categories: ${Array.from(material.templateCategories).join(', ') || 'NONE'}`)
				console.log(`    📏 Size: ${material.templateCategories.size}`)
			})

			// Generate data for this collection
			const {templates: collectionTemplates, templateFolderIdToIdMap} = generateTemplateData(
				collectionProcessedData,
				collection,
			)
			const collectionBlocks = generateBlockData(collectionProcessedData, collection, templateFolderIdToIdMap)
			const collectionFabricsData = generateFabricData(collection)

			// Merge with combined data
			Object.assign(allTemplates, collectionTemplates)
			Object.assign(allBlocks, collectionBlocks)
			Object.assign(allCombinedFabrics, collectionFabricsData)

			console.log(`✅ Completed processing collection: ${collection}`)
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
		COLLECTION_CONFIGS.forEach(({collection}) => {
			console.log(`   ${collection} Template Images: images/${collection}/templates/{category}/`)
			console.log(`   ${collection} Template Materials: materials/${collection}/templates/{category}/{templateName}/`)
			console.log(`   ${collection} Block Images: images/${collection}/blocks/{category}/{blockType}/`)
			console.log(`   ${collection} Fabric Textures: fabrics/${collection}/{category}/{materialName}/`)
			console.log(`   ${collection} Block Models: models/${collection}/blocks/{category}/{blockType}/`)
		})

		process.exit(0)
	} catch (error) {
		console.error('❌ Script failed:', error)
		process.exit(1)
	}
}

// Run main function if this file is executed directly
main()
