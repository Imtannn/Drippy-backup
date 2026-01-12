import {Meteor} from 'meteor/meteor'
import {Mongo} from 'meteor/mongo'

export interface Visit {
	origin: string
	route: string // The route is the path of the URL, e.g. '/foo/bar'
	visits: number
}

export const Visits = new Mongo.Collection<Visit>('Visits')

if (Meteor.isServer) {
	Meteor.publish('Visits', async () => {
		const user = await Meteor.userAsync()
		const isAdmin = !!user?.profile?.isAdmin

		if (isAdmin) return Visits.find({})
		return []
	})

	Meteor.methods({
		async 'visits.increment'(href: string) {
			const url = new URL(href)
			const hrefMinusOrigin = url.href.replace(url.origin, '')
			const origin = url.origin
			await Visits.upsertAsync({origin, route: hrefMinusOrigin}, {$inc: {visits: 1}})
		},
	})
} else Meteor.subscribe('Visits')
