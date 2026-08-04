const { ApifyClient } = require('apify-client');

const normalizeTwitterUsername = (input) => {
    let username = input.trim();
    if (!username) return '';
    
    // Parse URL if it starts with http/https
    if (username.startsWith('http://') || username.startsWith('https://')) {
        try {
            const url = new URL(username);
            const pathParts = url.pathname.split('/').filter(Boolean);
            if (pathParts.length > 0) {
                username = pathParts[0];
            }
        } catch (e) {
            const parts = username.split('/');
            username = parts[parts.length - 1] || username;
        }
    } else {
        if (username.includes('twitter.com/') || username.includes('x.com/')) {
            const parts = username.split('/');
            username = parts[parts.length - 1] || username;
        }
    }
    
    // Remove leading @ if present
    if (username.startsWith('@')) {
        username = username.slice(1);
    }
    
    // Strip query parameters
    username = username.split('?')[0].split('#')[0].trim();
    
    return username;
};

const getTwitterProfile = async (rawUsername) => {
    const username = normalizeTwitterUsername(rawUsername);
    if (!username) {
        throw new Error('Twitter/X username identifier is required');
    }

    const client = new ApifyClient({
        token: process.env.APIFY_API_KEY,
    });

    console.log(`[Apify Twitter Scraper] Starting runs for: "${username}"`);

    // Call Apify actor automation-lab/twitter-scraper for profiles and user-tweets in parallel
    const [profilesRun, tweetsRun] = await Promise.all([
        client.actor("automation-lab/twitter-scraper").call({
            mode: "profiles",
            usernames: [username]
        }),
        client.actor("automation-lab/twitter-scraper").call({
            mode: "user-tweets",
            usernames: [username],
            maxResults: 3
        })
    ]);

    console.log(`[Apify Twitter Scraper] Runs inited. Profiles Run ID: "${profilesRun.id}", Tweets Run ID: "${tweetsRun.id}"`);

    const [ { items: profileItems }, { items: tweetItems } ] = await Promise.all([
        client.dataset(profilesRun.defaultDatasetId).listItems(),
        client.dataset(tweetsRun.defaultDatasetId).listItems()
    ]);

    console.log(`[Apify Twitter Scraper] Datasets loaded. Profiles found: ${profileItems.length}, Tweets found: ${tweetItems.length}`);

    if (!profileItems || profileItems.length === 0) {
        throw new Error('Twitter/X account not found or public access restricted');
    }

    const profileObj = profileItems[0];
    if (profileObj.error || profileObj.ok === false) {
        throw new Error(profileObj.error || 'Failed to retrieve Twitter/X profile data');
    }

    const displayName = profileObj.name || profileObj.username || username;
    const profilePicture = profileObj.profilePicture || '';
    const bio = profileObj.bio || '';
    const followersCount = profileObj.followers || 0;
    const followingCount = profileObj.following || 0;
    const postCount = profileObj.tweetsCount || 0;

    // Filter and map the latest 3 tweets
    const tweets = (tweetItems || [])
        .slice(0, 3)
        .map(tweet => {
            let mediaUrl = '';
            if (Array.isArray(tweet.mediaUrls) && tweet.mediaUrls.length > 0) {
                mediaUrl = tweet.mediaUrls[0];
            }
            return {
                id: tweet.id,
                text: tweet.text || '',
                imageUrl: mediaUrl,
                likesCount: tweet.likeCount || 0,
                repliesCount: tweet.replyCount || 0,
                retweetsCount: tweet.retweetCount || 0,
                postUrl: tweet.url || `https://x.com/${username}/status/${tweet.id}`,
                createdAt: tweet.createdAt || ''
            };
        });

    return {
        success: true,
        username: username,
        displayName: displayName,
        bio: bio,
        profilePicture: profilePicture,
        followersCount: followersCount,
        followingCount: followingCount,
        postCount: postCount,
        recentPosts: tweets
    };
};

module.exports = { getTwitterProfile };
