import {attribute, batch, booleanAttribute, Element, element, html, type ElementAttributes} from 'lume'
import {pushState, searchParams} from '../routes.js'
import {store} from './store.js'

import '../elements/animation-select.js'
import '../elements/back-button.js'
import '../elements/cube-button.js'
import '../elements/home-button.js'
import '../elements/logic/show-when.js'
import '../elements/logo-button.js'
import '../elements/person-button.js'
import '../elements/preview-button.js'
import '../elements/save-button.js'
import '../elements/show-on-device.js'
import './app-buttons.js'
import './buy-button.js'
import './share-button.js'

type LayoutPreset = 'order-flow' | 'template-flow' | 'preview-flow' | 'simple-flow' | 'custom'

type PresetConfig = {
	left?: {
		back?: boolean
		home?: boolean
	}
	right?: {
		logo?: boolean
		tools?: boolean
		animation?: boolean
		device?: 'mobile' | 'desktop'
		share?: boolean
		buy?: boolean
		preview?: boolean
		save?: boolean
	}
}

type AppButtonsPresetAttributes =
	| 'preset'
	| 'brandName'
	| 'hideLeft'
	| 'hideRight'
	| 'showTools'
	| 'showAnimation'
	| 'disablePersonButton'
	| 'disableCubeButton'

@element
export class AppButtonsPreset extends Element {
	static readonly elementName = 'app-buttons-preset'

	@attribute preset: LayoutPreset = 'custom'
	@attribute brandName = 'MoiDien'

	@booleanAttribute hideLeft = false
	@booleanAttribute hideRight = false
	@booleanAttribute showTools = true
	@booleanAttribute showAnimation = false
	@booleanAttribute disablePersonButton = true
	@booleanAttribute disableCubeButton = true

	#onBackClick = () => {
		switch (this.preset) {
			case 'order-flow':
				switch (store.view) {
					case 'order-items':
						store.view = 'preview'
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
				store.view = 'scene'
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

	#onPreviewClick = () => {
		batch(() => {
			searchParams().set('isPreview', 'true')
			pushState()
			store.isPreview = true
		})
	}

	#presetConfig = (): PresetConfig => {
		const presets: Record<LayoutPreset, PresetConfig> = {
			'order-flow': {
				left: {back: true, home: true},
				right: {logo: true, device: 'desktop', share: true, buy: true},
			},
			'template-flow': {
				left: {},
				right: {logo: true, tools: true, animation: this.showAnimation, device: 'mobile', preview: true},
			},
			'preview-flow': {
				left: {back: true, home: true},
				right: {logo: true, tools: true, device: 'desktop', buy: true, share: true},
			},
			'simple-flow': {
				left: {back: true, home: true},
				right: {logo: true},
			},
			custom: {},
		}
		return presets[this.preset] || {}
	}

	#renderLeft = () => html`
		<app-buttons-left>
			<app-buttons-group group-direction="row">
				${() => this.#presetConfig().left?.back && html`<back-button onclick=${this.#onBackClick}></back-button>`}
				${() => this.#presetConfig().left?.home && html`<home-button onclick=${this.#onHomeClick}></home-button>`}
			</app-buttons-group>
		</app-buttons-left>
	`

	#renderRight = () => {
		const config = this.#presetConfig().right
		if (!config) return ''

		return html`
			<app-buttons-right>
				${() =>
					config.logo &&
					html`
						<app-buttons-group custom-style="margin-top: 3px;">
							<logo-button brand-name=${() => this.brandName}></logo-button>
						</app-buttons-group>
					`}
				${() =>
					config.tools &&
					html`
						<app-buttons-group>
							<person-button disabled=${() => this.disablePersonButton}></person-button>
							<cube-button disabled=${() => this.disableCubeButton}></cube-button>
							<show-when
								condition=${() => config.animation}
								content=${() => html`<animation-select></animation-select>`}
							></show-when>
						</app-buttons-group>
					`}
			</app-buttons-right>

			${() => {
				const content = html`
					<app-buttons-right layout="bottom">
						<app-buttons-group custom-style="gap: 34px;" group-direction="row">
							${() => config.share && html`<share-button onclick=${this.#onShareClick}></share-button>`}
							${() => config.buy && html`<buy-button onclick=${this.#onBuyClick}></buy-button>`}
							${() => config.preview && html`<preview-button onclick=${this.#onPreviewClick}></preview-button>`}
						</app-buttons-group>
					</app-buttons-right>
				`

				// If device is specified, wrap with show-on-device; otherwise show on all devices
				if (!config.device) return content
				return html`<show-on-device device=${config.device}>${content}</show-on-device>`
			}}
		`
	}

	template = () => html`
		${() => !this.hideLeft && this.#presetConfig().left && this.#renderLeft()}
		${() => !this.hideRight && this.#presetConfig().right && this.#renderRight()}
		<slot></slot>
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
