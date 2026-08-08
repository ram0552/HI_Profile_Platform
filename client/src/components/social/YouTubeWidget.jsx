import React, { useState } from 'react';
import SocialMetaRow from './SocialMetaRow';
import SocialStatBar from './SocialStatBar';
import SocialFooterBar from './SocialFooterBar';
import SocialImage from './SocialImage';
import SocialSkeleton from './SocialSkeleton';
import SocialEmptyState from './SocialEmptyState';
import SocialErrorState from './SocialErrorState';
import { isLikelyFailedScrape, formatRelativeTime, formatStatCount, extractRecentPosts } from '../../utils/socialHelpers';

export default function YouTubeWidget({ block, socialProfile, loading = false, error = null, onRetry }) {
  const [expandedBio, setExpandedBio] = useState(false);
  const [hoveredVidIdx, setHoveredVidIdx] = useState(null);
  const sp = socialProfile || block?.socialProfile || {};
  const config = block?.configuration || {};

  if (loading) {
    return <SocialSkeleton platform="youtube" />;
  }

  if (error) {
    return <SocialErrorState onRetry={onRetry} message={error} />;
  }

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }}>
      {/* Fixed Header */}
      <SocialMetaRow
        displayName={displayName}
        username={username}
        profileImage={profileImage}
        platform="youtube"
      />

      {/* Metric Stats */}
      <SocialStatBar stats={stats} accentColor="#FF0000" />

      {/* Bio */}
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
                color: '#FF0000',
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

      {/* Rich Content Section — Latest 3 Videos */}
      <div style={{ flexGrow: 1, overflowY: 'auto', marginBottom: 8, minHeight: 0 }}>
        {recentVideos.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentVideos.slice(0, 3).map((vid, idx) => {
              const isHovered = hoveredVidIdx === idx;
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
                    boxShadow: isHovered ? '0 6px 16px rgba(255,0,0,0.12)' : '0 2px 4px rgba(0,0,0,0.02)',
                    borderColor: isHovered ? '#FCA5A5' : '#E2E8F0',
                    transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                    transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={() => setHoveredVidIdx(idx)}
                  onMouseLeave={() => setHoveredVidIdx(null)}
                >
                  {/* Thumbnail Box with Play Overlay */}
                  <div
                    style={{
                      width: 72,
                      height: 46,
                      borderRadius: 8,
                      overflow: 'hidden',
                      flexShrink: 0,
                      position: 'relative',
                      background: '#0F172A'
                    }}
                  >
                    <SocialImage
                      src={rawImg}
                      alt={videoTitle}
                      style={{
                        width: '100%',
                        height: '100%',
                        transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                        transition: 'transform 0.25s ease'
                      }}
                      fallbackText="▶️"
                    />

                    {/* Animated Play Icon Overlay */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: isHovered ? 1 : 0.75,
                        transition: 'opacity 0.2s ease'
                      }}
                    >
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          background: '#FF0000',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.65rem',
                          paddingLeft: 2,
                          boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                        }}
                      >
                        ▶
                      </div>
                    </div>
                  </div>

                  {/* Video Metadata */}
                  <div style={{ flexGrow: 1, minWidth: 0 }}>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        color: isHovered ? '#DC2626' : '#0F172A',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        lineHeight: 1.3,
                        transition: 'color 0.2s ease'
                      }}
                    >
                      {videoTitle}
                    </span>
                    <div style={{ display: 'flex', gap: 8, fontSize: '0.68rem', color: '#64748B', marginTop: 3, fontWeight: 500 }}>
                      {views !== undefined && views !== null && (
                        <span>👁️ {formatStatCount(views)} views</span>
                      )}
                      {pubDate && <span>• {pubDate}</span>}
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        ) : (
          <SocialEmptyState platform="youtube" />
        )}
      </div>

      {/* Footer Timestamp */}
      <SocialFooterBar lastFetched={lastFetched} isFailedScrape={isFailed} />

      {/* Open YouTube CTA */}
      <a
        href={profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex',
          alignItems: 'center',
          justify: 'center',
          gap: 6,
          background: '#FF0000',
          color: '#FFFFFF',
          textDecoration: 'none',
          padding: '8px 14px',
          borderRadius: 12,
          fontWeight: 700,
          fontSize: '0.84rem',
          textAlign: 'center',
          marginTop: 6,
          boxShadow: '0 3px 12px rgba(255,0,0,0.25)',
          transition: 'transform 0.15s ease, boxShadow 0.15s ease',
          flexShrink: 0
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
      >
        Open YouTube ↗
      </a>
    </div>
  );
}
