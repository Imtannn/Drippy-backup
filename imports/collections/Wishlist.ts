import {Meteor} from 'meteor/meteor'
import {Mongo} from 'meteor/mongo'
import {check} from 'meteor/check'

export interface Wishlist {
	_id: string
	userId: string
	templateId: string
	createdAt: Date
}

export const Wishlist = new Mongo.Collection<Wishlist>('Wishlist')

if (Meteor.isServer) {
	// Publish wishlist items for the current user
	Meteor.publish('wishlist', async function () {
		if (!this.userId) return this.ready()

		return Wishlist.find({userId: this.userId})
	})

	Meteor.methods({
		/**
		 * Add a template to user's wishlist
		 */
		async 'wishlist.add'(templateId: string) {
			if (!this.userId) throw new Meteor.Error('not-authorized', 'You must be logged in to add to wishlist')

			check(templateId, String)

			// Check if already in wishlist
			const existing = await Wishlist.findOneAsync({userId: this.userId, templateId})
			if (existing) {
				return {success: true, message: 'Template already in wishlist'}
			}

			await Wishlist.insertAsync({
				userId: this.userId,
				templateId,
				createdAt: new Date(),
			})

			return {success: true}
		},

		/**
		 * Remove a template from user's wishlist
		 */
		async 'wishlist.remove'(templateId: string) {
			if (!this.userId) throw new Meteor.Error('not-authorized', 'You must be logged in to remove from wishlist')

			check(templateId, String)

			const result = await Wishlist.removeAsync({userId: this.userId, templateId})

			return {success: true, removed: result > 0}
		},

		/**
		 * Toggle a template in user's wishlist (add if not exists, remove if exists)
		 */
		async 'wishlist.toggle'(templateId: string) {
			if (!this.userId) throw new Meteor.Error('not-authorized', 'You must be logged in to toggle wishlist')

			check(templateId, String)

			const existing = await Wishlist.findOneAsync({userId: this.userId, templateId})

			if (existing) {
				await Wishlist.removeAsync({userId: this.userId, templateId})
				return {success: true, isInWishlist: false}
			} else {
				await Wishlist.insertAsync({
					userId: this.userId,
					templateId,
					createdAt: new Date(),
				})
				return {success: true, isInWishlist: true}
			}
		},
	})
} else {
	// Client-side: subscribe to wishlist
	Meteor.subscribe('wishlist')
}

