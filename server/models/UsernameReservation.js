const mongoose = require('mongoose');

const usernameReservationSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    reservationId: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        enum: ['reserved', 'claimed'],
        default: 'reserved'
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 } // TTL index: MongoDB will automatically remove when expiresAt reached
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('UsernameReservation', usernameReservationSchema);
