const SocialProfile = require('../models/SocialProfile');
const { getGitHubProfile } = require('./githubService');
const { getInstagramProfile } = require('./instagramService');
const { getYouTubeProfile } = require('./youtubeService');
const { getTwitterProfile } = require('./twitterService');
const { getLinkedInProfile } = require('./linkedinService');

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 Hours Cache Expiration

/**
 * Extract standardized recentContent array from platform scraper data.
 * EXHAUSTIVE: persists every meaningful field from each platform's scraper output.
 */
const extractNormalizedRecentContent = (platform, data = {}) => {
    const cleanPlatform = (platform || '').toLowerCase().trim();

    if (cleanPlatform === 'instagram') {
        const posts = data.recentPosts || data.posts || [];
        return posts.map(p => ({
            id: String(p.id || ''),
            caption: p.caption || '',
            imageUrl: p.imageUrl || p.displayUrl || p.thumbnailUrl || p.thumbnail_src || '',
            thumbnailUrl: p.thumbnailUrl || p.imageUrl || p.displayUrl || p.thumbnail_src || '',
            contentUrl: p.postUrl || p.url || '',
            likesCount: Number(p.likesCount || p.likes_count || 0),
            commentsCount: Number(p.commentsCount || p.comments_count || 0),
            shortCode: p.shortCode || p.shortcode || '',
            mediaType: p.mediaType || p.type || p.__typename || '',
            publishedAt: p.timestamp || p.taken_at_timestamp || p.taken_at || ''
        }));
    }

    if (cleanPlatform === 'github') {
        const repos = data.recentRepos || data.repositories || [];
        return repos.map(r => ({
            title: r.name || '',
            description: r.description || '',
            language: r.language || '',
            stars: Number(r.stars || 0),
            forks: Number(r.forks || 0),
            contentUrl: r.url || '',
            publishedAt: r.updatedAt || r.createdAt || ''
        }));
    }

    if (cleanPlatform === 'linkedin') {
        const profileObj = data.profile || data;
        const posts = profileObj.recentPosts || data.recentPosts || [];
        return posts.map(p => ({
            text: p.text || '',
            imageUrl: p.imageUrl || '',
            thumbnailUrl: p.thumbnailUrl || p.imageUrl || '',
            contentUrl: p.postUrl || p.url || '',
            likesCount: Number(p.likesCount || 0),
            commentsCount: Number(p.commentsCount || 0),
            sharesCount: Number(p.sharesCount || 0),
            postType: p.postType || '',
            articleTitle: p.articleTitle || '',
            articleUrl: p.articleUrl || '',
            publishedAt: p.createdAt || ''
        }));
    }

    if (cleanPlatform === 'youtube') {
        const videos = data.recentVideos || data.videos || [];
        return videos.map(v => ({
            title: v.title || '',
            imageUrl: v.thumbnailUrl || v.imageUrl || '',
            thumbnailUrl: v.thumbnailUrl || v.imageUrl || '',
            contentUrl: v.url || '',
            viewsCount: Number(v.viewCount || 0),
            likesCount: Number(v.likeCount || v.likes || 0),
            commentsCount: Number(v.commentCount || v.commentsCount || 0),
            duration: v.duration || '',
            description: v.description || '',
            publishedAt: v.uploadedAt || v.date || ''
        }));
    }

    if (cleanPlatform === 'twitter') {
        const tweets = data.recentPosts || data.tweets || [];
        return tweets.map(t => ({
            id: String(t.id || ''),
            text: t.text || '',
            imageUrl: t.imageUrl || '',
            thumbnailUrl: t.thumbnailUrl || t.imageUrl || '',
            contentUrl: t.postUrl || t.url || '',
            likesCount: Number(t.likesCount || t.likeCount || 0),
            sharesCount: Number(t.retweetsCount || t.retweetCount || 0),
            commentsCount: Number(t.repliesCount || t.replyCount || 0),
            repliesCount: Number(t.repliesCount || t.replyCount || 0),
            publishedAt: t.createdAt || ''
        }));
    }

    return [];
};

/**
 * Call platform specific service to scrape via Apify
 */
const fetchPlatformData = async (platform, username) => {
    const cleanPlatform = (platform || '').toLowerCase().trim();
    const cleanUsername = (username || '').toLowerCase().trim();

    switch (cleanPlatform) {
        case 'github':
            return await getGitHubProfile(cleanUsername);
        case 'instagram':
            return await getInstagramProfile(cleanUsername);
        case 'youtube':
            return await getYouTubeProfile(cleanUsername);
        case 'twitter':
            return await getTwitterProfile(cleanUsername);
        case 'linkedin':
            return await getLinkedInProfile(cleanUsername);
        default:
            throw new Error(`Unsupported social platform: "${platform}"`);
    }
};

/**
 * Build platform-specific enrichment fields for the SocialProfile document.
 * These are top-level fields that vary by platform.
 */
const extractPlatformEnrichment = (platform, data = {}) => {
    const cleanPlatform = (platform || '').toLowerCase().trim();
    const profileObj = data.profile || data;
    const enrichment = {};

    if (cleanPlatform === 'linkedin') {
        const basicInfo = data.basic_info || data.basicInfo || profileObj.basic_info || profileObj.basicInfo || profileObj;
        enrichment.currentTitle = profileObj.currentTitle || basicInfo.currentTitle || data.currentTitle || '';
        enrichment.currentCompany = profileObj.currentCompany || basicInfo.current_company || basicInfo.currentCompanyName || basicInfo.currentCompany || data.currentCompany || '';
        enrichment.bio = profileObj.bio || basicInfo.about || basicInfo.bio || basicInfo.summary || data.bio || '';
        const connVal =
            profileObj.connectionsCount ??
            data.connectionsCount ??
            data.connections ??
            basicInfo.connection_count ??
            basicInfo.connections_count ??
            basicInfo.connectionCount ??
            0;
        enrichment.connectionsCount = Number(connVal);
    }

    if (cleanPlatform === 'youtube') {
        enrichment.subscribersCount = Number(data.subscribersCount || 0);
        enrichment.videoCount = Number(data.videoCount || 0);
        enrichment.viewCount = Number(data.viewCount || 0);
    }

    if (cleanPlatform === 'github') {
        enrichment.reposCount = Number(data.reposCount || data.publicRepos || 0);
        enrichment.bio = data.bio || '';
    }

    return enrichment;
};

/**
 * Background async refresh of SocialProfile document
 */
const refreshSocialProfileAsync = async (socialProfileId) => {
    try {
        const socialProfile = await SocialProfile.findById(socialProfileId);
        if (!socialProfile) return;

        console.log(`[Background Refresh] Fetching fresh Apify data for ${socialProfile.platform}:${socialProfile.username}...`);
        const data = await fetchPlatformData(socialProfile.platform, socialProfile.username);

        const profileObj = data.profile || data;
        const basicInfo = data.basic_info || data.basicInfo || profileObj.basic_info || profileObj.basicInfo || profileObj;
        const extractedProfileImage =
            data.profileImage ||
            basicInfo.profile_picture_url ||
            basicInfo.profile_picture ||
            basicInfo.profilePicUrl ||
            profileObj.profilePicture ||
            data.profilePicture ||
            profileObj.profileImage ||
            data.avatarUrl ||
            profileObj.avatarUrl ||
            profileObj.profilePicUrl ||
            data.profilePicUrl ||
            profileObj.pictureUrl ||
            data.pictureUrl ||
            profileObj.displayPictureUrl ||
            data.displayPictureUrl ||
            '';

        socialProfile.displayName = data.displayName || basicInfo.fullname || basicInfo.fullName || profileObj.fullName || data.fullName || data.name || socialProfile.username;
        // Never overwrite a valid existing profile image with an empty string
        socialProfile.profileImage = extractedProfileImage || socialProfile.profileImage || '';
        socialProfile.headline = basicInfo.headline || profileObj.headline || data.headline || '';
        socialProfile.location = basicInfo.location || profileObj.location || data.location || '';
        socialProfile.verified = Boolean(data.verified || profileObj.verified);
        socialProfile.followers = Number(data.followers || basicInfo.follower_count || data.followersCount || profileObj.followersCount || data.subscribersCount || 0);
        socialProfile.following = Number(data.following || basicInfo.connection_count || data.followingCount || profileObj.followingCount || 0);
        socialProfile.posts = Number(data.posts || data.postsCount || profileObj.postsCount || data.publicRepos || data.videoCount || 0);
        socialProfile.description = data.description || basicInfo.about || profileObj.bio || data.bio || data.biography || '';
        socialProfile.profileUrl = data.profileUrl || profileObj.profileUrl || socialProfile.profileUrl;
        socialProfile.recentContent = extractNormalizedRecentContent(socialProfile.platform, data);
        socialProfile.rawData = data;
        socialProfile.lastFetched = new Date();
        socialProfile.lastUpdated = new Date();

        // Apply platform-specific enrichment fields
        const enrichment = extractPlatformEnrichment(socialProfile.platform, data);
        const updatePayload = {
            displayName: socialProfile.displayName,
            profileImage: socialProfile.profileImage,
            headline: socialProfile.headline,
            location: socialProfile.location,
            verified: socialProfile.verified,
            followers: socialProfile.followers,
            following: socialProfile.following,
            posts: socialProfile.posts,
            description: socialProfile.description,
            profileUrl: socialProfile.profileUrl,
            recentContent: socialProfile.recentContent,
            rawData: socialProfile.rawData,
            lastFetched: socialProfile.lastFetched,
            lastUpdated: socialProfile.lastUpdated,
            ...enrichment
        };

        await SocialProfile.updateOne({ _id: socialProfile._id }, { $set: updatePayload });
        console.log(`[Background Refresh] Successfully updated ${socialProfile.platform}:${socialProfile.username} in MongoDB.`);
    } catch (error) {
        console.error(`[Background Refresh Error] Failed to refresh social profile ${socialProfileId}:`, error.message);
    }
};

/**
 * Get cached SocialProfile from MongoDB or fetch via Apify
 */
const getOrFetchSocialProfile = async ({ userId, profileBlockId, platform, username, forceRefresh = false }) => {
    const cleanPlatform = (platform || '').toLowerCase().trim();
    const cleanUsername = (username || '').toLowerCase().trim().replace(/^@/, '');

    if (!cleanPlatform || !cleanUsername) {
        throw new Error('Platform and username are required');
    }

    // 1. Search for existing SocialProfile in MongoDB 
    let socialProfile = null;
    if (profileBlockId) {
        socialProfile = await SocialProfile.findOne({ profileBlockId });
    }
    if (!socialProfile && userId) {
        socialProfile = await SocialProfile.findOne({ userId, platform: cleanPlatform, username: cleanUsername });
    }
    if (!socialProfile) {
        socialProfile = await SocialProfile.findOne({ platform: cleanPlatform, username: cleanUsername });
    }

    // Ensure socialProfile is linked to the current profileBlockId if found by (userId, platform, username)
    if (socialProfile && profileBlockId && String(socialProfile.profileBlockId) !== String(profileBlockId)) {
        socialProfile.profileBlockId = profileBlockId;
    }

    const now = Date.now();

    // Helper: Check if stored document contains valid populated profile data
    const basicInfo = socialProfile?.basic_info || socialProfile?.basicInfo || socialProfile?.rawData?.basic_info || socialProfile?.rawData?.basicInfo || {};
    const isPopulated = Boolean(
        socialProfile &&
        (
            socialProfile.followers > 0 ||
            socialProfile.posts > 0 ||
            Boolean(socialProfile.profileImage) ||
            Boolean(socialProfile.description) ||
            Boolean(socialProfile.displayName) ||
            Boolean(socialProfile.rawData) ||
            Boolean(basicInfo.fullname) ||
            Boolean(basicInfo.headline) ||
            Boolean(basicInfo.profile_picture_url) ||
            Boolean(basicInfo.about) ||
            Number(basicInfo.follower_count || 0) > 0 ||
            Number(basicInfo.connection_count || 0) > 0 ||
            (socialProfile.recentContent && socialProfile.recentContent.length > 0)
        )
    );

    // 2. Cache Hit (< 24 Hours) & valid data & no forceRefresh -> Return stored document instantly
    if (socialProfile && isPopulated && !forceRefresh) {
        const lastFetchedMs = socialProfile.lastFetched ? new Date(socialProfile.lastFetched).getTime() : 0;
        const age = now - lastFetchedMs;

        if (lastFetchedMs > 0 && age < CACHE_TTL_MS) {
            console.log(`[MongoDB Social Cache] HIT (<24h) for ${cleanPlatform}:${cleanUsername}. Returning stored MongoDB profile (0 Apify calls).`);
            if (socialProfile.isModified()) {
                await socialProfile.save();
            }
            return socialProfile;
        } else {
            // Stale (> 24 Hours) -> Return stored document instantly AND trigger background refresh
            console.log(`[MongoDB Social Cache] STALE (>24h) for ${cleanPlatform}:${cleanUsername}. Returning stored MongoDB profile & triggering background refresh...`);
            if (socialProfile.isModified()) {
                await socialProfile.save();
            }
            refreshSocialProfileAsync(socialProfile._id).catch(() => { });
            return socialProfile;
        }
    }

    // 3. Cache Miss, Invalid Data, or Force Refresh -> Fetch from Apify / Service with resilient fallback
    console.log(`[MongoDB Social Cache] FETCH REQUIRED for ${cleanPlatform}:${cleanUsername}. Calling platform service...`);
    let data = {};
    let isApifySuccess = false;

    try {
        console.log(`[SocialProfile] Invoking platform service for ${cleanPlatform}:${cleanUsername} (APIFY_API_KEY configured: ${Boolean(process.env.APIFY_API_KEY)})...`);
        data = await fetchPlatformData(cleanPlatform, cleanUsername);
        isApifySuccess = true;
    } catch (apifyErr) {
        console.error(`[SocialProfile Apify Error] ${cleanPlatform}:${cleanUsername}:`, {
            platform: cleanPlatform,
            username: cleanUsername,
            apifyKeyConfigured: Boolean(process.env.APIFY_API_KEY),
            errorMessage: apifyErr.message
        });

        if (socialProfile && isPopulated) {
            console.log(`[SocialProfile] Serving existing MongoDB profile for ${cleanPlatform}:${cleanUsername} despite Apify fetch error.`);
            return socialProfile;
        }

        throw new Error(`Apify synchronization failed for ${cleanPlatform}:${cleanUsername} (${apifyErr.message})`);
    }

    const profileObj = data.profile || data;
    const recentContent = extractNormalizedRecentContent(cleanPlatform, data);
    const extractedProfileImage =
        data.profileImage ||
        profileObj.profilePicture ||
        data.profilePicture ||
        profileObj.profileImage ||
        data.avatarUrl ||
        profileObj.avatarUrl ||
        profileObj.profilePicUrl ||
        data.profilePicUrl ||
        profileObj.pictureUrl ||
        data.pictureUrl ||
        profileObj.displayPictureUrl ||
        data.displayPictureUrl ||
        '';

    const payload = {
        userId,
        profileBlockId,
        platform: cleanPlatform,
        username: cleanUsername,
        displayName: isApifySuccess ? (data.displayName || profileObj.fullName || data.fullName || data.name || cleanUsername) : (socialProfile?.displayName || cleanUsername),
        profileImage: extractedProfileImage || socialProfile?.profileImage || '',
        headline: isApifySuccess ? (profileObj.headline || data.headline || '') : (socialProfile?.headline || ''),
        location: isApifySuccess ? (profileObj.location || data.location || '') : (socialProfile?.location || ''),
        verified: isApifySuccess ? Boolean(data.verified || profileObj.verified) : Boolean(socialProfile?.verified),
        followers: isApifySuccess ? Number(data.followers || data.followersCount || profileObj.followersCount || data.subscribersCount || 0) : Number(socialProfile?.followers || 0),
        following: isApifySuccess ? Number(data.following || data.followingCount || profileObj.followingCount || 0) : Number(socialProfile?.following || 0),
        posts: isApifySuccess ? Number(data.posts || data.postsCount || profileObj.postsCount || data.publicRepos || data.videoCount || 0) : Number(socialProfile?.posts || 0),
        description: isApifySuccess ? (data.description || profileObj.bio || data.bio || data.biography || '') : (socialProfile?.description || ''),
        profileUrl: isApifySuccess ? (data.profileUrl || profileObj.profileUrl || `https://${cleanPlatform}.com/${cleanUsername}`) : (socialProfile?.profileUrl || `https://${cleanPlatform}.com/${cleanUsername}`),
        recentContent: (isApifySuccess && recentContent.length > 0) ? recentContent : (socialProfile?.recentContent || []),
        rawData: isApifySuccess ? data : (socialProfile?.rawData || null),
        lastFetched: isApifySuccess ? new Date() : (socialProfile?.lastFetched && new Date(socialProfile.lastFetched).getTime() > 0 ? socialProfile.lastFetched : new Date(0)),
        lastUpdated: new Date(),
        ...(isApifySuccess ? extractPlatformEnrichment(cleanPlatform, data) : {})
    };

    if (socialProfile) {
        if (userId && !socialProfile.userId) socialProfile.userId = userId;
        if (profileBlockId && !socialProfile.profileBlockId) socialProfile.profileBlockId = profileBlockId;
        Object.assign(socialProfile, payload);
        await socialProfile.save();
    } else {
        if (!userId || !profileBlockId) {
            console.warn(`[SocialProfile Warning] Cannot create SocialProfile document without userId and profileBlockId. userId=${userId}, profileBlockId=${profileBlockId}`);
            return null;
        }
        socialProfile = await SocialProfile.findOneAndUpdate(
            { profileBlockId },
            { $set: payload },
            { upsert: true, new: true, runValidators: true }
        );
    }

    return socialProfile;
};

/**
 * Delete SocialProfile linked to a ProfileBlock
 */
const deleteSocialProfileByBlockId = async (profileBlockId) => {
    if (!profileBlockId) return;
    await SocialProfile.deleteMany({ profileBlockId });
};

module.exports = {
    getOrFetchSocialProfile,
    refreshSocialProfileAsync,
    deleteSocialProfileByBlockId
};
