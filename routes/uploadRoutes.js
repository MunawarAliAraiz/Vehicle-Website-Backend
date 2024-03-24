const express = require('express');
const path = require('path');
const {profile_upload, blog_upload, car_upload} = require('../multerConfig/multerConfig');
const router = express.Router();
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const serverUrl = process.env.SERVER_URL || 'http://localhost:4000/';

// Define routes for handling uploads
router.use('/profile_images', express.static(path.join(__dirname, '../upload/profile_images')));
router.use('/blogs_images', express.static(path.join(__dirname, '../upload/blogs_images')));
router.use('/cars_images', express.static(path.join(__dirname, '../upload/cars_images')));

router.post('/image', profile_upload.single('profile_image'), (req, res) => {
    res.json({
        success: 1,
        image: {
            url: `${serverUrl}api/upload/profile_images/${req.file.filename}`,
        },
    });
});

router.post('/blog', blog_upload.single('blog_image'), (req, res) => {
    res.json({
        success: 1,
        blog: {
            url: `${serverUrl}api/upload/blogs_images/${req.file.filename}`,
        },
    });
});

router.post('/car', car_upload.single('car_image'), (req, res) => {
    res.json({
        success: 1,
        car: {
            url: `${serverUrl}api/upload/cars_images/${req.file.filename}`,
        },
    });
});

module.exports = router;
