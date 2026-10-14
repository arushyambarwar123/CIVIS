'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import RiskBadge from '@/components/ui/RiskBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Inspection Priority Queue</h1>
          <p className="page-subtitle">Training centres ranked by composite risk score, inspection age, and critical anomalies</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="label" style={{ margin: 0 }}>Sample Size:</span>
            <input
              type="number"
              value={samplingCount}
              onChange={e => setSamplingCount(Math.max(1, Math.min(10, +e.target.value)))}
              min={1}
              max={10}
              className="input mono"
              style={{ width: 64, padding: '4px 8px', textAlign: 'center' }}
            />
          </div>
          <button
            onClick={getRandomSample}
            disabled={sampleLoading}
            className="btn btn-teal btn-sm"
          >
            {sampleLoading ? 'Generating...' : 'Generate Random Sample'}
          </button>
        </div>
      </div>

      {/* Priority Calculation Notice */}
      <div style={{
        background: '#EFF2F1',
        border: '1px solid var(--c-border)',
        borderRadius: 4,
        padding: '10px 14px',
        fontSize: 12,
        color: 'var(--c-text2)',
        marginBottom: 20,
      }}>
        <strong style={{ color: 'var(--c-navy)' }}>Priority Ranking Model:</strong> Risk Score (50%) + Inspection Age Factor (30%) + Critical Anomalies (20%). Ensures high-risk and uninspected centres receive timely verification.
      </div>

      {loading ? (
        <LoadingSpinner rows={8} label="Loading priority queue..." />
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: 50, textAlign: 'center' }}>Rank</th>
                <th>Training Centre</th>
                <th>Risk Level</th>
                <th>Priority Score</th>
                <th>Days Since Insp.</th>
                <th>Critical Anomalies</th>
                <th>Key Priority Reasons</th>
                <th style={{ minWidth: 220 }}>Assign Inspector</th>
              </tr>
            </thead>
            <tbody>
              {list.map(item => (
                <tr key={item.centre_id}>
                  <td className="mono" style={{ textAlign: 'center', fontWeight: 600, color: 'var(--c-navy)', fontSize: 13 }}>
                    #{item.rank}
                  </td>
                  <td>
                    <Link
                      href={`/centres/${item.centre_id}`}
                      style={{ color: '#287D79', fontWeight: 500, textDecoration: 'none' }}
                    >
                      {item.centre_name}
                    </Link>
                    <div style={{ fontSize: 11, color: 'var(--c-text2)', marginTop: 2 }}>
                      {item.district}, {item.state} · <span className="mono">{item.centre_code}</span>
                    </div>
                  </td>
                  <td>
                    <RiskBadge level={item.risk_level} score={item.risk_score} size="sm" />
                  </td>
                  <td className="mono" style={{ fontWeight: 700, fontSize: 14, color: 'var(--c-navy)' }}>
                    {item.priority_score}
                  </td>
                  <td className="mono" style={{ fontSize: 12, color: item.days_since_inspection > 365 ? '#B54747' : 'inherit' }}>
                    {item.days_since_inspection === 999 ? 'Never' : `${item.days_since_inspection}d`}
                  </td>
                  <td className="mono" style={{ textAlign: 'center' }}>
                    {item.critical_anomaly_count > 0 ? (
                      <span style={{ color: '#B54747', fontWeight: 700 }}>
                        {item.critical_anomaly_count}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--c-text2)' }}>—</span>
                    )}
                  </td>
                  <td style={{ maxWidth: 280 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {item.priority_reasons?.map((reason, idx) => (
                        <span
                          key={idx}
                          style={{
                            display: 'inline-block',
                            padding: '2px 6px',
                            borderRadius: 3,
                            background: 'var(--c-surface2)',
                            fontSize: 11,
                            color: 'var(--c-text2)',
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
                        padding: '3px 8px',
                        borderRadius: 3,
                        backgroundColor: assigned[item.centre_id].includes('failed') ? '#FDEAEA' : '#EAF4EF',
                        color: assigned[item.centre_id].includes('failed') ? '#B54747' : '#31785B',
                      }}>
                        {assigned[item.centre_id]}
                      </span>
                    ) : (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input
                          placeholder="Inspector name"
                          value={inspectorMap[item.centre_id] || ''}
                          onChange={e => setInspectorMap(prev => ({ ...prev, [item.centre_id]: e.target.value }))}
                          className="input"
                          style={{ width: 130, padding: '4px 8px', fontSize: 12 }}
                        />
                        <button
                          onClick={() => assign(item.centre_id)}
                          disabled={assigning === item.centre_id || !inspectorMap[item.centre_id]?.trim()}
                          className="btn btn-primary btn-sm"
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
          {list.length === 0 && (
            <div className="empty-state">
              <p>No centres queued for priority inspection.</p>
            </div>
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
          backgroundColor: 'rgba(23, 43, 77, 0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: 20,
        }}>
          <div className="card" style={{ maxWidth: 640, width: '100%', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
            <div className="card-header">
              <div>
                <span className="section-label">Audit Sample</span>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--c-navy)', marginTop: 2 }}>
                  Randomly Selected Centres ({sample?.length || 0})
                </div>
              </div>
              <button
                onClick={() => setShowSampleModal(false)}
                className="btn btn-ghost btn-sm"
                style={{ padding: '2px 8px', fontSize: 14 }}
              >
                ✕
              </button>
            </div>
            <div className="card-body">
              <p style={{ fontSize: 12, color: 'var(--c-text2)', margin: '0 0 16px' }}>
                These centres were generated via stratified random sampling to supplement risk-targeted monitoring and evaluate control baseline integrity.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {sample?.map((s: any) => (
                  <div
                    key={s.centre_id}
                    style={{
                      padding: '12px 14px',
                      background: 'var(--c-surface2)',
                      border: '1px solid var(--c-border)',
                      borderRadius: 4,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--c-navy)', fontSize: 13 }}>
                        {s.centre_name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--c-text2)', marginTop: 2 }}>
                        <span className="mono">{s.centre_code}</span> · {s.district}, {s.state}
                      </div>
                    </div>
                    <Link
                      href={`/centres/${s.centre_id}`}
                      className="btn btn-ghost btn-sm"
                      style={{ background: '#fff' }}
                      onClick={() => setShowSampleModal(false)}
                    >
                      View Profile →
                    </Link>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                <button
                  onClick={() => setShowSampleModal(false)}
                  className="btn btn-ghost btn-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
