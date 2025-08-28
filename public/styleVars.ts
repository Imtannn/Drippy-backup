// TODO improve type defs for this, to avoid error-prone manual type casting.
const styleVars = {
	// Example: this results in 0.8 when used in JS, and 80% when used in CSS.
	logoWidth: '5%' as any as number,

	// Soft blue in light mode, and dark blue in dark mode.
	appBackground: '#f6f6f6',
	appBackgroundDark: '#121316',

	uiSpacing: 20,
	uiSpacingSmall: 8,

	// UI Colors
	uiColorPrimaryBlack: '#121316',
	uiColorPrimaryWhite: '#ffffff',
	uiColorPrimaryLightGrey: '#f6f6f6',
	uiColorAccentViolet: '#b897fd',
	uiColorSecondaryDarkGrey: '#2a2c31',
	uiColorSecondaryLightGrey: '#99999a',
	uiColorDarkGrey: '#292b30',
	uiColorBorderColor: '#f6f6f6',
	uiColorFocusColor: '#4a90e2',
	uiColorShadowColor: 'rgba(0, 0, 0, 0.1)',
	uiColorWhiteShadow: '#ffffff40',
	uiColorLightPurple: '#b897fd',

	// Font Sizes
	fontSizeTextXl: 54,
	fontSizeTextLg: 40,
	fontSizeTextMd: 24,
	fontSizeTextSm: 18,
	fontSizeTextXs: 16,
	// Responsive sizes
	fontSizeTextXlTablet: 44,
	fontSizeTextLgTablet: 28,
	fontSizeTextMdTablet: 20,
	fontSizeTextSmTablet: 16,
	fontSizeTextXsTablet: 14,
	fontSizeTextXlMobile: 24,
	fontSizeTextLgMobile: 20,
	fontSizeTextMdMobile: 18,
	fontSizeTextSmMobile: 14,
	fontSizeTextXsMobile: 12,

	// Font Weights
	fontWeightBold: 600,
	fontWeightMedium: 500,
	fontWeightNormal: 400,

	// Line Heights
	lineHeightNormal: 'normal',
	lineHeightTight: 1.2,
	lineHeightRelaxed: 1.3,
	lineHeightLoose: 1.5,

	// Transitions
	transitionFast: '0.3s ease',
	transitionSlow: 'all 0.3s ease',
	transitionHover: 'color 0.3s ease',
	transitionTransform: 'transform 0.3s ease',

	// Responsive Breakpoints
	breakpointDesktop: 769,
	breakpointTablet: 768,
	breakpointMobile: 480,
}

interface Window {
	styleVars: typeof styleVars
}

window.styleVars = styleVars

{
	const css = String.raw // for syntax/formatting

	const style = document.createElement('style')

	// Define which properties should not have 'px' added
	const unitlessProperties = [
		'fontWeightBold',
		'fontWeightMedium',
		'fontWeightNormal',
		'lineHeightTight',
		'lineHeightRelaxed',
		'lineHeightLoose',
	]

	style.textContent = css`
		:root {
			${Object.entries(styleVars)
				.map(([k, v]) => {
					const shouldAddPx = typeof v === 'number' && !unitlessProperties.includes(k)
					return `--${k}: ${shouldAddPx ? v + 'px' : v};`
				})
				.join('\n')}
		}
	`

	document.head.append(style)

	for (const [key, val] of Object.entries(styleVars)) {
		// @ts-ignore
		styleVars[key] = typeof val === 'string' && val.endsWith('%') ? Number(val.replace('%', '')) / 100 : val
	}
}
