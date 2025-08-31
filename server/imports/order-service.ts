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

	// Garments selected in the current model
	garments?: Array<{
		_id: string
		blockName: string
	}>

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

// Helper function to calculate pricing
function calculateOrderTotal(orderData: OrderData): string {
	const garmentsCount = orderData.garments ? orderData.garments.length : 0
	const qty = orderData.quantity || 1
	const total = 125.0 * garmentsCount * qty
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
	const totalAmount = calculateOrderTotal(orderData)

	// Create items description
	const items: Array<{name: string; description: string; quantity: number; price: string}> = []

	// Append garments as separate line items ($125.00 each) for now
	if (orderData.garments && orderData.garments.length > 0) {
		for (const g of orderData.garments) {
			items.push({
				name: g.blockName || `Garment ${g._id}`,
				description: `Garment ID: ${g._id}`,
				quantity: 1,
				price: '125.00',
			})
		}
	}

	return {
		orderId,
		orderDate,
		totalAmount,
		items,
	}
}

// Meteor Methods
Meteor.methods({
	async 'order.submit'(orderData: OrderData) {
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

			// Prepare email data
			const emailOrderDetails = {
				orderDate: processedOrder.orderDate,
				items: processedOrder.items,
				totalAmount: processedOrder.totalAmount,
				selectedSize: orderData.selectedSize,
				isCustomSize: orderData.isCustomSize,
				customMeasurement: orderData.customMeasurement,
				garmentsNumbered:
					orderData.garments?.map(g => ({
						_id: g._id,
						blockName: g.blockName || `Garment ${g._id}`,
					})) || [],
				quantity: orderData.quantity || 1,
				shippingAddress: {
					name: `${orderData.shippingAddress.firstName} ${orderData.shippingAddress.lastName}`,
					street:
						orderData.shippingAddress.address +
						(orderData.shippingAddress.apartment ? `, ${orderData.shippingAddress.apartment}` : ''),
					city: orderData.shippingAddress.city,
					state: '',
					zipCode: orderData.shippingAddress.postalCode || '',
					country: 'France',
				},
			}

			// Send order confirmation email

			await EmailTemplates.sendOrderConfirmation(
				orderData.customerEmail,
				orderData.firstName,
				processedOrder.orderId,
				emailOrderDetails,
			)

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
