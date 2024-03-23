// authMiddleware.js
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Middleware for authentication

const auth = (req, res, next) => {
    const token = req.header('auth-token')
    if (!token) {
        res.status(401).json({
            success: false,
            message: "No token, authorization denied"
        })
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = decoded.user
        next()
    } catch (error) {
        console.error('Token verification failed:', error.message)
        res.status(401).json({
            success: false,
            message: "Token is not valid"
        })
    }
}

// Admin middleware
const adminAuth = (req, res, next) => {
    const token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "No token, authorization denied"
        });
    }

    try {
        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET); 
        req.user = decoded.user; 
        next();
    } catch (error) {
        console.error('Token verification failed:', error.message);
        res.status(401).json({
            success: false,
            message: "Invalid token"
        });
    }
};

module.exports = { auth, adminAuth };
