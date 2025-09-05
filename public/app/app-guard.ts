import {Element, element, type ElementAttributes} from 'lume'
import {Meteor} from 'meteor/meteor'

type AppGuardAttributes = keyof {}

@element
export class AppGuard extends Element {
	static readonly elementName = 'app-guard'

	connectedCallback() {
		super.connectedCallback()

		this.createEffect(async () => {
			const user = await Meteor.userAsync()
			if (!user) {
				window.location.href = '/onboarding?step=step3'
			}
		})
	}
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
