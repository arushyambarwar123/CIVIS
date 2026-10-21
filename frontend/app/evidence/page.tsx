'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import MetricCard from '@/components/ui/MetricCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { api } from '@/lib/api';
import { Evidence } from '@/types';
import { formatDateTime } from '@/lib/utils';

export default function EvidencePage() {
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [runMsg, setRunMsg] = useState('');
  const [filterFlagged, setFilterFlagged] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await api.getEvidence();
      setEvidence(data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function runAnalysis() {
    setRunning(true);
    setRunMsg('');
    try {
      const r = await api.runEvidenceAnalysis();
      setRunMsg(`Analysis completed: ${r.anomalies_detected?.duplicate_images || 0} duplicate image sets, ${r.anomalies_detected?.geo_mismatches || 0} geo deviations flagged.`);
      await load();
    } catch {
      setRunMsg('Evidence media analysis scan failed.');
    } finally {
      setRunning(false);
    }
  }

  const displayed = filterFlagged ? evidence.filter(e => e.is_flagged) : evidence;
  const flaggedCount = evidence.filter(e => e.is_flagged).length;

  // Group by perceptual hash to find reused media
  const hashGroups: Record<string, Evidence[]> = {};
  evidence.forEach(e => {
    if (e.image_hash) {
      if (!hashGroups[e.image_hash]) hashGroups[e.image_hash] = [];
      hashGroups[e.image_hash].push(e);
    }
  });
  const duplicateHashes = Object.entries(hashGroups).filter(([, evs]) => evs.length > 1);

  return (
    <AppLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">Evidence Media Verification</h1>
          <p className="page-subtitle">
            Automated perceptual hash matching and telemetry validation across inspection photographs
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {runMsg && (
            <span style={{
              fontSize: 12.5,
              fontWeight: 500,
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm, 8px)',
              backgroundColor: runMsg.includes('failed') ? 'var(--c-danger-bg, #FFF0EF)' : 'var(--c-success-bg, #E6FBF3)',
              color: runMsg.includes('failed') ? 'var(--c-danger, #EE5D50)' : 'var(--c-success, #01B574)',
              border: `1px solid ${runMsg.includes('failed') ? '#FFD3CE' : '#B8F2DC'}`,
            }}>
              {runMsg}
            </span>
          )}
          <button
            type="button"
            onClick={runAnalysis}
            disabled={running}
            className="btn btn-primary"
            style={{ borderRadius: 'var(--radius-sm, 8px)' }}
          >
            {running ? 'Executing Analysis...' : 'Run Evidence Analysis'}
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <MetricCard
          label="Total Evidence Records"
          value={evidence.length}
          sub="Uploaded verification assets"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
          }
        />
        <MetricCard
          label="Flagged Duplicates"
          value={flaggedCount}
          sub="Potential reused media"
          accent={flaggedCount > 0 ? 'critical' : 'positive'}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          }
        />
        <MetricCard
          label="Duplicate Clusters"
          value={duplicateHashes.length}
          sub="Collision sets identified"
          accent={duplicateHashes.length > 0 ? 'warning' : 'default'}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
              <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
              <line x1="6" y1="6" x2="6.01" y2="6"></line>
              <line x1="6" y1="18" x2="6.01" y2="18"></line>
            </svg>
          }
        />
      </div>

      {/* Duplicate Hash Clusters Section */}
      {duplicateHashes.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header" style={{ padding: '18px 24px' }}>
            <div>
              <span className="section-label">Perceptual Hash Collisions</span>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--c-text, #1E293B)', marginTop: 2 }}>
                Identical Evidence Artifacts Across Batches
              </div>
            </div>
            <span style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--c-danger, #EE5D50)',
              background: 'var(--c-danger-bg, #FFF0EF)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-pill, 50px)',
            }}>
              {duplicateHashes.length} Collision Sets
            </span>
          </div>

          <div className="card-body" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {duplicateHashes.map(([hash, evs]) => (
                <div
                  key={hash}
                  style={{
                    padding: '14px 18px',
                    borderRadius: 'var(--radius-md, 12px)',
                    background: 'var(--c-surface2, #F0F3F9)',
                    border: '1px solid var(--c-border, #E2E8F0)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="label" style={{ margin: 0, fontSize: 12 }}>Perceptual Hash:</span>
                      <span className="mono" style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--c-danger, #EE5D50)' }}>
                        {hash}
                      </span>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--c-text2, #5A6A85)' }}>
                      Reused across {evs.length} distinct records
                    </span>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
                    gap: 12,
                  }}>
                    {evs.map(e => (
                      <div
                        key={e.id}
                        style={{
                          background: '#FFFFFF',
                          border: '1px solid var(--c-border, #E2E8F0)',
                          borderRadius: 'var(--radius-sm, 8px)',
                          padding: '10px 14px',
                          fontSize: 12.5,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="mono" style={{ fontWeight: 700, color: 'var(--c-text, #1E293B)' }}>
                            Evidence #{e.id}
                          </span>
                          <StatusBadge status="open" />
                        </div>
                        <div style={{ color: 'var(--c-text2, #5A6A85)', marginTop: 4 }}>
                          <Link href={`/batches/${e.batch_id}`} style={{ color: 'var(--c-accent, #4361EE)', textDecoration: 'none', fontWeight: 500 }}>
                            Batch #{e.batch_id}
                          </Link>
                          <span style={{ margin: '0 4px' }}>&bull;</span>
                          <span style={{ textTransform: 'capitalize' }}>{e.evidence_type}</span>
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--c-text3, #75839C)', marginTop: 3 }}>
                          {formatDateTime(e.uploaded_at)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="filter-bar">
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', fontWeight: 500, color: 'var(--c-text, #1E293B)' }}>
          <input
            type="checkbox"
            checked={filterFlagged}
            onChange={e => setFilterFlagged(e.target.checked)}
            style={{ accentColor: 'var(--c-accent, #4361EE)', width: 16, height: 16 }}
          />
          <span>Show flagged duplicate records only ({flaggedCount})</span>
        </label>
      </div>

      {/* Evidence Table */}
      {loading ? (
        <LoadingSpinner rows={8} label="Loading evidence media assets..." />
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 60 }}># ID</th>
                  <th>Batch</th>
                  <th>Evidence Type</th>
                  <th>Perceptual Hash</th>
                  <th>Uploaded At</th>
                  <th>Source</th>
                  <th style={{ textAlign: 'right' }}>Status Flag</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map(e => (
                  <tr key={e.id}>
                    <td className="mono" style={{ color: 'var(--c-text3, #75839C)' }}>#{e.id}</td>
                    <td>
                      <Link
                        href={`/batches/${e.batch_id}`}
                        style={{ color: 'var(--c-accent, #4361EE)', fontWeight: 600, textDecoration: 'none' }}
                        className="mono"
                      >
                        Batch #{e.batch_id}
                      </Link>
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>{e.evidence_type}</td>
                    <td className="mono" style={{ color: e.is_flagged ? 'var(--c-danger, #EE5D50)' : 'var(--c-text2, #5A6A85)', fontWeight: e.is_flagged ? 600 : 400 }}>
                      {e.image_hash || '—'}
                    </td>
                    <td style={{ fontSize: 12.5, color: 'var(--c-text2, #5A6A85)' }}>
                      {formatDateTime(e.uploaded_at)}
                    </td>
                    <td style={{ textTransform: 'capitalize', fontSize: 12.5 }}>{e.source}</td>
                    <td style={{ textAlign: 'right' }}>
                      {e.is_flagged ? (
                        <StatusBadge status="open" />
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--c-text3, #75839C)' }}>Verified Clean</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {displayed.length === 0 && (
            <EmptyState
              title="No Evidence Records"
              message="No evidence photo or document uploads match the current filter."
            />
          )}
        </div>
      )}
    </AppLayout>
  );
}
