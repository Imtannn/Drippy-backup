Use @lume/element. The docs are here: https://github.com/lume/element/blob/main/README.md

For all reactivity, use `this.createEffect` which is a wrapper for Solid's `createEffect` that you call in `connectedCallback`.

Use `elements/template-el.ts` as a template.

Place all CSS variables in styleVars.ts

Place global styles for the whole app in global.css. This sheet is injected into all Shadow Roots so it affects all elements.

Prefer CSS animations over JS animations.
