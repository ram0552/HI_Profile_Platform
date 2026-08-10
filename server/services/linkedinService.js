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

    const [{ items: profileItems }, { items: postItems }] = await Promise.all([
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

    const basicInfo = profileObj.basicInfo || profileObj;

    const fullName = profileObj.fullName || basicInfo.fullName || `${basicInfo.firstName || profileObj.firstName || ''} ${basicInfo.lastName || profileObj.lastName || ''}`.trim() || username;
    const profilePicture =
        basicInfo.profile_picture_url ||
        basicInfo.profile_picture ||
        basicInfo.profilePicUrl ||
        profileObj.profilePictureUrl ||
        profileObj.profile_picture_url ||
        (typeof profileObj.profilePicture === 'string' ? profileObj.profilePicture : profileObj.profilePicture?.url) ||
        profileObj.displayPictureUrl ||
        profileObj.profilePicUrl ||
        profileObj.avatarUrl ||
        profileObj.pictureUrl ||
        profileObj.photoUrl ||
        profileObj.imageUrl ||
        profileObj.avatar ||
        '';

    const headline = basicInfo.headline || profileObj.headline || '';
    const currentTitle = basicInfo.currentTitle || profileObj.currentTitle || '';
    const currentCompany = basicInfo.currentCompanyName || profileObj.currentCompanyName || profileObj.currentCompany || '';
    const location = basicInfo.locationFull || basicInfo.city || basicInfo.location || profileObj.locationFull || profileObj.city || profileObj.location || '';
    const bio = basicInfo.summary || basicInfo.about || profileObj.summary || profileObj.about || '';

    const followerCountVal =
        basicInfo.follower_count ??
        basicInfo.followers_count ??
        basicInfo.followerCount ??
        basicInfo.followersCount ??
        profileObj.follower_count ??
        profileObj.followers_count ??
        profileObj.followerCount ??
        profileObj.followersCount;

    const connectionCountVal =
        basicInfo.connection_count ??
        basicInfo.connections_count ??
        basicInfo.connectionCount ??
        basicInfo.connectionsCount ??
        basicInfo.connections ??
        profileObj.connection_count ??
        profileObj.connections_count ??
        profileObj.connectionCount ??
        profileObj.connectionsCount ??
        profileObj.connections;

    const followersCount = followerCountVal !== undefined && followerCountVal !== null ? Number(followerCountVal) : 0;
    const connectionsCount = connectionCountVal !== undefined && connectionCountVal !== null ? Number(connectionCountVal) : 0;

    const profileUrl = basicInfo.profileUrl || profileObj.profileUrl || `https://www.linkedin.com/in/${username}`;
    const website = basicInfo.websiteUrl || basicInfo.website || profileObj.websiteUrl || profileObj.website || '';
    const education = Array.isArray(basicInfo.education) ? basicInfo.education : (Array.isArray(profileObj.education) ? profileObj.education : []);
    const certifications = Array.isArray(basicInfo.certifications) ? basicInfo.certifications : (Array.isArray(profileObj.certifications) ? profileObj.certifications : []);

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

    // Map the latest 3 posts with correct field extraction and enriched metadata
    const recentPosts = rawPosts
        .slice(0, 3)
        .map(post => {
            // Detect post type
            let postType = 'text';
            if (post.article) postType = 'article';
            else if (post.document) postType = 'document';
            else if (post.media && Array.isArray(post.media.images) && post.media.images.length > 0) postType = 'image';
            else if (post.media && post.media.type === 'video') postType = 'video';

            // Extract the best preview image from various media types
            let previewImage = '';
            let allMediaImages = [];
            if (post.media) {
                if (Array.isArray(post.media.images) && post.media.images.length > 0) {
                    previewImage = post.media.images[0].url || post.media.url || '';
                    allMediaImages = post.media.images.map(img => img.url || img.src || '').filter(Boolean);
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

            // Extract article metadata
            const articleTitle = post.article?.title || '';
            const articleUrl = post.article?.url || post.article?.link || '';

            // Extract document metadata
            const documentTitle = post.document?.title || '';

            // Extract hashtags from post text
            const postText = post.text || '';
            const hashtagMatches = postText.match(/#[\w\u00C0-\u024F]+/g);
            const hashtags = hashtagMatches ? hashtagMatches.map(h => h.replace('#', '')) : [];

            return {
                text: postText,
                imageUrl: previewImage,
                thumbnailUrl: previewImage,
                allMediaImages: allMediaImages,
                likesCount: post.stats?.total_reactions || post.stats?.likes || 0,
                commentsCount: post.stats?.comments || 0,
                sharesCount: post.stats?.reposts || 0,
                postUrl: post.url || '',
                createdAt: post.posted_at?.date || post.posted_at?.relative || '',
                postType: postType,
                articleTitle: articleTitle || documentTitle,
                articleUrl: articleUrl,
                hashtags: hashtags,
                impressions: post.stats?.impressions || 0
            };
        });

    return {
        success: true,
        platform: 'linkedin',
        username: username,
        displayName: fullName,
        profileImage: profilePicture,
        followers: followersCount,
        following: 0,
        connectionsCount: connectionsCount,
        posts: recentPosts.length,
        description: headline || bio,
        profileUrl: profileUrl,
        profile: {
            fullName,
            profilePicture,
            profileImage: profilePicture,
            headline,
            currentTitle,
            currentCompany,
            location,
            bio,
            followersCount,
            connectionsCount,
            profileUrl,
            website,
            education,
            certifications,
            recentPosts
        }
    };
};

module.exports = { getLinkedInProfile, normalizeLinkedInUsername };
