import React from 'react';
import { formatStatCount } from '../../utils/socialHelpers';

export default function SocialStatBar({ stats = [], accentColor = '#4F46E5' }) {
  if (!stats || stats.length === 0) return null;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.min(stats.length, 3)}, 1fr)`,
        gap: 6,
        background: '#F8FAFC',
        padding: 6,
        borderRadius: 14,
        border: '1px solid #E2E8F0',
        marginBottom: 10,
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
              background: '#FFFFFF',
              borderRadius: 10,
              padding: '6px 4px',
              textAlign: 'center',
              border: '1px solid #F1F5F9',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              transition: 'transform 0.15s ease, border-color 0.15s ease',
              cursor: 'default'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.borderColor = '#CBD5E1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = '#F1F5F9';
            }}
          >
            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0F172A', fontFamily: 'Inter, monospace', lineHeight: 1.1 }}>
              {formatted}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.02em', marginTop: 2 }}>
              {item.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
