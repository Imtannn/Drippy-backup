import {Meteor} from 'meteor/meteor'
import {Session} from 'meteor/session'
import {createEffect, createMemo, createSignal, untrack} from 'solid-js'
import {effect} from './meteor-signals.js'

// We'll keep the title up to date once we add routing. For now it is constant.
const appName = 'Drippy'
const [_appTitle] = createSignal(appName)
export const appTitle = () => _appTitle()

createEffect(() => (document.title = appTitle()))

// Generic routing features ////////////////////////////////////////////////////

// Track the url of the current page on route change. This is used to track
// visits to the page.

const [url, setUrl] = createSignal(new URL(location.href))

export {url}
export const pathname = createMemo(() => url().pathname)
export const searchParams = () => url().searchParams
export const host = createMemo(() => url().host)
export const origin = createMemo(() => url().origin)
export const protocol = createMemo(() => url().protocol)
export const href = createMemo(() => url().href)
export const search = createMemo(() => url().search)
export const hash = createMemo(() => url().hash)
export const port = createMemo(() => url().port)
export const hostname = createMemo(() => url().hostname)
export const username = createMemo(() => url().username)
export const password = createMemo(() => url().password)

export const hrefMinusOrigin = () => url().href.replace(url().origin, '')

export const replaceState = () => window.history.replaceState({}, '', untrack(url).href)
export const pushState = () => window.history.pushState({}, '', untrack(url).href)

window.addEventListener('popstate', () => setUrl(new URL(location.href)))

{
	const pushState = history.pushState
	history.pushState = History.prototype.pushState = function (...args) {
		const ret = pushState.apply(this, args)
		setUrl(new URL(location.href))
		return ret
	}

	const replaceState = history.replaceState
	history.replaceState = History.prototype.replaceState = function (...args) {
		const ret = replaceState.apply(this, args)
		setUrl(new URL(location.href))
		return ret
	}
}

// Track which routes the user has already visited in local storage, that way we
// can count unique visits.

interface Visited {
	[origin: string]: {
		[route: string]: boolean
	}
}

/** A map of pages the user has visited. This is currently in local storage, but could be moved to the database in the future. */
export const visited = () => Session.get('visited') as Visited
const setVisited = (visited: Visited) => Session.setPersistent('visited', visited)

if (!visited()) setVisited({})

// If the user hasn't visited the current page before, increment the page visits.
// For now we have only a root page.
effect(() => {
	url() // re-run on route change

	if (visited()[origin()]?.[hrefMinusOrigin()]) return

	setVisited({...visited(), [origin()]: {...(visited()[origin()] ?? {}), [hrefMinusOrigin()]: true}})

	Meteor.call('visits.increment', href())
})

// debugging
const win = window as Window & {
	routes?: {url: typeof url; replaceState: typeof replaceState; pushState: typeof pushState}
}
win.routes = {url, replaceState, pushState}

// App-specific features ///////////////////////////////////////////////////////

export const isPreview = createMemo(() => searchParams().get('isPreview'))
export const hasBrandParam = createMemo(() => !!searchParams().get('brand'))
