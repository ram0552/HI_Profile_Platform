import React from 'react';
import SocialWidgetLayout from './SocialWidgetLayout';
import SocialAvatar from './SocialAvatar';
import SocialImage from './SocialImage';
import { isLikelyFailedScrape, formatRelativeTime, formatStatCount, extractRecentPosts } from '../../utils/socialHelpers';

export default function LinkedInWidget({ block, socialProfile, loading = false, error = null, onRetry }) {
  const sp = socialProfile || block?.socialProfile || {};
  const config = block?.configuration || {};

  const username = sp.username || config.username || config.handle || 'user';

  // Read ONLY top-level normalized SocialProfile fields from MongoDB
  const displayName = sp.displayName || sp.fullName || sp.name || username;
  const headline = sp.headline || sp.currentTitle || '';
  const profileImage = sp.profileImage || sp.profilePicture || sp.avatarUrl || '';
  const bio = sp.bio || sp.description || '';
  const location = sp.location || '';
  const followers = Number(sp.followers ?? sp.followersCount ?? 0);
  const connections = Number(sp.connectionsCount ?? sp.following ?? 0);
  const currentCompany = sp.currentCompany || '';

  const profileUrl = sp.profileUrl || `https://www.linkedin.com/in/${username}`;
  const lastFetched = sp.lastFetched || null;
  const isFailed = isLikelyFailedScrape(sp);

  const recentPosts = extractRecentPosts(sp, block);

  const stats = [
    { label: 'Followers', value: followers },
    { label: 'Connections', value: connections }
  ];

  // Development logging
  console.log('[LinkedIn UI Normalized Data]', {
    displayName,
    headline,
    profileImage,
    followers,
    connections,
    blockId: block?.id || block?._id
  });

  const renderLinkedInPost = (post, idx) => {
    const text = post.text || post.caption || post.commentary || post.title || post.description || post.postText || post.body || '';

    let rawImg = post.imageUrl || post.image || post.mediaUrl || post.thumbnail || post.displayUrl || post.articleImageUrl || '';
    if (!rawImg && post.media) {
      if (Array.isArray(post.media.images) && post.media.images.length > 0) {
        rawImg = post.media.images[0].url || post.media.images[0].src || post.media.url || '';
      } else {
        rawImg = post.media.thumbnail || post.media.url || post.media.src || '';
      }
    }
    if (!rawImg && post.article?.thumbnail) rawImg = post.article.thumbnail;
    if (!rawImg && post.document?.thumbnail) rawImg = post.document.thumbnail;

    const targetUrl = post.contentUrl || post.postUrl || post.url || post.link || post.permalink || profileUrl;
    const likes = Number(post.likesCount || post.likes || post.numLikes || post.reactionCount || post.stats?.total_reactions || post.stats?.likes || 0);
    const comments = Number(post.commentsCount || post.comments || post.numComments || post.stats?.comments || 0);
    const shares = Number(post.sharesCount || post.shares || post.numShares || post.repostsCount || post.stats?.reposts || 0);
    const dateRaw = post.publishedAt || post.createdAt || post.postedAt || post.date || post.timestamp || post.posted_at?.date || post.posted_at?.relative || '';
    const dateStr = dateRaw ? formatRelativeTime(dateRaw) : '';

    return (
      <a
        key={idx}
        href={targetUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="bento-reveal-item"
        style={{
          '--reveal-index': idx,
          textDecoration: 'none',
          color: 'inherit',
          background: '#FFFFFF',
          padding: '10px 12px',
          borderRadius: 12,
          border: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
          transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)',
          cursor: 'pointer'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SocialAvatar src={profileImage} name={displayName} platform="linkedin" size={24} borderColor="#0A66C2" />
          <div style={{ minWidth: 0, flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, fontSize: '0.78rem', color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayName}
            </span>
            {dateStr && <span style={{ fontSize: '0.68rem', color: '#64748B', flexShrink: 0 }}>• {dateStr}</span>}
          </div>
        </div>

        {rawImg && (
          <div style={{ width: '100%', height: 100, borderRadius: 8, overflow: 'hidden', background: '#F1F5F9', flexShrink: 0 }}>
            <SocialImage src={rawImg} alt="LinkedIn Media" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}

        {text && (
          <p style={{ margin: 0, fontSize: '0.78rem', color: '#334155', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {text}
          </p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.72rem', color: '#64748B', fontWeight: 600, marginTop: 2 }}>
          <span>👍 {formatStatCount(likes)}</span>
          <span>💬 {formatStatCount(comments)}</span>
          {shares > 0 && <span>🔁 {formatStatCount(shares)}</span>}
        </div>
      </a>
    );
  };

  return (
    <SocialWidgetLayout
      block={block}
      platform="linkedin"
      displayName={displayName}
      username={username}
      profileImage={profileImage}
      headline={headline}
      location={location}
      company={currentCompany}
      stats={stats}
      bio={bio}
      profileUrl={profileUrl}
      lastFetched={lastFetched}
      isFailedScrape={isFailed}
      accentColor="#0A66C2"
      recentContent={recentPosts}
      renderRecentItem={renderLinkedInPost}
      loading={loading}
      error={error}
      onRetry={onRetry}
    />
  );
}
