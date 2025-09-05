import {Element, element, html, Show, signal, type ElementAttributes} from 'lume'
import {Meteor} from 'meteor/meteor'
import {toSolidSignal} from '../utils.js'

type AppGuardAttributes = keyof {}

const currentUser = toSolidSignal(() => Meteor.user())

@element
export class AppGuard extends Element {
	static readonly elementName = 'app-guard'
	@signal user: Meteor.User | null = null

	connectedCallback() {
		super.connectedCallback()

		// Check if user is logged in
		this.createEffect(() => {
			const user = currentUser()

			if (!user) {
				window.location.href = '/onboarding?step=step3'
			} else {
				this.user = user
			}
		})
	}

	template = () => html`
		<${Show} when=${() => this.user}>
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
