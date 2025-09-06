import {Element, element, html, Show, signal, type ElementAttributes} from 'lume'
import {Meteor} from 'meteor/meteor'
import {Tracker} from 'meteor/tracker'

type AppGuardAttributes = keyof {}

@element
export class AppGuard extends Element {
	static readonly elementName = 'app-guard'
	@signal isUserLoggedIn = false

	connectedCallback() {
		super.connectedCallback()

		// Check if user is logged in
		// Track login state and handle step visibility
		const computation = Tracker.autorun(async () => {
			const user = await Meteor.userAsync()
			const userId = user?._id
			this.isUserLoggedIn = !!userId

			if (!userId) {
				// User logged out, reset the flag
				window.location.href = '/onboarding?step=step3'
			}
		})

		// Clean up Tracker computation when component is destroyed
		this.createEffect(() => {
			return () => computation.stop()
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
