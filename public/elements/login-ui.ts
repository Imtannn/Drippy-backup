import {
	booleanAttribute,
	css,
	element,
	jsonAttribute,
	Element as LumeElement,
	stringAttribute,
	type ElementAttributes,
} from '@lume/element'
import {onCleanup} from 'solid-js'
import html from 'solid-js/html'
import {hasDescendant, querySelectorDeep} from '../utils.js'
import './blaze-component.js'

// Props that the Blaze loginButtons template accepts.
type LoginButtonProps = {align: 'left' | 'right'}

type LoginUIAttributes = 'disabled' | 'data' | 'customStyle' | 'expanded'

/**
 * This element wraps a the "loginButtons" Blaze template (loaded with the
 * <blaze-component> element) for two reasons:
 *
 * 1. Makes it work with ShadowDOM using some temporary JavaScript DOM patches
 * that happen in on click of any buttons in the loginButtons UI.
 * 2. Encapsulates custom style for the login UI.
 *
 * Ideally we wouldn't need the extra JS hacks, but Meteor's loginButtons first
 * needs an update so it will rely on its nearest root
 * (`getRootNode().querySelector()`) instead of the Document
 * (`document.querySelector()`), and then we will be able to delete the patch
 * code.
 */
@element('login-ui')
export class LoginUI extends LumeElement {
	/**
	 * If true, then the loginButtons Blaze component within this element will not be created
	 * (or will be removed and cleaned up if it was already created).
	 */
	@booleanAttribute disabled = false

	/**
	 * A JSON string to be converted to a data object, or a data object
	 * reference, that is passed to the loginButtons Blaze component.
	 */
	@jsonAttribute data: string | LoginButtonProps = {align: 'right'}

	/** CSS code for custom styling of the loginButtons Blaze template's DOM. */
	@stringAttribute customStyle = ''

	@booleanAttribute expanded = false

	#handleLoginUI = (el: HTMLElement) => {
		let original = document.getElementById

		// Set placeholders for email and password inputs
		const setPlaceholders = () => {
			const emailInput = querySelectorDeep(document, 'input[type="email"]') as HTMLInputElement | null
			const passwordInput = querySelectorDeep(document, 'input[type="password"]') as HTMLInputElement | null

			if (emailInput && !emailInput.placeholder) {
				emailInput.placeholder = 'Email'
			}
			if (passwordInput && !passwordInput.placeholder) {
				passwordInput.placeholder = 'Password'
			}
		}

		// Set placeholders after Blaze renders the inputs
		setTimeout(setPlaceholders, 100)

		el.addEventListener(
			'click',
			event => {
				const target = event.target as HTMLElement | null

				if (target?.classList.contains('login-button')) {
					original = document.getElementById

					// Temporarily patch document.getElementById to search in
					// all ShadowRoots (unpatched in the next non-capture click
					// handler) so that Meteor's call to document.getElementById
					// will work while the login UI is inside of a ShadowRoot.
					document.getElementById = function (this: Document, id: string) {
						let result = original.call(this, id)
						if (result) return result
						return querySelectorDeep(document, '#' + id)
					} as (typeof document)['getElementById']
					// ^ cast because the TS type for document.querySelector is incorrect (https://github.com/microsoft/TypeScript-DOM-lib-generator/issues/2020).

					return
				}

				if (target?.classList.contains('login-link-text')) {
					// This makes it so that clicking the dropdown link will close the popup if
					// it is already open.
					const root = (this.shadowRoot ?? this.getRootNode()) as Document | ShadowRoot
					const close = root.querySelector('.login-close-text') as HTMLElement | null
					if (close) setTimeout(() => close.click())
				}
			},
			{capture: true},
		)

		// On the way back up, undo the patch. There's a small
		// chance we break someone else doing the same sort of
		// patch, but super unlikely.
		el.addEventListener('click', () => (document.getElementById = original), {capture: false})
	}

	connectedCallback() {
		super.connectedCallback()

		// When clicking anywhere not inside of the login-ui popup, close the popup.
		this.createEffect(() => {
			if (this.expanded) return
			const onclick = (event: MouseEvent) => {
				const root = (this.shadowRoot ?? this.getRootNode()) as Document | ShadowRoot
				const closeButton = root.querySelector('.login-close-text') as HTMLElement
				if (!closeButton) return

				const loginUI = root.querySelector('#loginButtons')!
				const composedTarget = event.composedPath()[0] as Element

				if (loginUI && composedTarget && !hasDescendant(loginUI, composedTarget)) closeButton.click()
			}

			const opts = {capture: true}

			document.addEventListener('click', onclick, opts)
			onCleanup(() => document.removeEventListener('click', onclick, opts))
		})

		// Optionally expand the dropdown by simulating a click on the existing
		// "Sign in" link once Blaze has rendered it.
		this.createEffect(() => {
			if (!this.expanded) return

			// Observe all potential roots for changes
			const observers: MutationObserver[] = []
			const roots = [this.shadowRoot, this.getRootNode(), document].filter(Boolean) as (Document | ShadowRoot)[]

			const tryClick = () => {
				// Try multiple roots to find the sign-in link (handles dialog movement)
				let signInLink: HTMLElement | null = null
				let foundRoot: Document | ShadowRoot | null = null

				for (const root of roots) {
					signInLink = root.querySelector('#login-sign-in-link') as HTMLElement | null
					if (signInLink) {
						foundRoot = root
						break
					}
				}

				if (signInLink && foundRoot) {
					signInLink.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}))
					observers.forEach(observer => observer.disconnect())
				}
			}

			for (const root of roots) {
				const observer = new MutationObserver(() => tryClick())
				observer.observe(root, {childList: true, subtree: true})
				observers.push(observer)
			}

			// Try immediately in case it's already there
			setTimeout(tryClick, 0)

			onCleanup(() => observers.forEach(observer => observer.disconnect()))
		})
	}

	template = () => html`
		<blaze-component
			tmpl="loginButtons"
			id="loginButtons"
			class=${() => (this.expanded ? 'expanded' : '')}
			disabled=${() => this.disabled}
			data=${() => this.data}
			ref=${this.#handleLoginUI}
		></blaze-component>

		<style prop:textContent=${() => this.customStyle}></style>
	`

	css = css/*css*/ `
		:host {
			display: contents;
		}

		#loginButtons {
			user-select: none;
			display: block;

			#login-email-label,
			#login-password-label {
				display: none;
			}

			.login-link-text {
				color: var(--uiColorPrimaryBlack);
				text-decoration: none;
			}

			.accounts-dialog {
				width: min(354px, calc(90vw - 2 * var(--uiSpacingSmall)));
				pointer-events: auto;
				text-transform: none;
				font-family: var(--base-font-family);
				text-align: left;
				letter-spacing: normal;
				text-decoration: none;

				transform: translate(0px, 0px);

				* {
					font-family: inherit;
					font-size: var(--fontSizeTextSm);

					.login-link-text {
						text-decoration: none;
					}
				}

				a {
					/* force black for now, until we handle light/dark theme for login UI. */
					color: var(--uiColorPrimaryBlack) !important;
				}

				.login-close-text {
					display: none;
				}

				.login-button {
					margin-bottom: var(--uiSpacingTiny);
					border-radius: var(--borderRadiusSmall);
					background-color: var(--uiColorPrimaryBlack);
					color: var(--uiColorPrimaryWhite);
					font-weight: var(--fontWeightSemiBold);
					border: none;
					font-size: var(--fontSizeTextMdDesktop);
					height: var(--uiSpacingXl);
					line-height: var(--uiSpacingXl);
					padding: 0;
					font-family: var(--fontFamilyPrimary);
					width: 100%;
				}

				.login-button-form-submit {
					margin-top: var(--uiSpacingSmall);
					font-size: var(--fontSizeTextSm);
				}

				.or {
					font-size: var(--fontSizeTextXs);
					color: var(--appBackgroundDark);
				}

				input[type='email'],
				input[type='password'] {
					width: 100%;
					height: var(--uiSpacingXl);
					padding: var(--uiGapSmall);
					border-radius: var(--borderRadius);
					font-size: var(--fontSizeTextSm);
					margin-bottom: var(--uiGap);
					box-sizing: border-box;
					background: #f8f8f8;
					border: var(--borderWidth) solid #ccc;
					color: #333;
					transition: var(--transitionSlow);
					pointer-events: auto;

					&:focus {
						outline: none;
						border: var(--borderWidth) solid transparent;
						background:
							linear-gradient(white, white) padding-box,
							linear-gradient(45deg, #e56be8, #495cff) border-box;
					}

					&::placeholder {
						color: var(--uiColorSecondaryLightGrey);
						font-size: var(--fontSizeTextXs);
						font-weight: var(--fontWeightNormal);
					}
				}

				[id*='label-and-input'] {
					display: flex;
					gap: var(--uiGap);
					margin-bottom: var(--uiGap);
				}

				#login-email-label,
				#login-password-label,
				#forgot-password-link,
				#signup-link {
					font-size: var(--fontSizeTextXs);
					font-weight: var(--fontWeightMedium);
					color: var(--appBackgroundDark);
				}
			}

			#login-buttons.login-buttons-dropdown-align-right #login-dropdown-list {
				top: 0;
				right: 0;
				bottom: unset;
				left: unset;
				margin: unset;
			}
		}

		:host-context([data-theme='dark']) {
			#loginButtons {
				.login-link-text {
					color: var(--uiColorPrimaryWhite);
				}
			}
		}

		/* Hide login-sign-in-link when expanded */
		#loginButtons.expanded {
			#login-sign-in-link {
				display: none;
			}

			#login-dropdown-list {
				position: relative !important;
			}

			.accounts-dialog {
				/* Remove Meteor's default dialog styling */
				box-shadow: none;
				background: none;
				border: none;
			}
		}

		#login-buttons.login-buttons-dropdown-align-right.expanded {
			margin-top: -20px;
		}
	`
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			'login-ui': ElementAttributes<LoginUI, LoginUIAttributes>
		}
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'login-ui': LoginUI
	}
}
