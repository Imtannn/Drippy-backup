import {createMemo} from 'solid-js'
import {currentUser} from './store.js'

export type AuthState = 'loading' | 'authenticated' | 'unauthenticated'

export type AuthGuardOptions = {
	/**
	 * URL to redirect to when user is unauthenticated.  If not provided, no
	 * automatic redirect occurs.
	 */
	redirectToOnUnauthenticated?: string

	/**
	 * Whether to log auth state changes to console.
	 * @default false
	 */
	debug?: boolean
}

/**
 * Creates a reactive memo that monitors authentication state and handles redirects.
 * Returns a memo that consumers can read in their own effects.
 *
 * @param options - Configuration options for auth guard behavior
 * @returns A memo returning the current auth state: 'loading' | 'authenticated' | 'unauthenticated'. 'loading' happens only once during initial app load.
 *
 * @example
 * ```ts
 * // In a component:
 * const authState = setupAuthGuard({
 *   redirectToOnUnauthenticated: '/onboarding?step=step3',
 *   debug: true
 * })
 * 
 * // Derive state in another memo:
 * const isUserLoggedIn = createMemo(() => authState() === 'authenticated')
 *
 * // Use the memo in an effect:
 * this.createEffect(() => {
 *   console.log('is authenticated:', isUserLoggedIn())
 * })
 * ```
 */
export function setupAuthGuard(options: AuthGuardOptions = {}) {
	const {redirectToOnUnauthenticated, debug = false} = options

	const authState = createMemo(() => {
		const user = currentUser()

		// If undefined, means the user is still loading
		if (user === undefined) {
			if (debug) console.log('[auth-guard] User is loading...')
			return 'loading'
		}

		// If null, means the user is logged out
		if (user === null) {
			if (debug) console.log('[auth-guard] User is logged out')

			if (redirectToOnUnauthenticated) {
				if (debug) console.log(`[auth-guard] Redirecting to: ${redirectToOnUnauthenticated}`)
				window.location.href = redirectToOnUnauthenticated
			}

			return 'unauthenticated'
		} else {
			if (debug) console.log('[auth-guard] User is logged in')
			return 'authenticated'
		}
	})

	return authState
}
