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
		folderId: '1CSBAMYBPyBjfjCbmO6xncnQKBm-Y8MxU',
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

// Download assets for a collection
async function downloadAssets(collectionName: string, pairs: TODO[]): Promise<TODO[]> {
	const downloads: TODO[] = []

	for (const {gltf, png, baseName} of pairs) {
		// Download PNG to images/${collectionName}
		const pngPath = path.join(__dirname, `../../public/images/${collectionName}/${baseName}.png`)
		const pngUrl = getDriveDownloadUrl(png.id)

		// Download GLTF to models/${collectionName}
		const gltfPath = path.join(__dirname, `../../public/models/${collectionName}/${baseName}.gltf`)
		const gltfUrl = getDriveDownloadUrl(gltf.id)

		console.log(`📥 Downloading ${baseName}...`)

		try {
			await Promise.all([downloadFile(pngUrl, pngPath), downloadFile(gltfUrl, gltfPath)])
			console.log(`✅ Downloaded ${baseName}`)
			downloads.push({baseName: baseName, collectionName})
		} catch (error) {
			console.error(`❌ Failed to download ${baseName}:`, (error as TODO).message)
		}
	}

	return downloads
}

function generateTemplateData(downloadedAssets: TODO): TODO {
	const templates: TODO = {}
	let idCounter = 1

	// Flatten the object structure to get all assets as an array
	const allAssets: TODO[] = Object.values(downloadedAssets).flat()

	allAssets.forEach(({baseName, collectionName}: TODO) => {
		templates[collectionName] = templates[collectionName] || []
		templates[collectionName].push({
			_id: idCounter.toString(),
			thumb: `new URL('../images/${collectionName}/${baseName}.png', import.meta.url).href`,
			modelFile: `new URL('../models/${collectionName}/${baseName}.gltf', import.meta.url).href`,
			name: baseName,
			avatar: 'Male',
		})
		idCounter++
	})

	return templates
}

function generateTemplatesFileContent(templates: TODO): string {
	const finalTemplatesContent: TODO = {}
	for (const collectionName in templates) {
		const templatesArray = templates[collectionName]
		finalTemplatesContent[collectionName] = templatesArray
			.map(
				(template: TODO) => `	{
		_id: '${template._id}',
		thumb: ${template.thumb},
		modelFile: ${template.modelFile},
		name: '${template.name}',
		avatar: '${template.avatar}',
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

async function updateTemplatesFile(content: string): Promise<void> {
	const templatesPath = path.join(__dirname, '../../public/consts/templates.ts')
	fs.writeFileSync(templatesPath, content, 'utf8')
	console.log('✅ templates.ts updated successfully')
}

async function main(): Promise<void> {
	try {
		console.log('🚀 Fetching templates from Google Drive...')

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

			// Get folder contents (direct files, no category folders for templates)
			const folderContents = await fetchFolderContents(collection.folderId)
			const files = folderContents.filter(item => item.mimeType !== 'application/vnd.google-apps.folder')
			const pairs = matchGltfPngPairs(files)

			console.log(`   Found ${pairs.length} matching GLTF/PNG pairs`)

			if (pairs.length > 0) {
				console.log(`📥 Downloading templates for ${collection.name}...`)
				const downloads = await downloadAssets(collection.name, pairs)
				if (!allDownloadedAssets[collection.name]) {
					allDownloadedAssets[collection.name] = []
				}
				allDownloadedAssets[collection.name].push(...downloads)
			}
		}

		// Generate templates data
		const templates = generateTemplateData(allDownloadedAssets)
		console.log(`📊 Generated templates for ${Object.keys(templates).length} collections`)

		// Generate and write the templates.ts file
		const fileContent = generateTemplatesFileContent(templates)
		await updateTemplatesFile(fileContent)

		console.log('🎉 Script completed successfully!')
		console.log('\n📋 Summary:')

		// Group downloads by collection for summary
		Object.entries(allDownloadedAssets).forEach(([collectionName, downloadsArray]: [string, TODO]) => {
			console.log(`\n📦 Collection: ${collectionName}`)
			console.log(`   Templates: ${downloadsArray.length} items downloaded`)
		})

		console.log(`\n📁 Assets organized by collection:`)
		Object.keys(allDownloadedAssets).forEach((collectionName: string) => {
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
