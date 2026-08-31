import { riskColor, riskBg } from '@/lib/utils';

interface Props { level: string; score?: number; size?: 'sm' | 'md'; }

export default function RiskBadge({ level, score, size = 'md' }: Props) {
  const color = riskColor(level);
  const bg = riskBg(level);
  const label = level?.toUpperCase() ?? 'UNKNOWN';
  const padding = size === 'sm' ? '2px 8px' : '3px 10px';
  const fontSize = size === 'sm' ? '11px' : '12px';
  return (
    <span style={{ backgroundColor: bg, color, padding, fontSize, fontWeight: 600,
      borderRadius: 4, border: `1px solid ${color}33`, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: color, display: 'inline-block' }} />
      {label}{score !== undefined ? ` ${score}` : ''}
    </span>
  );
}
