import {Meteor} from 'meteor/meteor'
import {getEnvConfig} from './load-env.js'

import {DeleteObjectCommand, S3Client} from '@aws-sdk/client-s3'
import {Upload} from '@aws-sdk/lib-storage' // For multipart upload support like v2 upload()

/**
 * Upload to S3 and return the public URL
 */

// Configure AWS S3
const S3_BUCKET = getEnvConfig('S3_BUCKET', 'drippy-3d-app')
const S3_REGION = getEnvConfig('S3_REGION', 'eu-west-3')
const S3_ACCESS_KEY = getEnvConfig('AWS_ACCESS_KEY_ID')
const S3_SECRET_KEY = getEnvConfig('AWS_SECRET_ACCESS_KEY')

const s3Client = new S3Client({
	region: S3_REGION,
	credentials: {
		accessKeyId: S3_ACCESS_KEY,
		secretAccessKey: S3_SECRET_KEY,
	},
})

// backwards-compatible API wrapper
// TODO we will replace this with cloudflare's API.
const s3 = {
	upload: (params: any) => {
		// AWS SDK v2 upload supports multipart uploads and progress events.
		// In v3, use @aws-sdk/lib-storage Upload class for similar functionality.
		const upload = new Upload({client: s3Client, params})

		return {
			promise: () => upload.done(), // returns a Promise resolving when upload completes
		}
	},

	deleteObject: (params: any) => {
		const command = new DeleteObjectCommand(params)
		return {promise: () => s3Client.send(command)}
	},
}

interface UploadFileData {
	fileName: string
	fileData: string // Base64 encoded file data
	contentType: string
	folder?: string // Optional folder path in S3
}

interface UploadResult {
	fileName: string
	url: string
	success: boolean
	error?: string
}

/**
 * Upload a single file to S3
 */
async function uploadFileToS3(fileData: UploadFileData): Promise<UploadResult> {
	try {
		// Validate required fields with specific error messages
		if (!fileData.fileName || fileData.fileName.trim() === '') throw new Error('Missing or empty fileName')

		if (!fileData.fileData || fileData.fileData.trim() === '')
			throw new Error('Missing or empty fileData (base64 content)')

		if (!fileData.contentType || fileData.contentType.trim() === '')
			throw new Error('Missing or empty contentType (MIME type)')

		// Validate base64 data format
		try {
			// Test if the base64 string is valid
			const buffer = Buffer.from(fileData.fileData, 'base64')

			// Check if buffer has reasonable size (not empty)
			if (buffer.length === 0) throw new Error('Base64 data decoded to empty buffer')
		} catch (error) {
			throw new Error(`Invalid base64 data: ${error instanceof Error ? error.message : 'Unknown error'}`)
		}

		// Convert base64 to buffer
		const buffer = Buffer.from(fileData.fileData, 'base64')

		// Generate S3 key with timestamp to avoid conflicts
		const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
		const folder = fileData.folder ? `${fileData.folder}/` : 'uploads/'
		const key = `${folder}${timestamp}-${fileData.fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`

		const params = {
			Bucket: S3_BUCKET,
			Key: key,
			Body: buffer,
			ContentType: fileData.contentType,
			ACL: 'public-read',
		}

		const result = await s3.upload(params).promise()

		return {
			fileName: fileData.fileName,
			url: result.Location!,
			success: true,
		}
	} catch (error) {
		console.error('Error uploading file to S3:', error)
		return {
			fileName: fileData.fileName,
			url: '',
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred',
		}
	}
}

// Meteor Methods
Meteor.methods({
	/**
	 * Upload a single file to S3
	 */
	async 'files.upload'(fileData: UploadFileData): Promise<UploadResult> {
		try {
			const result = await uploadFileToS3(fileData)

			if (!result.success) throw new Meteor.Error('upload-failed', result.error || 'Failed to upload file')

			return result
		} catch (error) {
			if (error instanceof Meteor.Error) throw error

			console.error('Unexpected error in files.upload:', error)
			throw new Meteor.Error('upload-error', 'An unexpected error occurred during upload')
		}
	},

	/**
	 * Upload multiple files to S3
	 */
	async 'files.uploadMultiple'(filesData: UploadFileData[]): Promise<UploadResult[]> {
		// Validate input
		if (!Array.isArray(filesData) || filesData.length === 0)
			throw new Meteor.Error('validation-error', 'Files data must be a non-empty array')

		// Limit number of files to prevent abuse
		if (filesData.length > 10) throw new Meteor.Error('validation-error', 'Cannot upload more than 10 files at once')

		try {
			// Upload all files in parallel
			const uploadPromises = filesData.map(fileData => uploadFileToS3(fileData))
			const results = await Promise.all(uploadPromises)

			return results
		} catch (error) {
			console.error('Unexpected error in files.uploadMultiple:', error)
			throw new Meteor.Error('upload-error', 'An unexpected error occurred during multiple file upload')
		}
	},

	/**
	 * Delete a file from S3 (optional cleanup method)
	 */
	async 'files.delete'(fileUrl: string): Promise<boolean> {
		// Validate AWS configuration
		if (!S3_ACCESS_KEY || !S3_SECRET_KEY)
			throw new Meteor.Error('aws-config-error', 'AWS credentials are not configured')

		if (!fileUrl || typeof fileUrl !== 'string') throw new Meteor.Error('validation-error', 'File URL is required')

		try {
			// Extract the S3 key from the URL
			const urlParts = fileUrl.split('/')
			const bucketIndex = urlParts.findIndex(part => part === S3_BUCKET)

			if (bucketIndex === -1 || bucketIndex === urlParts.length - 1)
				throw new Meteor.Error('validation-error', 'Invalid S3 URL format')

			const key = urlParts.slice(bucketIndex + 1).join('/')

			const params = {
				Bucket: S3_BUCKET,
				Key: key,
			}

			await s3.deleteObject(params).promise()
			return true
		} catch (error) {
			console.error('Error deleting file from S3:', error)
			if (error instanceof Meteor.Error) throw error

			throw new Meteor.Error('delete-error', 'Failed to delete file from S3')
		}
	},
})
