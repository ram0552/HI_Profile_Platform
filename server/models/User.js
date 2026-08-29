const mongoose = require('mongoose');

const loginHistorySchema = new mongoose.Schema({
    provider: {
        type: String,
        enum: ['local', 'google', 'github'],
        required: true
    },
    loginTime: {
        type: Date,
        default: Date.now
    },
    ip: {
        type: String,
        default: ''
    },
    device: {
        type: String,
        default: 'Unknown'
    },
    browser: {
        type: String,
        default: 'Unknown'
    },
    operatingSystem: {
        type: String,
        default: 'Unknown'
    },
    location: {
        type: String,
        default: ''
    },
    sessionId: {
        type: String,
        default: ''
    }
}, { _id: true });

const authProviderSchema = new mongoose.Schema({
    provider: {
        type: String,
        enum: ['local', 'google', 'github'],
        required: true
    },
    providerId: {
        type: String,
        required: true
    },
    linkedAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    password: {
        type: String,
        required: function () {
            // Password required if local auth provider exists or googleId/githubId are not set
            return !this.googleId && !this.githubId;
        }
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    accountStatus: {
        type: String,
        enum: ['pending', 'active', 'suspended', 'locked'],
        default: 'pending'
    },
    authenticationProviders: [authProviderSchema],
    googleId: {
        type: String,
        sparse: true
    },
    githubId: {
        type: String,
        sparse: true
    },
    failedLoginAttempts: {
        type: Number,
        default: 0
    },
    lockoutUntil: {
        type: Date,
        default: null
    },
    lastLogin: {
        type: Date,
        default: null
    },
    loginHistory: [loginHistorySchema],
    onboarding: {
        type: new mongoose.Schema({
            currentStep: {
                type: String,
                enum: ['/upload', '/profile', '/setup', '/select', 'completed'],
                default: '/upload'
            },
            completionPercentage: {
                type: Number,
                default: 0
            },
            isCompleted: {
                type: Boolean,
                default: false
            },
            completedAt: {
                type: Date,
                default: null
            },
            stepTracking: {
                type: new mongoose.Schema({
                    upload: { type: Boolean, default: false },
                    profile: { type: Boolean, default: false },
                    setup: { type: Boolean, default: false },
                    select: { type: Boolean, default: false }
                }, { _id: false }),
                default: () => ({ upload: false, profile: false, setup: false, select: false })
            }
        }, { _id: false }),
        default: () => ({
            currentStep: '/upload',
            completionPercentage: 0,
            isCompleted: false,
            completedAt: null,
            stepTracking: { upload: false, profile: false, setup: false, select: false }
        })
    },
    preferences: {
        type: Object,
        default: {}
    },
    instantRefresh: {
        count: {
            type: Number,
            default: 0,
            min: 0
        },
        lastResetDate: {
            type: String,
            default: ''
        }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);
