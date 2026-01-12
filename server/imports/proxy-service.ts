import {Meteor} from 'meteor/meteor'
import {WebApp} from 'meteor/webapp'
import type {IncomingMessage, ServerResponse} from 'http'

/**
 * Proxy service to bypass CSP frame-ancestors restrictions
 * Only use this with websites that have given permission
 */

async function fetchWithProxy(
	url: string,
	headers?: Record<string, string>,
): Promise<{content: string; contentType: string}> {
	try {
		console.log('Proxy fetching URL:', url)

		// More realistic browser headers to bypass bot detection
		const browserHeaders = {
			'User-Agent':
				'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
			Accept:
				'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
			'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
			'Accept-Encoding': 'gzip, deflate, br',
			'Cache-Control': 'max-age=0',
			'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
			'sec-ch-ua-mobile': '?0',
			'sec-ch-ua-platform': '"macOS"',
			'sec-fetch-dest': 'document',
			'sec-fetch-mode': 'navigate',
			'sec-fetch-site': 'none',
			'sec-fetch-user': '?1',
			'Upgrade-Insecure-Requests': '1',
			Connection: 'keep-alive',
			...headers,
		}

		const response = await fetch(url, {
			headers: browserHeaders,
			redirect: 'follow',
		})

		if (!response.ok) {
			console.error(`Proxy fetch error: HTTP ${response.status} for ${url}`)
			if (response.status === 403) console.error('403 Forbidden - Website may have bot protection (Cloudflare, etc.)')

			throw new Error(`HTTP error! status: ${response.status}`)
		}

		const contentType = response.headers.get('content-type') || 'text/html'
		const content = await response.text()
		console.log(`Proxy fetch success: ${url}, content-type: ${contentType}, content length: ${content.length}`)

		return {content, contentType}
	} catch (error) {
		console.error('Proxy fetch error:', error, 'for URL:', url)
		throw error
	}
}

function rewriteHtmlContent(html: string, baseUrl: string, proxyPath: string): string {
	// Rewrite absolute URLs to use proxy
	const url = new URL(baseUrl)
	const origin = url.origin
	const hostname = url.hostname

	const rewriteAttribute = (content: string, attrName: string): string => {
		const pattern = new RegExp(`(${attrName}=["'])(https?:\\/\\/[^"']+)(["'])`, 'gi')
		return content.replace(pattern, (match, prefix, urlStr, suffix) => {
			try {
				const parsedUrl = new URL(urlStr)
				if (parsedUrl.hostname === hostname || urlStr.startsWith(origin))
					return `${prefix}${proxyPath}?url=${encodeURIComponent(urlStr)}${suffix}`
			} finally {
				// Invalid URL, skip
			}
			return match
		})
	}

	// Rewrite src, href, action attributes
	let rewritten = rewriteAttribute(html, 'src')
	rewritten = rewriteAttribute(rewritten, 'href')
	rewritten = rewriteAttribute(rewritten, 'action')

	// Remove CSP headers from meta tags
	rewritten = rewritten.replace(/<meta[^>]*http-equiv=["']Content-Security-Policy["'][^>]*>/gi, '')
	rewritten = rewritten.replace(/<meta[^>]*http-equiv=["']X-Frame-Options["'][^>]*>/gi, '')

	// Remove frame-ancestors from CSP meta tags
	rewritten = rewritten.replace(/content-security-policy[^>]*frame-ancestors[^;]*;?/gi, '')

	// Remove X-Frame-Options from content attribute in meta tags
	rewritten = rewritten.replace(/content=["'][^"']*X-Frame-Options[^"']*["']/gi, 'content=""')

	return rewritten
}

export function setupProxyService() {
	// Proxy endpoint for HTML pages
	WebApp.connectHandlers.use('/api/proxy', async (req: IncomingMessage, res: ServerResponse) => {
		const url = new URL(req.url || '', `http://${req.headers.host}`)
		const targetUrl = url.searchParams.get('url')

		if (!targetUrl) {
			res.writeHead(400, {'Content-Type': 'text/plain'})
			res.end('Missing url parameter')
			return
		}

		// Validate URL
		try {
			const parsedUrl = new URL(targetUrl)
			// Only allow http and https
			if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
				res.writeHead(400, {'Content-Type': 'text/plain'})
				res.end('Invalid URL protocol')
				return
			}
			// eslint-disable-next-line -- unused error
		} catch (_e) {
			res.writeHead(400, {'Content-Type': 'text/plain'})
			res.end('Invalid URL')
			return
		}

		try {
			const {content, contentType} = await fetchWithProxy(targetUrl)

			// Only process HTML content
			if (contentType.includes('text/html')) {
				const rewritten = rewriteHtmlContent(content, targetUrl, '/api/proxy')
				res.writeHead(200, {
					'Content-Type': 'text/html; charset=utf-8',
					// Remove CSP headers
					'X-Frame-Options': 'ALLOWALL',
					'Content-Security-Policy': 'frame-ancestors *;',
				})
				res.end(rewritten)
			} else {
				// For non-HTML content, proxy as-is
				res.writeHead(200, {
					'Content-Type': contentType,
				})
				res.end(content)
			}
		} catch (error) {
			console.error('Proxy error:', error)
			const errorMessage = error instanceof Error ? error.message : String(error)
			const statusCode = errorMessage.includes('403') ? 403 : 500
			const escapedUrl = targetUrl.replace(/"/g, '&quot;').replace(/'/g, '&#x27;')
			res.writeHead(statusCode, {'Content-Type': 'text/html; charset=utf-8'})
			// Return HTML error page that can be displayed in iframe
			res.end(`
				<!DOCTYPE html>
				<html>
				<head>
					<meta charset="utf-8">
					<title>Proxy Error</title>
					<style>
						body {
							font-family: system-ui, -apple-system, sans-serif;
							display: flex;
							flex-direction: column;
							align-items: center;
							justify-content: center;
							height: 100vh;
							margin: 0;
							background: #f5f5f5;
							color: #333;
						}
						.error-container {
							text-align: center;
							padding: 2rem;
							background: white;
							border-radius: 8px;
							box-shadow: 0 2px 8px rgba(0,0,0,0.1);
							max-width: 500px;
						}
						h1 { margin-top: 0; color: #d32f2f; }
						p { line-height: 1.6; }
						.button {
							display: inline-block;
							margin-top: 1rem;
							padding: 0.75rem 1.5rem;
							background: #1976d2;
							color: white;
							text-decoration: none;
							border-radius: 4px;
							cursor: pointer;
							border: none;
							font-size: 1rem;
						}
						.button:hover { background: #1565c0; }
					</style>
				</head>
				<body>
					<div class="error-container">
						<h1>Không thể tải trang này</h1>
						<p>Trang web này có thể có hệ thống bảo vệ chống bot (như Cloudflare) và không cho phép truy cập qua proxy.</p>
						<p>Vui lòng mở trang này trong tab mới để xem nội dung.</p>
						<button class="button" onclick="window.open('${escapedUrl}', '_blank')">
							Mở trong tab mới
						</button>
					</div>
				</body>
				</html>
			`)
		}
	})

	console.log('Proxy service initialized at /api/proxy')
}

// Initialize proxy service when server starts
Meteor.startup(() => {
	setupProxyService()
})
