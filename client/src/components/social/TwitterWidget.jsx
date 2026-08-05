import SocialMetaRow from './SocialMetaRow';
import SocialStatBar from './SocialStatBar';
import SocialFooterBar from './SocialFooterBar';
import { isLikelyFailedScrape, formatRelativeTime } from '../../utils/socialHelpers';

export default function TwitterWidget({ block, socialProfile }) {
  const sp = socialProfile || block.socialProfile || {};
  const config = block.configuration || {};

  const username = sp.username || config.username || config.handle || 'user';
  const displayName = sp.displayName || username;
  const profileImage = sp.profileImage || '';
  const verified = sp.verified || false;
  const followers = sp.followers !== undefined ? sp.followers : 0;
  const following = sp.following !== undefined ? sp.following : 0;
  const tweetsCount = sp.posts !== undefined ? sp.posts : 0;
  const bio = sp.description || 'No bio available.';
  const profileUrl = sp.profileUrl || `https://x.com/${username}`;
  const lastFetched = sp.lastFetched || null;
  const isFailed = isLikelyFailedScrape(sp);

  const recentTweets = (sp.recentContent && sp.recentContent.length > 0)
    ? sp.recentContent
    : (sp.rawData?.recentPosts || []);

  const stats = [
    { label: 'Followers', value: followers },
    { label: 'Following', value: following },
    { label: 'Tweets', value: tweetsCount }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <SocialMetaRow
        displayName={displayName}
        username={username}
        profileImage={profileImage}
        verified={verified}
        platform="twitter"
      />

      {/* Stats */}
      <SocialStatBar stats={stats} />

      {/* Bio */}
      <p style={{ margin: '0 0 10px', fontSize: '0.85rem', color: '#334155', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
        {bio}
      </p>

      {/* Recent Content */}
      <div style={{ flexGrow: 1, overflowY: 'auto', marginBottom: 8 }}>
        {recentTweets.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {recentTweets.slice(0, 2).map((tweet, idx) => (
              <a
                key={tweet.id || idx}
                href={tweet.contentUrl || tweet.postUrl || profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none', color: 'inherit', background: '#F8FAFC', padding: '6px 10px', borderRadius: 8, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 2 }}
              >
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {tweet.text || 'Tweet'}
                </p>
                <div style={{ display: 'flex', gap: 10, fontSize: '0.7rem', color: '#64748B', fontWeight: 600, marginTop: 2 }}>
                  <span>❤️ {tweet.likesCount || 0}</span>
                  <span>🔁 {tweet.sharesCount || 0}</span>
                  <span>💬 {tweet.commentsCount || 0}</span>
                  {tweet.publishedAt && <span>• {formatRelativeTime(tweet.publishedAt)}</span>}
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div style={{ padding: 10, background: '#F8FAFC', borderRadius: 8, border: '1px dashed #CBD5E1', textAlign: 'center', color: '#94A3B8', fontSize: '0.8rem' }}>
            No recent tweets available.
          </div>
        )}
      </div>

      {/* Footer */}
      <SocialFooterBar lastFetched={lastFetched} isFailedScrape={isFailed} />

      {/* Button */}
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
          padding: '7px 12px',
          borderRadius: 10,
          fontWeight: 700,
          fontSize: '0.82rem',
          textAlign: 'center',
          marginTop: 6,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
        }}
      >
        Open Twitter / X ↗
      </a>
    </div>
  );
}
