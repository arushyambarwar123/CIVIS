'use client';

import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import RiskBadge from '@/components/ui/RiskBadge';
import MetricCard from '@/components/ui/MetricCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { api } from '@/lib/api';
import { MatchResult } from '@/types';
import { formatDateTime } from '@/lib/utils';

export default function MatchingPage() {
  const [results, setResults] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [runMsg, setRunMsg] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'conflicts' | 'high' | 'possible'>('all');

  async function load() {
    setLoading(true);
    try {
      const data = await api.getMatchingResults();
      setResults(data || []);
      if (data && data.length > 0 && selectedId === null) {
        setSelectedId(data[0].anomaly_id);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function runMatch() {
    setRunning(true);
    setRunMsg('');
    try {
      const r = await api.runMatching();
      setRunMsg(`Completed: ${r.matches_found} matches identified, ${r.conflicts_found} enrolment conflicts.`);
      await load();
    } catch {
      setRunMsg('Beneficiary identity matching scan failed.');
    } finally {
      setRunning(false);
    }
  }

  const conflicts = results.filter(r => r.is_conflict);
  const highConf = results.filter(r => !r.is_conflict && r.match_level === 'high');
  const possible = results.filter(r => !r.is_conflict && r.match_level === 'possible');

  const filteredResults = results.filter(r => {
    if (filterType === 'conflicts') return r.is_conflict;
    if (filterType === 'high') return !r.is_conflict && r.match_level === 'high';
    if (filterType === 'possible') return !r.is_conflict && r.match_level === 'possible';
    return true;
  });

  const selectedMatch = results.find(r => r.anomaly_id === selectedId) || results[0] || null;

  return (
    <AppLayout>
      {/* 1. Page Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 24,
      }}>
        <div>
          <h1 className="page-title">Beneficiary Identity Matching</h1>
          <p className="page-subtitle">
            Deduplication and concurrent enrolment verification across demographic and biometric surrogates
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
            onClick={runMatch}
            disabled={running}
            className="btn btn-primary"
            style={{ borderRadius: 'var(--radius-sm, 8px)' }}
          >
            {running ? 'Executing Engine...' : 'Run Identity Matching'}
          </button>
        </div>
      </div>

      {/* 2. Summary Row (Standard Cards) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: 16,
        marginBottom: 24,
      }}>
        <MetricCard
          label="Total Matches"
          value={results.length}
          sub="Pairs requiring audit"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          }
        />
        <MetricCard
          label="Concurrent Conflicts"
          value={conflicts.length}
          sub="Simultaneous active training"
          accent="critical"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          }
        />
        <MetricCard
          label="High Confidence"
          value={highConf.length}
          sub="Similarity score ≥ 85%"
          accent="warning"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
          }
        />
        <MetricCard
          label="Possible Matches"
          value={possible.length}
          sub="Similarity score 60% – 84%"
          accent="info"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          }
        />
      </div>

      {/* 3. Main Matching Operational Layout */}
      {loading ? (
        <LoadingSpinner rows={6} label="Scanning identity registries..." />
      ) : results.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No Matching Records Found"
            message="No duplicate identity vectors or enrolment collisions were detected. Click 'Run Identity Matching' to scan active beneficiary records."
            action={
              <button onClick={runMatch} className="btn btn-primary btn-sm">
                Initiate Scan
              </button>
            }
          />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 24, alignItems: 'start' }}>
          {/* Left Column: Match Pair Selector */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="card-header" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="section-label">Candidate Pairs</span>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-text, #1E293B)', marginTop: 2 }}>
                  Records ({filteredResults.length})
                </div>
              </div>

              {/* Filter Pills */}
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  type="button"
                  onClick={() => setFilterType('all')}
                  className={`btn btn-sm ${filterType === 'all' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ padding: '4px 8px', fontSize: 11, height: 26 }}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('conflicts')}
                  className={`btn btn-sm ${filterType === 'conflicts' ? 'btn-danger' : 'btn-ghost'}`}
                  style={{ padding: '4px 8px', fontSize: 11, height: 26 }}
                >
                  Conflicts
                </button>
              </div>
            </div>

            <div style={{ maxHeight: 600, overflowY: 'auto', padding: 0 }}>
              {filteredResults.map(r => {
                const isSelected = selectedMatch?.anomaly_id === r.anomaly_id;
                const score = r.confidence_score ?? 0;
                return (
                  <div
                    key={r.anomaly_id}
                    onClick={() => setSelectedId(r.anomaly_id)}
                    style={{
                      padding: '14px 18px',
                      borderBottom: '1px solid var(--c-border, #E2E8F0)',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(67, 97, 238, 0.06)' : 'transparent',
                      borderLeft: isSelected ? '3px solid var(--c-accent, #4361EE)' : '3px solid transparent',
                      transition: 'all 0.12s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'var(--c-surface2, #F0F3F9)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text, #1E293B)' }}>
                        {r.beneficiary_a?.name || 'Candidate A'} &bull; {r.beneficiary_b?.name || 'Candidate B'}
                      </span>
                      <span style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: r.is_conflict ? 'var(--c-danger, #EE5D50)' : 'var(--c-accent, #4361EE)',
                        fontVariantNumeric: 'tabular-nums',
                      }}>
                        {score.toFixed(0)}%
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                      <span className="mono" style={{ fontSize: 11, color: 'var(--c-text3, #75839C)' }}>
                        {r.beneficiary_a?.token || '—'}
                      </span>
                      <span style={{
                        fontSize: 10.5,
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-pill, 50px)',
                        background: r.is_conflict ? 'var(--c-danger-bg, #FFF0EF)' : 'var(--c-info-bg, #EEF2FF)',
                        color: r.is_conflict ? 'var(--c-danger, #EE5D50)' : 'var(--c-info, #4361EE)',
                      }}>
                        {r.is_conflict ? 'CONFLICT' : `${r.match_level?.toUpperCase() || 'MATCH'}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Main Matching Operational Card */}
          {selectedMatch ? (
            <div className="card">
              {/* Header inside the primary card */}
              <div className="card-header" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--c-text, #1E293B)' }}>
                      Match Record Comparison
                    </span>
                    <span className="mono" style={{ fontSize: 12, color: 'var(--c-text3, #75839C)' }}>
                      Anomaly #{selectedMatch.anomaly_id}
                    </span>
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--c-text2, #5A6A85)', marginTop: 3 }}>
                    Detected on {formatDateTime(selectedMatch.detected_at)}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  {/* Prominent Confidence Display */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--c-text3, #75839C)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Match Confidence
                    </div>
                    <div style={{
                      fontSize: 22,
                      fontWeight: 800,
                      color: selectedMatch.is_conflict ? 'var(--c-danger, #EE5D50)' : 'var(--c-accent, #4361EE)',
                      lineHeight: 1.1,
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      {(selectedMatch.confidence_score ?? 0).toFixed(0)}%
                    </div>
                  </div>

                  <RiskBadge level={selectedMatch.severity} size="md" />
                </div>
              </div>

              {/* Conflict Alert Banner if applicable */}
              {selectedMatch.conflict_description && (
                <div style={{
                  margin: '20px 24px 0',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm, 8px)',
                  background: 'var(--c-danger-bg, #FFF0EF)',
                  border: '1px solid #FFD3CE',
                  color: 'var(--c-danger, #EE5D50)',
                  fontSize: 13,
                  lineHeight: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  <div>
                    <strong>Conflict Detected: </strong>
                    {selectedMatch.conflict_description}
                  </div>
                </div>
              )}

              {/* Source vs Matched Record - Separated cleanly inside primary card */}
              <div className="card-body" style={{ padding: '24px' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 20,
                  background: 'var(--c-surface2, #F0F3F9)',
                  borderRadius: 'var(--radius-md, 12px)',
                  border: '1px solid var(--c-border, #E2E8F0)',
                  padding: '20px',
                }}>
                  {/* Record A */}
                  <div>
                    <div style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--c-text, #1E293B)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: 14,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--c-accent, #4361EE)' }} />
                      Primary Record (Candidate A)
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div>
                        <span className="label" style={{ fontSize: 11, marginBottom: 2 }}>Full Name</span>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-text, #1E293B)' }}>
                          {selectedMatch.beneficiary_a?.name || '—'}
                        </div>
                      </div>

                      <div>
                        <span className="label" style={{ fontSize: 11, marginBottom: 2 }}>Beneficiary Token</span>
                        <div className="mono" style={{ fontSize: 12.5, color: 'var(--c-text, #1E293B)' }}>
                          {selectedMatch.beneficiary_a?.token || '—'}
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div>
                          <span className="label" style={{ fontSize: 11, marginBottom: 2 }}>Age</span>
                          <div style={{ fontSize: 13, color: 'var(--c-text, #1E293B)' }}>
                            {selectedMatch.beneficiary_a?.age ? `${selectedMatch.beneficiary_a.age} years` : '—'}
                          </div>
                        </div>
                        <div>
                          <span className="label" style={{ fontSize: 11, marginBottom: 2 }}>District</span>
                          <div style={{ fontSize: 13, color: 'var(--c-text, #1E293B)' }}>
                            {selectedMatch.beneficiary_a?.district || '—'}
                          </div>
                        </div>
                      </div>

                      <div>
                        <span className="label" style={{ fontSize: 11, marginBottom: 2 }}>Mobile Surrogate Token</span>
                        <div className="mono" style={{ fontSize: 12, color: 'var(--c-text2, #5A6A85)' }}>
                          {selectedMatch.beneficiary_a?.mobile_token || '—'}
                        </div>
                      </div>

                      <div>
                        <span className="label" style={{ fontSize: 11, marginBottom: 2 }}>Bank Account Surrogate</span>
                        <div className="mono" style={{ fontSize: 12, color: 'var(--c-text2, #5A6A85)' }}>
                          {selectedMatch.beneficiary_a?.bank_account_token || '—'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Record B */}
                  <div style={{ borderLeft: '1px solid var(--c-border, #E2E8F0)', paddingLeft: 20 }}>
                    <div style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--c-text, #1E293B)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: 14,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--c-warning, #FFB547)' }} />
                      Matched Record (Candidate B)
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div>
                        <span className="label" style={{ fontSize: 11, marginBottom: 2 }}>Full Name</span>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-text, #1E293B)' }}>
                          {selectedMatch.beneficiary_b?.name || '—'}
                        </div>
                      </div>

                      <div>
                        <span className="label" style={{ fontSize: 11, marginBottom: 2 }}>Beneficiary Token</span>
                        <div className="mono" style={{ fontSize: 12.5, color: 'var(--c-text, #1E293B)' }}>
                          {selectedMatch.beneficiary_b?.token || '—'}
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div>
                          <span className="label" style={{ fontSize: 11, marginBottom: 2 }}>Age</span>
                          <div style={{ fontSize: 13, color: 'var(--c-text, #1E293B)' }}>
                            {selectedMatch.beneficiary_b?.age ? `${selectedMatch.beneficiary_b.age} years` : '—'}
                          </div>
                        </div>
                        <div>
                          <span className="label" style={{ fontSize: 11, marginBottom: 2 }}>District</span>
                          <div style={{ fontSize: 13, color: 'var(--c-text, #1E293B)' }}>
                            {selectedMatch.beneficiary_b?.district || '—'}
                          </div>
                        </div>
                      </div>

                      <div>
                        <span className="label" style={{ fontSize: 11, marginBottom: 2 }}>Mobile Surrogate Token</span>
                        <div className="mono" style={{ fontSize: 12, color: 'var(--c-text2, #5A6A85)' }}>
                          {selectedMatch.beneficiary_b?.mobile_token || '—'}
                        </div>
                      </div>

                      <div>
                        <span className="label" style={{ fontSize: 11, marginBottom: 2 }}>Bank Account Surrogate</span>
                        <div className="mono" style={{ fontSize: 12, color: 'var(--c-text2, #5A6A85)' }}>
                          {selectedMatch.beneficiary_b?.bank_account_token || '—'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Evidence & Matching Signals Below */}
                <div style={{ marginTop: 24 }}>
                  <div className="section-label" style={{ marginBottom: 10 }}>
                    Triggered Matching Signals &amp; Heuristics
                  </div>

                  {selectedMatch.reasons && selectedMatch.reasons.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {selectedMatch.reasons.map((r, i) => (
                        <div
                          key={i}
                          style={{
                            padding: '10px 14px',
                            borderRadius: 'var(--radius-sm, 8px)',
                            background: '#FFFFFF',
                            border: '1px solid var(--c-border, #E2E8F0)',
                            fontSize: 13,
                            color: 'var(--c-text, #1E293B)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                          }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--c-accent, #4361EE)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: 13, color: 'var(--c-text2, #5A6A85)', margin: 0 }}>
                      Surrogate identifier match based on token collision.
                    </p>
                  )}
                </div>

                {/* Operational Protocol Guidance */}
                <div style={{
                  marginTop: 20,
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm, 8px)',
                  background: 'var(--c-surface2, #F0F3F9)',
                  border: '1px solid var(--c-border, #E2E8F0)',
                  fontSize: 12.5,
                  color: 'var(--c-text2, #5A6A85)',
                  lineHeight: 1.5,
                }}>
                  <strong style={{ color: 'var(--c-text, #1E293B)' }}>Verification Protocol: </strong>
                  Physical photo identity records and original biometric registration tokens must be verified before initiating deduplication, enrollment cancellation, or stipend recovery proceedings.
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </AppLayout>
  );
}
