import {booleanAttribute, css, Element, element, html, signal, type ElementAttributes} from 'lume'
import {store} from './store.js'

import '../elements/bottom-sheet.js'
import '../elements/logic/for-each.js'
import '../elements/save-button.js'
import '../elements/tabs.js'
import './item-card.js'

type PoseSelectionAttributes = 'contentOnly'

type PoseCategory = 'Poses' | 'Motions' | 'Face'

// Temporary pose data
const poses = {
	poses: [
		{
			thumbnail: 'https://picsum.photos/150/190?random=1',
			name: 'Standing',
			value: 'standing',
		},
		{
			thumbnail: 'https://picsum.photos/150/190?random=2',
			name: 'Walking',
			value: 'walking',
		},
		{
			thumbnail: 'https://picsum.photos/150/190?random=3',
			name: 'Sitting',
			value: 'sitting',
		},
		{
			thumbnail: 'https://picsum.photos/150/190?random=4',
			name: 'Casual',
			value: 'casual',
		},
		{
			thumbnail: 'https://picsum.photos/150/190?random=5',
			name: 'Formal',
			value: 'formal',
		},
		{
			thumbnail: 'https://picsum.photos/150/190?random=6',
			name: 'Athletic',
			value: 'athletic',
		},
	],
	motions: [
		{
			thumbnail: 'https://picsum.photos/150/190?random=7',
			name: 'Wave',
			value: 'wave',
		},
		{
			thumbnail: 'https://picsum.photos/150/190?random=8',
			name: 'Dance',
			value: 'dance',
		},
		{
			thumbnail: 'https://picsum.photos/150/190?random=9',
			name: 'Jump',
			value: 'jump',
		},
		{
			thumbnail: 'https://picsum.photos/150/190?random=10',
			name: 'Run',
			value: 'run',
		},
		{
			thumbnail: 'https://picsum.photos/150/190?random=11',
			name: 'Spin',
			value: 'spin',
		},
		{
			thumbnail: 'https://picsum.photos/150/190?random=12',
			name: 'Clap',
			value: 'clap',
		},
	],
	face: [
		{
			thumbnail: 'https://picsum.photos/150/190?random=13',
			name: 'Smile',
			value: 'smile',
		},
		{
			thumbnail: 'https://picsum.photos/150/190?random=14',
			name: 'Wink',
			value: 'wink',
		},
		{
			thumbnail: 'https://picsum.photos/150/190?random=15',
			name: 'Surprised',
			value: 'surprised',
		},
		{
			thumbnail: 'https://picsum.photos/150/190?random=16',
			name: 'Neutral',
			value: 'neutral',
		},
		{
			thumbnail: 'https://picsum.photos/150/190?random=17',
			name: 'Happy',
			value: 'happy',
		},
		{
			thumbnail: 'https://picsum.photos/150/190?random=18',
			name: 'Focused',
			value: 'focused',
		},
	],
}

@element
export class PoseSelection extends Element {
	static readonly elementName = 'pose-selection'

	@signal selectedTab: PoseCategory = 'Poses'
	@booleanAttribute contentOnly = false

	connectedCallback() {
		super.connectedCallback()

		this.createEffect(() => {
			if (!store.tempSelectedPose) {
				// Set default pose if none selected
				store.setTempSelectedPose = poses.poses[0].value
			}
		})
	}

	#onItemClick = (e: CustomEvent) => {
		store.setTempSelectedPose = e.detail.itemValue.value
	}

	#onSaveClick = () => {
		const value = store.tempSelectedPose
		if (!value) return
		const searchParams = new URLSearchParams(window.location.search)
		searchParams.set('pose', value)
		window.history.replaceState({}, '', `?${searchParams.toString()}`)
		store.selectPose = value
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
							items=${poses.poses}
							content=${() => (pose: (typeof poses.poses)[number]) => html`
								<item-card
									class=${() => (store.tempSelectedPose === pose.value ? 'item-preview' : '')}
									item-active=${() => store.tempSelectedPose === pose.value}
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
					<div class="items-grid">
						<for-each
							items=${poses.motions}
							content=${() => (motion: (typeof poses.motions)[number]) => html`
								<item-card
									class=${() => (store.tempSelectedPose === motion.value ? 'item-preview' : '')}
									item-active=${() => store.tempSelectedPose === motion.value}
									item-src=${motion.thumbnail}
									item-alt=${motion.name}
									item-value=${motion}
									oncardselected=${this.#onItemClick}
									object-fit="cover"
									object-position="center"
									aspect-ratio="0.79"
								></item-card>
							`}
						></for-each>
					</div>
				</tabs-content>

				<tabs-content selected-value="Face">
					<div class="items-grid">
						<for-each
							items=${poses.face}
							content=${() => (face: (typeof poses.face)[number]) => html`
								<item-card
									class=${() => (store.tempSelectedPose === face.value ? 'item-preview' : '')}
									item-active=${() => store.tempSelectedPose === face.value}
									item-src=${face.thumbnail}
									item-alt=${face.name}
									item-value=${face}
									oncardselected=${this.#onItemClick}
									object-fit="cover"
									object-position="center"
									aspect-ratio="0.79"
								></item-card>
							`}
						></for-each>
					</div>
				</tabs-content>
			</div>
		</tabs-provider>
	`

	template = () => {
		if (this.contentOnly) {
			return this.#renderPoseContent()
		}

		return html`
			<app-buttons-right layout="bottom">
				<app-buttons-group>
					<save-button onclick=${this.#onSaveClick}></save-button>
				</app-buttons-group>
			</app-buttons-right>

			<bottom-sheet> ${this.#renderPoseContent()} </bottom-sheet>
		`
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
