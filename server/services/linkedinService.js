const { ApifyClient } = require('apify-client');

const normalizeLinkedInUsername = (input) => {
    let username = (input || '').trim();
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

    let profileItems = [];
    let postItems = [];

    // 1. Primary Profile Detail Actor: apimaestro/linkedin-profile-detail
    try {
        console.log(`[Apify LinkedIn Scraper] Calling primary actor "apimaestro/linkedin-profile-detail" for: "${username}"`);
        const profileRun = await client.actor("apimaestro/linkedin-profile-detail").call({
            username: username,
            profileUrl: `https://www.linkedin.com/in/${username}`
        });
        const dataset = await client.dataset(profileRun.defaultDatasetId).listItems();
        profileItems = dataset.items || [];
        console.log(`[Apify LinkedIn Scraper] apimaestro/linkedin-profile-detail returned ${profileItems.length} items.`);
    } catch (err) {
        console.warn(`[Apify LinkedIn Scraper] apimaestro/linkedin-profile-detail warning (${err.message}). Trying fallback linkedintel-core...`);
        try {
            const fallbackRun = await client.actor("linkedintel-core/linkedin-profile-scraper-no-cookies").call({
                profileUrls: [`https://www.linkedin.com/in/${username}`]
            });
            const fallbackDataset = await client.dataset(fallbackRun.defaultDatasetId).listItems();
            profileItems = fallbackDataset.items || [];
        } catch (fallbackErr) {
            console.error(`[Apify LinkedIn Scraper] Fallback profile actor error: ${fallbackErr.message}`);
        }
    }

    // 2. Fetch Posts Data (Secondary / Non-blocking)
    try {
        const postsRun = await client.actor("apimaestro/linkedin-profile-posts").call({
            username: username,
            page_number: 1,
            limit: 10
        });
        const postsDataset = await client.dataset(postsRun.defaultDatasetId).listItems();
        postItems = postsDataset.items || [];
    } catch (postsErr) {
        console.warn(`[Apify LinkedIn Scraper] Posts actor warning (${postsErr.message}). Continuing with profile detail.`);
    }

    console.log(`[Apify LinkedIn Scraper] Datasets loaded. Profiles found: ${profileItems.length}, Posts dataset items: ${postItems.length}`);

    if (!profileItems || profileItems.length === 0) {
        throw new Error('LinkedIn profile not found or public access restricted');
    }

    const profileObj = profileItems[0];
    if (profileObj.error || profileObj.ok === false) {
        throw new Error(profileObj.error || 'Failed to retrieve LinkedIn profile data');
    }

    const basicInfo = profileObj.basicInfo || profileObj;

    const fullName =
        profileObj.fullName ||
        basicInfo.fullName ||
        profileObj.name ||
        `${basicInfo.firstName || profileObj.firstName || ''} ${basicInfo.lastName || profileObj.lastName || ''}`.trim() ||
        username;

    const profilePicture =
        basicInfo.profile_picture_url ||
        basicInfo.profile_picture ||
        basicInfo.profilePicUrl ||
        profileObj.profilePictureUrl ||
        profileObj.profile_picture_url ||
        profileObj.profilePicture ||
        (typeof profileObj.profilePicture === 'string' ? profileObj.profilePicture : profileObj.profilePicture?.url) ||
        profileObj.displayPictureUrl ||
        profileObj.profilePicUrl ||
        profileObj.avatarUrl ||
        profileObj.pictureUrl ||
        profileObj.photoUrl ||
        profileObj.imageUrl ||
        profileObj.avatar ||
        '';

    const headline = basicInfo.headline || profileObj.headline || profileObj.occupation || profileObj.title || '';
    const currentTitle = basicInfo.currentTitle || profileObj.currentTitle || profileObj.position || profileObj.jobTitle || '';
    const currentCompany = basicInfo.currentCompanyName || profileObj.currentCompanyName || profileObj.currentCompany || profileObj.company || '';
    const location = basicInfo.locationFull || basicInfo.city || basicInfo.location || profileObj.locationFull || profileObj.city || profileObj.location || '';
    const bio = basicInfo.summary || basicInfo.about || profileObj.summary || profileObj.about || profileObj.bio || '';

    const followerCountVal =
        basicInfo.follower_count ??
        basicInfo.followers_count ??
        basicInfo.followerCount ??
        basicInfo.followersCount ??
        profileObj.follower_count ??
        profileObj.followers_count ??
        profileObj.followerCount ??
        profileObj.followersCount ??
        profileObj.followers;

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

    const profileUrl = basicInfo.profileUrl || profileObj.profileUrl || profileObj.url || `https://www.linkedin.com/in/${username}`;
    const website = basicInfo.websiteUrl || basicInfo.website || profileObj.websiteUrl || profileObj.website || '';
    const education = Array.isArray(basicInfo.education) ? basicInfo.education : (Array.isArray(profileObj.education) ? profileObj.education : []);
    const certifications = Array.isArray(basicInfo.certifications) ? basicInfo.certifications : (Array.isArray(profileObj.certifications) ? profileObj.certifications : []);

    // Map recent posts
    let rawPosts = [];
    if (postItems && postItems.length > 0) {
        rawPosts = postItems.filter(item => item && (item.urn || item.url || item.text));
    }

    rawPosts.sort((a, b) => {
        const tsA = a.posted_at?.timestamp || 0;
        const tsB = b.posted_at?.timestamp || 0;
        return tsB - tsA;
    });

    const recentPosts = rawPosts.slice(0, 3).map(post => {
        let postType = 'text';
        if (post.article) postType = 'article';
        else if (post.document) postType = 'document';
        else if (post.media && Array.isArray(post.media.images) && post.media.images.length > 0) postType = 'image';
        else if (post.media && post.media.type === 'video') postType = 'video';

        let previewImage = '';
        if (post.media) {
            if (Array.isArray(post.media.images) && post.media.images.length > 0) {
                previewImage = post.media.images[0].url || post.media.url || '';
            } else {
                previewImage = post.media.thumbnail || post.media.url || '';
            }
        }
        if (!previewImage && post.article?.thumbnail) previewImage = post.article.thumbnail;
        if (!previewImage && post.document?.thumbnail) previewImage = post.document.thumbnail;

        return {
            text: post.text || '',
            imageUrl: previewImage,
            thumbnailUrl: previewImage,
            likesCount: post.stats?.total_reactions || post.stats?.likes || 0,
            commentsCount: post.stats?.comments || 0,
            sharesCount: post.stats?.reposts || 0,
            postUrl: post.url || '',
            createdAt: post.posted_at?.date || post.posted_at?.relative || '',
            postType: postType
        };
    });

    return {
        success: true,
        platform: 'linkedin',
        username: username,
        displayName: fullName,
        fullName: fullName,
        profileImage: profilePicture,
        profilePicture: profilePicture,
        avatarUrl: profilePicture,
        headline: headline,
        currentTitle: currentTitle,
        currentCompany: currentCompany,
        location: location,
        description: bio,
        bio: bio,
        followers: followersCount,
        followersCount: followersCount,
        following: connectionsCount,
        connectionsCount: connectionsCount,
        posts: recentPosts.length,
        profileUrl: profileUrl,
        website: website,
        education: education,
        certifications: certifications,
        recentPosts: recentPosts,
        recentContent: recentPosts,
        rawData: profileObj,
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
