interface Props {
  label: string;
  value: string | number;
  sub?: string;
  accent?: 'default' | 'warning' | 'critical' | 'positive';
}

const ACCENT_MAP = {
  default:  { color: '#172B4D', bg: '#FFFFFF' },
  warning:  { color: '#B77928', bg: '#FDF3E3' },
  critical: { color: '#B54747', bg: '#FDEAEA' },
  positive: { color: '#31785B', bg: '#EAF4EF' },
};

export default function MetricCard({ label, value, sub, accent = 'default' }: Props) {
  const a = ACCENT_MAP[accent];
  return (
    <div style={{
      background: a.bg,
      border: '1px solid #DCE2E3',
      borderRadius: 4,
      padding: '14px 18px',
    }}>
      <div style={{
        fontSize: 11, fontWeight: 500, textTransform: 'uppercase',
        letterSpacing: '0.07em', color: '#64717D', marginBottom: 8,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 28, fontWeight: 600, color: a.color,
        fontVariantNumeric: 'tabular-nums', lineHeight: '1',
        letterSpacing: '-0.02em',
      }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: '#A0AEB0', marginTop: 5 }}>{sub}</div>
      )}
    </div>
  );
}
