import SocialMetaRow from './SocialMetaRow';
import SocialStatBar from './SocialStatBar';
import SocialFooterBar from './SocialFooterBar';
import { isLikelyFailedScrape, formatRelativeTime } from '../../utils/socialHelpers';

export default function LinkedInWidget({ block, socialProfile }) {
  const sp = socialProfile || block.socialProfile || {};
  const config = block.configuration || {};

  const username = sp.username || config.username || config.handle || 'user';
  const displayName = sp.displayName || username;
  const profileImage = sp.profileImage || '';
  const headline = sp.headline || sp.description || '';
  const location = sp.location || '';
  const followers = sp.followers !== undefined ? sp.followers : 0;
  const following = sp.following !== undefined ? sp.following : 500;
  const bio = sp.description || headline || 'No summary available.';
  const profileUrl = sp.profileUrl || `https://www.linkedin.com/in/${username}`;
  const lastFetched = sp.lastFetched || null;
  const isFailed = isLikelyFailedScrape(sp);

  const recentPosts = (sp.recentContent && sp.recentContent.length > 0)
    ? sp.recentContent
    : (sp.rawData?.profile?.recentPosts || []);

  const stats = [
    { label: 'Followers', value: followers },
    { label: 'Connections', value: following }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <SocialMetaRow
        displayName={displayName}
        username={username}
        profileImage={profileImage}
        headline={headline}
        location={location}
        platform="linkedin"
      />

      {/* Stats */}
      <SocialStatBar stats={stats} />

      {/* Bio / About */}
      <p style={{ margin: '0 0 10px', fontSize: '0.85rem', color: '#334155', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
        {bio}
      </p>

      {/* Recent Posts */}
      <div style={{ flexGrow: 1, overflowY: 'auto', marginBottom: 8 }}>
        {recentPosts.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {recentPosts.slice(0, 2).map((post, idx) => (
              <a
                key={idx}
                href={post.contentUrl || profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none', color: 'inherit', background: '#F8FAFC', padding: '6px 10px', borderRadius: 8, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 2 }}
              >
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {post.text || post.caption || 'LinkedIn Post'}
                </p>
                <div style={{ display: 'flex', gap: 10, fontSize: '0.7rem', color: '#64748B', fontWeight: 600, marginTop: 2 }}>
                  <span>👍 {post.likesCount || 0}</span>
                  <span>💬 {post.commentsCount || 0}</span>
                  {post.publishedAt && <span>• {formatRelativeTime(post.publishedAt)}</span>}
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div style={{ padding: 10, background: '#F8FAFC', borderRadius: 8, border: '1px dashed #CBD5E1', textAlign: 'center', color: '#94A3B8', fontSize: '0.8rem' }}>
            No recent LinkedIn posts available.
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
          background: '#0A66C2',
          color: '#FFFFFF',
          textDecoration: 'none',
          padding: '7px 12px',
          borderRadius: 10,
          fontWeight: 700,
          fontSize: '0.82rem',
          textAlign: 'center',
          marginTop: 6,
          boxShadow: '0 2px 8px rgba(10,102,194,0.2)'
        }}
      >
        Open LinkedIn ↗
      </a>
    </div>
  );
}
