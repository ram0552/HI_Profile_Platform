const Profile = require('../models/Profile');
const ProfileBlock = require('../models/ProfileBlock');
const SocialProfile = require('../models/SocialProfile');
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

/**
 * Common synchronization service for Bento profile data.
 * Used by both Daily 2 AM Cron Job and Instant Refresh manual endpoint.
 * 
 * @param {string|ObjectId} userId - User ID to synchronize
 * @param {Object} options - { forceRefresh: boolean, syncSource: 'cron'|'manual'|'setup' }
 * @returns {Promise<Object>} { success: boolean, blocks: Array, socialProfiles: Array, lastSyncedAt: Date }
 */
const syncUserBentoData = async (userId, options = {}) => {
    if (!userId) {
        throw new Error('userId is required for syncUserBentoData');
    }

    const syncSource = options.syncSource || 'manual';
    const forceRefresh = options.forceRefresh !== false;

    console.log(`[Bento Sync Service] Starting sync for user "${userId}" (Source: ${syncSource}, ForceRefresh: ${forceRefresh})`);

    // 1. Update Profile syncStatus to 'in_progress'
    await Profile.updateOne(
        { userId },
        {
            $set: {
                'syncMetadata.syncStatus': 'in_progress',
                'syncMetadata.syncSource': syncSource
            }
        }
    );

    try {
        // 2. Ensure setup social links are synced into Bento blocks first
        await syncSetupSocialLinksToBento(userId);

        // 3. Find all Bento social blocks for this user
        const socialBlocks = await ProfileBlock.find({
            userId,
            blockType: { $in: SUPPORTED_SOCIAL_PLATFORMS }
        });

        const syncedProfiles = [];
        let hasErrors = false;
        let lastErrMessage = '';

        for (const block of socialBlocks) {
            const handle = (block.configuration?.username || block.configuration?.handle || '').trim().replace(/^@/, '');
            if (!handle) continue;

            try {
                const spDoc = await getOrFetchSocialProfile({
                    userId,
                    profileBlockId: block._id,
                    platform: block.blockType,
                    username: handle,
                    forceRefresh: forceRefresh
                });

                if (spDoc) {
                    syncedProfiles.push(spDoc);
                }
            } catch (err) {
                console.error(`[Bento Sync Service] Failed sync for ${block.blockType}:${handle} (User: ${userId}):`, err.message);
                hasErrors = true;
                lastErrMessage = err.message;
            }
        }

        const lastSyncedAt = new Date();
        const finalStatus = (syncedProfiles.length === 0 && socialBlocks.length > 0 && hasErrors) ? 'failed' : 'success';

        await Profile.updateOne(
            { userId },
            {
                $set: {
                    'syncMetadata.lastSyncedAt': lastSyncedAt,
                    'syncMetadata.syncStatus': finalStatus,
                    'syncMetadata.syncSource': syncSource,
                    'syncMetadata.syncError': hasErrors ? lastErrMessage : ''
                }
            }
        );

        // 4. Fetch updated blocks and social profiles
        const [updatedBlocks, allSocialProfiles] = await Promise.all([
            ProfileBlock.find({ userId }).sort({ order: 1, createdAt: 1 }).lean(),
            SocialProfile.find({ userId }).lean()
        ]);

        const blocksWithSocial = attachSocialProfilesToBlocks(updatedBlocks, allSocialProfiles);

        return {
            success: true,
            syncStatus: finalStatus,
            lastSyncedAt,
            blocks: blocksWithSocial,
            socialProfiles: allSocialProfiles
        };
    } catch (err) {
        console.error(`[Bento Sync Service Error] Global failure for user ${userId}:`, err);

        await Profile.updateOne(
            { userId },
            {
                $set: {
                    'syncMetadata.syncStatus': 'failed',
                    'syncMetadata.syncError': err.message || 'Synchronization failed'
                }
            }
        );

        throw err;
    }
};

/**
 * Helper to attach populated SocialProfile documents onto Bento blocks
 */
function attachSocialProfilesToBlocks(blocks = [], socialProfiles = []) {
    if (!Array.isArray(blocks) || !Array.isArray(socialProfiles)) return blocks;

    const mapById = new Map();
    const mapByPlatformHandle = new Map();
    const mapByPlatform = new Map();

    socialProfiles.forEach(sp => {
        if (sp.profileBlockId) mapById.set(sp.profileBlockId.toString(), sp);
        if (sp.platform && sp.username) mapByPlatformHandle.set(`${sp.platform}:${sp.username.toLowerCase().trim()}`, sp);
        if (sp.platform) mapByPlatform.set(sp.platform, sp);
    });

    return blocks.map(b => {
        const bObj = { ...b, id: b._id || b.id };
        const handle = (b.configuration?.username || b.configuration?.handle || b.configuration?.title || '').toLowerCase().trim().replace(/^@/, '');
        const keyByHandle = b.blockType && handle ? `${b.blockType}:${handle}` : '';

        let spDoc = null;
        if (b._id && mapById.has(b._id.toString())) {
            spDoc = mapById.get(b._id.toString());
        } else if (keyByHandle && mapByPlatformHandle.has(keyByHandle)) {
            spDoc = mapByPlatformHandle.get(keyByHandle);
        } else if (b.blockType && mapByPlatform.has(b.blockType)) {
            spDoc = mapByPlatform.get(b.blockType);
        }

        if (spDoc) {
            const basicInfo = spDoc.basic_info || spDoc.basicInfo || spDoc.rawData?.basic_info || spDoc.rawData?.basicInfo || spDoc.rawData || {};

            const fullName = basicInfo.fullname || basicInfo.fullName || basicInfo.name || spDoc.displayName || spDoc.fullName || spDoc.name || spDoc.username || '';
            const profileImg = basicInfo.profile_picture_url || basicInfo.profile_picture || basicInfo.profilePicUrl || spDoc.profileImage || spDoc.avatarUrl || spDoc.profilePicture || '';
            const headline = basicInfo.headline || spDoc.headline || '';
            const location = basicInfo.location || basicInfo.locationFull || spDoc.location || '';
            const bio = basicInfo.about || basicInfo.summary || basicInfo.bio || spDoc.description || spDoc.bio || '';
            const followers = Number(basicInfo.follower_count ?? basicInfo.followers_count ?? basicInfo.followerCount ?? spDoc.followers ?? spDoc.followersCount ?? 0);
            const following = Number(spDoc.following ?? spDoc.followingCount ?? basicInfo.following_count ?? basicInfo.followingCount ?? 0);
            const posts = Number(spDoc.posts ?? spDoc.postsCount ?? basicInfo.posts_count ?? basicInfo.postsCount ?? 0);
            const connections = Number(basicInfo.connection_count ?? basicInfo.connections_count ?? basicInfo.connectionCount ?? spDoc.connectionsCount ?? (spDoc.platform !== 'instagram' ? following : 0));
            const currentCompany = basicInfo.current_company || basicInfo.currentCompanyName || basicInfo.currentCompany || spDoc.currentCompany || '';

            bObj.socialProfile = {
                ...spDoc,
                basic_info: basicInfo,
                displayName: fullName || spDoc.displayName || spDoc.username,
                fullName: fullName || spDoc.displayName || spDoc.username,
                profileImage: profileImg,
                avatarUrl: profileImg,
                profilePicture: profileImg,
                headline: headline,
                location: location,
                description: bio,
                bio: bio,
                followers: followers,
                followersCount: followers,
                following: following,
                followingCount: following,
                posts: posts,
                postsCount: posts,
                connectionsCount: connections,
                connections: connections,
                currentCompany: currentCompany,
                recentContent: spDoc.recentContent || spDoc.recentPosts || [],
                recentPosts: spDoc.recentContent || spDoc.recentPosts || []
            };
        }
        return bObj;
    });
}

module.exports = {
    normalizeSocialHandle,
    syncSetupSocialLinksToBento,
    syncUserBentoData,
    SUPPORTED_SOCIAL_PLATFORMS
};

