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
	primaryBlack: 'rgba(18, 19, 22, 1)',
	primaryLightGrey: 'rgba(246, 246, 246, 1)',
	primaryWhite: 'rgba(255, 255, 255, 1)',
	secondaryDarkGrey1: 'rgba(42, 44, 49, 1)',
	accentViolet: 'rgba(184, 151, 253, 1)',
	secondaryLightGrey1: '#99999a',
	fontFamilyPrimary: "'Poppins', Helvetica",
	fontFamilySecondary: "'Helvetica', sans-serif",
	headingH1FontWeight: 600,
	headingH1LetterSpacing: '0px',
	headingH1LineHeight: 'normal',
	headingH1FontStyle: 'normal',
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
