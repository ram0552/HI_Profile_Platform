const { ApifyClient } = require('apify-client');

const getGitHubProfile = async (username) => {
    if (!username) {
        throw new Error('Username is required');
    }

    const client = new ApifyClient({
        token: process.env.APIFY_API_KEY,
    });

    console.log(`[Apify GitHub Scraper] Starting run for: "${username}"`);

    // 1. Fetch profile info via Apify
    const userRun = await client.actor("dami_studio/github-scraper").call({
        query: `user:${username}`,
        type: "users"
    });

    console.log(`[Apify GitHub Scraper] Users Run ID: "${userRun.id}", Status: "${userRun.status}"`);

    const { items: userItems } = await client.dataset(userRun.defaultDatasetId).listItems();
    if (!userItems || userItems.length === 0 || userItems[0].ok === false || userItems[0].errorCode === 'NO_RESULTS') {
        throw new Error(`GitHub user not found`);
    }

    const userItem = userItems[0];

    // 2. Fetch public repos via Apify
    console.log(`[Apify GitHub Scraper] Fetching repositories for: "${username}"`);
    const reposRun = await client.actor("dami_studio/github-scraper").call({
        query: `user:${username}`,
        type: "repositories"
    });

    console.log(`[Apify GitHub Scraper] Repos Run ID: "${reposRun.id}", Status: "${reposRun.status}"`);

    const { items: reposItems } = await client.dataset(reposRun.defaultDatasetId).listItems();
    
    // Filter out error results from repositories dataset
    const validRepos = (reposItems || []).filter(repo => repo.ok !== false && repo.name);

    // Sort repositories by updatedAt descending to match "recent"
    const sortedRepos = validRepos.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

    // Map repositories to standard format with exhaustive metadata
    const mappedRepos = sortedRepos.slice(0, 3).map(repo => ({
        name: repo.name,
        description: repo.description || '',
        stars: repo.stars || 0,
        forks: repo.forks || 0,
        language: repo.language || '',
        url: repo.url,
        updatedAt: repo.updatedAt || '',
        createdAt: repo.createdAt || '',
        topics: Array.isArray(repo.topics) ? repo.topics : [],
        license: repo.license || '',
        openIssues: repo.openIssues || repo.open_issues_count || 0,
        isForked: Boolean(repo.isFork || repo.fork),
        isArchived: Boolean(repo.isArchived || repo.archived),
        defaultBranch: repo.defaultBranch || repo.default_branch || 'main'
    }));

    // 3. Enrich following count, avatar url, and additional profile fields using public API
    let followingCount = 0;
    let avatarUrl = `https://github.com/${username}.png`; // Github avatar fallback redirect
    let company = '';
    let location = '';
    let website = '';
    let ghBio = '';
    let publicGists = 0;

    try {
        const profileRes = await fetch(`https://api.github.com/users/${username}`, {
            headers: { 'User-Agent': 'HighProfile-App' }
        });
        if (profileRes.ok) {
            const ghProfile = await profileRes.json();
            followingCount = ghProfile.following || 0;
            avatarUrl = ghProfile.avatar_url || avatarUrl;
            company = ghProfile.company || '';
            location = ghProfile.location || '';
            website = ghProfile.blog || '';
            ghBio = ghProfile.bio || '';
            publicGists = ghProfile.public_gists || 0;
        }
    } catch (err) {
        console.error(`[Apify GitHub Scraper] Enrichment API call failed: ${err.message}`);
    }

    return {
        platform: 'github',
        username: userItem.login || username,
        displayName: userItem.name || userItem.login || username,
        profileImage: avatarUrl,
        followers: userItem.followers || 0,
        following: followingCount,
        posts: userItem.publicRepos || 0,
        description: ghBio || userItem.bio || '',
        profileUrl: `https://github.com/${username}`,
        avatarUrl: avatarUrl,
        name: userItem.name || userItem.login || username,
        bio: ghBio || userItem.bio || '',
        followersCount: userItem.followers || 0,
        followingCount: followingCount,
        reposCount: userItem.publicRepos || 0,
        publicGists: publicGists,
        company: company,
        location: location,
        website: website,
        createdAt: userItem.createdAt || '',
        recentRepos: mappedRepos
    };
};

module.exports = { getGitHubProfile };
