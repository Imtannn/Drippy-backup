import {Element, element, html, memo} from 'lume'
import {setupAuthGuard} from './auth-guard.js'
import '../elements/logic/show-when.js'

@element
export class AppGuard extends Element {
	static override readonly elementName = 'app-guard'

	#authState = setupAuthGuard({redirectToOnUnauthenticated: '/onboarding?step=step3', debug: true})

	@memo get isUserLoggedIn() {
		return this.#authState() === 'authenticated'
	}

	override template = () => html`
		<show-when condition=${() => this.isUserLoggedIn} content=${() => html` <slot></slot> `}></show-when>
	`
}
