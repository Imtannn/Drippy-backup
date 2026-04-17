// FIXME this is currently broken, we're gonna switch to uploads via backend
import {
	HeadObjectCommand,
	ObjectCannedACL,
	PutObjectCommand,
	S3Client,
	type PutObjectCommandInput,
} from '@aws-sdk/client-s3'
import {randomUUID as uuidv4} from 'crypto'
import * as fs from 'fs'
import * as path from 'path'
import sharp from 'sharp'
import * as THREE from 'three'
import {google} from 'googleapis'

const auth = new google.auth.GoogleAuth({
	keyFile: path.join(__dirname, '../google-service-account.json'),
	scopes: ['https://www.googleapis.com/auth/drive.readonly'],
})
const drive = google.drive({version: 'v3', auth})

type TODO = unknown

// Google Drive API Key (you can get this from Google Cloud Console for free)
const API_KEY = process.env.GOOGLE_API_KEY || 'GOOGLE_API_KEY'

// AWS S3 Configuration
// const S3_BUCKET = process.env.S3_BUCKET || 'your-bucket-name'
// const S3_REGION = process.env.S3_REGION || 'us-east-1'
// const S3_ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID
// const S3_SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY
// const S3_URL = '/static'
// const S3_ENDPOINT = // not used with AWS, it creates it automatically
// Cloudflare S3 Configuration
const S3_BUCKET = process.env.CLOUDFLARE_S3_BUCKET || 'your-bucket-name'
const S3_REGION = 'auto'
const S3_ACCESS_KEY = process.env.CLOUDFLARE_ACCESS_KEY_ID
const S3_SECRET_KEY = process.env.CLOUDFLARE_SECRET_ACCESS_KEY
const S3_URL = '/static'
const S3_ENDPOINT = 'https://4109b23870ac503947ce4596eddfa656.eu.r2.cloudflarestorage.com/drippy-assets'

const s3 = new S3Client({
	region: S3_REGION,
	endpoint: S3_ENDPOINT,
	...(S3_ACCESS_KEY && S3_SECRET_KEY
		? {
				credentials: {
					accessKeyId: S3_ACCESS_KEY,
					secretAccessKey: S3_SECRET_KEY,
				},
			}
		: {}),
})

type CollectionConfig = {collection: string; rootFolderId: string; gender?: 'male' | 'female'}
type CollectionConfigs = CollectionConfig[]
type CollectionUploadTracker = {hasUploadedContent: boolean}

const COLLECTION_PARENT_FOLDER_IDS = (process.env.COLLECTION_PARENT_FOLDER_IDS || '')
	.split(',')
	.map(id => id.trim())
	.filter(Boolean)

// Build collection configs from direct child folders of the given parent folders.
async function buildCollectionConfigsFromParentFolders(parentFolderIds: string[]): Promise<CollectionConfigs> {
	const collectionConfigs: CollectionConfigs = []

	for (const parentFolderId of parentFolderIds) {
		let nextPageToken: string | undefined

		do {
			const response = await withRetry(async () => {
				return drive.files.list({
					q: `'${parentFolderId}' in parents and trashed=false and mimeType='application/vnd.google-apps.folder'`,
					fields: 'nextPageToken,files(id,name)',
					pageSize: 1000,
					pageToken: nextPageToken,
				})
			})

			const subfolders = response.data.files || []
			for (const folder of subfolders) {
				const isMaleCollection = folder.name!.trim().startsWith('(MALE)')
				const normalizedFolderName = folder
					.name!.replace(/^\(MALE\)/, '')
					.trim()
					.replaceAll(' ', '_')
					.toLowerCase()

				collectionConfigs.push({
					collection: normalizedFolderName,
					rootFolderId: folder.id!,
					...(isMaleCollection && {gender: 'male'}),
				})
			}

			nextPageToken = response.data.nextPageToken || undefined
		} while (nextPageToken)
	}

	return collectionConfigs
}

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

function getFinalS3Key(key: string, contentType: string, toWebp: boolean = true): string {
	let finalKey = key

	if (contentType.startsWith('image/') && toWebp)
		finalKey = path.extname(finalKey) ? finalKey.replace(/\.[^./]+$/, '.webp') : `${finalKey}.webp`

	return finalKey.replace(/ /g, '_')
}

async function shouldDownloadAndUploadToS3(key: string, modifiedTime: string): Promise<boolean> {
	const sourceModifiedAt = new Date(modifiedTime)

	try {
		const headResponse = await s3.send(
			new HeadObjectCommand({
				Bucket: S3_BUCKET,
				Key: key,
			}),
		)

		if (headResponse.LastModified && sourceModifiedAt.getTime() <= headResponse.LastModified.getTime()) {
			console.log(
				`⏭️  Skipping transfer (not newer): ${key} | Drive: ${sourceModifiedAt.toISOString()} <= S3: ${headResponse.LastModified.toISOString()}`,
			)
			return false
		}

		return true
	} catch (error) {
		const maybeError = error as {name?: string; $metadata?: {httpStatusCode?: number}}
		const statusCode = maybeError.$metadata?.httpStatusCode
		const name = maybeError.name
		const objectMissing = statusCode === 404 || name === 'NotFound' || name === 'NoSuchKey'

		if (objectMissing) return true

		console.error('Error checking existing S3 object metadata:', error)
		throw error
	}
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

	const normalizedKey = getFinalS3Key(uploadKey, uploadContentType, toWebp)

	const params: PutObjectCommandInput = {
		Bucket: S3_BUCKET,
		Key: normalizedKey,
		Body: uploadBuffer,
		ContentType: uploadContentType,
		ACL: ObjectCannedACL.public_read,
	}

	try {
		await s3.send(new PutObjectCommand(params))
		return `${S3_URL}/${params.Key}`
	} catch (error) {
		console.error('Error uploading to S3:', error)
		throw error
	}
}

// Download file from Google Drive using API
async function downloadFromDrive(fileId: string): Promise<Buffer> {
	return withRetry(async () => {
		const response = await drive.files.get({fileId, alt: 'media'}, {responseType: 'arraybuffer'})
		return Buffer.from(response.data as ArrayBuffer)
	})
}

async function fetchFolderContents(folderId: string): Promise<TODO[]> {
	try {
		const response = await drive.files.list({
			q: `'${folderId}' in parents and trashed=false`,
			fields: 'files(id,name,mimeType,parents,modifiedTime)',
		})
		return response.data.files || []
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
	if (folderName.toLowerCase().includes('jacket')) return 'Jacket'
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
			if (!rootMaterial._id) rootMaterial._id = uuidv4()

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
	uploadTracker: CollectionUploadTracker,
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
				const blockThumbKey = `images/${collection}/options/${templateCategory}/${blockCategory}/${blockFolder.name}.png`
				const blockModelKey = `models/${collection}/options/${templateCategory}/${blockCategory}/${blockFolder.name}${path.extname(
					gltfFile.name,
				)}`
				const normalizedBlockThumbKey = getFinalS3Key(blockThumbKey, 'image/png')
				const normalizedBlockModelKey = getFinalS3Key(blockModelKey, 'model/gltf+json')

				const [shouldTransferThumb, shouldTransferModel] = await Promise.all([
					shouldDownloadAndUploadToS3(normalizedBlockThumbKey, pngFile.modifiedTime),
					shouldDownloadAndUploadToS3(normalizedBlockModelKey, gltfFile.modifiedTime),
				])

				if (shouldTransferThumb || shouldTransferModel)
					console.log(`        📥 Processing option block: ${blockFolder.name}`)

				if (shouldTransferThumb || shouldTransferModel) uploadTracker.hasUploadedContent = true

				let blockThumbS3Url = `${S3_URL}/${normalizedBlockThumbKey}`
				let blockModelS3Url = `${S3_URL}/${normalizedBlockModelKey}`
				const transferOps: Promise<void>[] = []

				if (shouldTransferThumb) {
					transferOps.push(
						(async () => {
							const pngBuffer = await downloadFromDrive(pngFile.id)
							blockThumbS3Url = await uploadToS3(pngBuffer, blockThumbKey, 'image/png')
						})(),
					)
				}

				if (shouldTransferModel) {
					transferOps.push(
						(async () => {
							const gltfBuffer = await downloadFromDrive(gltfFile.id)
							blockModelS3Url = await uploadToS3(gltfBuffer, blockModelKey, 'model/gltf+json')
						})(),
					)
				}

				await Promise.all(transferOps)

				categoryBlocks.push({
					_id: uuidv4(),
					blockName: normalizeName(blockFolder.name),
					category: blockCategory,
					templateCategory: templateCategory,
					thumbUrl: blockThumbS3Url,
					modelUrl: blockModelS3Url,
					avatar: avatarGender,
				})

				if (shouldTransferThumb || shouldTransferModel)
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
	defaultGender: 'male' | 'female' = 'female',
	uploadTracker: CollectionUploadTracker,
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
			['bodice', 'pants', 'sleeves', 'hat', 'dress', 'skirt', 'fullbody', 'bag', 'accessory', 'coat', 'jacket'].some(
				blockType => item.name.toLowerCase().includes(blockType.toLowerCase()),
			),
	)

	const materialFolders = templateContents.filter(
		item => item.mimeType === 'application/vnd.google-apps.folder' && normalizeName(item.name) === 'Materials',
	)

	const materialFolder = materialFolders?.[0] as TODO
	if (!materialFolder) console.warn(`  ⚠️  No material folders found for ${templateFolder.name}`)
	else console.log(`    Found ${materialFolder.name} material folder`)

	// Find Extra Materials folder in template
	const extraMaterialsFolders = templateContents.filter(
		item => item.mimeType === 'application/vnd.google-apps.folder' && normalizeName(item.name) === 'Extra Materials',
	)

	let extraMaterials: {mesh: string; materialId: string}[] = []
	if (extraMaterialsFolders.length > 0) extraMaterials = await processExtraMaterialsFolder(extraMaterialsFolders[0])

	// Find Option folders for exclusive options
	const optionMaterialsFolders = templateContents.filter(
		item => item.mimeType === 'application/vnd.google-apps.folder' && normalizeName(item.name) === 'Option Materials',
	)

	const optionBlockFolders = templateContents.filter(
		item =>
			item.mimeType === 'application/vnd.google-apps.folder' &&
			item.name.toLowerCase().startsWith('option ') &&
			['bodice', 'pants', 'sleeves', 'hat', 'dress', 'skirt', 'fullbody', 'bag', 'accessory', 'coat', 'jacket'].some(
				blockType => item.name.toLowerCase().includes(blockType.toLowerCase()),
			),
	)

	console.log(`    Found ${optionMaterialsFolders.length} option materials folders`)
	console.log(`    Found ${optionBlockFolders.length} option block folders`)

	let materialContents: TODO[] = []
	if (materialFolder) materialContents = await fetchFolderContents(materialFolder.id)

	// Find material reference folders in template
	const materialReferenceFolders = materialContents.filter(
		item => item.mimeType === 'application/vnd.google-apps.folder',
	)

	if (blockTypeFolders.length === 0) {
		console.warn(`  ⚠️  No block type folders found for ${templateFolder.name}`)
		return {template: null, blocks: [], optionBlocks: [], unsucceeded: []}
	}

	console.log(`    Found ${blockTypeFolders.length} block type folders`)
	if (materialReferenceFolders.length > 0)
		console.log(`    Found ${materialReferenceFolders.length} material reference folders`)

	const templateThumbKey = `images/${collection}/templates/${category}/${templateFolder.name}.png`
	const normalizedTemplateThumbKey = getFinalS3Key(templateThumbKey, 'image/png')
	const shouldTransferTemplateThumb = await shouldDownloadAndUploadToS3(
		normalizedTemplateThumbKey,
		templateThumbnail.modifiedTime,
	)

	let templateS3Url = `${S3_URL}/${normalizedTemplateThumbKey}`
	if (shouldTransferTemplateThumb) {
		// Download template thumbnail
		const templateThumbnailBuffer = await downloadFromDrive(templateThumbnail.id)
		templateS3Url = await uploadToS3(templateThumbnailBuffer, templateThumbKey, 'image/png')
	}

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
	let avatarGender = defaultGender // Default gender from collection config

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
		} else templateName = normalizeName(nameWithoutGender)
	} else {
		// No gender prefix, parse normally
		const folderNameParts = templateFolder.name.split('-')
		if (folderNameParts.length >= 2) {
			templateName = normalizeName(folderNameParts[0].trim())
			// Extract only numeric part from price (including decimals)
			const priceMatch = folderNameParts[1].trim().match(/\d+(\.\d+)?/)
			templatePrice = priceMatch ? priceMatch[0] : 'N/A'
		} else templateName = normalizeName(templateFolder.name)
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
		blockOptions = await processOptionBlocks(optionBlockFolders, category, collection, avatarGender, uploadTracker)
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
			`      📁 Found ${gltfFiles.length} GLTF files and ${pngFiles.length} PNG files, block type: ${
				gltfFiles[0]?.name || ''
			} ${pngFiles[0]?.name || ''}`,
		)

		// Match GLTF and PNG pairs
		for (const gltfFile of gltfFiles) {
			const baseName = path.basename(gltfFile.name, path.extname(gltfFile.name)).toLowerCase()
			const matchingPng = pngFiles[0]

			if (matchingPng) {
				try {
					const blockThumbKey = `images/${collection}/blocks/${category}/${blockTypeFolder.name}/${baseName}.png`
					const blockModelKey = `models/${collection}/blocks/${category}/${blockTypeFolder.name}/${baseName}${path.extname(
						gltfFile.name,
					)}`
					const normalizedBlockThumbKey = getFinalS3Key(blockThumbKey, 'image/png')
					const normalizedBlockModelKey = getFinalS3Key(blockModelKey, 'model/gltf+json')

					const [shouldTransferThumb, shouldTransferModel] = await Promise.all([
						shouldDownloadAndUploadToS3(normalizedBlockThumbKey, matchingPng.modifiedTime),
						shouldDownloadAndUploadToS3(normalizedBlockModelKey, gltfFile.modifiedTime),
					])

					if (shouldTransferThumb || shouldTransferModel) console.log(`      📥 Processing block: ${baseName}`)
					if (shouldTransferThumb || shouldTransferModel) uploadTracker.hasUploadedContent = true

					let blockThumbS3Url = `${S3_URL}/${normalizedBlockThumbKey}`
					let blockModelS3Url = `${S3_URL}/${normalizedBlockModelKey}`
					const transferOps: Promise<void>[] = []

					if (shouldTransferThumb) {
						transferOps.push(
							(async () => {
								const pngBuffer = await downloadFromDrive(matchingPng.id)
								blockThumbS3Url = await uploadToS3(pngBuffer, blockThumbKey, 'image/png')
							})(),
						)
					}

					if (shouldTransferModel) {
						transferOps.push(
							(async () => {
								const gltfBuffer = await downloadFromDrive(gltfFile.id)
								blockModelS3Url = await uploadToS3(gltfBuffer, blockModelKey, 'model/gltf+json')
							})(),
						)
					}

					await Promise.all(transferOps)

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

					if (shouldTransferThumb || shouldTransferModel) console.log(`      ✅ Uploaded block ${baseName}`)
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
		if (!material._id) material._id = fabricId

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
												`\t\t\t\t\t{\n\t\t\t\t\t\t_id: '${block._id}',\n\t\t\t\t\t\tthumb: '${block.thumbUrl}',\n\t\t\t\t\t\tmodelFile: '${block.modelUrl}',\n\t\t\t\t\t\tblockName: '${block.blockName}',\n\t\t\t\t\t\tavatar: '${block.avatar}',\n\t\t\t\t\t\tcategory: '${block.category}',\n\t\t\t\t\t\tcollection: '${template.collection}',\n\t\t\t\t\t\ttemplateCategory: '${block.templateCategory}'\n\t\t\t\t\t}`,
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
async function processRootMaterials(
	rootMaterialsFolder: TODO,
	collection: string,
	uploadTracker: CollectionUploadTracker,
): Promise<void> {
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
			} else console.warn(`    ⚠️ Invalid texture settings format: ${settingsStr}. Expected 6 numeric values.`)
		}

		const folderNameParts = nameWithoutSettings.split('-')
		if (folderNameParts.length < 2) {
			console.warn(`    ⚠️ Invalid material folder name format: ${materialFolder.name}. Expected: "Category - Name"`)
			continue
		}

		const materialCategory = capitalize(normalizeName(folderNameParts[0].trim()))
		const materialName = capitalize(normalizeName(folderNameParts[1].trim()))
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
				const thumbnailKey = `fabrics/${collection}/root/${materialFolder.name}/${thumbnailFile.name}`
				const normalizedThumbnailKey = getFinalS3Key(thumbnailKey, 'image/png')
				const shouldTransferThumbnail = await shouldDownloadAndUploadToS3(
					normalizedThumbnailKey,
					thumbnailFile.modifiedTime,
				)

				if (shouldTransferThumbnail) {
					console.log(`    📸 Processing thumbnail: ${thumbnailFile.name}`)
					uploadTracker.hasUploadedContent = true
					const thumbBuffer = await downloadFromDrive(thumbnailFile.id)
					thumbUrl = await uploadToS3(thumbBuffer, thumbnailKey, 'image/png')
				} else thumbUrl = `${S3_URL}/${normalizedThumbnailKey}`

				if (shouldTransferThumbnail) console.log(`     ✅ Uploaded thumbnail ${thumbnailFile.name}`)
			} catch (error) {
				console.error(`     ❌ Failed to process thumbnail ${thumbnailFile.name}:`, error)
			}
		}

		for (const file of materialFiles) {
			// Skip thumbnail file as we've already processed it
			if (file.name.toLowerCase().includes('render')) continue

			try {
				const extension = path.extname(file.name).toLowerCase()
				let contentType = 'application/octet-stream'

				if (extension === '.jpg' || extension === '.jpeg') contentType = 'image/jpeg'
				else if (extension === '.png') contentType = 'image/png'
				else if (extension === '.webp') contentType = 'image/webp'

				const textureKey = `fabrics/${collection}/root/${materialFolder.name}/${file.name}`
				const normalizedTextureKey = getFinalS3Key(textureKey, contentType, false)
				const shouldTransferTexture = await shouldDownloadAndUploadToS3(normalizedTextureKey, file.modifiedTime)

				let fileS3Url = `${S3_URL}/${normalizedTextureKey}`
				if (shouldTransferTexture) {
					console.log(`    📥 Processing texture: ${file.name}`)
					uploadTracker.hasUploadedContent = true
					const fileBuffer = await downloadFromDrive(file.id)
					fileS3Url = await uploadToS3(fileBuffer, textureKey, contentType, true, false)
				}

				// Map files based on name
				const fileName = path.basename(file.name, path.extname(file.name)).toLowerCase()
				if (fileName.includes('normal')) textureUrls.normal = fileS3Url
				else if (fileName.includes('base')) textureUrls.baseColor = fileS3Url
				else if (fileName.includes('displace')) textureUrls.displacement = fileS3Url
				else if (fileName.includes('rough')) textureUrls.roughness = fileS3Url
				else if (fileName.includes('alpha')) textureUrls.alpha = fileS3Url

				if (shouldTransferTexture) console.log(`     ✅ Uploaded texture ${file.name}`)
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

		if (!categoryMaterialAssignments.has(categoryName)) categoryMaterialAssignments.set(categoryName, new Set())

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
		if (!rootMaterial._id) rootMaterial._id = uuidv4()

		const fabricId = rootMaterial._id

		console.log(`      ✅ Mesh "${meshName}" -> Material "${materialLabel}" (fabricId: ${fabricId})`)

		const sanitizedMeshName = THREE.PropertyBinding.sanitizeNodeName(meshName)

		// Group meshes by materialId
		if (!materialToMeshes.has(fabricId)) materialToMeshes.set(fabricId, {meshes: [], materialLabel})

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
	if (materialsFolder) await scanCategoryMaterials(materialsFolder, categoryName)
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
					`    📊 Before adding "${categoryName}": templateCategories = ${Array.from(
						rootMaterials.get(materialKey)!.templateCategories,
					)}`,
				)
				rootMaterials.get(materialKey)!.templateCategories.add(categoryName)
				console.log(
					`    📊 After adding "${categoryName}": templateCategories = ${Array.from(
						rootMaterials.get(materialKey)!.templateCategories,
					)}`,
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

		if (COLLECTION_PARENT_FOLDER_IDS.length === 0) {
			console.log(
				'⚠️  No collection parent folders configured. Set COLLECTION_PARENT_FOLDER_IDS to a comma-separated list of Google Drive parent folder IDs.',
			)
			return
		}

		const collectionConfigs = await buildCollectionConfigsFromParentFolders(COLLECTION_PARENT_FOLDER_IDS)
		if (collectionConfigs.length === 0) {
			console.log('⚠️  No collection folders found under the configured parent folders.')
			return
		}

		console.log(
			`🏷️  Processing ${collectionConfigs.length} collections: ${collectionConfigs.map(c => c.collection).join(', ')}`,
		)

		// Initialize combined data structures
		const allTemplates: TODO = {}
		const allBlocks: TODO = {}
		const allCombinedFabrics: TODO = {}
		const allUnsucceeded: TODO[] = []

		// Process each collection
		for (const collectionConfig of collectionConfigs) {
			const {collection, rootFolderId, gender = 'female'} = collectionConfig
			console.log(`\n🏢 Processing collection: ${collection}`)
			console.log(`🗂️  Root folder ID: ${rootFolderId}`)
			const collectionUploadTracker: CollectionUploadTracker = {hasUploadedContent: false}

			// Reset data for this collection
			rootMaterials.clear()
			categoryMaterialAssignments.clear()

			// Get root contents (categories + root Materials folder)
			const rootContents = await fetchFolderContents(rootFolderId)
			console.log(`📁 Found ${rootContents} root contents`)
			const categoryFolders = rootContents.filter(
				item => item.mimeType === 'application/vnd.google-apps.folder' && normalizeName(item.name) !== 'Materials',
			)
			const rootMaterialsFolder = rootContents.find(
				item => item.mimeType === 'application/vnd.google-apps.folder' && normalizeName(item.name) === 'Materials',
			)

			console.log(`📁 Found ${categoryFolders.length} category folders`)

			// Step 1: Process root Materials folder
			if (rootMaterialsFolder) await processRootMaterials(rootMaterialsFolder, collection, collectionUploadTracker)
			else console.warn(`⚠️  No root Materials folder found for collection ${collection}`)

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
				if (categoryMaterialsFolder) await processCategoryMaterialsFolder(categoryMaterialsFolder, categoryFolder.name)

				// Step 2b: Process each template in this category
				for (const templateFolder of templateFolders) {
					const processedTemplate = await processTemplateFolder(
						templateFolder,
						categoryFolder.name,
						collection,
						gender,
						collectionUploadTracker,
					)
					if (processedTemplate.template) collectionProcessedData.push(processedTemplate)

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
			if (collectionUploadTracker.hasUploadedContent) {
				Object.assign(allTemplates, collectionTemplates)
				Object.assign(allBlocks, collectionBlocks)
				Object.assign(allCombinedFabrics, collectionFabricsData)
				console.log(`✅ Completed processing collection: ${collection}`)
			} else console.log(`⏭️  Skipping generated output for collection ${collection} because no assets were uploaded`)
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
		collectionConfigs.forEach(({collection}) => {
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
