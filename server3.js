const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const photoRoutes = require('./API');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();

// Middleware to parse JSON
app.use(express.json());

// Serve static files from best_photos directory
app.use('/best_photos', express.static(path.join(__dirname, 'best_photos')));

// Use the photo routes
app.use('/api/photos', photoRoutes);

// Connect to MongoDB
mongoose.connect("mongodb+srv://guddu:guddu@cluster1.ved7bni.mongodb.net/yes?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});