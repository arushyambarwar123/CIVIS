import { riskColor, riskBg } from '@/lib/utils';

interface Props { level: string; score?: number; size?: 'sm' | 'md'; }

export default function RiskBadge({ level, score, size = 'md' }: Props) {
  const color = riskColor(level);
  const bg = riskBg(level);
  const label = level?.toUpperCase() ?? 'UNKNOWN';
  const isSmall = size === 'sm';

  return (
    <span style={{
      backgroundColor: bg,
      color,
      padding: isSmall ? '2px 7px' : '3px 9px',
      fontSize: isSmall ? '11px' : '11px',
      fontWeight: 600,
      letterSpacing: '0.04em',
      borderRadius: '3px',
      whiteSpace: 'nowrap',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      fontFamily: 'IBM Plex Sans, sans-serif',
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: '50%',
        backgroundColor: color, display: 'inline-block', flexShrink: 0,
      }} />
      {label}{score !== undefined ? ` ${score}` : ''}
    </span>
  );
}
