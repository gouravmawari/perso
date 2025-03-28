const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Photo = require('./schema');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

// Define BestPhoto schema
const bestPhotoSchema = new mongoose.Schema({
    photoPath: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const BestPhoto = mongoose.model('BestPhoto', bestPhotoSchema);

// Define Job schema for the queue
const jobSchema = new mongoose.Schema({
    email: { type: String, required: true },
    photoPath: { type: String, required: true },
    priority: { type: Number, required: true },
    status: { type: String, default: 'pending', enum: ['pending', 'completed', 'failed'] },
    createdAt: { type: Date, default: Date.now },
});
const Job = mongoose.model('Job', jobSchema);



const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'gauravmawari40@gamil.com', // Replace with your Gmail address
        pass: 'cyeu xzkj yfiw flbj',    // Replace with your Gmail App Password (not regular password)
    },
});

async function sendPhotoEmail(email, photoPath) {
    try {
        const mailOptions = {
            from: 'your-email@gmail.com', // Sender address
            to: email,                    // Recipient (from the job)
            subject: 'Your Photo',
            text: 'Here is your photo!',
            html: '<p>Here is your photo!</p>',
            attachments: [
                {
                    filename: path.basename(photoPath),
                    path: photoPath, // Attach the photo from the file system
                },
            ],
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.response);
    } catch (error) {
        console.error('Error sending email:', error.message);
        throw error; // Re-throw to handle in the API
    }
}


// Configure Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'PHOTOS/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
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
    limits: { fileSize: 5 * 1024 * 1024 },
});

// Configure Multer for best photos
const bestPhotoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'best_photos/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `best-${uniqueSuffix}${path.extname(file.originalname)}`);
    },
});

const bestPhotoUpload = multer({
    storage: bestPhotoStorage,
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
    limits: { fileSize: 5 * 1024 * 1024 },
});

// Process a single job
async function processJob(job) {
    try {
        console.log("Processing job:", { email: job.email, photoPath: job.photoPath });

        const existingPhoto = await Photo.findOne({ email: job.email });
        if (existingPhoto) {
            throw new Error('Email already associated with a photo');
        }

        const photo = new Photo({ email: job.email, photoPath: job.photoPath });
        await photo.save();
        console.log("Photo saved to DB:", photo);

        job.status = 'completed';
        await job.save();
    } catch (error) {
        console.error("Error processing job:", error.message);
        job.status = 'failed';
        await job.save();
    }
}

// Upload API
router.post('/upload', upload.single('photo'), async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ message: 'Invalid email address' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No photo uploaded' });
        }

        console.log("req.file:", req.file);
        const photoPath = req.file.path;
        const priority = Date.now();

        const job = new Job({ email, photoPath, priority });
        await job.save();
        console.log("Job added to queue:", { jobId: job._id, email, photoPath, priority });

        res.status(202).json({ message: 'Photo upload queued successfully', email, priority, jobId: job._id });
    } catch (error) {
        console.error("Error queuing photo upload:", error.message);
        res.status(500).json({ message: 'Error queuing photo upload', error: error.message });
    }
});

// Updated API to get and download the top prioritized job's photo
router.get('/top-job-download', async (req, res) => {
    try {
        const topJob = await Job.findOne({ status: 'pending' }).sort({ priority: 1 });
        if (!topJob) {
            return res.status(404).json({ message: 'No pending jobs in the queue' });
        }

        const { email, photoPath } = topJob;
        console.log("Top job for download:", { email, photoPath });

        // Download the photo directly from the file system
        res.download(photoPath, path.basename(photoPath));
    } catch (error) {
        console.error("Error retrieving top job:", error.message);
        res.status(500).json({ message: 'Error retrieving top job', error: error.message });
    }
});

// API to pop the top job if the provided email matches
router.post('/pop-top-job', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ message: 'Invalid email address' });
        }

        const topJob = await Job.findOne({ status: 'pending' }).sort({ priority: 1 });
        if (!topJob) {
            return res.status(404).json({ message: 'No pending jobs in the queue' });
        }

        const topEmail = topJob.email;
        console.log("Top job for pop:", { email: topEmail, photoPath: topJob.photoPath });

        if (topEmail !== email) {
            return res.status(403).json({ message: 'Provided email does not match the top job email' });
        }

        // Send email with the photo attachment
        await sendPhotoEmail(topEmail, topJob.photoPath);

        // Remove the top job from the queue
        await Job.deleteOne({ _id: topJob._id });
        console.log("Top job popped:", { email });

        const nextJob = await Job.findOne({ status: 'pending' }).sort({ priority: 1 });
        if (nextJob) {
            console.log("Next job scheduled:", { email: nextJob.email, photoPath: nextJob.photoPath });
        } else {
            console.log("No more pending jobs in queue");
        }

        res.status(200).json({ message: 'Top job removed successfully and email sent', email });
    } catch (error) {
        console.error("Error popping top job or sending email:", error.message);
        res.status(500).json({ message: 'Error popping top job or sending email', error: error.message });
    }
});
// API to manually process the top job
router.post('/process-top-job', async (req, res) => {
    try {
        const topJob = await Job.findOne({ status: 'pending' }).sort({ priority: 1 });
        if (!topJob) {
            return res.status(404).json({ message: 'No pending jobs to process' });
        }

        await processJob(topJob);

        res.status(200).json({ message: 'Top job processed', email: topJob.email, status: topJob.status });
    } catch (error) {
        res.status(500).json({ message: 'Error processing top job', error: error.message });
    }
});

// Add best photo endpoint
router.post('/addbestphoto', bestPhotoUpload.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No photo uploaded' });
        }

        const photoPath = req.file.path;
        const bestPhoto = new BestPhoto({ photoPath });
        await bestPhoto.save();

        res.status(201).json({ 
            message: 'Best photo added successfully',
            photoPath: photoPath
        });
    } catch (error) {
        console.error("Error adding best photo:", error.message);
        res.status(500).json({ message: 'Error adding best photo', error: error.message });
    }
});

// Get all best photos endpoint
router.get('/getbestphotos', async (req, res) => {
    try {
        const bestPhotos = await BestPhoto.find().sort({ createdAt: -1 });
        const photoUrls = bestPhotos.map(photo => ({
            url: `/best_photos/${path.basename(photo.photoPath)}`,
            createdAt: photo.createdAt
        }));
        
        res.status(200).json(photoUrls);
    } catch (error) {
        console.error("Error retrieving best photos:", error.message);
        res.status(500).json({ message: 'Error retrieving best photos', error: error.message });
    }
});

module.exports = router;






