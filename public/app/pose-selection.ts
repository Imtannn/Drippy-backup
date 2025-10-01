import {booleanAttribute, css, Element, element, html, signal, type ElementAttributes} from 'lume'
import {store} from './store.js'

import '../elements/bottom-sheet.js'
import '../elements/logic/for-each.js'
import '../elements/tabs.js'
import './item-card.js'

type PoseSelectionAttributes = 'contentOnly'

type PoseCategory = 'Poses' | 'Motions' | 'Face'

const poses = {
	poses: [
		{
			thumbnail: '/images/none.webp',
			name: 'None',
			value: 'none',
		},
		{
			thumbnail: '/images/walk.webp',
			name: 'Walk',
			value: 'walk',
		},
		{
			thumbnail: '/images/dance.webp',
			name: 'Dance',
			value: 'dance',
		},
	],
	motions: [],
	face: [],
}

@element
export class PoseSelection extends Element {
	static readonly elementName = 'pose-selection'

	@signal selectedTab: PoseCategory = 'Poses'
	@booleanAttribute contentOnly = false

	connectedCallback() {
		super.connectedCallback()

		if (!store.selectedAnimation) {
			store.selectedAnimation = poses.poses[0].value as 'none' | 'walk' | 'dance'
		}

		this.createEffect(() => {
			this.selectedTab = 'Poses'
		})
	}

	#onItemClick = (e: CustomEvent) => {
		const poseValue = e.detail.itemValue.value as 'none' | 'walk' | 'dance'
		console.log('poseValue', poseValue)

		// Trigger the animation effect directly (same as AnimationSelect)
		store.selectedAnimation = poseValue
	}

	#renderPoseContent = () => html`
		<tabs-provider
			default-value=${() => this.selectedTab}
			ontabchange=${(e: CustomEvent) => (this.selectedTab = e.detail.value)}
		>
			<bottom-sheet-header>
				<div class="tabs-container">
					<tabs-list>
						<tabs-trigger selected-value="Poses">Poses</tabs-trigger>
						<tabs-trigger selected-value="Motions">Motions</tabs-trigger>
						<tabs-trigger selected-value="Face">Face</tabs-trigger>
					</tabs-list>
				</div>
			</bottom-sheet-header>

			<div class="tabs-content-container">
				<tabs-content selected-value="Poses">
					<div class="items-grid">
						<for-each
							items=${() => (store.selectedAvatar === 'moidien' ? poses.poses : [])}
							content=${() => (pose: (typeof poses.poses)[number]) => html`
								<item-card
									class=${() => (store.selectedAnimation === pose.value ? 'item-preview' : '')}
									item-active=${() => store.selectedAnimation === pose.value}
									item-src=${pose.thumbnail}
									item-alt=${pose.name}
									item-value=${pose}
									oncardselected=${this.#onItemClick}
									object-fit="cover"
									object-position="center"
									aspect-ratio="0.79"
								></item-card>
							`}
						></for-each>
					</div>
				</tabs-content>

				<tabs-content selected-value="Motions">
					<div class="items-grid"></div>
				</tabs-content>

				<tabs-content selected-value="Face">
					<div class="items-grid"></div>
				</tabs-content>
			</div>
		</tabs-provider>
	`

	template = () => {
		if (this.contentOnly) {
			return this.#renderPoseContent()
		}

		return html` <bottom-sheet> ${this.#renderPoseContent()} </bottom-sheet> `
	}

	css = css/*css*/ `
		:host {
			display: contents;
		}

		.bottom-sheet-header {
			position: sticky;
			top: 0;
			background: var(--appBackground);
			z-index: 10;
			border-bottom: var(--borderWidth) solid var(--uiColorBorderColor);
		}

		.items-grid {
			display: grid;
			grid-template-columns: repeat(3, 1fr);
			gap: var(--uiGap);
		}

		.tabs-content-container {
			padding: var(--uiSpacing);
			padding-top: 0;
		}

		.tabs-container {
			padding: var(--uiSpacing);
			padding-top: 0;
			padding-bottom: 5px;
			background: var(--uiColorPrimaryWhite);
		}
	`
}

declare global {
	interface HTMLElementTagNameMap {
		'pose-selection': PoseSelection
	}
}

declare module 'lume' {
	interface IntrinsicElements {
		'pose-selection': ElementAttributes<PoseSelection, PoseSelectionAttributes>
	}
}
