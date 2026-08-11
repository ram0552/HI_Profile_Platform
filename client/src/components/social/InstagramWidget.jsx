import React from 'react';
import SocialWidgetLayout from './SocialWidgetLayout';
import SocialImage from './SocialImage';
import { isLikelyFailedScrape, formatRelativeTime, formatStatCount, extractRecentPosts } from '../../utils/socialHelpers';

export default function InstagramWidget({ block, socialProfile, loading = false, error = null, onRetry }) {
  const sp = socialProfile || block?.socialProfile || {};
  const config = block?.configuration || {};

  const username = sp.username || config.username || config.handle || 'user';
  const displayName = sp.displayName || username;

  const profileImage =
    sp.profileImage ||
    sp.profilePicture ||
    sp.profilePictureUrl ||
    sp.avatar ||
    sp.avatarUrl ||
    sp.profile_pic_url ||
    sp.profile?.profilePicture ||
    sp.profile?.profileImage ||
    sp.rawData?.profilePicUrl ||
    sp.rawData?.profilePicUrlHD ||
    sp.rawData?.profile_pic_url ||
    sp.rawData?.profilePicture ||
    '';

  const verified = sp.verified || false;
  const location = sp.location || '';
  const headline = sp.headline || '';
  const followers = sp.followers !== undefined ? sp.followers : 0;
  const following = sp.following !== undefined ? sp.following : 0;
  const posts = sp.posts !== undefined ? sp.posts : 0;
  const bio = sp.description || '';
  const profileUrl = sp.profileUrl || `https://www.instagram.com/${username}/`;
  const lastFetched = sp.lastFetched || null;
  const isFailed = isLikelyFailedScrape(sp);

  const recentPosts = extractRecentPosts(sp, block);

  const stats = [
    { label: 'Followers', value: followers },
    { label: 'Following', value: following },
    { label: 'Posts', value: posts }
  ];

  const renderInstagramPost = (post, idx) => {
    const rawImg =
      post.imageUrl ||
      post.thumbnailUrl ||
      post.displayUrl ||
      post.display_url ||
      post.thumbnail_src ||
      post.image ||
      post.mediaUrl ||
      post.url ||
      post.src ||
      post.node?.display_url ||
      post.node?.thumbnail_src ||
      (Array.isArray(post.images) && post.images[0]) ||
      (post.media && Array.isArray(post.media) && post.media[0]?.url) ||
      '';
    const postCaption = post.caption || post.text || post.title || post.captionText || post.alt || '';
    const postLikes = Number(post.likesCount || post.likes || post.likes_count || post.like_count || 0);
    const postComments = Number(post.commentsCount || post.comments || post.comments_count || post.comment_count || 0);
    const postDateRaw = post.publishedAt || post.createdAt || post.date || post.timestamp || post.taken_at_timestamp || '';
    const postDate = postDateRaw ? formatRelativeTime(postDateRaw) : '';
    const targetUrl = post.contentUrl || post.postUrl || post.url || post.link || post.permalink || (post.shortCode || post.shortcode || post.id ? `https://www.instagram.com/p/${post.shortCode || post.shortcode || post.id}/` : '') || profileUrl;

    return (
      <a
        key={post.id || idx}
        href={targetUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          '--reveal-index': idx,
          textDecoration: 'none',
          color: 'inherit',
          display: 'block',
          borderRadius: 10,
          overflow: 'hidden',
          position: 'relative',
          background: '#F1F5F9',
          aspectRatio: '1/1',
          boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
          cursor: 'pointer'
        }}
        className="instagram-post-card bento-reveal-item"
      >
        <SocialImage
          src={rawImg}
          alt={postCaption || 'Instagram Post'}
          style={{ width: '100%', height: '100%', transition: 'transform 0.3s ease' }}
          fallbackText="📷"
        />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(2px)',
            opacity: 0,
            transition: 'opacity 0.25s ease-in-out',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 6,
            textAlign: 'center',
            color: '#FFFFFF',
            boxSizing: 'border-box'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0';
          }}
        >
          {postCaption && (
            <p
              style={{
                margin: '0 0 6px',
                fontSize: '0.68rem',
                lineHeight: '1.25',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                fontWeight: 500
              }}
            >
              {postCaption}
            </p>
          )}
          <div style={{ display: 'flex', gap: 8, fontSize: '0.72rem', fontWeight: 700 }}>
            <span>❤️ {formatStatCount(postLikes)}</span>
            <span>💬 {formatStatCount(postComments)}</span>
          </div>
          {postDate && (
            <span style={{ fontSize: '0.62rem', opacity: 0.85, marginTop: 4, fontWeight: 500 }}>
              {postDate}
            </span>
          )}
        </div>
      </a>
    );
  };

  return (
    <SocialWidgetLayout
      block={block}
      platform="instagram"
      displayName={displayName}
      username={username}
      profileImage={profileImage}
      verified={verified}
      headline={headline}
      location={location}
      stats={stats}
      bio={bio}
      profileUrl={profileUrl}
      lastFetched={lastFetched}
      isFailedScrape={isFailed}
      accentColor="#E1306C"
      recentContent={recentPosts}
      renderRecentItem={renderInstagramPost}
      loading={loading}
      error={error}
      onRetry={onRetry}
    />
  );
}
