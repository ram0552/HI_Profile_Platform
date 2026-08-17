const mongoose = require('mongoose');

const PLATFORMS = ['instagram', 'github', 'youtube', 'twitter', 'linkedin', 'dribbble'];

const recentContentSchema = new mongoose.Schema({
    id: { type: String, default: '' },
    title: { type: String, default: '', trim: true },
    text: { type: String, default: '', trim: true },
    caption: { type: String, default: '', trim: true },
    description: { type: String, default: '', trim: true },
    imageUrl: { type: String, default: '', trim: true },
    thumbnailUrl: { type: String, default: '', trim: true },
    contentUrl: { type: String, default: '', trim: true },
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    sharesCount: { type: Number, default: 0 },
    repliesCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },
    stars: { type: Number, default: 0 },
    forks: { type: Number, default: 0 },
    language: { type: String, default: '', trim: true },
    publishedAt: { type: String, default: '', trim: true },
    // Instagram-specific
    shortCode: { type: String, default: '', trim: true },
    mediaType: { type: String, default: '', trim: true },
    // LinkedIn-specific
    postType: { type: String, default: '', trim: true },
    articleTitle: { type: String, default: '', trim: true },
    articleUrl: { type: String, default: '', trim: true },
    // YouTube-specific
    duration: { type: String, default: '', trim: true }
}, { _id: false });

const socialProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    profileBlockId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProfileBlock',
        required: true,
        unique: true,
        index: true
    },
    platform: {
        type: String,
        required: true,
        enum: PLATFORMS,
        index: true
    },
    username: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true
    },
    displayName: {
        type: String,
        default: '',
        trim: true
    },
    profileImage: {
        type: String,
        default: '',
        trim: true
    },
    headline: {
        type: String,
        default: '',
        trim: true
    },
    location: {
        type: String,
        default: '',
        trim: true
    },
    verified: {
        type: Boolean,
        default: false
    },
    followers: {
        type: Number,
        default: 0
    },
    following: {
        type: Number,
        default: 0
    },
    posts: {
        type: Number,
        default: 0
    },
    description: {
        type: String,
        default: '',
        trim: true
    },
    profileUrl: {
        type: String,
        default: '',
        trim: true
    },
    // LinkedIn enrichment
    currentTitle: { type: String, default: '', trim: true },
    currentCompany: { type: String, default: '', trim: true },
    bio: { type: String, default: '', trim: true },
    connectionsCount: { type: Number, default: 0 },
    // YouTube enrichment
    subscribersCount: { type: Number, default: 0 },
    videoCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    // GitHub enrichment
    reposCount: { type: Number, default: 0 },
    recentContent: [recentContentSchema],
    rawData: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    lastFetched: {
        type: Date,
        default: Date.now,
        index: true
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

socialProfileSchema.index({ userId: 1, platform: 1, username: 1 });
socialProfileSchema.index({ platform: 1, username: 1 });

module.exports = mongoose.model('SocialProfile', socialProfileSchema);
module.exports.PLATFORMS = PLATFORMS;
