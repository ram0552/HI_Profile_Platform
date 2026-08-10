const { ApifyClient } = require('apify-client');

/**
 * Fetch Instagram Profile and Recent Posts via Apify Actor
 * @param {string} username - Instagram username or handle
 * @returns {Promise<Object>} Normalized Instagram profile data
 */
const getInstagramProfile = async (username) => {
    const normalizedUsername = (username || '').trim().toLowerCase().replace(/^@/, '');
    if (!normalizedUsername) {
        throw new Error('Instagram username is required');
    }

    const apiKey = process.env.APIFY_API_KEY;
    if (!apiKey) {
        throw new Error('APIFY_API_KEY environment variable is not configured');
    }

    const client = new ApifyClient({ token: apiKey });
    const actorId = "apify/instagram-profile-scraper";

    console.log(`[Apify Instagram Scraper] Starting run for: "${normalizedUsername}"`);

    // Call Apify actor
    const run = await client.actor(actorId).call({
        usernames: [normalizedUsername]
    });

    console.log(`[Apify Instagram Scraper] Run ID: "${run.id}", Status: "${run.status}"`);

    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    if (!items || items.length === 0) {
        throw new Error(`Instagram profile for "${normalizedUsername}" not found or restricted`);
    }

    const item = items[0];
    const rawProfilePic = item.profilePicUrl || item.profilePicUrlHD || item.profilePicUrlHR || item.profile_pic_url || '';

    const recentPosts = (item.latestPosts || item.posts || []).slice(0, 6).map(post => {
        const rawImg = post.displayUrl || post.display_url || post.imageUrl || post.thumbnailUrl || post.thumbnail_src || '';
        const sc = post.shortCode || post.shortcode || '';
        return {
            id: post.id || sc,
            shortCode: sc,
            imageUrl: rawImg,
            thumbnailUrl: post.thumbnailUrl || post.thumbnail_src || rawImg,
            caption: post.caption || '',
            postUrl: post.url || (sc ? `https://www.instagram.com/p/${sc}/` : ''),
            likesCount: post.likesCount || post.likes_count || 0,
            commentsCount: post.commentsCount || post.comments_count || 0,
            mediaType: post.type || post.mediaType || post.__typename || '',
            timestamp: post.timestamp || post.taken_at_timestamp || post.taken_at || '',
            videoUrl: post.videoUrl || post.video_url || '',
            videoDuration: post.videoDuration || post.video_duration || 0,
            videoViewCount: post.videoViewCount || post.video_view_count || 0
        };
    });

    const followers = item.followersCount || item.followers_count || 0;
    const following = item.followsCount || item.followingCount || item.following_count || 0;
    const posts = item.postsCount || item.posts_count || 0;
    const isVerified = Boolean(item.verified || item.isVerified || item.is_verified);
    const externalUrl = item.externalUrl || item.external_url || item.website || '';

    return {
        platform: 'instagram',
        username: item.username || normalizedUsername,
        displayName: item.fullName || item.full_name || item.username || normalizedUsername,
        profileImage: rawProfilePic,
        followers,
        following,
        posts,
        verified: isVerified,
        description: item.biography || item.bio || '',
        profileUrl: `https://www.instagram.com/${normalizedUsername}/`,
        fullName: item.fullName || item.full_name || item.username || normalizedUsername,
        biography: item.biography || item.bio || '',
        profilePicture: rawProfilePic,
        followersCount: followers,
        followingCount: following,
        postsCount: posts,
        externalUrl: externalUrl,
        isBusinessAccount: Boolean(item.isBusinessAccount || item.is_business_account),
        categoryName: item.categoryName || item.category_name || '',
        recentPosts
    };
};

module.exports = { getInstagramProfile };
