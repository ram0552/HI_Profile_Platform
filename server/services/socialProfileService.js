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
            publishedAt: r.updatedAt || ''
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
            imageUrl: v.thumbnailUrl || '',
            thumbnailUrl: v.thumbnailUrl || '',
            contentUrl: v.url || '',
            viewsCount: Number(v.viewCount || 0),
            likesCount: Number(v.likeCount || 0),
            commentsCount: Number(v.commentCount || 0),
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
        enrichment.currentTitle = profileObj.currentTitle || data.currentTitle || '';
        enrichment.currentCompany = profileObj.currentCompany || data.currentCompany || '';
        enrichment.bio = profileObj.bio || data.bio || '';
        enrichment.connectionsCount = Number(profileObj.connectionsCount || data.connectionsCount || 0);
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

        socialProfile.displayName = data.displayName || profileObj.fullName || data.fullName || data.name || socialProfile.username;
        // Never overwrite a valid existing profile image with an empty string
        socialProfile.profileImage = extractedProfileImage || socialProfile.profileImage || '';
        socialProfile.headline = profileObj.headline || data.headline || '';
        socialProfile.location = profileObj.location || data.location || '';
        socialProfile.verified = Boolean(data.verified || profileObj.verified);
        socialProfile.followers = Number(data.followers || data.followersCount || profileObj.followersCount || data.subscribersCount || 0);
        socialProfile.following = Number(data.following || data.followingCount || profileObj.followingCount || 0);
        socialProfile.posts = Number(data.posts || data.postsCount || profileObj.postsCount || data.publicRepos || data.videoCount || 0);
        socialProfile.description = data.description || profileObj.bio || data.bio || data.biography || '';
        socialProfile.profileUrl = data.profileUrl || profileObj.profileUrl || socialProfile.profileUrl;
        socialProfile.recentContent = extractNormalizedRecentContent(socialProfile.platform, data);
        socialProfile.rawData = data;
        socialProfile.lastFetched = new Date();
        socialProfile.lastUpdated = new Date();

        // Apply platform-specific enrichment fields
        const enrichment = extractPlatformEnrichment(socialProfile.platform, data);
        Object.assign(socialProfile, enrichment);

        await socialProfile.save();
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
    let socialProfile = await SocialProfile.findOne({ profileBlockId });
    if (!socialProfile) {
        socialProfile = await SocialProfile.findOne({ userId, platform: cleanPlatform, username: cleanUsername });
    }

    const now = Date.now();

    // 2. Cache Hit (< 24 Hours) & no forceRefresh -> Return stored document instantly
    if (socialProfile && !forceRefresh) {
        const age = now - new Date(socialProfile.lastFetched).getTime();

        if (age < CACHE_TTL_MS) {
            console.log(`[MongoDB Social Cache] HIT (<24h) for ${cleanPlatform}:${cleanUsername}`);
            return socialProfile;
        } else {
            // Stale (> 24 Hours) -> Return stored document instantly AND trigger background refresh
            console.log(`[MongoDB Social Cache] STALE (>24h) for ${cleanPlatform}:${cleanUsername}. Triggering background refresh...`);
            refreshSocialProfileAsync(socialProfile._id).catch(() => {});
            return socialProfile;
        }
    }

    // 3. Cache Miss or Force Refresh -> Fetch from Apify with resilient fallback
    console.log(`[MongoDB Social Cache] MISS for ${cleanPlatform}:${cleanUsername}. Calling Apify service...`);
    let data = {};
    let isApifySuccess = false;

    try {
        data = await fetchPlatformData(cleanPlatform, cleanUsername);
        isApifySuccess = true;
    } catch (apifyErr) {
        console.warn(`[Apify Fetch Warning] ${cleanPlatform}:${cleanUsername} failed (${apifyErr.message}). Creating fallback SocialProfile document...`);
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
        displayName: data.displayName || profileObj.fullName || data.fullName || data.name || cleanUsername,
        // Never overwrite a valid existing profile image with an empty string
        profileImage: extractedProfileImage || socialProfile?.profileImage || '',
        headline: profileObj.headline || data.headline || '',
        location: profileObj.location || data.location || '',
        verified: Boolean(data.verified || profileObj.verified),
        followers: Number(data.followers || data.followersCount || profileObj.followersCount || data.subscribersCount || 0),
        following: Number(data.following || data.followingCount || profileObj.followingCount || 0),
        posts: Number(data.posts || data.postsCount || profileObj.postsCount || data.publicRepos || data.videoCount || 0),
        description: data.description || profileObj.bio || data.bio || data.biography || '',
        profileUrl: data.profileUrl || profileObj.profileUrl || `https://${cleanPlatform}.com/${cleanUsername}`,
        recentContent,
        rawData: isApifySuccess ? data : null,
        lastFetched: isApifySuccess ? new Date() : new Date(0), // Set to epoch on error so background refresh will retry later
        lastUpdated: new Date(),
        // Apply platform-specific enrichment fields
        ...extractPlatformEnrichment(cleanPlatform, data)
    };

    if (socialProfile) {
        Object.assign(socialProfile, payload);
        await socialProfile.save();
    } else {
        socialProfile = await SocialProfile.create(payload);
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
