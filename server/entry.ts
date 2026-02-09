import * as fs from 'fs'
import type {ServerResponse} from 'http'
import {Accounts} from 'meteor/accounts-base'
import {Meteor} from 'meteor/meteor'
import {WebApp} from 'meteor/webapp'
import * as path from 'path'
import '../imports/collections/index.js'
import {Visits, type Visit} from '../imports/collections/Visits.js'
import './imports/email-service.js'
import './imports/load-env.js'
import './imports/oauth-config.js'
import './imports/order-service.js'
import './imports/upload-service.js'

WebApp.addHtmlAttributeHook(() => ({lang: 'en', prefix: 'og: http://ogp.me/ns#'}))

// TODO update this with the primary app domain name. This should be the domain
// under which the Meteor app is served.
const primaryTLD = 'drippy3d.com'

const appOrigin = (sub?: string, TLD = primaryTLD) => `https://${sub ? sub + '.' : ''}${TLD}`

const localhost = (port: string | number) => [
	`http://localhost:${port}`,
	`http://127.0.0.1:${port}`,
	`http://0.0.0.0:${port}`,
]

// Origins that are allowed to access the app domain (CORS). Only authorized
// domains will be able to fetch certain assets or authenticate using the app
// domain via iframe.
const remoteOrigins = [
	appOrigin(),
	appOrigin('drippy', 'meteorapp.com'),

	appOrigin('test'),
	appOrigin('drippy-test', 'meteorapp.com'),

	appOrigin('dev'),
	appOrigin('drippy-dev', 'meteorapp.com'),
]
// List multiple localhost origins to test multiple apps authenticating with the main app locally.
const localhostOrigins = [...localhost(3000), ...localhost(4000)]
const allowedOrigins = [...remoteOrigins, ...localhostOrigins]

// Allow only certain domains to access content from the server (for example
// domains that we have not authorized will not be able to authenticate using
// the app domain via iframe).
WebApp.rawHandlers.use(
	/*'/public',*/
	async function (req, res, next) {
		///////////////////////////////////////////////////////////////////////////
		// Cross-origin handling to disallow foreign origins from embedding our
		// app, hence forbidding them from using an iframe to get a user's auth
		// credentials, and to disallow them opening our app with window.open()
		// and accessing our window global APIs.

		// Allow embedding third-party assets, but ignore their cookies so
		// they don't track our users. Required for cross-origin isolation.
		const userAgent = req.headers['user-agent']?.toLowerCase()
		const isFirefox = userAgent?.includes('firefox')
		const isSafari = userAgent?.includes('safari') && userAgent.includes('chrome')
		// At time of writing Firefox and Safari don't fully support the credentialless value yet.
		res.setHeader('Cross-Origin-Embedder-Policy', isFirefox || isSafari ? 'require-corp' : 'credentialless')

		// Allow only our origins to access `window.*` APIs when we open our
		// own pages with `window.open('<url-to-our-site>')`. Any other
		// sites that open our site will not be able to access the global
		// context.
		//
		// This, paired with Cross-Origin-Embedder-Policy:credentialless,
		// enables cross-origin isolation, which allows cool features like
		// `SharedArrayBuffer` for shared memory across workers. We do not need
		// to use 'same-origin-allow-popups' because we don't open new oauth
		// windows, instead we redirect to separate oauth pages that return
		// users back to our site after login (f.e. after Log In With Google),
		// plus that will disable cross-origin isolation and cool features like
		// `SharedArrayBuffer` will no longer be available and thus will prevent
		// certain types of performance optimization that we wish to implement.
		res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')

		// Specify that cross-origin isolation should be enabled using a new
		// header. At time of writing this is not supported by Firefox or Safari
		// yet, and those browsers will enable it with only the above two
		// Cross-Origin-Embedder-Policy and Cross-Origin-Opener-Policy headers
		// being present, while the supporting browsers will check all three
		// headers.
		res.setHeader(
			'Permissions-Policy',
			`cross-origin-isolated=(${allowedOrigins.map(origin => `"${origin}"`).join(' ')})`,
		)

		// TODO maybe we only need to set this for documents (not scripts,
		// images, etc).
		res.setHeader(
			'Content-Security-Policy',
			`frame-ancestors 'self' ${Meteor.isDevelopment ? localhostOrigins.join(' ') : remoteOrigins.join(' ')}`,
		)

		// Respond to preflight requests.
		// TODO Do we need this (if we're only on GET)?
		// if (req.method === 'OPTIONS') {
		// 	res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*')
		//  // Meteor is on GET only by default, with API communication over
		//  // WebSockets, we're currently not handling anything other than GET.c
		// 	res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
		// 	res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
		// 	res.setHeader('Access-Control-Max-Age', '3600')
		// 	res.writeHead(200)
		// 	res.end()
		// 	return
		// }

		// Check if the request is from a valid origin, and if so allow it.
		//
		// If there is no origin header, it means its a same-origin GET or HEAD
		// request in standard web browsers, otherwise it is another type of
		// same-origin request, or a cross-origin request (cross-origin requests
		// from non-hacked browsers always have the origin header). Setting
		// access control is not a security feature, but more of a convenience
		// for the browser to block resources from being usable on other
		// origins, so always use authentication. For non-browser clients such
		// as hacker servers that can easily set headers to whatever they want,
		// this will not prevent them from accessing the site, and user 2-factor
		// is recommended (only users savy enough to check the domain name in
		// their non-hacked address bar before logging in will be safe
		// otherwise).
		// (https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Origin#description)
		if (!req.headers.origin || allowedOrigins.includes(req.headers.origin)) {
			res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*')
			res.setHeader('Vary', 'Origin')
		} else return getCoffee(res)

		if (req.url !== req.originalUrl) {
			console.error('url and originalUrl do not match, needs handling:', req.url, req.originalUrl)
			process.exit(1)
		}

		///////////////////////////////////////////////////////////////////////////
		// Implement custom request path handling such that a path like `/foo`
		// will serve `/foo.html`. This makes it possible to put `app.html` in
		// the `public/` folder, for example, and access it as `<appOrigin>/app`
		// without using a special backend router, only the existence of HTML
		// files.

		// We use "https://dummy" as the base URL because we only need the URL
		// pathname or anything after the pathname.
		const url = new URL(req.url ?? '', 'https://dummy')

		// Continue as usual for / (Meteor serves that after building client/entry.html).
		if (url.pathname === '/') return next()

		// Redirect /foo/ to /foo (and /foo will render /foo.html or /foo/index.html if one of those exists)
		if (url.pathname.endsWith('/')) return permRedirect(res, url.pathname.replace(/\/$/g, ''))

		// Treat '/foo/bar' and '/foo/bar/' as 'foo/bar', '/foo' and '/foo/' as 'foo', and '/' as ''.
		let pathname = url.pathname
		pathname = pathname.replace(/^\//g, '')
		pathname = pathname.replace(/\/$/g, '')
		const pathParts = pathname.split('/')

		// Continue as usual for files with extensions (Meteor serves those).
		// We're only checking extensionless paths like /foo to serve /foo.html
		// or /foo/index.html.
		if (pathParts[pathParts.length - 1].includes('.')) return next()

		// Location in the Meteor-specific build output (not relative to the
		// entry file's location in source code, but relative to
		// ./.meteor/local/build/programs/server/ from the project root.).
		const publicDir = path.resolve('..', 'web.browser', 'app')

		// Search upward for .html files. For example, if the path is
		// /foo/bar/baz, we will try /foo/bar/baz.html, /foo/bar/baz/index.html,
		// /foo/bar.html, /foo/bar/index.html, /foo.html, and /foo/index.html.
		while (pathParts.length) {
			const givenPath = path.resolve(publicDir, ...pathParts)
			const pathsToTry = [givenPath + '.html', givenPath + '/index.html']

			for (const filePath of pathsToTry) if (await sendFile(res, filePath)) return

			pathParts.pop()
		}

		// Continue as usual (serve entry.html) if for /foo we didn't find /foo.html or /foo/index.html
		return next()
	},
)

/**
 * Returns true if the file was found and an attempt to send was made, false
 * otherwise. If an attempt to send fails, it still returns true, to end the
 * search for files.
 */
async function sendFile(res: ServerResponse, filePath: string): Promise<boolean> {
	let exists = false

	try {
		exists = (await fs.promises.stat(filePath)).isFile()
	} catch (e) {
		if (typeof e === 'object' && e && (e as {code: string}).code === 'ENOENT') exists = false
		else {
			failure(res, 'Failed to read and serve file: ', filePath, e)
			return true // return true to stop searching for other files
		}
	}

	if (!exists) return false

	try {
		sendOk(res, await fs.promises.readFile(filePath))
		return true
	} catch (e) {
		failure(res, 'Failed to read and serve file: ', filePath, e)
		return true // return true to stop searching for other files
	}
}

function getCoffee(res: ServerResponse) {
	res.statusCode = 418 // see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/418
	res.write('go get some coffee')
	res.end()
}

function failure(res: ServerResponse, ...msg: unknown[]) {
	console.error('Failure: ', ...msg)
	res.statusCode = 500
	res.write('Failure.')
	res.end()
}

function sendOk(res: ServerResponse, body: unknown) {
	res.statusCode = 200
	res.write(body)
	res.end()
}

function permRedirect(res: ServerResponse, newPath: string) {
	res.statusCode = 301
	res.writeHead(301, {location: newPath})
	res.end()
}

//// Set up admins. ////////////////////////////////
// This is in server code only so that people won't see the list of emails on
// the client.

// TODO define admins.
const admins = [
	'joe@lume.io',
	'trusktr@gmail.com',
	'tan@drippy3d.com',
	'ruby@drippy3d.com',
	'ngu.nguyen4616@gmail.com',
	'kylebruceofficial@gmail.com',
]

// If a user signs up with a known admin email, make them an admin.
Accounts.onCreateUser((options, user) => {
	const googleEmail = user.services?.google?.email.toLowerCase()

	if (!user.emails) user.emails = []

	// If the user signed up using Google OAuth, make sure their Google email is
	// in the emails array too. Meteor should just do this automatically,
	// tracking issue: https://github.com/meteor/meteor/issues/13929
	if (googleEmail && !user.emails.map(e => e.address.toLowerCase()).includes(googleEmail))
		user.emails.push({address: googleEmail, verified: true})

	const adminEmails = admins.map(email => email.toLowerCase())
	const userEmails = (user.emails || []).map(email => email.address.toLowerCase())
	const isAdmin = userEmails.some(email => adminEmails.includes(email))

	user.profile = {...user.profile, ...options.profile, isAdmin}

	return user
})

// Migration: ensure all existing users that signed up with Google have their emails in the correct spot.
// TODO remove this after a while. Handle migrations better later.
const users = await Meteor.users.find({}).fetchAsync()
const emailMigrationPromises: Promise<unknown>[] = []
for (const user of users) {
	const googleEmail = user.services?.google?.email.toLowerCase()

	if (!(googleEmail && !user.emails?.map(e => e.address.toLowerCase()).includes(googleEmail))) continue

	console.log('Migrating user to add Google email to emails[]:', user._id, googleEmail)
	emailMigrationPromises.push(
		Meteor.users.updateAsync(user._id, {
			$set: {emails: [...(user.emails || []), {address: googleEmail, verified: true}]},
		}),
	)
}

await Promise.all(emailMigrationPromises)

const makeAdminPromises = [] as Promise<unknown>[]

// Make all existing users with a known admin email admins.
for (const email of admins) {
	makeAdminPromises.push(
		Accounts.findUserByEmail(email).then(user => {
			if (user) return Meteor.users.updateAsync(user._id, {$set: {profile: {...user.profile, isAdmin: true}}})
		}),
	)
}

// Migration: ensure previous Visits documents have their host fields renamed to origin.
// TODO remove this after a while. Handle migrations better later.
const visits = await Visits.find({}).fetchAsync()
const visitsMigrationPromises: Promise<unknown>[] = []
for (const visit of visits) {
	type VisitWithHost = Visit & {host?: string}
	const v = visit as VisitWithHost
	if (!(v.host && !v.origin)) continue

	const {_id, host} = v
	console.log('Migrating visit to rename host to origin:', host)
	visitsMigrationPromises.push(
		Visits.updateAsync(_id, {
			$set: {origin: (host.includes('localhost') ? 'http://' : 'https://') + host},
			$unset: {host: ''},
		}),
	)
}

await Promise.all([...makeAdminPromises, ...visitsMigrationPromises])

// TODO configure default field selector.
// Accounts.config({ defaultFieldSelector: { includeThisOne: 1, excludeThisOne: 0 } })
