import {html} from 'lume'
import '../routes.js' // track page visits
import '../elements/login-ui.js'
import '../elements/theme-switch.js'
import {createDatePicker} from '../elements/simple-date-picker-v3.js'

const createAccountImg = new URL('../images/create-account.png', import.meta.url)
const step3Img = new URL('../images/step3.png', import.meta.url)
const step4Img = new URL('../images/step4.png', import.meta.url)

// Check current path and render appropriate step
const path = window.location.pathname

if (path.includes('/onboarding/step')) {
	const stepMatch = path.match(/\/onboarding\/step(\d+)/)
	if (stepMatch) {
		const step = stepMatch[1]
		renderStep(parseInt(step))
	}
} else {
	// Default to step 1
	renderStep(1)
}

function renderStep(step: number) {
	const stepContent = getStepContent(step)

	document.body.append(html` <div id="onboardingUI">${stepContent}</div> ` as Node)
}

function getStepContent(step: number) {
	switch (step) {
		case 1:
			return html`
				<div id="step1UI">
					<header>
						<h1 class="title">Gamify your fashion shopping experience.</h1>
						<p class="sub-title">Browse it. Drip it. Shop it IRL!</p>
					</header>

					<div class="email-section">
						<input
							type="email"
							placeholder="Enter your email"
							class="email-input"
							oninput=${(e: any) => handleEmailInput(e)}
						/>
						<button class="btn btn-primary" onclick=${() => handleSubmit()}>Count me in 🔥</button>
					</div>
					<img src=${createAccountImg} alt="Create Account" />
				</div>
			`
		case 2:
			return html`
				<div id="step2UI">
					<header>
						<div class="back-btn-container">
							<button class="back-btn" onclick=${() => goBack()}>←</button>
						</div>

						<h1 class="title">First, enter your username & date of birth.</h1>
					</header>

					<div class="form-section">
						<input
							type="text"
							placeholder="@username"
							class="form-input"
							oninput=${(e: any) => handleUsernameInput(e)}
						/>

						<!-- Using simple date picker -->
						${createDatePicker({
							id: 'onboarding-dob',
							placeholder: 'Date of birth',
							min: '1900-01-01',
							max: '2010-12-31',
							onChange: value => {
								console.log('Date selected:', value)
							},
						})}

						<p class="privacy-note">Don't worry, we won't tell about it. 😉</p>
					</div>

					<button class="btn btn-primary" onclick=${() => handleStep2Submit()}>OK!</button>
				</div>
			`
		case 3:
			return html`
				<div id="step3UI">
					<header>
						<div class="back-btn-container">
							<button class="back-btn" onclick=${() => goBack()}>←</button>
						</div>
						<h1 class="title">Did you know? Every garment on Drippy can be shopped IRL.</h1>
					</header>

					<div class="action-section">
						<button class="btn btn-primary" onclick=${() => handleStep3Submit()}>Yesss!</button>
					</div>

					<img src=${step3Img} alt="Create Account" />
				</div>
			`
		case 4:
			return html`
				<div id="step4UI">
					<header>
						<div class="back-btn-container">
							<button class="back-btn" onclick=${() => goBack()}>←</button>
						</div>
						<h1 class="title">Ready to discover your unique style? Let's get started!</h1>
					</header>

					<div class="action-section">
						<button class="btn btn-primary" onclick=${() => handleStep4Submit()}>Let's Go!</button>
					</div>

					<img src=${step4Img} alt="Create Account" />
				</div>
			`
		default:
			return html`<div>Invalid step</div>`
	}
}

function nextStep() {
	const currentStep = getCurrentStep()
	if (currentStep < 4) {
		window.location.href = `/onboarding/step${currentStep + 1}`
	}
}

// Step 1 functions
let email = ''

function handleEmailInput(e: any) {
	email = e.target.value
}

function handleSubmit() {
	if (email && email.includes('@')) {
		localStorage.setItem('onboarding_email', email)
		nextStep()
	} else {
		alert('Please enter a valid email address')
	}
}

// Step 2 functions
function handleUsernameInput(e: any) {
	// Username is handled directly in handleStep2Submit
	console.log('Username:', e.target.value)
}

function handleStep2Submit() {
	const usernameInput = document.querySelector('.form-input') as HTMLInputElement
	const dateOfBirthElement = document.querySelector('#onboarding-dob .date-text') as HTMLElement
	const dateOfBirth = dateOfBirthElement?.textContent

	const username = usernameInput?.value
	const hasValidDate = dateOfBirth && dateOfBirth !== 'Date of birth'

	if (username && hasValidDate) {
		localStorage.setItem('onboarding_username', username)
		localStorage.setItem('onboarding_dob', dateOfBirth)
		nextStep()
	} else {
		alert('Please enter both username and date of birth')
	}
}

function goBack() {
	const currentStep = getCurrentStep()
	if (currentStep > 1) {
		window.location.href = `/onboarding/step${currentStep - 1}`
	} else {
		window.location.href = '/'
	}
}

function handleStep3Submit() {
	// Complete onboarding
	localStorage.setItem('onboarding_completed', 'true')
	nextStep()
}

function handleStep4Submit() {
	// Final step - complete onboarding
	localStorage.setItem('onboarding_completed', 'true')
	window.location.href = '/'
}

function getCurrentStep(): number {
	const path = window.location.pathname
	const stepMatch = path.match(/\/onboarding\/step(\d+)/)
	return stepMatch ? parseInt(stepMatch[1]) : 1
}

// Hide the loading cover
const loadingCover = document.getElementById('loadingCover')
loadingCover?.classList.add('invisible')
loadingCover?.addEventListener('transitionend', () => loadingCover.remove())

// Add CSS for step1 UI
const style = document.createElement('style')
style.textContent = `
	#step1UI, #step2UI, #step3UI, #step4UI {
		max-width: 393px;
		margin: 0 auto;
		padding: 19.5px;
		text-align: center;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}
	#step1UI .title {
		font-size: 28px;
	}

	header .title {
		font-size: 21px;
		font-weight: bold;
		padding:0 15px 0 15px;
		color: #000;
		line-height: 1.4;
		text-transform: none;
		margin:0;
		margin-bottom: 16px;
	}

	header .sub-title {
		font-size: 16px;
		color: #000;

	}

	/* Common input styles */
	.email-input, .form-input {
		width: 100%;
		padding: 10px;
		border-radius: 10px;
		font-size: 14px;
		margin-bottom: 10px;
		box-sizing: border-box;
		background: #f8f8f8;
		border: 1px solid #ccc;
		color: #333;
		transition: all 0.3s ease;
	}

	.email-input:focus, .form-input:focus {
		outline: none;
		border-color: #495CFF;
		box-shadow: 0 0 0 3px rgba(73, 92, 255, 0.1);
	}

	.email-input::placeholder, .form-input::placeholder {
		color: #999;
	}

	.btn {
		padding: 12px 24px;
		border: none;
		border-radius: 10px;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-primary {
		background: #000;
		color: white;
		width: 100%;
	}

	.btn-primary:hover {
		background: #333;
	}

	.text {
		position: absolute;
		top: -25px;
		right: -15px;
		font-size: 10px;
		font-weight: bold;
		color: #333;
		text-align: center;
		line-height: 50px;
	}

	@keyframes rainbow {
		0% { filter: hue-rotate(0deg); }
		100% { filter: hue-rotate(360deg); }
	}

	.back-btn-container{
		text-align: left;
	}
	.back-btn {
		background: none;
		border: none;
		font-size: 24px;
		cursor: pointer;
		color: #000;
		padding: 8px;
		border-radius: 50%;
		transition: background-color 0.2s ease;
	}

	.back-btn:hover {
		background-color: rgba(0,0,0,0.1);
	}

	.form-section {
		margin: 0 0 15px 0;
	}

	.form-input::placeholder {
		color: #999;
	}

	.privacy-note {
		font-size: 14px;
		color: #666;
		margin: 6px 0 14px 0;
		padding: 0;
		text-align: center;
	}

	/* Custom date picker styling */
	date-picker {
		width: 100%;
		margin-bottom: 10px;
	}

	/* Mobile-first design */
	@media (max-width: 480px) {
		#step1UI, #step2UI, #step3UI, #step4UI {
			padding: 0px;
			justify-content: center;
		}

		header .title {
			font-size: 24px;
			padding: 0
		}

		.back-btn {
			top: 16px;
			left: 16px;
		}
	}
`
document.head.appendChild(style)
