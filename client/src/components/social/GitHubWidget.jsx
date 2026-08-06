import React, { useState } from 'react';
import SocialMetaRow from './SocialMetaRow';
import SocialStatBar from './SocialStatBar';
import SocialFooterBar from './SocialFooterBar';
import SocialSkeleton from './SocialSkeleton';
import SocialEmptyState from './SocialEmptyState';
import SocialErrorState from './SocialErrorState';
import { isLikelyFailedScrape, formatRelativeTime, formatStatCount, extractRecentPosts } from '../../utils/socialHelpers';

export default function GitHubWidget({ block, socialProfile, loading = false, error = null, onRetry }) {
  const [expandedBio, setExpandedBio] = useState(false);
  const sp = socialProfile || block?.socialProfile || {};
  const config = block?.configuration || {};

  if (loading) {
    return <SocialSkeleton platform="github" />;
  }

  if (error) {
    return <SocialErrorState onRetry={onRetry} message={error} />;
  }

  const username = sp.username || config.username || config.handle || 'octocat';
  const displayName = sp.displayName || username;
  const profileImage = sp.profileImage || `https://github.com/${username}.png`;
  const location = sp.location || '';
  const followers = sp.followers !== undefined ? sp.followers : 0;
  const following = sp.following !== undefined ? sp.following : 0;
  const reposCount = sp.posts !== undefined ? sp.posts : 0;
  const bio = sp.description || '';
  const profileUrl = sp.profileUrl || `https://github.com/${username}`;
  const lastFetched = sp.lastFetched || null;
  const isFailed = isLikelyFailedScrape(sp);

  const recentRepos = extractRecentPosts(sp, block);

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
      'c++': '#F34B7D',
      'c#': '#178600',
      go: '#00ADD8',
      rust: '#DEA584',
      php: '#4F5D95',
      ruby: '#701516',
      swift: '#F05138',
      kotlin: '#A97BFF',
      dart: '#00B4AB',
      vue: '#41B883',
      shell: '#89E051'
    };
    return map[(lang || '').toLowerCase()] || '#8B5CF6';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }}>
      {/* Header */}
      <SocialMetaRow
        displayName={displayName}
        username={username}
        profileImage={profileImage}
        location={location}
        platform="github"
      />

      {/* Stats */}
      <SocialStatBar stats={stats} accentColor="#24292F" />

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
                color: '#2563EB',
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

      {/* Rich Content Section — Latest 3 Repositories */}
      <div style={{ flexGrow: 1, overflowY: 'auto', marginBottom: 8, minHeight: 0 }}>
        {recentRepos.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentRepos.slice(0, 3).map((repo, idx) => {
              const repoName = repo.title || repo.name || 'repository';
              const repoUrl = repo.contentUrl || repo.url || `https://github.com/${username}/${repoName}`;
              const langColor = getLanguageColor(repo.language);
              const repoDateRaw = repo.publishedAt || repo.updatedAt || repo.date || '';

              return (
                <a
                  key={idx}
                  href={repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    textDecoration: 'none',
                    color: 'inherit',
                    background: '#FFFFFF',
                    padding: '8px 12px',
                    borderRadius: 12,
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                    transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)';
                    e.currentTarget.style.borderColor = '#93C5FD';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
                    e.currentTarget.style.borderColor = '#E2E8F0';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                      <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>📁</span>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          color: '#0969DA',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {repoName}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      {repo.language && (
                        <span
                          style={{
                            fontSize: '0.68rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            background: '#F1F5F9',
                            color: '#334155',
                            padding: '2px 7px',
                            borderRadius: 12,
                            fontWeight: 600,
                            border: '1px solid #E2E8F0'
                          }}
                        >
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: langColor }} />
                          {repo.language}
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: '0.65rem',
                          color: '#57606A',
                          background: '#F6F8FA',
                          border: '1px solid #D0D7DE',
                          padding: '1px 6px',
                          borderRadius: 10,
                          fontWeight: 600
                        }}
                      >
                        Public
                      </span>
                    </div>
                  </div>

                  {repo.description && (
                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.76rem',
                        color: '#57606A',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        lineHeight: 1.35
                      }}
                    >
                      {repo.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.72rem', color: '#6E7781', fontWeight: 600, marginTop: 2 }}>
                    <span>⭐ {formatStatCount(repo.stars || 0)}</span>
                    <span>🍴 {formatStatCount(repo.forks || 0)}</span>
                    {repoDateRaw && (
                      <span style={{ marginLeft: 'auto', fontSize: '0.68rem', color: '#8C959F' }}>
                        Updated {formatRelativeTime(repoDateRaw)}
                      </span>
                    )}
                  </div>
                </a>
              );
            })}
          </div>
        ) : (
          <SocialEmptyState platform="github" />
        )}
      </div>

      {/* Footer Timestamp */}
      <SocialFooterBar lastFetched={lastFetched} isFailedScrape={isFailed} />

      {/* Open GitHub CTA */}
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
          padding: '8px 14px',
          borderRadius: 12,
          fontWeight: 700,
          fontSize: '0.84rem',
          textAlign: 'center',
          marginTop: 6,
          boxShadow: '0 3px 12px rgba(36,41,46,0.25)',
          transition: 'transform 0.15s ease, boxShadow 0.15s ease',
          flexShrink: 0
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
      >
        Open GitHub ↗
      </a>
    </div>
  );
}
