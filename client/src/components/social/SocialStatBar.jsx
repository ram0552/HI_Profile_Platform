import { formatStatCount } from '../../utils/socialHelpers';

export default function SocialStatBar({ stats = [] }) {
  if (!stats || stats.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        justify: 'space-around',
        background: '#F8FAFC',
        padding: '8px 10px',
        borderRadius: 12,
        border: '1px solid #F1F5F9',
        textAlign: 'center',
        marginBottom: 10,
        width: '100%'
      }}
    >
      {stats.map((item, idx) => {
        const rawVal = item.value !== undefined && item.value !== null ? Number(item.value) : 0;
        const formatted = formatStatCount(rawVal);
        const exact = rawVal.toLocaleString();

        return (
          <div key={idx} title={`${exact} ${item.label}`}>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0F172A', fontFamily: 'monospace' }}>
              {formatted}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
              {item.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
