const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    tokenHash: {
        type: String,
        required: true,
        unique: true
    },
    sessionId: {
        type: String,
        required: true
    },
    device: {
        type: String,
        default: 'Unknown'
    },
    browser: {
        type: String,
        default: 'Unknown'
    },
    ip: {
        type: String,
        default: ''
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 } // TTL index for 30d expiration
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
