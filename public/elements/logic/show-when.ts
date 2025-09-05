import {attribute, booleanAttribute, Element, element, type ElementAttributes} from '@lume/element'
import {Show} from 'solid-js'
import html from 'solid-js/html'

export type ShowWhenAttributes = 'condition' | 'content' | 'fallback'

/**
 * This is a small wrapper around Solid.js <For> to make it a custom element so
 * that we don't have to use <${For}> syntax any time we need it, and prettier
 * formatting will also work.
 *
 * Example:
 *
 * ```js
 * return html`
 *  <show-when
 *     condition=${() => someCondition}
 *     content=${() => html`<p>Content to show when condition is true</p>`}
 *     fallback=${() => html`<p>Fallback content when condition is false</p>`}
 *  ></show-when>
 * `
 * ```
 */
@element
export class ShowWhen extends Element {
	static readonly elementName = 'show-when'

	/** The condition to show content. If falsy, fallback content is shown instead. */
	@booleanAttribute condition = false

	/** A function that returns a template for content when condition is truthy. */
	@attribute content = () => []

	/** A function that returns a template for fallback content when condition is falsy. */
	@attribute fallback = () => []

	hasShadow = false

	template = () => html`
		<${Show} when=${() => this.condition} fallback=${() => this.fallback}>
			${() => this.content}
		</>
	`

	css = `:host {display: contents}`
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			[ShowWhen.elementName]: ElementAttributes<ShowWhen, ShowWhenAttributes>
		}
	}
}

declare global {
	interface HTMLElementTagNameMap {
		[ShowWhen.elementName]: ShowWhen
	}
}
