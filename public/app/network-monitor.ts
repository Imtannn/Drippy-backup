import {createEffect, onCleanup} from 'solid-js'

export type ConnectionStatus = 'online' | 'slow' | 'offline'

export interface NetworkStatus {
	isOnline: boolean
	effectiveType: string | null
	downlink: number | null
	rtt: number | null
}

type BrowserConnection = {
	effectiveType?: string
	downlink?: number
	rtt?: number
	addEventListener?: (type: string, listener: EventListenerOrEventListenerObject) => void
	removeEventListener?: (type: string, listener: EventListenerOrEventListenerObject) => void
}

type NavigatorWithConnection = Navigator & {
	connection?: BrowserConnection
	mozConnection?: BrowserConnection
	webkitConnection?: BrowserConnection
}

// Track image loading failures from AWS
const FAILURE_WINDOW_MS = 60000 // Track failures in last 60 seconds
const FAILURE_THRESHOLD = 3 // If 3+ failures in window, connection is slow

interface LoadFailure {
	timestamp: number
	url: string
	error?: unknown
}

let imageLoadFailures: LoadFailure[] = []

/**
 * Clean up old failures outside the tracking window
 */
function cleanupOldFailures() {
	const now = Date.now()
	imageLoadFailures = imageLoadFailures.filter(failure => now - failure.timestamp < FAILURE_WINDOW_MS)
}

/**
 * Check if there are too many recent failures
 */
function hasRecentFailures(): boolean {
	cleanupOldFailures()
	return imageLoadFailures.length >= FAILURE_THRESHOLD
}

/**
 * Report an image load failure (call this from texture-manager or anywhere images fail)
 */
export function reportImageLoadFailure(url: string, error?: unknown) {
	imageLoadFailures.push({
		timestamp: Date.now(),
		url,
		error,
	})
	cleanupOldFailures()
	console.warn(`Image load failed (${imageLoadFailures.length} failures in last 60s):`, url)
}

/**
 * Report successful image load (helps clear the failure flag faster)
 */
export function reportImageLoadSuccess() {
	// Clear old failures on success to recover faster
	if (imageLoadFailures.length > 0) imageLoadFailures = []
}

export function getNetworkStatus(): NetworkStatus {
	const nav = navigator as NavigatorWithConnection
	const connection = nav.connection || nav.mozConnection || nav.webkitConnection

	return {
		isOnline: navigator.onLine,
		effectiveType: connection?.effectiveType || null,
		downlink: connection?.downlink || null,
		rtt: connection?.rtt || null,
	}
}

export async function getConnectionQuality(status: NetworkStatus): Promise<ConnectionStatus> {
	if (!status.isOnline) return 'offline'

	// Check if AWS image loading has been failing
	if (hasRecentFailures()) return 'slow'

	// Try Network Information API (Chrome, Android only)
	const hasNetworkAPI = status.effectiveType !== null || status.downlink !== null || status.rtt !== null

	if (hasNetworkAPI) {
		const isSlow =
			status.effectiveType === 'slow-2g' ||
			status.effectiveType === '2g' ||
			(status.downlink !== null && status.downlink < 0.5) ||
			(status.rtt !== null && status.rtt > 1000)

		return isSlow ? 'slow' : 'online'
	}

	// Fallback for Safari/Firefox: Rely on real AWS failures only
	return 'online'
}

export function createNetworkMonitor(callback: (status: ConnectionStatus) => void) {
	const nav = navigator as NavigatorWithConnection
	const connection = nav.connection || nav.mozConnection || nav.webkitConnection

	// Initial check
	const initialStatus = getNetworkStatus()
	getConnectionQuality(initialStatus).then(callback)

	const handleOnline = async () => {
		const status = getNetworkStatus()
		const quality = await getConnectionQuality(status)
		callback(quality)
	}

	const handleOffline = () => {
		callback('offline')
	}

	const handleConnectionChange = async () => {
		const status = getNetworkStatus()
		const quality = await getConnectionQuality(status)
		callback(quality)
	}

	window.addEventListener('online', handleOnline)
	window.addEventListener('offline', handleOffline)

	if (connection) connection.addEventListener?.('change', handleConnectionChange)

	return () => {
		window.removeEventListener('online', handleOnline)
		window.removeEventListener('offline', handleOffline)
		if (connection) connection.removeEventListener?.('change', handleConnectionChange)
	}
}

export function createNetworkEffect(callback: (status: ConnectionStatus) => void) {
	createEffect(() => {
		const cleanup = createNetworkMonitor(callback)
		onCleanup(cleanup)
	})
}
