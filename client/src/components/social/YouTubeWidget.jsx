import React from 'react';
import SocialWidgetLayout from './SocialWidgetLayout';
import SocialImage from './SocialImage';
import { isLikelyFailedScrape, formatRelativeTime, formatStatCount, extractRecentPosts } from '../../utils/socialHelpers';

export default function YouTubeWidget({ block, socialProfile, loading = false, error = null, onRetry }) {
  const sp = socialProfile || block?.socialProfile || {};
  const config = block?.configuration || {};

  const username = sp.username || config.username || config.handle || 'channel';
  const displayName = sp.displayName || username;
  const profileImage = sp.profileImage || '';
  const subscribers = sp.followers !== undefined ? sp.followers : 0;
  const videosCount = sp.posts !== undefined ? sp.posts : 0;
  const bio = sp.description || '';
  const profileUrl = sp.profileUrl || `https://www.youtube.com/@${username}`;
  const lastFetched = sp.lastFetched || null;
  const isFailed = isLikelyFailedScrape(sp);

  const recentVideos = extractRecentPosts(sp, block);

  const stats = [
    { label: 'Subscribers', value: subscribers },
    { label: 'Videos', value: videosCount }
  ];

  const renderVideoItem = (vid, idx) => {
    const videoTitle = vid.title || 'YouTube Video';
    const videoUrl = vid.contentUrl || vid.url || profileUrl;
    const rawImg = vid.imageUrl || vid.thumbnailUrl || vid.thumbnail || '';
    const views = vid.viewsCount !== undefined ? vid.viewsCount : vid.viewCount;
    const dateRaw = vid.publishedAt || vid.uploadedAt || vid.date || '';
    const pubDate = dateRaw ? formatRelativeTime(dateRaw) : '';

    return (
      <a
        key={idx}
        href={videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="bento-reveal-item"
        style={{
          '--reveal-index': idx,
          textDecoration: 'none',
          color: 'inherit',
          background: '#FFFFFF',
          padding: '8px',
          borderRadius: 12,
          border: '1px solid #E2E8F0',
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
          transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)',
          cursor: 'pointer'
        }}
      >
        <div style={{ width: 68, height: 44, borderRadius: 8, overflow: 'hidden', flexShrink: 0, position: 'relative', background: '#0F172A' }}>
          <SocialImage src={rawImg} alt={videoTitle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} fallbackText="▶️" />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#FF0000', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', paddingLeft: 1 }}>
              ▶
            </div>
          </div>
        </div>

        <div style={{ flexGrow: 1, minWidth: 0 }}>
          <span style={{ fontWeight: 700, fontSize: '0.78rem', color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.3 }}>
            {videoTitle}
          </span>
          <div style={{ display: 'flex', gap: 8, fontSize: '0.68rem', color: '#64748B', marginTop: 3, fontWeight: 500 }}>
            {views !== undefined && views !== null && <span>👁️ {formatStatCount(views)} views</span>}
            {pubDate && <span>• {pubDate}</span>}
          </div>
        </div>
      </a>
    );
  };

  return (
    <SocialWidgetLayout
      block={block}
      platform="youtube"
      displayName={displayName}
      username={username}
      profileImage={profileImage}
      stats={stats}
      bio={bio}
      profileUrl={profileUrl}
      lastFetched={lastFetched}
      isFailedScrape={isFailed}
      accentColor="#FF0000"
      recentContent={recentVideos}
      renderRecentItem={renderVideoItem}
      loading={loading}
      error={error}
      onRetry={onRetry}
    />
  );
}
