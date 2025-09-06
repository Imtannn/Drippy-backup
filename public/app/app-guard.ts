import {Element, element, html, Show, signal, type ElementAttributes} from 'lume'
import {Meteor} from 'meteor/meteor'
import {toSolidSignal} from '../utils'

type AppGuardAttributes = keyof {}

const currentUser = toSolidSignal(() => Meteor.user())

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
				console.log('[app-guard] user is logged in', user)
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

declare global {
	interface HTMLElementTagNameMap {
		'app-guard': AppGuard
	}
}

declare global {
	interface IntrinsicElements {
		'app-guard': ElementAttributes<AppGuard, AppGuardAttributes>
	}
}
