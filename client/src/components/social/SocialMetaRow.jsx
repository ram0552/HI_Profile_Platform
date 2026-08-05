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
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, width: '100%' }}>
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
              fontSize: '1rem',
              color: '#0F172A',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap'
            }}
            title={name}
          >
            {name}
          </h4>
          {verified && (
            <span
              style={{
                color: platform === 'twitter' ? '#1DA1F2' : (platform === 'instagram' ? '#3897F0' : '#4F46E5'),
                fontSize: '0.9rem',
                flexShrink: 0
              }}
              title="Verified Profile"
            >
              ☑️
            </span>
          )}
        </div>
        <span style={{ fontSize: '0.8rem', color: '#64748B', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          @{cleanUsername}
        </span>
        {metaText && (
          <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', marginTop: 1 }}>
            {location && !headline ? `📍 ${location}` : metaText}
          </span>
        )}
      </div>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: brandColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          fontSize: '1.1rem',
          flexShrink: 0
        }}
      >
        {getSocialIcon(platform)}
      </div>
    </div>
  );
}
