import React, { useState } from 'react';
import SocialMetaRow from './SocialMetaRow';
import SocialStatBar from './SocialStatBar';
import SocialFooterBar from './SocialFooterBar';
import SocialAvatar from './SocialAvatar';
import SocialSkeleton from './SocialSkeleton';
import SocialEmptyState from './SocialEmptyState';
import SocialErrorState from './SocialErrorState';
import { isLikelyFailedScrape, formatRelativeTime, formatStatCount, extractRecentPosts } from '../../utils/socialHelpers';

export default function TwitterWidget({ block, socialProfile, loading = false, error = null, onRetry }) {
  const [expandedBio, setExpandedBio] = useState(false);
  const [hoveredTweetIdx, setHoveredTweetIdx] = useState(null);
  const sp = socialProfile || block?.socialProfile || {};
  const config = block?.configuration || {};

  if (loading) {
    return <SocialSkeleton platform="twitter" />;
  }

  if (error) {
    return <SocialErrorState onRetry={onRetry} message={error} />;
  }

  const username = sp.username || config.username || config.handle || 'user';
  const displayName = sp.displayName || username;
  const profileImage = sp.profileImage || '';
  const verified = sp.verified || false;
  const followers = sp.followers !== undefined ? sp.followers : 0;
  const following = sp.following !== undefined ? sp.following : 0;
  const tweetsCount = sp.posts !== undefined ? sp.posts : 0;
  const bio = sp.description || '';
  const profileUrl = sp.profileUrl || `https://x.com/${username}`;
  const lastFetched = sp.lastFetched || null;
  const isFailed = isLikelyFailedScrape(sp);

  const recentTweets = extractRecentPosts(sp, block);

  const stats = [
    { label: 'Followers', value: followers },
    { label: 'Following', value: following },
    { label: 'Tweets', value: tweetsCount }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }}>
      {/* Fixed Header */}
      <SocialMetaRow
        displayName={displayName}
        username={username}
        profileImage={profileImage}
        verified={verified}
        platform="twitter"
      />

      {/* Metric Stats */}
      <SocialStatBar stats={stats} accentColor="#1DA1F2" />

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
                color: '#1DA1F2',
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

      {/* Rich Content Section — Latest 3 Tweets */}
      <div style={{ flexGrow: 1, overflowY: 'auto', marginBottom: 8, minHeight: 0 }}>
        {recentTweets.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentTweets.slice(0, 3).map((tweet, idx) => {
              const isHovered = hoveredTweetIdx === idx;
              const tweetText = tweet.text || tweet.caption || 'Tweet';
              const likes = Number(tweet.likesCount || tweet.likes || tweet.likeCount || 0);
              const retweets = Number(tweet.sharesCount || tweet.retweetsCount || tweet.retweetCount || 0);
              const replies = Number(tweet.commentsCount || tweet.repliesCount || tweet.replyCount || 0);
              const dateRaw = tweet.publishedAt || tweet.createdAt || tweet.date || '';
              const dateStr = dateRaw ? formatRelativeTime(dateRaw) : '';
              const targetUrl = tweet.contentUrl || tweet.postUrl || tweet.url || profileUrl;

              return (
                <a
                  key={tweet.id || idx}
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
                    boxShadow: isHovered ? '0 6px 16px rgba(0,0,0,0.08)' : '0 2px 4px rgba(0,0,0,0.02)',
                    borderColor: isHovered ? '#000000' : '#E2E8F0',
                    transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                    transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={() => setHoveredTweetIdx(idx)}
                  onMouseLeave={() => setHoveredTweetIdx(null)}
                >
                  {/* Small Tweet Author Row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <SocialAvatar
                      src={profileImage}
                      name={displayName}
                      platform="twitter"
                      size={24}
                      borderColor="#000000"
                    />
                    <div style={{ minWidth: 0, flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.78rem', color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {displayName}
                      </span>
                      {dateStr && <span style={{ fontSize: '0.68rem', color: '#64748B', flexShrink: 0 }}>• {dateStr}</span>}
                    </div>
                  </div>

                  {/* Tweet Body Text */}
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.78rem',
                      color: '#0F172A',
                      lineHeight: '1.4',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: isHovered ? 5 : 2,
                      WebkitBoxOrient: 'vertical',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {tweetText}
                  </p>

                  {/* Metrics Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: '0.72rem', color: '#64748B', fontWeight: 600, marginTop: 2 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      💬 {formatStatCount(replies)}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      🔁 {formatStatCount(retweets)}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      ❤️ {formatStatCount(likes)}
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        ) : (
          <SocialEmptyState platform="twitter" />
        )}
      </div>

      {/* Footer Timestamp */}
      <SocialFooterBar lastFetched={lastFetched} isFailedScrape={isFailed} />

      {/* Open Twitter / X CTA */}
      <a
        href={profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex',
          alignItems: 'center',
          justify: 'center',
          gap: 6,
          background: '#000000',
          color: '#FFFFFF',
          textDecoration: 'none',
          padding: '8px 14px',
          borderRadius: 12,
          fontWeight: 700,
          fontSize: '0.84rem',
          textAlign: 'center',
          marginTop: 6,
          boxShadow: '0 3px 12px rgba(0,0,0,0.25)',
          transition: 'transform 0.15s ease, boxShadow 0.15s ease',
          flexShrink: 0
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
      >
        Open Twitter / X ↗
      </a>
    </div>
  );
}
