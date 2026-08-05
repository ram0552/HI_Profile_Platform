import SocialMetaRow from './SocialMetaRow';
import SocialStatBar from './SocialStatBar';
import SocialFooterBar from './SocialFooterBar';
import { isLikelyFailedScrape, formatRelativeTime } from '../../utils/socialHelpers';

export default function GitHubWidget({ block, socialProfile }) {
  const sp = socialProfile || block.socialProfile || {};
  const config = block.configuration || {};

  const username = sp.username || config.username || config.handle || 'octocat';
  const displayName = sp.displayName || username;
  const profileImage = sp.profileImage || `https://github.com/${username}.png`;
  const location = sp.location || '';
  const followers = sp.followers !== undefined ? sp.followers : 0;
  const following = sp.following !== undefined ? sp.following : 0;
  const reposCount = sp.posts !== undefined ? sp.posts : 0;
  const bio = sp.description || 'No bio available.';
  const profileUrl = sp.profileUrl || `https://github.com/${username}`;
  const lastFetched = sp.lastFetched || null;
  const isFailed = isLikelyFailedScrape(sp);

  const recentRepos = (sp.recentContent && sp.recentContent.length > 0)
    ? sp.recentContent
    : (sp.rawData?.recentRepos || []);

  const stats = [
    { label: 'Repos', value: reposCount },
    { label: 'Followers', value: followers },
    { label: 'Following', value: following }
  ];

  const getLanguageColor = (lang = '') => {
    const map = {
      javascript: '#F1E05A',
      typescript: '#3178C6',
      python: '#3572A5',
      html: '#E34C26',
      css: '#563D7C',
      java: '#B07219',
      c: '#555555',
      go: '#00ADD8',
      rust: '#DEA584'
    };
    return map[(lang || '').toLowerCase()] || '#8B5CF6';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <SocialMetaRow
        displayName={displayName}
        username={username}
        profileImage={profileImage}
        location={location}
        platform="github"
      />

      {/* Stats */}
      <SocialStatBar stats={stats} />

      {/* Bio */}
      <p style={{ margin: '0 0 10px', fontSize: '0.85rem', color: '#334155', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
        {bio}
      </p>

      {/* Recent Repos */}
      <div style={{ flexGrow: 1, overflowY: 'auto', marginBottom: 8 }}>
        {recentRepos.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {recentRepos.slice(0, 2).map((repo, idx) => (
              <a
                key={idx}
                href={repo.contentUrl || repo.url || `https://github.com/${username}/${repo.title || repo.name}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none', color: 'inherit', background: '#F8FAFC', padding: '6px 10px', borderRadius: 8, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 2 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#2563EB', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    📁 {repo.title || repo.name}
                  </span>
                  {repo.language && (
                    <span style={{ fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: 4, background: '#DBEAFE', color: '#1E40AF', padding: '1px 5px', borderRadius: 4, fontWeight: 600 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: getLanguageColor(repo.language) }} />
                      {repo.language}
                    </span>
                  )}
                </div>
                {repo.description && (
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {repo.description}
                  </p>
                )}
                <div style={{ display: 'flex', gap: 10, fontSize: '0.7rem', color: '#64748B', fontWeight: 600, marginTop: 2 }}>
                  <span>⭐ {repo.stars || 0}</span>
                  <span>🍴 {repo.forks || 0}</span>
                  {repo.publishedAt && <span>• {formatRelativeTime(repo.publishedAt)}</span>}
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div style={{ padding: 10, background: '#F8FAFC', borderRadius: 8, border: '1px dashed #CBD5E1', textAlign: 'center', color: '#94A3B8', fontSize: '0.8rem' }}>
            No public repositories available.
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
          background: '#24292E',
          color: '#FFFFFF',
          textDecoration: 'none',
          padding: '7px 12px',
          borderRadius: 10,
          fontWeight: 700,
          fontSize: '0.82rem',
          textAlign: 'center',
          marginTop: 6,
          boxShadow: '0 2px 8px rgba(36,41,46,0.2)'
        }}
      >
        Open GitHub ↗
      </a>
    </div>
  );
}
