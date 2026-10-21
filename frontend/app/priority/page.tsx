'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import RiskBadge from '@/components/ui/RiskBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { api } from '@/lib/api';
import { PriorityItem } from '@/types';

export default function PriorityPage() {
  const [list, setList] = useState<PriorityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<number | null>(null);
  const [inspectorMap, setInspectorMap] = useState<Record<number, string>>({});
  const [assigned, setAssigned] = useState<Record<number, string>>({});
  const [sample, setSample] = useState<any[] | null>(null);
  const [samplingCount, setSamplingCount] = useState(3);
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [sampleLoading, setSampleLoading] = useState(false);

  useEffect(() => {
    api.getPriorityList()
      .then(setList)
      .finally(() => setLoading(false));
  }, []);

  async function assign(centreId: number) {
    const name = inspectorMap[centreId];
    if (!name?.trim()) return;
    setAssigning(centreId);
    try {
      const r = await api.assignInspection({ centre_id: centreId, inspector_name: name });
      setAssigned(prev => ({ ...prev, [centreId]: `Assigned #${r.inspection_id}` }));
    } catch {
      setAssigned(prev => ({ ...prev, [centreId]: 'Assignment failed' }));
    } finally {
      setAssigning(null);
    }
  }

  async function getRandomSample() {
    setSampleLoading(true);
    try {
      const r = await api.getRandomSample(samplingCount);
      setSample(r.sample);
      setShowSampleModal(true);
    } finally {
      setSampleLoading(false);
    }
  }

  return (
    <AppLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">Inspection Priority Queue</h1>
          <p className="page-subtitle">
            Training centres ranked dynamically by composite risk score, inspection age, and critical anomaly density
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FFFFFF', padding: '6px 12px', borderRadius: 'var(--radius-sm, 8px)', border: '1px solid var(--c-border, #E2E8F0)' }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--c-text2, #5A6A85)' }}>Sample Size:</span>
            <input
              type="number"
              value={samplingCount}
              onChange={e => setSamplingCount(Math.max(1, Math.min(10, +e.target.value)))}
              min={1}
              max={10}
              className="mono"
              style={{
                width: 48,
                padding: '4px 6px',
                textAlign: 'center',
                border: '1px solid var(--c-border, #E2E8F0)',
                borderRadius: 4,
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>
          <button
            type="button"
            onClick={getRandomSample}
            disabled={sampleLoading}
            className="btn btn-teal"
            style={{ borderRadius: 'var(--radius-sm, 8px)' }}
          >
            {sampleLoading ? 'Generating...' : 'Generate Random Sample'}
          </button>
        </div>
      </div>

      {/* Priority Calculation Protocol Box */}
      <div style={{
        background: 'var(--c-surface2, #F0F3F9)',
        border: '1px solid var(--c-border, #E2E8F0)',
        borderRadius: 'var(--radius-md, 12px)',
        padding: '12px 18px',
        fontSize: 13,
        color: 'var(--c-text2, #5A6A85)',
        marginBottom: 24,
        lineHeight: 1.5,
      }}>
        <strong style={{ color: 'var(--c-text, #1E293B)' }}>Priority Ranking Formula: </strong>
        Composite Risk (50%) + Uninspected Duration Factor (30%) + Critical Anomalies (20%). Ensures critical outliers receive prompt on-site verification.
      </div>

      {loading ? (
        <LoadingSpinner rows={8} label="Calculating priority queue rankings..." />
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 60, textAlign: 'center' }}>Rank</th>
                  <th>Training Centre</th>
                  <th>Risk Tier</th>
                  <th>Priority Index</th>
                  <th>Last Audit</th>
                  <th style={{ textAlign: 'center' }}>Critical Signals</th>
                  <th>Priority Drivers</th>
                  <th style={{ minWidth: 240 }}>Field Assignment</th>
                </tr>
              </thead>
              <tbody>
                {list.map(item => (
                  <tr key={item.centre_id}>
                    <td className="mono" style={{ textAlign: 'center', fontWeight: 700, color: 'var(--c-text, #1E293B)', fontSize: 13.5 }}>
                      #{item.rank}
                    </td>
                    <td>
                      <Link
                        href={`/centres/${item.centre_id}`}
                        style={{ color: 'var(--c-accent, #4361EE)', fontWeight: 600, textDecoration: 'none' }}
                      >
                        {item.centre_name}
                      </Link>
                      <div style={{ fontSize: 12, color: 'var(--c-text2, #5A6A85)', marginTop: 2 }}>
                        {item.district}, {item.state} &bull; <span className="mono">{item.centre_code}</span>
                      </div>
                    </td>
                    <td>
                      <RiskBadge level={item.risk_level} score={item.risk_score} size="sm" />
                    </td>
                    <td className="mono" style={{ fontWeight: 700, fontSize: 14, color: 'var(--c-text, #1E293B)' }}>
                      {item.priority_score}
                    </td>
                    <td className="mono" style={{ fontSize: 12.5, color: item.days_since_inspection > 365 ? 'var(--c-danger, #EE5D50)' : 'var(--c-text2, #5A6A85)' }}>
                      {item.days_since_inspection === 999 ? 'Never Inspected' : `${item.days_since_inspection} days ago`}
                    </td>
                    <td className="mono" style={{ textAlign: 'center' }}>
                      {item.critical_anomaly_count > 0 ? (
                        <span style={{ color: 'var(--c-danger, #EE5D50)', fontWeight: 700 }}>
                          {item.critical_anomaly_count}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--c-text3, #75839C)' }}>0</span>
                      )}
                    </td>
                    <td style={{ maxWidth: 280 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {item.priority_reasons?.map((reason, idx) => (
                          <span
                            key={idx}
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-sm, 8px)',
                              background: 'var(--c-surface2, #F0F3F9)',
                              fontSize: 11,
                              color: 'var(--c-text2, #5A6A85)',
                              lineHeight: 1.3,
                            }}
                          >
                            {reason}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      {assigned[item.centre_id] ? (
                        <span style={{
                          fontSize: 12,
                          fontWeight: 600,
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-pill, 50px)',
                          backgroundColor: assigned[item.centre_id].includes('failed') ? 'var(--c-danger-bg, #FFF0EF)' : 'var(--c-success-bg, #E6FBF3)',
                          color: assigned[item.centre_id].includes('failed') ? 'var(--c-danger, #EE5D50)' : 'var(--c-success, #01B574)',
                        }}>
                          {assigned[item.centre_id]}
                        </span>
                      ) : (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input
                            placeholder="Inspector name..."
                            value={inspectorMap[item.centre_id] || ''}
                            onChange={e => setInspectorMap(prev => ({ ...prev, [item.centre_id]: e.target.value }))}
                            className="input"
                            style={{ width: 140, padding: '6px 10px', fontSize: 12.5 }}
                          />
                          <button
                            type="button"
                            onClick={() => assign(item.centre_id)}
                            disabled={assigning === item.centre_id || !inspectorMap[item.centre_id]?.trim()}
                            className="btn btn-primary btn-sm"
                            style={{ borderRadius: 'var(--radius-sm, 8px)' }}
                          >
                            {assigning === item.centre_id ? 'Assigning...' : 'Assign'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {list.length === 0 && (
            <EmptyState
              title="No Centres in Priority Queue"
              message="All registered centres have been audited or have negligible risk ratings."
            />
          )}
        </div>
      )}

      {/* Random Sample Modal Overlay */}
      {showSampleModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: 24,
        }}>
          <div className="card" style={{ maxWidth: 580, width: '100%', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}>
            <div className="card-header" style={{ padding: '20px 24px' }}>
              <div>
                <span className="section-label">Audit Control Verification</span>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--c-text, #1E293B)', marginTop: 2 }}>
                  Stratified Random Sample ({sample?.length || 0})
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSampleModal(false)}
                className="btn btn-ghost btn-sm"
                style={{ padding: '4px 8px', fontSize: 14 }}
              >
                ✕
              </button>
            </div>
            <div className="card-body" style={{ padding: '24px' }}>
              <p style={{ fontSize: 13, color: 'var(--c-text2, #5A6A85)', margin: '0 0 16px', lineHeight: 1.5 }}>
                These centres were selected at random across the national registry to evaluate control compliance regardless of heuristic risk scores.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {sample?.map((s: any) => (
                  <div
                    key={s.centre_id}
                    style={{
                      padding: '12px 16px',
                      background: 'var(--c-surface2, #F0F3F9)',
                      border: '1px solid var(--c-border, #E2E8F0)',
                      borderRadius: 'var(--radius-sm, 8px)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--c-text, #1E293B)', fontSize: 13.5 }}>
                        {s.centre_name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--c-text2, #5A6A85)', marginTop: 2 }}>
                        <span className="mono">{s.centre_code}</span> &bull; {s.district}, {s.state}
                      </div>
                    </div>
                    <Link
                      href={`/centres/${s.centre_id}`}
                      className="btn btn-ghost btn-sm"
                      style={{ background: '#FFFFFF' }}
                      onClick={() => setShowSampleModal(false)}
                    >
                      View Profile &rarr;
                    </Link>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                <button
                  type="button"
                  onClick={() => setShowSampleModal(false)}
                  className="btn btn-primary btn-sm"
                  style={{ borderRadius: 'var(--radius-sm, 8px)' }}
                >
                  Close Sample
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
