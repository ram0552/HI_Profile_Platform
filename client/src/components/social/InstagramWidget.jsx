import React, { useState, useEffect } from 'react';
import SocialMetaRow from './SocialMetaRow';
import SocialStatBar from './SocialStatBar';
import SocialFooterBar from './SocialFooterBar';
import SocialImage from './SocialImage';
import SocialSkeleton from './SocialSkeleton';
import SocialEmptyState from './SocialEmptyState';
import SocialErrorState from './SocialErrorState';
import { isLikelyFailedScrape, formatRelativeTime, formatStatCount, extractRecentPosts } from '../../utils/socialHelpers';

export default function InstagramWidget({ block, socialProfile, loading = false, error = null, onRetry }) {
  const [expandedBio, setExpandedBio] = useState(false);
  const sp = socialProfile || block?.socialProfile || {};
  const config = block?.configuration || {};

  if (loading) {
    return <SocialSkeleton platform="instagram" />;
  }

  if (error) {
    return <SocialErrorState onRetry={onRetry} message={error} />;
  }

  const username = sp.username || config.username || config.handle || 'user';
  const displayName = sp.displayName || username;
  const profileImage = sp.profileImage || '';
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

  // Extract recent posts using universal candidate resolution
  const recentPosts = extractRecentPosts(sp, block);

  // Development debugging log to trace data pipeline
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[InstagramWidget Debug] handle: "${username}", posts found: ${recentPosts.length}`, {
        sp,
        block,
        recentPosts
      });
    }
  }, [username, sp, block, recentPosts]);

  const stats = [
    { label: 'Followers', value: followers },
    { label: 'Following', value: following },
    { label: 'Posts', value: posts }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }}>
      {/* Fixed Header */}
      <SocialMetaRow
        displayName={displayName}
        username={username}
        profileImage={profileImage}
        verified={verified}
        headline={headline}
        location={location}
        platform="instagram"
      />

      {/* Metric Stats */}
      <SocialStatBar stats={stats} accentColor="#E1306C" />

      {/* Biography with Clamping & Read More */}
      {bio && (
        <div style={{ marginBottom: 10, flexShrink: 0 }}>
          <p
            style={{
              margin: 0,
              fontSize: '0.82rem',
              color: '#334155',
              lineHeight: '1.45',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: expandedBio ? 'none' : 2,
              WebkitBoxOrient: 'vertical'
            }}
          >
            {bio}
          </p>
          {bio.length > 80 && (
            <button
              onClick={() => setExpandedBio(!expandedBio)}
              style={{
                background: 'none',
                border: 'none',
                color: '#E1306C',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                padding: 0,
                marginTop: 2
              }}
            >
              {expandedBio ? 'Show Less ▲' : 'Read More ▼'}
            </button>
          )}
        </div>
      )}

      {/* Rich Content Grid — Recent Posts */}
      <div style={{ flexGrow: 1, overflowY: 'auto', marginBottom: 8, minHeight: 0 }}>
        {recentPosts.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, width: '100%' }}>
            {recentPosts.slice(0, 6).map((post, idx) => {
              const rawImg = post.imageUrl || post.displayUrl || post.thumbnailUrl || post.image || post.mediaUrl || post.url || post.display_url || post.thumbnail_src || post.src || '';
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
                  className="instagram-post-card"
                >
                  <SocialImage
                    src={rawImg}
                    alt={postCaption || 'Instagram Post'}
                    style={{ width: '100%', height: '100%', transition: 'transform 0.3s ease' }}
                    fallbackText="📷"
                  />

                  {/* Animated Hover Overlay */}
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
                      const img = e.currentTarget.previousSibling;
                      if (img) img.style.transform = 'scale(1.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '0';
                      const img = e.currentTarget.previousSibling;
                      if (img) img.style.transform = 'scale(1)';
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
            })}
          </div>
        ) : (
          <SocialEmptyState platform="instagram" />
        )}
      </div>

      {/* Footer Timestamp Bar */}
      <SocialFooterBar lastFetched={lastFetched} isFailedScrape={isFailed} />

      {/* Call To Action Button */}
      <a
        href={profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex',
          alignItems: 'center',
          justify: 'center',
          gap: 6,
          background: 'linear-gradient(135deg, #833AB4, #FD1D1D, #F56040)',
          color: '#FFFFFF',
          textDecoration: 'none',
          padding: '8px 14px',
          borderRadius: 12,
          fontWeight: 700,
          fontSize: '0.84rem',
          textAlign: 'center',
          marginTop: 6,
          boxShadow: '0 3px 12px rgba(225,48,108,0.25)',
          transition: 'transform 0.15s ease, boxShadow 0.15s ease',
          flexShrink: 0
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
      >
        Open Instagram ↗
      </a>
    </div>
  );
}
