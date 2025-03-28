const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Photo = require('./schema');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

// Define Job schema for the queue
const jobSchema = new mongoose.Schema({
    email: { type: String, required: true },
    photoPath: { type: String, required: true },
    priority: { type: Number, required: true },
    status: { type: String, default: 'pending', enum: ['pending', 'completed', 'failed'] },
    createdAt: { type: Date, default: Date.now },
    paid: { type: Boolean, default: false }
});
const Job = mongoose.model('Job', jobSchema);

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'gauravmawari40@gmail.com',
        pass: 'ubcr bftv luny gnfv',
    },
});

async function sendPhotoEmail(email, photoPath) {
    try {
        const mailOptions = {
            from: 'your-email@gmail.com',
            to: email,
            subject: 'Your Photo',
            text: 'Here is your photo!',
            html: '<p>Here is your photo!</p>',
            attachments: [
                {
                    filename: path.basename(photoPath),
                    path: photoPath,
                },
            ],
        };
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.response);
    } catch (error) {
        console.error('Error sending email:', error.message);
        throw error;
    }
}

// New function to send payment request email
async function sendPaymentRequestEmail(email) {
    try {
        const upiId = 'rishitgoklani@oksbi'; // Replace with your actual UPI ID
        const mailOptions = {
            from: 'your-email@gmail.com',
            to: email,
            subject: 'Payment Required for Priority Photo Processing',
            text: `Please make a payment to the following UPI ID to get priority processing for your photo: ${upiId}`,
            html: `
                <h3>Payment Required</h3>
                <p>To skip the queue and receive a Ghibli-style image within 30 minutes, please make a payment of $1
                 (if outside India) or ₹20 (if in India). After making the payment, reply with your banking name.</p>
                <p><strong>UPI ID:</strong> ${upiId}</p>
                <p><strong>PayPal ID:</strong> @RishitGoklani</p>
            `,
        };
        const info = await transporter.sendMail(mailOptions);
        console.log('Payment request email sent:', info.response);
    } catch (error) {
        console.error('Error sending payment request email:', error.message);
        throw error;
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

// Process a single job (unchanged)
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

// Update paid status API (unchanged)
router.post('/update-paid-status', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ message: 'Invalid email address' });
        }
        const updatedJob = await Job.findOneAndUpdate(
            { email, status: 'pending' },
            { paid: true },
            { new: true }
        );
        if (!updatedJob) {
            return res.status(404).json({ message: 'No pending job found with this email' });
        }
        res.status(200).json({ 
            message: 'Paid status updated successfully', 
            email: updatedJob.email,
            paid: updatedJob.paid 
        });
    } catch (error) {
        console.error("Error updating paid status:", error.message);
        res.status(500).json({ message: 'Error updating paid status', error: error.message });
    }
});

// Modified Upload API with payment request email
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
        console.log("upload api called and its working fine");
        console.log("Job added to queue:", { jobId: job._id, email, photoPath, priority });

        // Send payment request email
        await sendPaymentRequestEmail(email);

        res.status(202).json({ 
            message: 'Photo upload queued successfully. Please check your email for payment instructions.',
            email, 
            priority, 
            jobId: job._id 
        });
    } catch (error) {
        console.error("Error queuing photo upload:", error.message);
        res.status(500).json({ message: 'Error queuing photo upload', error: error.message });
    }
});

// Top job download API (unchanged)
// router.get('/top-job-download', async (req, res) => {
//     try {
//         let topJob = await Job.findOne({ 
//             status: 'pending',
//             paid: true 
//         }).sort({ priority: 1 });

//         if (!topJob) {
//             topJob = await Job.findOne({ 
//                 status: 'pending',
//                 paid: false 
//             }).sort({ priority: 1 });
//         }

//         if (!topJob) {
//             return res.status(404).json({ message: 'No pending jobs in the queue' });
//         }

//         const { email, photoPath } = topJob;
//         console.log("Top job for download:", { email, photoPath, paid: topJob.paid });
//         res.download(photoPath, path.basename(photoPath));
//     } catch (error) {
//         console.error("Error retrieving top job:", error.message);
//         res.status(500).json({ message: 'Error retrieving top job', error: error.message });
//     }
// });

router.get('/top-job-download', async (req, res) => {
    try {
        // Log all pending paid jobs
        const paidJobs = await Job.find({ 
            status: 'pending',
            paid: true 
        }).sort({ priority: 1 });
        // console.log("Paid pending jobs found:", paidJobs.length, paidJobs);

        let topJob = paidJobs[0]; // Take the first paid job if it exists

        if (!topJob) {
            // Log all pending unpaid jobs
            const unpaidJobs = await Job.find({ 
                status: 'pending',
            }).sort({ priority: 1 });
            // console.log("Unpaid pending jobs found:", unpaidJobs.length, unpaidJobs);

            topJob = unpaidJobs[0]; // Take the first unpaid job if it exists
        }

        if (!topJob) {
            console.log("No pending jobs found in either category");
            return res.status(404).json({ message: 'No pending jobs in the queue' });
        }

        const { email, photoPath } = topJob;
        console.log("Top job for download:", { email, photoPath, paid: topJob.paid });
        res.download(photoPath, path.basename(photoPath));
    } catch (error) {
        console.error("Error retrieving top job:", error.message);
        res.status(500).json({ message: 'Error retrieving top job', error: error.message });
    }
});




// Pop top job API (unchanged)
router.post('/pop-top-job', upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No photo uploaded' });
        }

        // Use same priority logic as top-job-download
        let topJob = await Job.findOne({ 
            status: 'pending',
            paid: true 
        }).sort({ priority: 1 });

        if (!topJob) {
            topJob = await Job.findOne({ 
                status: 'pending',
            }).sort({ priority: 1 });
        }
        // console.log("topjob"topJob);
        if (!topJob) {
            return res.status(404).json({ message: 'No pending jobs in the queue' });
        }

        const topEmail = topJob.email;
        const photoPath = req.file.path;
        
        // Send the uploaded photo to the same user's email
        await sendPhotoEmail(topEmail, photoPath);
        
        // Remove the job from the queue
        await Job.deleteOne({ _id: topJob._id });
        console.log("Top job popped:", { email: topEmail });

        // Check for next job
        const nextJob = await Job.findOne({ status: 'pending' }).sort({ priority: 1 });
        if (nextJob) {
            console.log("Next job scheduled:", {
                email: nextJob.email,
                photoPath: nextJob.photoPath
            });
        } else {
            console.log("No more pending jobs in queue");
        }

        res.status(200).json({
            message: 'Photo sent to top priority email and job removed successfully',
            email: topEmail
        });
    } catch (error) {
        console.error("Error popping top job or sending email:", error.message);
        res.status(500).json({
            message: 'Error popping top job or sending email',
            error: error.message
        });
    }
});

// Process top job API (unchanged)
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

module.exports = router;