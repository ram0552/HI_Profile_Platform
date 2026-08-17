const Profile = require('../models/Profile');
const ProfileBlock = require('../models/ProfileBlock');
const { getOrFetchSocialProfile } = require('./socialProfileService');

const SUPPORTED_SOCIAL_PLATFORMS = ['linkedin', 'instagram', 'github', 'youtube', 'twitter', 'dribbble'];

/**
 * Normalize raw input string or URL into a clean social handle/username.
 * Examples:
 *   "https://www.linkedin.com/in/rambabu-ghantasala-27bb02413/" -> "rambabu-ghantasala-27bb02413"
 *   "https://instagram.com/filmymoji?igshid=123" -> "filmymoji"
 *   "https://github.com/rambabu" -> "rambabu"
 *   "@filmymoji" -> "filmymoji"
 *   "  filmymoji  " -> "filmymoji"
 */
function normalizeSocialHandle(inputStr) {
    if (!inputStr || typeof inputStr !== 'string') return '';
    let str = inputStr.trim();
    if (!str) return '';

    // If string is a URL, extract the relevant profile identifier from pathname
    if (
        str.startsWith('http://') ||
        str.startsWith('https://') ||
        str.includes('linkedin.com') ||
        str.includes('instagram.com') ||
        str.includes('github.com') ||
        str.includes('youtube.com') ||
        str.includes('twitter.com') ||
        str.includes('x.com') ||
        str.includes('dribbble.com')
    ) {
        try {
            const urlToParse = str.match(/^https?:\/\//i) ? str : `https://${str}`;
            const parsed = new URL(urlToParse);
            let pathname = parsed.pathname.replace(/\/+$/, '');
            const parts = pathname.split('/').filter(Boolean);

            if (parsed.hostname.includes('linkedin.com')) {
                const inIndex = parts.findIndex(p => p.toLowerCase() === 'in' || p.toLowerCase() === 'pub');
                if (inIndex !== -1 && parts[inIndex + 1]) {
                    str = parts[inIndex + 1];
                } else if (parts.length > 0) {
                    str = parts[parts.length - 1];
                }
            } else if (parsed.hostname.includes('youtube.com')) {
                const cIndex = parts.findIndex(p => p.toLowerCase() === 'c' || p.toLowerCase() === 'user' || p.toLowerCase() === 'channel');
                if (cIndex !== -1 && parts[cIndex + 1]) {
                    str = parts[cIndex + 1];
                } else if (parts.length > 0) {
                    str = parts[parts.length - 1];
                }
            } else if (parts.length > 0) {
                str = parts[parts.length - 1];
            }
        } catch (e) {
            const parts = str.split('?')[0].replace(/\/+$/, '').split('/');
            str = parts[parts.length - 1] || str;
        }
    }

    str = str.split('?')[0].split('#')[0].trim().replace(/^@/, '');
    return str;
}

/**
 * Synchronize social handles entered during Setup into Bento ProfileBlocks.
 * IDEMPOTENT & NON-DESTRUCTIVE:
 * - Preserves all existing Bento blocks (positions, layout, sizes, ordering).
 * - Avoids duplicate blocks if platform block already exists.
 * - Updates handle configuration if changed in Setup.
 * - Appends new social blocks in available non-overlapping grid slots.
 * - Reuses existing cached SocialProfile documents from MongoDB (0 unnecessary Apify calls).
 */
const syncSetupSocialLinksToBento = async (userId) => {
    if (!userId) return [];

    try {
        const profile = await Profile.findOne({ userId }).lean();
        if (!profile || !profile.socialLinks) {
            return await ProfileBlock.find({ userId }).sort({ order: 1 }).lean();
        }

        const socialLinks = profile.socialLinks || {};

        // Collect non-empty valid social handles from setup data
        const setupHandles = [];
        SUPPORTED_SOCIAL_PLATFORMS.forEach(platform => {
            const rawValue = socialLinks[platform];
            if (rawValue && typeof rawValue === 'string') {
                const normalized = normalizeSocialHandle(rawValue);
                if (normalized) {
                    setupHandles.push({ platform, handle: normalized });
                }
            }
        });

        // Empty setup case: Return existing blocks without creating empty placeholders
        if (setupHandles.length === 0) {
            return await ProfileBlock.find({ userId }).sort({ order: 1 }).lean();
        }

        const existingBlocks = await ProfileBlock.find({ userId }).sort({ order: 1 });
        const existingBlockMap = new Map();
        existingBlocks.forEach(b => {
            if (SUPPORTED_SOCIAL_PLATFORMS.includes(b.blockType) && !existingBlockMap.has(b.blockType)) {
                existingBlockMap.set(b.blockType, b);
            }
        });

        // Track occupied grid cells to ensure new blocks never overlap existing content
        const occupiedCells = new Set();
        const markOccupied = (x, y, w, h) => {
            for (let r = y; r < y + h; r++) {
                for (let c = x; c < x + w; c++) {
                    occupiedCells.add(`${c},${r}`);
                }
            }
        };

        existingBlocks.forEach(b => {
            markOccupied(b.layout?.x || 0, b.layout?.y || 0, b.layout?.w || 2, b.layout?.h || 2);
        });

        // Find next available non-overlapping position on 4-column grid
        const findNextAvailablePosition = (w = 2, h = 2) => {
            let y = 0;
            while (y < 200) {
                for (let x of [0, 2]) {
                    let fits = true;
                    for (let r = y; r < y + h; r++) {
                        for (let c = x; c < x + w; c++) {
                            if (occupiedCells.has(`${c},${r}`)) {
                                fits = false;
                                break;
                            }
                        }
                        if (!fits) break;
                    }
                    if (fits) {
                        markOccupied(x, y, w, h);
                        return { x, y };
                    }
                }
                y++;
            }
            return { x: 0, y: 0 };
        };

        let highestOrder = existingBlocks.reduce((max, b) => Math.max(max, b.order !== undefined ? b.order : 0), -1);

        for (const { platform, handle } of setupHandles) {
            const existingBlock = existingBlockMap.get(platform);

            if (existingBlock) {
                // Existing block found for this platform! Check if handle was updated
                const currentHandle = (existingBlock.configuration?.username || existingBlock.configuration?.handle || '').trim().replace(/^@/, '');

                if (currentHandle.toLowerCase() !== handle.toLowerCase()) {
                    existingBlock.configuration = {
                        platform,
                        username: handle,
                        handle: handle,
                        title: platform.toUpperCase()
                    };
                    await existingBlock.save();

                    try {
                        await getOrFetchSocialProfile({
                            userId,
                            profileBlockId: existingBlock._id,
                            platform,
                            username: handle,
                            forceRefresh: false
                        });
                    } catch (err) {
                        console.warn(`[Sync Setup Social Handle Update Error] ${platform}:${handle}:`, err.message);
                    }
                } else {
                    // Ensure SocialProfile document is associated
                    try {
                        await getOrFetchSocialProfile({
                            userId,
                            profileBlockId: existingBlock._id,
                            platform,
                            username: handle,
                            forceRefresh: false
                        });
                    } catch (err) {
                        console.warn(`[Sync Setup Social Ensure Profile Error] ${platform}:${handle}:`, err.message);
                    }
                }
            } else {
                // Missing social block -> Create new ProfileBlock!
                const currentCount = await ProfileBlock.countDocuments({ userId });
                if (currentCount >= 20) break; // Respect max limit

                const pos = findNextAvailablePosition(2, 2);
                highestOrder += 1;

                const newBlock = await ProfileBlock.create({
                    userId,
                    blockType: platform,
                    configuration: {
                        platform,
                        username: handle,
                        handle: handle,
                        title: platform.toUpperCase()
                    },
                    layout: {
                        x: pos.x,
                        y: pos.y,
                        w: 2,
                        h: 2
                    },
                    order: highestOrder,
                    visibility: true
                });

                existingBlockMap.set(platform, newBlock);

                try {
                    await getOrFetchSocialProfile({
                        userId,
                        profileBlockId: newBlock._id,
                        platform,
                        username: handle,
                        forceRefresh: false
                    });
                } catch (err) {
                    console.warn(`[Sync Setup Social Create Profile Error] ${platform}:${handle}:`, err.message);
                }
            }
        }

        return await ProfileBlock.find({ userId }).sort({ order: 1 }).lean();
    } catch (err) {
        console.error('[Sync Setup Social Links Error]', err);
        return await ProfileBlock.find({ userId }).sort({ order: 1 }).lean();
    }
};

module.exports = {
    normalizeSocialHandle,
    syncSetupSocialLinksToBento,
    SUPPORTED_SOCIAL_PLATFORMS
};
