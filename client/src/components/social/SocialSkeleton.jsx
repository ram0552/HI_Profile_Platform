import React from 'react';

export default function SocialSkeleton({ platform = 'instagram' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', fontFamily: 'Inter, sans-serif', padding: 4 }}>
      {/* Header Skeleton */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{ width: 46, height: 46, borderRadius: '50%', background: '#E2E8F0', flexShrink: 0, animation: 'pulse 1.5s infinite' }} />
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ width: '60%', height: 16, background: '#E2E8F0', borderRadius: 4, animation: 'pulse 1.5s infinite' }} />
          <div style={{ width: '40%', height: 12, background: '#F1F5F9', borderRadius: 4, animation: 'pulse 1.5s infinite' }} />
        </div>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#E2E8F0', animation: 'pulse 1.5s infinite' }} />
      </div>

      {/* Stats Skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, background: '#F8FAFC', padding: 8, borderRadius: 12, marginBottom: 12 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ height: 32, background: '#E2E8F0', borderRadius: 6, animation: 'pulse 1.5s infinite' }} />
        ))}
      </div>

      {/* Bio Skeleton */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
        <div style={{ width: '90%', height: 12, background: '#F1F5F9', borderRadius: 4, animation: 'pulse 1.5s infinite' }} />
        <div style={{ width: '70%', height: 12, background: '#F1F5F9', borderRadius: 4, animation: 'pulse 1.5s infinite' }} />
      </div>

      {/* Content Grid Skeleton */}
      <div style={{ flexGrow: 1, display: 'grid', gridTemplateColumns: platform === 'instagram' ? 'repeat(3, 1fr)' : '1fr', gap: 8, marginBottom: 12 }}>
        {(platform === 'instagram' ? [1, 2, 3, 4, 5, 6] : [1, 2, 3]).map(i => (
          <div key={i} style={{ height: platform === 'instagram' ? 70 : 48, background: '#E2E8F0', borderRadius: 8, animation: 'pulse 1.5s infinite' }} />
        ))}
      </div>

      {/* Footer Button Skeleton */}
      <div style={{ width: '100%', height: 36, background: '#E2E8F0', borderRadius: 10, animation: 'pulse 1.5s infinite' }} />

      <style>{`
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
