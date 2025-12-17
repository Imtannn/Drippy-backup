import {attribute, Element, element, type ElementAttributes} from '@lume/element'
import {Index} from 'solid-js'
import html from 'solid-js/html'

export type IndexEachAttributes = 'items' | 'content'

/**
 * This is a small wrapper around Solid.js <Index> to make it a custom element
 * so that we don't have to use <${Index}> syntax any time we need it, and
 * prettier formatting will also work (it currently breaks on <${Index}> syntax,
 * https://github.com/prettier/prettier/issues/17849).
 */
@element
export class IndexEach extends Element {
	static override readonly elementName = 'index-each'

	/** An array of items to iterate over. */
	@attribute items: unknown[] = []

	/** A function that returns a template for each item. */
	@attribute content = (_item: () => unknown, _index: number) => html``
	override hasShadow = false
	override template = () => html`
		<${Index} each=${() => this.items}>
			${(item: () => unknown, index: number) => {
				if (typeof this.content !== 'function')
					throw new Error(
						'<index-each>: content must be a function value. Make sure you assing it with a wrapper function: content=${() => (item, index) => html`...`}.',
					)
				return this.content(item, index)
			}}
		</>
	`
	override css = `:host {display: contents}`
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			[IndexEach.elementName]: ElementAttributes<IndexEach, IndexEachAttributes>
		}
	}
}

declare global {
	interface HTMLElementTagNameMap {
		[IndexEach.elementName]: IndexEach
	}
}
