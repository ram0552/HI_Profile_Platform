import React from 'react';
import { formatStatCount } from '../../utils/socialHelpers';

export default function SocialStatBar({ stats = [], accentColor = '#4F46E5', compact = false }) {
  if (!stats || stats.length === 0) return null;

  console.log('[SOCIAL STAT BAR]', { stats });

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.min(stats.length, 3)}, 1fr)`,
        gap: compact ? 4 : 6,
        background: 'var(--bento-accent-light, #F8FAFC)',
        padding: compact ? '3px 4px' : 6,
        borderRadius: compact ? 10 : 14,
        border: '1px solid var(--bento-border-color, #E2E8F0)',
        marginBottom: compact ? 0 : 10,
        width: '100%',
        boxSizing: 'border-box',
        flexShrink: 0
      }}
    >
      {stats.map((item, idx) => {
        const rawVal = item.value !== undefined && item.value !== null ? Number(item.value) : 0;
        const formatted = formatStatCount(rawVal);
        const exact = rawVal.toLocaleString();

        return (
          <div
            key={idx}
            title={`${exact} ${item.label}`}
            style={{
              background: 'var(--bento-surface-bg, #FFFFFF)',
              borderRadius: compact ? 6 : 10,
              padding: compact ? '3px 2px' : '6px 4px',
              textAlign: 'center',
              border: '1px solid var(--bento-border-color, #F1F5F9)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              transition: 'transform 0.15s ease, border-color 0.15s ease',
              cursor: 'default'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.borderColor = 'var(--bento-accent, #CBD5E1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--bento-border-color, #F1F5F9)';
            }}
          >
            <div style={{ fontWeight: 800, fontSize: compact ? '0.76rem' : '0.92rem', color: 'var(--bento-text-primary, #0F172A)', fontFamily: 'Inter, monospace', lineHeight: 1.1 }}>
              {formatted}
            </div>
            <div style={{ fontSize: compact ? '0.58rem' : '0.68rem', color: 'var(--bento-text-secondary, #64748B)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.02em', marginTop: compact ? 1 : 2 }}>
              {item.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
