const mongoose = require('mongoose');

const BLOCK_TYPES = [
    'emoji',
    'link',
    'text',
    'checklist',
    'image',
    'instagram',
    'github',
    'youtube',
    'twitter',
    'linkedin',
    'dribbble'
];

const profileBlockSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    blockType: {
        type: String,
        required: true,
        index: true,
        enum: BLOCK_TYPES
    },
    configuration: {
        type: mongoose.Schema.Types.Mixed,
        default: () => ({})
    },
    layout: {
        x: { type: Number, default: 0 },
        y: { type: Number, default: 0 },
        w: { type: Number, default: 2 },
        h: { type: Number, default: 1 }
    },
    order: {
        type: Number,
        default: 0,
        index: true
    },
    visibility: {
        type: Boolean,
        default: true,
        index: true
    },
    locked: {
        type: Boolean,
        default: false,
        index: true
    }
}, {
    timestamps: true
});

profileBlockSchema.index({ userId: 1, order: 1 });
profileBlockSchema.index({ userId: 1, visibility: 1 });
profileBlockSchema.index({ userId: 1, blockType: 1 });

module.exports = mongoose.model('ProfileBlock', profileBlockSchema);
module.exports.BLOCK_TYPES = BLOCK_TYPES;
