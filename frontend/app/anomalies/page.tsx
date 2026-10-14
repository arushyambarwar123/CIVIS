'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import RiskBadge from '@/components/ui/RiskBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import AnomalyCard from '@/components/ui/AnomalyCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { api } from '@/lib/api';
import { Anomaly } from '@/types';
import { formatDateTime, anomalyTypeLabel, riskColor } from '@/lib/utils';

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
    try {
      const data = await api.getAnomalies(params);
      setAnomalies(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [filter]);

  async function updateStatus(id: number, status: string) {
    setUpdating(true);
    try {
      await api.updateAnomalyStatus(id, status);
      setSelected(null);
      await load();
    } finally {
      setUpdating(false);
    }
  }

  const counts: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  anomalies.forEach(a => {
    if (counts[a.severity] !== undefined) counts[a.severity]++;
  });

  return (
    <AppLayout>
      <div style={{ marginBottom: 20 }}>
        <h1 className="page-title">Anomaly Detection Engine</h1>
        <p className="page-subtitle">{anomalies.length} anomaly records matching active filters</p>
      </div>

      {/* Filter Bar with severity inline filter strip */}
      <div className="filter-bar">
        {/* Severity filter strip */}
        <div className="filter-group">
          <label className="label">Severity Level</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['critical', 'high', 'medium', 'low'] as const).map(s => {
              const active = filter.severity === s;
              return (
                <button
                  key={s}
                  onClick={() => setFilter(f => ({ ...f, severity: active ? '' : s }))}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '5px 9px',
                    borderRadius: 4,
                    background: active ? 'var(--c-surface2)' : 'var(--c-surface)',
                    border: `1px solid ${active ? 'var(--c-teal)' : 'var(--c-border)'}`,
                    cursor: 'pointer',
                    fontSize: 12,
                  }}
                >
                  <RiskBadge level={s} size="sm" />
                  <span className="mono" style={{ fontWeight: 600, color: 'var(--c-text)' }}>
                    {counts[s]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="filter-group">
          <label className="label">Status</label>
          <select
            value={filter.status}
            onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
            className="input"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="under_review">Under Review</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="label">Entity Type</label>
          <select
            value={filter.entity_type}
            onChange={e => setFilter(f => ({ ...f, entity_type: e.target.value }))}
            className="input"
          >
            <option value="">All Types</option>
            <option value="centre">Centre</option>
            <option value="batch">Batch</option>
            <option value="beneficiary">Beneficiary</option>
            <option value="trainer">Trainer</option>
          </select>
        </div>

        <button
          onClick={() => setFilter({ severity: '', status: '', entity_type: '' })}
          className="btn btn-ghost btn-sm"
          style={{ height: 33 }}
        >
          Reset Filters
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 420px' : '1fr', gap: 20, alignItems: 'start' }}>
        {/* Anomaly Cards List */}
        <div>
          {loading ? (
            <LoadingSpinner rows={8} label="Loading anomalies..." />
          ) : anomalies.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <p>No anomalies found with the selected criteria.</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {anomalies.map(a => (
                <AnomalyCard
                  key={a.id}
                  anomaly={a}
                  onClick={() => setSelected(a)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Detail Side Panel */}
        {selected && (
          <div className="detail-panel">
            <div className="detail-panel-header">
              <div>
                <div className="mono" style={{ color: 'var(--c-text2)', fontSize: 11 }}>
                  Anomaly #{selected.id}
                </div>
                <div style={{ fontWeight: 600, color: 'var(--c-navy)', fontSize: 14 }}>
                  {anomalyTypeLabel(selected.anomaly_type)}
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="btn btn-ghost btn-sm"
                style={{ padding: '2px 8px', fontSize: 14 }}
              >
                ✕
              </button>
            </div>

            <div className="detail-panel-body">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
                <RiskBadge level={selected.severity} />
                <StatusBadge status={selected.status} />
                <span className="mono" style={{ fontSize: 11, color: 'var(--c-text2)' }}>
                  {selected.entity_type} #{selected.entity_id}
                </span>
              </div>

              <div style={{ fontSize: 13, color: 'var(--c-text)', lineHeight: '20px', marginBottom: 16 }}>
                {selected.description}
              </div>

              {selected.recommended_action && (
                <div style={{
                  padding: '10px 12px',
                  background: 'var(--c-surface2)',
                  border: '1px solid var(--c-border)',
                  borderRadius: 4,
                  fontSize: 12,
                  marginBottom: 16,
                }}>
                  <div className="label" style={{ color: 'var(--c-teal)', marginBottom: 2 }}>Recommended Action</div>
                  <div style={{ color: 'var(--c-text)' }}>{selected.recommended_action}</div>
                </div>
              )}

              {/* Evidence Data: Two-column definition list style */}
              {selected.evidence && Object.keys(selected.evidence).length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div className="section-label" style={{ marginBottom: 8 }}>Evidence Data</div>
                  <dl style={{
                    margin: 0,
                    padding: '10px 12px',
                    background: 'var(--c-surface2)',
                    border: '1px solid var(--c-border)',
                    borderRadius: 4,
                    display: 'grid',
                    gridTemplateColumns: '120px 1fr',
                    rowGap: 6,
                    columnGap: 10,
                  }}>
                    {Object.entries(selected.evidence).map(([key, val]) => (
                      <div key={key} style={{ display: 'contents' }}>
                        <dt className="label" style={{ margin: 0, fontSize: 11 }}>
                          {key.replace(/_/g, ' ')}
                        </dt>
                        <dd className="mono" style={{ margin: 0, fontSize: 12, color: 'var(--c-text)', wordBreak: 'break-all' }}>
                          {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              <div style={{ fontSize: 11, color: 'var(--c-text2)', marginBottom: 16 }}>
                Detected: {formatDateTime(selected.detected_at)}
              </div>

              {/* Status Update Actions */}
              {selected.status === 'open' && (
                <div style={{ paddingTop: 14, borderTop: '1px solid var(--c-border)' }}>
                  <div className="label" style={{ marginBottom: 8 }}>Update Anomaly Status</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button
                      onClick={() => updateStatus(selected.id, 'under_review')}
                      disabled={updating}
                      className="btn btn-ghost btn-sm"
                    >
                      Under Review
                    </button>
                    <button
                      onClick={() => updateStatus(selected.id, 'resolved')}
                      disabled={updating}
                      className="btn btn-ghost btn-sm"
                      style={{ color: '#31785B', borderColor: '#B5DCC8' }}
                    >
                      Resolve
                    </button>
                    <button
                      onClick={() => updateStatus(selected.id, 'dismissed')}
                      disabled={updating}
                      className="btn btn-ghost btn-sm"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
