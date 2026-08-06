import React from 'react';
import { formatRelativeTime } from '../../utils/socialHelpers';

export default function SocialFooterBar({ lastFetched = null, isFailedScrape = false }) {
  const relativeTime = formatRelativeTime(lastFetched);
  const isStale = lastFetched && (Date.now() - new Date(lastFetched).getTime() > 24 * 60 * 60 * 1000);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifySpace: 'between',
        marginTop: 6,
        paddingTop: 6,
        borderTop: '1px solid #F1F5F9',
        fontSize: '0.72rem',
        color: '#94A3B8',
        flexShrink: 0
      }}
    >
      {isFailedScrape ? (
        <span style={{ color: '#F59E0B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }} title="Cached data available">
          ⚠ Cached profile data
        </span>
      ) : (
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 500 }}>
          {isStale ? (
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#F59E0B', display: 'inline-block' }} title="Background refresh scheduled" />
          ) : (
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} title="Live MongoDB cache" />
          )}
          {relativeTime ? `Updated ${relativeTime}` : 'Live cache'}
        </span>
      )}
    </div>
  );
}
