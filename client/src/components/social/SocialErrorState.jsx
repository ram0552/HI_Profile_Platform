import React from 'react';

export default function SocialErrorState({ onRetry, message = 'Content is temporarily unavailable.' }) {
  return (
    <div
      style={{
        padding: '16px 12px',
        background: '#FEF2F2',
        borderRadius: 14,
        border: '1px solid #FCA5A5',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        margin: 'auto 0'
      }}
    >
      <div style={{ fontSize: '1.8rem', lineHeight: 1 }}>⚠️</div>
      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#991B1B' }}>
        {message}
      </div>
      <div style={{ color: '#7F1D1D', fontSize: '0.75rem' }}>
        Pull to refresh or try again later.
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            background: '#EF4444',
            color: '#FFFFFF',
            border: 'none',
            padding: '6px 14px',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: '0.78rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            boxShadow: '0 2px 6px rgba(239,68,68,0.25)',
            marginTop: 4
          }}
        >
          🔄 Try Again
        </button>
      )}
    </div>
  );
}
