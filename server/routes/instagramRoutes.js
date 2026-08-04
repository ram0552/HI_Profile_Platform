const express = require('express');
const router = express.Router();
const { ApifyClient } = require('apify-client');

// Cache storage map: key -> { data, expiresAt }
const cache = new Map();

// Pending requests map: username -> Promise
const pendingRequests = new Map();

// Helper to fetch and log Apify Actor details safely
const fetchInstagramFromApify = async (username, client) => {
    const actorId = "apify/instagram-profile-scraper";
    console.log(`[Apify] Scraper username: "${username}"`);
    console.log(`[Apify] Actor ID: "${actorId}"`);
    
    // Trigger the run
    const run = await client.actor(actorId).call({
        usernames: [username],
    });
    
    console.log(`[Apify] Actor Run ID: "${run.id}"`);
    console.log(`[Apify] Actor Run Status: "${run.status}"`);
    console.log(`[Apify] Dataset ID: "${run.defaultDatasetId}"`);
    
    // Get dataset items
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    console.log(`[Apify] Dataset item count: ${items.length}`);
    
    if (!items || items.length === 0) {
        throw new Error('No Instagram profile data returned from Apify');
    }
    
    const item = items[0];
    console.log(`[Apify] Keys available in dataset profile object:`, Object.keys(item));
    
    return item;
};

// Proxy endpoint to load Instagram images bypassing CORP same-origin restrictions
router.get('/proxy', async (req, res) => {
    const { url } = req.query;
    if (!url) {
        return res.status(400).send('URL is required');
    }
    try {
        const response = await fetch(url);
        if (!response.ok) {
            return res.status(response.status).send('Failed to fetch image from Instagram');
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

router.get('/profile/:username', async (req, res) => {
    const rawUsername = req.params.username || '';
    const username = rawUsername.trim().toLowerCase();

    if (!username) {
        return res.status(400).json({ success: false, error: 'Username is required' });
    }

    const cacheKey = `instagram:${username}`;
    const now = Date.now();

    // 1. Check Cache (30 Minutes expiration)
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

    // 2. Check for simultaneous active requests to reuse existing promise
    if (pendingRequests.has(username)) {
        console.log(`[Deduplication] Active promise found for username: "${username}". Awaiting existing run...`);
        try {
            const data = await pendingRequests.get(username);
            return res.json(data);
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    // 3. Initiate client
    const client = new ApifyClient({
        token: process.env.APIFY_API_KEY,
    });

    // Create the Promise
    const promise = (async () => {
        const item = await fetchInstagramFromApify(username, client);

        const host = req.headers.host;
        const baseProxyUrl = `${req.protocol}://${host}/api/instagram/proxy?url=`;

        const rawProfilePic = item.profilePicUrl || item.profilePicUrlHD || item.profilePicUrlHR || item.profile_pic_url || '';

        // Normalize response output strictly according to user spec
        const responseData = {
            success: true,
            profile: {
                username: item.username,
                fullName: item.fullName || item.full_name || item.username,
                biography: item.biography || item.bio || '',
                profilePicture: rawProfilePic ? `${baseProxyUrl}${encodeURIComponent(rawProfilePic)}` : '',
                followersCount: item.followersCount || item.followers_count || 0,
                followingCount: item.followsCount || item.followingCount || item.following_count || 0,
                postsCount: item.postsCount || item.posts_count || 0,
                recentPosts: (item.latestPosts || item.posts || []).slice(0, 3).map(post => {
                    const rawImg = post.displayUrl || post.display_url || post.imageUrl || post.thumbnailUrl || '';
                    return {
                        id: post.id || post.shortCode || post.shortcode,
                        imageUrl: rawImg ? `${baseProxyUrl}${encodeURIComponent(rawImg)}` : '',
                        caption: post.caption || '',
                        postUrl: post.url || (post.shortCode || post.shortcode ? `https://www.instagram.com/p/${post.shortCode || post.shortcode}/` : ''),
                        likesCount: post.likesCount || post.likes_count || 0,
                        commentsCount: post.commentsCount || post.comments_count || 0
                    };
                })
            }
        };

        // Cache successful response (30 Minutes)
        cache.set(cacheKey, {
            data: responseData,
            expiresAt: Date.now() + 30 * 60 * 1000
        });

        return responseData;
    })();

    // Track the promise
    pendingRequests.set(username, promise);

    try {
        const responseData = await promise;
        return res.json(responseData);
    } catch (error) {
        console.error('Instagram Scraper Error:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'Failed to retrieve Instagram profile data', 
            details: error.message 
        });
    } finally {
        // Delete pending promise regardless of success or failure
        pendingRequests.delete(username);
    }
});

module.exports = router;
