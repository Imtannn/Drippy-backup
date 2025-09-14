import {attribute, Element, element, type ElementAttributes} from '@lume/element'
import {For} from 'solid-js'
import html from 'solid-js/html'

export type ForEachAttributes = 'items' | 'content'

/**
 * This is a small wrapper around Solid.js <For> to make it a custom element so
 * that we don't have to use <${For}> syntax any time we need it, and prettier
 * formatting will also work (it currently breaks on <${For}> syntax,
 * https://github.com/prettier/prettier/issues/17849).
 */
@element
export class ForEach extends Element {
	static readonly elementName = 'for-each'

	/** An array of items to iterate over. */
	@attribute items: unknown[] = []

	/**
	 * The template function for each item.
	 *
	 * Note, function values must be passed wrapped in an outer function. F.e.,
	 * notice the extra `() =>` in the next example.
	 *
	 * ```js
	 * return html`
	 *   <for-each
	 *     items=${() => this.items}
	 *     content=${() => (item, index) => html`<div>${item.name} at ${index()}</div>`}
	 *   ></for-each>
	 * ```
	 *
	 * Solid executes the passed-in function to get the value because the
	 * passed-in function may be a signal getter that needs to be read within an
	 * effect, and the *value* returned by that getters is the template
	 * function. If we didn't wrap it in an outer function, Solid would try to
	 * execute the template function directly, which would return a template,
	 * and cause a failure when Solid tries to call it as a function with
	 * arguments.
	 */
	@attribute content = (_item: unknown, _index: () => number) => html``

	hasShadow = false

	template = () => html`
		<${For} each=${() => this.items}>
			${(item: unknown, index: () => number) => {
				if (typeof this.content !== 'function')
					throw new Error(
						'<for-each>: content must be a function value. Make sure you assing it with a wrapper function: content=${() => (item, index) => html`...`}.',
					)
				return this.content(item, index)
			}}
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
