const { ApifyClient } = require('apify-client');

const resolveYouTubeUrl = (input) => {
    const trimmed = input.trim();
    if (!trimmed) return '';

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
    }

    if (trimmed.startsWith('www.youtube.com') || trimmed.startsWith('youtube.com')) {
        return `https://${trimmed}`;
    }

    if (trimmed.startsWith('UC') && trimmed.length === 24) {
        return `https://www.youtube.com/channel/${trimmed}`;
    }

    if (trimmed.startsWith('@')) {
        return `https://www.youtube.com/${trimmed}`;
    }

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

    let items = [];
    try {
        const run = await client.actor("streamers/youtube-scraper").call({
            startUrls: [{ url: targetUrl }],
            maxResults: 3
        });

        console.log(`[Apify YouTube Scraper] Run ID: "${run.id}", Status: "${run.status}"`);
        const dataset = await client.dataset(run.defaultDatasetId).listItems();
        items = dataset.items || [];
        console.log(`[Apify YouTube Scraper] Items found: ${items.length}`);
    } catch (apifyErr) {
        console.warn(`[Apify YouTube Scraper Warning] Apify run failed (${apifyErr.message}). Trying public oEmbed fallback...`);
    }

    if (!items || items.length === 0 || items[0].error || items[0].ok === false) {
        // Fallback: YouTube oEmbed API
        try {
            const oembedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(targetUrl)}&format=json`);
            if (oembedRes.ok) {
                const oembedData = await oembedRes.json();
                const cleanUsername = usernameOrChannelId.replace(/^@/, '');
                console.log(`[YouTube oEmbed Success] Title: "${oembedData.author_name}"`);
                return {
                    platform: 'youtube',
                    username: cleanUsername,
                    displayName: oembedData.author_name || oembedData.title || cleanUsername,
                    profileImage: oembedData.thumbnail_url || '',
                    followers: 0,
                    following: 0,
                    posts: 0,
                    description: '',
                    profileUrl: oembedData.author_url || targetUrl,
                    profilePicture: oembedData.thumbnail_url || '',
                    channelName: oembedData.author_name || cleanUsername,
                    handle: cleanUsername.startsWith('@') ? cleanUsername : `@${cleanUsername}`,
                    subscribersCount: 0,
                    videoCount: 0,
                    viewCount: 0,
                    recentVideos: []
                };
            }
        } catch (oembedErr) {
            console.warn(`[YouTube oEmbed Error] ${oembedErr.message}`);
        }
        throw new Error('YouTube channel not found or restricted');
    }

    const firstItem = items[0];
    const channelName = firstItem.channelName || firstItem.channelUsername || usernameOrChannelId;
    const channelAvatarUrl = firstItem.channelAvatarUrl || '';
    const channelUsername = firstItem.channelUsername || channelName;
    const channelDescription = firstItem.channelDescription || '';
    const subscribersCount = firstItem.numberOfSubscribers || 0;
    const videoCount = firstItem.channelTotalVideos || 0;
    const viewCount = firstItem.channelTotalViews || 0;
    const channelUrl = firstItem.channelUrl || targetUrl;

    const videos = items
        .filter(item => item.type === 'video' && item.title)
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
        .slice(0, 3)
        .map(video => ({
            title: video.title || '',
            imageUrl: video.thumbnailUrl || '',
            thumbnailUrl: video.thumbnailUrl || '',
            url: video.url || '',
            viewCount: video.viewCount || 0,
            likeCount: video.likes || video.likeCount || 0,
            commentCount: video.commentsCount || video.commentCount || 0,
            duration: video.duration || '',
            uploadedAt: video.date || '',
            channelName: video.channelName || channelName,
            description: video.text || video.description || ''
        }));

    const cleanUsername = usernameOrChannelId.replace(/^@/, '');

    return {
        platform: 'youtube',
        username: cleanUsername,
        displayName: channelName,
        profileImage: channelAvatarUrl,
        followers: subscribersCount,
        following: 0,
        posts: videoCount,
        description: channelDescription,
        profileUrl: channelUrl,
        profilePicture: channelAvatarUrl,
        channelName: channelName,
        handle: channelUsername.startsWith('@') ? channelUsername : `@${channelUsername}`,
        subscribersCount: subscribersCount,
        videoCount: videoCount,
        viewCount: viewCount,
        recentVideos: videos
    };
};

module.exports = { getYouTubeProfile, resolveYouTubeUrl };
