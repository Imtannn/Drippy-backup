import * as sgMail from '@sendgrid/mail'
import * as Handlebars from 'handlebars'
import {Email} from 'meteor/email'
import {Meteor} from 'meteor/meteor'

// Access Assets from Meteor global
declare const Assets: {
	getTextAsync(path: string): Promise<string>
}

// Configure SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@drippy3d.com'

// Admin email for order notifications
const ADMIN_EMAIL = 'thidieuanhle@gmail.com'

if (SENDGRID_API_KEY) {
	sgMail.setApiKey(SENDGRID_API_KEY)
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
		return `${templateName}.hbs`
	}

	/**
	 * Load and compile Handlebars template with caching
	 */
	private static async loadTemplate(templateName: string): Promise<HandlebarsTemplateDelegate<any>> {
		// Check cache first
		if (this.templateCache.has(templateName)) {
			return this.templateCache.get(templateName)!
		}

		try {
			const templatePath = this.getTemplatePath(templateName)
			const templateSource = await Assets.getTextAsync(`email-templates/${templatePath}`)
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
	private static async renderTemplate(templateName: string, data: Record<string, any> = {}): Promise<string> {
		const template = await this.loadTemplate(templateName)

		// Add common template data
		const templateData = {
			...data,
			currentYear: new Date().getFullYear(),
			appUrl: process.env.APP_URL || 'https://drippy3d.com/app',
		}

		return template(templateData)
	}

	/**
	 * Send email using Handlebars template
	 */
	static async sendWithHandlebarsTemplate(options: HandlebarsTemplateOptions): Promise<void> {
		try {
			const htmlContent = await this.renderTemplate(options.templateName, options.templateData)

			const emailOptions = {
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
	 * Send email using SendGrid API with fallback to Meteor Email
	 */
	static async send(options: any): Promise<void> {
		if (SENDGRID_API_KEY) {
			try {
				const msg: any = {
					to: options.to,
					from: options.from || SENDGRID_FROM_EMAIL,
					subject: options.subject,
					html: options.html,
				}

				await sgMail.send(msg)
				return
			} catch (error) {
				console.warn('SendGrid failed, falling back to Meteor Email:', error)
				// Continue to fallback
			}
		}

		// Fallback to Meteor's built-in Email package
		try {
			Email.send({
				to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
				from: options.from || SENDGRID_FROM_EMAIL || 'noreply@drippy3d.com',
				subject: options.subject,
				html: options.html,
			})
		} catch (error) {
			console.error('Meteor Email fallback also failed:', error)
			throw new Meteor.Error('email-send-failed', 'Failed to send email via all methods')
		}
	}

	/**
	 * Clear template cache (useful for development)
	 */
	clearTemplateCache(): void {
		EmailService['templateCache'].clear()
	}
}

// Email templates for common use cases
export const EmailTemplates = {
	/**
	 * Send order confirmation email using Handlebars template
	 */
	async sendOrderConfirmation(
		userEmail: string,
		userName: string,
		orderId: string,
		orderDetails: {
			orderDate: string
			items: Array<{
				name: string
				description: string
				quantity: number
				price: string
			}>
			totalAmount: string
			isCustomSize?: boolean
			customMeasurement?: {
				bust: number
				waist: number
				hips: number
				shoulder: number
				shoulderToKnee: number
			}
			shippingAddress: {
				name: string
				street: string
				city: string
				state: string
				zipCode: string
				country: string
			}
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
			},
		}

		await EmailService.sendWithHandlebarsTemplate(options)
	},

	/**
	 * Send admin notification email for new orders
	 */
	async sendAdminOrderNotification(
		userEmail: string,
		userName: string,
		orderId: string,
		orderDetails: {
			orderDate: string
			items: Array<{
				name: string
				description: string
				quantity: number
				price: string
			}>
			totalAmount: string
			isCustomSize?: boolean
			customMeasurement?: {
				bust: number
				waist: number
				hips: number
				shoulder: number
				shoulderToKnee: number
			}
			shippingAddress: {
				name: string
				street: string
				city: string
				state: string
				zipCode: string
				country: string
			}
		},
	): Promise<void> {
		const options: HandlebarsTemplateOptions = {
			to: ADMIN_EMAIL,
			subject: `New Order Received - ${orderId} 📦`,
			templateName: 'admin-order-notification',
			templateData: {
				userName,
				userEmail,
				orderId,
				...orderDetails,
			},
		}

		await EmailService.sendWithHandlebarsTemplate(options)
	},
}
