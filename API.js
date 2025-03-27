const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Photo = require('./schema');

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'PHOTOS/'); // Save files in the PHOTOS folder
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`); // Unique filename
    },
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only .jpg, .jpeg, and .png files are allowed!'));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
});

// API to upload a photo
router.post('/upload', upload.single('photo'), async (req, res) => {
    try {
        const { email } = req.body;

        // Validate email
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ message: 'Invalid email address' });
        }

        // Check if a photo was uploaded
        if (!req.file) {
            return res.status(400).json({ message: 'No photo uploaded' });
        }

        // Check if email already exists
        const existingPhoto = await Photo.findOne({ email });
        if (existingPhoto) {
            return res.status(400).json({ message: 'Email already associated with a photo. Use a different email.' });
        }

        // Save the photo path and email to the database
        const photo = new Photo({
            email,
            photoPath: req.file.path,
        });
        await photo.save();

        res.status(201).json({ message: 'Photo uploaded successfully', photo });
    } catch (error) {
        res.status(500).json({ message: 'Error uploading photo', error: error.message });
    }
});

// API to download a photo by email
router.get('/download', async (req, res) => {
    try {
        const { email } = req.body;

        // Validate email
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ message: 'Invalid email address' });
        }

        // Find the photo by email
        const photo = await Photo.findOne({ email });
        if (!photo) {
            return res.status(404).json({ message: 'No photo found for this email' });
        }

        // Send the file for download
        res.download(photo.photoPath, path.basename(photo.photoPath), (err) => {
            if (err) {
                res.status(500).json({ message: 'Error downloading photo', error: err.message });
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error downloading photo', error: error.message });
    }
});

module.exports = router;