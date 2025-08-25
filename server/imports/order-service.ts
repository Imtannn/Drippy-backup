import {Meteor} from 'meteor/meteor'
import {EmailTemplates} from './email-service.js'

export interface OrderData {
	// Customer information
	customerEmail: string
	firstName: string
	lastName: string
	phone: string

	// Product information
	productName: string
	selectedSize: string
	isCustomSize: boolean
	customMeasurement?: {
		bust: number
		waist: number
		hips: number
		shoulder: number
		shoulderToKnee: number
	}
	quantity: number

	// Shipping information
	shippingAddress: {
		firstName: string
		lastName: string
		address: string
		apartment?: string
		city: string
		postalCode?: string
		phone: string
	}
}

// Helper function to generate order ID
function generateOrderId(): string {
	const timestamp = Date.now().toString(36)
	const random = Math.random().toString(36).substr(2, 5)
	return `ORD-${timestamp}-${random}`.toUpperCase()
}

// Helper function to calculate estimated delivery
function calculateEstimatedDelivery(): string {
	const deliveryDate = new Date()
	deliveryDate.setDate(deliveryDate.getDate() + 14) // 2 weeks from now
	const endDate = new Date(deliveryDate)
	endDate.setDate(endDate.getDate() + 7) // +1 week range

	return `${deliveryDate.toLocaleDateString('en-US', {month: 'long', day: 'numeric'})}-${endDate.toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric'})}`
}

// Helper function to calculate pricing
function calculateOrderTotal(orderData: OrderData): string {
	let basePrice = 29.99 // Base price per item

	// Add custom measurement surcharge
	if (orderData.isCustomSize) {
		basePrice += 15.0
	}

	const total = basePrice * orderData.quantity
	return total.toFixed(2)
}

// Process order data into email format
function processOrderForEmail(orderData: OrderData) {
	const orderId = generateOrderId()
	const orderDate = new Date().toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	})
	const estimatedDelivery = calculateEstimatedDelivery()
	const totalAmount = calculateOrderTotal(orderData)

	// Create items description
	const items = [
		{
			name: orderData.productName,
			description: `Size: ${orderData.selectedSize}${orderData.isCustomSize ? ' (Custom)' : ''}`,
			quantity: orderData.quantity,
			price: totalAmount,
		},
	]

	return {
		orderId,
		orderDate,
		estimatedDelivery,
		totalAmount,
		items,
	}
}

// Meteor Methods
Meteor.methods({
	async 'order.submit'(orderData: OrderData) {
		console.log('📦 Processing order submission:', orderData)

		// Validate required fields
		if (!orderData.customerEmail || !orderData.firstName || !orderData.lastName) {
			throw new Meteor.Error('validation-error', 'Customer information is required')
		}

		if (!orderData.shippingAddress.address || !orderData.shippingAddress.city) {
			throw new Meteor.Error('validation-error', 'Shipping address is required')
		}

		if (!orderData.productName) {
			throw new Meteor.Error('validation-error', 'Product name is required')
		}

		try {
			// Process the order
			const processedOrder = processOrderForEmail(orderData)
			console.log('📋 Processed order:', processedOrder)

			// Prepare email data
			const emailOrderDetails = {
				orderDate: processedOrder.orderDate,
				estimatedDelivery: processedOrder.estimatedDelivery,
				items: processedOrder.items,
				totalAmount: processedOrder.totalAmount,
				isCustomSize: orderData.isCustomSize,
				customMeasurement: orderData.customMeasurement,
				shippingAddress: {
					name: `${orderData.shippingAddress.firstName} ${orderData.shippingAddress.lastName}`,
					street:
						orderData.shippingAddress.address +
						(orderData.shippingAddress.apartment ? `, ${orderData.shippingAddress.apartment}` : ''),
					city: orderData.shippingAddress.city,
					state: '',
					zipCode: orderData.shippingAddress.postalCode || '',
					country: 'USA',
				},
			}

			// Send order confirmation email
			console.log('📤 Attempting to send email...')
			await EmailTemplates.sendOrderConfirmation(
				orderData.customerEmail,
				orderData.firstName,
				processedOrder.orderId,
				emailOrderDetails,
			)
			console.log('📧 Email sent successfully!')

			console.log('✅ Order processed successfully:', processedOrder.orderId)

			// Return order confirmation
			return {
				success: true,
				orderId: processedOrder.orderId,
				message: 'Order submitted successfully!',
			}
		} catch (error) {
			console.error('❌ Error processing order:', error)
			console.error('❌ Error type:', typeof error)
			console.error('❌ Error message:', error instanceof Error ? error.message : 'No message')
			console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack')

			// Return error without sensitive details
			return {
				success: false,
				error: 'Failed to process order. Please try again.',
				details:
					error instanceof Meteor.Error ? error.reason : error instanceof Error ? error.message : 'Unknown error',
			}
		}
	},
})
