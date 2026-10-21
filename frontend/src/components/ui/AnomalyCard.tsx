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
        background: '#FFFFFF',
        border: '1px solid var(--c-border, #E9EDF7)',
        borderRadius: 'var(--radius-lg, 16px)',
        boxShadow: '0 3.5px 5.5px rgba(0,0,0,0.02)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.15s ease',
        overflow: 'hidden',
      }}
      onMouseEnter={e => onClick && ((e.currentTarget as HTMLElement).style.borderColor = 'var(--c-accent, #4361EE)')}
      onMouseLeave={e => onClick && ((e.currentTarget as HTMLElement).style.borderColor = 'var(--c-border, #E9EDF7)')}
    >
      <div style={{ padding: compact ? '14px 18px' : '18px 22px' }}>
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
              {/* Severity badge pill */}
              <span style={{
                backgroundColor: bg,
                color,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.04em',
                padding: '2px 8px',
                borderRadius: '50px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}>
                <span style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  backgroundColor: color,
                  display: 'inline-block',
                }} />
                {anomaly.severity.toUpperCase()}
              </span>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-text, #2B3674)' }}>
                {anomalyTypeLabel(anomaly.anomaly_type)}
              </span>
              <span style={{
                fontSize: 12,
                color: 'var(--c-text3, #A3AED0)',
                background: 'var(--c-surface2, #F0F3F9)',
                padding: '2px 8px',
                borderRadius: '4px',
                fontFamily: 'monospace',
              }}>
                {anomaly.entity_type} #{anomaly.entity_id}
              </span>
            </div>
            <p style={{
              fontSize: 13,
              color: 'var(--c-text2, #8F9BBA)',
              lineHeight: '20px',
              margin: '6px 0 0',
            }}>
              {compact ? truncate(anomaly.description, 110) : anomaly.description}
            </p>
          </div>
          <StatusBadge status={anomaly.status} />
        </div>

        {/* Recommended action */}
        {!compact && anomaly.recommended_action && (
          <div style={{
            marginTop: 12,
            padding: '10px 14px',
            background: 'var(--c-surface2, #F0F3F9)',
            border: '1px solid var(--c-border, #E9EDF7)',
            borderRadius: 'var(--radius-sm, 8px)',
            fontSize: 13,
            color: 'var(--c-text, #2B3674)',
          }}>
            <span style={{ fontWeight: 600, color: 'var(--c-accent, #4361EE)' }}>Recommended Action: </span>
            {anomaly.recommended_action}
          </div>
        )}

        <div style={{ marginTop: 10, fontSize: 12, color: 'var(--c-text3, #A3AED0)' }}>
          Detected: {formatDateTime(anomaly.detected_at)}
        </div>
      </div>
    </div>
  );
}
