const { ApifyClient } = require('apify-client');

const normalizeLinkedInUsername = (input) => {
    let username = input.trim();
    if (!username) return '';
    
    // If it is a full URL
    if (username.startsWith('http://') || username.startsWith('https://')) {
        try {
            const url = new URL(username);
            const pathParts = url.pathname.split('/').filter(Boolean);
            // e.g. /in/satyanadella/
            if (pathParts.includes('in')) {
                const inIndex = pathParts.indexOf('in');
                if (pathParts[inIndex + 1]) {
                    username = pathParts[inIndex + 1];
                }
            } else if (pathParts.length > 0) {
                username = pathParts[pathParts.length - 1];
            }
        } catch (e) {
            const match = username.match(/\/in\/([^\/]+)/);
            if (match) {
                username = match[1];
            }
        }
    } else {
        // If it has linkedin.com/in/
        if (username.includes('linkedin.com/in/')) {
            const parts = username.split('linkedin.com/in/');
            username = parts[1] || username;
        }
        // Strip trailing slash
        username = username.split('/')[0];
    }
    
    // Strip query params and hash
    username = username.split('?')[0].split('#')[0].trim();
    return username;
};

const getLinkedInProfile = async (rawUsername) => {
    const username = normalizeLinkedInUsername(rawUsername);
    if (!username) {
        throw new Error('LinkedIn profile identifier/URL is required');
    }

    const client = new ApifyClient({
        token: process.env.APIFY_API_KEY,
    });

    console.log(`[Apify LinkedIn Scraper] Starting runs for: "${username}"`);

    // Call Apify actors for profile and posts in parallel
    const [profileRun, postsRun] = await Promise.all([
        client.actor("linkedintel-core/linkedin-profile-scraper-no-cookies").call({
            profileUrls: [`https://www.linkedin.com/in/${username}`]
        }),
        client.actor("apimaestro/linkedin-profile-posts").call({
            username: username,
            page_number: 1,
            limit: 10
        })
    ]);

    console.log(`[Apify LinkedIn Scraper] Runs inited. Profile Run ID: "${profileRun.id}", Posts Run ID: "${postsRun.id}"`);

    const [ { items: profileItems }, { items: postItems } ] = await Promise.all([
        client.dataset(profileRun.defaultDatasetId).listItems(),
        client.dataset(postsRun.defaultDatasetId).listItems()
    ]);

    console.log(`[Apify LinkedIn Scraper] Datasets loaded. Profiles found: ${profileItems.length}, Posts dataset items: ${postItems.length}`);

    if (!profileItems || profileItems.length === 0) {
        throw new Error('LinkedIn profile not found or public access restricted');
    }

    const profileObj = profileItems[0];
    if (profileObj.error || profileObj.ok === false) {
        throw new Error(profileObj.error || 'Failed to retrieve LinkedIn profile data');
    }

    const fullName = profileObj.fullName || `${profileObj.firstName || ''} ${profileObj.lastName || ''}`.trim() || username;
    const profilePicture = profileObj.profilePictureUrl || '';
    const headline = profileObj.headline || '';
    const currentTitle = profileObj.currentTitle || '';
    const currentCompany = profileObj.currentCompanyName || '';
    const location = profileObj.locationFull || profileObj.city || '';
    const bio = profileObj.summary || '';
    const followersCount = profileObj.followerCount || 0;
    const connectionsCount = profileObj.connectionsCount || 0;
    const profileUrl = profileObj.profileUrl || `https://www.linkedin.com/in/${username}`;

    // Extract real posts from the actor response
    // The dataset contains individual post items directly, e.g. [post1, post2, ...]
    let rawPosts = [];
    if (postItems && postItems.length > 0) {
        // Filter out any invalid items
        rawPosts = postItems.filter(item => item && (item.urn || item.url || item.text));
        console.log(`[Apify LinkedIn Posts] Found ${rawPosts.length} posts from dataset`);
    } else {
        console.log(`[Apify LinkedIn Posts] Posts dataset is empty`);
    }

    // Sort by posted_at.timestamp descending (newest first), if timestamps exist
    rawPosts.sort((a, b) => {
        const tsA = a.posted_at?.timestamp || 0;
        const tsB = b.posted_at?.timestamp || 0;
        return tsB - tsA;
    });

    // Map the latest 3 posts with correct field extraction
    const recentPosts = rawPosts
        .slice(0, 3)
        .map(post => {
            // Extract the best preview image from various media types
            let previewImage = '';
            if (post.media) {
                if (Array.isArray(post.media.images) && post.media.images.length > 0) {
                    previewImage = post.media.images[0].url || post.media.url || '';
                } else {
                    previewImage = post.media.thumbnail || post.media.url || '';
                }
            }
            if (!previewImage && post.article?.thumbnail) {
                previewImage = post.article.thumbnail;
            }
            if (!previewImage && post.document?.thumbnail) {
                previewImage = post.document.thumbnail;
            }

            return {
                text: post.text || '',
                imageUrl: previewImage,
                likesCount: post.stats?.total_reactions || 0,
                commentsCount: post.stats?.comments || 0,
                sharesCount: post.stats?.reposts || 0,
                postUrl: post.url || '',
                createdAt: post.posted_at?.date || post.posted_at?.relative || ''
            };
        });

    return {
        success: true,
        username: username,
        profile: {
            fullName,
            profilePicture,
            headline,
            currentTitle,
            currentCompany,
            location,
            bio,
            followersCount,
            connectionsCount,
            profileUrl,
            recentPosts
        }
    };
};

module.exports = { getLinkedInProfile, normalizeLinkedInUsername };
