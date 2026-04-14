/**
 * Utilities for encoding space slugs as URL path segments instead of
 * the legacy `?space=` query parameter.
 *
 * e.g.  `/drippy-shop`  instead of  `/?space=drippy-shop`
 */

/** Extract the space slug from the first path segment, or null if none. */
export function spaceSlugFromPathname(pathname: string): string | null {
	const match = pathname.match(/^\/([^/]+)/)
	if (!match) return null
	return decodeURIComponent(match[1])
}

/**
 * All valid space slugs. Used to guard the legacy `?space=` → path redirect
 * so we don't accidentally redirect arbitrary query params to paths.
 * Keep in sync with public/consts/spaces.ts.
 */
export const KNOWN_SPACE_SLUGS = new Set(['metamorphosis', 'h&m', 'drippy-shop'])
