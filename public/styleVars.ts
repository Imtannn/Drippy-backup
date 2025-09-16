// TODO improve type defs for this, to avoid error-prone manual type casting.
const styleVars = {
	// Example: this results in 0.8 when used in JS, and 80% when used in CSS.
	logoWidth: '5%' as any as number,
	fontFamilyPrimary: 'Poppins',
	// Soft blue in light mode, and dark blue in dark mode.
	appBackground: '#f6f6f6',
	appBackgroundDark: '#121316',

	uiSpacing: 20,
	uiSpacingMedium: 15,
	uiSpacingSmall: 8,
	uiSpacingTiny: 5,
	uiSpacingLarge: 30,
	uiSpacingXl: 40,
	uiSpacingXxl: 60,
	uiGap: 10,
	uiGapSmall: 5,
	uiGapLarge: 15,

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

	// Border and Border Radius
	borderWidth: 1,
	borderRadius: 10,
	borderRadiusSmall: 8,
	borderRadiusMedium: 12,
	borderRadiusLarge: 15,
	borderRadiusXl: 20,
	borderRadiusCircular: '50%',
	borderRadiusPill: 100,

	// App Dimensions
	appWidth: 600,
	appHeight: 400,

	fontFamily: 'Poppins, Helvetica, sans-serif',

	// Font Sizes
	fontSizeTextXl: 54,
	fontSizeTextLg: 40,
	fontSizeTextMd: 16,
	fontSizeTextSm: 14,
	fontSizeTextXs: 12,
	fontSizeTextXxs: 10,
	// Responsive sizes
	fontSizeTextXlTablet: 44,
	fontSizeTextLgTablet: 28,
	fontSizeTextMdTablet: 20,
	fontSizeTextSmTablet: 16,
	fontSizeTextXsTablet: 14,
	fontSizeTextXlMobile: 24,
	fontSizeTextLgMobile: 20,
	fontSizeTextMdDesktop: 18,
	fontSizeTextSmDesktop: 21,
	// Font Weights
	fontWeightBold: 700,
	fontWeightSemiBold: 600,
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

	// Grid spacing
	gridGapMobile: 25,
	gridGapTablet: 25,
	gridGapDesktop: 30,

	// Card heights
	cardHeightMobile: 220,
	cardHeightDesktop: 280,
	cardHeightLarge: 310,
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
		'fontWeightSemiBold',
		'fontWeightBold',
		'fontWeightMedium',
		'fontWeightNormal',
		'lineHeightTight',
		'lineHeightRelaxed',
		'lineHeightLoose',
		'borderRadiusCircular',
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
