import {attribute, css, Element, element, html, signal} from 'lume'
import {store} from '../app/store.js'
import {avatars} from '../consts/avatars.js'
import {spaces} from '../consts/spaces.js'
import {templates} from '../consts/templates.js'
import type {Block, BlockCategory} from '../types/block.js'
import type {Fabric} from '../types/fabric.js'
import type {TemplateCategory} from '../types/template.js'

const block3DLanding = {
	male: [
		{
			_id: '97e8fd99-276e-487a-9201-ec261b465673',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/9heure19heure/blocks/Top/Item_6___Sleeves/sleeves_1592.webp',
			modelFile:
				'https://d1e6s1h8cqcr26.cloudfront.net/models/9heure19heure/blocks/Top/Item_6___Sleeves/sleeves_1592.gltf',
			blockName: 'sleeves 1592',
			avatar: 'male',
			category: 'Sleeves',
			templateId: '92f3b8ff-503c-4511-9700-080600e7dad5',
			templateName: 'Oversized Bomber',
			templateCategory: 'Top',
			collection: '9heure19heure',
		},
		{
			_id: '79494d0c-4117-4ea6-988a-f0cbd8222c15',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/9heure19heure/blocks/Top/Item_6___Bodice/bodice_1591.webp',
			modelFile:
				'https://d1e6s1h8cqcr26.cloudfront.net/models/9heure19heure/blocks/Top/Item_6___Bodice/bodice_1591.gltf',
			blockName: 'bodice 1591',
			avatar: 'male',
			category: 'Bodice',
			templateId: '92f3b8ff-503c-4511-9700-080600e7dad5',
			templateName: 'Oversized Bomber',
			templateCategory: 'Top',
			collection: '9heure19heure',
		},
		{
			_id: '09baaa9d-e04e-45ea-a137-47066fcd05e1',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/9heure19heure/blocks/Pants/Item_8___Pants/pants_1593.webp',
			modelFile:
				'https://d1e6s1h8cqcr26.cloudfront.net/models/9heure19heure/blocks/Pants/Item_8___Pants/pants_1593.gltf',
			blockName: 'pants 1593',
			avatar: 'male',
			category: 'Pants',
			templateId: 'd6d33246-4cb4-413d-ab35-b125ad74ef89',
			templateName: 'Bermuda Short',
			templateCategory: 'Pants',
			collection: '9heure19heure',
		},
	],
	female: [
		{
			_id: '3052f388-1da9-42fe-8cbb-f9f1fbd1412f',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/gap/blocks/Top/Item_2___Sleeves/sleeve__1629.webp',
			modelFile: 'https://d1e6s1h8cqcr26.cloudfront.net/models/gap/blocks/Top/Item_2___Sleeves/sleeve__1629.gltf',
			blockName: 'sleeve 1629',
			avatar: 'female',
			category: 'Sleeves',
			templateId: '9e7cda10-db8a-4c6e-b215-9d09207a207f',
			templateName: 'Bomber jacket',
			templateCategory: 'Top',
			collection: 'gap',
		},
		{
			_id: 'd6d7f828-6cb3-44a2-b4b9-85f81d65a002',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/gap/blocks/Top/Item_2___Bodice/bodice_1628.webp',
			modelFile: 'https://d1e6s1h8cqcr26.cloudfront.net/models/gap/blocks/Top/Item_2___Bodice/bodice_1628.gltf',
			blockName: 'bodice 1628',
			avatar: 'female',
			category: 'Bodice',
			templateId: '9e7cda10-db8a-4c6e-b215-9d09207a207f',
			templateName: 'Bomber jacket',
			templateCategory: 'Top',
			collection: 'gap',
		},
		{
			_id: '02fdaf5d-c75a-494b-bb5f-f2ba1983eb04',
			thumb: 'https://d1e6s1h8cqcr26.cloudfront.net/images/gap/blocks/Pants/Item_1___Pants/pants_1531.webp',
			modelFile: 'https://d1e6s1h8cqcr26.cloudfront.net/models/gap/blocks/Pants/Item_1___Pants/pants_1531.gltf',
			blockName: 'pants 1531',
			avatar: 'female',
			category: 'Pants',
			templateId: '5c645696-f41c-484e-9ddd-8bb127a23663',
			templateName: 'Lazy pants',
			templateCategory: 'Pants',
			collection: 'gap',
		},
	],
}
interface AvatarOption {
	value: string
	label: string
	image: string
	gender: 'male' | 'female'
}
const maleAvatar = new URL(
	'https://d1e6s1h8cqcr26.cloudfront.net/drippy-app/drippy-app-3D/models/male/luka/thumbnail.webp',
	import.meta.url,
).href
const femaleAvatar = new URL(
	'https://d1e6s1h8cqcr26.cloudfront.net/drippy-app/drippy-app-3D/models/female/moidien/thumbnail.webp',
	import.meta.url,
).href
/**
 * Avatar Selector Custom Element with dropdown functionality
 * Allows users to select between different avatar options
 */
@element
export class AvatarSelector extends Element {
	static readonly elementName = 'avatar-selector'

	@attribute targetModel = ''
	@attribute fabricsSelection = []

	@signal private isOpen = false
	private dropdownElement: HTMLElement | null = null
	@signal private selectedOption: AvatarOption = {
		value: 'male',
		label: 'Male avatar',
		image: maleAvatar,
		gender: 'male',
	}

	private options: AvatarOption[] = [
		{
			value: 'male',
			label: 'Male avatar',
			image: maleAvatar,
			gender: 'male',
		},
		{
			value: 'female',
			label: 'Female avatar',
			image: femaleAvatar,
			gender: 'female',
		},
	]

	connectedCallback() {
		super.connectedCallback()
		document.addEventListener('click', this.handleOutsideClick)

		setTimeout(() => {
			this.createDropdownManually()
			// Always set default male avatar when component loads
			this.setDefaultMaleAvatar()
			this.syncWithStore()
		}, 100)

		// Sync with store when avatar changes
		this.createEffect(() => {
			if (store.selectedAvatar) this.syncWithStore()
		})
	}

	/**
	 * Find first avatar follow gender from avatars list
	 */
	private findAvatarByGender(gender: 'male' | 'female'): string | null {
		let avatar

		if (gender === 'male') {
			avatar = avatars.find(avatar => avatar.gender === gender && avatar.name === 'luka')
		} else {
			avatar = avatars.find(avatar => avatar.gender === gender && avatar.name === 'moidien')
		}

		return avatar ? avatar.name : null
	}

	private setDefaultMaleAvatar() {
		const maleAvatarValue = this.findAvatarByGender('male')
		if (maleAvatarValue) {
			store.selectedAvatar = maleAvatarValue

			// Set default space for male avatar
			this.setSpaceForGender('male')

			// Set default blocks for male avatar
			this.setBlocksForGender('male')
		}
	}

	private setSpaceForGender(gender: 'male' | 'female') {
		try {
			// Find the first space for the specified gender
			const spaceForGender = spaces.find(space => space.gender === gender)
			if (spaceForGender) {
				// Always set space when switching gender to ensure shoes are loaded
				store.selectSpace = spaceForGender

				// Hide background scene on landing page (but keep shoes from includedModelFiles)
				store.setIsShowScene = false
			}
		} catch (error) {
			// Error setting space
		}
	}

	private setBlocksForGender(gender: 'male' | 'female') {
		try {
			// Clear existing blocks first
			store.clearSelectedGarments()

			const genderBlocks = block3DLanding[gender]
			const collection = gender === 'male' ? '9heure19heure' : 'gap'

			if (!genderBlocks || genderBlocks.length === 0) {
				return
			}

			const sleevesBlock = genderBlocks.find(block => block.templateCategory === 'Top' && block.category === 'Sleeves')
			const topBlock = genderBlocks.find(block => block.templateCategory === 'Top' && block.category === 'Bodice')
			const shirtBlock = genderBlocks.find(block => block.templateCategory === 'Shirt' && block.category === 'Bodice')
			const pantsBlock = genderBlocks.find(block => block.templateCategory === 'Pants' && block.category === 'Pants')

			const templateData: Array<any> = []
			if (sleevesBlock || topBlock) {
				// Find template by templateId from block
				const templateId = sleevesBlock?.templateId || topBlock?.templateId
				const topTemplate = templates[collection]?.find(t => t._id === String(templateId))
				if (topTemplate) {
					templateData.push(topTemplate)
				}
			}
			if (shirtBlock) {
				// Find template by templateId from block
				const templateId = shirtBlock.templateId
				const shirtTemplate = templates[collection]?.find(t => t._id === String(templateId))
				if (shirtTemplate) {
					templateData.push(shirtTemplate)
				}
			}
			if (pantsBlock) {
				// Find template by templateId from block
				const templateId = pantsBlock.templateId
				const pantsTemplate = templates[collection]?.find(t => t._id === String(templateId))
				if (pantsTemplate) {
					templateData.push(pantsTemplate)
				}
			}

			// Set templates to store
			if (templateData.length > 0) {
				store.selectedTemplates = Object.fromEntries(templateData.map(t => [t.category, t]))
			}

			const blockData: Array<{block: Block; templateCategory: TemplateCategory}> = []
			const fabricData: Array<{
				fabric: Fabric
				blockCategory: BlockCategory
				templateCategory: TemplateCategory
				assignedMesh: string
			}> = []

			const selection = this.fabricsSelection
			const defaultFabric = Array.isArray(selection) && selection.length > 0 ? (selection[0] as Fabric) : null

			const pushBlock = (block: any, templateCategoryOverride?: TemplateCategory) => {
				if (!block) return

				const templateCategory = (templateCategoryOverride ?? block.templateCategory) as TemplateCategory
				const normalizedBlock = {...block, templateId: String(block.templateId)} as Block

				blockData.push({
					block: normalizedBlock,
					templateCategory,
				})

				if (!defaultFabric) return

				fabricData.push({
					fabric: {...defaultFabric},
					blockCategory: normalizedBlock.category as BlockCategory,
					templateCategory,
					assignedMesh: defaultFabric.assignedMesh ?? 'default',
				})
			}

			pushBlock(topBlock)
			pushBlock(sleevesBlock)
			pushBlock(shirtBlock)
			pushBlock(pantsBlock, 'Pants' as TemplateCategory)

			if (blockData.length > 0) {
				store.setSelectedBlocks(blockData)

				if (fabricData.length > 0) {
					store.setSelectedFabrics = fabricData
				}
			}
		} catch (error) {
			// Error setting blocks
		}
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

			// Create dot element
			const dotEl = document.createElement('div')
			dotEl.className = 'avatar-selector__option-dot'
			dotEl.style.width = '8px'
			dotEl.style.height = '8px'
			dotEl.style.backgroundColor = '#8b5cf6'
			dotEl.style.borderRadius = '50%'
			dotEl.style.flexShrink = '0'

			// Create label span
			const labelSpan = document.createElement('span')
			labelSpan.style.flex = '1'
			labelSpan.textContent = option.label

			// Create checkmark span
			const checkmarkSpan = document.createElement('span')
			checkmarkSpan.className = 'checkmark'
			checkmarkSpan.style.color = '#8b5cf6'
			checkmarkSpan.style.fontWeight = 'bold'
			checkmarkSpan.style.fontSize = '14px'
			checkmarkSpan.textContent = '✓'
			checkmarkSpan.style.display = option.value === this.selectedOption.value ? 'inline' : 'none'

			// Append elements
			optionEl.appendChild(dotEl)
			optionEl.appendChild(labelSpan)
			optionEl.appendChild(checkmarkSpan)

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

		// Hide dropdown
		const dropdown = this.dropdownElement || (this.querySelector('.avatar-selector__dropdown') as HTMLElement)
		const icon = this.querySelector('.avatar-selector__icon') as HTMLElement
		if (dropdown) {
			dropdown.style.display = 'none'
		}
		if (icon) {
			icon.classList.remove('rotated')
		}

		// Update checkmarks in dropdown
		this.updateCheckmarks()

		const avatarValue = this.findAvatarByGender(option.gender)

		if (avatarValue) {
			store.selectedAvatar = avatarValue

			// Set default space for selected gender
			this.setSpaceForGender(option.gender)

			// Set default blocks cho gender được chọn
			this.setBlocksForGender(option.gender)
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

	private updateCheckmarks() {
		const dropdown = this.dropdownElement || (this.querySelector('.avatar-selector__dropdown') as HTMLElement)
		if (!dropdown) return

		const options = dropdown.querySelectorAll('.avatar-selector__option')
		options.forEach((optionEl, index) => {
			const checkmark = optionEl.querySelector('.checkmark') as HTMLElement
			const option = this.options[index]

			if (checkmark && option) {
				checkmark.style.display = option.value === this.selectedOption.value ? 'inline' : 'none'
			}
		})
	}

	template = () => html`
		<div class="avatar-selector__wrapper" onclick=${this.handleToggle}>
			<div class="avatar-image-wrapper">
				<img class="avatar-image" src=${() => this.selectedOption.image} alt=${() => this.selectedOption.label} />
			</div>
			<span class="avatar-selector__text">${() => this.selectedOption.label}</span>
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
						${() => (option.value === this.selectedOption.value ? html`<span class="checkmark">✓</span>` : '')}
					</div>
				`,
			)}
		</div>
	`

	css = css`
		:host {
			height: 43px;
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
			z-index: 2;
			min-width: 120px;
			display: none;
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
			padding-right: 15px;
		}

		.avatar-image-wrapper {
			position: relative;
			width: 40px;
			height: 40px;
			overflow: hidden;
			border-radius: var(--borderRadiusCircular);
			border: 2px solid var(--uiColorBorderColor);
		}
		.avatar-image {
			width: 100%;
			height: 100%;
			object-fit: cover;
			object-position: top;
			position: absolute;
			scale: 2;
			top: 48%;
			left: 0;
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

	public getSelectedGender() {
		return this.selectedOption.gender
	}

	public selectByValue(value: string) {
		const option = this.options.find(opt => opt.value === value)
		if (option) {
			this.handleSelect(option)
		}
	}

	public selectByGender(gender: 'male' | 'female') {
		const option = this.options.find(opt => opt.gender === gender)
		if (option) {
			this.handleSelect(option)
		}
	}

	/**
	 * Sync với store hiện tại - set avatar selector theo avatar đã chọn trong store
	 */
	public syncWithStore() {
		const currentAvatar = store.selectedAvatar
		const avatar = avatars.find(avatar => avatar.name === currentAvatar)

		if (avatar) {
			const option = this.options.find(opt => opt.gender === avatar.gender)
			if (option) {
				this.selectedOption = option
				// Update checkmarks in dropdown
				this.updateCheckmarks()
			}
		}
	}

	/**
	 * Public method để set default male avatar
	 */
	public setDefaultMale() {
		this.setDefaultMaleAvatar()
	}

	/**
	 * Debug method để kiểm tra trạng thái hiện tại
	 */
	public debugState() {
		// Debug state method
	}
}
