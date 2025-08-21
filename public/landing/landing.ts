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
		<div class="landing-page-desktop">
			<!-- Header Navigation -->
			<nav class="header">
				<div class="header__logo">
					<img
						src="https://c.animaapp.com/mejigj1rAIvhIh/img/7aeb67c6-4bc1-4b4c-bbe1-b946b6c2ed7a--1--1.png"
						alt="Drippy Logo"
						class="header__logo-img"
					/>
				</div>
				<ul class="header__menu">
					<li class="header__menu-item"><a href="#features" class="header__menu-link">Features</a></li>
					<li class="header__menu-item"><a href="#pricing" class="header__menu-link">How it works</a></li>
					<li class="header__menu-item"><a href="#about" class="header__menu-link">Use Cases</a></li>
					<li class="header__menu-item"><a href="#contact" class="header__menu-link">Pricing</a></li>
				</ul>
				<div class="header__actions">
					<button class="btn btn--primary">Book a demo</button>
				</div>
				<button class="header__mobile-toggle">
					<span class="header__mobile-toggle-line"></span>
					<span class="header__mobile-toggle-line"></span>
					<span class="header__mobile-toggle-line"></span>
				</button>
			</nav>

			<div class="div">
				<div class="overlap">
					<div class="frame">
						<!-- Hero Section -->
						<div class="hero-header">
							<p class="stop-selling-clothes">Stop selling clothes. <br />Start selling experiences.</p>
							<p class="turn-your-e-commerce">
								<span class="text-wrapper">Turn your e-commerce into an </span>
								<span class="span">interactive 3D studio </span>
								<span class="text-wrapper">that boosts engagement and sales.</span>
							</p>
							<div class="frame-2">
								<custom-button variant="secondary" size="large">See it live</custom-button>
								<custom-button variant="primary" size="large">Book a demo</custom-button>
							</div>
						</div>

						<!-- Brands Section -->
						<div class="div-2">
							<div class="frame-3">
								<div class="text-wrapper-4">Backed by the fearless.</div>
								<div class="text-wrapper-5">Trusted by the rebels.</div>
							</div>
							<div class="brands">
								${brands.map(
									(brand: any) => html`
										<div class="brands__item">
											<img src="${brand.logo}" alt="${brand.name}" class="brands__logo" />
										</div>
									`,
								)}
							</div>
						</div>

						<!-- Interactive 3D Section -->
						<div class="div-2">
							<div class="frame-4">
								<p class="interactive-is">
									<span class="text-wrapper-6">Interactive 3D is </span> <span class="span">the new black.</span>
								</p>
								<p class="p">Static images are dead — Today shoppers want fun, interaction, and engagement.</p>
							</div>
							<div class="frame-5">
								<div class="showcase">
									<div class="showcase__item showcase__item--visualization">
										<div class="showcase__background">
											<div class="showcase__model-display">
												<img class="showcase__model" src="${modelImage1}" alt="3D Model Visualization" />
											</div>
										</div>
									</div>
									<div class="showcase__item showcase__item--interactive">
										<div class="showcase__background">
											<div class="showcase__controls">
												<img class="showcase__avatar-option" src=${matImage1} alt="Material 1" />
												<img class="showcase__avatar-option" src=${matImage2} alt="Material 2" />
												<img class="showcase__avatar-option" src=${matImage3} alt="Material 3" />
											</div>
											<div class="showcase__selector">
												<div class="showcase__selector-dot"></div>
												<div class="showcase__selector-text">Male avatar</div>
												<img
													class="showcase__selector-icon"
													src="https://c.animaapp.com/mejigj1rAIvhIh/img/vector-1.svg"
													alt="Dropdown"
												/>
											</div>
											<div class="showcase__model-display">
												<img class="showcase__avatar-model" src="${modelImage2}" alt="3D Avatar Model" />
											</div>
											<div class="showcase__label">Interactive 3D with avatars</div>
										</div>
									</div>
								</div>
							</div>
						</div>

						<!-- Statistics Section -->
						<div class="div-2">
							<div class="frame-6">
								<p class="text-wrapper-9">Well, numbers do not lie.</p>
								<p class="text-wrapper-10">3D and personalization aren't just buzz — they drive business metrics.</p>
							</div>
							<div class="frame-7">
								${statistics.map(
									(stat: any) => html`
										<div class="frame-8">
											<div class="group-2">
												<div class="overlap-group-3">
													<div class="group-wrapper">
														<div class="ellipse-wrapper">
															<img class="group-wrapper" src=${stat.image} />
														</div>
													</div>
													<div class="text-wrapper-11">${stat.number}</div>
												</div>
											</div>
											<div class="frame-9">
												<div class="text-wrapper-12">${stat.name}</div>
												<p class="text-wrapper-13">${stat.des}</p>
												<div class="text-wrapper-14">${stat.source}</div>
											</div>
										</div>
									`,
								)}
							</div>
						</div>

						<!-- Drippy Features Section -->
						<div class="section-drippy">
							<div class="frame-11">
								<div class="frame-12">
									<div class="frame-13">
										<p class="drippy-is-the-new">
											<span class="text-wrapper-6">Drippy is the new storefront, </span>
											<span class="span">reimagined. </span>
										</p>
										<p class="text-wrapper-17">Let shoppers play, remix, and buy — all in one place.</p>
									</div>
									<div class="frame-14">
										<div class="frame-wrapper">
											<div class="frame-15">
												<div class="group-3">
													<div class="group-4">
														<div class="overlap-group-4"><div class="text-wrapper-18">1</div></div>
													</div>
												</div>
												<div class="frame-16">
													<p class="text-wrapper-19">Turn store into a playground</p>
													<p class="text-wrapper-20">Let shoppers explore 3D spaces, remix designs, styled avatars.</p>
												</div>
											</div>
										</div>
										<div class="frame-wrapper">
											<div class="frame-15">
												<div class="group-3">
													<div class="group-4">
														<div class="overlap-group-4"><div class="text-wrapper-18">2</div></div>
													</div>
												</div>
												<div class="frame-16">
													<div class="text-wrapper-19">Sell what people want</div>
													<p class="text-wrapper-20">
														Collect payments and orders directly - Fulfill on made-to-order basis.
													</p>
												</div>
											</div>
										</div>
										<div class="frame-17">
											<div class="frame-15">
												<div class="group-3">
													<div class="group-4">
														<div class="overlap-group-4"><div class="text-wrapper-18">3</div></div>
													</div>
												</div>
												<div class="frame-16">
													<div class="text-wrapper-19">Collect powerful insights</div>
													<p class="text-wrapper-20">Get real-time signals on what to produce — no more guesswork.</p>
												</div>
											</div>
										</div>
										<div class="frame-18">
											<div class="frame-15">
												<div class="group-3">
													<div class="group-4">
														<div class="overlap-group-4"><div class="text-wrapper-18">4</div></div>
													</div>
												</div>
												<div class="frame-19">
													<div class="text-wrapper-19">Build &amp; grow community</div>
													<p class="text-wrapper-20">
														Host in-app challenges that turn your audience into fans &amp; co-creators
													</p>
												</div>
											</div>
										</div>
									</div>
								</div>
								<div class="frame-2">
									<custom-button variant="secondary" size="large">See it live</custom-button>
									<custom-button variant="primary" size="large">Book a demo</custom-button>
								</div>
							</div>
							<img class="step-view-garments" src=${stepImage1} />
						</div>

						<!-- How it Works Section -->
						<div class="div-2">
							<div class="frame-20">
								<p class="text-wrapper-21">Built like a game, feel like a game.</p>
								<p class="here-s-how-it-work">Here&#39;s how it work from your shoppers' POV.</p>
							</div>
							<div class="frame-21">
								${steps.map(
									(step: any) => html`
										<div class="frame-22">
											<div class="group-6">
												<div class="text-wrapper-24">${step.name}</div>
												<img class="step-avatar-2" src=${step.logo} />
											</div>
											<p class="text-wrapper-23">${step.des}</p>
										</div>
									`,
								)}
							</div>
							<div class="frame-2">
								<custom-button variant="secondary" size="large">See it live</custom-button>
								<custom-button variant="primary" size="large">Book a demo</custom-button>
							</div>
						</div>

						<!-- Platform Integration Section -->
						<div class="frame-24">
							<div class="frame-25">
								<p class="a-plug-play">A plug &amp; play 3D studio.</p>
								<p class="text-wrapper-26">Browser-based, mobile-first. Zero download, Zero friction.</p>
							</div>
							<div class="frame-26">
								<div class="frame-27">
									<div class="div-3">
										<div class="overlap-group-5">
											<div class="group-7">
												<div class="frame-28">
													<div class="text-wrapper-12">Link in bios</div>
													<p class="text-wrapper-15">
														No website? no problem. Drop Drippy in your bio and turn followers into shoppers.
													</p>
												</div>
											</div>
											<div class="group-8">
												<img class="device" src="https://c.animaapp.com/mejigj1rAIvhIh/img/device-14pm-1.png" />
											</div>
										</div>
									</div>
									<div class="div-3">
										<div class="group-9">
											<div class="div-3">
												<div class="group-10">
													<div class="overlap-group-5">
														<div class="group-7">
															<div class="frame-28">
																<div class="text-wrapper-12">Embed on website</div>
																<p class="text-wrapper-15">
																	Plug Drippy directly into your online store. Same site, new experience.
																</p>
															</div>
														</div>
														<div class="group-8"></div>
													</div>
												</div>
												<img class="device-pm" src="https://c.animaapp.com/mejigj1rAIvhIh/img/device-14pm-2.png" />
											</div>
										</div>
									</div>
									<div class="group-11">
										<div class="group-9">
											<div class="overlap-wrapper">
												<div class="overlap-group-5">
													<div class="group-7">
														<div class="frame-28">
															<div class="text-wrapper-12">In-store QR</div>
															<p class="text-wrapper-15">
																Turn retail into an interactive playground. One scan → instant 3D try-on →
																made-to-order.
															</p>
														</div>
													</div>
													<div class="group-12">
														<div class="screenshot-wrapper">
															<img
																class="screenshot"
																src="https://c.animaapp.com/mejigj1rAIvhIh/img/screenshot-2025-08-05-at-18-41-55-1.png"
															/>
														</div>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
								<div class="frame-2">
									<custom-button variant="secondary" size="large">See it live</custom-button>
									<custom-button variant="primary" size="large">Book a demo</custom-button>
								</div>
							</div>
						</div>

						<!-- Pricing Section -->
						<div class="frame-29">
							<div class="frame-30">
								<div class="frame-31">
									<div class="frame-32">
										<div class="text-wrapper-27">Our pricing.</div>
										<div class="text-wrapper-28">Pricing without the bullsh*t.</div>
									</div>
									<div class="frame-33">
										<div class="button-primary-3"><div class="text-wrapper-3">Yearly</div></div>
										<div class="button-primary-4"><div class="text-wrapper-29">Monthly</div></div>
									</div>
								</div>
								<div class="frame-34">
									<div class="frame-35">
										<div class="frame-36">
											<div class="frame-37">
												<div class="text-wrapper-30">Studio</div>
												<p class="div-4">
													<span class="text-wrapper-6">€45</span> <span class="text-wrapper-31">/month/studio</span>
												</p>
											</div>
											<div class="flexcontainer">
												<p class="div-4">
													<span class="text-wrapper-31">3-month free trial <br /></span>
												</p>
												<p class="div-4">
													<span class="text-wrapper-31">1 space<br /></span>
												</p>
												<p class="div-4">
													<span class="text-wrapper-31">12 SKUs per space<br /></span>
												</p>
												<p class="div-4">
													<span class="text-wrapper-31">Digitize service </span>
													<span class="text-wrapper-32">not included</span>
												</p>
											</div>
										</div>
										<div class="button-primary-5"><div class="text-wrapper-3">Start free trial</div></div>
									</div>
									<div class="frame-38">
										<div class="frame-36">
											<div class="frame-39">
												<div class="frame-40">
													<div class="text-wrapper-33">Studio PRO</div>
													<div class="frame-41"><div class="text-wrapper-34">Best value</div></div>
												</div>
												<p class="div-5">
													<span class="text-wrapper-6">€70</span> <span class="text-wrapper-35">/month/studio</span>
												</p>
											</div>
											<div class="flexcontainer-2">
												<p class="div-5">
													<span class="text-wrapper-36">Everything in </span>
													<span class="text-wrapper-37">Studio</span>
													<span class="text-wrapper-36">, plus:<br /></span>
												</p>
												<p class="div-5">
													<span class="text-wrapper-36">Unlimited spaces &amp; SKUs<br /></span>
												</p>
												<p class="div-5">
													<span class="text-wrapper-36">Embed on website (custom URL)<br /></span>
												</p>
												<p class="div-5">
													<span class="text-wrapper-36">Analytics dashboard<br /></span>
												</p>
												<p class="div-5">
													<span class="text-wrapper-37">Add-on: <br /></span>
												</p>
												<p class="div-5">
													<span class="text-wrapper-36">Includes</span>
													<span class="text-wrapper-37"> 1 growth pack/year </span>
													<span class="text-wrapper-36"> (24 garments = €840 value).</span>
												</p>
											</div>
										</div>
										<button class="button"><div class="text-wrapper-38">Get started</div></button>
									</div>
									<div class="frame-42">
										<div class="frame-36">
											<div class="frame-37">
												<div class="text-wrapper-30">Digitize packs</div>
												<div class="div-4">One-time</div>
											</div>
											<div class="flexcontainer-3">
												<p class="div-4">
													<span class="text-wrapper-6">Kickoff: </span>
													<span class="text-wrapper-31">12 garments → </span>
													<span class="text-wrapper-6">€420/pack </span>
													<span class="text-wrapper-31">(€40/garment) <br /></span>
												</p>
												<p class="div-4">
													<span class="text-wrapper-6">Growth: </span>
													<span class="text-wrapper-31">24 garments → </span>
													<span class="text-wrapper-6">€840/pack</span>
													<span class="text-wrapper-31"> (€35/garment) <br /></span>
												</p>
												<p class="div-4">
													<span class="text-wrapper-6">Scale: </span>
													<span class="text-wrapper-31">36 garments → </span>
													<span class="text-wrapper-6">€1050/pack </span>
													<span class="text-wrapper-31">(€30/garment) </span>
												</p>
											</div>
										</div>
										<button class="button-primary-6"><div class="text-wrapper-3">Get started</div></button>
									</div>
								</div>
							</div>
						</div>

						<!-- CTA Section -->
						<div class="frame-43">
							<div class="frame-44">
								<div class="group-13">
									<div class="overlap-group-6">
										<img class="cone" src="https://c.animaapp.com/mejigj1rAIvhIh/img/cone-01-2-2.png" />
										<img class="group-14" src="https://c.animaapp.com/mejigj1rAIvhIh/img/group-11565.png" />
									</div>
								</div>
								<div class="frame-45">
									<div class="text-wrapper-39">Join the future.</div>
									<p class="turn-your">
										<span class="text-wrapper-40">Turn your collections into </span>
										<span class="text-wrapper-41">playable, immersive, made-to-order</span>
										<span class="text-wrapper-40"> experiences today. </span>
									</p>
									<div class="button-primary-7">
										<div class="text-wrapper-42">See Drippy in action</div>
										<img class="arrow" src="https://c.animaapp.com/mejigj1rAIvhIh/img/arrow-1.svg" />
									</div>
								</div>
							</div>
						</div>

						<!-- Footer -->
						<div class="frame-46">
							<img class="line" src="https://c.animaapp.com/mejigj1rAIvhIh/img/line-1.svg" />
							<div class="frame-47">
								<div class="frame-48">
									<div class="frame-49">
										<img
											class="element"
											src="https://c.animaapp.com/mejigj1rAIvhIh/img/7aeb67c6-4bc1-4b4c-bbe1-b946b6c2ed7a--1--1.png"
										/>
										<div class="text-wrapper-43">@2025 - Drippy, Inc.</div>
									</div>
									<div class="frame-50">
										<div class="text-wrapper-44">Terms &amp; Conditions</div>
										<div class="text-wrapper-44">Privacy Policy</div>
										<div class="text-wrapper-44">Contact Us</div>
									</div>
								</div>
								<img class="img" src="https://c.animaapp.com/mejigj1rAIvhIh/img/frame-12632.svg" />
							</div>
						</div>
					</div>

					<!-- Decorative Elements -->
					<div class="cone-wrapper">
						<img class="cone-2" src=${blingImage1} />
					</div>
					<img class="cone-3" src=${blingImage2} />
					<img class="cone-4" src=${blingImage3} />
				</div>
			</div>
		</div>
	` as Node,
)

// Hide the loading cover
const loadingCover = document.getElementById('loadingCover')
loadingCover?.classList.add('invisible')
loadingCover?.addEventListener('transitionend', () => loadingCover.remove())
