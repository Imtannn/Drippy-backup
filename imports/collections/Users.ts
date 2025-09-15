import {Meteor} from 'meteor/meteor'
import {check} from 'meteor/check'

// Define what we will store in user.profile.
declare module 'meteor/meteor' {
	namespace Meteor {
		/**
		 * This adds custom fields in user.profile. See the Meteor.User type for
		 * existing fields that Meteor already has.
		 */
		interface UserProfile {
			// Custom
			isAdmin?: boolean
			dateOfBirth?: string

			// Meteor's 3rd party login services (e.g. Google, Facebook, etc)
			// will put stuff in profile too.
			name?: string
			// ...add other fields from 3rd party services if needed...
		}

		interface UserServices {
			google?: {
				email: string
				// ...add other fields from Google auth if needed...
			}
			// ...add other services if needed...
		}
	}
}

if (Meteor.isServer) {
	Meteor.methods({
		async 'users.updateUsername'(username: string) {
			if (!this.userId) throw new Meteor.Error('not-authorized', 'You must be logged in to update your username')

			check(username, String)

			// username validation
			// Alphanumeric, underscores, and dashes allowed, and must start with a letter.
			if (!/^[a-zA-Z][a-zA-Z0-9_\-]*$/.test(username)) {
				throw new Meteor.Error(
					'invalid-username',
					'Username can only contain letters, numbers, underscores, and dashes, and must start with a letter.',
				)
			}

			// length validation
			if (!username || username.length < 3 || username.length > 40)
				throw new Meteor.Error('invalid-username', 'Username must be between 3 and 40 characters long.')

			// Check if username is already taken by another user
			// TODO surface this error in the UI.
			const existingUser = await Meteor.users.findOneAsync({'profile.username': username, _id: {$ne: this.userId}})
			if (existingUser) throw new Meteor.Error('username-taken', 'This username is already taken')

			await Meteor.users.updateAsync(this.userId, {$set: {username}})
		},

		async 'users.updateProfile'(profileData: Meteor.UserProfile & {username: string}) {
			if (!this.userId) throw new Meteor.Error('not-authorized', 'You must be logged in to update your profile')

			check(profileData, {username: String, dateOfBirth: String})

			const {username, ...profile} = profileData

			if ('isAdmin' in profile) {
				// Prevent users from setting isAdmin field, for now.
				throw new Meteor.Error('invalid-profile', 'Cannot set isAdmin field')
			}

			await Meteor.callAsync('users.updateUsername', username)
			const user = (await Meteor.userAsync())! // user exists because this.userId exists
			await Meteor.users.updateAsync(this.userId, {$set: {profile: {...user.profile, ...profile}}})
		},
	})

	Meteor.publish('usersCount', async function () {
		// If not admin, don't publish the count.
		const user = await Meteor.userAsync()
		const isAdmin = !!user?.profile?.isAdmin
		if (!isAdmin) return this.ready()

		Counts.publish(this, 'users', Meteor.users.find())
	})
} else {
	Meteor.subscribe('usersCount')
}
