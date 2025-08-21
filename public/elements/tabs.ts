import {
	attribute,
	booleanAttribute,
	css,
	Element,
	element,
	eventAttribute,
	html,
	onCleanup,
	type ElementAttributes,
} from 'lume'

// ============================================================================
// TABS PROVIDER - Main container that manages state
// ============================================================================

type TabsProviderAttributes = 'defaultValue' | 'selectedValue' | 'tabOrientation' | 'tabDir'

@element
export class TabsProvider extends Element {
	static readonly elementName = 'tabs-provider'

	@attribute defaultValue = ''
	@attribute selectedValue = ''
	@attribute tabOrientation: 'horizontal' | 'vertical' = 'horizontal'
	@attribute tabDir: 'ltr' | 'rtl' = 'ltr'

	@eventAttribute ontabchange = null

	private _activeValue = ''
	private triggers: TabsTrigger[] = []
	private contents: TabsContent[] = []

	get activeValue() {
		return this.selectedValue || this._activeValue || this.defaultValue
	}

	connectedCallback() {
		super.connectedCallback()
		this._activeValue = this.defaultValue

		// Use a timeout to ensure all child components are connected
		setTimeout(() => {
			this.updateActiveTab()
		}, 0)
	}

	attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null) {
		if (name === 'selectedValue') {
			this._activeValue = newValue || ''
			this.updateActiveTab()
		}
	}

	registerTrigger(trigger: TabsTrigger) {
		this.triggers.push(trigger)
	}

	unregisterTrigger(trigger: TabsTrigger) {
		this.triggers = this.triggers.filter(t => t !== trigger)
	}

	registerContent(content: TabsContent) {
		this.contents.push(content)
	}

	unregisterContent(content: TabsContent) {
		this.contents = this.contents.filter(c => c !== content)
	}

	updateActiveTab() {
		const activeValue = this.activeValue

		this.triggers.forEach(trigger => {
			trigger.updateActive(trigger.selectedValue === activeValue)
		})

		this.contents.forEach(content => {
			content.updateActive(content.selectedValue === activeValue)
		})
	}

	selectTab(value: string) {
		if (value === this.activeValue) return

		this._activeValue = value
		this.setAttribute('selectedValue', value)
		this.updateActiveTab()

		this.dispatchEvent(
			new CustomEvent('tabchange', {
				detail: {value},
				bubbles: true,
			}),
		)
	}

	template = () => html`<slot></slot>`

	css = css`
		:host {
			display: block;
		}
	`
}

// ============================================================================
// TABS LIST - Container for tab triggers
// ============================================================================

type TabsListAttributes = never

@element
export class TabsList extends Element {
	static readonly elementName = 'tabs-list'

	private provider: TabsProvider | null = null
	private indicatorRef: HTMLElement | null = null
	private hoverIndicatorRef: HTMLElement | null = null
	private resizeTimeout: NodeJS.Timeout | null = null
	connectedCallback() {
		super.connectedCallback()
		this.provider = this.closest('tabs-provider') as TabsProvider
		this.setupKeyboardNavigation()
		const frame = requestAnimationFrame(() => this.updateIndicators())
		this.#addEventListeners()

		onCleanup(() => cancelAnimationFrame(frame))
	}

	disconnectedCallback() {
		super.disconnectedCallback()
		this.#removeEventListeners()
	}

	private setupKeyboardNavigation() {
		this.addEventListener('keydown', (e: KeyboardEvent) => {
			if (!this.provider) return

			const triggers = Array.from(this.querySelectorAll('tabs-trigger')) as TabsTrigger[]
			const currentIndex = triggers.findIndex(t => t.selectedValue === this.provider!.activeValue)

			switch (e.key) {
				case 'ArrowLeft':
				case 'ArrowUp':
					e.preventDefault()
					const prevIndex = currentIndex > 0 ? currentIndex - 1 : triggers.length - 1
					this.provider.selectTab(triggers[prevIndex].selectedValue)
					triggers[prevIndex].focus()
					break
				case 'ArrowRight':
				case 'ArrowDown':
					e.preventDefault()
					const nextIndex = currentIndex < triggers.length - 1 ? currentIndex + 1 : 0
					this.provider.selectTab(triggers[nextIndex].selectedValue)
					triggers[nextIndex].focus()
					break
				case 'Home':
					e.preventDefault()
					this.provider.selectTab(triggers[0].selectedValue)
					triggers[0].focus()
					break
				case 'End':
					e.preventDefault()
					this.provider.selectTab(triggers[triggers.length - 1].selectedValue)
					triggers[triggers.length - 1].focus()
					break
			}
		})

		this.addEventListener('mouseleave', () => {
			this.updateHoverIndicator(null)
		})
	}

	#addEventListeners() {
		window.addEventListener('resize', this.#handleResize)
	}

	#removeEventListeners() {
		window.removeEventListener('resize', this.#handleResize)
	}

	#handleResize = () => {
		if (this.resizeTimeout) {
			clearTimeout(this.resizeTimeout)
		}
		this.resizeTimeout = setTimeout(() => {
			this.updateIndicators()
		}, 100)
	}

	updateIndicators() {
		if (!this.provider) return

		const activeTrigger = this.querySelector(
			`tabs-trigger[selected-value="${this.provider.activeValue}"]`,
		) as TabsTrigger
		if (activeTrigger && this.indicatorRef) {
			this.positionIndicator(this.indicatorRef, activeTrigger)
		}
	}

	updateHoverIndicator(trigger: TabsTrigger | null) {
		if (trigger && this.hoverIndicatorRef) {
			this.positionIndicator(this.hoverIndicatorRef, trigger)
			this.hoverIndicatorRef.style.opacity = '1'
		} else if (this.hoverIndicatorRef) {
			this.hoverIndicatorRef.style.opacity = '0'
		}
	}

	private positionIndicator(indicator: HTMLElement, trigger: TabsTrigger) {
		requestAnimationFrame(() => {
			const listRect = this.getBoundingClientRect()
			const triggerRect = trigger.getBoundingClientRect()

			const left = triggerRect.left - listRect.left
			const width = triggerRect.width

			indicator.style.transform = `translateX(${left}px)`
			indicator.style.width = `${width}px`
		})
	}

	template = () => html`
		<div class="tabs-list" role="tablist" aria-orientation="${this.provider?.tabOrientation || 'horizontal'}">
			<slot></slot>
			<div class="tab-indicator active-indicator" ref="${(el: HTMLElement) => (this.indicatorRef = el)}"></div>
			<div class="tab-indicator hover-indicator" ref="${(el: HTMLElement) => (this.hoverIndicatorRef = el)}"></div>
		</div>
	`

	css = css`
		:host {
			display: block;
			width: 100%;
		}

		.tabs-list {
			position: relative;
			display: flex;
			align-items: center;
			border-radius: 20px;
			gap: 5px;
		}

		.tab-indicator {
			position: absolute;
			top: 0;
			bottom: 0;
			border-radius: 16px;
			transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
			z-index: 1;
		}

		.active-indicator {
			background: #121316;
		}

		.hover-indicator {
			background: rgba(255, 255, 255, 0.1);
			opacity: 0;
			transition:
				opacity 0.2s ease,
				transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
				width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		}
	`
}

// ============================================================================
// TABS TRIGGER - Individual tab button
// ============================================================================

type TabsTriggerAttributes = 'selectedValue' | 'isDisabled'

@element
export class TabsTrigger extends Element {
	static readonly elementName = 'tabs-trigger'

	@attribute selectedValue = ''
	@booleanAttribute isDisabled = false

	private provider: TabsProvider | null = null
	private tabsList: TabsList | null = null
	@booleanAttribute isActive = false

	connectedCallback() {
		super.connectedCallback()
		this.provider = this.closest('tabs-provider') as TabsProvider
		this.tabsList = this.closest('tabs-list') as TabsList

		if (this.provider) {
			this.provider.registerTrigger(this)
		}

		this.#setupEventListeners()

		// Delay update to ensure provider is fully initialized
		setTimeout(() => {
			this.updateActive(this.provider?.activeValue === this.selectedValue)
		}, 0)
	}

	disconnectedCallback() {
		super.disconnectedCallback()
		if (this.provider) {
			this.provider.unregisterTrigger(this)
		}
	}

	#setupEventListeners() {
		this.addEventListener('mouseenter', () => {
			if (this.tabsList && !this.isDisabled) {
				this.tabsList.updateHoverIndicator(this)
			}
		})

		this.addEventListener('focus', () => {
			if (this.tabsList) {
				this.tabsList.updateIndicators()
			}
		})
	}

	#handleClick = () => {
		if (!this.isDisabled && this.provider) {
			this.provider.selectTab(this.selectedValue)
		}
	}

	updateActive(active: boolean) {
		this.isActive = active
		this.setAttribute('aria-selected', active.toString())
		this.setAttribute('tabindex', active ? '0' : '-1')

		if (this.tabsList && active) {
			requestAnimationFrame(() => {
				this.tabsList!.updateIndicators()
			})
		}
	}

	template = () => html`
		<button
			class="tab"
			classList=${() => ({active: this.isActive, disabled: this.isDisabled})}
			role="tab"
			aria-selected=${() => this.isActive}
			aria-controls=${() => `panel-${this.selectedValue}`}
			id=${() => `tab-${this.selectedValue}`}
			tabindex=${() => (this.isActive ? '0' : '-1')}
			disabled=${() => this.isDisabled}
			onclick=${() => this.#handleClick()}
		>
			<slot></slot>
		</button>
	`

	css = css`
		:host {
			flex: 0 0 auto;
		}

		.tab {
			position: relative;
			width: auto;
			padding: 8px 16px;
			background: none;
			border: none;
			border-radius: 16px;
			font-size: 14px;
			font-weight: 500;
			color: #424347;
			cursor: pointer;
			transition:
				color 0.2s ease,
				background-color 0.2s ease;
			z-index: 2;
			white-space: nowrap;
			user-select: none;
			display: flex;
			justify-content: center;
			align-items: center;
		}

		.tab.active {
			color: #ffffff;
		}

		.tab:not(.active) {
			background: #e9e9ea;
		}

		.tab.disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}

		.tab:focus {
			outline: none;
		}

		@media (max-width: 768px) {
			.tab {
				padding: 6px 12px;
				font-size: 10px;
			}
		}
	`
}

// ============================================================================
// TABS CONTENT - Individual tab panel
// ============================================================================

type TabsContentAttributes = 'selectedValue'

@element
export class TabsContent extends Element {
	static readonly elementName = 'tabs-content'

	@attribute selectedValue = ''

	private provider: TabsProvider | null = null
	private isActive = false

	connectedCallback() {
		super.connectedCallback()
		this.provider = this.closest('tabs-provider') as TabsProvider

		if (this.provider) {
			this.provider.registerContent(this)

			// Delay update to ensure provider is fully initialized
			setTimeout(() => {
				this.updateActive(this.provider!.activeValue === this.selectedValue)
			}, 0)
		}
	}

	disconnectedCallback() {
		super.disconnectedCallback()
		if (this.provider) {
			this.provider.unregisterContent(this)
		}
	}

	updateActive(active: boolean) {
		this.isActive = active
		this.setAttribute('aria-hidden', (!active).toString())
		this.style.display = active ? 'block' : 'none'
	}

	template = () => html`
		<div
			class="tab-panel"
			classList=${() => ({active: this.isActive})}
			role="tabpanel"
			id=${() => `panel-${this.selectedValue}`}
			aria-labelledby=${() => `tab-${this.selectedValue}`}
			tabindex="0"
			aria-hidden=${() => (!this.isActive).toString()}
		>
			<slot></slot>
		</div>
	`

	css = css`
		:host {
			display: block;
		}

		.tab-panel {
			padding: 16px 0;
		}

		/* Default styles for common content patterns */
		.tab-panel ::slotted(.category-tabs) {
			display: flex;
			gap: 8px;
			margin-bottom: 16px;
		}

		.tab-panel ::slotted(.category-tab) {
			padding: 6px 12px;
			background: #f5f5f5;
			border: none;
			border-radius: 12px;
			font-size: 14px;
			color: #666;
			cursor: pointer;
			transition: all 0.2s ease;
		}

		.tab-panel ::slotted(.category-tab.active) {
			background: #000;
			color: #fff;
		}

		.tab-panel ::slotted(.items-grid) {
			display: grid;
			grid-template-columns: repeat(3, 1fr);
			gap: 12px;
		}

		.tab-panel ::slotted(.item-card) {
			aspect-ratio: 0.7;
			background: #f8f8f8;
			border-radius: 12px;
			overflow: hidden;
			cursor: pointer;
			transition: transform 0.2s ease;
			border: 2px solid transparent;
		}

		.tab-panel ::slotted(.item-card:hover) {
			transform: scale(1.02);
			border-color: #007aff;
		}

		.tab-panel ::slotted(.item-card:first-child) {
			border-color: #007aff;
		}

		.tab-panel ::slotted(.item-preview) {
			width: 100%;
			height: 100%;
			background: #e0e0e0;
			display: flex;
			align-items: center;
			justify-content: center;
			position: relative;
		}

		.tab-panel ::slotted(.item-preview.fabric) {
			background: linear-gradient(45deg, #ff6b6b, #ffd93d);
		}

		.tab-panel ::slotted(.item-preview.accessory) {
			background: linear-gradient(45deg, #6c5ce7, #a29bfe);
		}

		@media (max-width: 768px) {
			.tab-panel ::slotted(.items-grid) {
				gap: 8px;
			}
		}
	`
}

// ============================================================================
// TYPE DECLARATIONS
// ============================================================================

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			[TabsProvider.elementName]: ElementAttributes<TabsProvider, TabsProviderAttributes>
			[TabsList.elementName]: ElementAttributes<TabsList, TabsListAttributes>
			[TabsTrigger.elementName]: ElementAttributes<TabsTrigger, TabsTriggerAttributes>
			[TabsContent.elementName]: ElementAttributes<TabsContent, TabsContentAttributes>
		}
	}
}

declare global {
	interface HTMLElementTagNameMap {
		[TabsProvider.elementName]: TabsProvider
		[TabsList.elementName]: TabsList
		[TabsTrigger.elementName]: TabsTrigger
		[TabsContent.elementName]: TabsContent
	}
}
