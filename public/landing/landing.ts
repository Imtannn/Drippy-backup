import {html} from 'lume'
import '../elements/avatar-selector.js'
import '../elements/custom-button.js'
import '../elements/login-ui.js'
import '../elements/theme-switch.js'
import '../elements/video-loading.js'
import '../routes.js' // track page visits

// Control video loading for landing page
function hideLandingVideoLoading() {
	const loadingCover = document.getElementById('loadingCover')
	const videoLoading = loadingCover?.querySelector('video-loading') as any

	if (videoLoading) {
		// Hide the video loading component
		videoLoading.isVisible = false

		// Listen for the video loading component's opacity transition to complete
		const handleTransition = (e: TransitionEvent) => {
			if (e.propertyName === 'opacity' && loadingCover) {
				videoLoading.removeEventListener('transitionend', handleTransition)
				loadingCover.classList.add('invisible')
				loadingCover.addEventListener('transitionend', () => loadingCover.remove())
			}
		}
		videoLoading.addEventListener('transitionend', handleTransition)
	}
}

// const logoUrl = new URL('../images/logo.svg', import.meta.url)
const logoUrlDark = new URL('../images/landing/logo.png', import.meta.url)
const blingImage1 = new URL('../images/landing/bling-1.png', import.meta.url).href
const blingImage2 = new URL('../images/landing/bling-2.png', import.meta.url).href
const blingImage3 = new URL('../images/landing/bling-3.png', import.meta.url).href
const modelImage1 = new URL('../images/landing/model-1.png', import.meta.url).href
const modelImage2 = new URL('../images/landing/model-2.png', import.meta.url).href
const matImage1 = new URL('../images/landing/mat-1.png', import.meta.url).href
const matImage2 = new URL('../images/landing/mat-2.png', import.meta.url).href
const matImage3 = new URL('../images/landing/mat-3.png', import.meta.url).href
const stepImage1 = new URL('../images/landing/step-1.png', import.meta.url).href

const cta__background = new URL('../images/landing/cta-background.png', import.meta.url).href
const cta_model = new URL('../images/landing/cta-model.png', import.meta.url).href
// Social media icons
const instagramIcon = new URL('../images/landing/discord.png', import.meta.url).href
const discordIcon = new URL('../images/landing/instagram.png', import.meta.url).href
const redditIcon = new URL('../images/landing/reddit.png', import.meta.url).href
const twitterIcon = new URL('../images/landing/twiter.png', import.meta.url).href
// Brands data
const brands = [
	{
		id: 1,
		name: 'Brand 1',
		logo: new URL('../images/landing/brand-1.png', import.meta.url).href,
	},
	{
		id: 2,
		name: 'Brand 2',
		logo: new URL('../images/landing/brand-2.png', import.meta.url).href,
	},
	{
		id: 3,
		name: 'Brand 3',
		logo: new URL('../images/landing/brand-3.png', import.meta.url).href,
	},
	{
		id: 4,
		name: 'Brand 4',
		logo: new URL('../images/landing/brand-4.png', import.meta.url).href,
	},
	{
		id: 5,
		name: 'Brand 5',
		logo: new URL('../images/landing/brand-5.png', import.meta.url).href,
	},
	{
		id: 6,
		name: 'Brand 6',
		logo: new URL('../images/landing/brand-6.png', import.meta.url).href,
	},
	{
		id: 7,
		name: 'Brand 7',
		logo: new URL('../images/landing/brand-7.png', import.meta.url).href,
	},
	{
		id: 8,
		name: 'Brand 8',
		logo: new URL('../images/landing/brand-8.png', import.meta.url).href,
	},
	{
		id: 9,
		name: 'Brand 9',
		logo: new URL('../images/landing/brand-9.png', import.meta.url).href,
	},
]

// Step
const steps = [
	{
		id: 1,
		name: 'Pick an avatar',
		des: 'Shoppers choose an avatar that feels like them.',
		logo: new URL('../images/landing/step-2.png', import.meta.url).href,
	},
	{
		id: 2,
		name: 'Explore themed space',
		des: 'Each space is each collection that tells a story.',
		logo: new URL('../images/landing/step-3.png', import.meta.url).href,
	},
	{
		id: 3,
		name: 'Browse & remix products',
		des: 'Remix design, swap fabrics & style avatars in real time.',
		logo: new URL('../images/landing/step-4.png', import.meta.url).href,
	},
	{
		id: 4,
		name: 'Place custom order',
		des: 'Send order inquiry directly to your email for quotation.',
		logo: new URL('../images/landing/step-5.png', import.meta.url).href,
	},
]

const statistics = [
	{
		id: 1,
		name: 'Lift in conversions',
		des: 'Conversion rate of 3D preview compared to static images.',
		image: new URL('../images/landing/statistic-1.png', import.meta.url).href,
		number: 94,
		source: 'Source: Shopify, 2021',
	},
	{
		id: 2,
		name: 'Boost up engagement',
		des: 'Four in five shoppers interact longer with 3D (34% over 30+ seconds)',
		image: new URL('../images/landing/statistic-2.png', import.meta.url).href,
		number: 82,
		source: 'Source: Cappasity, 2020',
	},
	{
		id: 3,
		name: 'More add-to-cart',
		des: 'More add-to-cart actions if 3D and personalization is being offered.',
		image: new URL('../images/landing/statistic-3.png', import.meta.url).href,
		number: 35,
		source: 'Source: Cappasity, 2020',
	},
	{
		id: 4,
		name: 'More sales',
		des: 'Brands using personalization see higher revenue on average.',
		image: new URL('../images/landing/statistic-4.png', import.meta.url).href,
		number: 20,
		source: 'Source: McKinsey, 2021',
	},
]

// Add navbar first
const navbar = html`
	<nav class="header">
		<div class="header__logo">
			<img src=${logoUrlDark} alt="Drippy Logo" class="header__logo-img" />
		</div>
		<ul class="header__menu">
			<li class="header__menu-item"><a href="#features" class="header__menu-link">Features</a></li>
			<li class="header__menu-item"><a href="#how-it-works" class="header__menu-link">How it works</a></li>
			<li class="header__menu-item"><a href="#platform" class="header__menu-link">Use Cases</a></li>
			<li class="header__menu-item"><a href="#pricing" class="header__menu-link">Pricing</a></li>
		</ul>
		<div class="header__actions">
			<custom-button variant="primary" size="small">Book a demo</custom-button>
		</div>
		<button class="header__mobile-toggle" aria-label="Toggle mobile menu" aria-expanded="false">
			<span class="header__mobile-toggle-line"></span>
			<span class="header__mobile-toggle-line"></span>
			<span class="header__mobile-toggle-line"></span>
		</button>
	</nav>
`

// Add main content
const mainContent = html`
	<main class="landing-page-desktop" role="main">
			<div class="container">
				<div class="overlap">
					<div class="frame">
						<!-- Hero Section -->
						<section class="hero-header" aria-labelledby="hero-title">
							<p id="hero-title" class="stop-selling-clothes text-xl">Stop selling clothes. <br />Start selling experiences.</p>
							<p class="hero__subtitle text-md-1">
								Turn your e-commerce into an
								<span class="highlight"> interactive 3D <br> studio </span>
							that boosts engagement and sales.
							</p>
							<div class="hero__actions">
								<custom-button variant="secondary">See it live</custom-button>
								<custom-button variant="primary">Book a demo</custom-button>
							</div>

								<img class="cta__cone-image--2" src=${blingImage1} />

								<img class="cta__cone-image--3" src=${blingImage2} />
						</section>

						<!-- Brands Section -->
						<section class="section" id="brand">
							<div class="section-header">
								<div class="section-title text-lg">Backed by the fearless.</div>
								<div class="section-subtitle text-md-2">Trusted by the rebels.</div>
							</div>
							<div class="brands__grid">
								${brands.map(
									(brand: any) => html`
										<div class="brands__item">
											<img src="${brand.logo}" alt="${brand.name}" class="brands__logo" />
										</div>
									`,
								)}
							</div>
						</section>

						<!-- Interactive 3D Section -->
						<section class="section" id="interactive">
							<div class="section-header">
								<div class="section-title text-lg">
									<span>Interactive 3D is </span> <span class="hero__title--highlight">the new black.</span>
								</div>
								<div class="section-subtitle text-md-2">Static images are dead — Today shoppers want fun,<br> interaction, and engagement.</div>
							</div>
							<div class="showcase__container">
								<div class="showcase">
									<div class="showcase__item">
										<div class="showcase__background">
											<div class="showcase__model-display">
												<img class="showcase__model" src="${modelImage1}" alt="3D model visualization showing product customization" />
											</div>
										</div>
										<div class="showcase__label text-xs">Static product photo</div>
									</div>
									<div class="showcase__item">
										<div class="showcase__background">
											<div class="showcase__controls">
												<div class="showcase__avatar-option">
													<img src=${matImage1} alt="Material option 1 for customization" />
												</div>
												<div class="showcase__avatar-option">
													<img src=${matImage2} alt="Material option 2 for customization" />
												</div>
												<div class="showcase__avatar-option">
													<img src=${matImage3} alt="Material option 3 for customization" />
												</div>
											</div>

											<avatar-selector target-model=".showcase__avatar-model" class="showcase__selector"></avatar-selector>

											<div class="showcase__model-display">
												<img class="showcase__model" src="${modelImage2}" alt="3D avatar model with interactive controls" />
											</div>
											<div class="showcase__label text-xs">Interactive 3D with avatars</div>
										</div>
									</div>
								</div>
							</div>
							<img class="cta__cone-image--4" src=${blingImage3} />
						</section>

						<!-- Statistics Section -->
						<section class="section" id="statistics">
							<div class="section-header">
								<div class="section-title text-lg">Well, numbers do not lie.</div>
								<div class="section-subtitle text-md-2">3D and personalization aren't just buzz — they drive business metrics.</div>
							</div>
							<div class="statistics__grid">
								${statistics.map(
									(stat: any) => html`
									<div class="statistics__item">
											<div class="statistics__icon-overlap">
											<div class="statistics__ellipse" data-percent=${stat.number}>
												<svg>
												<circle class="bg" cx="60" cy="60" r="55" />
												<circle class="progress" cx="60" cy="60" r="55" />
												</svg>
												<div class="statistics__number">+${stat.number}%</div>
											</div>
											</div>
											<div class="statistics__content">
												<div class="statistics__item-title text-sm">${stat.name}</div>
												<p class="statistics__item-description text-xs">${stat.des}</p>
												<div class="statistics__source text-xs">${stat.source}</div>
											</div>
										</div>
										</div>
									`,
								)}
							</div>
						</section>

						<!-- Drippy Features Section -->
						<section id="features" class="section-drippy" aria-labelledby="features-title">
							<div class="features__container">
								<div class="features__content">
									<div class="features__header">
										<div id="features-title" class="drippy-is-the-new text-lg">
											<span class="hero__title text-lg">Drippy is the new storefront, </span>
											<span class="hero__title--highlight text-lg">reimagined. </span>
										</div>
										<p class="features__subtitle text-md-1">Let shoppers play, remix, and buy — all in one place.</p>
									</div>
									<div class="features__grid">
										<div class="feature__wrapper">
											<div class="feature__item">
												<div class="feature__number-container">
													<div class="feature__number-wrapper">
														<div class="feature__number-overlap"><div class="feature__number text-xs">1</div></div>
													</div>
												</div>
												<div class="feature__content">
													<p class="feature__title text-md-1">Turn store into a playground</p>
													<p class="feature__description text-sm">Let shoppers explore 3D spaces, remix designs, styled avatars.</p>
												</div>
											</div>
										</div>
										<div class="feature__wrapper">
											<div class="feature__item">
												<div class="feature__number-container">
													<div class="feature__number-wrapper">
														<div class="feature__number-overlap"><div class="feature__number text-xs">2</div></div>
													</div>
												</div>
												<div class="feature__content">
													<div class="feature__title text-md-1">Sell what people want</div>
													<p class="feature__description text-sm">
														Collect payments and orders directly - Fulfill on made-to-order basis.
													</p>
												</div>
											</div>
										</div>
										<div class="feature__item--second">
											<div class="feature__item">
												<div class="feature__number-container">
													<div class="feature__number-wrapper">
														<div class="feature__number-overlap"><div class="feature__number text-xs">3</div></div>
													</div>
												</div>
												<div class="feature__content">
													<div class="feature__title text-md-1">Collect powerful insights</div>
													<p class="feature__description text-sm">Get real-time signals on what to produce — no more guesswork.</p>
												</div>
											</div>
										</div>
										<div class="feature__item--third">
											<div class="feature__item">
												<div class="feature__number-container">
													<div class="feature__number-wrapper">
														<div class="feature__number-overlap"><div class="feature__number text-xs">4</div></div>
													</div>
												</div>
												<div class="feature__item--fourth">
													<div class="feature__title text-md-1">Build &amp; grow community</div>
													<p class="feature__description text-sm">
														Host in-app challenges that turn your audience into fans &amp; co-creators
													</p>
												</div>
											</div>
										</div>
									</div>
								</div>
								<div class="hero__actions">
									<custom-button variant="secondary">See it live</custom-button>
									<custom-button variant="primary">Book a demo</custom-button>
								</div>
							</div>
							<img class="features__image" src=${stepImage1} />
						</section>

						<!-- How it Works Section -->
						<section id="how-it-works" class="section">
							<div class="section-header">
								<div class="section-title text-lg">Built like a game, feel like a game.</div>
								<div class="section-subtitle text-md-2">Here&#39;s how it work from your shoppers' POV.</div>
							</div>
							<div class="how-it-works__grid">
								${steps.map(
									(step: any) => html`
										<div class="how-it-works__item">
											<div class="how-it-works__step">
												<img class="how-it-works__step-image" src=${step.logo} />
											</div>
											<div class="how-it-works__step-title text-md-1">${step.name}</div>
											<p class="how-it-works__description text-sm">${step.des}</p>
										</div>
									`,
								)}
							</div>
							<div class="hero__actions">
								<custom-button variant="secondary">See it live</custom-button>
								<custom-button variant="primary">Book a demo</custom-button>
							</div>
						</section>

						<!-- Platform Integration Section -->
						<section id="platform" class="section">
							<div class="section-header">
								<div class="section-title text-lg" id="platform-title">A plug &amp; play 3D studio.</div>
								<div class="section-subtitle text-md-2">Browser-based, mobile-first. Zero download, Zero friction.</div>
							</div>
							<div class="platform__content">
								<div class="platform__grid">
									<div class="platform__card">
										<div class="platform__card-overlap">
											<div class="platform__card-content">
												<div class="platform__card-text">
													<div class="statistics__item-title text-md-1">Link in bios</div>
													<p class="statistics__description text-sm">
														No website? no problem. Drop Drippy in your bio and turn followers into shoppers.
													</p>
												</div>
											</div>
											<div class="platform__card-image">
												<img class="platform__device-image" src="https://c.animaapp.com/mejigj1rAIvhIh/img/device-14pm-1.png" />
											</div>
										</div>
									</div>
									<div class="platform__card">
										<div class="platform__card-overlap">
											<div class="platform__card-content">
												<div class="platform__card-text">
													<div class="statistics__item-title text-md-1">Embed on website</div>
													<p class="statistics__description text-xs">
														Plug Drippy directly into your online store. Same site, new experience.
													</p>
												</div>
											</div>
											<div class="platform__card-image">
												<img class="platform__device-image" src="https://c.animaapp.com/mejigj1rAIvhIh/img/device-14pm-2.png" />
											</div>
										</div>

									</div>
									<div class="platform__card">
										<div class="platform__card-overlap">
											<div class="platform__card-content">
												<div class="platform__card-text">
													<div class="statistics__item-title text-sm">In-store QR</div>
													<p class="statistics__description text-xs">
														Turn retail into an interactive playground. One scan → instant 3D try-on →
														made-to-order.
													</p>
												</div>
											</div>
											<div class="platform__card-image">
												<img class="platform__screenshot" src="https://c.animaapp.com/mejigj1rAIvhIh/img/screenshot-2025-08-05-at-18-41-55-1.png" />
											</div>
										</div>
									</div>
								</div>
								<div class="hero__actions">
									<custom-button variant="secondary">See it live</custom-button>
									<custom-button variant="primary">Book a demo</custom-button>
								</div>
							</div>
						</section>

						<!-- Pricing Section -->
						<section id="pricing" class="section">
							<div class="pricing__content">
								<div class="pricing__header">
									<div class="section-header">
										<div class="section-title text-lg">Our pricing.</div>
										<div class="section-subtitle text-md-2">Pricing without the bullsh*t.</div>
									</div>
									<div class="pricing__toggle">
										<custom-button variant="primary">Yearly</custom-button>
										<custom-button variant="secondary">Monthly</custom-button>
									</div>
								</div>
								<div class="pricing__plans">
									<div class="pricing__plan--basic">
										<div class="pricing__plan-content">
											<div class="pricing__plan-header">
												<div class="pricing__plan-name text-sm">Studio</div>
												<p class="pricing__plan-price">
													<span class="interactive__title text-sm">€45</span> <span class="pricing__plan-period text-xs">/month/studio</span>
												</p>
											</div>
											<div class="pricing__features-list">
												<p class="pricing__plan-price">
													<span class="pricing__plan-period text-xs">3-month free trial <br /></span>
												</p>
												<p class="pricing__plan-price">
													<span class="pricing__plan-period text-xs">1 space<br /></span>
												</p>
												<p class="pricing__plan-price">
													<span class="pricing__plan-period text-xs">12 SKUs per space<br /></span>
												</p>
												<p class="pricing__plan-price">
													<span class="pricing__plan-period text-xs">Digitize service </span>
													<span class="pricing__plan-note text-xs">not included</span>
												</p>
											</div>
										</div>
										<div class="pricing__button--basic"><div class="hero__button-text">Start free trial</div></div>
									</div>
									<div class="pricing__plan--pro">
										<div class="pricing__plan-content">
											<div class="pricing__plan-header--pro">
												<div class="pricing__plan-title-section">
													<div class="pricing__plan-name--pro text-sm">Studio PRO</div>
													<div class="pricing__plan-badge"><div class="pricing__plan-badge-text text-xs">Best value</div></div>
												</div>
												<p class="pricing__plan-price--pro">
													<span class="interactive__title text-sm">€70</span> <span class="pricing__plan-period--pro text-xs">/month/studio</span>
												</p>
											</div>
											<div class="pricing__features-list--pro">
												<p class="pricing__plan-price--pro">
													<span class="pricing__plan-feature text-xs">Everything in </span>
													<span class="pricing__plan-feature--highlight text-sm">Studio</span>
													<span class="pricing__plan-feature text-xs">, plus:<br /></span>
												</p>
												<p class="pricing__plan-price--pro">
													<span class="pricing__plan-feature text-xs">Unlimited spaces &amp; SKUs<br /></span>
												</p>
												<p class="pricing__plan-price--pro">
													<span class="pricing__plan-feature text-xs">Embed on website (custom URL)<br /></span>
												</p>
												<p class="pricing__plan-price--pro">
													<span class="pricing__plan-feature text-xs">Analytics dashboard<br /></span>
												</p>
												<p class="pricing__plan-price--pro">
													<span class="pricing__plan-feature--highlight text-sm">Add-on: <br /></span>
												</p>
												<p class="pricing__plan-price--pro">
													<span class="pricing__plan-feature text-xs">Includes</span>
													<span class="pricing__plan-feature--highlight text-sm"> 1 growth pack/year </span>
													<span class="pricing__plan-feature text-xs"> (24 garments = €840 value).</span>
												</p>
											</div>
										</div>
										<button class="pricing__button--pro"><div class="pricing__plan-button-text">Get started</div></button>
									</div>
									<div class="pricing__plan--digitize">
										<div class="pricing__plan-content">
											<div class="pricing__plan-header">
												<div class="pricing__plan-name text-sm">Digitize packs</div>
												<div class="pricing__plan-price text-xs">One-time</div>
											</div>
											<div class="pricing__features-list--digitize">
												<p class="pricing__plan-price">
													<span class="interactive__title text-sm">Kickoff: </span>
													<span class="pricing__plan-period text-xs">12 garments → </span>
													<span class="interactive__title text-sm">€420/pack </span>
													<span class="pricing__plan-period text-xs">(€40/garment) <br /></span>
												</p>
												<p class="pricing__plan-price">
													<span class="interactive__title text-sm">Growth: </span>
													<span class="pricing__plan-period text-xs">24 garments → </span>
													<span class="interactive__title text-sm">€840/pack</span>
													<span class="pricing__plan-period text-xs"> (€35/garment) <br /></span>
												</p>
												<p class="pricing__plan-price">
													<span class="interactive__title text-sm">Scale: </span>
													<span class="pricing__plan-period text-xs">36 garments → </span>
													<span class="interactive__title text-sm">€1050/pack </span>
													<span class="pricing__plan-period text-xs">(€30/garment) </span>
												</p>
											</div>
										</div>
										<button class="pricing__button--digitize"><div class="hero__button-text">Get started</div></button>
									</div>
								</div>
							</div>
						</section>

						<!-- CTA Section -->
						<section class="section" id="cta">
							<div class="cta__content">
								<div class="cta__background">
									<div class="cta__background-overlap">
										<img class="cta__cone-image" src=${cta__background} />
										<img class="cta__background-image" src=${cta_model} />
									</div>
								</div>
								<div class="cta__text-section">
									<div class="cta__title text-xl">Join the future.</div>
									<p class="cta__description-text text-md">
										<span class="cta__description ">Turn your collections into </span>
										<span class="cta__description--highlight">playable, immersive,<br> made-to-order</span>
										<span class="cta__description"> experiences today. </span>
									</p>
									<custom-button variant="primary">See Drippy in action<img class="cta__arrow-icon" src="https://c.animaapp.com/mejigj1rAIvhIh/img/arrow-1.svg" /></custom-button>
								</div>
							</div>
						</section>

						<!-- Footer -->
						<footer class="footer__container">
							<img class="footer__divider" src="https://c.animaapp.com/mejigj1rAIvhIh/img/line-1.svg" />
							<div class="footer__content">
								<div class="footer__main">
									<div class="footer__brand">
										<img
											class="footer__logo"
											src="https://c.animaapp.com/mejigj1rAIvhIh/img/7aeb67c6-4bc1-4b4c-bbe1-b946b6c2ed7a--1--1.png"
										/>
										<div class="footer__copyright text-sm">@2025 - Drippy, Inc.</div>
									</div>
									<div class="footer__links">
										<a class="footer__link text-sm">Terms &amp; Conditions</a>
										<a class="footer__link text-sm">Privacy Policy</a>
										<a class="footer__link text-sm">Contact Us</a>
									</div>
								</div>
								<ul class="social-buttons">
									<li class="social-buttons__item">
										<a href="#" class="social-buttons__button" aria-label="Instagram">
											<img src="${instagramIcon}" alt="Instagram" class="social-buttons__icon social-buttons__icon--instagram">
										</a>
									</li>
									<li class="social-buttons__item">
										<a href="#" class="social-buttons__button" aria-label="Discord">
											<img src="${discordIcon}" alt="Discord" class="social-buttons__icon social-buttons__icon--discord">
										</a>
									</li>
									<li class="social-buttons__item">
										<a href="#" class="social-buttons__button" aria-label="Reddit">
											<img src="${redditIcon}" alt="Reddit" class="social-buttons__icon social-buttons__icon--reddit">
										</a>
									</li>
									<li class="social-buttons__item">
										<a href="#" class="social-buttons__button" aria-label="X (Twitter)">
											<img src="${twitterIcon}" alt="X (Twitter)" class="social-buttons__icon social-buttons__icon--twitter">
										</a>
									</li>
								</ul>
							</div>
						</footer>
					</div>
				</div>
			</div>
		</div>
	` as Node

document.body.append(...(Array.isArray(navbar) ? navbar : [navbar]))
document.body.append(...(Array.isArray(mainContent) ? mainContent : [mainContent]))

// Wait for all images and content to be fully loaded
function waitForContentReady() {
	// Check if all images are loaded
	const images = document.querySelectorAll('img')
	const imagePromises = Array.from(images).map(img => {
		if (img.complete) {
			return Promise.resolve()
		}
		return new Promise(resolve => {
			img.addEventListener('load', resolve)
			img.addEventListener('error', resolve) // Still resolve on error to not block
		})
	})

	// Wait for images + a small delay for layout settling
	Promise.all(imagePromises).then(() => {
		// Use requestAnimationFrame to ensure DOM has updated
		requestAnimationFrame(() => {
			hideLandingVideoLoading()
		})
	})
}

// Start waiting for content to be ready
waitForContentReady()

// Add smooth scroll behavior for header menu links
function setupSmoothScroll() {
	const headerMenu = document.querySelector('.header__menu')
	if (headerMenu) {
		headerMenu.addEventListener('click', e => {
			const target = e.target as HTMLElement
			if (target.classList.contains('header__menu-link')) {
				e.preventDefault()
				const targetId = target.getAttribute('href')?.substring(1)
				if (targetId) {
					const targetElement = document.getElementById(targetId)
					if (targetElement) {
						targetElement.scrollIntoView({behavior: 'smooth', block: 'start'})
						// Add offset for fixed header
						setTimeout(() => window.scrollBy({top: -120, behavior: 'smooth'}), 100)
					}
				}
			}
		})
	}
}

// Setup smooth scroll
setupSmoothScroll()
setTimeout(setupSmoothScroll, 500) // Retry if needed

// Statistics animation on scroll
function animateStatistics() {
	document.querySelectorAll('.statistics__ellipse').forEach(el => {
		const percent = (el as HTMLElement).dataset.percent
		const circle = el.querySelector('.progress') as SVGCircleElement
		if (circle && percent) {
			const radius = circle.r.baseVal.value
			const circumference = 2 * Math.PI * radius

			circle.style.strokeDasharray = circumference.toString()
			circle.style.strokeDashoffset = circumference.toString()

			setTimeout(() => {
				const offset = circumference - (parseInt(percent) / 100) * circumference
				circle.style.strokeDashoffset = offset.toString()
			}, 300)
		}
	})
}

// Intersection Observer for statistics section
const statisticsSection = document.getElementById('statistics')
if (statisticsSection) {
	const observer = new IntersectionObserver(
		entries => {
			entries.forEach(entry => {
				if (entry.isIntersecting) {
					animateStatistics()
					observer.unobserve(entry.target) // Only animate once
				}
			})
		},
		{
			threshold: 0.3, // Trigger when 30% of the section is visible
		},
	)

	observer.observe(statisticsSection)
}
