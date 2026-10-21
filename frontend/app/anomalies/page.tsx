'use client';

import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import RiskBadge from '@/components/ui/RiskBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { api } from '@/lib/api';
import { Anomaly } from '@/types';
import { formatDateTime, anomalyTypeLabel } from '@/lib/utils';

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

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
      // Sort by severity (Critical first)
      const sorted = (data || []).sort((a: Anomaly, b: Anomaly) => {
        const orderA = SEVERITY_ORDER[a.severity?.toLowerCase()] ?? 4;
        const orderB = SEVERITY_ORDER[b.severity?.toLowerCase()] ?? 4;
        return orderA - orderB;
      });
      setAnomalies(sorted);
      if (sorted.length > 0 && selected) {
        const updatedSelected = sorted.find((a: Anomaly) => a.id === selected.id);
        if (updatedSelected) setSelected(updatedSelected);
      }
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
      await load();
      if (selected && selected.id === id) {
        setSelected(prev => prev ? { ...prev, status } : null);
      }
    } finally {
      setUpdating(false);
    }
  }

  const counts: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  anomalies.forEach(a => {
    const sev = a.severity?.toLowerCase();
    if (counts[sev] !== undefined) counts[sev]++;
  });

  return (
    <AppLayout>
      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title">Anomaly Detection Engine</h1>
        <p className="page-subtitle">
          Rule-based heuristic signals, behavioral deviations, and compliance breach flags sorted by operational severity
        </p>
      </div>

      {/* Filter Bar with Severity Filters */}
      <div className="filter-bar">
        {/* Severity Filter Strip */}
        <div className="filter-group">
          <label className="label">Severity Level</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setFilter(f => ({ ...f, severity: '' }))}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 'var(--radius-pill, 50px)',
                background: filter.severity === '' ? 'var(--c-navy, #1B2559)' : 'var(--c-surface, #FFFFFF)',
                color: filter.severity === '' ? '#FFFFFF' : 'var(--c-text2, #5A6A85)',
                border: '1px solid var(--c-border, #E2E8F0)',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                transition: 'all 0.12s',
              }}
            >
              All Severities ({anomalies.length})
            </button>
            {(['critical', 'high', 'medium', 'low'] as const).map(s => {
              const active = filter.severity === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFilter(f => ({ ...f, severity: active ? '' : s }))}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-pill, 50px)',
                    background: active ? 'rgba(67, 97, 238, 0.1)' : 'var(--c-surface, #FFFFFF)',
                    border: `1px solid ${active ? 'var(--c-accent, #4361EE)' : 'var(--c-border, #E2E8F0)'}`,
                    cursor: 'pointer',
                    fontSize: 12,
                    transition: 'all 0.12s',
                  }}
                >
                  <RiskBadge level={s} size="sm" />
                  <span className="mono" style={{ fontWeight: 600, color: 'var(--c-text, #1E293B)', fontSize: 12 }}>
                    {counts[s]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Status Select */}
        <div className="filter-group">
          <label className="label">Resolution Status</label>
          <select
            value={filter.status}
            onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
            className="input"
            style={{ width: 160 }}
          >
            <option value="">All Statuses</option>
            <option value="open">Open (Unresolved)</option>
            <option value="under_review">Under Review</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>

        {/* Entity Type Select */}
        <div className="filter-group">
          <label className="label">Target Entity</label>
          <select
            value={filter.entity_type}
            onChange={e => setFilter(f => ({ ...f, entity_type: e.target.value }))}
            className="input"
            style={{ width: 160 }}
          >
            <option value="">All Entities</option>
            <option value="centre">Training Centre</option>
            <option value="batch">Training Batch</option>
            <option value="beneficiary">Beneficiary</option>
            <option value="trainer">Trainer</option>
            <option value="evidence">Evidence</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => setFilter({ severity: '', status: '', entity_type: '' })}
          className="btn btn-ghost btn-sm"
          style={{ height: 38, marginTop: 'auto' }}
        >
          Reset Filters
        </button>
      </div>

      {/* Main Content Area */}
      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 460px' : '1fr', gap: 24, alignItems: 'start' }}>
        {/* Left Column: Anomalies Feed */}
        <div>
          {loading ? (
            <LoadingSpinner rows={6} label="Evaluating anomaly heuristic indices..." />
          ) : anomalies.length === 0 ? (
            <div className="card">
              <EmptyState
                title="No Anomalies Found"
                message="No records matched the selected severity, status, and entity filters."
              />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {anomalies.map(a => {
                const isSelected = selected?.id === a.id;
                const isCritical = a.severity?.toLowerCase() === 'critical';
                const isHigh = a.severity?.toLowerCase() === 'high';

                return (
                  <div
                    key={a.id}
                    onClick={() => setSelected(isSelected ? null : a)}
                    className="card"
                    style={{
                      cursor: 'pointer',
                      padding: '18px 22px',
                      borderLeft: isCritical
                        ? '4px solid var(--c-danger, #EE5D50)'
                        : isHigh
                        ? '4px solid #FF8800'
                        : isSelected
                        ? '4px solid var(--c-accent, #4361EE)'
                        : '1px solid var(--c-border, #E2E8F0)',
                      boxShadow: isSelected ? 'var(--shadow-md, 0 2px 8px rgba(0,0,0,0.06))' : 'var(--shadow-card)',
                      transition: 'all 0.15s ease',
                      background: isSelected ? '#FAFCFE' : '#FFFFFF',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.borderColor = 'var(--c-accent, #4361EE)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'var(--c-border, #E2E8F0)';
                        if (isCritical) e.currentTarget.style.borderLeftColor = 'var(--c-danger, #EE5D50)';
                        if (isHigh) e.currentTarget.style.borderLeftColor = '#FF8800';
                      }
                    }}
                  >
                    {/* Header: Title + Badges */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--c-text, #1E293B)' }}>
                            {anomalyTypeLabel(a.anomaly_type)}
                          </span>
                          <span style={{
                            fontSize: 11,
                            color: 'var(--c-text3, #75839C)',
                            background: 'var(--c-surface2, #F0F3F9)',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-sm, 8px)',
                            fontFamily: 'monospace',
                          }}>
                            {a.entity_type} #{a.entity_id}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <RiskBadge level={a.severity} size="sm" />
                        <StatusBadge status={a.status} />
                      </div>
                    </div>

                    {/* Short Description */}
                    <p style={{
                      fontSize: 13.5,
                      color: 'var(--c-text2, #5A6A85)',
                      lineHeight: 1.5,
                      margin: '0 0 10px',
                    }}>
                      {a.description}
                    </p>

                    {/* Bottom Metadata */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: 12,
                      color: 'var(--c-text3, #75839C)',
                      paddingTop: 8,
                      borderTop: '1px solid var(--c-surface2, #F0F3F9)',
                    }}>
                      <span>Detected: {formatDateTime(a.detected_at)}</span>
                      <span style={{ color: 'var(--c-accent, #4361EE)', fontWeight: 600 }}>
                        {isSelected ? 'Viewing Details ▲' : 'View Details →'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: One Main Anomaly Card with Internal Sections */}
        {selected && (
          <div className="card" style={{ position: 'sticky', top: 96, boxShadow: 'var(--shadow-md)' }}>
            {/* Header */}
            <div className="card-header" style={{ padding: '18px 22px' }}>
              <div>
                <span className="section-label">Anomaly Inspection Dossier</span>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--c-text, #1E293B)', marginTop: 2 }}>
                  {anomalyTypeLabel(selected.anomaly_type)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="btn btn-ghost btn-sm"
                style={{ padding: '4px 8px', height: 28, fontSize: 14 }}
              >
                ✕
              </button>
            </div>

            <div className="card-body" style={{ padding: '22px' }}>
              {/* Badges & Entity row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                <RiskBadge level={selected.severity} size="md" />
                <StatusBadge status={selected.status} />
                <span className="mono" style={{ fontSize: 12, color: 'var(--c-text3, #75839C)' }}>
                  Target: {selected.entity_type} #{selected.entity_id}
                </span>
              </div>

              {/* Description */}
              <div style={{ fontSize: 13.5, color: 'var(--c-text, #1E293B)', lineHeight: 1.55, marginBottom: 18 }}>
                {selected.description}
              </div>

              {/* Internal Section 1: Evidence */}
              {selected.evidence && Object.keys(selected.evidence).length > 0 && (
                <div style={{ marginBottom: 18 }}>
                  <div className="section-label" style={{ marginBottom: 8 }}>Signal Telemetry &amp; Evidence</div>
                  <dl style={{
                    margin: 0,
                    padding: '12px 14px',
                    background: 'var(--c-surface2, #F0F3F9)',
                    borderRadius: 'var(--radius-sm, 8px)',
                    border: '1px solid var(--c-border, #E2E8F0)',
                    display: 'grid',
                    gridTemplateColumns: '130px 1fr',
                    rowGap: 8,
                    columnGap: 12,
                  }}>
                    {Object.entries(selected.evidence).map(([key, val]) => (
                      <div key={key} style={{ display: 'contents' }}>
                        <dt className="label" style={{ margin: 0, fontSize: 11.5, color: 'var(--c-text3, #75839C)' }}>
                          {key.replace(/_/g, ' ')}
                        </dt>
                        <dd className="mono" style={{ margin: 0, fontSize: 12, color: 'var(--c-text, #1E293B)', wordBreak: 'break-all' }}>
                          {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {/* Internal Section 2: Recommended Action */}
              {selected.recommended_action && (
                <div style={{
                  marginBottom: 18,
                  padding: '12px 14px',
                  background: 'var(--c-info-bg, #EEF2FF)',
                  border: '1px solid #D0DCFF',
                  borderRadius: 'var(--radius-sm, 8px)',
                  fontSize: 13,
                  color: 'var(--c-text, #1E293B)',
                  lineHeight: 1.5,
                }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--c-accent, #4361EE)', textTransform: 'uppercase', marginBottom: 4 }}>
                    Recommended Action Protocol
                  </div>
                  <div>{selected.recommended_action}</div>
                </div>
              )}

              <div style={{ fontSize: 12, color: 'var(--c-text3, #75839C)', marginBottom: 18 }}>
                Detected on: {formatDateTime(selected.detected_at)}
              </div>

              {/* Status Update Actions */}
              <div style={{ paddingTop: 16, borderTop: '1px solid var(--c-border, #E2E8F0)' }}>
                <div className="label" style={{ fontSize: 12, marginBottom: 8 }}>
                  Administrative State Transition
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => updateStatus(selected.id, 'under_review')}
                    disabled={updating || selected.status === 'under_review'}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: 12 }}
                  >
                    Mark Under Review
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatus(selected.id, 'resolved')}
                    disabled={updating || selected.status === 'resolved'}
                    className="btn btn-teal btn-sm"
                    style={{ fontSize: 12 }}
                  >
                    Resolve Anomaly
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatus(selected.id, 'dismissed')}
                    disabled={updating || selected.status === 'dismissed'}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: 12 }}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
