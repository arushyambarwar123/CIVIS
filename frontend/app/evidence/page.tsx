'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import MetricCard from '@/components/ui/MetricCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
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
      setEvidence(data);
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
      setRunMsg(`Evidence analysis complete: ${r.anomalies_detected?.duplicate_images || 0} duplicates, ${r.anomalies_detected?.geo_mismatches || 0} geo mismatches detected.`);
      await load();
    } catch {
      setRunMsg('Evidence analysis run failed.');
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Evidence Media Verification</h1>
          <p className="page-subtitle">Automated perceptual hash matching and telemetry validation across inspection photos</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {runMsg && (
            <span style={{
              fontSize: 12,
              padding: '4px 10px',
              borderRadius: 4,
              backgroundColor: runMsg.includes('failed') ? '#FDEAEA' : '#EAF4EF',
              color: runMsg.includes('failed') ? '#B54747' : '#31785B',
              border: `1px solid ${runMsg.includes('failed') ? '#DCE2E3' : '#B5DCC8'}`,
            }}>
              {runMsg}
            </span>
          )}
          <button
            onClick={runAnalysis}
            disabled={running}
            className="btn btn-primary btn-sm"
          >
            {running ? 'Running Analysis...' : 'Run Evidence Analysis'}
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
        <MetricCard
          label="Total Evidence Records"
          value={evidence.length}
          sub="Uploaded verification assets"
          accent="default"
        />
        <MetricCard
          label="Flagged Duplicates"
          value={flaggedCount}
          sub="Potential reused media"
          accent="critical"
        />
        <MetricCard
          label="Duplicate Hash Clusters"
          value={duplicateHashes.length}
          sub="Collision sets identified"
          accent="warning"
        />
      </div>

      {/* Duplicate Hash Clusters Section */}
      {duplicateHashes.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <div>
              <span className="section-label">Duplicate Hash Clusters</span>
              <div style={{ fontSize: 13, color: 'var(--c-text2)', marginTop: 2 }}>
                Cross-batch image reuse detected via identical perceptual image hashes
              </div>
            </div>
            <span className="mono" style={{ fontSize: 12, color: '#B54747', fontWeight: 600 }}>
              {duplicateHashes.length} Collision Sets
            </span>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {duplicateHashes.map(([hash, evs]) => (
                <div
                  key={hash}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 4,
                    background: 'var(--c-surface2)',
                    border: '1px solid var(--c-border)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="label" style={{ margin: 0 }}>Perceptual Hash:</span>
                      <span className="mono" style={{ fontSize: 12, fontWeight: 600, color: '#B54747' }}>
                        {hash}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--c-text2)' }}>
                      Reused across {evs.length} separate records
                    </span>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: 10,
                  }}>
                    {evs.map(e => (
                      <div
                        key={e.id}
                        style={{
                          background: '#fff',
                          border: '1px solid var(--c-border)',
                          borderRadius: 4,
                          padding: '8px 10px',
                          fontSize: 12,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="mono" style={{ fontWeight: 600, color: 'var(--c-navy)' }}>
                            Evidence #{e.id}
                          </span>
                          <StatusBadge status="open" />
                        </div>
                        <div style={{ color: 'var(--c-text2)', marginTop: 4 }}>
                          <Link href={`/batches/${e.batch_id}`} style={{ color: '#287D79', textDecoration: 'none' }}>
                            Batch #{e.batch_id}
                          </Link>
                          <span style={{ margin: '0 4px' }}>·</span>
                          <span>{e.evidence_type}</span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--c-text2)', marginTop: 2 }}>
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
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={filterFlagged}
            onChange={e => setFilterFlagged(e.target.checked)}
            style={{ accentColor: 'var(--c-teal)', width: 14, height: 14 }}
          />
          <span>Show flagged duplicate records only ({flaggedCount})</span>
        </label>
      </div>

      {/* Evidence Table */}
      {loading ? (
        <LoadingSpinner rows={8} label="Loading evidence records..." />
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
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
                  <td className="mono" style={{ color: 'var(--c-text2)' }}>#{e.id}</td>
                  <td>
                    <Link
                      href={`/batches/${e.batch_id}`}
                      style={{ color: '#287D79', fontWeight: 500, textDecoration: 'none' }}
                      className="mono"
                    >
                      Batch #{e.batch_id}
                    </Link>
                  </td>
                  <td style={{ textTransform: 'capitalize' }}>{e.evidence_type}</td>
                  <td className="mono" style={{ color: e.is_flagged ? '#B54747' : 'var(--c-text2)' }}>
                    {e.image_hash || '—'}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--c-text2)' }}>
                    {formatDateTime(e.uploaded_at)}
                  </td>
                  <td style={{ textTransform: 'capitalize', fontSize: 12 }}>{e.source}</td>
                  <td style={{ textAlign: 'right' }}>
                    {e.is_flagged ? (
                      <StatusBadge status="open" />
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--c-text2)' }}>Normal</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {displayed.length === 0 && (
            <div className="empty-state">
              <p>No evidence records found.</p>
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
}
