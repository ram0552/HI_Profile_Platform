import { useState } from 'react';
import { getInitials, getInitialsColor, resolveSocialImageUrl } from '../../utils/socialHelpers';

export default function SocialAvatar({
  src = '',
  name = '',
  platform = '',
  size = 44,
  borderColor = '#CBD5E1',
  className = '',
  style = {}
}) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const resolvedSrc = resolveSocialImageUrl(src);
  const cleanSrc = (resolvedSrc || '').trim();
  const showFallback = !cleanSrc || error;
  const initials = getInitials(name);
  const bgColor = getInitialsColor(name, platform);

  if (showFallback) {
    return (
      <div
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: bgColor,
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          fontSize: size * 0.4,
          flexShrink: 0,
          border: `2px solid ${borderColor}`,
          userSelect: 'none',
          boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
          ...style
        }}
        title={name}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
        border: `2px solid ${borderColor}`,
        ...style
      }}
    >
      {!loaded && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite'
          }}
        />
      )}
      <img
        src={cleanSrc}
        alt={name}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.25s ease-in-out',
          display: 'block'
        }}
      />
    </div>
  );
}
