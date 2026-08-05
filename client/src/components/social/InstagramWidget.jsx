import SocialMetaRow from './SocialMetaRow';
import SocialStatBar from './SocialStatBar';
import SocialFooterBar from './SocialFooterBar';
import SocialImage from './SocialImage';
import { isLikelyFailedScrape } from '../../utils/socialHelpers';

export default function InstagramWidget({ block, socialProfile }) {
  const sp = socialProfile || block.socialProfile || {};
  const config = block.configuration || {};

  const username = sp.username || config.username || config.handle || 'user';
  const displayName = sp.displayName || username;
  const profileImage = sp.profileImage || '';
  const verified = sp.verified || false;
  const location = sp.location || '';
  const headline = sp.headline || '';
  const followers = sp.followers !== undefined ? sp.followers : 0;
  const following = sp.following !== undefined ? sp.following : 0;
  const posts = sp.posts !== undefined ? sp.posts : 0;
  const bio = sp.description || 'No bio available.';
  const profileUrl = sp.profileUrl || `https://www.instagram.com/${username}/`;
  const lastFetched = sp.lastFetched || null;
  const isFailed = isLikelyFailedScrape(sp);

  const recentPosts = (sp.recentContent && sp.recentContent.length > 0)
    ? sp.recentContent
    : (sp.rawData?.recentPosts || sp.rawData?.profile?.recentPosts || []);

  const stats = [
    { label: 'Followers', value: followers },
    { label: 'Following', value: following },
    { label: 'Posts', value: posts }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', fontFamily: 'Inter, sans-serif' }}>
      {/* Header Meta Row */}
      <SocialMetaRow
        displayName={displayName}
        username={username}
        profileImage={profileImage}
        verified={verified}
        headline={headline}
        location={location}
        platform="instagram"
      />

      {/* Stats Bar */}
      <SocialStatBar stats={stats} />

      {/* Bio */}
      <p style={{ margin: '0 0 10px', fontSize: '0.85rem', color: '#334155', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
        {bio}
      </p>

      {/* Recent Content */}
      <div style={{ flexGrow: 1, overflowY: 'auto', marginBottom: 8 }}>
        {recentPosts.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {recentPosts.slice(0, 3).map((post, idx) => (
              <a
                key={post.id || idx}
                href={post.contentUrl || post.postUrl || profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none', color: 'inherit', display: 'block', borderRadius: 8, overflow: 'hidden', position: 'relative', background: '#F1F5F9', aspectRatio: '1/1' }}
              >
                <SocialImage src={post.imageUrl} alt={post.caption || 'Instagram Post'} style={{ width: '100%', height: '100%' }} />
                <div
                  style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', opacity: 0, transition: 'opacity 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: '#FFF', fontSize: '0.72rem', fontWeight: 700 }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                >
                  <span>❤️ {post.likesCount || 0}</span>
                  <span>💬 {post.commentsCount || 0}</span>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div style={{ padding: 10, background: '#F8FAFC', borderRadius: 8, border: '1px dashed #CBD5E1', textAlign: 'center', color: '#94A3B8', fontSize: '0.8rem' }}>
            No recent posts available.
          </div>
        )}
      </div>

      {/* Footer Bar */}
      <SocialFooterBar lastFetched={lastFetched} isFailedScrape={isFailed} />

      {/* Open Profile Button */}
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
          padding: '7px 12px',
          borderRadius: 10,
          fontWeight: 700,
          fontSize: '0.82rem',
          textAlign: 'center',
          marginTop: 6,
          boxShadow: '0 2px 8px rgba(225,48,108,0.2)'
        }}
      >
        Open Instagram ↗
      </a>
    </div>
  );
}
