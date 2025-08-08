import {attribute, booleanAttribute, createEffect, css, Element, element, type ElementAttributes, html} from 'lume'

// Define snap points in percentages of viewport height
const SNAP_POINTS = [0.3, 0.55, 0.9]

type BottomSheetAttributes = 'defaultSnap'

@element
export class BottomSheet extends Element {
	static readonly elementName = 'bottom-sheet'

	// Properties
	sheetHeight: number | null = null
	@attribute defaultSnap: string = ''
	private dragState = {
		isDragging: false,
		startY: 0,
		startHeight: 0,
	}
	@booleanAttribute isDesktop = false
	private sheetRef: HTMLElement | null = null

	connectedCallback() {
		super.connectedCallback()
		this.checkDesktop()
		window.addEventListener('resize', this.checkDesktop)
		this.addEventListeners()
		this.createEffect(() => {
			if (!this.sheetRef) return

			createEffect(() => {
				if (!this.isDesktop) {
					const viewportHeight = window.innerHeight
					const snapFraction = this.#resolveDefaultSnapFraction()
					this.sheetHeight = snapFraction * viewportHeight
					this.sheetRef!.style.height = `${this.sheetHeight}px`
				} else {
					this.sheetRef!.style.height = '50rem'
				}
			})
		})
	}

	disconnectedCallback() {
		super.disconnectedCallback()
		window.removeEventListener('resize', this.checkDesktop)
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
	}

	private removeEventListeners() {
		document.removeEventListener('mousemove', this.handleDragMove)
		document.removeEventListener('touchmove', this.handleDragMove)
		document.removeEventListener('mouseup', this.handleDragEnd)
		document.removeEventListener('touchend', this.handleDragEnd)
		this.dragState.isDragging = false
		document.body.classList.remove('is-dragging')
	}

	private handleDragHandleStart = (e: Event) => {
		this.handleDragStart(e as MouseEvent | TouchEvent)
	}

	template = () => {
		return html`
			<div
				class="bottom-sheet is-open"
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
			--bottom-sheet-handle-height: 2rem;
			position: fixed;
			bottom: 0;
			left: 0;
			right: 0;
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
			max-height: 95vh;
			pointer-events: auto;
			display: flex;
			flex-direction: column;
		}

		:host-context([data-theme='dark']) .bottom-sheet {
			background: var(--appBackgroundDark);
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
			.bottom-sheet {
				top: 1.5rem;
				bottom: 1.5rem;
				left: 1.5rem;
				right: auto;
				border-radius: 1rem;
				border: 1px solid #e5e7eb;
				width: 24rem;
				padding-top: var(--bottom-sheet-handle-height);
				max-width: calc(100vw - 3rem);
				transform: none;
				height: 50rem;
				max-height: calc(100vh - 3rem);
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

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			[BottomSheet.elementName]: ElementAttributes<BottomSheet, BottomSheetAttributes>
		}
	}
}

declare global {
	interface HTMLElementTagNameMap {
		[BottomSheet.elementName]: BottomSheet
	}
}
