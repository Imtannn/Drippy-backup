// Global augmentations for official meteor APIs or 3rd-party Meteor packages.

declare module 'meteor/session' {
	namespace Session {
		// This is added by ferjep:persistent-session
		function setPersistent(key: string, value: string | object): void
	}
}

type CountName = 'users'

// akyma:publish-counts
const Counts: {
	publish(
		context: import('meteor/meteor').Subscription,
		name: CountName,
		cursor: import('meteor/mongo').Mongo.Cursor<unknown>,
		options?: {
			noReady?: boolean
			nonReactive?: boolean
			countFromField?: string
			countFromFieldLength?: number
			noWarnings?: boolean
		},
	): void

	get(name: CountName): number
}
