import {html} from 'lume'
import {createSignal} from 'solid-js'
import '../elements/avatar-selector.js'
import '../elements/custom-button.js'
import '../routes.js' // track page visits
import '../elements/login-ui.js'
import '../elements/theme-switch.js'
import '../elements/video-loading.js'
import '../app/drippy-scene.js'
import {store} from '../app/store.js'

import type {Fabric} from '../types/fabric.js'
import type {TemplateCategory} from '../types/template.js'
import type {BlockCategory} from '../types/block.js'

const materials = [
	{
		id: '6',
		thumb:
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/eliseF/root/POLYESTER_-_NAVY/POLYESTER_-_NAVY_-_RENDER.webp',
		normal:
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/eliseF/root/POLYESTER_-_NAVY/POLYESTER_-_NAVY_-_NORMAL.jpg',
		baseColor:
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/eliseF/root/POLYESTER_-_NAVY/POLYESTER_-_NAVY_-_BASE.jpg',
		displacement:
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/eliseF/root/POLYESTER_-_NAVY/POLYESTER_-_NAVY_-_DISPLACE.jpg',
		roughness:
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/eliseF/root/POLYESTER_-_NAVY/POLYESTER_-_NAVY_-_ROUGH.jpg',
		alpha: '',
		materialName: 'Navy',
		category: 'Polyester',
		templateCategories: ['Top'],
	},
	{
		id: '9',
		thumb:
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/eliseF/root/STRIPED_-_TANKTOP/STRIPED_-_TANKTOP_-_RENDER.webp',
		normal:
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/eliseF/root/STRIPED_-_TANKTOP/STRIPED_-_TANKTOP_-_NORMAL.jpg',
		baseColor:
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/eliseF/root/STRIPED_-_TANKTOP/STRIPED_-_TANKTOP_-_BASE.jpg',
		displacement:
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/eliseF/root/STRIPED_-_TANKTOP/STRIPED_-_TANKTOP_-_DISPLACE.jpg',
		roughness:
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/eliseF/root/STRIPED_-_TANKTOP/STRIPED_-_TANKTOP_-_ROUGH.jpg',
		alpha: '',
		materialName: 'Tanktop',
		category: 'Striped',
		templateCategories: ['Top'],
	},
	{
		id: '8',
		thumb:
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/eliseF/root/COTTON_-_ORANGE/COTTON_-_ORANGE_-_RENDER.webp',
		normal:
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/eliseF/root/COTTON_-_ORANGE/COTTON_-_ORANGE_-_NORMAL.jpg',
		baseColor:
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/eliseF/root/COTTON_-_ORANGE/COTTON_-_ORANGE_-_BASE.jpg',
		displacement:
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/eliseF/root/COTTON_-_ORANGE/COTTON_-_ORANGE_-_DISPLACE.jpg',
		roughness:
			'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/fabrics/eliseF/root/COTTON_-_ORANGE/COTTON_-_ORANGE_-_ROUGH.jpg',
		alpha: '',
		materialName: 'Orange',
		category: 'Cotton',
		templateCategories: ['Top'],
	},
]
// Show video loading initially
function showVideoLoading() {
	console.log('Showing video loading screen')
	const videoLoadingElement = html`<video-loading></video-loading>`
	document.body.appendChild(videoLoadingElement as any)
	return videoLoadingElement
}

// Hide video loading when content is ready
function hideVideoLoading(videoLoadingElement: any) {
	if (videoLoadingElement && videoLoadingElement.parentNode) {
		console.log('Hiding video loading screen')
		videoLoadingElement.remove()
	} else {
		console.log('Video loading element not found or already removed')
	}
}
const [isYearlyActive, setIsYearlyActive] = createSignal(true)

const currentMaterials = materials

function handleMaterialClick(material: (typeof materials)[0]) {
	const fabricData: {
		fabric: Fabric
		blockCategory: BlockCategory
		templateCategory: TemplateCategory
		assignedMesh: string
	}[] = []

	// Convert material to Fabric format
	const fabric: Fabric = {
		_id: material.id,
		thumb: material.thumb,
		normal: material.normal,
		baseColor: material.baseColor,
		displacement: material.displacement,
		roughness: material.roughness,
		alpha: material.alpha,
		materialName: material.materialName,
		category: material.category as Fabric['category'],
		templateCategories: material.templateCategories,
	}

	// Set fabric for Top template and Bodice block category
	fabricData.push({
		fabric: fabric,
		blockCategory: 'Bodice' as BlockCategory,
		templateCategory: 'Top' as TemplateCategory,
		assignedMesh: '42-44-31-23-6-9-41-27', // Use the same mesh key as existing fabric
	})

	if (fabricData.length > 0) {
		store.setSelectedFabrics = fabricData
	}
}

// Hide the loading cover
// const loadingCover = document.getElementById('loadingCover')
// console.log('loadingCover', loadingCover)
// loadingCover?.classList.add('invisible')
// loadingCover?.addEventListener('transitionend', () => loadingCover.remove())

// const logoUrl = new URL('../images/logo.svg', import.meta.url)
const logoUrlDark = new URL('../images/landing/logo.png', import.meta.url)
const blingImage1 = new URL('../images/landing/bling-1.png', import.meta.url).href
const blingImage2 = new URL('../images/landing/bling-2.png', import.meta.url).href
const blingImage3 = new URL('../images/landing/bling-3.png', import.meta.url).href
const modelImage1 = new URL('../images/landing/model-1.png', import.meta.url).href

const stepImage1 = new URL('../images/landing/step-1.png', import.meta.url).href

const cta__background = new URL('../images/landing/cta-background.png', import.meta.url).href
const cta_model = new URL('../images/landing/cta-model.png', import.meta.url).href

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
	// {
	// 	id: 2,
	// 	name: 'Brand 2',
	// 	logo: new URL('../images/landing/brand-2.png', import.meta.url).href,
	// },
	// {
	// 	id: 3,
	// 	name: 'Brand 3',
	// 	logo: new URL('../images/landing/brand-3.png', import.meta.url).href,
	// },
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
			<custom-button variant="primary" size="small" href="https://calendly.com/rubydrippy3d/30min"
				>Book a demo</custom-button
			>
		</div>
		<button class="header__mobile-toggle" aria-label="Toggle mobile menu" aria-expanded="false">
			<span class="header__mobile-toggle-line"></span>
			<span class="header__mobile-toggle-line"></span>
			<span class="header__mobile-toggle-line"></span>
		</button>
	</nav>
`

// Add main content với reactive pricing buttons
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
							<div class="bg-background"></div>

							<div class="hero__actions">
								<custom-button variant="secondary" href="/">See it live</custom-button>
								<custom-button variant="primary" href="https://calendly.com/rubydrippy3d/30min">Book a demo</custom-button>
							</div>
						</section>
						<img class="cta__cone-image--2" src=${blingImage1} />

						<img class="cta__cone-image--3" src=${blingImage2} />
						<img class="cta__cone-image--4" src=${blingImage3} />
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
												${currentMaterials.map(
													(material: any) => html`
														<div
															class="showcase__avatar-option"
															data-material-id=${material.id}
															onclick=${() => handleMaterialClick(material)}
														>
															<img src=${material.thumb} alt=${material.materialName} />
														</div>
													`,
												)}
											</div>

											<avatar-selector target-model=".showcase__avatar-model" class="showcase__selector"></avatar-selector>

											<div class="showcase__model-center">
												<drippy-scene
													class="showcase__model"
													selected-space=${() => store.selectedSpace}
													selected-avatar=${() => store.selectedAvatar}
													selected-fabrics=${() => store.selectedFabrics}
													selected-blocks=${() => store.selectedBlocks}
												></drippy-scene>
											</div>
											<div class="showcase__label text-xs">Interactive 3D with avatars</div>
										</div>
									</div>
								</div>
							</div>

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
										<img class="features__image mobile" src=${stepImage1} />
										<div class="feature__wrapper">
											<div class="feature__item">
												<div class="feature__number-container">
													<div class="feature__number-wrapper">
														<div class="feature__number-overlap"><div class="feature__number text-xs">1</div></div>
													</div>
												</div>
												<div class="feature__content">
													<p class="feature__title text-md-1">Turn store into a playground</p>
													<p class="feature__description text-md">Let shoppers explore 3D spaces, remix designs, styled avatars.</p>
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
													<p class="feature__description text-md">
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
													<p class="feature__description text-md">Get real-time signals on what to produce — no more guesswork.</p>
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
													<p class="feature__description text-md">
														Host in-app challenges that turn your audience into fans &amp; co-creators
													</p>
												</div>
											</div>
										</div>
									</div>
								</div>
								<div class="hero__actions">
									<custom-button variant="secondary" href="/">See it live</custom-button>
									<custom-button variant="primary" href="https://calendly.com/rubydrippy3d/30min">Book a demo</custom-button>
								</div>
							</div>
							<img class="features__image desktop" src=${stepImage1} />
						</section>

						<!-- How it Works Section -->
						<section id="how-it-works" class="section">
							<div class="section-header">
								<div class="section-title text-lg">Built like a game, feel like a game.</div>
								<div class="section-subtitle text-md-2">Here&#39;s how it work from your shoppers' POV.</div>
							</div>

							<div class="how-it-works__content">
								<div class="how-it-works__grid">
									${steps.map(
										(step: any) => html`
											<div class="how-it-works__item">
												<div class="how-it-works__step">
													<img class="how-it-works__step-image" src=${step.logo} />
												</div>
												<div class="how-it-works__step-title text-md-1">${step.name}</div>
												<p class="how-it-works__description text-md">${step.des}</p>
											</div>
										`,
									)}
								</div>
							</div>

							<div class="hero__actions">
								<custom-button variant="secondary" href="/">See it live</custom-button>
								<custom-button variant="primary" href="https://calendly.com/rubydrippy3d/30min">Book a demo</custom-button>
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
													<p class="statistics__description text-md">
														No website? no problem. Drop Drippy in your bio and turn followers into shoppers.
													</p>
												</div>
											</div>
											<div class="platform__card-image">
												<div class="platform__screenshot studio-1"></div>
											</div>
										</div>
									</div>
									<div class="platform__card">
										<div class="platform__card-overlap">
											<div class="platform__card-content">
												<div class="platform__card-text">
													<div class="statistics__item-title text-md-1">Embed on website</div>
													<p class="statistics__description text-md">
														Plug Drippy directly into your online store. Same site, new experience.
													</p>
												</div>
											</div>
											<div class="platform__card-image">
												<div class="platform__screenshot studio-2"></div>
											</div>
										</div>
									</div>
									<div class="platform__card">
										<div class="platform__card-overlap">
											<div class="platform__card-content">
												<div class="platform__card-text">
													<div class="statistics__item-title text-sm">In-store QR</div>
													<p class="statistics__description text-md">
														Turn retail into an interactive playground. One scan → instant 3D try-on →
														made-to-order.
													</p>
												</div>
											</div>
											<div class="platform__card-image">
												<div class="platform__screenshot studio-3"></div>
											</div>
										</div>
									</div>
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
										<custom-button
											variant=${() => (isYearlyActive() ? 'primary' : 'secondary')}
											data-action="toggle"
										>
											Yearly
										</custom-button>
										<custom-button
											variant=${() => (isYearlyActive() ? 'secondary' : 'primary')}
											data-action="toggle"
										>
											Monthly
										</custom-button>
									</div>
								</div>
								<div class="pricing__plans">
									<div class="pricing__plan--basic pricing__plans--item">
										<div class="pricing__plan-content">
											<div class="pricing__plan-header">
												<div class="pricing__plan-name text-md">Studio</div>
												<p class="pricing__plan-price">
													<span class="interactive__title text-md">€${() => (isYearlyActive() ? '45' : '50')}</span> <span class="pricing__plan-period text-md">/month/studio</span>
												</p>
											</div>
											<div class="pricing__features-list">
												<p class="pricing__plan-price">
													<span class="pricing__plan-period list-type text-md">3-month free trial <br /></span>
												</p>
												<p class="pricing__plan-price">
													<span class="pricing__plan-period list-type text-md">1 space<br /></span>
												</p>
												<p class="pricing__plan-price">
													<span class="pricing__plan-period list-type text-md">12 SKUs per space<br /></span>
												</p>
												<p class="pricing__plan-price">
													<span class="pricing__plan-period text-md">Digitize service </span>
													<span class="pricing__plan-note text-md">not included</span>
												</p>
											</div>
										</div>
										<div class="pricing__button--basic"><div class="hero__button-text">Start free trial</div></div>
									</div>
									<div class="pricing__plan--pro pricing__plans--item">
										<div class="pricing__plan-content">
											<div class="pricing__plan-header--pro">
												<div class="pricing__plan-title-section">
													<div class="pricing__plan-name--pro text-md">Studio PRO</div>
													<div class="pricing__plan-badge"><div class="pricing__plan-badge-text text-md">Best value</div></div>
												</div>
												<p class="pricing__plan-price--pro">
													<span class="interactive__title text-md">€${() => (isYearlyActive() ? '70' : '75')}</span> <span class="pricing__plan-period--pro text-md">/month/studio</span>
												</p>
											</div>
											<div class="pricing__features-list--pro">
												<p class="pricing__plan-price--pro">
													<span class="pricing__plan-feature text-md">Everything in </span>
													<span class="pricing__plan-feature--highlight text-md">Studio</span>
													<span class="pricing__plan-feature text-md">, plus:<br /></span>
												</p>
												<p class="pricing__plan-price--pro">
													<span class="pricing__plan-feature list-type text-md">Unlimited spaces &amp; SKUs<br /></span>
												</p>
												<p class="pricing__plan-price--pro">
													<span class="pricing__plan-feature list-type text-md">Embed on website (custom URL)<br /></span>
												</p>
												<p class="pricing__plan-price--pro">
													<span class="pricing__plan-feature list-type text-md">Analytics dashboard<br /></span>
												</p>
											</div>
										</div>
										<button class="pricing__button--pro"><div class="pricing__plan-button-text">Start free trial</div></button>
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
									<p class="cta__description-text text-md-1">
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

// No need to set default - let the reactive function handle it

// Show video loading immediately when landing page starts loading
const videoLoadingElement = showVideoLoading()

// Fallback timeout to ensure loading screen is hidden after maximum 5 seconds
const maxLoadingTime = 5000
setTimeout(() => {
	console.log('Fallback timeout: hiding video loading screen')
	hideVideoLoading(videoLoadingElement)
}, maxLoadingTime)

// First, append the content to DOM so we can track image loading
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

	// Wait for images + a minimum delay to ensure loading screen shows
	Promise.all(imagePromises).then(() => {
		const minLoadingTime = 3000
		const startTime = Date.now()

		const hideLoading = () => {
			const elapsed = Date.now() - startTime
			const remainingTime = Math.max(0, minLoadingTime - elapsed)

			setTimeout(() => {
				// Use requestAnimationFrame to ensure DOM has updated
				requestAnimationFrame(() => {
					hideVideoLoading(videoLoadingElement)
				})
			}, remainingTime)
		}

		hideLoading()
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

// Add event listeners for pricing toggle buttons
setTimeout(() => {
	document.querySelectorAll('[data-action="toggle"]').forEach(button => {
		button.addEventListener('click', () => {
			setIsYearlyActive(!isYearlyActive())
		})
	})
}, 100)

// Generic carousel functionality - Can be used for any section
function initGenericCarousel(config: {
	trackSelector: string
	itemSelector: string
	containerSelector: string
	minWidth: number
	maxWidth: number
	itemWidth: number
}) {
	const track = document.querySelector(config.trackSelector) as HTMLElement
	const items = document.querySelectorAll(config.itemSelector) as NodeListOf<HTMLElement>
	const container = document.querySelector(config.containerSelector) as HTMLElement

	if (!track || !items.length || !container) return

	let activeIndex = 0
	let startX = 0
	let isDragging = false
	let isActive = false
	let eventListeners: Array<{element: HTMLElement | Window; event: string; handler: Function}> = []
	let resizeTimeout: ReturnType<typeof setTimeout>
	let progressContainer: HTMLElement | null = null
	let progressDots: HTMLElement[] = []

	// Helper function to check if carousel should be active
	const isCarouselActive = () =>
		isActive && container.classList.contains('carousel') && document.querySelectorAll('.carousel-item').length > 0

	// Calculate offset for carousel positioning
	const calculateOffset = (index: number) => {
		// On mobile (< 480px), don't apply transform - items stay centered
		if (window.innerWidth < 480) {
			return 0
		}

		const containerWidth = container.offsetWidth
		const itemWidth = config.itemWidth + 32 // item width + gap
		const totalItems = items.length

		if (index === 0) return 20 // First item: align to left
		if (index === totalItems - 1) return -(index * itemWidth) + (containerWidth - itemWidth - 20) // Last item: align to right
		return -(index * itemWidth) + (containerWidth - itemWidth) / 2 // Middle items: center
	}

	// Create progress indicator for mobile
	const createProgressIndicator = () => {
		if (window.innerWidth >= 480) return

		// Remove existing progress indicator
		if (progressContainer) {
			progressContainer.remove()
		}

		// Only show progress if there are multiple items
		if (items.length <= 1) return

		progressContainer = document.createElement('div')
		progressContainer.className = 'carousel-progress'

		progressDots = []
		for (let i = 0; i < items.length; i++) {
			const dot = document.createElement('div')
			dot.className = 'carousel-progress-dot'
			if (i === activeIndex) dot.classList.add('active')

			// Add click handler to jump to specific item
			dot.addEventListener('click', () => {
				activeIndex = i
				updateCarousel()
			})

			progressContainer.appendChild(dot)
			progressDots.push(dot)
		}

		// Insert progress indicator after the container
		container.parentNode?.insertBefore(progressContainer, container.nextSibling)
	}

	// Update progress indicator
	const updateProgressIndicator = (index = activeIndex) => {
		if (!progressDots.length || window.innerWidth >= 480) return

		progressDots.forEach((dot, i) => {
			dot.classList.toggle('active', i === index)
		})
	}

	// Update carousel position and active states
	const updateCarousel = (index = activeIndex) => {
		if (!isCarouselActive()) return

		const offset = calculateOffset(index)

		// Debug logs for mobile
		if (window.innerWidth < 480) {
			console.log(`Mobile carousel update - Index: ${index}, Offset: ${offset}, Active: ${isActive}`)
		}

		track.style.transform = `translateX(${offset}px)`
		items.forEach((item, i) => item.classList.toggle('active', i === index))

		// Update progress indicator for mobile
		updateProgressIndicator(index)
	}

	// Reset carousel to default state
	const resetCarousel = () => {
		activeIndex = 0
		if (isCarouselActive()) {
			updateCarousel()
		} else {
			track.style.transform = 'translateX(0)'
			items.forEach(item => item.classList.remove('active'))
			// Remove progress indicator when carousel is inactive
			if (progressContainer) {
				progressContainer.remove()
				progressContainer = null
				progressDots = []
			}
		}
	}

	// Handle swipe gestures
	const handleSwipe = (deltaX: number) => {
		if (!isCarouselActive()) return

		if (deltaX > 50) activeIndex = Math.max(0, activeIndex - 1)
		else if (deltaX < -50) activeIndex = Math.min(items.length - 1, activeIndex + 1)

		updateCarousel()
	}

	// Event handlers
	const touchStartHandler = (e: TouchEvent) => {
		if (!isCarouselActive()) return
		startX = e.touches[0].clientX
	}

	const touchEndHandler = (e: TouchEvent) => {
		if (!isCarouselActive()) return
		handleSwipe(e.changedTouches[0].clientX - startX)
	}

	const mouseDownHandler = (e: MouseEvent) => {
		if (!isCarouselActive()) return
		isDragging = true
		startX = e.clientX
	}

	const mouseUpHandler = (e: MouseEvent) => {
		if (!isDragging || !isCarouselActive()) return
		isDragging = false
		handleSwipe(e.clientX - startX)
	}

	// Event listener management
	const addEventListeners = () => {
		removeEventListeners()
		if (!container.classList.contains('carousel')) return

		const events = [
			{event: 'touchstart', handler: touchStartHandler, options: {passive: true}},
			{event: 'touchend', handler: touchEndHandler, options: {passive: true}},
			{event: 'mousedown', handler: mouseDownHandler},
			{event: 'mouseup', handler: mouseUpHandler},
		]

		eventListeners = events.map(({event, handler, options}) => {
			container.addEventListener(event, handler as EventListener, options)
			return {element: container, event, handler}
		})
	}

	const removeEventListeners = () => {
		eventListeners.forEach(({element, event, handler}) => {
			element.removeEventListener(event, handler as EventListener)
		})
		eventListeners = []
	}

	// Toggle carousel state
	const toggleCarousel = (activate: boolean) => {
		container.classList.toggle('carousel', activate)
		items.forEach(item => {
			item.classList.toggle('carousel-item', activate)
			item.style.width = activate ? `${config.itemWidth}px` : ''
			item.style.flex = activate ? `0 0 ${config.itemWidth}px` : ''
		})

		if (activate) {
			addEventListeners()
			activeIndex = 0
			updateCarousel()
			// Create progress indicator for mobile
			createProgressIndicator()
		} else {
			removeEventListeners()
			resetCarousel()
		}
	}

	// Check screen size and toggle carousel accordingly
	const checkScreenSize = () => {
		clearTimeout(resizeTimeout)
		resizeTimeout = setTimeout(() => {
			const wasActive = isActive
			const currentWidth = window.innerWidth
			isActive = currentWidth >= config.minWidth && currentWidth <= config.maxWidth

			if (wasActive !== isActive) {
				toggleCarousel(isActive)
			} else if (isActive && currentWidth < 480) {
				// Update progress indicator when resizing on mobile
				createProgressIndicator()
			}
		}, 100)
	}

	// Initialize
	checkScreenSize()
	setTimeout(checkScreenSize, 200) // Ensure DOM is ready

	// Debug function
	;(window as any).forceDeactivateCarousel = () => {
		container.classList.remove('carousel')
		items.forEach(item => item.classList.remove('carousel-item'))
		removeEventListeners()
		track.style.transform = 'translateX(0)'
		items.forEach(item => item.classList.remove('active'))
		// Remove progress indicator
		if (progressContainer) {
			progressContainer.remove()
			progressContainer = null
			progressDots = []
		}
		isActive = false
	}

	window.addEventListener('resize', checkScreenSize, {passive: true})
}

// Handle <br> tags responsively (remove on mobile, restore on desktop)
function handleResponsiveBreaks() {
	const classes = ['.section-subtitle', '.highlight', '.cta__description--highlight']
	const originalContent = new Map() // Store original content

	function processBreaks() {
		const isMobile = window.innerWidth < 480

		classes.forEach(selector => {
			document.querySelectorAll(selector).forEach((element, index) => {
				const elementId = `${selector}-${index}`

				if (isMobile) {
					// Store original content if not already stored
					if (!originalContent.has(elementId)) {
						originalContent.set(elementId, element.innerHTML)
					}
					// Remove <br> tags on mobile
					element.innerHTML = element.innerHTML.replace(/<br\s*\/?>/gi, ' ')
				} else {
					// Restore original content on desktop
					if (originalContent.has(elementId)) {
						element.innerHTML = originalContent.get(elementId)
					}
				}
			})
		})
	}

	processBreaks()
	window.addEventListener('resize', processBreaks)
}

setTimeout(handleResponsiveBreaks, 100)

// Initialize carousel for how it work section
setTimeout(() => {
	initGenericCarousel({
		trackSelector: '.how-it-works__grid',
		itemSelector: '.how-it-works__item',
		containerSelector: '.how-it-works__content',
		minWidth: 0, // Allow mobile
		maxWidth: 830,
		itemWidth: 230,
	})
}, 150)
// Initialize carousel for Platform section
setTimeout(() => {
	initGenericCarousel({
		trackSelector: '.platform__grid',
		itemSelector: '.platform__card',
		containerSelector: '.platform__content',
		minWidth: 480,
		maxWidth: 830,
		itemWidth: 350,
	})
}, 150)
// Initialize carousel for Pricing section
setTimeout(() => {
	initGenericCarousel({
		trackSelector: '.pricing__plans',
		itemSelector: '.pricing__plans--item',
		containerSelector: '.pricing__content',
		minWidth: 480,
		maxWidth: 830,
		itemWidth: 350,
	})
}, 150)
