const mongoose = require('mongoose');

const verificationTokenSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    tokenHash: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 } // TTL index for 24h expiration
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('VerificationToken', verificationTokenSchema);
