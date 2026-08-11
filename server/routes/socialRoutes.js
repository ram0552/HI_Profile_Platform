const express = require('express');
const router = express.Router();
const { getOrFetchSocialProfile } = require('../services/socialProfileService');
const { getGitHubProfile } = require('../services/githubService');
const { getInstagramProfile } = require('../services/instagramService');
const { getYouTubeProfile } = require('../services/youtubeService');
const { getTwitterProfile } = require('../services/twitterService');
const { getLinkedInProfile, normalizeLinkedInUsername } = require('../services/linkedinService');
const { getDribbbleProfile } = require('../services/dribbbleService');

// Pending requests map: key -> Promise
const pendingRequests = new Map();

// Helper to handle cached/deduplicated service calls using MongoDB SocialProfile first
const handleCachedRequest = async (platform, username, res, fallbackFn) => {
    const cleanPlatform = (platform || '').toLowerCase().trim();
    const cleanUsername = cleanPlatform === 'linkedin' ? normalizeLinkedInUsername(username) : (username || '').trim().toLowerCase().replace(/^@/, '');
    const dedupeKey = `${cleanPlatform}:${cleanUsername}`;

    // 1. Check pending requests
    if (pendingRequests.has(dedupeKey)) {
        console.log(`[Deduplication] Active promise found for key: "${dedupeKey}". Awaiting...`);
        try {
            const data = await pendingRequests.get(dedupeKey);
            return res.json(data);
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    // 2. Perform MongoDB-first profile lookup / resilient fetch
    const promise = (async () => {
        let socialProfileData = null;

        try {
            // First: query MongoDB SocialProfile store
            const socialProfileDoc = await getOrFetchSocialProfile({
                platform: cleanPlatform,
                username: cleanUsername
            });

            if (socialProfileDoc) {
                const spObj = socialProfileDoc.toObject ? socialProfileDoc.toObject() : socialProfileDoc;
                const basicInfo = spObj.basic_info || spObj.basicInfo || spObj.rawData?.basic_info || spObj.rawData?.basicInfo || {};

                const fullName = basicInfo.fullname || basicInfo.fullName || basicInfo.name || spObj.displayName || spObj.name || cleanUsername;
                const profileImg = basicInfo.profile_picture_url || basicInfo.profile_picture || basicInfo.profilePicUrl || spObj.profileImage || spObj.avatarUrl || spObj.profilePicture || '';
                const headline = basicInfo.headline || spObj.headline || '';
                const bio = basicInfo.about || basicInfo.summary || basicInfo.bio || spObj.description || spObj.bio || '';
                const location = basicInfo.location || basicInfo.locationFull || spObj.location || '';
                const followers = Number(basicInfo.follower_count ?? basicInfo.followers_count ?? basicInfo.followerCount ?? spObj.followers ?? spObj.followersCount ?? 0);
                const connections = Number(basicInfo.connection_count ?? basicInfo.connections_count ?? basicInfo.connectionCount ?? spObj.connectionsCount ?? spObj.following ?? 0);
                const currentCompany = basicInfo.current_company || basicInfo.currentCompanyName || basicInfo.currentCompany || spObj.currentCompany || '';

                socialProfileData = {
                    ...spObj,
                    basic_info: basicInfo,
                    displayName: fullName,
                    profileImage: profileImg,
                    avatarUrl: profileImg,
                    profilePicture: profileImg,
                    headline: headline,
                    location: location,
                    bio: bio,
                    description: bio,
                    followers: followers,
                    followersCount: followers,
                    connectionsCount: connections,
                    currentCompany: currentCompany,
                    followingCount: spObj.following || spObj.followingCount || connections || 0,
                    postsCount: spObj.posts || spObj.postsCount || 0,
                    recentPosts: spObj.recentContent || spObj.recentPosts || [],
                    recentVideos: spObj.recentContent || spObj.recentVideos || [],
                    recentRepos: spObj.recentContent || spObj.recentRepos || []
                };
            }
        } catch (mongoServiceErr) {
            console.warn(`[Social Route Warning] getOrFetchSocialProfile failed for ${cleanPlatform}:${cleanUsername} (${mongoServiceErr.message}). Calling fallback service...`);
        }

        if (!socialProfileData && fallbackFn) {
            socialProfileData = await fallbackFn();
        }

        const responseData = { success: true, profile: socialProfileData || {} };
        return responseData;
    })();

    pendingRequests.set(dedupeKey, promise);

    try {
        const responseData = await promise;
        return res.json(responseData);
    } catch (error) {
        console.error(`[Social Route Error] ${dedupeKey}:`, error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to retrieve social profile data'
        });
    } finally {
        pendingRequests.delete(dedupeKey);
    }
};

// Generic proxy endpoint to prevent Cross-Origin Resource Policy (CORP) same-origin blocking
router.get('/proxy', async (req, res) => {
    const { url } = req.query;
    if (!url) {
        return res.status(400).send('URL is required');
    }
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
            }
        });
        if (!response.ok) {
            console.warn(`[Social Proxy Warning] Status ${response.status} fetching URL: ${url}`);
            return res.status(response.status).send('Failed to fetch image');
        }
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        res.send(buffer);
    } catch (error) {
        console.error('Error proxying image:', error);
        res.status(500).send('Error proxying image');
    }
});

// GitHub profile endpoint
router.get('/github/:username', async (req, res) => {
    const username = (req.params.username || '').trim().toLowerCase();
    if (!username) {
        return res.status(400).json({ success: false, error: 'Username is required' });
    }
    await handleCachedRequest('github', username, res, () => getGitHubProfile(username));
});

// YouTube profile endpoint
router.get('/youtube/:username', async (req, res) => {
    const username = (req.params.username || '').trim();
    if (!username) {
        return res.status(400).json({ success: false, error: 'Username/Handle is required' });
    }
    await handleCachedRequest('youtube', username, res, () => getYouTubeProfile(username));
});

// Twitter profile endpoint
router.get('/twitter/:username', async (req, res) => {
    const username = (req.params.username || '').trim().toLowerCase();
    if (!username) {
        return res.status(400).json({ success: false, error: 'Username is required' });
    }
    await handleCachedRequest('twitter', username, res, () => getTwitterProfile(username));
});

// LinkedIn profile endpoint
router.get('/linkedin/:username', async (req, res) => {
    const usernameParam = decodeURIComponent(req.params.username || '').trim();
    const username = normalizeLinkedInUsername(usernameParam);
    if (!username) {
        return res.status(400).json({ success: false, error: 'LinkedIn profile identifier/URL is required' });
    }
    await handleCachedRequest('linkedin', username, res, () => getLinkedInProfile(username));
});

// Dribbble profile endpoint
router.get('/dribbble/:username', async (req, res) => {
    const username = (req.params.username || '').trim().toLowerCase();
    if (!username) {
        return res.status(400).json({ success: false, error: 'Username is required' });
    }
    await handleCachedRequest('dribbble', username, res, () => getDribbbleProfile(username));
});

// Instagram profile endpoint
router.get('/instagram/:username', async (req, res) => {
    const username = (req.params.username || '').trim().toLowerCase();
    if (!username) {
        return res.status(400).json({ success: false, error: 'Username is required' });
    }
    await handleCachedRequest('instagram', username, res, () => getInstagramProfile(username));
});

module.exports = router;
