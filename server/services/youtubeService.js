const { ApifyClient } = require('apify-client');

const resolveYouTubeUrl = (input) => {
    const trimmed = input.trim();
    if (!trimmed) return '';

    // 1. Check if it's already a full URL
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
    }

    // 2. Check if it starts with www. or youtube.com
    if (trimmed.startsWith('www.youtube.com') || trimmed.startsWith('youtube.com')) {
        return `https://${trimmed}`;
    }

    // 3. Check if it's a Channel ID (UC + 22 characters)
    if (trimmed.startsWith('UC') && trimmed.length === 24) {
        return `https://www.youtube.com/channel/${trimmed}`;
    }

    // 4. Check if it's a handle starting with @
    if (trimmed.startsWith('@')) {
        return `https://www.youtube.com/${trimmed}`;
    }

    // 5. Otherwise, treat it as a handle (prepend @)
    return `https://www.youtube.com/@${trimmed}`;
};

const getYouTubeProfile = async (usernameOrChannelId) => {
    if (!usernameOrChannelId) {
        throw new Error('YouTube channel identifier is required');
    }

    const client = new ApifyClient({
        token: process.env.APIFY_API_KEY,
    });

    const targetUrl = resolveYouTubeUrl(usernameOrChannelId);
    console.log(`[Apify YouTube Scraper] Resolved URL: "${targetUrl}" for input: "${usernameOrChannelId}"`);

    // Call Apify actor streamers/youtube-scraper
    const run = await client.actor("streamers/youtube-scraper").call({
        startUrls: [{ url: targetUrl }],
        maxResults: 3
    });

    console.log(`[Apify YouTube Scraper] Run ID: "${run.id}", Status: "${run.status}"`);

    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    console.log(`[Apify YouTube Scraper] Items found: ${items ? items.length : 0}`);

    if (!items || items.length === 0) {
        throw new Error('YouTube channel not found or contains no videos');
    }

    // Check if the actor itself returned an error or failed
    const firstItem = items[0];
    if (firstItem.error || firstItem.ok === false) {
        throw new Error(firstItem.error || 'Failed to retrieve YouTube channel data');
    }

    // Map profile information from the first item
    const channelName = firstItem.channelName || firstItem.channelUsername || usernameOrChannelId;
    const channelAvatarUrl = firstItem.channelAvatarUrl || '';
    const channelUsername = firstItem.channelUsername || channelName;
    const channelDescription = firstItem.channelDescription || '';
    const subscribersCount = firstItem.numberOfSubscribers || 0;
    const videoCount = firstItem.channelTotalVideos || 0;
    const viewCount = firstItem.channelTotalViews || 0;
    const channelUrl = firstItem.channelUrl || targetUrl;

    // Filter and map the latest 3 videos
    const videos = items
        .filter(item => item.type === 'video' && item.title)
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
        .slice(0, 3)
        .map(video => ({
            title: video.title || '',
            thumbnailUrl: video.thumbnailUrl || '',
            url: video.url || '',
            viewCount: video.viewCount || 0,
            uploadedAt: video.date || ''
        }));

    return {
        profilePicture: channelAvatarUrl,
        channelName: channelName,
        handle: channelUsername.startsWith('@') ? channelUsername : `@${channelUsername}`,
        description: channelDescription,
        subscribersCount: subscribersCount,
        videoCount: videoCount,
        viewCount: viewCount,
        channelUrl: channelUrl,
        recentVideos: videos
    };
};

module.exports = { getYouTubeProfile };
