const ProfileBlock = require('../models/ProfileBlock');
const Profile = require('../models/Profile');
const User = require('../models/User');
const SocialProfile = require('../models/SocialProfile');
const { getOrFetchSocialProfile, deleteSocialProfileByBlockId } = require('../services/socialProfileService');

const MAX_BLOCKS_PER_PROFILE = 20;
const VALID_BLOCK_TYPES = [
    'emoji',
    'link',
    'text',
    'checklist',
    'image',
    'instagram',
    'github',
    'youtube',
    'twitter',
    'linkedin'
];

const SOCIAL_PLATFORMS = ['instagram', 'github', 'youtube', 'twitter', 'linkedin'];

/**
 * Validate Image URLs (Reject Base64 dataURIs)
 */
const validateImageUrl = (url) => {
    if (!url || typeof url !== 'string') return true;
    const trimmed = url.trim();
    if (trimmed.startsWith('data:image/')) {
        return false; // Reject Base64
    }
    if (trimmed.length > 2000) {
        return false; // Reject oversized strings
    }
    return true;
};

/**
 * Validate block configuration according to blockType requirements
 */
const validateBlockConfig = (blockType, configuration = {}) => {
    switch (blockType) {
        case 'emoji':
            if (!configuration.emoji || typeof configuration.emoji !== 'string') {
                return 'Emoji is required for emoji block';
            }
            break;
        case 'link':
            if (!configuration.url || typeof configuration.url !== 'string' || !configuration.url.trim()) {
                return 'URL is required for link block';
            }
            break;
        case 'checklist':
            const items = configuration.items || configuration.checklist;
            if (!Array.isArray(items) || items.length === 0) {
                return 'Checklist items are required for checklist block';
            }
            break;
        case 'image': {
            const imgUrl = configuration.imageUrl || configuration.image;
            if (!imgUrl || typeof imgUrl !== 'string' || !imgUrl.trim()) {
                return 'Image URL is required for image block';
            }
            if (!validateImageUrl(imgUrl)) {
                return 'Base64 image encoding is not supported. Please provide a valid Cloudinary/S3 or HTTPS image URL.';
            }
            break;
        }
        case 'github':
        case 'instagram':
        case 'youtube':
        case 'twitter':
        case 'linkedin':
            if (!configuration.handle && !configuration.username && !configuration.title) {
                return `Username or handle is required for ${blockType} block`;
            }
            break;
    }
    return null;
};

/**
 * POST /api/profile-blocks
 * Create a new bento profile block & trigger SocialProfile sync if social block
 */
const createBlock = async (req, res) => {
    try {
        const {
            blockType,
            configuration = {},
            layout = {},
            visibility = true
        } = req.body;

        if (!blockType) {
            return res.status(400).json({
                success: false,
                message: 'blockType is required'
            });
        }

        if (!VALID_BLOCK_TYPES.includes(blockType)) {
            return res.status(400).json({
                success: false,
                message: `Invalid blockType. Must be one of: ${VALID_BLOCK_TYPES.join(', ')}`
            });
        }

        // Validate configuration independently
        const validationError = validateBlockConfig(blockType, configuration);
        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError
            });
        }

        // Check Maximum Block Limit
        const currentCount = await ProfileBlock.countDocuments({ userId: req.user._id });
        if (currentCount >= MAX_BLOCKS_PER_PROFILE) {
            return res.status(422).json({
                success: false,
                message: `Maximum profile block limit of ${MAX_BLOCKS_PER_PROFILE} blocks reached.`
            });
        }

        // Default Block Size: Width 2 Columns, Height 2 Rows
        let w = Number(layout.w || layout.width) || 2;
        let h = Number(layout.h || layout.height) || 2;

        // Compute max order
        const highestOrderBlock = await ProfileBlock.findOne({ userId: req.user._id })
            .sort({ order: -1 })
            .select('order');
        
        const nextOrder = highestOrderBlock && highestOrderBlock.order !== undefined ? highestOrderBlock.order + 1 : 0;

        let finalConfig = { ...configuration };
        if (SOCIAL_PLATFORMS.includes(blockType)) {
            const handle = (configuration.handle || configuration.username || configuration.title || '').trim().replace(/^@/, '');
            finalConfig = {
                platform: blockType,
                username: handle,
                title: configuration.title || blockType.toUpperCase(),
                handle
            };
        }

        const block = await ProfileBlock.create({
            userId: req.user._id,
            blockType,
            configuration: finalConfig,
            layout: {
                x: Number(layout.x) || 0,
                y: Number(layout.y) || 0,
                w: Math.max(1, Math.min(4, w)),
                h: Math.max(1, Math.min(6, h))
            },
            order: nextOrder,
            visibility: Boolean(visibility)
        });

        // Sync Social Profile Data in MongoDB if Social Block
        let socialProfileData = null;
        if (SOCIAL_PLATFORMS.includes(blockType)) {
            try {
                socialProfileData = await getOrFetchSocialProfile({
                    userId: req.user._id,
                    profileBlockId: block._id,
                    platform: blockType,
                    username: finalConfig.username
                });
            } catch (err) {
                console.error(`[Create Block Social Sync Error] ${blockType}:${finalConfig.username}:`, err.message);
            }
        }

        const responseObj = block.toObject();
        if (socialProfileData) {
            responseObj.socialProfile = socialProfileData;
        }

        return res.status(201).json({
            success: true,
            message: 'Block created successfully',
            data: responseObj
        });
    } catch (error) {
        console.error('[Create Block Error]', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create profile block',
            error: error.message
        });
    }
};

/**
 * GET /api/profile-blocks
 * Get all blocks for authenticated user, pre-populated with cached SocialProfiles
 */
const getUserBlocks = async (req, res) => {
    try {
        const [blocks, socialProfiles] = await Promise.all([
            ProfileBlock.find({ userId: req.user._id }).sort({ order: 1, createdAt: 1 }),
            SocialProfile.find({ userId: req.user._id })
        ]);

        const socialProfileMap = new Map();
        socialProfiles.forEach(sp => {
            socialProfileMap.set(sp.profileBlockId.toString(), sp);
        });

        const blocksWithSocial = blocks.map(b => {
            const bObj = b.toObject();
            if (socialProfileMap.has(b._id.toString())) {
                bObj.socialProfile = socialProfileMap.get(b._id.toString());
            }
            return bObj;
        });

        return res.status(200).json({
            success: true,
            message: 'User blocks retrieved successfully',
            data: blocksWithSocial,
            socialProfiles
        });
    } catch (error) {
        console.error('[Get User Blocks Error]', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch profile blocks',
            error: error.message
        });
    }
};

/**
 * GET /api/profile-blocks/public/:username
 * Single combined endpoint returning profile details, visible blocks, and MongoDB cached SocialProfiles (0 Apify calls)
 */
const getPublicBlocks = async (req, res) => {
    try {
        const username = (req.params.username || '').toLowerCase().trim();
        if (!username) {
            return res.status(400).json({
                success: false,
                message: 'Username is required'
            });
        }

        const profile = await Profile.findOne({ username });
        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found'
            });
        }

        const [user, blocks, socialProfiles] = await Promise.all([
            User.findById(profile.userId).select('fullName username role'),
            ProfileBlock.find({ userId: profile.userId, visibility: true }).sort({ order: 1, createdAt: 1 }),
            SocialProfile.find({ userId: profile.userId })
        ]);

        const socialProfileMap = new Map();
        socialProfiles.forEach(sp => {
            socialProfileMap.set(sp.profileBlockId.toString(), sp);
        });

        const blocksWithSocial = blocks.map(b => {
            const bObj = b.toObject();
            if (socialProfileMap.has(b._id.toString())) {
                bObj.socialProfile = socialProfileMap.get(b._id.toString());
            }
            return bObj;
        });

        return res.status(200).json({
            success: true,
            message: 'Public profile retrieved successfully',
            data: {
                profile,
                user,
                blocks: blocksWithSocial,
                socialProfiles
            }
        });
    } catch (error) {
        console.error('[Get Public Blocks Error]', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch public profile',
            error: error.message
        });
    }
};

/**
 * PUT /api/profile-blocks/:id
 * Update block configuration & layout (Authorized owner only). If social handle changes, updates MongoDB SocialProfile.
 */
const updateBlock = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            configuration,
            layout,
            order,
            visibility
        } = req.body;

        const block = await ProfileBlock.findOne({ _id: id, userId: req.user._id });
        if (!block) {
            return res.status(404).json({
                success: false,
                message: 'Profile block not found or access denied'
            });
        }

        let socialProfileData = null;

        if (configuration !== undefined) {
            if (configuration.imageUrl || configuration.image) {
                const imgUrl = configuration.imageUrl || configuration.image;
                if (!validateImageUrl(imgUrl)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Base64 image encoding is not supported. Please provide a valid Cloudinary/S3 or HTTPS image URL.'
                    });
                }
            }

            if (SOCIAL_PLATFORMS.includes(block.blockType)) {
                const newHandle = (configuration.handle || configuration.username || configuration.title || '').trim().replace(/^@/, '');
                const oldHandle = (block.configuration?.username || block.configuration?.handle || '').trim().replace(/^@/, '');

                block.configuration = {
                    platform: block.blockType,
                    username: newHandle,
                    title: configuration.title || block.blockType.toUpperCase(),
                    handle: newHandle
                };

                if (newHandle && newHandle !== oldHandle) {
                    try {
                        socialProfileData = await getOrFetchSocialProfile({
                            userId: req.user._id,
                            profileBlockId: block._id,
                            platform: block.blockType,
                            username: newHandle,
                            forceRefresh: true
                        });
                    } catch (err) {
                        console.error(`[Update Block Social Sync Error] ${block.blockType}:${newHandle}:`, err.message);
                    }
                }
            } else {
                block.configuration = { ...block.configuration, ...configuration };
            }
        }

        if (layout !== undefined) {
            block.layout = {
                x: layout.x !== undefined ? Number(layout.x) : block.layout.x,
                y: layout.y !== undefined ? Number(layout.y) : block.layout.y,
                w: layout.w !== undefined ? Math.max(1, Math.min(4, Number(layout.w))) : block.layout.w,
                h: layout.h !== undefined ? Math.max(1, Math.min(6, Number(layout.h))) : block.layout.h
            };
        }

        if (order !== undefined) block.order = Number(order);
        if (visibility !== undefined) block.visibility = Boolean(visibility);
        if (req.body.locked !== undefined) block.locked = Boolean(req.body.locked);

        await block.save();

        if (!socialProfileData && SOCIAL_PLATFORMS.includes(block.blockType)) {
            socialProfileData = await SocialProfile.findOne({ profileBlockId: block._id });
        }

        const responseObj = block.toObject();
        if (socialProfileData) {
            responseObj.socialProfile = socialProfileData;
        }

        return res.status(200).json({
            success: true,
            message: 'Block updated successfully',
            data: responseObj
        });
    } catch (error) {
        console.error('[Update Block Error]', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update profile block',
            error: error.message
        });
    }
};

/**
 * DELETE /api/profile-blocks/:id
 * Delete block and cascade delete associated SocialProfile (Authorized owner only)
 */
const deleteBlock = async (req, res) => {
    try {
        const { id } = req.params;

        const block = await ProfileBlock.findOneAndDelete({ _id: id, userId: req.user._id });
        if (!block) {
            return res.status(404).json({
                success: false,
                message: 'Profile block not found or access denied'
            });
        }

        // Cascade delete SocialProfile document from MongoDB
        await deleteSocialProfileByBlockId(id);

        return res.status(200).json({
            success: true,
            message: 'Profile block and associated social profile deleted successfully',
            data: { id }
        });
    } catch (error) {
        console.error('[Delete Block Error]', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete profile block',
            error: error.message
        });
    }
};

/**
 * PATCH /api/profile-blocks/reorder
 * Bulk update layout (x, y, w, h) and order for user's blocks
 */
const reorderBlocks = async (req, res) => {
    try {
        const { blocks } = req.body;
        if (!Array.isArray(blocks)) {
            return res.status(400).json({
                success: false,
                message: 'blocks must be an array'
            });
        }

        const bulkOps = blocks.map((b, index) => {
            const layoutObj = {
                x: b.layout?.x !== undefined ? Number(b.layout.x) : (b.x !== undefined ? Number(b.x) : 0),
                y: b.layout?.y !== undefined ? Number(b.layout.y) : (b.y !== undefined ? Number(b.y) : 0),
                w: b.layout?.w !== undefined ? Number(b.layout.w) : (b.w !== undefined ? Number(b.w) : 2),
                h: b.layout?.h !== undefined ? Number(b.layout.h) : (b.h !== undefined ? Number(b.h) : 2)
            };

            return {
                updateOne: {
                    filter: { _id: b.id || b._id, userId: req.user._id },
                    update: {
                        $set: {
                            layout: layoutObj,
                            order: b.order !== undefined ? Number(b.order) : index
                        }
                    }
                }
            };
        });

        if (bulkOps.length > 0) {
            await ProfileBlock.bulkWrite(bulkOps);
        }

        const [updatedBlocks, socialProfiles] = await Promise.all([
            ProfileBlock.find({ userId: req.user._id }).sort({ order: 1, createdAt: 1 }),
            SocialProfile.find({ userId: req.user._id })
        ]);

        const socialProfileMap = new Map();
        socialProfiles.forEach(sp => {
            socialProfileMap.set(sp.profileBlockId.toString(), sp);
        });

        const blocksWithSocial = updatedBlocks.map(b => {
            const bObj = b.toObject();
            if (socialProfileMap.has(b._id.toString())) {
                bObj.socialProfile = socialProfileMap.get(b._id.toString());
            }
            return bObj;
        });

        return res.status(200).json({
            success: true,
            message: 'Blocks reordered successfully',
            data: blocksWithSocial
        });
    } catch (error) {
        console.error('[Reorder Blocks Error]', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to reorder blocks',
            error: error.message
        });
    }
};

module.exports = {
    createBlock,
    getUserBlocks,
    getPublicBlocks,
    updateBlock,
    deleteBlock,
    reorderBlocks
};
