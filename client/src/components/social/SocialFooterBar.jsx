import { formatRelativeTime } from '../../utils/socialHelpers';

export default function SocialFooterBar({ lastFetched = null, isFailedScrape = false }) {
  const relativeTime = formatRelativeTime(lastFetched);
  const isStale = lastFetched && (Date.now() - new Date(lastFetched).getTime() > 24 * 60 * 60 * 1000);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, paddingTop: 4, borderTop: '1px solid #F1F5F9', fontSize: '0.72rem', color: '#94A3B8' }}>
      {isFailedScrape ? (
        <span style={{ color: '#F59E0B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }} title="Partial data fetched from Apify">
          ⚠ Refreshing full profile data...
        </span>
      ) : (
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {isStale && (
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#F59E0B', animation: 'pulse 1.5s infinite', display: 'inline-block' }} title="Background refresh pending" />
          )}
          {relativeTime ? `Updated ${relativeTime}` : 'Live data'}
        </span>
      )}
    </div>
  );
}
