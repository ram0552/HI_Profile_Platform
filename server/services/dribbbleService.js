const getDribbbleProfile = async (username) => {
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };
    
    // 1. Fetch main profile page for avatar, name, bio, and shots
    const mainUrl = `https://dribbble.com/${username}`;
    const mainRes = await fetch(mainUrl, { headers });
    if (!mainRes.ok) {
        throw new Error(`Dribbble user not found (status ${mainRes.status})`);
    }
    const mainHtml = await mainRes.text();
    
    // Parse avatar URL
    const avatarMatch = mainHtml.match(/<img class="profile-avatar"[^>]*src="([^"]+)"/i)
        || mainHtml.match(/class="profile-avatar"[^>]*src="([^"]+)"/i);
    const avatarUrl = avatarMatch ? avatarMatch[1] : '';
    
    // Parse name
    const nameMatch = mainHtml.match(/<h1 class="[^"]*profile-name[^"]*">([^<]+)<\/h1>/i)
        || mainHtml.match(/class="profile-name[^"]*">([^<]+)/i)
        || mainHtml.match(/<h1 class="masthead-profile-name">([^<]+)<\/h1>/i);
    const name = nameMatch ? nameMatch[1].trim() : username;
    
    // Parse bio
    const bioMatch = mainHtml.match(/<p class="[^"]*profile-bio[^"]*">([^<]+)<\/p>/i)
        || mainHtml.match(/<div class="[^"]*profile-bio[^"]*">([\s\S]*?)<\/div>/i);
    const bio = bioMatch ? bioMatch[1].trim() : '';

    // Parse shots
    const shots = [];
    const shotParts = mainHtml.split('class="shot-thumbnail js-thumbnail');
    for (let i = 1; i < shotParts.length && shots.length < 3; i++) {
        const part = shotParts[i];
        
        // Extract link and title
        const linkMatch = part.match(/href="([^"]+)"/i);
        const titleMatch = part.match(/class="accessibility-text">View ([^<]+)</i)
            || part.match(/class="shot-title">([^<]+)</i);
        
        // Extract image URL from noscript img tag
        const imgMatch = part.match(/<noscript>\s*<img src="([^"]+)"/i)
            || part.match(/<img[^>]*src="([^"]+)"/i);
            
        if (linkMatch && imgMatch) {
            shots.push({
                title: titleMatch ? titleMatch[1].trim() : 'Project Shot',
                url: linkMatch[1].startsWith('http') ? linkMatch[1] : `https://dribbble.com${linkMatch[1]}`,
                imageUrl: imgMatch[1]
            });
        }
    }
    
    // 2. Fetch about page for stats
    let followersCount = 0;
    let followingCount = 0;
    try {
        const aboutUrl = `https://dribbble.com/${username}/about`;
        const aboutRes = await fetch(aboutUrl, { headers });
        if (aboutRes.ok) {
            const aboutHtml = await aboutRes.text();
            
            // Regex for followers count
            const followersMatch = aboutHtml.match(/href="\/[^"]+\/followers"[^>]*>\s*<span class="count">([^<]+)<\/span>/i)
                || aboutHtml.match(/followers"[^>]*>\s*<span class="count">([^<]+)<\/span>/i);
            if (followersMatch) {
                followersCount = followersMatch[1];
            }
            
            // Regex for following count
            const followingMatch = aboutHtml.match(/href="\/[^"]+\/following"[^>]*>\s*<span class="count">([^<]+)<\/span>/i)
                || aboutHtml.match(/following"[^>]*>\s*<span class="count">([^<]+)<\/span>/i);
            if (followingMatch) {
                followingCount = followingMatch[1];
            }
        }
    } catch (e) {
        console.error('Error fetching Dribbble about stats:', e.message);
    }
    
    return {
        profilePicture: avatarUrl,
        username: username,
        name: name,
        bio: bio,
        followersCount: followersCount || 0,
        followingCount: followingCount || 0,
        shotsCount: shots.length,
        recentShots: shots
    };
};

module.exports = { getDribbbleProfile };
