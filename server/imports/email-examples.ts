import {EmailService, EmailTemplates} from './email-service.js'

/**
 * Example usage of the email service with Handlebars templates
 * These functions demonstrate how to use the email service in your application
 */

// Example 1: Send a simple email (traditional way)
export async function sendSimpleEmail() {
	await EmailService.send({
		to: 'user@example.com',
		subject: 'Test Email',
		html: '<h1>Hello from Drippy!</h1><p>This is a test email.</p>',
		text: 'Hello from Drippy! This is a test email.',
	})
}

// Example 2: Send email using Handlebars template (NEW!)
export async function sendHandlebarsTemplateEmail() {
	await EmailService.sendWithHandlebarsTemplate({
		to: 'user@example.com',
		subject: 'Welcome to Our Service!',
		templateName: 'welcome',
		templateData: {
			userName: 'John Doe',
			userEmail: 'user@example.com',
		},
	})
}

// Example 3: Send order confirmation with detailed data
export async function sendOrderConfirmationEmail() {
	await EmailTemplates.sendOrderConfirmation('user@example.com', 'John Doe', 'ORD-2024-001', {
		orderDate: 'January 15, 2024',
		items: [
			{
				name: 'Custom 3D Printed T-Shirt',
				description: 'Size: L, Color: Blue with custom design',
				quantity: 2,
				price: '29.99',
			},
			{
				name: 'Designer Hoodie',
				description: 'Size: M, Color: Black with logo',
				quantity: 1,
				price: '49.99',
			},
		],
		totalAmount: '109.97',
		shippingAddress: {
			name: 'John Doe',
			street: '123 Main Street',
			city: 'San Francisco',
			state: 'CA',
			zipCode: '94105',
			country: 'USA',
		},
	})
}

// Example 4: Send multiple emails using Handlebars templates
export async function sendBulkHandlebarsEmails() {
	const users = [
		{email: 'user1@example.com', name: 'Alice Johnson'},
		{email: 'user2@example.com', name: 'Bob Smith'},
	]

	for (const user of users) {
		await EmailService.sendWithHandlebarsTemplate({
			to: user.email,
			subject: 'Newsletter Update 📧',
			templateName: 'welcome', // You can create a newsletter.hbs template
			templateData: {
				userName: user.name,
				userEmail: user.email,
			},
		})
	}
}

// Example 5: Send email with attachments using SendGrid API
export async function sendEmailWithAttachment() {
	// Note: For attachments, you'll need to use SendGrid API directly
	// This example shows how to extend the service for attachments
	const sgMail = require('@sendgrid/mail')

	const msg = {
		to: 'user@example.com',
		from: process.env.SENDGRID_FROM_EMAIL || 'noreply@drippy3d.com',
		subject: 'Your Order Details',
		html: '<p>Please find your order details attached.</p>',
		attachments: [
			{
				content: 'base64-encoded-file-content',
				filename: 'order-details.pdf',
				type: 'application/pdf',
				disposition: 'attachment',
			},
		],
	}

	await sgMail.send(msg)
}

// Example 6: Send newsletter email
export async function sendNewsletterEmail() {
	await EmailService.sendWithHandlebarsTemplate({
		to: 'user@example.com',
		subject: 'Drippy Newsletter - January 2024 📬',
		templateName: 'newsletter',
		templateData: {
			userName: 'John Doe',
			userEmail: 'user@example.com',
			newsletterDate: 'January 2024',
			featuredArticle: {
				title: 'New 3D Printing Materials Available',
				excerpt: 'Discover our latest selection of premium materials for your custom designs.',
				url: 'https://drippy3d.com/blog/new-materials',
			},
			updates: [
				{
					title: 'Mobile App Update 2.1',
					description: 'Enhanced design tools and better performance on all devices.',
					url: 'https://drippy3d.com/app-update',
				},
				{
					title: 'Community Design Contest',
					description: 'Submit your best designs for a chance to win amazing prizes!',
					url: 'https://drippy3d.com/contest',
				},
			],
			communitySpotlight: {
				title: 'Amazing Dragon Figurine',
				description: 'This incredible design showcases the power of our advanced modeling tools.',
				creator: 'ArtisticDragon99',
				url: 'https://drippy3d.com/gallery/dragon-figurine',
			},
			userStats: {
				designsCreated: 12,
				likesReceived: 45,
				interactions: 23,
			},
			upcomingEvents: [
				{
					date: 'Feb 15, 2024',
					title: 'Virtual Design Workshop',
					description: 'Learn advanced 3D modeling techniques from our experts.',
				},
				{
					date: 'Feb 28, 2024',
					title: 'Community Showcase Live Stream',
					description: 'See the best community designs featured live.',
				},
			],
		},
	})
}
