import { anomalyTypeLabel, riskColor, riskBg, formatDateTime, truncate } from '@/lib/utils';
import { Anomaly } from '@/types';
import StatusBadge from './StatusBadge';

interface Props { anomaly: Anomaly; onClick?: () => void; compact?: boolean; }

export default function AnomalyCard({ anomaly, onClick, compact }: Props) {
  const color = riskColor(anomaly.severity);
  const bg = riskBg(anomaly.severity);

  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff',
        border: '1px solid #DCE2E3',
        borderRadius: 4,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 0.12s',
      }}
      onMouseEnter={e => onClick && ((e.currentTarget as HTMLElement).style.borderColor = '#287D79')}
      onMouseLeave={e => onClick && ((e.currentTarget as HTMLElement).style.borderColor = '#DCE2E3')}
    >
      <div style={{ padding: compact ? '10px 14px' : '14px 16px' }}>
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
              {/* Severity badge — no colored stripe, just a semantic pill */}
              <span style={{
                backgroundColor: bg, color,
                fontSize: 10, fontWeight: 600, letterSpacing: '0.06em',
                padding: '2px 7px', borderRadius: 3,
              }}>
                {anomaly.severity.toUpperCase()}
              </span>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#202B35' }}>
                {anomalyTypeLabel(anomaly.anomaly_type)}
              </span>
              <span style={{ fontSize: 11, color: '#A0AEB0' }}>
                {anomaly.entity_type} #{anomaly.entity_id}
              </span>
            </div>
            <p style={{
              fontSize: 13, color: '#4A5568', lineHeight: '20px', margin: 0,
            }}>
              {compact ? truncate(anomaly.description, 110) : anomaly.description}
            </p>
          </div>
          <StatusBadge status={anomaly.status} />
        </div>

        {/* Recommended action */}
        {!compact && anomaly.recommended_action && (
          <div style={{
            marginTop: 10, padding: '8px 12px',
            background: '#F0F9F8', border: '1px solid #C8E8E6',
            borderRadius: 3, fontSize: 12, color: '#287D79',
          }}>
            <span style={{ fontWeight: 500 }}>Recommended: </span>
            {anomaly.recommended_action}
          </div>
        )}

        <div style={{ marginTop: 6, fontSize: 11, color: '#A0AEB0' }}>
          {formatDateTime(anomaly.detected_at)}
        </div>
      </div>
    </div>
  );
}
