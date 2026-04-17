import {batch, css, Element, element, html, type ElementAttributes} from 'lume'
import {spaces} from '../consts/spaces.js'
import {pushState, searchParams} from '../routes.js'
import {store} from '../app/store.js'
import type {Space} from '../types/types.js'

@element
export class SpaceNavArrows extends Element {
	static override readonly elementName = 'space-nav-arrows'

	#visibleSpaces = () => spaces().filter(s => !s.isHidden)

	#currentIndex = () => {
		const slug = store.selectedSpace?.slug
		return this.#visibleSpaces().findIndex(s => s.slug === slug)
	}

	#prevSpace = () => {
		const idx = this.#currentIndex()
		if (idx <= 0) return null
		return this.#visibleSpaces()[idx - 1]
	}

	#nextSpace = () => {
		const idx = this.#currentIndex()
		const all = this.#visibleSpaces()
		if (idx < 0 || idx >= all.length - 1) return null
		return all[idx + 1]
	}

	#navigateTo = (space: Space | null) => {
		if (!space) return
		searchParams().set('space', space.slug)
		batch(() => {
			pushState()
			store.selectSpace = space
			store.view = 'template'
		})
	}

	override template = () => html`
		${() => {
			const prev = this.#prevSpace()
			const next = this.#nextSpace()
			const idx = this.#currentIndex()
			const all = this.#visibleSpaces()
			if (idx < 0) return ''
			return html`
				<div class="space-nav">
					<button
						class="arrow arrow-prev"
						disabled=${!prev}
						onclick=${() => this.#navigateTo(prev)}
						title=${() => prev?.name ?? ''}
					>
						<svg
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<polyline points="15 18 9 12 15 6" />
						</svg>
					</button>

					<div class="space-label">
						<span class="space-name">${() => store.selectedSpace?.name ?? ''}</span>
						<span class="space-dots">
							${() => all.map((_, i) => html`<span class=${`dot ${i === idx ? 'dot--active' : ''}`}></span>`)}
						</span>
					</div>

					<button
						class="arrow arrow-next"
						disabled=${!next}
						onclick=${() => this.#navigateTo(next)}
						title=${() => next?.name ?? ''}
					>
						<svg
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<polyline points="9 18 15 12 9 6" />
						</svg>
					</button>
				</div>
			`
		}}
	`

	override css = css /*css*/ `
		:host {
			display: contents;
		}

		.space-nav {
			position: fixed;
			top: 20px;
			left: 50%;
			translate: -50% 0;
			z-index: 3100;
			display: flex;
			align-items: center;
			gap: 12px;
			background: rgba(0, 0, 0, 0.45);
			backdrop-filter: blur(10px);
			-webkit-backdrop-filter: blur(10px);
			border: 1px solid rgba(255, 255, 255, 0.12);
			border-radius: 999px;
			padding: 8px 16px;
			color: white;
			user-select: none;
		}

		.arrow {
			background: none;
			border: none;
			color: white;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 4px;
			border-radius: 50%;
			transition:
				background 0.15s,
				opacity 0.15s;
			opacity: 0.9;
		}

		.arrow:hover:not(:disabled) {
			background: rgba(255, 255, 255, 0.15);
			opacity: 1;
		}

		.arrow:disabled {
			opacity: 0.25;
			cursor: default;
		}

		.space-label {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 4px;
			min-width: 90px;
		}

		.space-name {
			font-size: 13px;
			font-weight: 500;
			letter-spacing: 0.03em;
			white-space: nowrap;
		}

		.space-dots {
			display: flex;
			gap: 5px;
			align-items: center;
		}

		.dot {
			width: 5px;
			height: 5px;
			border-radius: 50%;
			background: rgba(255, 255, 255, 0.35);
			transition:
				background 0.2s,
				transform 0.2s;
		}

		.dot--active {
			background: white;
			transform: scale(1.3);
		}
	`
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			[SpaceNavArrows.elementName]: ElementAttributes<SpaceNavArrows, never>
		}
	}
}

declare global {
	interface HTMLElementTagNameMap {
		[SpaceNavArrows.elementName]: SpaceNavArrows
	}
}
