import {css, Element, element, html, signal, type ElementAttributes} from 'lume'

type DialogElementAttributes = 'open'

@element
export class DialogElement extends Element {
	static readonly elementName = 'dialog-element'

	@signal open = false

	#dialogRef: HTMLDialogElement | null = null
	#styleRef: HTMLStyleElement | null = null

	connectedCallback() {
		super.connectedCallback()

		this.createEffect(() => {
			if (this.open && !this.#dialogRef) {
				this.#createDialog()
			} else if (!this.open && this.#dialogRef) {
				this.#destroyDialog()
			}
		})
	}

	#createDialog = () => {
		const dialog = document.createElement('dialog')

		// Apply styles directly to the dialog element
		dialog.style.cssText = `
			border: none;
			border-radius: var(--borderRadius);
			padding: var(--uiSpacing);
			background: var(--uiColorPrimaryWhite);
			box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
			width: 600px;
			height: 60vh;
			overflow-x: hidden;
			box-sizing: border-box;
		`

		// Add backdrop styles
		const style = document.createElement('style')
		style.textContent = `
			dialog::backdrop {
				background: rgba(0, 0, 0, 0.5);
				backdrop-filter: blur(2px);
			}
		`
		document.head.appendChild(style)
		this.#styleRef = style

		// Move all child elements to the dialog
		while (this.firstChild) {
			dialog.appendChild(this.firstChild)
		}

		// Close dialog when clicking backdrop
		dialog.addEventListener('click', e => {
			if (e.target === dialog) {
				this.close()
			}
		})

		document.body.appendChild(dialog)
		dialog.showModal()
		this.#dialogRef = dialog
	}

	#destroyDialog = () => {
		if (this.#dialogRef) {
			// Move all child elements back to this element
			while (this.#dialogRef.firstChild) {
				this.appendChild(this.#dialogRef.firstChild)
			}

			this.#dialogRef.close()
			document.body.removeChild(this.#dialogRef)
			this.#dialogRef = null
		}

		if (this.#styleRef) {
			document.head.removeChild(this.#styleRef)
			this.#styleRef = null
		}
	}

	close = () => {
		this.open = false
		this.dispatchEvent(new CustomEvent('close', {bubbles: true, composed: true}))
	}

	show = () => {
		this.open = true
	}

	template = () => html`<slot></slot>`

	css = css/*css*/ `
		:host {
			display: none;
		}
	`
}

declare global {
	interface HTMLElementTagNameMap {
		'dialog-element': DialogElement
	}
}

declare module 'lume' {
	interface IntrinsicElements {
		'dialog-element': ElementAttributes<DialogElement, DialogElementAttributes>
	}
}
