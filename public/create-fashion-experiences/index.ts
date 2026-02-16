import {html} from 'lume'
import '../elements/image-loading.js'
import '../routes.js' // track page visits

// Show image loading initially
function showVideoLoading(): Element {
	console.log('Showing image loading screen')
	const videoLoadingElement = html`<image-loading></image-loading>`
	const element = Array.isArray(videoLoadingElement) ? videoLoadingElement[0] : videoLoadingElement
	document.body.appendChild(element as Element)
	return element as Element
}

// Hide video loading when content is ready
function hideVideoLoading(videoLoadingElement: Element | null) {
	if (videoLoadingElement && videoLoadingElement.parentNode) {
		console.log('Hiding video loading screen')
		videoLoadingElement.remove()
		// Restore body scroll
		document.body.style.overflow = ''
		document.documentElement.style.overflow = ''
	} else {
		console.log('Video loading element not found or already removed')
		// Restore scroll anyway just in case
		document.body.style.overflow = ''
		document.documentElement.style.overflow = ''
	}
}

// Image URLs
const bgSvg = new URL('./bg-2.svg', import.meta.url).href
const heroCard1 = new URL('./images/hero-card-1.webp', import.meta.url).href
const heroCard2 = new URL('./images/hero-card-2.webp', import.meta.url).href
const heroCard3 = new URL('./images/hero-card-3.webp', import.meta.url).href
const heroSub1 = new URL('./images/hero-sub-1.svg', import.meta.url).href
const heroSub2 = new URL('./images/hero-sub-2.svg', import.meta.url).href
const heroSub3 = new URL('./images/hero-sub-3.svg', import.meta.url).href
const heroSub4 = new URL('./images/hero-sub-4.svg', import.meta.url).href
const heroSub5 = new URL('./images/hero-sub-5.svg', import.meta.url).href
const logoIcon = new URL('../images/landing/logo.webp', import.meta.url).href
const heroThumb1 = new URL('./images/heroThumb-1.webp', import.meta.url).href
const heroThumb2 = new URL('./images/heroThumb-2.webp', import.meta.url).href
const streetIcon1 = new URL('./images/street-1.svg', import.meta.url).href
const streetIcon2 = new URL('./images/street-2.svg', import.meta.url).href
const streetIcon3 = new URL('./images/street-3.svg', import.meta.url).href
const streetIcon4 = new URL('./images/street-4.svg', import.meta.url).href

const discover1 = new URL('./images/discorver-1.webp', import.meta.url).href
const discover2 = new URL('./images/discorver-2.webp', import.meta.url).href
const discover3 = new URL('./images/discorver-3.webp', import.meta.url).href
const discover4 = new URL('./images/discorver-4.webp', import.meta.url).href
const discover5 = new URL('./images/discorver-5.webp', import.meta.url).href
const discover6 = new URL('./images/discorver-6.webp', import.meta.url).href
const styleBackground1 = new URL('./images/styleBg1.webp', import.meta.url).href
const styleBackground2 = new URL('./images/styleBg2.webp', import.meta.url).href
const styleBackground3 = new URL('./images/styleBg3.webp', import.meta.url).href
const styleBackground4 = new URL('./images/styleBg4.webp', import.meta.url).href
const ex1 = new URL('./images/ex1.webp', import.meta.url).href
const ex2 = new URL('./images/ex2.webp', import.meta.url).href
const ex3 = new URL('./images/ex3.webp', import.meta.url).href
const socialIcon1 = new URL('./images/social-1.svg', import.meta.url).href
const socialIcon2 = new URL('./images/social-2.svg', import.meta.url).href
const socialIcon3 = new URL('./images/social-3.svg', import.meta.url).href
const socialIcon4 = new URL('./images/social-4.svg', import.meta.url).href

const videoBg = new URL('./images/videoBg.webp', import.meta.url).href

// Add navbar with empty structure
const navbar = html`
	<nav class="header">
		<div class="header-content">
			<a href="#" class="header-logo">
				<img src=${logoIcon} alt="Logo" />
			</a>

			<div class="header-menu">
				<a href="#" class="header-menu-link">Features</a>
				<a href="#" class="header-menu-link">Pricing</a>
				<a href="#" class="header-menu-link">FAQ</a>
				<a href="#" class="header-menu-link">About</a>
				<a href="#" class="header-menu-link">PFW</a>
			</div>

			<a href="#" class="btn btn-black btn-small">
				Talk to us
				<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path
						d="M2 8H12M10 6L12 8L10 10"
						stroke="currentColor"
						stroke-width="1.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</a>
		</div>
	</nav>
`

// Main Hero Section
const mainHero = html`
	<section class="hero">
		<img src=${bgSvg} alt="" class="hero-bg" />
		<div class="hero-content">
			<div class="hero-text">
				<h1 class="hero-title">
					<span class="hero-title-main">Stop selling clothes,</span>
					<span class="hero-title-accent">Start selling experiences.</span>
				</h1>
				<p class="hero-description">
					Turn your static web-store into an interactive 3D shopping experience <br />
					<strong>boosting sales & engagement.</strong>
				</p>
				<div class="hero-features">
					<span class="hero-feature-item">Mobile-first</span>
					<span class="hero-feature-dot">•</span>
					<span class="hero-feature-item">Shopify-ready</span>
					<span class="hero-feature-dot">•</span>
					<span class="hero-feature-item">No app download</span>
				</div>
				<div class="hero-buttons">
					<a href="#" class="btn btn-black">Talk to us →</a>
					<a href="#" class="btn btn-gray">Explore spaces</a>
				</div>
				<div class="hero-subscribe">
					<div class="subscribe-avatar">
						<img src=${heroSub1} alt="" />
					</div>
					<div class="subscribe-avatar">
						<img src=${heroSub2} alt="" />
					</div>
					<div class="subscribe-avatar">
						<img src=${heroSub3} alt="" />
					</div>
					<div class="subscribe-avatar">
						<img src=${heroSub4} alt="" />
					</div>
					<div class="subscribe-avatar">
						<img src=${heroSub5} alt="" />
					</div>
					<div class="subscribe-avatar subscribe-avatar-count">+12K</div>
				</div>
			</div>
			<div class="hero-screens">
				<div class="card-item top">
					<div class="card-item__thumb">
						<img src=${heroThumb1} alt="" />
					</div>
					<div class="card-item__info">
						<div class="card-item__label">Trending</div>
						<div class="card-item__name">Black leather skirt</div>
						<div class="card-item__price">us 500</div>
					</div>
				</div>
				<div class="screen screen-left">
					<img src=${heroCard1} alt="" class="hero-card" />
					<div class="screen-content">
						<div class="outfit-card">
							<div class="outfit-info">
								<div class="outfit-label">Outfit value</div>
								<div class="outfit-value">215.00 USD</div>
							</div>
							<button class="btn btn-black">
								<svg
									class="shop-icon"
									width="16"
									height="16"
									viewBox="0 0 16 16"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										d="M4 2L2 5v8c0 .55.45 1 1 1h10c.55 0 1-.45 1-1V5l-2-3H4zm1 1h6l1 2H4l1-2zm-1 3v7h10V6H4z"
										fill="currentColor"
									/>
								</svg>
								Shop IRL
							</button>
						</div>
					</div>
				</div>
				<div class="screen screen-center">
					<img src=${heroCard2} alt="" class="hero-card" />
					<div class="screen-content">
						<div class="outfit-card">
							<div class="outfit-info">
								<div class="outfit-label">Outfit value</div>
								<div class="outfit-value">1,284.00 USD</div>
							</div>
							<button class="btn btn-black">
								<svg
									class="shop-icon"
									width="16"
									height="16"
									viewBox="0 0 16 16"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										d="M4 2L2 5v8c0 .55.45 1 1 1h10c.55 0 1-.45 1-1V5l-2-3H4zm1 1h6l1 2H4l1-2zm-1 3v7h10V6H4z"
										fill="currentColor"
									/>
								</svg>
								Shop IRL
							</button>
						</div>
					</div>
				</div>
				<div class="screen screen-right">
					<img src=${heroCard3} alt="" class="hero-card" />
					<div class="screen-content">
						<div class="outfit-card">
							<div class="outfit-info">
								<div class="outfit-label">Outfit value</div>
								<div class="outfit-value">890.00 USD</div>
							</div>
							<button class="btn btn-black">
								<svg
									class="shop-icon"
									width="16"
									height="16"
									viewBox="0 0 16 16"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										d="M4 2L2 5v8c0 .55.45 1 1 1h10c.55 0 1-.45 1-1V5l-2-3H4zm1 1h6l1 2H4l1-2zm-1 3v7h10V6H4z"
										fill="currentColor"
									/>
								</svg>
								Shop IRL
							</button>
						</div>
					</div>
				</div>
				<div class="card-item bottom">
					<div class="card-item__thumb">
						<img src=${heroThumb2} alt="" />
					</div>

					<div class="card-item__info">
						<div class="card-item__label">New drop</div>
						<div class="card-item__name">Skeleton tee</div>
						<div class="card-item__price">us 700</div>
					</div>
				</div>
			</div>
		</div>
	</section>
`

// Street Section
const mainStreet = html`
	<section class="street">
		<div class="container">
			<div class="section-title">From Screen to Street.</div>
			<div class="section-dest">How it works: Experience fashion before you buy it.</div>
			<div class="street__content">
				<div class="street__item">
					<h1>1-3%</h1>

					<h3 class="street__title">Conversion rate.</h3>
					<p class="street__description">most visitors bounce without buying</p>
					<div class="street__number">01</div>
				</div>
				<div class="street__item">
					<h1>70%</h1>

					<h3 class="street__title">Cart abandonment.</h3>
					<p class="street__description">Uncertainty kills checkout</p>
					<div class="street__number">02</div>
				</div>
				<div class="street__item">
					<h1>25%</h1>
					<h3 class="street__title">Return rate</h3>
					<p class="street__description">Customers "just to see" and return.</p>
					<div class="street__number">03</div>
				</div>
			</div>
		</div>
	</section>
`
const mainStyle = html`<section class="style">
	<div class="container">
		<div class="section-title">How it work: Try. Style. Shop.</div>
		<div class="section-dest">How it works: Experience fashion before you buy it.</div>
		<div class="style__flex">
			<div class="flex-left">
				<div class="section-tag">Step 1</div>
				<div class="section-title text-left">Try on an avatar.</div>
				<div class="section-dest text-left">
					Shopper previews how outfits move and <br />
					feel on an animated avatar, with a body <br />
					like theirs — not a static photo.
				</div>
				<div class="wrap-btn">
					<a href="#" class="btn-get-started">
						<div class="btn-get-started__icon">
							<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path
									d="M2 8H12M10 6L12 8L10 10"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
						</div>
						Get started
					</a>
				</div>
			</div>
			<div class="flex-right">
				<img src=${styleBackground1} alt="Background Style" />
			</div>
		</div>

		<div class="style__flex revert">
			<div class="flex-left">
				<div class="section-tag">Step 2</div>
				<div class="section-title text-left">Style full looks.</div>
				<div class="section-dest text-left">
					Shoppers mix and match multiple items<br />
					in 3D to see how the look comes together<br /><br />
					Understanding the full fit reduces<br />
					hesitation and increases buying intent.
				</div>
				<div class="wrap-btn">
					<a href="#" class="btn-get-started">
						<div class="btn-get-started__icon">
							<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path
									d="M2 8H12M10 6L12 8L10 10"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
						</div>
						Get started
					</a>
				</div>
			</div>
			<div class="flex-right">
				<img src=${styleBackground2} alt="Background Style" />
			</div>
		</div>

		<div class="style__flex">
			<div class="flex-left">
				<div class="section-tag">Step 3</div>
				<div class="section-title text-left">Select options</div>
				<div class="section-dest text-left">
					Shoppers personalize products using <br />
					pre-set options you control — like fabrics, <br />
					colors, or finishes. <br />
					<br />
					Enough choices to feel personal, without <br />
					adding complexity to production. <br />
				</div>
				<div class="wrap-btn">
					<a href="#" class="btn-get-started">
						<div class="btn-get-started__icon">
							<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path
									d="M2 8H12M10 6L12 8L10 10"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
						</div>
						Get started
					</a>
				</div>
			</div>
			<div class="flex-right">
				<img src=${styleBackground3} alt="Background Style" />
			</div>
		</div>

		<div class="style__flex revert">
			<div class="flex-left">
				<div class="section-tag">Step 4</div>
				<div class="section-title text-left">Shop it IRL.</div>
				<div class="section-dest text-left">
					When it feels right, shoppers click Shop IRL<br />
					and complete the purchase on your <br />
					Shopify store. <br /><br />
					Same checkout. Higher intent.
				</div>
				<div class="wrap-btn">
					<a href="#" class="btn-get-started">
						<div class="btn-get-started__icon">
							<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path
									d="M2 8H12M10 6L12 8L10 10"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
						</div>
						Get started
					</a>
				</div>
			</div>
			<div class="flex-right">
				<img src=${styleBackground4} alt="Background Style" />
			</div>
		</div>
	</div>
</section>`

const streetBlack = html`<section class="street black">
	<div class="container">
		<div class="section-title">
			Built to real conversion. <br />
			Not just for ‘immersion’.
		</div>
		<div class="section-dest">
			Drippy isn’t another “virtual showroom” made to impress. It’s built to help shoppers <br />understand what they’re
			buying — and feel confident enough to check out.
		</div>
		<div class="street__content">
			<div class="street__item">
				<p>
					<img src=${streetIcon1} alt="Style Star" />
				</p>
				<h3 class="street__title">Conversion rate.</h3>
				<p class="street__description">most visitors bounce without buying</p>
				<div class="street__number">01</div>
			</div>
			<div class="street__item">
				<p>
					<img src=${streetIcon2} alt="Style Star" />
				</p>
				<h3 class="street__title">Cart abandonment.</h3>
				<p class="street__description">Uncertainty kills checkout</p>
				<div class="street__number">02</div>
			</div>
			<div class="street__item">
				<p>
					<img src=${streetIcon3} alt="Style Star" />
				</p>
				<h3 class="street__title">Return rate</h3>
				<p class="street__description">Customers "just to see" and return.</p>
				<div class="street__number">03</div>
			</div>
			<div class="street__item">
				<p>
					<img src=${streetIcon4} alt="Style Star" />
				</p>
				<h3 class="street__title">Return rate</h3>
				<p class="street__description">Customers "just to see" and return.</p>
				<div class="street__number">03</div>
			</div>
		</div>
		<div class="wrap-btn center">
			<a href="#" class="btn-get-started gray">
				<div class="btn-get-started__icon">
					<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path
							d="M2 8H12M10 6L12 8L10 10"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</div>
				Get started
			</a>
		</div>
	</div>
</section>`

// Add main content with empty HTML blocks
const mainContent = html`
	<main>
		${mainHero}
		<section class="trust-by">
			<div class="container">
				<div class="section-title">Trusted by</div>
				<div class="section-dest">Trusted by those shaping what's next</div>
				<div class="trust-by__content">
					<div class="trust-by__logo">Logo</div>
					<div class="trust-by__logo">Logo</div>
					<div class="trust-by__logo">Logo</div>
					<div class="trust-by__logo">Logo</div>
					<div class="trust-by__logo">Logo</div>
					<div class="trust-by__logo">Logo</div>
					<div class="trust-by__logo">Logo</div>
					<div class="trust-by__logo">Logo</div>
				</div>
			</div>
		</section>

		${mainStreet}

		<section class="action-video">
			<div class="container">
				<div class="section-title">
					Drippy turns passive browsing <br />
					into active styling.
				</div>
				<div class="section-dest">
					Instead of scrolling through disconnected product photos, shopper enter <br />
					a 3D dressing room, have fund and shop when they are ready
				</div>
				<div class="video-bg">
					<img src=${videoBg} alt="" />
				</div>
				<div class="wrap-btn center">
					<a href="#" class="btn-get-started">
						<div class="btn-get-started__icon">
							<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path
									d="M2 8H12M10 6L12 8L10 10"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
						</div>
						Get started
					</a>
				</div>
			</div>
		</section>

		${mainStyle}

		<section class="discover">
			<div class="container">
				<div class="section-title">
					An immersive environment <br />
					that tells your story.
				</div>
				<div class="section-dest">
					Drippy places shopping inside a world that reflects your brand — <br />
					not a generic product grid. shopping has never been so fun!
				</div>
				<div class="discover__content">
					<div class="discover__item">
						<img src=${discover1} alt="" />
					</div>
					<div class="discover__item">
						<img src=${discover2} alt="" />
					</div>
					<div class="discover__item">
						<img src=${discover3} alt="" />
					</div>
					<div class="discover__item">
						<img src=${discover4} alt="" />
					</div>
					<div class="discover__item">
						<img src=${discover5} alt="" />
					</div>
					<div class="discover__item">
						<img src=${discover6} alt="" />
					</div>
				</div>
				<div class="wrap-btn center">
					<a href="#" class="btn-get-started">
						<div class="btn-get-started__icon">
							<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path
									d="M2 8H12M10 6L12 8L10 10"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
						</div>
						Get started
					</a>
				</div>
			</div>
		</section>

		${streetBlack}

		<section class="experience">
			<div class="container">
				<div class="section-title">One experience, lives everywhere.</div>
				<div class="section-dest">A plug-and-play interactive 3D store, wherever your customers are.</div>

				<div class="experience__content">
					<div class="experience__item">
						<div class="experience__image-wrapper violet">
							<img src=${ex1} alt="Link in bios" />
						</div>
						<p class="experience__title">Link in bios</p>
						<p class="experience__description">
							No website? no problem. Drop Drippy in your bio and turn followers into shoppers.
						</p>
					</div>
					<div class="experience__item ">
						<div class="experience__image-wrapper gray">
							<img src=${ex2} alt="Embed on website" />
						</div>
						<p class="experience__title">Embed on website</p>
						<p class="experience__description">
							Plug Drippy directly into your online store. Same site, new experience.
						</p>
					</div>
					<div class="experience__item">
						<div class="experience__image-wrapper experience__image-wrapper--no-bg">
							<img src=${ex3} alt="In-store QR" />
						</div>
						<p class="experience__title">In-store QR</p>
						<p class="experience__description">
							Turn retail into an interactive playground. One scan -> instant 3D try-on -> Order.
						</p>
					</div>
				</div>
				<div class="wrap-btn center">
					<a href="#" class="btn-get-started">
						<div class="btn-get-started__icon">
							<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path
									d="M2 8H12M10 6L12 8L10 10"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
						</div>
						Get started
					</a>
				</div>
			</div>
		</section>

		<section class="store">
			<div class="container">
				<div class="cta-section">
					<div class="cta-section__inner">
						<h2 class="cta-section__title">
							Your store deserves <em>better</em> <br />
							than flat photos.
						</h2>
						<p class="cta-section__description">
							Shoppers want to see the fit and the full look, not guess at it. Give <br />
							them a 3D dressing room and watch what happens.
						</p>
						<a href="#" class="btn btn-violet">Talk to us →</a>
					</div>
				</div>
			</div>
		</section>

		<footer class="footer">
			<div class="container">
				<div class="footer__content">
					<div class="footer__left">
						<h2 class="footer__brand">Drippy.</h2>
						<p class="footer__copyright">@2025 - Drippy, Inc.</p>
					</div>
					<div class="footer__right">
						<nav class="footer__links">
							<a href="#" class="footer__link">Terms & Conditions</a>
							<a href="#" class="footer__link">Privacy Policy</a>
							<a href="#" class="footer__link">Contact Us</a>
						</nav>
						<div class="footer__social">
							<a href="#" class="footer__social-link" aria-label="Instagram">
								<img src=${socialIcon1} alt="Instagram" />
							</a>
							<a href="#" class="footer__social-link" aria-label="Discord">
								<img src=${socialIcon2} alt="Discord" />
							</a>
							<a href="#" class="footer__social-link" aria-label="Reddit">
								<img src=${socialIcon3} alt="Reddit" />
							</a>
							<a href="#" class="footer__social-link" aria-label="X">
								<img src=${socialIcon4} alt="X" />
							</a>
						</div>
					</div>
				</div>
			</div>
		</footer>
	</main>
` as Node

// Show video loading immediately when landing page starts loading
const videoLoadingElement = showVideoLoading()

// Fallback timeout to ensure loading screen is hidden after maximum 5 seconds
const maxLoadingTime = 5000
setTimeout(() => {
	console.log('Fallback timeout: hiding video loading screen')
	hideVideoLoading(videoLoadingElement)
}, maxLoadingTime)

const root = document.getElementById('root')
root?.append(...[navbar].flat())
root?.append(...[mainContent].flat())

// Wait for all images and content to be fully loaded
function waitForContentReady() {
	// Check if all images are loaded
	const images = document.querySelectorAll('img')
	const imagePromises = Array.from(images).map(img => {
		if (img.complete) return Promise.resolve()
		return new Promise(resolve => {
			img.addEventListener('load', resolve)
			img.addEventListener('error', resolve) // Still resolve on error to not block
		})
	})
	// Wait for images + a minimum delay to ensure loading screen shows
	const minLoadingTimeout = new Promise(r => setTimeout(r, 3000))
	Promise.all([imagePromises, minLoadingTimeout]).then(() => hideVideoLoading(videoLoadingElement))
}

// Start waiting for content to be ready
waitForContentReady()

// Add smooth scroll behavior for header menu links
function setupSmoothScroll() {
	const headerMenu = document.querySelector('.header-menu')
	if (!headerMenu) return

	headerMenu.addEventListener('click', e => {
		const target = e.target as HTMLElement
		if (!target.classList.contains('header-menu-link')) return

		e.preventDefault()
		const targetId = target.getAttribute('href')?.substring(1)
		const targetElement = targetId ? document.getElementById(targetId) : null

		if (targetElement) {
			targetElement.scrollIntoView({behavior: 'smooth', block: 'start'})
			setTimeout(() => window.scrollBy({top: -120, behavior: 'smooth'}), 100)
		}
	})
}

// Setup smooth scroll
setupSmoothScroll()

// Setup horizontal scroll with active screen detection for mobile
function setupHeroScreensScroll() {
	const heroScreens = document.querySelector('.hero-screens') as HTMLElement

	const screens = heroScreens.querySelectorAll('.screen')
	if (!screens[0]) throw new Error('No screens found in hero-screens')

	// Check if mobile
	const isMobile = window.innerWidth <= 768

	if (!isMobile) {
		// Remove active class on desktop
		screens.forEach(screen => {
			;(screen as HTMLElement).classList.remove('active')
		})
		return
	}

	// Set first screen as active initially
	screens[0].classList.add('active')

	// Function to update active screen based on scroll position
	const updateActiveScreen = (): void => {
		const containerRect = heroScreens.getBoundingClientRect()
		const containerCenter = containerRect.left + containerRect.width / 2

		let activeScreen: HTMLElement | null = null
		let minDistance = Infinity

		Array.from(screens).forEach(screen => {
			const screenElement = screen as HTMLElement
			const screenRect = screenElement.getBoundingClientRect()
			const screenCenter = screenRect.left + screenRect.width / 2
			const distance = Math.abs(screenCenter - containerCenter)

			if (distance < minDistance) {
				minDistance = distance
				activeScreen = screenElement
			}
		})

		// Update active class
		Array.from(screens).forEach(screen => {
			const el = screen as HTMLElement
			el.classList.remove('active')
		})
		if (activeScreen) {
			const el = activeScreen as HTMLElement
			el.classList.add('active')
		}
	}

	// Listen to scroll events
	heroScreens.addEventListener('scroll', updateActiveScreen)

	// Initial update
	updateActiveScreen()

	// Update on resize
	window.addEventListener('resize', () => {
		setupHeroScreensScroll()
	})
}

// Setup hero screens scroll
setupHeroScreensScroll()
