import {attribute, Element, element, type ElementAttributes} from '@lume/element'
import {For} from 'solid-js'
import html from 'solid-js/html'

export type ForEachAttributes = 'items' | 'content'

/**
 * This is a small wrapper around Solid.js <For> to make it a custom element so
 * that we don't have to use <${For}> syntax any time we need it, and prettier
 * formatting will also work.
 */
@element
export class ForEach extends Element {
	static readonly elementName = 'for-each'

	/** An array of items to iterate over. */
	@attribute items: unknown[] = []

	/** A function that returns a template for each item. */
	@attribute content = (_item: unknown, _index: () => number) => html``

	hasShadow = false

	template = () => html`
		<${For} each=${() => this.items}>
			${(item: unknown, index: () => number) => this.content(item, index)}
		</>
	`

	css = `:host {display: contents}`
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			[ForEach.elementName]: ElementAttributes<ForEach, ForEachAttributes>
		}
	}
}

declare global {
	interface HTMLElementTagNameMap {
		[ForEach.elementName]: ForEach
	}
}
