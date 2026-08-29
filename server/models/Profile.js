const mongoose = require('mongoose');

const avatarSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['file', 'emoji', null],
        default: null
    },
    data: {
        type: String,
        default: ''
    },
    transform: {
        type: String,
        default: ''
    },
    bg: {
        type: String,
        default: ''
    }
}, { _id: false });

const socialLinksSchema = new mongoose.Schema({
    github: { type: String, default: '', trim: true },
    linkedin: { type: String, default: '', trim: true },
    website: { type: String, default: '', trim: true },
    twitter: { type: String, default: '', trim: true },
    instagram: { type: String, default: '', trim: true },
    facebook: { type: String, default: '', trim: true },
    youtube: { type: String, default: '', trim: true },
    discord: { type: String, default: '', trim: true },
    telegram: { type: String, default: '', trim: true },
    dribbble: { type: String, default: '', trim: true },
    location: { type: String, default: '', trim: true },
    customLinks: [{
        label: { type: String, trim: true },
        url: { type: String, trim: true }
    }]
}, { _id: false });

const workHistorySchema = new mongoose.Schema({
    company: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    period: { type: String, default: '', trim: true },
    desc: { type: String, default: '', trim: true }
}, { _id: true });

const projectSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    desc: { type: String, default: '', trim: true },
    tags: [{ type: String, trim: true }],
    type: { type: String, default: 'work', trim: true },
    image: { type: String, default: '', trim: true },
    url: { type: String, default: '', trim: true }
}, { _id: true });

const customizationSchema = new mongoose.Schema({
    designStyle: {
        type: String,
        enum: ['classic', 'glass', 'brutalist', 'elevated', 'minimal', 'outline', 'softUI', 'retroTerminal', 'gradientMesh', 'editorial', 'duotone', 'frostedDark'],
        default: 'classic'
    },
    colorTheme: {
        type: String,
        enum: ['default', 'sunset', 'rose', 'skyBreeze', 'sandNeutral', 'mintFresh', 'lavenderMist', 'peachCream', 'midnight', 'cyberpunk', 'emerald', 'royalPurple', 'obsidian', 'crimsonEmber', 'oceanDepth', 'graphiteSteel'],
        default: 'default'
    },
    typography: {
        type: String,
        enum: ['inter', 'outfit', 'jakarta', 'manrope', 'spaceGrotesk', 'playfair', 'lora', 'cormorant', 'robotoMono', 'jetbrainsMono', 'spaceMono', 'poppins', 'bricolage'],
        default: 'inter'
    },
    borderRadius: {
        type: String,
        enum: ['sharp', 'subtle', 'small', 'medium', 'large', 'extraLarge', 'rounded', 'pill'],
        default: 'medium'
    },
    shadow: {
        type: String,
        enum: ['none', 'whisper', 'soft', 'elevated', 'strong', 'neo3d', 'glow', 'offsetBrutalist'],
        default: 'soft'
    },
    spacing: {
        type: String,
        enum: ['tight', 'compact', 'comfortable', 'relaxed', 'spacious', 'airy'],
        default: 'comfortable'
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    version: {
        type: Number,
        default: 1
    }
}, { _id: false });

const profileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    profileImage: {
        type: String,
        default: '',
        trim: true
    },
    avatar: {
        type: avatarSchema,
        default: () => ({ type: null, data: '', transform: '', bg: '' })
    },
    bio: {
        type: String,
        default: '',
        trim: true,
        maxlength: 500
    },
    bioEnhancementCount: {
        type: Number,
        default: 0,
        min: 0
    },
    location: {
        type: String,
        default: '',
        trim: true
    },
    socialLinks: {
        type: socialLinksSchema,
        default: () => ({})
    },
    selectedTemplate: {
        type: String,
        enum: ['bento', 'timeline', 'classic', 'modern', 'developer'],
        default: 'bento'
    },
    customization: {
        type: customizationSchema,
        default: () => ({
            designStyle: 'classic',
            colorTheme: 'default',
            typography: 'inter',
            borderRadius: 'medium',
            shadow: 'soft',
            spacing: 'comfortable',
            updatedAt: new Date(),
            version: 1
        })
    },
    theme: {
        type: String,
        default: 'light'
    },
    accentColor: {
        type: String,
        default: '#4F46E5'
    },
    fontSize: {
        type: String,
        default: 'medium'
    },
    profileCardFont: {
        type: String,
        default: 'Inter'
    },
    skills: [{
        type: String,
        trim: true
    }],
    education: [{
        institution: { type: String, trim: true },
        degree: { type: String, trim: true },
        fieldOfStudy: { type: String, trim: true },
        startYear: { type: String, trim: true },
        endYear: { type: String, trim: true },
        desc: { type: String, trim: true }
    }],
    workHistory: [workHistorySchema],
    projects: [projectSchema],
    certifications: [{
        title: { type: String, trim: true },
        issuer: { type: String, trim: true },
        date: { type: String, trim: true },
        url: { type: String, trim: true }
    }],
    achievements: [{
        title: { type: String, trim: true },
        desc: { type: String, trim: true },
        date: { type: String, trim: true }
    }],
    galleries: [{
        title: { type: String, trim: true },
        imageUrl: { type: String, trim: true }
    }],
    resumes: [{
        title: { type: String, trim: true },
        fileUrl: { type: String, trim: true },
        updatedAt: { type: Date, default: Date.now }
    }],
    syncMetadata: {
        lastSyncedAt: { type: Date, default: null },
        syncStatus: { type: String, enum: ['idle', 'in_progress', 'success', 'failed'], default: 'idle' },
        syncSource: { type: String, enum: ['cron', 'manual', 'setup', 'system'], default: 'system' },
        syncError: { type: String, default: '' }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Profile', profileSchema);
