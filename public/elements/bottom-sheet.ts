import {attribute, booleanAttribute, css, Element, element, type ElementAttributes, html, onCleanup} from 'lume'

// Define snap points in percentages of viewport height
const SNAP_POINTS = [0.41, 0.6, 0.9]

type BottomSheetAttributes =
	| 'defaultSnap'
	| 'defaultSheetHeight'
	| 'animateOnEnter'
	| 'animateOnExit'
	| 'floatDirection'
	| 'maxHeight'

@element
export class BottomSheet extends Element {
	static readonly elementName = 'bottom-sheet'

	// Properties
	@attribute defaultSnap: string = ''
	@booleanAttribute isDesktop = false
	@booleanAttribute animateOnEnter = true
	@booleanAttribute animateOnExit = true
	@attribute defaultSheetHeight: string = ''
	@attribute floatDirection: 'left' | 'right' = 'left'
	@attribute maxHeight: string | null = null

	private sheetHeight: number | null = null
	private dragState = {
		isDragging: false,
		startY: 0,
		startHeight: 0,
	}
 
	private sheetRef: HTMLElement | null = null
	private isVisible = false

	connectedCallback() {
		super.connectedCallback()
		this.checkDesktop()
		this.addEventListeners()

		this.createEffect(() => {
			const frame = requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					this.handleResize()
					if (this.animateOnEnter) {
						this.animateIn()
					} else {
						this.isVisible = true
					}
				})
			})

			onCleanup(() => cancelAnimationFrame(frame))
		})

		this.createEffect(() => {
			if (this.floatDirection === 'right') {
				this.style.setProperty('--bottom-sheet-float-direction', 'flex-end')
			} else {
				this.style.setProperty('--bottom-sheet-float-direction', 'flex-start')
			}
		})

		this.createEffect(() => {
			if (this.maxHeight) {
				this.style.setProperty('--bottom-sheet-max-height', this.maxHeight)
			} else {
				this.style.setProperty('--bottom-sheet-max-height', 'calc(100vh - 3rem)')
			}
		})
	}

	disconnectedCallback() {
		super.disconnectedCallback()
		this.removeEventListeners()
	}

	private checkDesktop = () => {
		if (window.innerWidth >= 768) {
			if (!this.isDesktop) {
				this.isDesktop = true
			}
		} else {
			if (this.isDesktop) {
				this.isDesktop = false
			}
		}
	}

	private handleResize = () => {
		this.checkDesktop()
		if (!this.sheetRef) return
		if (!this.isDesktop) {
			const viewportHeight = window.innerHeight
			const defaultHeight = this.#resolveDefaultSheetHeight()
			if (defaultHeight) {
				this.sheetHeight = defaultHeight
			} else {
				const snapFraction = this.#resolveDefaultSnapFraction()
				this.sheetHeight = snapFraction * viewportHeight
			}
			this.sheetRef!.style.height = `${this.sheetHeight}px`
		} else {
			this.sheetRef!.style.height = '100vh'
			this.sheetRef!.style.height = '100dvh'
		}
	}

	#resolveDefaultSnapFraction(): number {
		const raw = (this.defaultSnap ?? '').toString().trim()
		if (!raw) return SNAP_POINTS[0]

		// Support index (e.g., "0", "1", ...)
		if (/^\d+$/.test(raw)) {
			const index = Math.max(0, Math.min(SNAP_POINTS.length - 1, parseInt(raw, 10)))
			return SNAP_POINTS[index]
		}

		// Support percent or decimal (e.g., "55%" or "0.55")
		let fraction = NaN
		if (raw.endsWith('%')) {
			fraction = parseFloat(raw) / 100
		} else {
			fraction = parseFloat(raw)
		}
		if (!isNaN(fraction)) {
			return Math.max(0, Math.min(1, fraction))
		}
		return SNAP_POINTS[0]
	}

	#resolveDefaultSheetHeight(): number | null {
		const raw = (this.defaultSheetHeight ?? '').toString().trim()
		if (!raw) return null

		// Support pixel values (e.g., "400px" or "400")
		const pxMatch = raw.match(/^(\d+)(?:px)?$/)
		if (pxMatch) {
			return parseInt(pxMatch[1], 10)
		}

		// Support viewport height (e.g., "50vh")
		const vhMatch = raw.match(/^(\d+(?:\.\d+)?)vh$/)
		if (vhMatch) {
			return (parseFloat(vhMatch[1]) / 100) * window.innerHeight
		}

		// Support percent (e.g., "50%")
		const percentMatch = raw.match(/^(\d+(?:\.\d+)?)%$/)
		if (percentMatch) {
			return (parseFloat(percentMatch[1]) / 100) * window.innerHeight
		}

		return null
	}

	private getClosestSnapPoint(height: number) {
		const viewportHeight = window.innerHeight
		const currentPos = height / viewportHeight
		return SNAP_POINTS.reduce((prev, curr) => {
			return Math.abs(curr - currentPos) < Math.abs(prev - currentPos) ? curr : prev
		})
	}

	private handleDragStart = (e: MouseEvent | TouchEvent) => {
		if (this.isDesktop || !this.sheetRef) return

		this.dragState.isDragging = true
		const y = 'touches' in e ? e.touches[0].clientY : e.clientY
		this.dragState.startY = y
		this.dragState.startHeight = this.sheetRef.offsetHeight

		document.body.classList.add('is-dragging')
		this.sheetRef.classList.add('is-resizing')
	}

	private handleDragMove = (e: MouseEvent | TouchEvent) => {
		if (!this.dragState.isDragging || !this.sheetRef) return

		e.preventDefault()
		const y = 'touches' in e ? e.touches[0].clientY : e.clientY
		const deltaY = y - this.dragState.startY
		const newHeight = this.dragState.startHeight - deltaY

		const viewportHeight = window.innerHeight
		const minHeight = SNAP_POINTS[0] * viewportHeight * 0.8
		const maxHeight = SNAP_POINTS[SNAP_POINTS.length - 1] * viewportHeight * 1.1

		const constrainedHeight = Math.max(minHeight, Math.min(newHeight, maxHeight))
		this.sheetRef.style.height = `${constrainedHeight}px`
	}

	private handleDragEnd = () => {
		if (!this.dragState.isDragging || !this.sheetRef) return

		this.dragState.isDragging = false
		document.body.classList.remove('is-dragging')
		this.sheetRef.classList.remove('is-resizing')

		const currentHeight = this.sheetRef.offsetHeight
		const snapPoint = this.getClosestSnapPoint(currentHeight)
		const viewportHeight = window.innerHeight
		this.sheetHeight = snapPoint * viewportHeight

		if (!this.isDesktop) {
			this.sheetRef.style.height = `${this.sheetHeight}px`
		}
	}

	private addEventListeners() {
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
		document.body.classList.remove('is-dragging')
	}

	private animateIn() {
		if (!this.sheetRef) return

		this.isVisible = false
		this.sheetRef.classList.remove('is-open')

		// Force a reflow to ensure the transform is applied
		this.sheetRef.offsetHeight

		requestAnimationFrame(() => {
			this.isVisible = true
			this.sheetRef!.classList.add('is-open')
		})
	}

	public animateOut(callback?: () => void) {
		if (!this.sheetRef || !this.animateOnExit) {
			if (callback) callback()
			return
		}

		this.isVisible = false
		this.sheetRef.classList.remove('is-open')

		// Wait for animation to complete
		setTimeout(() => {
			if (callback) callback()
		}, 300) // Match the CSS transition duration
	}

	public hide() {
		this.animateOut()
	}

	public show() {
		if (this.animateOnEnter) {
			this.animateIn()
		} else {
			this.isVisible = true
			if (this.sheetRef) {
				this.sheetRef.classList.add('is-open')
			}
		}
	}

	private handleDragHandleStart = (e: Event) => {
		this.handleDragStart(e as MouseEvent | TouchEvent)
	}

	template = () => {
		return html`
			<div
				class="bottom-sheet"
				classList=${{
					'is-open': this.isVisible,
				}}
				ref="${(el: HTMLElement) => (this.sheetRef = el)}"
				style="${!this.isDesktop && this.sheetHeight ? `height: ${this.sheetHeight}px` : ''}"
			>
				<div
					class="drag-handle"
					onmousedown="${this.handleDragHandleStart}"
					ontouchstart="${this.handleDragHandleStart}"
				>
					<div class="drag-indicator"></div>
				</div>
				<div class="sheet-content">
					<slot></slot>
				</div>
			</div>
		`
	}

	css = css`
		:host {
			--bottom-sheet-float-direction: flex-start;
			--bottom-sheet-max-height: calc(100vh - 3rem);
		}

		:host {
			--bottom-sheet-handle-height: 2rem;
			position: fixed;
			bottom: 0;
			left: 5px;
			right: 5px;
			z-index: 50;
			pointer-events: none;
		}

		body.is-dragging {
			user-select: none;
			cursor: ns-resize;
		}

		.bottom-sheet {
			position: fixed;
			bottom: 0;
			left: 0;
			right: 0;
			z-index: 50;
			background: var(--appBackground);
			border-top: 1px solid #e5e7eb;
			box-shadow: 0 -25px 50px -12px rgba(0, 0, 0, 0.25);
			border-top-left-radius: 1rem;
			border-top-right-radius: 1rem;
			transform: translateY(100%);
			transition:
				transform 0.3s ease-out,
				height 0.3s ease-out;
			will-change: transform, height;
			max-height: calc(100vh - 5px);
			pointer-events: auto;
			display: flex;
			flex-direction: column;
		}

		.bottom-sheet.is-open {
			transform: translateY(0);
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
		}

		.drag-handle:active {
			cursor: grabbing;
		}

		.drag-indicator {
			width: 2.5rem;
			height: 0.375rem;
			background: #d1d5db;
			border-radius: 9999px;
		}

		.sheet-content {
			padding: 0;
			flex: 1 1 auto;
			min-height: 0; /* allow overflow container to shrink */
			overflow-y: auto;
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

			.bottom-sheet {
				position: relative;
				top: auto;
				bottom: auto;
				left: auto;
				right: auto;
				border-radius: 1rem;
				border: 1px solid #e5e7eb;
				width: 24rem;
				padding-top: var(--bottom-sheet-handle-height);
				max-width: calc(100vw - 3rem);
				height: 100vh;
				max-height: var(--bottom-sheet-max-height);
				opacity: 0;
				transform: translateY(1.25rem);
				transition:
					opacity 0.3s ease-out,
					transform 0.3s ease-out;
			}

			.bottom-sheet.is-open {
				opacity: 1;
				transform: translateY(0);
			}

			.drag-handle {
				display: none;
			}

			.sheet-content {
				/* Keep scroll behavior with flex container */
				flex: 1 1 auto;
				min-height: 0;
				overflow-y: auto;
				/* Hide scrollbar for Webkit browsers */
				scrollbar-width: none;
				-ms-overflow-style: none;
			}

			.sheet-content::-webkit-scrollbar {
				display: none;
			}
		}
	`
}

type BottomSheetHeaderAttributes = keyof {}
// Bottom sheet header
@element
export class BottomSheetHeader extends Element {
	static readonly elementName = 'bottom-sheet-header'

	template = () => {
		return html`
			<div class="bottom-sheet-header">
				<slot></slot>
			</div>
		`
	}

	css = css`
		:host {
			position: sticky;
			top: 0;
			background: var(--appBackground);
			z-index: 10;
			border-bottom: 1px solid #e0e1e4;
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
