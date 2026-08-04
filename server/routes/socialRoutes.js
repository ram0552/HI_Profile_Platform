const express = require('express');
const router = express.Router();
const { getGitHubProfile } = require('../services/githubService');
const { getYouTubeProfile } = require('../services/youtubeService');
const { getTwitterProfile } = require('../services/twitterService');
const { getLinkedInProfile, normalizeLinkedInUsername } = require('../services/linkedinService');
const { getDribbbleProfile } = require('../services/dribbbleService');

// Caching storage map: key -> { data, expiresAt }
const cache = new Map();

// Pending requests map: key -> Promise
const pendingRequests = new Map();

// Helper to handle cached/deduplicated service calls
const handleCachedRequest = async (cacheKey, dedupeKey, fetchFn, res) => {
    const now = Date.now();
    
    // 1. Check cache
    if (cache.has(cacheKey)) {
        const cached = cache.get(cacheKey);
        if (now < cached.expiresAt) {
            console.log(`[Cache] HIT for key: "${cacheKey}"`);
            return res.json(cached.data);
        } else {
            console.log(`[Cache] EXPIRED for key: "${cacheKey}". Cleaning up...`);
            cache.delete(cacheKey);
        }
    }
    
    // 2. Check pending requests
    if (pendingRequests.has(dedupeKey)) {
        console.log(`[Deduplication] Active promise found for key: "${dedupeKey}". Awaiting...`);
        try {
            const data = await pendingRequests.get(dedupeKey);
            return res.json(data);
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }
    
    // 3. Perform fetch
    const promise = (async () => {
        const data = await fetchFn();
        const responseData = { success: true, ...data };
        
        // Cache result for 30 minutes
        cache.set(cacheKey, {
            data: responseData,
            expiresAt: Date.now() + 30 * 60 * 1000
        });
        
        return responseData;
    })();
    
    pendingRequests.set(dedupeKey, promise);
    
    try {
        const responseData = await promise;
        return res.json(responseData);
    } catch (error) {
        console.error(`[Social Route Error] key: "${dedupeKey}":`, error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to retrieve social data'
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
        const response = await fetch(url);
        if (!response.ok) {
            return res.status(response.status).send('Failed to fetch image');
        }
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        res.setHeader('Content-Type', contentType);
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
    
    const cacheKey = `github:${username}`;
    const dedupeKey = `github:${username}`;
    
    await handleCachedRequest(cacheKey, dedupeKey, async () => {
        const profile = await getGitHubProfile(username);
        const host = req.headers.host;
        const baseProxyUrl = `${req.protocol}://${host}/api/social/proxy?url=`;
        
        // Proxy avatar url
        if (profile.avatarUrl) {
            profile.avatarUrl = `${baseProxyUrl}${encodeURIComponent(profile.avatarUrl)}`;
        }
        return { profile };
    }, res);
});

// YouTube profile endpoint
router.get('/youtube/:username', async (req, res) => {
    const username = (req.params.username || '').trim();
    if (!username) {
        return res.status(400).json({ success: false, error: 'Username/Handle is required' });
    }
    
    const cacheKey = `youtube:${username.toLowerCase()}`;
    const dedupeKey = `youtube:${username}`;
    
    await handleCachedRequest(cacheKey, dedupeKey, async () => {
        const profile = await getYouTubeProfile(username);
        const host = req.headers.host;
        const baseProxyUrl = `${req.protocol}://${host}/api/social/proxy?url=`;
        
        // Proxy profile pic
        if (profile.profilePicture) {
            profile.profilePicture = `${baseProxyUrl}${encodeURIComponent(profile.profilePicture)}`;
        }
        
        // Proxy video thumbnails
        if (profile.recentVideos) {
            profile.recentVideos = profile.recentVideos.map(video => {
                if (video.thumbnailUrl) {
                    video.thumbnailUrl = `${baseProxyUrl}${encodeURIComponent(video.thumbnailUrl)}`;
                }
                return video;
            });
        }
        
        return { profile };
    }, res);
});

// Twitter profile endpoint
router.get('/twitter/:username', async (req, res) => {
    const username = (req.params.username || '').trim().toLowerCase();
    if (!username) {
        return res.status(400).json({ success: false, error: 'Username is required' });
    }
    
    const cacheKey = `twitter:${username}`;
    const dedupeKey = `twitter:${username}`;
    
    // 1. Check cache
    const now = Date.now();
    if (cache.has(cacheKey)) {
        const cached = cache.get(cacheKey);
        if (now < cached.expiresAt) {
            console.log(`[Cache] HIT for key: "${cacheKey}"`);
            return res.json(cached.data);
        } else {
            console.log(`[Cache] EXPIRED for key: "${cacheKey}". Cleaning up...`);
            cache.delete(cacheKey);
        }
    }
    
    // 2. Check pending requests
    if (pendingRequests.has(dedupeKey)) {
        console.log(`[Deduplication] Active promise found for key: "${dedupeKey}". Awaiting...`);
        try {
            const data = await pendingRequests.get(dedupeKey);
            return res.json(data);
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }
    
    // 3. Create the promise
    const promise = (async () => {
        const profile = await getTwitterProfile(username);
        const host = req.headers.host;
        const baseProxyUrl = `${req.protocol}://${host}/api/social/proxy?url=`;
        
        // Proxy profile pic if available
        if (profile.profilePicture) {
            profile.profilePicture = `${baseProxyUrl}${encodeURIComponent(profile.profilePicture)}`;
        }
        
        // Proxy recent tweets media previews if available
        if (profile.recentPosts) {
            profile.recentPosts = profile.recentPosts.map(post => {
                if (post.imageUrl) {
                    post.imageUrl = `${baseProxyUrl}${encodeURIComponent(post.imageUrl)}`;
                }
                return post;
            });
        }
        
        let responseData;
        if (profile.success === false) {
            responseData = profile;
        } else {
            responseData = { success: true, profile };
        }
        
        // Cache for 30 minutes
        cache.set(cacheKey, { data: responseData, expiresAt: Date.now() + 30 * 60 * 1000 });
        return responseData;
    })();
    
    pendingRequests.set(dedupeKey, promise);
    
    try {
        const responseData = await promise;
        return res.json(responseData);
    } catch (error) {
        console.error(`[Social Route Error] twitter/${username}:`, error);
        return res.status(500).json({ success: false, error: error.message });
    } finally {
        pendingRequests.delete(dedupeKey);
    }
});

// LinkedIn profile endpoint
router.get('/linkedin/:username', async (req, res) => {
    const usernameParam = decodeURIComponent(req.params.username || '').trim();
    const username = normalizeLinkedInUsername(usernameParam);
    if (!username) {
        return res.status(400).json({ success: false, error: 'LinkedIn profile identifier/URL is required' });
    }
    
    const cacheKey = `linkedin:${username.toLowerCase()}`;
    const dedupeKey = `linkedin:${username}`;
    
    await handleCachedRequest(cacheKey, dedupeKey, async () => {
        const result = await getLinkedInProfile(username);
        const host = req.headers.host;
        const baseProxyUrl = `${req.protocol}://${host}/api/social/proxy?url=`;
        
        // Proxy profile pic if available
        if (result.profile && result.profile.profilePicture) {
            result.profile.profilePicture = `${baseProxyUrl}${encodeURIComponent(result.profile.profilePicture)}`;
        }
        
        // Proxy recent posts media previews if available
        if (result.profile && result.profile.recentPosts) {
            result.profile.recentPosts = result.profile.recentPosts.map(post => {
                if (post.imageUrl) {
                    post.imageUrl = `${baseProxyUrl}${encodeURIComponent(post.imageUrl)}`;
                }
                return post;
            });
        }
        
        return result;
    }, res);
});

// Dribbble profile endpoint
router.get('/dribbble/:username', async (req, res) => {
    const username = (req.params.username || '').trim().toLowerCase();
    if (!username) {
        return res.status(400).json({ success: false, error: 'Username is required' });
    }
    
    const cacheKey = `dribbble:${username}`;
    const dedupeKey = `dribbble:${username}`;
    
    await handleCachedRequest(cacheKey, dedupeKey, async () => {
        const profile = await getDribbbleProfile(username);
        const host = req.headers.host;
        const baseProxyUrl = `${req.protocol}://${host}/api/social/proxy?url=`;
        
        // Proxy avatar
        if (profile.profilePicture) {
            profile.profilePicture = `${baseProxyUrl}${encodeURIComponent(profile.profilePicture)}`;
        }
        
        // Proxy shots
        if (profile.recentShots) {
            profile.recentShots = profile.recentShots.map(shot => {
                if (shot.imageUrl) {
                    shot.imageUrl = `${baseProxyUrl}${encodeURIComponent(shot.imageUrl)}`;
                }
                return shot;
            });
        }
        
        return { profile };
    }, res);
});

module.exports = router;
