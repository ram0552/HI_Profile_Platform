const { ApifyClient } = require('apify-client');

const getGitHubProfile = async (username) => {
    const cleanUsername = (username || '').trim().replace(/^@/, '');
    if (!cleanUsername) {
        throw new Error('GitHub username is required');
    }

    console.log(`[GitHub Service] Starting fetch for: "${cleanUsername}"...`);

    // 1. Direct GitHub Public REST API Call (Fast, free, 100% accurate fallback/primary)
    let ghProfileData = null;
    let ghReposData = [];

    try {
        const [profileRes, reposRes] = await Promise.all([
            fetch(`https://api.github.com/users/${cleanUsername}`, {
                headers: { 'User-Agent': 'HiProfile-Platform-App' }
            }),
            fetch(`https://api.github.com/users/${cleanUsername}/repos?sort=updated&per_page=6`, {
                headers: { 'User-Agent': 'HiProfile-Platform-App' }
            })
        ]);

        if (profileRes.ok) {
            ghProfileData = await profileRes.json();
            console.log(`[GitHub Direct API] Profile loaded successfully for "${cleanUsername}". Followers: ${ghProfileData.followers}, Repos: ${ghProfileData.public_repos}`);
        }
        if (reposRes.ok) {
            const rawRepos = await reposRes.json();
            if (Array.isArray(rawRepos)) {
                ghReposData = rawRepos;
            }
        }
    } catch (err) {
        console.warn(`[GitHub Direct API Warning] Direct API fetch failed (${err.message}). Falling back to Apify...`);
    }

    // 2. Apify Scraper Enrichment if available
    let apifyUserItem = null;
    let apifyRepos = [];

    if (process.env.APIFY_API_KEY) {
        try {
            const client = new ApifyClient({ token: process.env.APIFY_API_KEY });
            const userRun = await client.actor("dami_studio/github-scraper").call({
                query: `user:${cleanUsername}`,
                type: "users"
            });
            const { items: userItems } = await client.dataset(userRun.defaultDatasetId).listItems();
            if (userItems && userItems.length > 0 && userItems[0].ok !== false) {
                apifyUserItem = userItems[0];
            }

            const reposRun = await client.actor("dami_studio/github-scraper").call({
                query: `user:${cleanUsername}`,
                type: "repositories"
            });
            const { items: reposItems } = await client.dataset(reposRun.defaultDatasetId).listItems();
            if (Array.isArray(reposItems)) {
                apifyRepos = reposItems.filter(r => r.ok !== false && r.name);
            }
        } catch (apifyErr) {
            console.warn(`[Apify GitHub Scraper Warning] Apify fetch failed (${apifyErr.message}).`);
        }
    }

    if (!ghProfileData && !apifyUserItem) {
        throw new Error(`GitHub user "${cleanUsername}" not found`);
    }

    // Combine Direct API & Apify data seamlessly
    const displayName = ghProfileData?.name || apifyUserItem?.name || ghProfileData?.login || apifyUserItem?.login || cleanUsername;
    const avatarUrl = ghProfileData?.avatar_url || apifyUserItem?.avatarUrl || `https://github.com/${cleanUsername}.png`;
    const followers = ghProfileData?.followers ?? apifyUserItem?.followers ?? 0;
    const following = ghProfileData?.following ?? apifyUserItem?.following ?? 0;
    const publicRepos = ghProfileData?.public_repos ?? apifyUserItem?.publicRepos ?? 0;
    const bio = ghProfileData?.bio || apifyUserItem?.bio || '';
    const company = ghProfileData?.company || apifyUserItem?.company || '';
    const location = ghProfileData?.location || apifyUserItem?.location || '';
    const website = ghProfileData?.blog || apifyUserItem?.website || '';

    // Standardized repository mapping
    let recentRepos = [];
    if (ghReposData.length > 0) {
        recentRepos = ghReposData.slice(0, 3).map(r => ({
            name: r.name || '',
            description: r.description || '',
            stars: r.stargazers_count || 0,
            forks: r.forks_count || 0,
            language: r.language || '',
            url: r.html_url || r.url || `https://github.com/${cleanUsername}/${r.name}`,
            updatedAt: r.updated_at || r.pushed_at || '',
            createdAt: r.created_at || ''
        }));
    } else if (apifyRepos.length > 0) {
        recentRepos = apifyRepos.slice(0, 3).map(r => ({
            name: r.name || '',
            description: r.description || '',
            stars: r.stars || 0,
            forks: r.forks || 0,
            language: r.language || '',
            url: r.url || `https://github.com/${cleanUsername}/${r.name}`,
            updatedAt: r.updatedAt || '',
            createdAt: r.createdAt || ''
        }));
    }

    return {
        platform: 'github',
        username: cleanUsername,
        displayName,
        profileImage: avatarUrl,
        followers,
        following,
        posts: publicRepos,
        description: bio,
        profileUrl: `https://github.com/${cleanUsername}`,
        avatarUrl,
        name: displayName,
        bio,
        followersCount: followers,
        followingCount: following,
        reposCount: publicRepos,
        company,
        location,
        website,
        recentRepos
    };
};

module.exports = { getGitHubProfile };
