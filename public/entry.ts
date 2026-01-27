import {Meteor} from 'meteor/meteor'

// For now import all collections. In the future we can import only the ones
// needed per page.
import './imports/collections/index.js'

const isRootPath = location.pathname === '/'

// Render the UI at the root path (/), but not for other HTML files because they
// render their own content (they can still use Meteor APIs), and not when in an
// iframe (because if we're in an iframe, it is for off-screen credentials requests
// by other domains and the primary domain's UI is not needed in that case).
if (isRootPath) {
	Meteor.startup(async () => {
		await Promise.all([
			import('./routes.js'),
			import('solid-js'),
			import('./imports/collections/Visits.js'),
			import('./elements/home-page.js'),
		])

		const root = document.getElementById('root')!
		root.innerHTML = `<home-page></home-page>`
	})
} else {
	// Not at root path - this is handled by other HTML pages
}

export {} // merely so that TS treats the file as a module
