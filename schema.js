const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true, // Ensure each email is associated with only one photo
    },
    photoPath: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Photo', photoSchema);