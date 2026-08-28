import React from 'react';
import SocialAvatar from './SocialAvatar';
import { getSocialIcon, getSocialBrandColor } from '../SocialIcons';
import { sanitizeUsername } from '../../utils/socialHelpers';

export default function SocialMetaRow({
  displayName = '',
  username = '',
  profileImage = '',
  verified = false,
  headline = '',
  location = '',
  company = '',
  platform = '',
  avatarSize = 44,
  compact = false
}) {
  const cleanUsername = sanitizeUsername(username);
  const name = displayName || cleanUsername;
  const brandColor = getSocialBrandColor(platform);

  let headlinePart = headline || '';
  if (company && !headlinePart.toLowerCase().includes(company.toLowerCase())) {
    headlinePart = headlinePart ? `${headlinePart} @ ${company}` : company;
  }

  let metaText = headlinePart;
  if (!metaText && location) {
    metaText = `📍 ${location}`;
  } else if (metaText && location && !compact) {
    metaText = `${metaText} • 📍 ${location}`;
  }

  const actualAvatarSize = compact ? 34 : avatarSize;
  const brandBadgeSize = compact ? 28 : 34;
  const brandIconSize = compact ? 14 : 18;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: compact ? 8 : 12, marginBottom: compact ? 6 : 12, width: '100%', flexShrink: 0 }}>
      <SocialAvatar
        src={profileImage}
        name={name}
        platform={platform}
        size={actualAvatarSize}
        borderColor={brandColor}
      />
      <div style={{ flexGrow: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'nowrap' }}>
          <h4
            style={{
              margin: 0,
              fontWeight: 800,
              fontSize: compact ? '0.85rem' : '0.98rem',
              color: 'var(--bento-text-primary, #0F172A)',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              letterSpacing: '-0.01em'
            }}
            title={name}
          >
            {name}
          </h4>
          {verified && (
            <span
              style={{
                color: platform === 'twitter' ? '#1DA1F2' : (platform === 'instagram' ? '#3897F0' : '#4F46E5'),
                fontSize: compact ? '0.75rem' : '0.85rem',
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center'
              }}
              title="Verified Profile"
            >
              ☑️
            </span>
          )}
        </div>
        <span style={{ fontSize: compact ? '0.72rem' : '0.78rem', color: 'var(--bento-text-secondary, #64748B)', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontWeight: 500 }}>
          @{cleanUsername}
        </span>
        {!compact && metaText && (
          <span
            style={{ fontSize: '0.72rem', color: 'var(--bento-text-secondary, #94A3B8)', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', marginTop: 1, fontWeight: 500 }}
            title={metaText}
          >
            {metaText}
          </span>
        )}
      </div>
      <div
        style={{
          width: brandBadgeSize,
          height: brandBadgeSize,
          borderRadius: compact ? 8 : 10,
          background: brandColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          fontSize: compact ? '0.9rem' : '1.1rem',
          flexShrink: 0,
          boxShadow: `0 4px 12px ${brandColor}40`
        }}
        title={`${platform} profile`}
      >
        {getSocialIcon(platform, brandIconSize, '#FFFFFF')}
      </div>
    </div>
  );
}
