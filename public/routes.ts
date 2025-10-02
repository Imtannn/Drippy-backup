import {Meteor} from 'meteor/meteor'
import {createEffect, createMemo, createSignal, untrack} from 'solid-js'
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

createEffect(() => console.log('Current route:', hrefMinusOrigin()))

export const replaceState = () => window.history.replaceState({}, '', untrack(url).href)
export const pushState = () => window.history.pushState({}, '', untrack(url).href)

window.addEventListener('popstate', () => setUrl(new URL(location.href)))

{
	const pushState = history.pushState
	history.pushState = History.prototype.pushState = function (...args) {
		const ret = pushState.apply(this, args)
		setUrl(new URL(location.href))
		console.trace('PUSHSTATE', args, location.href)
		return ret
	}

	const replaceState = history.replaceState
	history.replaceState = History.prototype.replaceState = function (...args) {
		const ret = replaceState.apply(this, args)
		setUrl(new URL(location.href))
		console.trace('REPLACESTATE', args, location.href)
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

export const updateGarmentsInUrl = (garments: Map<TemplateCategory, Template>) => {
	if (garments.size > 0) {
		const garmentIds = Array.from(garments.values()).map(garment => garment._id)
		untrack(searchParams).set('garments', garmentIds.join(','))
	} else untrack(searchParams).delete('garments')

	pushState()
}

export const updateFabricsInUrl = (fabrics: Map<TemplateCategory, Map<BlockCategory, Map<string, Fabric>>>) => {
	if (fabrics.size > 0) {
		const fabricEntries: string[] = []

		for (const [templateCategory, blockMap] of fabrics.entries())
			for (const [blockCategory, pieceMap] of blockMap.entries())
				for (const [piece, fabric] of pieceMap.entries())
					fabricEntries.push(`${templateCategory}-${blockCategory}-${piece}:${fabric._id}`)

		if (fabricEntries.length > 0) untrack(searchParams).set('fabrics', fabricEntries.join(','))
		else untrack(searchParams).delete('fabrics')
	} else {
		untrack(searchParams).delete('fabrics')
	}

	// Update URL without triggering page reload
	pushState()
}

// debugging
const win = window as any
win.routes = {url, replaceState, pushState}
