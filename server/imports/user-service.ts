import {check} from 'meteor/check'
import {Meteor} from 'meteor/meteor'

Meteor.methods({
	async 'users.updateProfile'(profileData: {username: string; dateOfBirth: string}) {
		// Validate user is logged in
		if (!this.userId) {
			throw new Meteor.Error('not-authorized', 'You must be logged in to update your profile')
		}

		// Validate input data
		check(profileData, {
			username: String,
			dateOfBirth: String,
		})

		const {username, dateOfBirth} = profileData

		// Check if username is already taken by another user
		const existingUser = await Meteor.users.findOneAsync({
			'profile.username': username,
			_id: {$ne: this.userId},
		})

		if (existingUser) {
			throw new Meteor.Error('username-taken', 'This username is already taken')
		}

		// Update user profile
		await Meteor.users.updateAsync(this.userId, {
			$set: {
				'profile.username': username,
				'profile.dateOfBirth': dateOfBirth,
			},
		})

		return {success: true}
	},
})
