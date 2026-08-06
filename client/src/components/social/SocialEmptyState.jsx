import React from 'react';

const EMPTY_CONFIGS = {
  instagram: {
    icon: '📷',
    title: 'No recent posts yet',
    message: 'This profile hasn\'t shared any recent posts.',
    accent: '#E1306C'
  },
  github: {
    icon: '💻',
    title: 'No public repositories',
    message: 'No public repositories available.',
    accent: '#24292F'
  },
  linkedin: {
    icon: '💼',
    title: 'No recent activity',
    message: 'No recent LinkedIn activity or posts shared.',
    accent: '#0A66C2'
  },
  twitter: {
    icon: '🐤',
    title: 'No recent tweets',
    message: 'This profile hasn\'t posted any recent tweets.',
    accent: '#1DA1F2'
  },
  youtube: {
    icon: '▶️',
    title: 'No recent uploads',
    message: 'No public video uploads found on this channel.',
    accent: '#FF0000'
  }
};

export default function SocialEmptyState({ platform = 'instagram', messageOverride, titleOverride }) {
  const config = EMPTY_CONFIGS[platform.toLowerCase()] || {
    icon: '✨',
    title: 'No content available',
    message: 'No recent content found for this profile.',
    accent: '#6366F1'
  };

  const displayTitle = titleOverride || config.title;
  const displayMessage = messageOverride || config.message;

  return (
    <div
      style={{
        padding: '16px 12px',
        background: 'rgba(248, 250, 252, 0.8)',
        borderRadius: 14,
        border: '1.5px dashed #CBD5E1',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        margin: 'auto 0'
      }}
    >
      <div
        style={{
          fontSize: '1.8rem',
          lineHeight: 1,
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}
      >
        {config.icon}
      </div>
      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1E293B', marginTop: 2 }}>
        {displayTitle}
      </div>
      <div style={{ color: '#64748B', fontSize: '0.78rem', maxWidth: 220, lineHeight: 1.4 }}>
        {displayMessage}
      </div>
    </div>
  );
}
