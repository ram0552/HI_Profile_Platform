import React, { useState, useEffect, useRef } from 'react';
import SocialMetaRow from './SocialMetaRow';
import SocialStatBar from './SocialStatBar';
import SocialFooterBar from './SocialFooterBar';
import SocialAvatar from './SocialAvatar';
import SocialSkeleton from './SocialSkeleton';
import SocialEmptyState from './SocialEmptyState';
import SocialErrorState from './SocialErrorState';
import { getSocialIcon, getSocialBrandColor } from '../SocialIcons';
import { formatStatCount, sanitizeUsername } from '../../utils/socialHelpers';

export function useSocialContainerDimensions(block) {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({
    w: block?.w || block?.layout?.w || 2,
    h: block?.h || block?.layout?.h || 2,
    width: 300,
    height: 300
  });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({
          w: block?.w || block?.layout?.w || 2,
          h: block?.h || block?.layout?.h || 2,
          width,
          height
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [block?.w, block?.h, block?.layout?.w, block?.layout?.h]);

  return { containerRef, ...dimensions };
}

export default function SocialWidgetLayout({
  block,
  platform = '',
  displayName = '',
  username = '',
  profileImage = '',
  verified = false,
  headline = '',
  location = '',
  company = '',
  stats = [],
  bio = '',
  profileUrl = '',
  lastFetched = null,
  isFailedScrape = false,
  accentColor,
  recentContent = [],
  renderRecentItem,
  emptyText,
  loading = false,
  error = null,
  onRetry
}) {
  const [expandedBio, setExpandedBio] = useState(false);
  const { containerRef, w, h, width, height } = useSocialContainerDimensions(block);

  if (loading) return <SocialSkeleton platform={platform} />;
  if (error) return <SocialErrorState onRetry={onRetry} message={error} />;

  const brandColor = accentColor || getSocialBrandColor(platform);
  const cleanUsername = sanitizeUsername(username);
  const name = displayName || cleanUsername;
  const safeProfileUrl = profileUrl ? (profileUrl.startsWith('http') ? profileUrl : `https://${profileUrl}`) : '#';

  // Responsive Tier Detection
  const gridW = block?.w || block?.layout?.w || w || 2;
  const gridH = block?.h || block?.layout?.h || h || 2;

  const isSmall = (gridW <= 1 && gridH <= 1) || (width <= 210 && height <= 185);
  const isMediumWide = !isSmall && ((gridW >= 2 && gridH <= 1) || (width > 210 && height <= 185));
  const isMediumTall = !isSmall && !isMediumWide && ((gridW <= 1 && gridH >= 2) || (width <= 210 && height > 185));

  // Primary Stat for Small 1x1 mode
  const primaryStat = stats[0] || { label: 'Followers', value: 0 };
  const formattedPrimaryVal = formatStatCount(primaryStat.value !== undefined ? primaryStat.value : 0);

  // TIER 1: Small Mode (1 x 1 Grid)
  if (isSmall) {
    return (
      <div
        ref={containerRef}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '100%',
          width: '100%',
          boxSizing: 'border-box',
          padding: '2px 0',
          textAlign: 'center',
          fontFamily: 'Inter, sans-serif',
          overflow: 'hidden'
        }}
      >
        {/* Avatar with Platform Badge */}
        <div style={{ position: 'relative', width: 40, height: 40, flexShrink: 0, marginTop: 2 }}>
          <SocialAvatar src={profileImage} name={name} platform={platform} size={40} borderColor={brandColor} />
          <div
            style={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              width: 17,
              height: 17,
              borderRadius: '50%',
              background: brandColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
              border: '1.5px solid #FFFFFF'
            }}
          >
            {getSocialIcon(platform, 10, '#FFFFFF')}
          </div>
        </div>

        {/* Display Name & Handle */}
        <div style={{ width: '100%', overflow: 'hidden', padding: '0 2px' }}>
          <div
            style={{
              fontWeight: 800,
              fontSize: '0.8rem',
              color: '#0F172A',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: 1.2
            }}
            title={name}
          >
            {name}
          </div>
          <div
            style={{
              fontSize: '0.68rem',
              color: '#64748B',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontWeight: 500,
              marginTop: 1
            }}
          >
            @{cleanUsername}
          </div>
        </div>

        {/* Core Primary Metric Badge */}
        <a
          href={safeProfileUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            background: '#F8FAFC',
            border: `1px solid ${brandColor}35`,
            borderRadius: 8,
            padding: '3px 8px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            textDecoration: 'none',
            maxWidth: '100%',
            boxSizing: 'border-box',
            flexShrink: 0
          }}
        >
          <span style={{ fontWeight: 800, fontSize: '0.74rem', color: '#0F172A' }}>
            {formattedPrimaryVal}
          </span>
          <span style={{ fontSize: '0.6rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
            {primaryStat.label}
          </span>
        </a>
      </div>
    );
  }

  // TIER 2: Medium Wide Mode (2 x 1 Grid)
  if (isMediumWide) {
    return (
      <div
        ref={containerRef}
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100%',
          width: '100%',
          boxSizing: 'border-box',
          fontFamily: 'Inter, sans-serif',
          overflow: 'hidden',
          padding: '1px 0'
        }}
      >
        {/* Compact Header */}
        <SocialMetaRow
          displayName={name}
          username={cleanUsername}
          profileImage={profileImage}
          verified={verified}
          platform={platform}
          compact={true}
        />

        {/* Compact Stat Bar */}
        <div style={{ flexShrink: 0 }}>
          <SocialStatBar stats={stats} accentColor={brandColor} compact={true} />
        </div>
      </div>
    );
  }

  // TIER 3: Medium Tall Mode (1 x 2 Grid)
  if (isMediumTall) {
    return (
      <div
        ref={containerRef}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '100%',
          width: '100%',
          boxSizing: 'border-box',
          fontFamily: 'Inter, sans-serif',
          textAlign: 'center',
          overflow: 'hidden',
          padding: '2px 0',
          gap: 4
        }}
      >
        <SocialAvatar src={profileImage} name={name} platform={platform} size={44} borderColor={brandColor} />

        <div style={{ width: '100%', overflow: 'hidden' }}>
          <div style={{ fontWeight: 800, fontSize: '0.86rem', color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={name}>
            {name}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
            @{cleanUsername}
          </div>
        </div>

        <div style={{ width: '100%' }}>
          <SocialStatBar stats={stats} accentColor={brandColor} compact={true} />
        </div>

        {bio && (
          <p style={{ margin: 0, fontSize: '0.74rem', color: '#475569', lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {bio}
          </p>
        )}

        <a
          href={safeProfileUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            background: brandColor,
            color: '#FFFFFF',
            textDecoration: 'none',
            padding: '6px 10px',
            borderRadius: 10,
            fontWeight: 700,
            fontSize: '0.78rem',
            flexShrink: 0
          }}
        >
          Open Profile ↗
        </a>
      </div>
    );
  }

  // TIER 4: Large Mode (2 x 2, 2 x 3, 3 x 2, 4 x 2, etc.)
  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        justifyContent: 'space-between',
        fontFamily: 'Inter, sans-serif',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}
    >
      {/* Fixed Header */}
      <SocialMetaRow
        displayName={name}
        username={cleanUsername}
        profileImage={profileImage}
        verified={verified}
        headline={headline}
        location={location}
        company={company}
        platform={platform}
      />

      {/* Metric Stats */}
      <SocialStatBar stats={stats} accentColor={brandColor} />

      {/* Bio Paragraph */}
      {bio && (
        <div style={{ marginBottom: 8, flexShrink: 0 }}>
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
                color: brandColor,
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

      {/* Rich Content List */}
      <div style={{ flexGrow: 1, overflowY: 'auto', marginBottom: 8, minHeight: 0 }}>
        {recentContent && recentContent.length > 0 && renderRecentItem ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentContent.slice(0, 3).map((item, idx) => renderRecentItem(item, idx))}
          </div>
        ) : (
          <SocialEmptyState platform={platform} message={emptyText} />
        )}
      </div>

      {/* Footer Timestamp */}
      <SocialFooterBar lastFetched={lastFetched} isFailedScrape={isFailedScrape} />

      {/* Open Platform CTA */}
      <a
        href={safeProfileUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          background: brandColor,
          color: '#FFFFFF',
          textDecoration: 'none',
          padding: '8px 14px',
          borderRadius: 12,
          fontWeight: 700,
          fontSize: '0.84rem',
          textAlign: 'center',
          marginTop: 6,
          boxShadow: `0 3px 12px ${brandColor}35`,
          transition: 'transform 0.15s ease',
          flexShrink: 0,
          cursor: 'pointer'
        }}
      >
        Open {platform.charAt(0).toUpperCase() + platform.slice(1)} ↗
      </a>
    </div>
  );
}
