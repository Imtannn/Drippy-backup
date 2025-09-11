import {Element, element, html, Show, signal} from 'lume'
import {currentUser} from './store.js'

@element
export class AppGuard extends Element {
	static readonly elementName = 'app-guard'
	@signal isUserLoggedIn = false

	connectedCallback() {
		super.connectedCallback()

		this.createEffect(() => {
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

	template = () => html`
		<${Show} when=${() => this.isUserLoggedIn}>
			<slot></slot>
		</>
	`
}
