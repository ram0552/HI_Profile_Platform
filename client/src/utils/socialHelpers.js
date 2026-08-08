/**
 * Presentation Hygiene Helpers for Social Widgets
 */

/**
 * Sanitize username/handle from raw string or accidental URL
 */
export const sanitizeUsername = (username = '') => {
  if (!username) return 'user';
  let clean = String(username).trim();

  // Strip protocol and domain if full URL was passed
  clean = clean.replace(/^https?:\/\/(www\.)?[^\/]+\//i, '');
  clean = clean.replace(/\/$/, '');
  clean = clean.replace(/^@/, '');

  return clean || 'user';
};

/**
 * Format stat numbers into human-readable compact notation (e.g. 26.5K, 1.4M)
 */
export const formatStatCount = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '0';
  const val = Number(num);
  if (val < 0) return '0';

  if (val >= 1_000_000) {
    return (val / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (val >= 10_000) {
    return (val / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return val.toLocaleString();
};

/**
 * Format relative time string (e.g. "3h ago", "2d ago", "just now")
 */
export const formatRelativeTime = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

/**
 * Detect partial or failed scrape (0 stats + no avatar + no bio)
 */
export const isLikelyFailedScrape = (sp = {}) => {
  if (!sp) return false;
  const hasNoImage = !sp.profileImage || sp.profileImage.trim() === '';
  const hasNoBio = !sp.description || sp.description.trim() === '';
  const hasZeroFollowers = Number(sp.followers || 0) === 0;
  const hasZeroPosts = Number(sp.posts || 0) === 0;

  return hasNoImage && hasNoBio && hasZeroFollowers && hasZeroPosts;
};

/**
 * Generate a deterministic background color for initials avatar fallback
 */
export const getInitialsColor = (name = '', platform = '') => {
  const palette = [
    '#6366F1', '#8B5CF6', '#EC4899', '#3B82F6',
    '#10B981', '#F59E0B', '#EF4444', '#06B6D4'
  ];

  const str = (name + platform).toLowerCase();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % palette.length;
  return palette[index];
};

/**
 * Extract 1-2 initials from name or username
 */
export const getInitials = (name = '') => {
  if (!name) return '👤';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
};

const API_BASE_URL = 'http://localhost:3001/api';

/**
 * Resolve and proxy social image URLs to bypass CORP/CORS/Referrer restrictions
 */
export const resolveSocialImageUrl = (url = '') => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Don't proxy if already proxied or data/blob URI
  if (
    trimmed.includes('/api/social/proxy') ||
    trimmed.includes('/api/instagram/proxy') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  // Proxy external HTTP/HTTPS image URLs (Instagram, Facebook CDN, etc.)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return `${API_BASE_URL}/social/proxy?url=${encodeURIComponent(trimmed)}`;
  }

  return trimmed;
};

/**
 * Robustly extract recent posts / content array from any SocialProfile or block object
 * Searches all possible locations (MongoDB normalized, scraper rawData, nested profile objects)
 */
export const extractRecentPosts = (sp = {}, block = {}) => {
  const candidates = [
    sp?.recentContent,
    sp?.recentPosts,
    sp?.recentVideos,
    sp?.recentRepos,
    sp?.posts,
    sp?.videos,
    sp?.repositories,
    sp?.latestPosts,
    sp?.profile?.recentPosts,
    sp?.profile?.latestPosts,
    sp?.profile?.recentVideos,
    sp?.profile?.recentRepos,
    sp?.profile?.posts,
    sp?.rawData?.recentPosts,
    sp?.rawData?.latestPosts,
    sp?.rawData?.recentVideos,
    sp?.rawData?.recentRepos,
    sp?.rawData?.posts,
    sp?.rawData?.videos,
    sp?.rawData?.repositories,
    sp?.rawData?.profile?.recentPosts,
    sp?.rawData?.profile?.latestPosts,
    sp?.rawData?.profile?.recentVideos,
    sp?.rawData?.profile?.posts,
    sp?.rawData?.data?.recentPosts,
    sp?.rawData?.data?.latestPosts,
    sp?.rawData?.data?.posts,
    sp?.data?.recentPosts,
    sp?.data?.latestPosts,
    sp?.data?.posts,
    block?.socialProfile?.recentContent,
    block?.socialProfile?.recentPosts,
    block?.socialProfile?.posts,
    block?.socialProfile?.rawData?.recentPosts,
    block?.socialProfile?.rawData?.latestPosts,
    block?.socialProfile?.rawData?.posts
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length > 0) {
      return candidate;
    }
  }

  return [];
};
