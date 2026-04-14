import '../elements/admin-button.js'
import '../elements/back-button.js'
import '../elements/clear-garments-button.js'
import '../elements/control-button-group.js'
import '../elements/cube-button.js'
import '../elements/home-button.js'
import '../elements/logic/for-each.js'
import '../elements/logic/show-when.js'
import '../elements/logo-button.js'
import '../elements/person-button.js'
import '../elements/recenter-button.js'
import '../elements/redo-button.js'
import '../elements/show-on-device.js'
import '../elements/undo-button.js'
import './app-buttons.js'
import './share-button.js'

import {attribute, batch, booleanAttribute, css, Element, element, html, signal, type ElementAttributes} from 'lume'
import {avatars} from '../consts/avatars.js'
import {getTemplatesByCollection} from '../consts/templates.js'
import {spaces} from '../consts/spaces.js'
import {pushState, searchParams} from '../routes.js'
import {store} from './store.js'
import {templateHelpers} from './TemplateHelpers.js'
import type {Template, TemplateCategory} from '../types/template.js'
import type {Avatar, Space, TemplateMap} from '../types/types.js'

type LayoutPreset = 'order-flow' | 'template-flow' | 'preview-flow' | 'simple-flow' | 'custom'

type PresetConfig = {
	left?: {
		all?: {
			back?: boolean
			home?: boolean
		}
		desktop?: {
			back?: boolean
			home?: boolean
		}
		mobile?: {
			back?: boolean
			home?: boolean
		}
	}
	right?: {
		logo?: boolean
		tools?: boolean
		all?: {
			share?: boolean
		}
		desktop?: {
			share?: boolean
		}
		mobile?: {
			share?: boolean
		}
	}
}

type AppButtonsPresetAttributes = 'preset' | 'brandName' | 'showTools' | 'showAnimation' | 'disablePersonButton' | 'disableCubeButton'

@element
export class AppButtonsPreset extends Element {
	static override readonly elementName = 'app-buttons-preset'

	@attribute preset: LayoutPreset = 'custom'
	@attribute brandName = 'MoiDien'

	@booleanAttribute showTools = true
	@booleanAttribute showAnimation = false
	@booleanAttribute disablePersonButton = true
	@booleanAttribute disableCubeButton = true
	@signal private randomVisitorsCount = 0
	#randomVisitorsTimer: ReturnType<typeof setInterval> | null = null

	override connectedCallback() {
		super.connectedCallback()
		this.#randomizeVisitors()
		this.#randomVisitorsTimer = setInterval(() => {
			this.#randomizeVisitors()
		}, 7000)
	}

	override disconnectedCallback() {
		super.disconnectedCallback()
		if (this.#randomVisitorsTimer) clearInterval(this.#randomVisitorsTimer)
	}

	#randomizeVisitors = () => {
		this.randomVisitorsCount = Math.floor(Math.random() * 61) + 5 // 5..65
	}

	#onBackClick = () => {
		switch (this.preset) {
			case 'order-flow':
				switch (store.view) {
					case 'order-items':
						store.view = 'template'
						break
					case 'order-size':
						store.view = 'order-items'
						break
					case 'order':
						store.view = 'order-size'
						break
					case 'custom-measurement':
						store.view = 'order-size'
						break
					default:
						store.view = 'order-items'
				}
				break
			case 'template-flow':
				this.dispatchEvent(new CustomEvent('backclick', {bubbles: true}))
				store.goBackHomeAndResetState()
				break
			case 'preview-flow':
				batch(() => {
					store.isPreview = false
					searchParams().delete('isPreview')
					pushState()
					store.view = 'template'
				})
				break
			case 'simple-flow':
				batch(() => {
					store.isPreview = false
					searchParams().delete('isPreview')
					pushState()
					store.view = 'preview'
				})
				break
		}
	}

	#onHomeClick = () => {
		store.goBackHomeAndResetState()
	}

	#onShareClick = () => {
		navigator.clipboard.writeText(window.location.href)
		alert('Link copied to clipboard')
	}

	#onBuyClick = () => {
		store.view = 'order-items'
	}

	#visibleSpaces = () => spaces().filter(s => !s.isHidden)

	#navigateToSpace = (space: Space) => {
		searchParams().set('space', space.slug)
		batch(() => {
			pushState()
			store.clearSelectedGarments()
			store.selectSpace = space
			store.view = 'template'
		})
		this.#equipDefaultTemplate(space)
	}

	#equipDefaultTemplate = (space: Space) => {
		const collection = space.collections[0]
		if (!collection) return
		const spaceTemplates = getTemplatesByCollection(collection)

		const findFirst = (categories: TemplateCategory[]) => {
			for (const cat of categories) {
				const t = spaceTemplates.find(t => t.category === cat)
				if (t) return t
			}
			return undefined
		}

		const topTemplate = findFirst(['Shirt', 'Top', 'Dress', 'Jumpsuit'])
		const coversBottom = topTemplate?.category === 'Dress' || topTemplate?.category === 'Jumpsuit'
		const bottomTemplate = coversBottom ? undefined : findFirst(['Pants', 'Skirt'])

		let garments = {}
		const newTemplates: TemplateMap = {}

		for (const template of [topTemplate, bottomTemplate]) {
			if (!template) continue
			const blockData = templateHelpers.convertTemplateToBlockData(template, collection)
			const {newBlocksMap, newFabricsMap} = templateHelpers.getBlocksAndFabricsMapFromTemplateData(
				blockData,
				collection,
			)
			const selection = templateHelpers.buildTemplateSelectionFromMaps(newBlocksMap, newFabricsMap)
			garments = templateHelpers.withTemplateSelection(garments, template.category, selection)
			newTemplates[template.category] = template
		}

		batch(() => {
			store.selectedGarments = garments
			store.selectedTemplates = newTemplates
		})
	}

	#renderSpaceNav = () => {
		const all = this.#visibleSpaces()
		const idx = all.findIndex(s => s.slug === store.selectedSpace?.slug)
		if (idx < 0) return ''
		const next = all[(idx + 1) % all.length]
		return html`
			<button class="space-nav-next" onclick=${() => this.#navigateToSpace(next)}>
				Next Space
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="9 18 15 12 9 6"/>
				</svg>
			</button>
		`
	}

	#getSpaceAvatars = (): Avatar[] => {
		const selectedSpaceGender = store.selectedSpace?.gender
		const available = avatars().filter(avatar => (selectedSpaceGender ? avatar.gender === selectedSpaceGender : true))
		const selected = store.selectedAvatar
		return [...available].sort((a, b) => {
			if (a.name === selected) return -1
			if (b.name === selected) return 1
			return 0
		})
	}

	#renderSpaceAvatars = () => {
		if (this.preset !== 'template-flow') return ''
		return html`
			<div class="space-avatars" aria-label="Avatars in this space">
				<div class="space-avatars-count" title="Visitors online">
					<span class="dot"></span>
					${() => `${this.randomVisitorsCount} online`}
				</div>
				<for-each
					items=${() => this.#getSpaceAvatars().slice(0, 5)}
					content=${() => (avatar: Avatar) => html`
						<div class="space-avatar" classList=${() => ({active: avatar.name === store.selectedAvatar})} title=${avatar.name}>
							<img src=${avatar.thumbnail} alt=${avatar.name} />
						</div>
					`}
				></for-each>
			</div>
		`
	}

	#presetConfig = (): PresetConfig => {
		const presets: Record<LayoutPreset, PresetConfig> = {
			'order-flow': {
				left: {
					all: {
						back: true,
						home: true,
					},
				},
				right: {
					logo: true,
					desktop: {share: true},
				},
			},
			'template-flow': {
				left: {
					all: {
						home: true,
					},
				},
				right: {
					tools: true,
				},
			},
			'preview-flow': {
				left: {
					all: {
						back: true,
						home: true,
					},
				},
				right: {
					logo: true,
					tools: true,
					desktop: {share: true},
				},
			},
			'simple-flow': {
				left: {
					all: {
						back: true,
						home: true,
					},
				},
				right: {logo: true},
			},
			custom: {},
		}
		return presets[this.preset] || {}
	}

	#renderLeft = () => {
		const config = this.#presetConfig().left
		if (!config) return ''

		const renderButtons = (buttons: {back?: boolean; home?: boolean} | undefined) => {
			if (!buttons) return ''
			return html`
				<app-buttons-left>
					<app-buttons-group group-direction="row">
						${() => buttons.back && html`<back-button onclick=${this.#onBackClick}></back-button>`}
						${() => buttons.home && html`<home-button onclick=${this.#onHomeClick}></home-button>`}
					</app-buttons-group>
				</app-buttons-left>
			`
		}

		return html`
			${() => config.all && renderButtons(config.all)}
			${() => config.desktop && html`<show-on-device desktop>${renderButtons(config.desktop)}</show-on-device>`}
			${() => config.mobile && html`<show-on-device mobile>${renderButtons(config.mobile)}</show-on-device>`}
		`
	}

	#renderActionButtons = (config: PresetConfig['right']) => {
		if (!config) return ''

		const renderButtons = (buttons: {share?: boolean} | undefined) => {
			if (!buttons) return ''
			return html`
				<app-buttons-right layout="bottom" style="top: 20px;">
					<app-buttons-group custom-style="gap: 34px; align-items: center;margin-top: -3px;" group-direction="row">
						${() => buttons.share && html`<share-button onclick=${this.#onShareClick}></share-button>`}
					</app-buttons-group>
				</app-buttons-right>
			`
		}

		return html`
			${() => config.all && renderButtons(config.all)}
			${() => config.desktop && html`<show-on-device desktop>${renderButtons(config.desktop)}</show-on-device>`}
			${() => config.mobile && html`<show-on-device mobile>${renderButtons(config.mobile)}</show-on-device>`}
		`
	}

	#renderRight = () => {
		const config = this.#presetConfig().right
		if (!config) return ''

		return html`
			<app-buttons-right>
				${() =>
					(config.logo || config.tools) &&
					html`
						<show-on-device mobile>
							<app-buttons-group>
								<div style="display: flex; align-items: center; gap: 5px;">
									${() => config.logo && html`<logo-button brand-name=${() => this.brandName}></logo-button>`}
								</div>
								<control-button-group>
									<undo-button group></undo-button>
									<redo-button group></redo-button>
									<recenter-button group></recenter-button>
									<clear-garments-button group></clear-garments-button>
								</control-button-group>
								${() =>
									config.tools &&
									html`
										<person-button disabled=${() => this.disablePersonButton}></person-button>
										<cube-button disabled=${() => this.disableCubeButton}></cube-button>
									`}
								<admin-button></admin-button>
							</app-buttons-group>
						</show-on-device>
					`}
			</app-buttons-right>

			${() =>
				(config.logo || config.tools) &&
				html`
					<show-on-device desktop>
						<div class="tools-buttons-desktop">
							<app-buttons-group>
								${() => config.logo && html`<logo-button brand-name=${() => this.brandName}></logo-button>`}
								<control-button-group>
									<undo-button group></undo-button>
									<redo-button group></redo-button>
									<recenter-button group></recenter-button>
									<clear-garments-button group></clear-garments-button>
								</control-button-group>
								${() =>
									config.tools &&
									html`
										<person-button disabled=${() => this.disablePersonButton}></person-button>
										<cube-button disabled=${() => this.disableCubeButton}></cube-button>
									`}
								<admin-button></admin-button>
							</app-buttons-group>
						</div>
					</show-on-device>
				`}
			${() => this.#renderActionButtons(config)}
		`
	}

	override template = () => html`
		${() => this.#presetConfig().left && this.#renderLeft()} ${() => this.#presetConfig().right && this.#renderRight()}
		${() => this.#renderSpaceNav()} ${() => this.#renderSpaceAvatars()}
		<slot></slot>
	`

	override css = css /*css*/ `
		:host {
			display: contents;
		}

		.space-nav-next {
			display: none;
		}

		@media (min-width: 768px) {
			.space-nav-next {
				position: fixed;
				bottom: 2%;
				right: 0;
				translate: calc(-1 * calc(var(--bottom-sheet-panel-left, 7px) + var(--bottom-sheet-panel-width, 32rem) + 20px)) 0 0.00001px;
				z-index: 3100;
				display: flex;
				align-items: center;
				gap: 6px;
				background: rgba(0, 0, 0, 0.5);
				backdrop-filter: blur(10px);
				-webkit-backdrop-filter: blur(10px);
				border: 1px solid rgba(255, 255, 255, 0.15);
				border-radius: 999px;
				padding: 8px 16px;
				color: white;
				font-size: 13px;
				font-weight: 500;
				letter-spacing: 0.03em;
				cursor: pointer;
				transition: background 0.15s, border-color 0.15s, translate var(--transitionDefaultTimeCurve);
				will-change: translate;
				user-select: none;
			}

			:host-context(.panel-collapsed) .space-nav-next {
				/* Push farther left when panel is collapsed so music toggle remains visible */
				translate: calc(-1 * calc(var(--bottom-sheet-panel-left, 7px) + var(--bottom-sheet-panel-width, 32rem) + 60px)) 0 0.00001px;
			}

			.space-nav-next:hover {
				background: rgba(0, 0, 0, 0.7);
				border-color: rgba(255, 255, 255, 0.3);
			}

			.space-avatars {
				position: fixed;
				left: 20px;
				bottom: 2%;
				z-index: 3100;
				display: flex;
				align-items: center;
				gap: 4px;
				padding: 7px 10px;
				border-radius: 999px;
				background: rgba(0, 0, 0, 0.35);
				backdrop-filter: blur(10px);
				-webkit-backdrop-filter: blur(10px);
				border: 1px solid rgba(255, 255, 255, 0.18);
			}

			.space-avatar {
				width: 30px;
				height: 30px;
				border-radius: 999px;
				overflow: hidden;
				border: 1px solid rgba(255, 255, 255, 0.4);
				opacity: 0.8;
				transition: all 0.2s ease;

				img {
					width: 100%;
					height: 100%;
					object-fit: cover;
					object-position: center top;
					transform-origin: center top;
					transform: translateY(-2px) scale(1.75);
				}
			}

			.space-avatar.active {
				opacity: 1;
				border-color: #b28aff;
				box-shadow: 0 0 0 2px rgba(178, 138, 255, 0.35);
			}

			.space-avatars-count {
				display: inline-flex;
				align-items: center;
				gap: 6px;
				margin-right: 2px;
				padding-right: 4px;
				color: rgba(255, 255, 255, 0.92);
				font-size: 12px;
				font-weight: 500;
				white-space: nowrap;
			}

			.space-avatars-count .dot {
				width: 7px;
				height: 7px;
				border-radius: 999px;
				background: #4ade80;
				box-shadow: 0 0 8px rgba(74, 222, 128, 0.7);
			}
		}

		/* Desktop: Position tools buttons beside the bottom-sheet panel */
		@media (min-width: 768px) {
			.tools-buttons-desktop {
				position: fixed;
				right: 0;
				translate: calc(-1 * calc(var(--bottom-sheet-panel-left, 7px) + var(--bottom-sheet-panel-width, 32rem) + 20px))
					0px 0.00001px;
				top: 20px;
				z-index: 52; /* Above bottom-sheet (z-index: 50) */
				display: flex;
				flex-direction: column;
				gap: 5px;
				transition: translate var(--transitionDefaultTimeCurve);
				will-change: translate;
			}
		}
	`
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			[AppButtonsPreset.elementName]: ElementAttributes<AppButtonsPreset, AppButtonsPresetAttributes>
		}
	}
}

declare global {
	interface HTMLElementTagNameMap {
		[AppButtonsPreset.elementName]: AppButtonsPreset
	}
}
