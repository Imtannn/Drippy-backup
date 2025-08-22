import {Meteor} from 'meteor/meteor'

const shadowCSS = /*css*/ `
  * {
    font-family: 'Poppins', 'Helvetica', sans-serif;
  }
`

// Save the original method
const originalAttachShadow = Element.prototype.attachShadow

// Patch attachShadow
Element.prototype.attachShadow = function (init: ShadowRootInit): ShadowRoot {
	const shadow = originalAttachShadow.call(this, init)

	const style = document.createElement('style')
	style.textContent = shadowCSS
	shadow.appendChild(style)

	return shadow
}

// Inject into already existing *open* shadow roots
function injectIntoExistingShadows() {
	document.querySelectorAll<HTMLElement>('*').forEach(el => {
		if ((el as any).shadowRoot) {
			const style = document.createElement('style')
			style.textContent = shadowCSS
			;(el as any).shadowRoot.appendChild(style)
		}
	})
}

// In Meteor, run this once the client is ready
if (Meteor.isClient) {
	Meteor.startup(() => {
		injectIntoExistingShadows()
	})
}
