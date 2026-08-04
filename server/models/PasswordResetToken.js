const mongoose = require('mongoose');

const passwordResetTokenSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true
    },
    otpHash: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 } // TTL index for 10m expiration
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('PasswordResetToken', passwordResetTokenSchema);
