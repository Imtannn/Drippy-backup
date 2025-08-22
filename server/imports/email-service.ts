import {Meteor} from 'meteor/meteor'
import {Email} from 'meteor/email'
import * as sgMail from '@sendgrid/mail'
import * as Handlebars from 'handlebars'
import * as fs from 'fs'
import * as path from 'path'

// Configure SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@drippy3d.com'

if (SENDGRID_API_KEY) {
	sgMail.setApiKey(SENDGRID_API_KEY)
}

// MAIL_URL is now set via private/env.json or environment variables
// No need to construct it manually here

export interface EmailOptions {
	to: string | string[]
	subject: string
	text?: string
	html?: string
	from?: string
}

export interface SendGridTemplateOptions {
	to: string | string[]
	templateId: string
	dynamicTemplateData?: Record<string, any>
	from?: string
}

export interface HandlebarsTemplateOptions {
	to: string | string[]
	templateName: string
	templateData?: Record<string, any>
	subject: string
	from?: string
}

export class EmailService {
	private static templateCache = new Map<string, HandlebarsTemplateDelegate<any>>()

	/**
	 * Get template path for a given template name
	 */
	private static getTemplatePath(templateName: string): string {
		return path.join(process.cwd(), 'private', 'email-templates', `${templateName}.hbs`)
	}

	/**
	 * Load and compile Handlebars template with caching
	 */
	private static loadTemplate(templateName: string): HandlebarsTemplateDelegate<any> {
		// Check cache first
		if (this.templateCache.has(templateName)) {
			return this.templateCache.get(templateName)!
		}

		try {
			const templatePath = this.getTemplatePath(templateName)
			const templateSource = fs.readFileSync(templatePath, 'utf8')
			const compiledTemplate = Handlebars.compile(templateSource)

			// Cache the compiled template
			this.templateCache.set(templateName, compiledTemplate)

			return compiledTemplate
		} catch (error) {
			console.error(`Failed to load template ${templateName}:`, error)
			throw new Meteor.Error('template-load-failed', `Failed to load email template: ${templateName}`)
		}
	}

	/**
	 * Render Handlebars template with data
	 */
	private static renderTemplate(templateName: string, data: Record<string, any> = {}): string {
		const template = this.loadTemplate(templateName)

		// Add common template data
		const templateData = {
			...data,
			currentYear: new Date().getFullYear(),
			appUrl: process.env.APP_URL || 'https://drippy3d.com/app',
			communityUrl: process.env.COMMUNITY_URL || 'https://drippy3d.com/community',
			preferencesUrl: process.env.PREFERENCES_URL || 'https://drippy3d.com/preferences',
			supportEmail: 'support@drippy3d.com',
			supportPhone: '1-800-DRIPPY',
			unsubscribeUrl: `${process.env.APP_URL || 'https://drippy3d.com'}/unsubscribe?email=${encodeURIComponent(data.userEmail || '')}`,
		}

		return template(templateData)
	}

	/**
	 * Send email using Handlebars template
	 */
	static async sendWithHandlebarsTemplate(options: HandlebarsTemplateOptions): Promise<void> {
		try {
			const htmlContent = this.renderTemplate(options.templateName, options.templateData)

			const emailOptions: EmailOptions = {
				to: options.to,
				subject: options.subject,
				html: htmlContent,
				from: options.from,
			}

			await this.send(emailOptions)
		} catch (error) {
			console.error('Handlebars template email error:', error)
			throw new Meteor.Error('handlebars-template-failed', 'Failed to send Handlebars template email')
		}
	}
	/**
	 * Send email using SendGrid API (preferred method)
	 */
	static async sendWithSendGrid(options: EmailOptions): Promise<void> {
		if (!SENDGRID_API_KEY) {
			throw new Meteor.Error('sendgrid-not-configured', 'SendGrid API key not configured')
		}

		const msg: any = {
			to: options.to,
			from: options.from || SENDGRID_FROM_EMAIL,
			subject: options.subject,
		}

		// Add content based on what's provided
		if (options.html && options.text) {
			msg.html = options.html
			msg.text = options.text
		} else if (options.html) {
			msg.html = options.html
		} else if (options.text) {
			msg.text = options.text
		} else {
			throw new Meteor.Error('email-content-required', 'Either text or html content is required')
		}

		try {
			await sgMail.send(msg)
			console.log('Email sent successfully via SendGrid API')
		} catch (error) {
			console.error('SendGrid API error:', error)
			throw new Meteor.Error('sendgrid-send-failed', 'Failed to send email via SendGrid API')
		}
	}

	/**
	 * Send email using SendGrid dynamic template
	 */
	static async sendWithTemplate(options: SendGridTemplateOptions): Promise<void> {
		if (!SENDGRID_API_KEY) {
			throw new Meteor.Error('sendgrid-not-configured', 'SendGrid API key not configured')
		}

		const msg: any = {
			to: options.to,
			from: options.from || SENDGRID_FROM_EMAIL,
			templateId: options.templateId,
			dynamicTemplateData: options.dynamicTemplateData || {},
		}

		try {
			await sgMail.send(msg)
			console.log('Template email sent successfully via SendGrid API')
		} catch (error) {
			console.error('SendGrid template error:', error)
			throw new Meteor.Error('sendgrid-template-failed', 'Failed to send template email via SendGrid API')
		}
	}

	/**
	 * Send email using Meteor's built-in Email package (SMTP fallback)
	 */
	static sendWithMeteorEmail(options: EmailOptions): void {
		if (!process.env.MAIL_URL) {
			throw new Meteor.Error('mail-url-not-configured', 'MAIL_URL not configured')
		}

		try {
			Email.send({
				to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
				from: options.from || SENDGRID_FROM_EMAIL,
				subject: options.subject,
				text: options.text,
				html: options.html,
			})
			console.log('Email sent successfully via Meteor Email (SMTP)')
		} catch (error) {
			console.error('Meteor Email error:', error)
			throw new Meteor.Error('meteor-email-failed', 'Failed to send email via Meteor Email')
		}
	}

	/**
	 * Smart send: Try SendGrid API first, fallback to SMTP
	 */
	static async send(options: EmailOptions): Promise<void> {
		try {
			// Try SendGrid API first
			await this.sendWithSendGrid(options)
		} catch (error) {
			console.warn('SendGrid API failed, falling back to SMTP:', error)
			try {
				// Fallback to Meteor Email (SMTP)
				this.sendWithMeteorEmail(options)
			} catch (smtpError) {
				console.error('Both SendGrid API and SMTP failed:', smtpError)
				throw new Meteor.Error('email-send-failed', 'Failed to send email via all methods')
			}
		}
	}
}

// Meteor Methods for client-side email sending
Meteor.methods({
	'email.send'(options: EmailOptions) {
		// Add validation here
		if (!this.userId) {
			throw new Meteor.Error('not-authorized', 'Must be logged in to send emails')
		}

		// Add admin check or other authorization logic if needed
		const user = Meteor.users.findOne(this.userId)
		if (!user?.profile?.isAdmin) {
			throw new Meteor.Error('not-authorized', 'Must be admin to send emails')
		}

		return EmailService.send(options)
	},

	'email.sendTemplate'(options: SendGridTemplateOptions) {
		if (!this.userId) {
			throw new Meteor.Error('not-authorized', 'Must be logged in to send template emails')
		}

		const user = Meteor.users.findOne(this.userId)
		if (!user?.profile?.isAdmin) {
			throw new Meteor.Error('not-authorized', 'Must be admin to send template emails')
		}

		return EmailService.sendWithTemplate(options)
	},

	'email.sendHandlebarsTemplate'(options: HandlebarsTemplateOptions) {
		if (!this.userId) {
			throw new Meteor.Error('not-authorized', 'Must be logged in to send Handlebars template emails')
		}

		const user = Meteor.users.findOne(this.userId)
		if (!user?.profile?.isAdmin) {
			throw new Meteor.Error('not-authorized', 'Must be admin to send Handlebars template emails')
		}

		return EmailService.sendWithHandlebarsTemplate(options)
	},
})

// Example usage functions for common email types using Handlebars templates
export const EmailTemplates = {
	/**
	 * Send welcome email to new user using Handlebars template
	 */
	async sendWelcomeEmail(userEmail: string, userName: string): Promise<void> {
		const options: HandlebarsTemplateOptions = {
			to: userEmail,
			subject: 'Welcome to Drippy! 🎨',
			templateName: 'welcome',
			templateData: {
				userName,
				userEmail,
			},
		}

		await EmailService.sendWithHandlebarsTemplate(options)
	},

	/**
	 * Send password reset email using Handlebars template
	 */
	async sendPasswordResetEmail(
		userEmail: string,
		userName: string,
		resetUrl: string,
		expirationHours: number = 24,
	): Promise<void> {
		const options: HandlebarsTemplateOptions = {
			to: userEmail,
			subject: 'Reset your Drippy password 🔒',
			templateName: 'password-reset',
			templateData: {
				userName,
				userEmail,
				resetUrl,
				expirationHours,
			},
		}

		await EmailService.sendWithHandlebarsTemplate(options)
	},

	/**
	 * Send order confirmation email using Handlebars template
	 */
	async sendOrderConfirmation(
		userEmail: string,
		userName: string,
		orderId: string,
		orderDetails: {
			orderDate: string
			estimatedDelivery: string
			items: Array<{
				name: string
				description: string
				quantity: number
				price: string
			}>
			totalAmount: string
			shippingAddress: {
				name: string
				street: string
				city: string
				state: string
				zipCode: string
				country: string
			}
			trackingUrl?: string
		},
	): Promise<void> {
		const options: HandlebarsTemplateOptions = {
			to: userEmail,
			subject: `Order Confirmation - ${orderId} ✅`,
			templateName: 'order-confirmation',
			templateData: {
				userName,
				userEmail,
				orderId,
				...orderDetails,
				trackingUrl: orderDetails.trackingUrl || `https://drippy3d.com/track/${orderId}`,
			},
		}

		await EmailService.sendWithHandlebarsTemplate(options)
	},

	/**
	 * Clear template cache (useful for development)
	 */
	clearTemplateCache(): void {
		EmailService['templateCache'].clear()
		console.log('Handlebars template cache cleared')
	},
}
