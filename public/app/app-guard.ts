import {Element, element, html, signal, type ElementAttributes, Show} from 'lume'
import {Meteor} from 'meteor/meteor'

type AppGuardAttributes = keyof {}

@element
export class AppGuard extends Element {
	static readonly elementName = 'app-guard'
	@signal user: Meteor.User | null = null

	connectedCallback() {
		super.connectedCallback()

		this.createEffect(async () => {
			const user = await Meteor.userAsync()
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
