import {css} from 'lume'

/**
 * Shared panel styles that can be reused across components
 */
export const sharedUIStyles = css`
	#panel {
		overflow: auto;
		padding: var(--uiSpacing);
		border-radius: 15px;
		position: absolute;
		top: var(--uiSpacing);
		left: var(--uiSpacing);
		bottom: var(--uiSpacing);
		--panelWidth: 300px;
		width: var(--panelWidth);

		@media (width < 720px) {
			--panelWidth: calc(100vw - 2 * var(--uiSpacing));
			top: unset;
			left: var(--uiSpacing);
			right: var(--uiSpacing);
			bottom: 0;
			width: unset;
			height: 400px;
			border-bottom-right-radius: 0;
			border-bottom-left-radius: 0;
		}

		background: var(--appBackground);
		:host-context([data-theme='dark']) & {
			background: var(--appBackgroundDark);
		}
	}
`
