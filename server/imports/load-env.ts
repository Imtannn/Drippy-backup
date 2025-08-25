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
		// Try to load from private/env.json first
		let config: Record<string, string> = {}

		try {
			const configText = await Assets.getTextAsync('env.example.json')
			config = JSON.parse(configText)
			console.log('📁 Loaded configuration from private/env.json')
		} catch (error) {
			// Fallback to default config if env.json doesn't exist
			config = {
				SENDGRID_API_KEY: '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',
				SENDGRID_FROM_EMAIL: 'team@drippy3d.com',
				MAIL_URL:
					'smtp://apikey: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@smtp.sendgrid.net:587',
				APP_URL: Meteor.isDevelopment ? 'http://localhost:3000' : 'https://drippy3d.com',
				COMMUNITY_URL: Meteor.isDevelopment ? 'http://localhost:3000/community' : 'https://drippy3d.com/community',
				PREFERENCES_URL: Meteor.isDevelopment
					? 'http://localhost:3000/preferences'
					: 'https://drippy3d.com/preferences',
			}
			console.log('⚙️  Using default configuration (create private/env.json to customize)')
		}

		// Set environment variables
		Object.keys(config).forEach(key => {
			if (key.startsWith('_')) return // Skip comments

			if (!process.env[key]) {
				process.env[key] = config[key]
				console.log(`✅ Set ${key}`)
			} else {
				console.log(`⚠️  Environment variable ${key} already set, skipping`)
			}
		})

		console.log('🎯 Server environment configuration loaded successfully')
	} catch (error) {
		console.error('❌ Failed to load environment configuration:', error)
		console.log('💡 Make sure private/env.json exists and is valid JSON')
	}
})

// Helper function to get config values with fallbacks
export function getEnvConfig(key: string, fallback?: string): string {
	return process.env[key] || fallback || ''
}

// Validate required configuration
Meteor.startup(() => {
	const requiredVars = ['SENDGRID_FROM_EMAIL']
	const missingVars = requiredVars.filter(varName => !process.env[varName])

	if (missingVars.length > 0) {
		console.warn('⚠️  Missing required environment variables:', missingVars)
		console.log('💡 Set them in private/env.ts or as environment variables')
	}
})
