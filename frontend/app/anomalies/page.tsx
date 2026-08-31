'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import RiskBadge from '@/components/ui/RiskBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import AnomalyCard from '@/components/ui/AnomalyCard';
import { api } from '@/lib/api';
import { Anomaly } from '@/types';
import { formatDateTime, anomalyTypeLabel } from '@/lib/utils';

export default function AnomaliesPage() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ severity: '', status: 'open', entity_type: '' });
  const [selected, setSelected] = useState<Anomaly | null>(null);
  const [updating, setUpdating] = useState(false);

  async function load() {
    setLoading(true);
    const params: Record<string, string> = {};
    if (filter.severity) params.severity = filter.severity;
    if (filter.status) params.status = filter.status;
    if (filter.entity_type) params.entity_type = filter.entity_type;
    const data = await api.getAnomalies(params);
    setAnomalies(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, [filter]);

  async function updateStatus(id: number, status: string) {
    setUpdating(true);
    await api.updateAnomalyStatus(id, status);
    setUpdating(false);
    setSelected(null);
    load();
  }

  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  anomalies.forEach(a => { if (counts[a.severity] !== undefined) counts[a.severity]++; });

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-navy">Anomaly Detection</h1>
          <p className="text-sm text-gray-500">{anomalies.length} anomalies found</p>
        </div>
      </div>

      {/* Severity summary */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {(['critical','high','medium','low'] as const).map(s => {
          const colors: Record<string, string> = { critical: '#DC3545', high: '#FD7E14', medium: '#FFC107', low: '#198754' };
          const bgs: Record<string, string> = { critical: '#FFF5F5', high: '#FFF8F0', medium: '#FFFDF0', low: '#F0FFF4' };
          return (
            <button key={s} onClick={() => setFilter(f => ({ ...f, severity: f.severity === s ? '' : s }))}
              className="rounded-lg border p-4 text-left transition-all"
              style={{ backgroundColor: filter.severity === s ? bgs[s] : 'white', borderColor: filter.severity === s ? colors[s] : '#DEE2E6' }}>
              <div className="text-2xl font-bold" style={{ color: colors[s] }}>{counts[s]}</div>
              <div className="text-xs text-gray-500 capitalize mt-0.5">{s}</div>
            </button>
          );
        })}
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
          className="border border-gray-200 rounded px-3 py-1.5 text-sm">
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="under_review">Under Review</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
        <select value={filter.entity_type} onChange={e => setFilter(f => ({ ...f, entity_type: e.target.value }))}
          className="border border-gray-200 rounded px-3 py-1.5 text-sm">
          <option value="">All Types</option>
          <option value="centre">Centre</option>
          <option value="batch">Batch</option>
          <option value="beneficiary">Beneficiary</option>
          <option value="trainer">Trainer</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* List */}
        <div className="space-y-2">
          {loading ? <div className="text-gray-400 text-sm p-4">Loading...</div> :
           anomalies.length === 0 ? <div className="text-gray-400 text-sm p-4">No anomalies found with selected filters.</div> :
           anomalies.map(a => (
             <AnomalyCard key={a.id} anomaly={a} onClick={() => setSelected(a)} />
           ))}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="bg-white border border-gray-200 rounded-lg p-5 sticky top-6 self-start">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-xs text-gray-400 mb-1">Anomaly #{selected.id}</div>
                <h2 className="font-semibold text-navy">{anomalyTypeLabel(selected.anomaly_type)}</h2>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
            </div>

            <div className="flex gap-2 mb-4 flex-wrap">
              <RiskBadge level={selected.severity} />
              <StatusBadge status={selected.status} />
              <span className="text-xs text-gray-500 py-0.5">{selected.entity_type} #{selected.entity_id}</span>
            </div>

            <p className="text-sm text-gray-700 mb-4 leading-relaxed">{selected.description}</p>

            {selected.recommended_action && (
              <div className="bg-blue-50 border border-blue-100 rounded p-3 mb-4 text-xs text-blue-700">
                <strong>Recommended Action:</strong><br />{selected.recommended_action}
              </div>
            )}

            {Object.keys(selected.evidence || {}).length > 0 && (
              <div className="bg-gray-50 rounded p-3 mb-4">
                <div className="text-xs font-semibold text-gray-500 mb-2">Evidence Data</div>
                {Object.entries(selected.evidence).map(([k, v]) => (
                  <div key={k} className="flex gap-2 text-xs py-0.5">
                    <span className="text-gray-400 w-40 shrink-0">{k.replace(/_/g, ' ')}</span>
                    <span className="font-medium text-gray-700">{String(v)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="text-xs text-gray-400 mb-4">Detected: {formatDateTime(selected.detected_at)}</div>

            {selected.status === 'open' && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-gray-500 mb-1">Update Status</div>
                <div className="flex gap-2 flex-wrap">
                  {['under_review', 'resolved', 'dismissed'].map(s => (
                    <button key={s} onClick={() => updateStatus(selected.id, s)}
                      disabled={updating}
                      className="px-3 py-1.5 text-xs border border-gray-200 rounded bg-gray-50 hover:bg-gray-100 capitalize disabled:opacity-50">
                      {s.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
