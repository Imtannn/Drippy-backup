import {Meteor} from 'meteor/meteor'
import './elements/image-loading.js'

// For now import all collections. In the future we can import only the ones
// needed per page.
import './imports/collections/index.js'

// Render the UI at the root path (/), but not for other HTML files because they
// render their own content (they can still use Meteor APIs), and not when in an
// iframe (because if we're in an iframe, it is for off-screen credentials requests
// by other domains and the primary domain's UI is not needed in that case).
//
// At the root path, we conditionally render either:
// - The landing page (if not logged in and no query params)
// - The app (if logged in OR if any query params like ?scene=GAP are present)
const isRootPath = location.pathname === '/'

if (isRootPath) {
	Meteor.startup(async () => {
		// Import routes early to get access to URL utilities
		const [{appTitle, url, searchParams, replaceState}, {createEffect}] = await Promise.all([
			import('./routes.js'),
			import('solid-js'),
			import('./imports/collections/Visits.js'),
		])

		const params = searchParams()
		const hasQueryParams = params.toString().length > 0

		let shouldShowApp = false

		// Show app if:
		// 1. User has any query params (?scene=GAP, ?app, etc.) OR
		// 2. User is logged in
		if (hasQueryParams) {
			shouldShowApp = true
			if (!params.has('app')) {
				const currentUrl = url()
				currentUrl.searchParams.delete('app') // Ensure no duplicates
				const paramsString = currentUrl.searchParams.toString()
				const newSearch = paramsString ? `?app&${paramsString}` : '?app'
				currentUrl.search = newSearch
				replaceState()
			}
		} else {
			// No query params - check if user is logged in
			const userId = Meteor.userId()
			if (userId) {
				// User is logged in - show app and set URL to /?app
				shouldShowApp = true
				const currentUrl = url()
				currentUrl.search = '?app'
				replaceState()
			}
		}

		if (shouldShowApp) {
			// Show the app
			await import('./elements/home-page.js')
			createEffect(() => (document.title = appTitle()))

			const root = document.getElementById('root')!
			const html = String.raw
			root.innerHTML = html`<home-page></home-page>`
		} else {
			// Show the landing page
			document.title = 'Drippy - Landing Page'
			await import('./landing/landing.js')
		}
	})
} else {
	// Not at root path - this is handled by other HTML pages
}

export {} // merely so that TS treats the file as a module
