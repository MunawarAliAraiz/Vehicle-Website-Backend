// Import necessary modules and models
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { hashPassword } = require('../Utils/bcryptUtils');
const bcrypt = require('bcrypt');
const { auth, adminAuth } = require('../middleware/authMiddleware');
const dotenv = require('dotenv');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Load environment variables
dotenv.config();

// Endpoint to for admin verification
router.get('/isadmin', adminAuth, async (req, res) => {
    let user = await User.findOne({ _id: req.user.id })
    if (user.email !== 'admin@gmail.com') {
        return res.status(400).json({
            success: false,
            message: "Not authorized as an admin"
        })
    }
    res.json({
        success: true,
        message: "Admin verified successfully"
    })
})

// End point for Admin Panel Login
router.post('/adminpanellogin', async (req, res) => {
    try {
        let user = await User.findOne({ email: 'admin@gmail.com' });

        if (!user) {
            // Admin user does not exist, create it
            const adminPassword = 'admin123';
            const hashedPassword = await hashPassword(adminPassword);
            const newUser = new User({
                name: 'admin',
                email: 'admin@gmail.com',
                profile_image: 'https://www.gravatar.com/avatar/',
                password: hashedPassword,
            });

            user = await newUser.save();

            if (!user) {
                return res.status(500).json({
                    success: false,
                    message: 'Error creating admin user',
                });
            }
        }

        const emailMatch = req.body.email === user.email;

        if (!emailMatch) {
            console.log('email does not match');
            return res.status(400).json({
                success: false,
                message: 'Incorrect email',
            });
        }

        const passwordMatch = await bcrypt.compare(req.body.password, user.password);

        if (!passwordMatch) {
            console.log('password does not match');
            return res.status(400).json({
                success: false,
                message: 'Incorrect password',
            });
        }

        const data = {
            user: {
                id: user.id,
            },
        };
        const token = jwt.sign(data, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({
            success: true,
            token,
            message: 'Admin logged in successfully',
        });
    } catch (error) {
        console.error('Error during admin panel login:', error.message);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

// Route for changing the admin password
router.put('/adminchangepassword', adminAuth, async (req, res) => {
    try {
        // Find the admin user by email
        let adminUser = await User.findOne({ email: 'admin@gmail.com' });

        // If admin user not found, return an error
        if (!adminUser) {
            return res.status(404).json({
                success: false,
                message: 'Admin user not found',
            });
        }

        // Compare the provided current password with the stored hashed password
        const passwordMatch = await bcrypt.compare(req.body.currentPassword, adminUser.password);

        // If passwords don't match, return an error
        if (!passwordMatch) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect',
            });
        }

        // Hash the new password
        const hashedNewPassword = await hashPassword(req.body.newPassword);

        // Update the admin user's password with the new hashed password
        adminUser.password = hashedNewPassword;
        await adminUser.save();

        res.status(200).json({
            success: true,
            message: 'Admin password changed successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});


// Registration route
router.post('/register', async (req, res) => {
    console.log(req.body);
    try {
        let check = await User.findOne({ email: req.body.email });

        if (check) {
            return res.status(400).json({
                success: false,
                message: "User already exists",
            });
        }

        const hashedPassword = await hashPassword(req.body.password);

        const user = new User({
            name: req.body.name,
            email: req.body.email,
            profile_image: req.body.profile_image ? req.body.profile_image : 'https://www.pngitem.com/pimgs/m/146-1468479_my-profile-icon-blank-profile-picture-circle-hd.png',
            password: hashedPassword,
        });

        await user.save();

        const data = {
            user: {
                id: user.id,
            },
        };

        const token = jwt.sign(data, process.env.JWT_SECRET);

        res.status(201).json({
            success: true,
            token,
            message: "User registered successfully",
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

// Login route
router.post('/login', async (req, res) => {
    console.log(req.body);
    try {
      // Extract email and password from request body
      const { email, password } = req.body;
  
      // Check if the user exists
      const user = await User.findOne({ email });
  
      if (!user) {
        return res.status(400).json({ success: false, message: 'Invalid credentials' });
      }
  
      // Compare the provided password with the hashed password in the database
      const passwordMatch = await bcrypt.compare(password, user.password);
  
      if (!passwordMatch) {
        return res.status(400).json({ success: false, message: 'Invalid credentials' });
      }

      // Generate JWT token
      const payload = { user: { id: user.id } };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
  
      // Send token as response
      res.status(200).json({ success: true, token, message: 'User logged in successfully'});
    } catch (error) {
      console.error('Error during login:', error.message);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  });

// List users route
router.get('/list', async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json({
            success: true,
            users,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

// Update user route
router.put('/update/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const updatedUser = await User.findByIdAndUpdate(userId, req.body, { new: true });

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        res.status(200).json({
            success: true,
            user: updatedUser,
            message: "User updated successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

// Delete user route
router.delete('/delete/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const deletedUser = await User.findByIdAndDelete(userId);

        if (!deletedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "User deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

// Endpoint for checkout using Stripe
router.post('/checkout-session', auth, async (req, res) => {
    const {products} = req.body;

    const lineItems = products.map(product => {
        return {
            price_data: {
                currency: 'usd',
                product_data: {
                    name: product.name,
                    images: [product.image],
                },
                unit_amount: Math.round(product.price*100),
            },
            quantity: product.quantity,
        }
    });

    const car = products[0]

    const success_url = `${process.env.USERPANEL_URL}/success/${car.id}/${encodeURIComponent(car.name)}/${car.quantity}/${car.price}`;

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: success_url,
            cancel_url: `${process.env.USERPANEL_URL}/cancel`,
        });

        res.json({ id: session.id });
    } catch (error) {
        console.error('Error creating checkout session:', error.message);
        res.status(500).json({ error: 'Failed to create checkout session' });
    }
})

module.exports = router;
