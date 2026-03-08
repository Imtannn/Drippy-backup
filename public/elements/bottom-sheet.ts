import {
	attribute,
	booleanAttribute,
	css,
	Element,
	element,
	type ElementAttributes,
	eventAttribute,
	html,
	onCleanup,
} from 'lume'

// Define snap points in percentages of viewport height
const SNAP_POINTS = [0.41, 0.6, 0.88]

type BottomSheetAttributes =
	| 'defaultSnap'
	| 'defaultSheetHeight'
	| 'animateOnEnter'
	| 'animateOnExit'
	| 'floatDirection'
	| 'maxHeight'
	| 'showRemixOverlay'
	| 'zIndex'
	| 'snapPoints'
	| 'collapseButton'
	| 'panelWidth'
	| 'onsnap'
	| 'disabledScroll'

// TODO
// - logic in here is a little convoluted, some parts duplicating work in more than one way.
@element
export class BottomSheet extends Element {
	static override readonly elementName = 'bottom-sheet'

	// Properties
	@attribute defaultSnap: string = ''
	@booleanAttribute isDesktop = false
	@booleanAttribute animateOnEnter = true
	@booleanAttribute animateOnExit = true
	@attribute defaultSheetHeight: string = ''
	@attribute floatDirection: 'left' | 'right' = 'left'
	@attribute maxHeight: string | null = null
	@booleanAttribute showRemixOverlay = true
	@attribute zIndex: string | number | null = null
	@attribute snapPoints: string | null = null
	@booleanAttribute collapseButton = true
	@attribute panelWidth: string | null = null
	@eventAttribute onsnap: () => void = () => {}
	@booleanAttribute disabledScroll = false

	private sheetHeight: number | null = null
	private dragState = {
		isDragging: false,
		startY: 0,
		startHeight: 0,
	}

	private sheetRef: HTMLElement | null = null
	private isVisible = true

	private updateBottomSheetHeightVar() {
		if (!this.isDesktop && this.sheetHeight) {
			document.documentElement.style.setProperty('--bottom-sheet-height', `${this.sheetHeight}px`)
		} else {
			// On desktop, remove the custom property to use the default fallback
			document.documentElement.style.removeProperty('--bottom-sheet-height')
		}
	}

	#dispatchSnapEvent() {
		if (!this.sheetRef) throw new Error('cannot dispatch before refs ready')
		const currentHeight = this.sheetRef.offsetHeight
		const snapPoint = this.getClosestSnapPoint(currentHeight)
		const snapPoints = this.#getSnapPoints()
		const snapIndex = snapPoints.indexOf(snapPoint)
		this.dispatchEvent(new CustomEvent('snap', {bubbles: true, detail: {snapPoint, snapIndex}}))
	}

	override connectedCallback() {
		super.connectedCallback()
		this.checkDesktop()
		this.addEventListeners()

		// Fire snap event once initially in case any outside logic needs to
		// derive initial layout.
		this.createEffect(() => {
			if (!this.sheetRef) return

			this.#dispatchSnapEvent()

			// FIXME this is a litle hacky, arbitrary timeout for layout to be
			// ready in case it hasn't settled yet.
			setTimeout(() => this.#dispatchSnapEvent(), 1000)
		})

		this.createEffect(() => {
			const frame = requestAnimationFrame(() => {
				this.handleResize()
				if (this.animateOnEnter) this.animateIn()
				else {
					this.isVisible = true
					// Update document state to notify the scene
					document.documentElement.classList.remove('panel-collapsed')
					document.documentElement.style.setProperty('--bottom-sheet-panel-width', '32rem')
				}
			})

			onCleanup(() => cancelAnimationFrame(frame))
		})

		this.createEffect(() => {
			if (this.floatDirection === 'right') this.style.setProperty('--bottom-sheet-float-direction', 'flex-end')
			else this.style.setProperty('--bottom-sheet-float-direction', 'flex-start')
		})

		// Watch for defaultSnap changes and recalculate height
		this.createEffect(() => {
			this.defaultSnap // eslint-disable-line -- dependency
			this.handleResize()
		})

		this.createEffect(() => {
			this.snapPoints // eslint-disable-line -- dependency
			this.handleResize()
		})

		this.createEffect(() => {
			const zIndex = this.zIndex
			if (zIndex === null || zIndex === undefined || zIndex === '') this.style.removeProperty('--bottom-sheet-z-index')
			else this.style.setProperty('--bottom-sheet-z-index', zIndex.toString())
		})

		this.createEffect(() => {
			const panelWidth = this.panelWidth
			if (panelWidth === null || panelWidth === undefined || panelWidth === '')
				this.style.removeProperty('--bottom-sheet-panel-width')
			else this.style.setProperty('--bottom-sheet-panel-width', panelWidth)
		})
	}
	override disconnectedCallback() {
		super.disconnectedCallback()
		this.removeEventListeners()
	}

	private checkDesktop = () => {
		const wasDesktop = this.isDesktop
		if (window.innerWidth >= 768) {
			if (!this.isDesktop) this.isDesktop = true
		} else if (this.isDesktop) this.isDesktop = false

		// When switching to mobile, ensure panel is always open
		if (wasDesktop && !this.isDesktop) {
			this.isVisible = true
			if (this.sheetRef) this.#setShowStyle()
		}

		this.updateBottomSheetHeightVar()
		this.#dispatchSnapEvent()
	}

	private handleResize = () => {
		this.checkDesktop()
		if (!this.sheetRef) return
		if (!this.isDesktop) {
			const viewportHeight = window.innerHeight
			const defaultHeight = this.#resolveDefaultSheetHeight()
			if (defaultHeight) this.sheetHeight = defaultHeight
			else {
				const snapFraction = this.#resolveDefaultSnapFraction()
				this.sheetHeight = snapFraction * viewportHeight
			}
			this.sheetRef!.style.height = `${this.sheetHeight}px`
		} else {
			this.sheetRef!.style.height = '100vh'
			this.sheetRef!.style.height = '100dvh'
		}
		this.updateBottomSheetHeightVar()
		this.#dispatchSnapEvent()
	}

	#resolveDefaultSnapFraction(): number {
		const snapPoints = this.#getSnapPoints()
		const raw = (this.defaultSnap ?? '').toString().trim()
		if (!raw) return snapPoints[0]

		// Support index (e.g., "0", "1", ...)
		if (/^\d+$/.test(raw)) {
			const index = Math.max(0, Math.min(snapPoints.length - 1, parseInt(raw, 10)))
			return snapPoints[index]
		}

		// Support percent or decimal (e.g., "55%" or "0.55")
		let fraction = NaN
		if (raw.endsWith('%')) fraction = parseFloat(raw) / 100
		else fraction = parseFloat(raw)

		if (!isNaN(fraction)) return Math.max(0, Math.min(1, fraction))

		return snapPoints[0]
	}

	#resolveDefaultSheetHeight(): number | null {
		const raw = (this.defaultSheetHeight ?? '').toString().trim()
		if (!raw) return null

		// Support pixel values (e.g., "400px" or "400")
		const pxMatch = raw.match(/^(\d+)(?:px)?$/)
		if (pxMatch) return parseInt(pxMatch[1], 10)

		// Support viewport height (e.g., "50vh")
		const vhMatch = raw.match(/^(\d+(?:\.\d+)?)vh$/)
		if (vhMatch) return (parseFloat(vhMatch[1]) / 100) * window.innerHeight

		// Support percent (e.g., "50%")
		const percentMatch = raw.match(/^(\d+(?:\.\d+)?)%$/)
		if (percentMatch) return (parseFloat(percentMatch[1]) / 100) * window.innerHeight

		return null
	}

	private getClosestSnapPoint(height: number) {
		const viewportHeight = window.innerHeight
		const currentPos = height / viewportHeight
		const snapPoints = this.#getSnapPoints()
		return snapPoints.reduce((prev, curr) => {
			return Math.abs(curr - currentPos) < Math.abs(prev - currentPos) ? curr : prev
		})
	}

	#getSnapPoints(): number[] {
		const raw = (this.snapPoints ?? '').toString().trim()
		if (!raw) return SNAP_POINTS

		const parsed = raw
			.split(',')
			.map(part => part.trim())
			.filter(Boolean)
			.map(part => {
				let value = NaN
				if (part.endsWith('%')) value = parseFloat(part) / 100
				else value = parseFloat(part)

				if (isNaN(value)) return null
				return Math.max(0, Math.min(1, value))
			})
			.filter((value): value is number => value !== null)
			.sort((a, b) => a - b)

		return parsed.length ? parsed : SNAP_POINTS
	}

	private handleDragStart = (e: MouseEvent | TouchEvent) => {
		if (this.isDesktop || !this.sheetRef) return

		this.dragState.isDragging = true
		const y = 'touches' in e ? e.touches[0].clientY : e.clientY
		this.dragState.startY = y
		this.dragState.startHeight = this.sheetRef.offsetHeight

		document.documentElement.classList.add('is-dragging')
		this.sheetRef.classList.add('is-resizing')
	}

	private handleDragMove = (e: MouseEvent | TouchEvent) => {
		if (!this.dragState.isDragging || !this.sheetRef) return

		e.preventDefault()
		const y = 'touches' in e ? e.touches[0].clientY : e.clientY
		const deltaY = y - this.dragState.startY
		const newHeight = this.dragState.startHeight - deltaY

		const viewportHeight = window.innerHeight
		const snapPoints = this.#getSnapPoints()
		const minHeight = snapPoints[0] * viewportHeight * 0.8
		const maxHeight = snapPoints[snapPoints.length - 1] * viewportHeight * 1.1

		const constrainedHeight = Math.max(minHeight, Math.min(newHeight, maxHeight))
		this.sheetRef.style.height = `${constrainedHeight}px`
		// Update the CSS custom property during drag
		this.sheetHeight = constrainedHeight
		this.updateBottomSheetHeightVar()
		this.#dispatchSnapEvent()
	}

	private handleDragEnd = () => {
		if (!this.dragState.isDragging || !this.sheetRef) return

		this.dragState.isDragging = false
		document.documentElement.classList.remove('is-dragging')
		this.sheetRef.classList.remove('is-resizing')

		const currentHeight = this.sheetRef.offsetHeight
		const snapPoint = this.getClosestSnapPoint(currentHeight)
		const viewportHeight = window.innerHeight
		this.sheetHeight = snapPoint * viewportHeight

		if (!this.isDesktop) this.sheetRef.style.height = `${this.sheetHeight}px`

		this.updateBottomSheetHeightVar()
		this.#dispatchSnapEvent()
	}

	private addEventListeners() {
		// FIXME use modern pointerevents, not legacy mouse and touch events.
		document.addEventListener('mousemove', this.handleDragMove)
		document.addEventListener('touchmove', this.handleDragMove, {passive: false})
		document.addEventListener('mouseup', this.handleDragEnd)
		document.addEventListener('touchend', this.handleDragEnd)
		window.addEventListener('resize', this.handleResize)
	}

	private removeEventListeners() {
		document.removeEventListener('mousemove', this.handleDragMove)
		document.removeEventListener('touchmove', this.handleDragMove)
		document.removeEventListener('mouseup', this.handleDragEnd)
		document.removeEventListener('touchend', this.handleDragEnd)
		window.removeEventListener('resize', this.handleResize)
		this.dragState.isDragging = false
		document.documentElement.classList.remove('is-dragging')
	}

	private animateIn() {
		if (!this.sheetRef) return

		this.isVisible = true
		this.#setShowStyle()
	}

	public hide() {
		if (!this.sheetRef || !this.animateOnExit) return
		this.isVisible = false
		this.#setHideStyle()
	}

	#setHideStyle() {
		this.sheetRef!.classList.remove('is-open')
		document.documentElement.classList.add('panel-collapsed')
		document.documentElement.style.setProperty('--bottom-sheet-panel-width', '0px')
	}

	public show() {
		if (this.animateOnEnter) this.animateIn()
		else {
			this.isVisible = true
			if (this.sheetRef) this.#setShowStyle()
		}
	}

	#setShowStyle() {
		this.sheetRef!.classList.add('is-open')
		document.documentElement.classList.remove('panel-collapsed')
		document.documentElement.style.setProperty('--bottom-sheet-panel-width', '32rem')
	}

	public toggleCollapse() {
		// On mobile, always keep panel open
		if (!this.isDesktop) {
			this.isVisible = true
			if (this.sheetRef) this.#setShowStyle()
			return
		}

		// On desktop, allow toggle
		this.isVisible = !this.isVisible
		if (this.sheetRef) {
			if (this.isVisible) this.#setShowStyle()
			else this.#setHideStyle()

			// Update button title based on parent state
			const button = this.sheetRef.querySelector('.collapse-button')
			if (button) button.setAttribute('title', this.isVisible ? 'Collapse panel' : 'Expand panel')
		}
	}

	private handleDragHandleStart = (e: Event) => {
		this.handleDragStart(e as MouseEvent | TouchEvent)
	}

	override template = () => {
		return html`
			<div
				class="bottom-sheet"
				classList=${() => ({
					'is-open': this.isVisible,
					'disable-scroll': this.disabledScroll,
				})}
				ref="${(el: HTMLElement) => (this.sheetRef = el)}"
				style="${!this.isDesktop && this.sheetHeight ? `height: ${this.sheetHeight}px` : ''}"
			>
				${this.collapseButton
					? html`
							<button class="collapse-button" onclick="${() => this.toggleCollapse()}" title="Collapse panel">
								<div id="pill"></div>
							</button>
						`
					: ''}
				<div class="sheet-content">
					<div
						class="drag-handle"
						onmousedown="${this.handleDragHandleStart}"
						ontouchstart="${this.handleDragHandleStart}"
					>
						<div class="drag-indicator"></div>
					</div>

					<slot></slot>
				</div>
			</div>
		`
	}
	override css = css`
		:host {
			--bottom-sheet-float-direction: flex-start;
			--bottom-sheet-panel-width: 32rem;
			--bottom-sheet-panel-left: 7px;
		}

		:host {
			--bottom-sheet-handle-height: 15px;
			--bottom-sheet-z-index: 50;
			position: fixed;
			bottom: 0;
			left: 5px;
			right: 5px;
			z-index: var(--bottom-sheet-z-index);
			pointer-events: none;
		}

		.bottom-sheet {
			position: fixed;
			bottom: 0;
			left: 0;
			right: 0;
			z-index: 50;
			background: var(--uiColorPrimaryWhite);
			border-top-left-radius: var(--borderRadiusXl);
			border-top-right-radius: var(--borderRadiusXl);
			translate: 0px 100%;
			transition:
				translate var(--transitionTimeFast) ease,
				height var(--transitionTimeFast) ease;
			will-change: translate, height;
			pointer-events: auto;
			display: flex;
			flex-direction: column;
		}

		.bottom-sheet.is-open {
			translate: 0px 0px;
		}

		/* Collapsed state - when NOT open (mobile) */
		.bottom-sheet:not(.is-open) {
			translate: 0px calc(100% - var(--bottom-sheet-handle-height) - 10px);
		}

		.bottom-sheet.is-resizing {
			transition: none;
		}

		.drag-handle {
			width: 100%;
			height: var(--bottom-sheet-handle-height);
			flex: 0 0 var(--bottom-sheet-handle-height);
			display: flex;
			align-items: center;
			justify-content: center;
			cursor: grab;
			touch-action: none;
			padding-bottom: 5px;

			position: sticky;
			z-index: 10;
			top: 0;
			background: var(--uiColorPrimaryWhite);
		}

		.drag-handle:active {
			cursor: grabbing;
		}

		.drag-indicator {
			width: 45px;
			height: 5px;
			background: #d1d5db;
			border-radius: 9999px;
		}

		.collapse-button {
			width: 45px;
			height: 73px;
			position: absolute;
			left: -25px;
			top: 50%;
			transform: translateY(-50%);
			background: transparent;
			border: none;
			cursor: pointer;
			padding: 0;
			/* hidden on mobile by default */
			display: none;
			align-items: center;
			justify-content: center;
			/* TODO store all z-indexes as variables in a source file so we can
			   more easily determine how things layer, and how to adjust items,
			   without having to search all over the code base.
			 */
			z-index: 3000;
		}

		.collapse-button #pill {
			width: 23px;
			height: 55px;
			border-radius: 12px;
			background: white;
			box-shadow: 0px 0px 6px -3px #000f;

			display: flex;
			justify-content: center;
			align-items: center;

			&::before {
				content: '';
				width: 6px;
				height: 6px;
				border-top: 1px solid black;
				border-right: 1px solid black;
				border-width: 2px;
				transition: rotate var(--transitionTimeFast) ease-in-out;
				rotate: 45deg;
				translate: -1px;
			}
		}

		/* When panel is closed, expose button more to the left */
		.bottom-sheet:not(.is-open) .collapse-button {
			translate: -10px;
		}

		/* Flip icon when panel is closed */
		.bottom-sheet:not(.is-open) .collapse-button #pill::before {
			rotate: -135deg;
			translate: 1px;
		}

		.sheet-content {
			/* Keep scroll behavior with flex container */
			padding: 0;
			flex: 1 1 auto;
			min-height: 0;
			overflow-y: auto;
			/* Hide scrollbar for Webkit browsers */
			scrollbar-width: none;
			border-radius: 1rem;
		}

		.bottom-sheet.disable-scroll .sheet-content {
			overflow-y: hidden !important;
		}

		.sheet-content::-webkit-scrollbar {
			display: none;
		}

		.bottom-sheet:not(.is-open) .sheet-content {
			pointer-events: none;
		}

		/* Desktop styles: floating panel on the left, always full viewport height */
		@media (min-width: 768px) {
			:host {
				top: 0;
				height: 100vh;
				height: 100dvh;
				display: flex;
				align-items: center;
				justify-content: var(--bottom-sheet-float-direction);
				padding-left: 0;
				padding-right: 0;
			}
			:host([collapse-button='false']) .bottom-sheet {
				border: unset;
			}
			.bottom-sheet {
				position: relative;
				top: auto;
				bottom: auto;
				left: 7px;
				right: auto;
				border-top-left-radius: var(--borderRadiusXl);
				border-bottom-left-radius: var(--borderRadiusXl);
				border-top-right-radius: 0;
				border: 1px solid #e5e7eb;
				width: var(--bottom-sheet-panel-width, 32rem);
				max-width: calc(100vw - 3rem);
				height: 100vh;
				transition:
					translate var(--transitionDefaultTimeCurve),
					height var(--transitionDefaultTimeCurve);
			}

			.bottom-sheet:not(.is-open) {
				translate: 100% 0px;
			}

			.collapse-button {
				display: flex;
				transition: translate var(--transitionDefaultTimeCurve);
			}

			.drag-handle {
				display: none;
			}
		}
	`
}

type BottomSheetHeaderAttributes = keyof object // no attributes yet
// Bottom sheet header
@element
export class BottomSheetHeader extends Element {
	static override readonly elementName = 'bottom-sheet-header'
	override template = () => {
		return html`
			<div class="bottom-sheet-header">
				<slot></slot>
			</div>
		`
	}
	override css = css`
		:host {
			position: sticky;
			top: 20px;
			background: var(--appBackground);
			z-index: 10;
		}
		@media (min-width: 768px) {
			:host {
				top: 0;
			}
		}
	`
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			[BottomSheet.elementName]: ElementAttributes<BottomSheet, BottomSheetAttributes>
			[BottomSheetHeader.elementName]: ElementAttributes<BottomSheetHeader, BottomSheetHeaderAttributes>
		}
	}
}

declare global {
	interface HTMLElementTagNameMap {
		[BottomSheet.elementName]: BottomSheet
		[BottomSheetHeader.elementName]: BottomSheetHeader
	}
}
