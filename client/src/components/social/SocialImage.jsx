import { useState } from 'react';

/**
 * Image component with lazy loading, skeleton placeholder, and fallback handling
 */
export default function SocialImage({ src, alt = '', className = '', style = {}, fallbackText = '📷' }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div
        className={className}
        style={{
          background: '#F1F5F9',
          color: '#94A3B8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.2rem',
          fontWeight: 'bold',
          ...style
        }}
      >
        {fallbackText}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', overflow: 'hidden', ...style }} className={className}>
      {!loaded && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
            zIndex: 1
          }}
        />
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out',
          display: 'block'
        }}
      />
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
