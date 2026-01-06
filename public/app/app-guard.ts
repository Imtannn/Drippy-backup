import {Element, element, html, signal} from 'lume'
import {currentUser} from './store.js'
import '../elements/logic/show-when.js'

@element
export class AppGuard extends Element {
	static override readonly elementName = 'app-guard'
	@signal isUserLoggedIn = false

	override connectedCallback() {
		super.connectedCallback()

		this.createEffect(() => {
			// FIXME keep code maintainable, unduplicate this auth logic (same as in home-page.ts and onboarding-flow.ts)
			const user = currentUser()
			// If undefined, means the user is still loading
			if (user === undefined) return

			// If null, means the user is logged out
			if (user === null) {
				console.log('[app-guard] user is logged out, redirecting to login')
				window.location.href = '/onboarding?step=step3'
			} else {
				console.log('[app-guard] user is logged in')
				this.isUserLoggedIn = true
			}
		})
	}

	override template = () => html`
		<show-when condition=${() => this.isUserLoggedIn} content=${() => html` <slot></slot> `}></show-when>
	`
}
