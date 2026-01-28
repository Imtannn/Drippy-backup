import {attribute, batch, booleanAttribute, css, Element, element, html, type ElementAttributes} from 'lume'
import {pushState, searchParams} from '../routes.js'
import {store} from './store.js'

import '../elements/animation-select.js'
import '../elements/back-button.js'
import '../elements/control-button-group.js'
import '../elements/cube-button.js'
import '../elements/home-button.js'
import '../elements/logic/show-when.js'
import '../elements/logo-button.js'
import '../elements/person-button.js'
import '../elements/redo-button.js'
import '../elements/reload-button.js'
import '../elements/show-on-device.js'
import '../elements/undo-button.js'
import './app-buttons.js'
import './buy-button.js'
import './share-button.js'

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
		animation?: boolean
		all?: {
			share?: boolean
			buy?: boolean
		}
		desktop?: {
			share?: boolean
			buy?: boolean
		}
		mobile?: {
			share?: boolean
			buy?: boolean
		}
	}
}

type AppButtonsPresetAttributes =
	| 'preset'
	| 'brandName'
	| 'showTools'
	| 'showAnimation'
	| 'disablePersonButton'
	| 'disableCubeButton'

@element
export class AppButtonsPreset extends Element {
	static override readonly elementName = 'app-buttons-preset'

	@attribute preset: LayoutPreset = 'custom'
	@attribute brandName = 'MoiDien'

	@booleanAttribute showTools = true
	@booleanAttribute showAnimation = false
	@booleanAttribute disablePersonButton = true
	@booleanAttribute disableCubeButton = true

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
					case 'iframe-popup':
						store.view = 'order-items'
						store.iframePopupUrl = null
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

	#presetConfig = (): PresetConfig => {
		const presets: Record<LayoutPreset, PresetConfig> = {
			'order-flow': {
				left: {
					all: {
						back: true,
						home: false, // disabled for now, re-enable when spaces page is ready
					},
				},
				right: {
					logo: true,
					desktop: {share: true, buy: true},
				},
			},
			'template-flow': {
				left: {
					all: {
						back: false, // disabled for now, re-enable when spaces page is ready
					},
				},
				right: {
					logo: true,
					tools: true,
					animation: this.showAnimation,
					mobile: {buy: true},
				},
			},
			'preview-flow': {
				left: {
					all: {
						back: true,
						home: false, // disabled for now, re-enable when spaces page is ready
					},
				},
				right: {
					logo: true,
					tools: true,
					desktop: {buy: true, share: true},
				},
			},
			'simple-flow': {
				left: {
					all: {
						back: true,
						home: false, // disabled for now, re-enable when spaces page is ready
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
			${() =>
				config.desktop && html`<show-on-device device="desktop">${renderButtons(config.desktop)}</show-on-device>`}
			${() => config.mobile && html`<show-on-device device="mobile">${renderButtons(config.mobile)}</show-on-device>`}
		`
	}

	#renderActionButtons = (config: PresetConfig['right']) => {
		if (!config) return ''

		const renderButtons = (buttons: {share?: boolean; buy?: boolean} | undefined) => {
			if (!buttons) return ''
			return html`
				<app-buttons-right layout="bottom" style="top: 20px;">
					<app-buttons-group custom-style="gap: 34px; align-items: center;margin-top: -3px;" group-direction="row">
						${() => buttons.share && html`<share-button onclick=${this.#onShareClick}></share-button>`}
						${() =>
							buttons.buy &&
							store.view === 'template' &&
							!store.remixOverlayTemplate &&
							html`<buy-button onclick=${this.#onBuyClick}></buy-button>`}
					</app-buttons-group>
				</app-buttons-right>
			`
		}

		return html`
			${() => config.all && renderButtons(config.all)}
			${() =>
				config.desktop && html`<show-on-device device="desktop">${renderButtons(config.desktop)}</show-on-device>`}
			${() => config.mobile && html`<show-on-device device="mobile">${renderButtons(config.mobile)}</show-on-device>`}
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
						<show-on-device device="mobile">
							<app-buttons-group>
								${() => config.logo && html`<logo-button brand-name=${() => this.brandName}></logo-button>`}
								<control-button-group>
									<undo-button group></undo-button>
									<redo-button group></redo-button>
									<reload-button group></reload-button>
								</control-button-group>
								${() =>
									config.tools &&
									html`
										<person-button disabled=${() => this.disablePersonButton}></person-button>
										<cube-button disabled=${() => this.disableCubeButton}></cube-button>
									`}
								<admin-button></admin-button>
								${() => config.animation && html`<animation-select></animation-select>`}
							</app-buttons-group>
						</show-on-device>
					`}
			</app-buttons-right>

			${() =>
				(config.logo || config.tools) &&
				html`
					<show-on-device device="desktop">
						<div class="tools-buttons-desktop">
							<app-buttons-group>
								${() => config.logo && html`<logo-button brand-name=${() => this.brandName}></logo-button>`}
								<control-button-group>
									<undo-button group></undo-button>
									<redo-button group></redo-button>
									<reload-button group></reload-button>
								</control-button-group>
								${() =>
									config.tools &&
									html`
										<person-button disabled=${() => this.disablePersonButton}></person-button>
										<cube-button disabled=${() => this.disableCubeButton}></cube-button>
									`}
								<admin-button></admin-button>
								${() => config.animation && html`<animation-select></animation-select>`}
							</app-buttons-group>
						</div>
					</show-on-device>
				`}
			${() => this.#renderActionButtons(config)}
		`
	}

	override template = () => html`
		${() => this.#presetConfig().left && this.#renderLeft()} ${() => this.#presetConfig().right && this.#renderRight()}
		<slot></slot>
	`

	override css = css /*css*/ `
		:host {
			display: contents;
		}

		/* Desktop: Position tools buttons beside the bottom-sheet panel */
		@media (min-width: 768px) {
			.tools-buttons-desktop {
				position: fixed;
				right: calc(var(--bottom-sheet-panel-left, 7px) + var(--bottom-sheet-panel-width, 32rem) + 20px);
				top: 20px;
				z-index: 52; /* Above bottom-sheet (z-index: 50) */
				display: flex;
				flex-direction: column;
				gap: 5px;
				transition: right 0.3s ease-out;
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
