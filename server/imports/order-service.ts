import {Meteor} from 'meteor/meteor'
import type {OrderData} from '../../public/types/types.js'
import {EmailTemplates} from './email-service.js'

// Helper function to generate order ID
function generateOrderId(): string {
	const timestamp = Date.now().toString(36)
	const random = Math.random().toString(36).substr(2, 5)
	return `ORD-${timestamp}-${random}`.toUpperCase()
}

// Helper function to calculate pricing
function calculateOrderTotal(orderData: OrderData): string {
	let total = 0

	if (orderData.orderType === 'wholesale') {
		total = orderData.orderItems.reduce((sum, item) => sum + item.totalPrice, 0)
	} else if (orderData.orderType === 'retail' && orderData.retailOrderItems) {
		total = orderData.retailOrderItems.reduce((sum, item) => sum + item.totalPrice, 0)
	}

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

	// Create items description from order items
	const items: Array<{
		name: string
		description: string
		quantity: number
		price: string
		sizes?: Array<{size: string; quantity: number; price: number}>
		selectedSize?: string
		orderType: 'wholesale' | 'retail'
		customMeasurement?: {
			bust: number
			waist: number
			hips: number
			shoulder: number
			shoulderToKnee: number
		}
	}> = []

	if (orderData.orderType === 'wholesale') {
		for (const item of orderData.orderItems) {
			items.push({
				name: item.templateName,
				description: `Category: ${item.templateCategory}`,
				quantity: item.totalQuantity,
				price: item.totalPrice.toFixed(2),
				sizes: item.sizes,
				orderType: 'wholesale',
			})
		}
	} else if (orderData.orderType === 'retail' && orderData.retailOrderItems) {
		for (const item of orderData.retailOrderItems) {
			items.push({
				name: item.templateName,
				description: `Category: ${item.templateCategory}`,
				quantity: item.quantity,
				price: item.totalPrice.toFixed(2),
				selectedSize: item.selectedSize,
				orderType: 'retail',
				customMeasurement: item.customMeasurement, // Include custom measurements
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

		// Validate order items based on order type
		if (orderData.orderType === 'wholesale') {
			if (!orderData.orderItems || orderData.orderItems.length === 0) {
				throw new Meteor.Error('validation-error', 'At least one order item is required')
			}

			// Validate wholesale order items have quantities
			for (const item of orderData.orderItems) {
				if (item.totalQuantity <= 0) {
					throw new Meteor.Error('validation-error', `Item "${item.templateName}" must have at least 1 quantity`)
				}
			}
		} else if (orderData.orderType === 'retail') {
			if (!orderData.retailOrderItems || orderData.retailOrderItems.length === 0) {
				throw new Meteor.Error('validation-error', 'At least one retail order item is required')
			}

			// Validate retail order items have quantities and sizes
			for (const item of orderData.retailOrderItems) {
				if (item.quantity <= 0) {
					throw new Meteor.Error('validation-error', `Item "${item.templateName}" must have at least 1 quantity`)
				}
				if (!item.selectedSize) {
					throw new Meteor.Error('validation-error', `Item "${item.templateName}" must have a selected size`)
				}
			}
		} else {
			throw new Meteor.Error('validation-error', 'Order type must be either wholesale or retail')
		}

		try {
			// Process the order
			const processedOrder = processOrderForEmail(orderData)

			// Prepare email data
			const emailOrderDetails = {
				orderDate: processedOrder.orderDate,
				items: processedOrder.items,
				totalAmount: processedOrder.totalAmount,
				designUrl: orderData.designUrl,
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

			// Send customer confirmation email
			await EmailTemplates.sendOrderConfirmation(
				orderData.email, // Use email from form instead of customerEmail
				orderData.firstName,
				processedOrder.orderId,
				emailOrderDetails,
				orderData.orderType,
				orderData.spaceDescription,
			)

			// Send admin notification email
			await EmailTemplates.sendAdminOrderNotification(
				orderData.email,
				orderData.firstName,
				processedOrder.orderId,
				emailOrderDetails,
				orderData.orderType,
				orderData.spaceDescription,
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
