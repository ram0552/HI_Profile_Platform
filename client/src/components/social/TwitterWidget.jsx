import React from 'react';
import SocialWidgetLayout from './SocialWidgetLayout';
import SocialAvatar from './SocialAvatar';
import { isLikelyFailedScrape, formatRelativeTime, formatStatCount, extractRecentPosts } from '../../utils/socialHelpers';

export default function TwitterWidget({ block, socialProfile, loading = false, error = null, onRetry }) {
  const sp = socialProfile || block?.socialProfile || {};
  const config = block?.configuration || {};

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

  const renderTweetItem = (tweet, idx) => {
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
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
          transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)',
          cursor: 'pointer'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SocialAvatar src={profileImage} name={displayName} platform="twitter" size={24} borderColor="#000000" />
          <div style={{ minWidth: 0, flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, fontSize: '0.78rem', color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayName}
            </span>
            {dateStr && <span style={{ fontSize: '0.68rem', color: '#64748B', flexShrink: 0 }}>• {dateStr}</span>}
          </div>
        </div>

        <p style={{ margin: 0, fontSize: '0.78rem', color: '#0F172A', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {tweetText}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: '0.72rem', color: '#64748B', fontWeight: 600, marginTop: 2 }}>
          <span>💬 {formatStatCount(replies)}</span>
          <span>🔁 {formatStatCount(retweets)}</span>
          <span>❤️ {formatStatCount(likes)}</span>
        </div>
      </a>
    );
  };

  return (
    <SocialWidgetLayout
      block={block}
      platform="twitter"
      displayName={displayName}
      username={username}
      profileImage={profileImage}
      verified={verified}
      stats={stats}
      bio={bio}
      profileUrl={profileUrl}
      lastFetched={lastFetched}
      isFailedScrape={isFailed}
      accentColor="#1DA1F2"
      recentContent={recentTweets}
      renderRecentItem={renderTweetItem}
      loading={loading}
      error={error}
      onRetry={onRetry}
    />
  );
}
