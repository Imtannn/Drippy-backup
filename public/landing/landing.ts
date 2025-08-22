import {html} from 'lume'
import '../routes.js' // track page visits
import '../elements/login-ui.js'
import '../elements/theme-switch.js'
import '../elements/custom-button.js'
// const logoUrl = new URL('../images/logo.svg', import.meta.url)
// const logoUrlDark = new URL('../images/logo-dark.svg', import.meta.url)
const blingImage1 = new URL('../images/landing/bling-1.png', import.meta.url).href
const blingImage2 = new URL('../images/landing/bling-2.png', import.meta.url).href
const blingImage3 = new URL('../images/landing/bling-3.png', import.meta.url).href
const modelImage1 = new URL('../images/landing/model-1.png', import.meta.url).href
const modelImage2 = new URL('../images/landing/model-2.png', import.meta.url).href
const matImage1 = new URL('../images/landing/mat-1.png', import.meta.url).href
const matImage2 = new URL('../images/landing/mat-2.png', import.meta.url).href
const matImage3 = new URL('../images/landing/mat-3.png', import.meta.url).href
const stepImage1 = new URL('../images/landing/step-1.png', import.meta.url).href

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
		number: '+94%',
		source: 'Source: Shopify, 2021',
	},
	{
		id: 2,
		name: 'Boost up engagement',
		des: 'Four in five shoppers interact longer with 3D (34% over 30+ seconds)',
		image: new URL('../images/landing/statistic-2.png', import.meta.url).href,
		number: '+82%',
		source: 'Source: Cappasity, 2020',
	},
	{
		id: 3,
		name: 'More add-to-cart',
		des: 'More add-to-cart actions if 3D and personalization is being offered.',
		image: new URL('../images/landing/statistic-3.png', import.meta.url).href,
		number: '+35%',
		source: 'Source: Cappasity, 2020',
	},
	{
		id: 4,
		name: 'More sales',
		des: 'Brands using personalization see higher revenue on average.',
		image: new URL('../images/landing/statistic-4.png', import.meta.url).href,
		number: '+20%',
		source: 'Source: McKinsey, 2021',
	},
]

document.body.append(
	html`
		<main class="landing-page-desktop" role="main">
			<!-- Header Navigation -->
			<nav class="header">
				<div class="header__logo">
					<img
						src="https://c.animaapp.com/mejigj1rAIvhIh/img/7aeb67c6-4bc1-4b4c-bbe1-b946b6c2ed7a--1--1.png"
						alt="Drippy Logo"
						class="header__logo-img"
					/>
				</main>
				<ul class="header__menu">
					<li class="header__menu-item"><a href="#features" class="header__menu-link">Features</a></li>
					<li class="header__menu-item"><a href="#pricing" class="header__menu-link">How it works</a></li>
					<li class="header__menu-item"><a href="#about" class="header__menu-link">Use Cases</a></li>
					<li class="header__menu-item"><a href="#contact" class="header__menu-link">Pricing</a></li>
				</ul>
				<div class="header__actions">
					<button class="btn btn--primary" aria-label="Book a demo">Book a demo</button>
				</section>
				<button class="header__mobile-toggle" aria-label="Toggle mobile menu" aria-expanded="false">
					<span class="header__mobile-toggle-line"></span>
					<span class="header__mobile-toggle-line"></span>
					<span class="header__mobile-toggle-line"></span>
				</button>
			</nav>

			<div class="container">
				<div class="overlap">
					<div class="frame">
						<!-- Hero Section -->
						<section class="hero-header" aria-labelledby="hero-title">
							<p id="hero-title" class="stop-selling-clothes">Stop selling clothes. <br />Start selling experiences.</p>
							<p class="hero__subtitle">
								Turn your e-commerce into an
								<span class="highlight"> interactive 3D <br> studio </span>
							that boosts engagement and sales.
							</p>
							<div class="hero__actions">
								<custom-button variant="secondary" size="large">See it live</custom-button>
								<custom-button variant="primary" size="large">Book a demo</custom-button>
							</section>
						</section>

						<!-- Brands Section -->
						<section class="section">
							<div class="section-header">
								<div class="section-title">Backed by the fearless.</div>
								<div class="section-subtitle">Trusted by the rebels.</div>
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
						<div class="section">
							<div class="section-header">
								<div class="section-title">
									<span>Interactive 3D is </span> <span class="hero__title--highlight">the new black.</span>
								</div>
								<div class="section-subtitle">Static images are dead — Today shoppers want fun, interaction, and engagement.</div>
							</div>
							<div class="showcase__container">
								<div class="showcase">
									<div class="showcase__item">
										<div class="showcase__background">
											<div class="showcase__model-display">
												<img class="showcase__model" src="${modelImage1}" alt="3D model visualization showing product customization" />
											</div>
										</div>
									</div>
									<div class="showcase__item">
										<div class="showcase__background">
											<div class="showcase__controls">
												<img class="showcase__avatar-option" src=${matImage1} alt="Material option 1 for customization" />
												<img class="showcase__avatar-option" src=${matImage2} alt="Material option 2 for customization" />
												<img class="showcase__avatar-option" src=${matImage3} alt="Material option 3 for customization" />
											</div>
											<div class="showcase__selector">
												<div class="showcase__selector-dot"></div>
												<div class="showcase__selector-text">Male avatar</div>
												<img
													class="showcase__selector-icon"
													src="https://c.animaapp.com/mejigj1rAIvhIh/img/vector-1.svg"
													alt="Avatar selection dropdown"
												/>
											</div>
											<div class="showcase__model-display">
												<img class="showcase__model" src="${modelImage2}" alt="3D avatar model with interactive controls" />
											</div>
											<div class="showcase__label">Interactive 3D with avatars</div>
										</div>
									</div>
								</div>
							</div>
						</div>

						<!-- Statistics Section -->
						<div class="section">
							<div class="section-header">
								<div class="section-title">Well, numbers do not lie.</div>
								<div class="section-subtitle">3D and personalization aren't just buzz — they drive business metrics.</div>
							</div>
							<div class="statistics__grid">
								${statistics.map(
									(stat: any) => html`
										<div class="statistics__item">
											<div class="statistics__icon-container">
												<div class="statistics__icon-overlap">
													<div class="group-wrapper">
														<div class="statistics__ellipse">
															<img class="group-wrapper" src=${stat.image} />
														</div>
													</div>
													<div class="statistics__number">${stat.number}</div>
												</div>
											</div>
											<div class="statistics__content">
												<div class="statistics__item-title">${stat.name}</div>
												<p class="statistics__item-description">${stat.des}</p>
												<div class="statistics__source">${stat.source}</div>
											</div>
										</div>
									`,
								)}
							</div>
						</div>

						<!-- Drippy Features Section -->
						<section class="section-drippy" aria-labelledby="features-title">
							<div class="features__container">
								<div class="features__content">
									<div class="features__header">
										<div id="features-title" class="drippy-is-the-new">
											<span class="hero__title">Drippy is the new storefront, </span>
											<span class="hero__title--highlight">reimagined. </span>
										</div>
										<p class="features__subtitle">Let shoppers play, remix, and buy — all in one place.</p>
									</div>
									<div class="features__grid">
										<div class="feature__wrapper">
											<div class="feature__item">
												<div class="feature__number-container">
													<div class="feature__number-wrapper">
														<div class="feature__number-overlap"><div class="feature__number">1</div></div>
													</div>
												</div>
												<div class="feature__content">
													<p class="feature__title">Turn store into a playground</p>
													<p class="feature__description">Let shoppers explore 3D spaces, remix designs, styled avatars.</p>
												</div>
											</div>
										</div>
										<div class="feature__wrapper">
											<div class="feature__item">
												<div class="feature__number-container">
													<div class="feature__number-wrapper">
														<div class="feature__number-overlap"><div class="feature__number">2</div></div>
													</div>
												</div>
												<div class="feature__content">
													<div class="feature__title">Sell what people want</div>
													<p class="feature__description">
														Collect payments and orders directly - Fulfill on made-to-order basis.
													</p>
												</div>
											</div>
										</div>
										<div class="feature__item--second">
											<div class="feature__item">
												<div class="feature__number-container">
													<div class="feature__number-wrapper">
														<div class="feature__number-overlap"><div class="feature__number">3</div></div>
													</div>
												</div>
												<div class="feature__content">
													<div class="feature__title">Collect powerful insights</div>
													<p class="feature__description">Get real-time signals on what to produce — no more guesswork.</p>
												</div>
											</div>
										</div>
										<div class="feature__item--third">
											<div class="feature__item">
												<div class="feature__number-container">
													<div class="feature__number-wrapper">
														<div class="feature__number-overlap"><div class="feature__number">4</div></div>
													</div>
												</div>
												<div class="feature__item--fourth">
													<div class="feature__title">Build &amp; grow community</div>
													<p class="feature__description">
														Host in-app challenges that turn your audience into fans &amp; co-creators
													</p>
												</div>
											</div>
										</div>
									</div>
								</div>
								<div class="hero__actions">
									<custom-button variant="secondary" size="large">See it live</custom-button>
									<custom-button variant="primary" size="large">Book a demo</custom-button>
								</div>
							</div>
							<img class="features__image" src=${stepImage1} />
						</div>

						<!-- How it Works Section -->
						<div class="section">
							<div class="section-header">
								<div class="section-title">Built like a game, feel like a game.</div>
								<div class="section-subtitle">Here&#39;s how it work from your shoppers' POV.</div>
							</div>
							<div class="how-it-works__grid">
								${steps.map(
									(step: any) => html`
										<div class="how-it-works__item">
											<div class="how-it-works__step">
												<div class="how-it-works__step-title">${step.name}</div>
												<img class="how-it-works__step-image" src=${step.logo} />
											</div>
											<p class="how-it-works__description">${step.des}</p>
										</div>
									`,
								)}
							</div>
							<div class="hero__actions">
								<custom-button variant="secondary" size="large">See it live</custom-button>
								<custom-button variant="primary" size="large">Book a demo</custom-button>
							</div>
						</div>

						<!-- Platform Integration Section -->
						<div class="platform__container">
							<div class="section-header">
								<div class="section-title" id="platform-title">A plug &amp; play 3D studio.</div>
								<div class="section-subtitle">Browser-based, mobile-first. Zero download, Zero friction.</div>
							</div>
							<div class="platform__content">
								<div class="platform__grid">
									<div class="platform__card">
										<div class="platform__card-overlap">
											<div class="platform__card-content">
												<div class="platform__card-text">
													<div class="statistics__item-title">Link in bios</div>
													<p class="statistics__description">
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
										<div class="platform__card-wrapper">
											<div class="platform__card">
												<div class="platform__card-inner">
													<div class="platform__card-overlap">
														<div class="platform__card-content">
															<div class="platform__card-text">
																<div class="statistics__item-title">Embed on website</div>
																<p class="statistics__description">
																	Plug Drippy directly into your online store. Same site, new experience.
																</p>
															</div>
														</div>
														<div class="platform__card-image"></div>
													</div>
												</div>
												<img class="platform__device-image--pm" src="https://c.animaapp.com/mejigj1rAIvhIh/img/device-14pm-2.png" />
											</div>
										</div>
									</div>
									<div class="platform__card--qr">
										<div class="platform__card-wrapper">
											<div class="platform__card-wrapper-overlap">
												<div class="platform__card-overlap">
													<div class="platform__card-content">
														<div class="platform__card-text">
															<div class="statistics__item-title">In-store QR</div>
															<p class="statistics__description">
																Turn retail into an interactive playground. One scan → instant 3D try-on →
																made-to-order.
															</p>
														</div>
													</div>
													<div class="platform__card-screenshot">
														<div class="platform__screenshot-wrapper">
															<img
																class="platform__screenshot"
																src="https://c.animaapp.com/mejigj1rAIvhIh/img/screenshot-2025-08-05-at-18-41-55-1.png"
															/>
														</div>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
								<div class="hero__actions">
									<custom-button variant="secondary" size="large">See it live</custom-button>
									<custom-button variant="primary" size="large">Book a demo</custom-button>
								</div>
							</div>
						</div>

						<!-- Pricing Section -->
						<div class="pricing__container">
							<div class="pricing__content">
								<div class="pricing__header">
									<div class="section-header">
										<div class="section-title">Our pricing.</div>
										<div class="section-subtitle">Pricing without the bullsh*t.</div>
									</div>
									<div class="pricing__toggle">
										<div class="pricing__toggle--yearly"><div class="hero__button-text">Yearly</div></div>
										<div class="pricing__toggle--monthly"><div class="pricing__toggle-text">Monthly</div></div>
									</div>
								</div>
								<div class="pricing__plans">
									<div class="pricing__plan--basic">
										<div class="pricing__plan-content">
											<div class="pricing__plan-header">
												<div class="pricing__plan-name">Studio</div>
												<p class="pricing__plan-price">
													<span class="interactive__title">€45</span> <span class="pricing__plan-period">/month/studio</span>
												</p>
											</div>
											<div class="pricing__features-list">
												<p class="pricing__plan-price">
													<span class="pricing__plan-period">3-month free trial <br /></span>
												</p>
												<p class="pricing__plan-price">
													<span class="pricing__plan-period">1 space<br /></span>
												</p>
												<p class="pricing__plan-price">
													<span class="pricing__plan-period">12 SKUs per space<br /></span>
												</p>
												<p class="pricing__plan-price">
													<span class="pricing__plan-period">Digitize service </span>
													<span class="pricing__plan-note">not included</span>
												</p>
											</div>
										</div>
										<div class="pricing__button--basic"><div class="hero__button-text">Start free trial</div></div>
									</div>
									<div class="pricing__plan--pro">
										<div class="pricing__plan-content">
											<div class="pricing__plan-header--pro">
												<div class="pricing__plan-title-section">
													<div class="pricing__plan-name--pro">Studio PRO</div>
													<div class="pricing__plan-badge"><div class="pricing__plan-badge-text">Best value</div></div>
												</div>
												<p class="pricing__plan-price--pro">
													<span class="interactive__title">€70</span> <span class="pricing__plan-period--pro">/month/studio</span>
												</p>
											</div>
											<div class="pricing__features-list--pro">
												<p class="pricing__plan-price--pro">
													<span class="pricing__plan-feature">Everything in </span>
													<span class="pricing__plan-feature--highlight">Studio</span>
													<span class="pricing__plan-feature">, plus:<br /></span>
												</p>
												<p class="pricing__plan-price--pro">
													<span class="pricing__plan-feature">Unlimited spaces &amp; SKUs<br /></span>
												</p>
												<p class="pricing__plan-price--pro">
													<span class="pricing__plan-feature">Embed on website (custom URL)<br /></span>
												</p>
												<p class="pricing__plan-price--pro">
													<span class="pricing__plan-feature">Analytics dashboard<br /></span>
												</p>
												<p class="pricing__plan-price--pro">
													<span class="pricing__plan-feature--highlight">Add-on: <br /></span>
												</p>
												<p class="pricing__plan-price--pro">
													<span class="pricing__plan-feature">Includes</span>
													<span class="pricing__plan-feature--highlight"> 1 growth pack/year </span>
													<span class="pricing__plan-feature"> (24 garments = €840 value).</span>
												</p>
											</div>
										</div>
										<button class="pricing__button--pro"><div class="pricing__plan-button-text">Get started</div></button>
									</div>
									<div class="pricing__plan--digitize">
										<div class="pricing__plan-content">
											<div class="pricing__plan-header">
												<div class="pricing__plan-name">Digitize packs</div>
												<div class="pricing__plan-price">One-time</div>
											</div>
											<div class="pricing__features-list--digitize">
												<p class="pricing__plan-price">
													<span class="interactive__title">Kickoff: </span>
													<span class="pricing__plan-period">12 garments → </span>
													<span class="interactive__title">€420/pack </span>
													<span class="pricing__plan-period">(€40/garment) <br /></span>
												</p>
												<p class="pricing__plan-price">
													<span class="interactive__title">Growth: </span>
													<span class="pricing__plan-period">24 garments → </span>
													<span class="interactive__title">€840/pack</span>
													<span class="pricing__plan-period"> (€35/garment) <br /></span>
												</p>
												<p class="pricing__plan-price">
													<span class="interactive__title">Scale: </span>
													<span class="pricing__plan-period">36 garments → </span>
													<span class="interactive__title">€1050/pack </span>
													<span class="pricing__plan-period">(€30/garment) </span>
												</p>
											</div>
										</div>
										<button class="pricing__button--digitize"><div class="hero__button-text">Get started</div></button>
									</div>
								</div>
							</div>
						</div>

						<!-- CTA Section -->
						<div class="cta__container">
							<div class="cta__content">
								<div class="cta__background">
									<div class="cta__background-overlap">
										<img class="cta__cone-image" src="https://c.animaapp.com/mejigj1rAIvhIh/img/cone-01-2-2.png" />
										<img class="cta__background-image" src="https://c.animaapp.com/mejigj1rAIvhIh/img/group-11565.png" />
									</div>
								</div>
								<div class="cta__text-section">
									<div class="cta__title">Join the future.</div>
									<p class="cta__description-text">
										<span class="cta__description">Turn your collections into </span>
										<span class="cta__description--highlight">playable, immersive, made-to-order</span>
										<span class="cta__description"> experiences today. </span>
									</p>
									<div class="cta__button">
										<div class="cta__button-text">See Drippy in action</div>
										<img class="cta__arrow-icon" src="https://c.animaapp.com/mejigj1rAIvhIh/img/arrow-1.svg" />
									</div>
								</div>
							</div>
						</div>

						<!-- Footer -->
						<div class="footer__container">
							<img class="footer__divider" src="https://c.animaapp.com/mejigj1rAIvhIh/img/line-1.svg" />
							<div class="footer__content">
								<div class="footer__main">
									<div class="footer__brand">
										<img
											class="footer__logo"
											src="https://c.animaapp.com/mejigj1rAIvhIh/img/7aeb67c6-4bc1-4b4c-bbe1-b946b6c2ed7a--1--1.png"
										/>
										<div class="footer__copyright">@2025 - Drippy, Inc.</div>
									</div>
									<div class="footer__links">
										<div class="footer__link">Terms &amp; Conditions</div>
										<div class="footer__link">Privacy Policy</div>
										<div class="footer__link">Contact Us</div>
									</div>
								</div>
								<img class="footer__social-icon" src="https://c.animaapp.com/mejigj1rAIvhIh/img/frame-12632.svg" />
							</div>
						</div>
					</div>

					<!-- Decorative Elements -->
					<div class="cta__cone-image-wrapper">
						<img class="cta__cone-image--2" src=${blingImage1} />
					</div>
					<img class="cta__cone-image--3" src=${blingImage2} />
					<img class="cta__cone-image--4" src=${blingImage3} />
				</div>
			</div>
		</div>
	` as Node,
)

// Hide the loading cover
const loadingCover = document.getElementById('loadingCover')
loadingCover?.classList.add('invisible')
loadingCover?.addEventListener('transitionend', () => loadingCover.remove())
