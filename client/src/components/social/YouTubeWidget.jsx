import SocialMetaRow from './SocialMetaRow';
import SocialStatBar from './SocialStatBar';
import SocialFooterBar from './SocialFooterBar';
import SocialImage from './SocialImage';
import { isLikelyFailedScrape, formatRelativeTime, formatStatCount } from '../../utils/socialHelpers';

export default function YouTubeWidget({ block, socialProfile }) {
  const sp = socialProfile || block.socialProfile || {};
  const config = block.configuration || {};

  const username = sp.username || config.username || config.handle || 'channel';
  const displayName = sp.displayName || username;
  const profileImage = sp.profileImage || '';
  const subscribers = sp.followers !== undefined ? sp.followers : 0;
  const videosCount = sp.posts !== undefined ? sp.posts : 0;
  const bio = sp.description || 'No description available.';
  const profileUrl = sp.profileUrl || `https://www.youtube.com/@${username}`;
  const lastFetched = sp.lastFetched || null;
  const isFailed = isLikelyFailedScrape(sp);

  const recentVideos = (sp.recentContent && sp.recentContent.length > 0)
    ? sp.recentContent
    : (sp.rawData?.recentVideos || []);

  const stats = [
    { label: 'Subscribers', value: subscribers },
    { label: 'Videos', value: videosCount }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <SocialMetaRow
        displayName={displayName}
        username={username}
        profileImage={profileImage}
        platform="youtube"
      />

      {/* Stats */}
      <SocialStatBar stats={stats} />

      {/* Description */}
      <p style={{ margin: '0 0 10px', fontSize: '0.85rem', color: '#334155', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
        {bio}
      </p>

      {/* Recent Videos */}
      <div style={{ flexGrow: 1, overflowY: 'auto', marginBottom: 8 }}>
        {recentVideos.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {recentVideos.slice(0, 2).map((vid, idx) => (
              <a
                key={idx}
                href={vid.contentUrl || vid.url || profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none', color: 'inherit', background: '#F8FAFC', padding: '6px 8px', borderRadius: 8, border: '1px solid #E2E8F0', display: 'flex', gap: 8, alignItems: 'center' }}
              >
                <div style={{ width: 56, height: 36, borderRadius: 6, overflow: 'hidden', flexShrink: 0, position: 'relative', background: '#000' }}>
                  <SocialImage src={vid.imageUrl} alt={vid.title} style={{ width: '100%', height: '100%' }} />
                </div>
                <div style={{ flexGrow: 1, minWidth: 0 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.78rem', color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
                    {vid.title}
                  </span>
                  <div style={{ display: 'flex', gap: 8, fontSize: '0.68rem', color: '#64748B', marginTop: 1 }}>
                    {vid.viewsCount !== undefined && vid.viewsCount !== null && (
                      <span>👁️ {formatStatCount(vid.viewsCount)} views</span>
                    )}
                    {vid.publishedAt && <span>• {formatRelativeTime(vid.publishedAt)}</span>}
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div style={{ padding: 10, background: '#F8FAFC', borderRadius: 8, border: '1px dashed #CBD5E1', textAlign: 'center', color: '#94A3B8', fontSize: '0.8rem' }}>
            No recent videos available.
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
          background: '#FF0000',
          color: '#FFFFFF',
          textDecoration: 'none',
          padding: '7px 12px',
          borderRadius: 10,
          fontWeight: 700,
          fontSize: '0.82rem',
          textAlign: 'center',
          marginTop: 6,
          boxShadow: '0 2px 8px rgba(255,0,0,0.2)'
        }}
      >
        Open YouTube ↗
      </a>
    </div>
  );
}
