// This file is used in the importmap to export the Meteor global APIs from "meteor/*" packages.
// See the importmap in public/index.html.
const global = globalThis as typeof globalThis & {
	Meteor: unknown
	Package: {
		tracker: {Tracker: unknown}
		mongo: {Mongo: unknown}
		session: {Session: unknown}
		'reactive-var': {ReactiveVar: unknown}
		blaze: {Blaze: unknown}
		templating: {Template: unknown}
		'accounts-base': {Accounts: unknown}
		check: {check: unknown; Match: unknown}
	}
}
export const Meteor = global.Meteor
export const Tracker = global.Package.tracker.Tracker
export const Mongo = global.Package.mongo.Mongo
export const Session = global.Package.session.Session
export const ReactiveVar = global.Package['reactive-var'].ReactiveVar
export const Blaze = global.Package.blaze.Blaze
export const Template = global.Package.templating.Template
export const Accounts = global.Package['accounts-base'].Accounts
export const check = global.Package.check.check
export const Match = global.Package.check.Match
