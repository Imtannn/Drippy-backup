#!/usr/bin/env node

import * as fs from 'fs'
import * as path from 'path'
import * as https from 'https'

type TODO = any

// Google Drive API Key (you can get this from Google Cloud Console for free)
const API_KEY = process.env.GOOGLE_API_KEY || 'GOOGLE_API_KEY'

const COLLECTIONS = [
	{
		name: 'speed',
		folderId: '1KEoQ9MLJRFsPWdOJJCvb_hYub5gSqlqx',
	},
]

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

// Helper function to download files
function downloadFile(url: string, outputPath: string): Promise<TODO> {
	return new Promise((resolve, reject) => {
		// Ensure directory exists
		const dir = path.dirname(outputPath)
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, {recursive: true})
		}

		const file = fs.createWriteStream(outputPath)

		https
			.get(url, response => {
				// Handle redirects
				if (response.statusCode === 302 || response.statusCode === 301 || response.statusCode === 303) {
					const location = response.headers.location
					if (!location) {
						reject(new Error('Redirect location not provided'))
						return
					}
					return downloadFile(location, outputPath).then(resolve).catch(reject)
				}

				if (response.statusCode !== 200) {
					reject(new Error(`Download failed with status ${response.statusCode}`))
					return
				}

				response.pipe(file)

				file.on('finish', () => {
					file.close()
					resolve(outputPath)
				})

				file.on('error', err => {
					fs.unlink(outputPath, () => {}) // Delete the file on error
					reject(err)
				})
			})
			.on('error', reject)
	})
}

// Get Google Drive download URL for a file
function getDriveDownloadUrl(fileId: string): string {
	return `https://drive.google.com/uc?export=download&id=${fileId}`
}

async function fetchFolderContents(folderId: string): Promise<TODO[]> {
	try {
		const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType,parents)&key=${API_KEY}`
		const response = await makeRequest<{files: TODO[]}>(url)
		console.log('response', response)
		return response.files || []
	} catch (error) {
		console.error('Error fetching folder contents:', error)
		return []
	}
}

async function fetchSubfolderContents(subfolderId: string): Promise<TODO[]> {
	try {
		const url = `https://www.googleapis.com/drive/v3/files?q='${subfolderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType)&key=${API_KEY}`
		const response = await makeRequest<{files: TODO[]}>(url)
		return response.files || []
	} catch (error) {
		console.error('Error fetching subfolder contents:', error)
		return []
	}
}

function matchGltfPngPairs(files: TODO[]): TODO[] {
	const pairs: TODO[] = []
	const gltfFiles = files.filter((f: TODO) => f.name.toLowerCase().endsWith('.gltf'))
	const pngFiles = files.filter((f: TODO) => f.name.toLowerCase().endsWith('.png'))

	gltfFiles.forEach((gltfFile: TODO) => {
		const baseName = path.basename(gltfFile.name, '.gltf')
		const matchingPng = pngFiles.find((png: TODO) => path.basename(png.name, '.png') === baseName)

		if (matchingPng) {
			pairs.push({
				gltf: gltfFile,
				png: matchingPng,
				baseName,
			})
		}
	})

	return pairs
}

// Download assets for a category
async function downloadAssets(collectionName: string, category: string, pairs: TODO[]): Promise<TODO[]> {
	const downloads: TODO[] = []

	for (const {gltf, png, baseName} of pairs) {
		// Download PNG to images/${collectionName}
		const pngPath = path.join(__dirname, `../public/images/${collectionName}/${baseName}.png`)
		const pngUrl = getDriveDownloadUrl(png.id)

		// Download GLTF to models/${collectionName}
		const gltfPath = path.join(__dirname, `../public/models/${collectionName}/${baseName}.gltf`)
		const gltfUrl = getDriveDownloadUrl(gltf.id)

		console.log(`📥 Downloading ${baseName}...`)

		try {
			await Promise.all([downloadFile(pngUrl, pngPath), downloadFile(gltfUrl, gltfPath)])
			console.log(`✅ Downloaded ${baseName}`)
			downloads.push({baseName: baseName, category, collectionName})
		} catch (error) {
			console.error(`❌ Failed to download ${baseName}:`, (error as TODO).message)
		}
	}

	return downloads
}

function generateBlockData(downloadedAssets: TODO): TODO {
	const blocks: TODO = {}
	let idCounter = 1

	// Flatten the object structure to get all assets as an array
	const allAssets: TODO[] = Object.values(downloadedAssets).flat()

	allAssets.forEach(({baseName, category, collectionName}: TODO) => {
		blocks[collectionName] = blocks[collectionName] || []
		blocks[collectionName].push({
			_id: idCounter.toString(),
			thumb: `new URL('../images/${collectionName}/${baseName}.png', import.meta.url).href`,
			modelFile: `new URL('../models/${collectionName}/${baseName}.gltf', import.meta.url).href`,
			blockName: baseName,
			avatar: 'Male',
			category: category,
		})
		idCounter++
	})

	return blocks
}

function generateBlocksFileContent(blocks: TODO): string {
	const finalBlocksContent: TODO = {}
	for (const collectionName in blocks) {
		const blocksArray = blocks[collectionName]
		finalBlocksContent[collectionName] = blocksArray
			.map(
				(block: TODO) => `	{
		_id: '${block._id}',
		thumb: ${block.thumb},
		modelFile: ${block.modelFile},
		blockName: '${block.blockName}',
		avatar: '${block.avatar}',
		category: '${block.category}',
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

async function updateBlocksFile(content: string): Promise<void> {
	const blocksPath = path.join(__dirname, '../public/consts/blocks.ts')
	fs.writeFileSync(blocksPath, content, 'utf8')
	console.log('✅ blocks.ts updated successfully')
}

function normalizeName(name: string): string {
	// Remove _ characters in name and trim all spaces
	return name.replace(/_/g, ' ').trim()
}

async function main(): Promise<void> {
	try {
		console.log('🚀 Fetching data from Google Drive...')

		if (API_KEY === 'GOOGLE_API_KEY') {
			console.log('⚠️  No API key provided. Set GOOGLE_API_KEY environment variable.')
			console.log('   You can get a free API key from Google Cloud Console.')
			return
		}

		const allDownloadedAssets: TODO = {}

		// Process each collection
		for (const collection of COLLECTIONS) {
			console.log(`\n🗂️  Processing collection: ${collection.name}`)
			console.log(`📁 Folder ID: ${collection.folderId}`)

			// Get main folder contents (should be category folders)
			const mainFolderContents = await fetchFolderContents(collection.folderId)
			const categoryFolders = mainFolderContents.filter(item => item.mimeType === 'application/vnd.google-apps.folder')

			console.log(`📁 Found ${categoryFolders.length} category folders`)

			for (const categoryFolder of categoryFolders) {
				console.log(`📂 Processing category: ${categoryFolder.name}`)

				const subfolderContents = await fetchSubfolderContents(categoryFolder.id)
				const pairs = matchGltfPngPairs(subfolderContents)

				console.log(`   Found ${pairs.length} matching GLTF/PNG pairs`)

				if (pairs.length > 0) {
					console.log(`📥 Downloading assets for ${categoryFolder.name}...`)
					const downloads = await downloadAssets(collection.name, normalizeName(categoryFolder.name), pairs)
					if (!allDownloadedAssets[collection.name]) {
						allDownloadedAssets[collection.name] = []
					}
					allDownloadedAssets[collection.name].push(...downloads)
				}
			}
		}

		// Generate blocks data
		const blocks = generateBlockData(allDownloadedAssets)
		console.log(`📊 Generated blocks for ${Object.keys(blocks).length} collections`)

		// Generate and write the blocks.ts file
		const fileContent = generateBlocksFileContent(blocks)
		await updateBlocksFile(fileContent)

		console.log('🎉 Script completed successfully!')
		console.log('\n📋 Summary:')

		// Group downloads by collection and category for summary
		const collectionSummary: TODO = {}
		Object.entries(allDownloadedAssets).forEach(([collectionName, downloadsArray]: [string, TODO]) => {
			if (!collectionSummary[collectionName]) {
				collectionSummary[collectionName] = {}
			}
			downloadsArray.forEach((download: TODO) => {
				collectionSummary[collectionName][download.category] =
					(collectionSummary[collectionName][download.category] || 0) + 1
			})
		})

		Object.entries(collectionSummary).forEach(([collectionName, categories]: [string, TODO]) => {
			console.log(`\n📦 Collection: ${collectionName}`)
			Object.entries(categories).forEach(([category, count]: [string, TODO]) => {
				console.log(`   ${category}: ${count} items downloaded`)
			})
		})

		console.log(`\n📁 Assets organized by collection:`)
		Object.keys(collectionSummary).forEach((collectionName: string) => {
			console.log(`   Images: public/images/${collectionName}/`)
			console.log(`   Models: public/models/${collectionName}/`)
		})
		console.log('🎉 Script completed successfully!')
		process.exit(0)
	} catch (error) {
		console.error('❌ Script failed:', error)
		process.exit(1)
	}
}

if (require.main === module) {
	main()
}

module.exports = {main}
