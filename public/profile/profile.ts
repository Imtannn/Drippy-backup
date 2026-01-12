import {css, element, Element, type ElementAttributes} from '@lume/element'
import {html, signal} from 'lume'
import {Meteor} from 'meteor/meteor'
import '../elements/logic/show-when.js'
import '../elements/login-ui.js'
import '../routes.js' // track page visits
import {dateOfBirth, username, turnOffSettingsInSpace, isAdmin, hideAnimationSelection} from '../app/store.js'

export type UserProfileAttributes = keyof object // no attributes yet

const elName = 'user-profile'

/**
 * Very basic example of a user profile, with a single input for modifying the
 * username.
 */
@element
export class UserProfile extends Element {
	static override readonly elementName = elName

	@signal editing = false

	@signal username = ''

	@signal turnOffSettingsInSpace = false

	@signal hideAnimationSelection = false
	override connectedCallback() {
		super.connectedCallback()

		this.createEffect(() => (this.username = username()))

		this.createEffect(() => (this.turnOffSettingsInSpace = turnOffSettingsInSpace()))

		this.createEffect(() => (this.hideAnimationSelection = hideAnimationSelection()))

		// Hide the loading cover
		const loadingCover = document.getElementById('loadingCover')!
		if (!loadingCover) console.error('loading cover is broke')
		loadingCover?.classList.add('invisible')
		loadingCover?.addEventListener('transitionend', () => loadingCover.remove())
	}

	#saveChanges() {
		Meteor.call('users.updateProfile', {
			username: this.username,
			dateOfBirth: dateOfBirth(),
			turnOffSettingsInSpace: this.turnOffSettingsInSpace,
			hideAnimationSelection: this.hideAnimationSelection,
		})

		this.editing = false
	}

	#cancel() {
		// Reset to current username
		this.username = username()
		this.turnOffSettingsInSpace = turnOffSettingsInSpace()
		this.hideAnimationSelection = hideAnimationSelection()
		this.editing = false
	}
	override template = () => html`
		<link rel="stylesheet" href="../entry.css" />

		<header>
			<h1>Profile</h1>

			<!-- ------------------------------------------------------------------------------->
			<!-- ---- dark/light/auto theme switch --------------------------------------------->
			<!-- ------------------------------------------------------------------------------->
			<style>
				theme-switch {
					width: 20px;
					pointer-events: auto;
				}
			</style>

			<theme-switch></theme-switch>

			<!-- ------------------------------------------------------------------------------->
			<!-- ---- Login UI ----------------------------------------------------------------->
			<!-- ------------------------------------------------------------------------------->

			<login-ui></login-ui>
		</header>

		<main>
			<show-when
				condition=${() => this.editing}
				content=${() => () => html`
					<div>
						<label for="username">Username</label>
						<input
							id="username"
							type="text"
							value=${() => username()}
							oninput="${(ev: any) => (this.username = ev.target.value)}"
						/>
					</div>
					<show-when
						condition=${() => isAdmin()}
						content=${() => () => html`
							<div>
								<label for="turnOffSettingsInSpace">Turn off settings in space</label>
								<input
									id="turnOffSettingsInSpace"
									type="checkbox"
									checked=${() => turnOffSettingsInSpace()}
									oninput="${(ev: any) => (this.turnOffSettingsInSpace = ev.target.checked)}"
								/>
							</div>
							<div>
								<label for="hideAnimationSelection">Hide animation selection</label>
								<input
									id="hideAnimationSelection"
									type="checkbox"
									checked=${() => hideAnimationSelection()}
									oninput="${(ev: any) => (this.hideAnimationSelection = ev.target.checked)}"
								/>
							</div>
							<div>
								<button onclick="${() => this.#saveChanges()}">Save</button>
								<button onclick="${() => this.#cancel()}">Cancel</button>
							</div>
						`}
					></show-when>
				`}
				fallback=${() => html`
					<div style="display: flex; justify-content: space-between;">
						<div>${() => username()}</div>
						<div>
							<button onclick="${() => (this.editing = true)}">Edit profile</button>
						</div>
					</div>
				`}
			></show-when>
		</main>
	`
	override css = css/*css*/ `
		:host {
			width: 400px;
			height: 300px;

			pointer-events: auto;

			display: flex;
			flex-direction: column;
			padding: 10px;

			background: rgba(255, 255, 255, 0.3);
		}

		/* TODO :host-context support for non-shadow scoped styles? */
		:host-context([data-theme='dark']) {
			background: rgba(0, 0, 0, 0.3);
		}

		:host,
		* {
			box-sizing: border-box;
		}

		header {
			/*outline: 1px solid red;*/
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 10px;

			h1 {
				display: inline-block;
				padding: 0;
				margin: 0;
			}
		}

		main {
			/*outline: 1px solid blue;*/
			overflow: auto;
			gap: 20px;

			.card {
				width: 200px;
				height: 200px;
				position: relative;
				cursor: pointer;

				img {
					width: 100%;
					height: 100%;
					object-fit: cover;
				}

				p {
					position: absolute;
					--pad: 5px;
					bottom: var(--pad);
					left: var(--pad);
				}
			}

			h1 a {
				cursor: pointer;
			}
		}
	`
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			[elName]: ElementAttributes<UserProfile, UserProfileAttributes>
		}
	}
}

declare global {
	interface HTMLElementTagNameMap {
		[elName]: UserProfile
	}
}
