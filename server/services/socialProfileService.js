const SocialProfile = require('../models/SocialProfile');
const { getGitHubProfile } = require('./githubService');
const { getInstagramProfile } = require('./instagramService');
const { getYouTubeProfile } = require('./youtubeService');
const { getTwitterProfile } = require('./twitterService');
const { getLinkedInProfile } = require('./linkedinService');

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 Hours Cache Expiration

/**
 * Extract standardized recentContent array from platform scraper data
 */
const extractNormalizedRecentContent = (platform, data = {}) => {
    const cleanPlatform = (platform || '').toLowerCase().trim();

    if (cleanPlatform === 'instagram') {
        const posts = data.recentPosts || data.posts || [];
        return posts.map(p => ({
            id: String(p.id || ''),
            caption: p.caption || '',
            imageUrl: p.imageUrl || p.displayUrl || p.thumbnailUrl || '',
            contentUrl: p.postUrl || p.url || '',
            likesCount: Number(p.likesCount || p.likes_count || 0),
            commentsCount: Number(p.commentsCount || p.comments_count || 0)
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
            contentUrl: p.postUrl || p.url || '',
            likesCount: Number(p.likesCount || 0),
            commentsCount: Number(p.commentsCount || 0),
            sharesCount: Number(p.sharesCount || 0),
            publishedAt: p.createdAt || ''
        }));
    }

    if (cleanPlatform === 'youtube') {
        const videos = data.recentVideos || data.videos || [];
        return videos.map(v => ({
            title: v.title || '',
            imageUrl: v.thumbnailUrl || '',
            contentUrl: v.url || '',
            viewsCount: Number(v.viewCount || 0),
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
 * Background async refresh of SocialProfile document
 */
const refreshSocialProfileAsync = async (socialProfileId) => {
    try {
        const socialProfile = await SocialProfile.findById(socialProfileId);
        if (!socialProfile) return;

        console.log(`[Background Refresh] Fetching fresh Apify data for ${socialProfile.platform}:${socialProfile.username}...`);
        const data = await fetchPlatformData(socialProfile.platform, socialProfile.username);

        const profileObj = data.profile || data;

        socialProfile.displayName = data.displayName || profileObj.fullName || data.fullName || data.name || socialProfile.username;
        socialProfile.profileImage = data.profileImage || profileObj.profilePicture || data.profilePicture || data.avatarUrl || '';
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

    // 3. Cache Miss or Force Refresh -> Fetch from Apify
    console.log(`[MongoDB Social Cache] MISS for ${cleanPlatform}:${cleanUsername}. Calling Apify service...`);
    const data = await fetchPlatformData(cleanPlatform, cleanUsername);
    const profileObj = data.profile || data;

    const recentContent = extractNormalizedRecentContent(cleanPlatform, data);

    const payload = {
        userId,
        profileBlockId,
        platform: cleanPlatform,
        username: cleanUsername,
        displayName: data.displayName || profileObj.fullName || data.fullName || data.name || cleanUsername,
        profileImage: data.profileImage || profileObj.profilePicture || data.profilePicture || data.avatarUrl || '',
        headline: profileObj.headline || data.headline || '',
        location: profileObj.location || data.location || '',
        verified: Boolean(data.verified || profileObj.verified),
        followers: Number(data.followers || data.followersCount || profileObj.followersCount || data.subscribersCount || 0),
        following: Number(data.following || data.followingCount || profileObj.followingCount || 0),
        posts: Number(data.posts || data.postsCount || profileObj.postsCount || data.publicRepos || data.videoCount || 0),
        description: data.description || profileObj.bio || data.bio || data.biography || '',
        profileUrl: data.profileUrl || profileObj.profileUrl || `https://${cleanPlatform}.com/${cleanUsername}`,
        recentContent,
        rawData: data,
        lastFetched: new Date(),
        lastUpdated: new Date()
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
