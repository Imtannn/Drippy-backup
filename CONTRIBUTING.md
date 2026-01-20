# Contributing

- All frontend code goes in the `public/` folder.
- All backend code goes in the `server/` folder.
- Code shared between frontend and backend goes in the top-level `imports/` folder.
- Use @lume/element for all custom elements. The docs are here:
  https://github.com/lume/element/blob/main/README.md
  - The `drippy-scene.ts` file has a reference implementation of an element with all typical features:
    - `@element` decorator on the class
    - `@attribute` decorators (or derivatives such as `@numberAttribute` for
      coercing attribute values to JS values) to map DOM attributes to respective
      signal-backed JS properties.
    - `@signal`, `@memo`, and `@effect` decorators for reactivity.
    - `template` for defining the element's Shadow DOM structure.
    - `css` for defining the element's Shadow DOM styles.
- For all reactivity,
  - in classes
    - use attribute decorators from `@lume/element` (e.g., `@attribute`,
      `@booleanAttribute`, `@numberAttribute`, etc.) for attribute properties
      (only in custom elements).
    - use class fields decorated with `@signal` from `classy-solid` (also
      re-exported from `lume`) for non-attribute reactive state (in any class, not
      just custom elements).
    - use class getters decorated with `@memo` from `classy-solid` (also
      re-exported from `lume`) for derived reactive state (in any class, not just
      custom elements).
    - use class methods decorated with `@effect` from `classy-solid` (also
      re-exported from `lume`) for side effects that depend on reactive state (in
      any class, not just custom elements).
  - inside effects
    - use `createEffect` from `solid-js` for nested effects
- Use CSS variables for theming and styling whenever possible, avoid hard-coded
  duplicate values.
  - Use --camelCase for CSS variables.
  - Place all CSS variables that need to be shared with JS in `styleVars.ts`.
  - Place global styles for the whole app in `global.css`. This sheet is injected
    into all Shadow Roots so it affects all elements.
  - Prefer CSS animations over JS animations wherever possible.
    - Exception: Lume 3D elements can be animated only with JS currently.

# NEVER

- Never create alternative reactivity patterns, only signals and effects. For
  example, never create a callback-based API to pass data to a callback depending
  on state, instead give the user a signal or a memo they can read from inside an
  effect.
