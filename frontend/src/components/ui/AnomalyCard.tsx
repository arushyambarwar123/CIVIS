import { anomalyTypeLabel, riskColor, riskBg, formatDateTime, truncate } from '@/lib/utils';
import { Anomaly } from '@/types';
import StatusBadge from './StatusBadge';

interface Props { anomaly: Anomaly; onClick?: () => void; compact?: boolean; }

export default function AnomalyCard({ anomaly, onClick, compact }: Props) {
  const color = riskColor(anomaly.severity);
  const bg = riskBg(anomaly.severity);
  return (
    <div onClick={onClick}
      className="bg-white rounded-lg border cursor-pointer transition-shadow hover:shadow-md"
      style={{ borderLeft: `4px solid ${color}`, borderColor: '#DEE2E6', borderLeftColor: color }}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span style={{ backgroundColor: bg, color, padding: '1px 7px', fontSize: 11, fontWeight: 700, borderRadius: 3 }}>
                {anomaly.severity.toUpperCase()}
              </span>
              <span className="text-xs font-medium text-gray-600">{anomalyTypeLabel(anomaly.anomaly_type)}</span>
              <span className="text-xs text-gray-400">{anomaly.entity_type} #{anomaly.entity_id}</span>
            </div>
            <p className="text-sm text-gray-700 leading-snug">
              {compact ? truncate(anomaly.description, 100) : anomaly.description}
            </p>
          </div>
          <StatusBadge status={anomaly.status} />
        </div>
        {!compact && anomaly.recommended_action && (
          <div className="mt-3 text-xs text-blue-700 bg-blue-50 rounded p-2 border border-blue-100">
            <strong>Recommended:</strong> {anomaly.recommended_action}
          </div>
        )}
        <div className="mt-2 text-xs text-gray-400">{formatDateTime(anomaly.detected_at)}</div>
      </div>
    </div>
  );
}
