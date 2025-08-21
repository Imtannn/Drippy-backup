export function createDatePicker(options: {
	id: string
	placeholder: string
	min: string
	max: string
	onChange?: (value: string) => void
}) {
	const {id, placeholder, min, max, onChange} = options

	// Generate data
	const years: number[] = []
	const maxYear = new Date(max).getFullYear()
	const minYear = new Date(min).getFullYear()
	for (let year = maxYear; year >= minYear; year--) {
		years.push(year)
	}

	const months = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December',
	]

	const days = []
	for (let day = 1; day <= 31; day++) {
		days.push(day)
	}

	// State
	let selectedDay = 27
	let selectedMonth = 6 // July (0-indexed)
	let selectedYear = 2009

	// Create container
	const container = document.createElement('div')
	container.style.position = 'relative'

	// Create input
	const input = document.createElement('div')
	input.id = id
	input.style.cssText = `
		width: 100%;
		padding: 10px;
		border-radius: 10px;
		font-size: 16px;
		box-sizing: border-box;
		background: white;
		border: 2px solid #E56BE8;
		color: #333;
		transition: all 0.3s ease;
		cursor: pointer;
		display: flex;
		justify-content: space-between;
		align-items: center;
		min-height: 44px;
	`

	// Create date text
	const dateText = document.createElement('span')
	dateText.textContent = placeholder
	dateText.style.cssText = `
		flex: 1;
		text-align: left;
		color: #999;
	`

	// Create arrow
	const arrow = document.createElement('span')
	arrow.textContent = '▼'
	arrow.style.cssText = `
		font-size: 14px;
		color: #666;
	`

	input.appendChild(dateText)
	input.appendChild(arrow)

	// Create date picker container (fixed bottom overlay)
	const datePickerContainer = document.createElement('div')
	datePickerContainer.style.cssText = `
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background: #f5f5f5;
		border-radius: 12px 12px 0 0;
		box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
		height: 300px;
		overflow: hidden;
		z-index: 1000;
	`

	// Create content container
	const content = document.createElement('div')
	content.style.cssText = `
		display: flex;
		height: 100%;
		overflow: hidden;
		position: relative;
	`

	// Create selection indicator (the gray bar in the middle)
	const selectionIndicator = document.createElement('div')
	selectionIndicator.style.cssText = `
		position: absolute;
		top: 50%;
		left: 0;
		right: 0;
		height: 60px;
		background: rgba(0, 0, 0, 0.08);
		transform: translateY(-50%);
		pointer-events: none;
		z-index: 1;
		border-radius: 8px;
		margin: 0 4px;
	`

	// Function to create a wheel column
	function createWheelColumn(items: any[], onSelect: (index: number) => void) {
		const column = document.createElement('div')
		column.style.cssText = `
			flex: 1;
			overflow-y: auto;
			scroll-snap-type: y mandatory;
			text-align: center;
			position: relative;
			background: white;
			z-index: 2;
			perspective: 1000px;
		`

		// Add padding to center items
		const topPadding = document.createElement('div')
		topPadding.style.height = '120px'
		column.appendChild(topPadding)

		// Create items
		items.forEach((item, index) => {
			const itemEl = document.createElement('div')
			itemEl.textContent = typeof item === 'string' ? item : item.toString()
			itemEl.style.cssText = `
				height: 60px;
				line-height: 60px;
				scroll-snap-align: center;
				font-size: 18px;
				color: #666;
				background: transparent;
				font-weight: normal;
				cursor: pointer;
				transition: all 0.1s ease;
			`

			itemEl.onclick = () => {
				onSelect(index)
			}

			column.appendChild(itemEl)
		})

		// Add bottom padding
		const bottomPadding = document.createElement('div')
		bottomPadding.style.height = '120px'
		column.appendChild(bottomPadding)

		// Add scroll event for fading effect
		column.addEventListener('scroll', () => {
			const items = column.querySelectorAll('div')
			const columnRect = column.getBoundingClientRect()
			const centerY = columnRect.top + columnRect.height / 2

			items.forEach((item, index) => {
				if (index === 0 || index === items.length - 1) return // Skip padding

				const itemRect = item.getBoundingClientRect()
				const itemCenterY = itemRect.top + itemRect.height / 2
				const distance = Math.abs(itemCenterY - centerY)
				const maxDistance = 90

				// Calculate opacity, color, and font size based on distance from center
				const opacity = Math.max(0.01, 1 - distance / maxDistance)
				const color = distance < 30 ? '#000' : '#999'
				const fontWeight = distance < 30 ? 'bold' : 'normal'
				const fontSize = distance < 30 ? '20px' : '16px'

				item.style.opacity = opacity.toString()
				item.style.color = color
				item.style.fontWeight = fontWeight
				item.style.fontSize = fontSize
			})
		})

		return column
	}

	// Create wheel columns
	const dayColumn = createWheelColumn(days, (index: number) => {
		selectedDay = index + 1
		updateDisplay()
		onChange?.(`${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`)
	})

	const monthColumn = createWheelColumn(months, (index: number) => {
		selectedMonth = index
		updateDisplay()
		onChange?.(`${selectedYear}-${String(index + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`)
	})
	monthColumn.style.borderLeft = '1px solid #e0e0e0'

	const yearColumn = createWheelColumn(years, (index: number) => {
		selectedYear = years[index]
		updateDisplay()
		onChange?.(`${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`)
	})
	yearColumn.style.borderLeft = '1px solid #e0e0e0'

	// Assemble
	content.appendChild(selectionIndicator)
	content.appendChild(dayColumn)
	content.appendChild(monthColumn)
	content.appendChild(yearColumn)
	datePickerContainer.appendChild(content)
	container.appendChild(input)
	container.appendChild(datePickerContainer)

	// Trigger fading effect on load
	setTimeout(() => {
		dayColumn.dispatchEvent(new Event('scroll'))
		monthColumn.dispatchEvent(new Event('scroll'))
		yearColumn.dispatchEvent(new Event('scroll'))
	}, 50)

	// Update display function
	function updateDisplay() {
		const displayText = `${selectedDay} ${months[selectedMonth]} ${selectedYear}`
		dateText.textContent = displayText
		dateText.style.color = '#333'
	}

	return container
}
