import React, { useState, useEffect } from 'react';
import SocialMetaRow from './SocialMetaRow';
import SocialStatBar from './SocialStatBar';
import SocialFooterBar from './SocialFooterBar';
import SocialAvatar from './SocialAvatar';
import SocialImage from './SocialImage';
import SocialSkeleton from './SocialSkeleton';
import SocialEmptyState from './SocialEmptyState';
import SocialErrorState from './SocialErrorState';
import { isLikelyFailedScrape, formatRelativeTime, formatStatCount, extractRecentPosts } from '../../utils/socialHelpers';

export default function LinkedInWidget({ block, socialProfile, loading = false, error = null, onRetry }) {
  const [expandedBio, setExpandedBio] = useState(false);
  const [hoveredPostIdx, setHoveredPostIdx] = useState(null);
  const sp = socialProfile || block?.socialProfile || {};
  const config = block?.configuration || {};

  if (loading) {
    return <SocialSkeleton platform="linkedin" />;
  }

  if (error) {
    return <SocialErrorState onRetry={onRetry} message={error} />;
  }

  const username = sp.username || config.username || config.handle || 'user';
  const displayName = sp.displayName || username;
  const profileImage = sp.profileImage || '';
  const headline = sp.headline || sp.description || '';
  const location = sp.location || '';
  const followers = sp.followers !== undefined ? sp.followers : 0;
  const following = sp.following !== undefined ? sp.following : 500;
  const bio = sp.description || headline || '';
  const profileUrl = sp.profileUrl || `https://www.linkedin.com/in/${username}`;
  const lastFetched = sp.lastFetched || null;
  const isFailed = isLikelyFailedScrape(sp);

  // Extract recent posts using universal candidate resolution
  const recentPosts = extractRecentPosts(sp, block);

  // Development debugging log to trace data pipeline
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[LinkedInWidget Debug] handle: "${username}", posts found: ${recentPosts.length}`, {
        sp,
        block,
        recentPosts
      });
    }
  }, [username, sp, block, recentPosts]);

  const stats = [
    { label: 'Followers', value: followers },
    { label: 'Connections', value: following }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }}>
      {/* Fixed Header */}
      <SocialMetaRow
        displayName={displayName}
        username={username}
        profileImage={profileImage}
        headline={headline}
        location={location}
        platform="linkedin"
      />

      {/* Metric Stats */}
      <SocialStatBar stats={stats} accentColor="#0A66C2" />

      {/* Bio / Headline */}
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
                color: '#0A66C2',
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

      {/* Rich Content Section — Latest 3 LinkedIn Posts */}
      <div style={{ flexGrow: 1, overflowY: 'auto', marginBottom: 8, minHeight: 0 }}>
        {recentPosts.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentPosts.slice(0, 3).map((post, idx) => {
              const isHovered = hoveredPostIdx === idx;

              // Comprehensive property extractions for LinkedIn posts
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
                  style={{
                    textDecoration: 'none',
                    color: 'inherit',
                    background: '#FFFFFF',
                    padding: '10px 12px',
                    borderRadius: 12,
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    boxShadow: isHovered ? '0 6px 16px rgba(10,102,194,0.12)' : '0 2px 4px rgba(0,0,0,0.02)',
                    borderColor: isHovered ? '#93C5FD' : '#E2E8F0',
                    transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                    transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={() => setHoveredPostIdx(idx)}
                  onMouseLeave={() => setHoveredPostIdx(null)}
                >
                  {/* Small Author Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <SocialAvatar
                      src={profileImage}
                      name={displayName}
                      platform="linkedin"
                      size={24}
                      borderColor="#0A66C2"
                    />
                    <div style={{ minWidth: 0, flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.78rem', color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {displayName}
                      </span>
                      {dateStr && <span style={{ fontSize: '0.68rem', color: '#64748B', flexShrink: 0 }}>• {dateStr}</span>}
                    </div>
                  </div>

                  {/* Optional Post Image Media Preview */}
                  {rawImg && (
                    <div style={{ width: '100%', height: 110, borderRadius: 8, overflow: 'hidden', background: '#F1F5F9', flexShrink: 0 }}>
                      <SocialImage
                        src={rawImg}
                        alt="LinkedIn Post Media"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  )}

                  {/* Post Body Text */}
                  {text && (
                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.78rem',
                        color: '#334155',
                        lineHeight: '1.4',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: isHovered ? 5 : 2,
                        WebkitBoxOrient: 'vertical',
                        transition: 'max-height 0.2s ease-in-out'
                      }}
                    >
                      {text}
                    </p>
                  )}

                  {/* Reaction Summary (Likes, Comments, Shares) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.72rem', color: '#64748B', fontWeight: 600, marginTop: 2 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      👍 {formatStatCount(likes)}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      💬 {formatStatCount(comments)}
                    </span>
                    {shares > 0 && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        🔁 {formatStatCount(shares)}
                      </span>
                    )}
                  </div>
                </a>
              );
            })}
          </div>
        ) : (
          <SocialEmptyState platform="linkedin" />
        )}
      </div>

      {/* Footer Timestamp */}
      <SocialFooterBar lastFetched={lastFetched} isFailedScrape={isFailed} />

      {/* Open LinkedIn CTA */}
      <a
        href={profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex',
          alignItems: 'center',
          justify: 'center',
          gap: 6,
          background: '#0A66C2',
          color: '#FFFFFF',
          textDecoration: 'none',
          padding: '8px 14px',
          borderRadius: 12,
          fontWeight: 700,
          fontSize: '0.84rem',
          textAlign: 'center',
          marginTop: 6,
          boxShadow: '0 3px 12px rgba(10,102,194,0.25)',
          transition: 'transform 0.15s ease, boxShadow 0.15s ease',
          flexShrink: 0
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
      >
        Open LinkedIn ↗
      </a>
    </div>
  );
}
