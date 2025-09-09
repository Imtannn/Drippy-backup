import {Meteor} from 'meteor/meteor'
import {ServiceConfiguration} from 'meteor/service-configuration'

// Configure OAuth services after environment is loaded
Meteor.startup(async () => {
	if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
		await ServiceConfiguration.configurations.upsertAsync(
			{service: 'google'},
			{
				$set: {
					clientId: process.env.GOOGLE_CLIENT_ID,
					secret: process.env.GOOGLE_CLIENT_SECRET,
					loginStyle: 'redirect',
				},
			},
		)
	}

	if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
		await ServiceConfiguration.configurations.upsertAsync(
			{service: 'facebook'},
			{
				$set: {
					appId: process.env.FACEBOOK_APP_ID,
					secret: process.env.FACEBOOK_APP_SECRET,
					loginStyle: 'redirect',
				},
			},
		)
	}
})
