// Import necessary modules and models
const express = require('express');
const router = express.Router();
const Order = require('../models/orderModel');
const User = require('../models/userModel');
const { auth } = require('../middleware/authMiddleware');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create a new order
router.post('/create', auth, async (req, res) => {
    try {
        let user = await User.findById(req.user.id);
        const { carId, carName, price, quantity, totalPrice, orderDate } = req.body;

        // Check if an order with the same parameters already exists
        const existingOrder = await Order.findOne({
            carId: carId,
            quantity: quantity,
            price: price,
            orderDate: orderDate
        });

        if (existingOrder) {
            return res.status(400).json({
                success: false,
                message: 'Order already exists for this car, quantity, price, and order date combination'
            });
        }

        // Create a new order instance
        const order = new Order({
            carId: carId,
            carName: carName,
            customerName: user.name,
            email: user.email,
            quantity: quantity,
            price: price,
            totalPrice: totalPrice,
            orderDate: orderDate
        });

        // Save the order to the database
        await order.save();

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            order
        });
    } catch (error) {
        console.error('Error creating order:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to create order'
        });
    }
});

// Route for listing orders
router.get('/list', async (req, res) => {
    try {
        // Fetch all orders from the database
        const orders = await Order.find();

        // Return the list of orders as a JSON response
        res.status(200).json({
            success: true,
            orders: orders,
        });
    } catch (error) {
        // If an error occurs, return an error response
        console.error('Error fetching orders:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders',
        });
    }
});

module.exports = router;
