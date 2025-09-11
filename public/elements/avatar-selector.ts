import {attribute, css, Element, element, html} from 'lume'

interface AvatarOption {
	value: string
	label: string
	image: string
}
const maleAvatar = new URL('../images/landing/male.png', import.meta.url).href
const femaleAvatar = new URL('../images/landing/female.png', import.meta.url).href
/**
 * Avatar Selector Custom Element with dropdown functionality
 * Allows users to select between different avatar options
 */
@element
export class AvatarSelector extends Element {
	static readonly elementName = 'avatar-selector'

	@attribute targetModel = ''

	private isOpen = false
	private dropdownElement: HTMLElement | null = null
	private selectedOption: AvatarOption = {
		value: 'male',
		label: 'Male avatar',
		image: maleAvatar,
	}

	private options: AvatarOption[] = [
		{
			value: 'male',
			label: 'Male avatar',
			image: maleAvatar,
		},
		{
			value: 'female',
			label: 'Female avatar',
			image: femaleAvatar,
		},
	]

	connectedCallback() {
		super.connectedCallback()

		// Close dropdown when clicking outside
		document.addEventListener('click', this.handleOutsideClick)

		// Create dropdown manually as backup
		setTimeout(() => {
			this.createDropdownManually()
		}, 100)
	}

	private createDropdownManually() {
		// Clear existing content
		this.innerHTML = ''

		// Create wrapper
		const wrapper = document.createElement('div')
		wrapper.className = 'avatar-selector__wrapper'

		// Create dot
		const dot = document.createElement('div')
		dot.className = 'avatar-selector__dot'

		// Create text
		const text = document.createElement('span')
		text.className = 'avatar-selector__text'
		text.textContent = this.selectedOption.label

		// Create icon
		const icon = document.createElement('img')
		icon.className = 'avatar-selector__icon'
		icon.src = 'https://c.animaapp.com/mejigj1rAIvhIh/img/vector-1.svg'
		icon.alt = 'Avatar selection dropdown'

		// Add click handler to wrapper
		wrapper.addEventListener('click', this.handleToggle)

		// Assemble wrapper
		wrapper.appendChild(dot)
		wrapper.appendChild(text)
		wrapper.appendChild(icon)

		// Create dropdown
		const dropdown = document.createElement('div')
		dropdown.className = 'avatar-selector__dropdown'
		dropdown.style.display = 'none'

		// Add options
		this.options.forEach(option => {
			const optionEl = document.createElement('div')
			optionEl.className = 'avatar-selector__option'
			if (option.value === this.selectedOption.value) {
				optionEl.classList.add('selected')
			}

			optionEl.style.display = 'flex'
			optionEl.style.alignItems = 'center'
			optionEl.style.gap = '8px'
			optionEl.style.padding = '12px 16px'
			optionEl.style.cursor = 'pointer'
			optionEl.style.transition = 'background-color 0.15s ease'
			optionEl.style.fontSize = '0.75rem'
			optionEl.style.color = '#111827'

			optionEl.innerHTML = `
				<div class="avatar-selector__option-dot" style="width: 8px; height: 8px; background-color: #8b5cf6; border-radius: 50%; flex-shrink: 0;"></div>
				<span style="flex: 1;">${option.label}</span>
				${option.value === this.selectedOption.value ? '<span class="checkmark" style="color: #8b5cf6; font-weight: bold; font-size: 14px;">✓</span>' : ''}
			`

			// Hover effect
			optionEl.addEventListener('mouseenter', () => {
				optionEl.style.backgroundColor = '#f8fafc'
			})
			optionEl.addEventListener('mouseleave', () => {
				optionEl.style.backgroundColor = option.value === this.selectedOption.value ? '#f1f5f9' : 'transparent'
			})

			optionEl.addEventListener('click', e => {
				e.stopPropagation()
				this.handleSelect(option)
			})
			dropdown.appendChild(optionEl)
		})

		// Add wrapper to component, dropdown to body
		this.appendChild(wrapper)
		document.body.appendChild(dropdown)

		// Store reference for cleanup
		this.dropdownElement = dropdown
	}

	private handleOutsideClick = (e: Event) => {
		if (!this.contains(e.target as Node)) {
			this.isOpen = false
		}
	}

	private handleToggle = (e: Event) => {
		e.stopPropagation()
		this.isOpen = !this.isOpen

		// Wait for DOM to be ready
		setTimeout(() => {
			const dropdown = this.dropdownElement || (this.querySelector('.avatar-selector__dropdown') as HTMLElement)
			const icon = this.querySelector('.avatar-selector__icon') as HTMLElement

			if (dropdown && icon) {
				if (this.isOpen) {
					// Get selector position for fixed positioning
					const rect = this.getBoundingClientRect()

					dropdown.style.display = 'block'
					dropdown.style.visibility = 'visible'
					dropdown.style.opacity = '1'
					dropdown.style.position = 'fixed'
					dropdown.style.top = `${rect.bottom + 8}px`
					dropdown.style.left = `${rect.left}px`
					dropdown.style.width = `${Math.max(rect.width, 180)}px`
					dropdown.style.zIndex = '9999'
					dropdown.style.background = '#ffffff'
					dropdown.style.border = '1px solid #e5e7eb'
					dropdown.style.borderRadius = '12px'
					dropdown.style.boxShadow =
						'0px 10px 38px -10px rgba(22, 23, 24, 0.35), 0px 10px 20px -15px rgba(22, 23, 24, 0.2)'
					dropdown.style.overflow = 'hidden'
					dropdown.style.animation = 'slideDown 0.2s ease-out'

					icon.classList.add('rotated')
				} else {
					dropdown.style.display = 'none'
					dropdown.style.visibility = 'hidden'
					dropdown.style.opacity = '0'
					icon.classList.remove('rotated')
				}
			}
		}, 50)
	}

	disconnectedCallback() {
		super.disconnectedCallback()
		document.removeEventListener('click', this.handleOutsideClick)

		// Remove dropdown from body
		if (this.dropdownElement && this.dropdownElement.parentNode) {
			this.dropdownElement.parentNode.removeChild(this.dropdownElement)
		}
	}

	private handleSelect = (option: AvatarOption) => {
		this.selectedOption = option
		this.isOpen = false

		// Update text display
		const text = this.querySelector('.avatar-selector__text')
		if (text) {
			text.textContent = option.label
		}

		// Hide dropdown
		const dropdown = this.dropdownElement || (this.querySelector('.avatar-selector__dropdown') as HTMLElement)
		const icon = this.querySelector('.avatar-selector__icon') as HTMLElement
		if (dropdown) {
			dropdown.style.display = 'none'
		}
		if (icon) {
			icon.classList.remove('rotated')
		}

		// Update target model if specified
		if (this.targetModel) {
			const targetElement = document.querySelector(this.targetModel) as HTMLImageElement
			if (targetElement) {
				targetElement.src = option.image
				targetElement.alt = option.label
			}
		}

		// Dispatch custom event
		this.dispatchEvent(
			new CustomEvent('avatar-change', {
				detail: option,
				bubbles: true,
			}),
		)
	}

	template = () => html`
		<div class="avatar-selector__wrapper" onclick=${this.handleToggle}>
			<img class="avatar-selector__avatar" src=${this.selectedOption.image} alt=${this.selectedOption.label} />
			<span class="avatar-selector__text">${this.selectedOption.label}</span>
			<img
				class="avatar-selector__icon"
				src="https://c.animaapp.com/mejigj1rAIvhIh/img/vector-1.svg"
				alt="Avatar selection dropdown"
			/>
		</div>
		<div class="avatar-selector__dropdown" style="display: none;">
			${this.options.map(
				option => html`
					<div
						class="avatar-selector__option"
						onclick=${(e: Event) => {
							e.stopPropagation()
							this.handleSelect(option)
						}}
					>
						<img class="avatar-selector__option-avatar" src=${option.image} alt=${option.label} />
						<span>${option.label}</span>
						${option.value === this.selectedOption.value ? html`<span class="checkmark">✓</span>` : ''}
					</div>
				`,
			)}
		</div>
	`

	css = css`
		:host {
			height: 35px;
			padding: 0;
			position: absolute;
			top: 3%;
			left: 3%;
			background-color: #ffffff;
			border-radius: 100px;
			border: 1px solid #e5e7eb;
			box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.05);
			display: flex;
			align-items: center;
			overflow: visible;
			cursor: pointer;
			transition: all 0.3s ease;
			z-index: 9;
			min-width: 120px;
		}

		:host(:hover) {
			background-color: #8b5cf6;
		}

		:host(:hover) .avatar-selector__text {
			color: #ffffff;
		}

		.avatar-selector__wrapper {
			display: flex;
			align-items: center;
			gap: 7px;
			width: 100%;
			padding: 15px;
		}

		.avatar-selector__avatar {
			width: 24px;
			height: 24px;
			border-radius: 50%;
			object-fit: cover;
			flex-shrink: 0;
		}

		.avatar-selector__text {
			font-weight: 500;
			color: #111827;
			font-size: 0.75rem;
			flex: 1;
			background: transparent;
		}

		.avatar-selector__icon {
			width: 12px;
			height: 12px;
			flex-shrink: 0;
			transition: transform 0.2s ease;
		}

		.avatar-selector__icon.rotated {
			transform: rotate(180deg);
		}

		.avatar-selector__dropdown {
			position: absolute;
			top: calc(100% + 8px);
			left: 0;
			right: 0;
			background: #ffffff;
			border: 1px solid #e5e7eb;
			border-radius: 16px;
			box-shadow:
				0px 10px 38px -10px rgba(22, 23, 24, 0.35),
				0px 10px 20px -15px rgba(22, 23, 24, 0.2);
			overflow: hidden;
			z-index: 1000;
			animation: slideDown 0.2s ease-out;
		}

		@keyframes slideDown {
			from {
				opacity: 0;
				transform: translateY(-8px);
			}
			to {
				opacity: 1;
				transform: translateY(0);
			}
		}

		.avatar-selector__option {
			display: flex;
			align-items: center;
			gap: 8px;
			padding: 12px 16px;
			cursor: pointer;
			transition: background-color 0.15s ease;
			font-size: 0.75rem;
			color: #111827;
			position: relative;
		}

		.avatar-selector__option:hover {
			background-color: #f8fafc;
		}

		.avatar-selector__option.selected {
			background-color: #f1f5f9;
		}

		.avatar-selector__option-avatar {
			width: 20px;
			height: 20px;
			border-radius: 50%;
			object-fit: cover;
			flex-shrink: 0;
		}

		.checkmark {
			margin-left: auto;
			color: #8b5cf6;
			font-weight: bold;
			font-size: 14px;
		}

		/* Global keyframes for dropdown animation */
		@keyframes slideDown {
			from {
				opacity: 0;
				transform: translateY(-8px);
			}
			to {
				opacity: 1;
				transform: translateY(0);
			}
		}
	`

	// Public API methods
	public setOptions(options: AvatarOption[]) {
		this.options = options
		this.selectedOption = options[0] || this.selectedOption
	}

	public getSelectedValue() {
		return this.selectedOption.value
	}

	public selectByValue(value: string) {
		const option = this.options.find(opt => opt.value === value)
		if (option) {
			this.handleSelect(option)
		}
	}
}
