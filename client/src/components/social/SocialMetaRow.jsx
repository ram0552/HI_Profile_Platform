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
  platform = '',
  avatarSize = 44
}) {
  const cleanUsername = sanitizeUsername(username);
  const name = displayName || cleanUsername;
  const brandColor = getSocialBrandColor(platform);
  const metaText = headline || location;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, width: '100%', flexShrink: 0 }}>
      <SocialAvatar
        src={profileImage}
        name={name}
        platform={platform}
        size={avatarSize}
        borderColor={brandColor}
      />
      <div style={{ flexGrow: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'nowrap' }}>
          <h4
            style={{
              margin: 0,
              fontWeight: 800,
              fontSize: '0.98rem',
              color: '#0F172A',
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
                fontSize: '0.85rem',
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
        <span style={{ fontSize: '0.78rem', color: '#64748B', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontWeight: 500 }}>
          @{cleanUsername}
        </span>
        {metaText && (
          <span style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', marginTop: 1, fontWeight: 500 }}>
            {location && !headline ? `📍 ${location}` : metaText}
          </span>
        )}
      </div>
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          background: brandColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          fontSize: '1.1rem',
          flexShrink: 0,
          boxShadow: `0 4px 12px ${brandColor}40`
        }}
        title={`${platform} profile`}
      >
        {getSocialIcon(platform, 18, '#FFFFFF')}
      </div>
    </div>
  );
}
