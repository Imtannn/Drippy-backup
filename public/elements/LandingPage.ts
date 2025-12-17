import {Element, element, html, css} from 'lume'
import type {ElementAttributes} from '@lume/element'
import './login-ui.js'
import './theme-switch.js'

const logoUrl = new URL('../images/logo.svg', import.meta.url)
const logoUrlDark = new URL('../images/logo-dark.svg', import.meta.url)

type LandingPageAttributes = keyof {} // no attributes yet

@element
export class LandingPage extends Element {
	static override readonly elementName = 'landing-page'
	override connectedCallback() {
		super.connectedCallback()

		// Add scroll event listener for navbar effect
		const handleScroll = () => {
			const navbar = this.querySelector('.navbar')
			if (navbar) {
				if (window.scrollY > 50) {
					navbar.classList.add('scrolled')
				} else {
					navbar.classList.remove('scrolled')
				}
			}
		}

		window.addEventListener('scroll', handleScroll)
		handleScroll() // Set initial state

		// Cleanup on disconnect
		this.addEventListener('disconnected', () => {
			window.removeEventListener('scroll', handleScroll)
		})
	}
	override template = () => html`
		<nav class="navbar">
			<div class="container">
				<div class="nav-container">
					<a href="/" class="logo">
						<img src="${logoUrl.href}" alt="Drippy logo" class="logo-light" />
						<img src="${logoUrlDark.href}" alt="Drippy logo" class="logo-dark" />
						<span>Drippy</span>
					</a>
					<div class="nav-links">
						<a href="#features">Features</a>
						<a href="#about">About</a>
						<a href="#contact">Contact</a>
						<a href="/" class="cta-button">Get Started</a>
					</div>
				</div>
			</div>
		</nav>

		<!-- Hero Section -->
		<section class="hero">
			<div class="container">
				<h1>Transform Your Fashion Business</h1>
				<p>Create immersive 3D shopping experiences that engage customers and drive sales.</p>
				<div class="hero-buttons">
					<a href="/" class="btn btn-primary">Try Demo</a>
					<a href="/contact" class="btn btn-secondary">Learn More</a>
				</div>
				<div class="hero-image">
					<div class="placeholder">3D Fashion Experience Preview</div>
				</div>
			</div>
		</section>

		<!-- Features Section -->
		<section id="features" class="features">
			<div class="container">
				<div class="section-header">
					<h2>Why Choose Drippy?</h2>
					<p>Powerful features to revolutionize your fashion business</p>
				</div>
				<div class="features-grid">
					<div class="feature-card">
						<div class="feature-icon">🚀</div>
						<h3>3D Visualization</h3>
						<p>Showcase products in stunning 3D detail</p>
					</div>
					<div class="feature-card">
						<div class="feature-icon">💎</div>
						<h3>Interactive Experience</h3>
						<p>Let customers explore products interactively</p>
					</div>
					<div class="feature-card">
						<div class="feature-icon">⚡</div>
						<h3>Fast Performance</h3>
						<p>Lightning-fast loading and smooth interactions</p>
					</div>
					<div class="feature-card">
						<div class="feature-icon">🎯</div>
						<h3>Increase Sales</h3>
						<p>Boost conversion rates with better engagement</p>
					</div>
				</div>
			</div>
		</section>

		<!-- CTA Section -->
		<section class="cta-section">
			<div class="container">
				<div class="cta-content">
					<h2>Ready to Get Started?</h2>
					<p>Join thousands of fashion businesses already using Drippy to transform their online presence.</p>
					<a href="/" class="btn btn-primary">Start Free Trial</a>
				</div>
			</div>
		</section>

		<!-- Footer -->
		<footer class="footer">
			<div class="container">
				<div class="footer-content">
					<div class="footer-logo">
						<img src="${logoUrl.href}" alt="Drippy logo" class="logo-light" />
						<img src="${logoUrlDark.href}" alt="Drippy logo" class="logo-dark" />
						<span>© 2025 Drippy. All rights reserved.</span>
					</div>
					<div class="footer-section">
						<a href="/privacy">Privacy</a>
						<a href="/terms">Terms</a>
						<a href="/support">Support</a>
					</div>
				</div>
			</div>
		</footer>
	`
	override css = css/*css*/ `
		:host {
			--font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			--color-primary: #121316;
			--color-secondary: #6b7280;
			--color-accent: #3b82f6;
			--color-background: #ffffff;
			--color-surface: #f9fafb;
			--spacing-xs: 8px;
			--spacing-sm: 16px;
			--spacing-md: 24px;
			--spacing-lg: 32px;
			--spacing-xl: 48px;
			--spacing-2xl: 64px;
			--radius: 8px;
			--shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		}

		[data-theme='dark'] {
			--color-primary: #ffffff;
			--color-secondary: #9ca3af;
			--color-accent: #60a5fa;
			--color-background: #111827;
			--color-surface: #1f2937;
		}

		* {
			box-sizing: border-box;
			margin: 0;
			padding: 0;
		}

		body {
			font-family: var(--font-family);
			line-height: 1.6;
			color: var(--color-primary);
			background: var(--color-background);
		}

		.container {
			max-width: 1200px;
			margin: 0 auto;
			padding: 0 var(--spacing-md);
		}

		/* Navigation */
		.navbar {
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			background: transparent;
			padding: var(--spacing-md) 0;
			z-index: 1000;
			transition: all 0.3s ease;
		}

		.navbar.scrolled {
			background: rgba(255, 255, 255, 0.9);
			backdrop-filter: blur(10px);
			box-shadow: var(--shadow);
		}

		[data-theme='dark'] .navbar.scrolled {
			background: rgba(17, 24, 39, 0.9);
		}

		.nav-container {
			display: flex;
			justify-content: space-between;
			align-items: center;
		}

		.logo {
			display: flex;
			align-items: center;
			gap: var(--spacing-sm);
			text-decoration: none;
			color: var(--color-primary);
			font-size: 20px;
			font-weight: 600;
		}

		.logo img {
			height: 32px;
			width: auto;
		}

		.logo .logo-dark {
			display: none;
		}

		[data-theme='dark'] .logo .logo-light {
			display: none;
		}

		[data-theme='dark'] .logo .logo-dark {
			display: block;
		}

		.nav-links {
			display: flex;
			gap: var(--spacing-lg);
			align-items: center;
		}

		.nav-links a {
			color: var(--color-secondary);
			text-decoration: none;
			font-size: 16px;
			font-weight: 500;
			transition: color 0.2s ease;
		}

		.nav-links a:hover {
			color: var(--color-primary);
		}

		.cta-button {
			background: var(--color-accent);
			color: white !important;
			padding: var(--spacing-sm) var(--spacing-md);
			border-radius: 100px;
			font-weight: 600;
			transition: all 0.2s ease;
		}

		.cta-button:hover {
			background: #2563eb;
			transform: translateY(-1px);
		}

		/* Hero Section */
		.hero {
			padding: var(--spacing-2xl) 0;
			padding-top: calc(var(--spacing-2xl) + 80px);
			text-align: center;
		}

		.hero h1 {
			font-size: 48px;
			font-weight: 700;
			margin-bottom: var(--spacing-md);
			line-height: 1.2;
		}

		.hero p {
			font-size: 20px;
			color: var(--color-secondary);
			margin-bottom: var(--spacing-xl);
			max-width: 600px;
			margin-left: auto;
			margin-right: auto;
		}

		.hero-buttons {
			display: flex;
			justify-content: center;
			gap: var(--spacing-md);
			margin-bottom: var(--spacing-xl);
		}

		.btn {
			display: inline-flex;
			align-items: center;
			gap: var(--spacing-sm);
			padding: var(--spacing-sm) var(--spacing-lg);
			border-radius: var(--radius);
			text-decoration: none;
			font-weight: 600;
			font-size: 16px;
			transition: all 0.2s ease;
			cursor: pointer;
			border: none;
		}

		.btn-primary {
			background: var(--color-accent);
			color: white;
		}

		.btn-primary:hover {
			background: #2563eb;
			transform: translateY(-1px);
		}

		.btn-secondary {
			background: var(--color-surface);
			color: var(--color-primary);
		}

		.btn-secondary:hover {
			background: #e5e7eb;
			transform: translateY(-1px);
		}

		[data-theme='dark'] .btn-secondary {
			background: var(--color-surface);
			color: var(--color-primary);
		}

		[data-theme='dark'] .btn-secondary:hover {
			background: #374151;
		}

		.hero-image {
			width: 100%;
			max-width: 800px;
			height: 400px;
			background: linear-gradient(135deg, var(--color-accent) 0%, #e5e7eb 100%);
			border-radius: var(--radius);
			display: flex;
			align-items: center;
			justify-content: center;
			margin: 0 auto;
			box-shadow: var(--shadow);
		}

		.hero-image .placeholder {
			color: white;
			font-size: 18px;
			font-weight: 600;
			text-align: center;
		}

		/* Features Section */
		.features {
			background: var(--color-surface);
			padding: var(--spacing-2xl) 0;
		}

		.section-header {
			text-align: center;
			margin-bottom: var(--spacing-xl);
		}

		.section-header h2 {
			font-size: 36px;
			font-weight: 700;
			margin-bottom: var(--spacing-sm);
		}

		.section-header p {
			font-size: 18px;
			color: var(--color-secondary);
		}

		.features-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
			gap: var(--spacing-lg);
		}

		.feature-card {
			background: var(--color-background);
			padding: var(--spacing-lg);
			border-radius: var(--radius);
			text-align: center;
			box-shadow: var(--shadow);
			transition: transform 0.2s ease;
		}

		.feature-card:hover {
			transform: translateY(-4px);
		}

		.feature-icon {
			font-size: 32px;
			margin-bottom: var(--spacing-md);
		}

		.feature-card h3 {
			font-size: 20px;
			font-weight: 600;
			margin-bottom: var(--spacing-sm);
		}

		.feature-card p {
			font-size: 16px;
			color: var(--color-secondary);
		}

		/* CTA Section */
		.cta-section {
			background: var(--color-surface);
			padding: var(--spacing-2xl) 0;
			text-align: center;
		}

		.cta-content h2 {
			font-size: 36px;
			font-weight: 700;
			margin-bottom: var(--spacing-md);
		}

		.cta-content p {
			font-size: 18px;
			color: var(--color-secondary);
			margin-bottom: var(--spacing-xl);
			max-width: 600px;
			margin-left: auto;
			margin-right: auto;
		}

		/* Footer */
		.footer {
			background: var(--color-primary);
			color: var(--color-background);
			padding: var(--spacing-xl) 0;
		}

		.footer-content {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding-bottom: var(--spacing-lg);
			border-bottom: 1px solid var(--color-secondary);
		}

		.footer-logo {
			display: flex;
			align-items: center;
			gap: var(--spacing-sm);
		}

		.footer-logo img {
			width: 24px;
			height: 24px;
		}

		.footer-logo span {
			font-size: 16px;
			font-weight: 600;
		}

		.footer-section {
			display: flex;
			gap: var(--spacing-lg);
		}

		.footer-section a {
			color: var(--color-secondary);
			text-decoration: none;
			transition: color 0.2s ease;
			font-size: 16px;
		}

		.footer-section a:hover {
			color: var(--color-background);
		}

		/* Responsive */
		@media (max-width: 768px) {
			.container {
				padding: 0 var(--spacing-sm);
			}

			.nav-links {
				gap: var(--spacing-md);
			}

			.hero h1 {
				font-size: 36px;
			}

			.hero p {
				font-size: 18px;
			}

			.hero-buttons {
				flex-direction: column;
				align-items: center;
			}

			.features-grid {
				grid-template-columns: 1fr;
				gap: var(--spacing-md);
			}

			.footer-content {
				flex-direction: column;
				gap: var(--spacing-lg);
				text-align: center;
			}

			.footer-section {
				flex-direction: column;
				gap: var(--spacing-sm);
			}
		}

		@media (max-width: 640px) {
			.nav-container {
				flex-direction: column;
				gap: var(--spacing-md);
			}

			.hero {
				padding-top: calc(var(--spacing-xl) + 60px);
			}

			.hero h1 {
				font-size: 28px;
			}

			.hero p {
				font-size: 16px;
			}

			.hero-image {
				height: 250px;
			}

			.section-header h2 {
				font-size: 28px;
			}

			.cta-content h2 {
				font-size: 28px;
			}
		}
	`
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			[LandingPage.elementName]: ElementAttributes<LandingPage, LandingPageAttributes>
		}
	}
}

declare global {
	interface HTMLElementTagNameMap {
		[LandingPage.elementName]: LandingPage
	}
}
