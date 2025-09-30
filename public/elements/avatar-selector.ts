import {attribute, css, Element, element, html, signal} from 'lume'
import {store} from '../app/store.js'
import {avatars} from '../consts/avatars.js'
import {fabrics} from '../consts/fabrics.js'
import {templates} from '../consts/templates.js'
import type {TemplateCategory} from '../types/template.js'
import type {Block} from '../types/block.js'
// import type {Fabric} from '../types/fabric.js'

const block3DLanding = {
	male: [
		{
			_id: '4',
			thumb:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/images/eliseF/blocks/Top/Item_4_Sleeves/sleeves_1512.webp',
			modelFile:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/models/eliseF/blocks/Top/Item_4_Sleeves/sleeves_1512.gltf',
			blockName: 'sleeves 1512',
			avatar: 'Male',
			category: 'Sleeves',
			templateId: '3',
			templateName: 'Item 4',
			templateCategory: 'Top',
		},
		{
			_id: '5',
			thumb:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/images/eliseF/blocks/Top/Item_4_Bodice/bodice_1509.webp',
			modelFile:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/models/eliseF/blocks/Top/Item_4_Bodice/bodice_1509.gltf',
			blockName: 'bodice 1509',
			avatar: 'Male',
			category: 'Bodice',
			templateId: '3',
			templateName: 'Item 4',
			templateCategory: 'Top',
		},
		{
			_id: '14',
			thumb:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/images/eliseF/blocks/Pants/Item_7___Pants/pants%2Cskirt_1590.webp',
			modelFile:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/models/eliseF/blocks/Pants/Item_7___Pants/pants%2Cskirt_1590.gltf',
			blockName: 'pants,skirt 1590',
			avatar: 'Male',
			category: 'Pants',
			templateId: '9',
			templateName: 'Item 7',
			templateCategory: 'Pants',
		},
	],
	female: [
		{
			_id: '14',
			thumb:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/images/moidien/blocks/Shirt/Item_8___Bodice/bodice_1455.png',
			modelFile:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/models/moidien/blocks/Shirt/Item_8___Bodice/bodice_1455..gltf',
			blockName: 'bodice 1455',
			avatar: 'Female',
			category: 'Bodice',
			templateId: 'Item 8',
			templateName: 'Item 8',
			templateCategory: 'Shirt',
		},
		{
			_id: '15',
			thumb:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/images/moidien/blocks/Pants/Item_7_Pants/pants_130.png',
			modelFile:
				'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/models/moidien/blocks/Pants/Item_7_Pants/pants_130..gltf',
			blockName: 'pants 130',
			avatar: 'Female',
			category: 'Pants',
			templateId: 'Item 7',
			templateName: 'Item 7',
			templateCategory: 'Pants',
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
	'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/models/male/luka/thumbnail.webp',
	import.meta.url,
).href
const femaleAvatar = new URL(
	'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/models/female/moidien/thumbnail.webp',
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
			this.syncWithStore()
		}, 100)

		this.createEffect(() => {
			const currentAvatar = store.selectedAvatar || store.tempSelectedAvatar
			if (currentAvatar) {
				this.syncWithStore()
			}
		})
	}

	/**
	 * Find first avatar follow gender from avatars list
	 */
	private findAvatarByGender(gender: 'male' | 'female'): string | null {
		let avatar

		if (gender === 'male') {
			avatar = avatars.find(avatar => avatar.gender === gender && avatar.value === 'luka')
		} else {
			avatar = avatars.find(avatar => avatar.gender === gender && avatar.value === 'moidien')
		}

		return avatar ? avatar.value : null
	}

	private setDefaultMaleAvatar() {
		if (!store.selectedAvatar && !store.tempSelectedAvatar) {
			const maleAvatarValue = this.findAvatarByGender('male')
			if (maleAvatarValue) {
				store.setTempSelectedAvatar = maleAvatarValue
				store.selectAvatar = maleAvatarValue

				// Set default blocks for male avatar
				this.setBlocksForGender('male')
			}
		}
	}

	private setBlocksForGender(gender: 'male' | 'female') {
		try {
			// Clear existing blocks first
			store.selectedBlocks.clear()

			const genderBlocks = block3DLanding[gender]
			const collection = gender === 'male' ? 'eliseF' : 'moidien'

			if (!genderBlocks || genderBlocks.length === 0) {
				return
			}

			const sleevesBlock = genderBlocks.find(block => block.templateCategory === 'Top' && block.category === 'Sleeves')
			const topBlock = genderBlocks.find(block => block.templateCategory === 'Top' && block.category === 'Bodice')
			const shirtBlock = genderBlocks.find(block => block.templateCategory === 'Shirt' && block.category === 'Bodice')
			const pantsBlock = genderBlocks.find(block => block.templateCategory === 'Pants' && block.category === 'Pants')

			// Set templates first (giống blocks-selection logic) - dùng templateId từ blocks
			const templateData: Array<any> = []
			if (sleevesBlock || topBlock) {
				// Find template by templateId from block
				const templateId = sleevesBlock?.templateId || topBlock?.templateId
				const topTemplate = templates[collection]?.find(t => t._id === templateId)
				if (topTemplate) {
					templateData.push(topTemplate)
				}
			}
			if (shirtBlock) {
				// Find template by templateId from block
				const templateId = shirtBlock.templateId
				const shirtTemplate = templates[collection]?.find(t => t._id === templateId)
				if (shirtTemplate) {
					templateData.push(shirtTemplate)
				}
			}
			if (pantsBlock) {
				// Find template by templateId from block
				const templateId = pantsBlock.templateId
				const pantsTemplate = templates[collection]?.find(t => t._id === templateId)
				if (pantsTemplate) {
					templateData.push(pantsTemplate)
				}
			}

			// Set templates to store
			if (templateData.length > 0) {
				store.selectedTemplates = new Map(templateData.map(t => [t.category, t]))
			}

			// Force set blocks for selected gender
			const blockData: Array<{block: Block; templateCategory: TemplateCategory}> = []
			if (sleevesBlock) {
				blockData.push({
					block: sleevesBlock as Block,
					templateCategory: sleevesBlock.templateCategory as TemplateCategory,
				})
			}
			if (topBlock) {
				blockData.push({
					block: topBlock as Block,
					templateCategory: topBlock.templateCategory as TemplateCategory,
				})
			}
			if (shirtBlock) {
				blockData.push({
					block: shirtBlock as Block,
					templateCategory: shirtBlock.templateCategory as TemplateCategory,
				})
			}
			if (pantsBlock) {
				blockData.push({
					block: pantsBlock as Block,
					templateCategory: 'Pants' as TemplateCategory,
				})
			}

			if (blockData.length > 0) {
				store.setSelectedBlocks = blockData
				// Apply màu cho tất cả blocks sau khi set
				this.applyFabricsToAllBlocks(gender)
			}
		} catch (error) {
			// Error setting blocks
		}
	}

	// private setDefaultFabricsForGender(gender: 'male' | 'female') {
	// 	try {
	// 		const collection = gender === 'male' ? 'eliseF' : 'moidien'
	// 		const availableFabrics = fabrics[collection] || []

	// 		const fabricData = []

	// 		if (gender === 'female') {
	// 			// Find Black fabric for Pants - prioritize one with Pants in templateCategories
	// 			const pantsFabric =
	// 				availableFabrics.find(f => f.materialName === 'Black' && f.templateCategories?.includes('Pants')) ||
	// 				availableFabrics.find(f => f.materialName === 'Black')

	// 			if (pantsFabric) {
	// 				fabricData.push({
	// 					fabric: pantsFabric,
	// 					blockCategory: 'Pants' as BlockCategory,
	// 					templateCategory: 'Pants' as TemplateCategory,
	// 				})
	// 			}
	// 		} else if (gender === 'male') {
	// 			// Set default fabrics for male
	// 			const pantsFabric = availableFabrics.find(
	// 				f => f.materialName === 'Dusty Blue' && f.templateCategories?.includes('Pants'),
	// 			)

	// 			if (pantsFabric) {
	// 				fabricData.push({
	// 					fabric: pantsFabric,
	// 					blockCategory: 'Pants' as BlockCategory,
	// 					templateCategory: 'Pants' as TemplateCategory,
	// 				})
	// 			}
	// 		}

	// 		if (fabricData.length > 0) {
	// 			store.setSelectedFabrics = fabricData
	// 		}
	// 	} catch (error) {
	// 		console.error(`❌ Error setting fabrics for ${gender}:`, error)
	// 	}
	// }

	private applyFabricsToAllBlocks(gender: 'male' | 'female') {
		try {
			const collection = gender === 'male' ? 'eliseF' : 'moidien'
			const availableFabrics = fabrics[collection] || []

			// Apply fabric cho tất cả blocks
			const allBlocks = store.selectedBlocks

			for (const [templateCategory, blocksMap] of allBlocks) {
				// Lấy selectedTemplate để có category chính xác
				const selectedTemplate = store.selectedTemplates.get(templateCategory)

				// Áp dụng fabric cho tất cả block categories của template này (giống blockManager logic)
				const actualBlockCategories = Array.from(blocksMap.keys())

				// Kiểm tra xem template này đã có fabric chưa
				const existingFabrics = store.selectedFabrics.get(templateCategory)

				// Chỉ apply fabric cho blocks chưa có fabric
				const blocksNeedingFabric = actualBlockCategories.filter(blockCategory => {
					const hasFabric = (existingFabrics?.get(blockCategory)?.size ?? 0) > 0
					return !hasFabric
				})

				// Debug: Log để hiểu tại sao không apply fabric
				console.log('Debug applyFabricsToAllBlocks:', {
					gender,
					templateCategory,
					selectedTemplate: selectedTemplate ? 'exists' : 'null',
					actualBlockCategories,
					blocksNeedingFabric,
					existingFabrics: existingFabrics?.size ?? 0,
					availableFabrics: availableFabrics.length,
					selectedTemplatesKeys: Array.from(store.selectedTemplates.keys()),
				})

				if (selectedTemplate) {
					const fabricData: Array<{fabric: any; blockCategory: any; templateCategory: any; assignedMesh?: string}> = []

					// Apply main fabric từ materialId (giống blockManager logic)
					if (selectedTemplate.materialId) {
						const mainFabric = availableFabrics.find(
							fabric => `${fabric.category} - ${fabric.materialName}` === selectedTemplate.materialId,
						)

						if (mainFabric) {
							// Apply main fabric cho tất cả blocks cần fabric
							for (const blockCategory of blocksNeedingFabric) {
								fabricData.push({
									fabric: mainFabric,
									blockCategory: blockCategory,
									templateCategory: templateCategory,
									assignedMesh: 'default',
								})
							}
						}
					}

					// Apply extra materials (giống blockManager logic)
					if (selectedTemplate.extraMaterials) {
						for (const extraMaterial of selectedTemplate.extraMaterials) {
							const extraFabric = availableFabrics.find(
								fabric => `${fabric.category} - ${fabric.materialName}` === extraMaterial.materialId,
							)

							if (extraFabric) {
								// Apply extra fabric cho tất cả blocks cần fabric
								for (const blockCategory of blocksNeedingFabric) {
									fabricData.push({
										fabric: extraFabric,
										blockCategory: blockCategory,
										templateCategory: templateCategory,
										assignedMesh: extraMaterial.mesh,
									})
								}
							}
						}
					}

					// Fallback: nếu không tìm thấy fabric theo materialId, dùng templateCategories
					if (fabricData.length === 0) {
						const suitableFabrics = availableFabrics.filter(fabric =>
							fabric.templateCategories?.includes(selectedTemplate.category || templateCategory),
						)

						if (suitableFabrics.length > 0) {
							const selectedFabric = suitableFabrics[0]

							for (const blockCategory of blocksNeedingFabric) {
								fabricData.push({
									fabric: selectedFabric,
									blockCategory: blockCategory,
									templateCategory: templateCategory,
									assignedMesh: 'default',
								})
							}
						}
					}

					// Set fabrics
					if (fabricData.length > 0) {
						store.setSelectedFabrics = fabricData
					}
				} else {
					// Fallback: nếu không có selectedTemplate, apply fabric đầu tiên có sẵn
					console.log('No selectedTemplate found, using fallback fabric')
					if (blocksNeedingFabric.length > 0 && availableFabrics.length > 0) {
						const fallbackFabric = availableFabrics[0]
						const fabricData = blocksNeedingFabric.map(blockCategory => ({
							fabric: fallbackFabric,
							blockCategory: blockCategory,
							templateCategory: templateCategory,
							assignedMesh: 'default',
						}))

						if (fabricData.length > 0) {
							store.setSelectedFabrics = fabricData
						}
					}
				}
			}
		} catch (error) {
			// Error applying fabrics
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
			store.setTempSelectedAvatar = avatarValue
			store.selectAvatar = avatarValue

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
		const currentAvatar = store.selectedAvatar || store.tempSelectedAvatar

		if (currentAvatar) {
			const avatar = avatars.find(avatar => avatar.value === currentAvatar)

			if (avatar) {
				const option = this.options.find(opt => opt.gender === avatar.gender)
				if (option) {
					this.selectedOption = option
					// Update checkmarks in dropdown
					this.updateCheckmarks()
				}
			}
		} else {
			// Nếu không có avatar nào được chọn, set default male
			this.setDefaultMaleAvatar()
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
