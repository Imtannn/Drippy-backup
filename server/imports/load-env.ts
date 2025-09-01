import {Meteor} from 'meteor/meteor'
// Assets is a global in Meteor server environment
declare const Assets: {
	getTextAsync(path: string): Promise<string>
	getBinary(path: string): Buffer
}

/**
 * Load environment configuration from private/env.json file
 * This runs on server startup and sets process.env variables
 */
Meteor.startup(async () => {
	try {
		let config: Record<string, string> = {}

		try {
			const configText = await Assets.getTextAsync('env.json')
			config = JSON.parse(configText)
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error)
			console.error('Could not load private/env.json:', errorMessage)
			console.log('Please create private/env.json with your configuration')
			return
		}

		// Set environment variables
		Object.keys(config).forEach(key => {
			if (key.startsWith('_')) return // Skip comments

			if (!process.env[key]) {
				process.env[key] = config[key]
			}
		})
	} catch (error) {
		console.error('Failed to load environment configuration:', error)
	}
})

// Helper function to get config values with fallbacks
export function getEnvConfig(key: string, fallback?: string): string {
	return process.env[key] || fallback || ''
}

// Validate required configuration
Meteor.startup(() => {
	const requiredVars = ['SENDGRID_API_KEY', 'SENDGRID_FROM_EMAIL', 'MAIL_URL']
	const missingVars = requiredVars.filter(varName => !process.env[varName])

	if (missingVars.length > 0) {
		console.warn('Missing required environment variables:', missingVars)
	}
})
