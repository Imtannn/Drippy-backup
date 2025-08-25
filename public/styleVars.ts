// TODO improve type defs for this, to avoid error-prone manual type casting.
const styleVars = {
	// Example: this results in 0.8 when used in JS, and 80% when used in CSS.
	logoWidth: '5%' as any as number,

	// Soft blue in light mode, and dark blue in dark mode.
	appBackground: '#f6f6f6',
	appBackgroundDark: '#121316',

	uiSpacing: 20,
	uiSpacingSmall: 8,

	// Landing page variables (moved from landing.css)
	'primaryblack': 'rgba(18, 19, 22, 1)',
	'primarylight-grey': 'rgba(246, 246, 246, 1)',
	'primarywhite': 'rgba(255, 255, 255, 1)',
	'secondarydark-grey-1': 'rgba(42, 44, 49, 1)',
	'accentviolet': 'rgba(184, 151, 253, 1)',
	'secondarylight-grey-1': '#99999a',
	'font-family-primary': "'Poppins', Helvetica",
	'font-family-secondary': "'Helvetica', sans-serif",
	'heading-h1---heading-h1-font-weight': 600,
	'heading-h1-letter-spacing': '0px',
	'heading-h1-line-height': 'normal',
	'heading-h1-font-style': 'normal',
}

interface Window {
	styleVars: typeof styleVars
}

window.styleVars = styleVars

{
	const css = String.raw // for syntax/formatting

	const style = document.createElement('style')

	style.textContent = css`
		:root {
			${Object.entries(styleVars)
				.map(([k, v]) => `--${k}: ${typeof v === 'number' ? v + 'px' : v};`)
				.join('\n')}
		}
	`

	document.head.append(style)

	for (const [key, val] of Object.entries(styleVars)) {
		// @ts-ignore
		styleVars[key] = typeof val === 'string' && val.endsWith('%') ? Number(val.replace('%', '')) / 100 : val
	}
}
