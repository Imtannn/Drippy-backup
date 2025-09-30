import {Meteor} from 'meteor/meteor'
import {createSignal} from 'solid-js'
import {Session} from 'meteor/session'
import {effect} from './meteor-signals.js'
import type {BlockCategory} from './types/block.js'
import type {Fabric} from './types/fabric.js'
import type {Template, TemplateCategory} from './types/template.js'

// We'll keep the title up to date once we add routing. For now it is constant.
let appName = 'Drippy'
const [_appTitle] = createSignal(appName)
export const appTitle = () => _appTitle()

// Track the url of the current page on route change. This is used to track
// visits to the page.

const [_url, setUrl] = createSignal(new URL(location.href))

export const url = () => _url()
export const pathname = () => url().pathname
export const searchParams = () => url().searchParams
export const host = () => url().host
export const origin = () => url().origin
export const protocol = () => url().protocol
export const href = () => url().href
export const search = () => url().search
export const hash = () => url().hash
export const port = () => url().port
export const hostname = () => url().hostname
export const username = () => url().username
export const password = () => url().password

export const hrefMinusOrigin = () => url().href.replace(url().origin, '')

// Utility function to update URL with search params while ensuring clean root path
export const updateUrlWithParams = (searchParams: URLSearchParams) => {
	window.history.replaceState({}, '', `?${searchParams.toString()}`)
}

window.addEventListener('popstate', () => setUrl(new URL(location.href)))

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

export const updateGarmentsInUrl = (garments: Map<TemplateCategory, Template>) => {
	const currentUrl = new URL(location.href)

	if (garments.size > 0) {
		const garmentIds = Array.from(garments.values()).map(garment => garment._id)
		currentUrl.searchParams.set('garments', garmentIds.join(','))
	} else {
		currentUrl.searchParams.delete('garments')
	}

	// Update URL without triggering page reload
	history.replaceState({}, '', currentUrl.toString())
}

export const updateFabricsInUrl = (fabrics: Map<TemplateCategory, Map<BlockCategory, Map<string, Fabric>>>) => {
	const currentUrl = new URL(location.href)

	if (fabrics.size > 0) {
		const fabricEntries: string[] = []

		for (const [templateCategory, blockMap] of fabrics.entries()) {
			for (const [blockCategory, pieceMap] of blockMap.entries()) {
				for (const [piece, fabric] of pieceMap.entries()) {
					fabricEntries.push(`${templateCategory}-${blockCategory}-${piece}:${fabric._id}`)
				}
			}
		}

		if (fabricEntries.length > 0) {
			currentUrl.searchParams.set('fabrics', fabricEntries.join(','))
		} else {
			currentUrl.searchParams.delete('fabrics')
		}
	} else {
		currentUrl.searchParams.delete('fabrics')
	}

	// Update URL without triggering page reload
	history.replaceState({}, '', currentUrl.toString())
}
