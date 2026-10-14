'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import RiskBadge from '@/components/ui/RiskBadge';
import MetricCard from '@/components/ui/MetricCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { api } from '@/lib/api';
import { MatchResult } from '@/types';
import { formatDateTime } from '@/lib/utils';

export default function MatchingPage() {
  const [results, setResults] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [runMsg, setRunMsg] = useState('');
  const [selected, setSelected] = useState<MatchResult | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await api.getMatchingResults();
      setResults(data);
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
      setRunMsg(`Matching complete: ${r.matches_found} matches found, ${r.conflicts_found} enrolment conflicts.`);
      await load();
    } catch {
      setRunMsg('Beneficiary matching run failed.');
    } finally {
      setRunning(false);
    }
  }

  const conflicts = results.filter(r => r.is_conflict);
  const highConf = results.filter(r => !r.is_conflict && r.match_level === 'high');
  const possible = results.filter(r => !r.is_conflict && r.match_level === 'possible');

  return (
    <AppLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Beneficiary Identity Matching</h1>
          <p className="page-subtitle">Probabilistic duplicate enrolment detection across demographic and biometric surrogate vectors</p>
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
            onClick={runMatch}
            disabled={running}
            className="btn btn-primary btn-sm"
          >
            {running ? 'Running Matching...' : 'Run Beneficiary Matching'}
          </button>
        </div>
      </div>

      {/* Advisory Banner */}
      <div style={{
        background: '#EFF2F1',
        border: '1px solid var(--c-border)',
        borderRadius: 4,
        padding: '10px 14px',
        fontSize: 12,
        color: 'var(--c-text2)',
        marginBottom: 20,
      }}>
        <strong style={{ color: 'var(--c-navy)' }}>Matching Protocol:</strong> Matches are computed using string distance, mobile surrogate tokens, and bank account token similarity. High confidence matches require field verification of original identity proof documents before corrective deduplication.
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
        <MetricCard
          label="Enrolment Conflicts"
          value={conflicts.length}
          sub="Simultaneous active enrolments"
          accent="critical"
        />
        <MetricCard
          label="High Confidence Matches"
          value={highConf.length}
          sub="Similarity score ≥ 85%"
          accent="warning"
        />
        <MetricCard
          label="Possible Matches"
          value={possible.length}
          sub="Similarity score 60% – 84%"
          accent="default"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 440px' : '1fr', gap: 20, alignItems: 'start' }}>
        {/* Results List */}
        <div>
          {loading ? (
            <LoadingSpinner rows={8} label="Loading matching candidates..." />
          ) : results.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <p>No duplicate records found. Click "Run Beneficiary Matching" to scan across all enrolments.</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {results.map(r => {
                const isSelected = selected?.anomaly_id === r.anomaly_id;
                const score = r.confidence_score ?? 0;
                const scoreColor = r.is_conflict ? '#B54747' : score >= 85 ? '#B77928' : '#287D79';

                return (
                  <div
                    key={r.anomaly_id}
                    onClick={() => setSelected(isSelected ? null : r)}
                    className="card"
                    style={{
                      cursor: 'pointer',
                      borderColor: isSelected ? 'var(--c-teal)' : 'var(--c-border)',
                      padding: '16px 18px',
                      transition: 'border-color 0.12s',
                    }}
                  >
                    {/* Header Strip with Conflict banner or No conflict badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                      {r.is_conflict ? (
                        <div style={{
                          background: '#FDEAEA',
                          border: '1px solid #E8BABA',
                          borderRadius: 4,
                          padding: '4px 10px',
                          color: '#B54747',
                          fontSize: 11,
                          fontWeight: 600,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                        }}>
                          Concurrent Enrolment Conflict
                        </div>
                      ) : (
                        <div style={{
                          background: '#EAF4EF',
                          border: '1px solid #B5DCC8',
                          borderRadius: 4,
                          padding: '4px 10px',
                          color: '#31785B',
                          fontSize: 11,
                          fontWeight: 600,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                        }}>
                          {r.match_level ? `${r.match_level} Confidence Match` : 'Potential Match'}
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: scoreColor }}>
                          {score.toFixed(0)}%
                        </span>
                        <RiskBadge level={r.severity} size="sm" />
                      </div>
                    </div>

                    {/* Side-by-side beneficiary comparison: two columns separated by center confidence column */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 90px 1fr',
                      gap: 12,
                      alignItems: 'center',
                    }}>
                      {/* Left: Beneficiary A */}
                      <div style={{
                        background: 'var(--c-surface2)',
                        border: '1px solid var(--c-border)',
                        borderRadius: 4,
                        padding: '10px 12px',
                      }}>
                        <div className="label" style={{ fontSize: 10, color: 'var(--c-text2)', marginBottom: 2 }}>Candidate A</div>
                        <div style={{ fontWeight: 600, color: 'var(--c-navy)', fontSize: 13 }}>
                          {r.beneficiary_a?.name || '—'}
                        </div>
                        <div className="mono" style={{ fontSize: 11, color: 'var(--c-text2)', marginTop: 2 }}>
                          {r.beneficiary_a?.token || '—'}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--c-text2)', marginTop: 2 }}>
                          {r.beneficiary_a?.district || '—'}
                        </div>
                      </div>

                      {/* Center: Confidence & Bar */}
                      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <span className="mono" style={{ fontSize: 11, fontWeight: 600, color: scoreColor }}>
                          {score.toFixed(0)}%
                        </span>
                        <div className="risk-bar-track" style={{ width: '100%', height: 4 }}>
                          <div
                            className="risk-bar-fill"
                            style={{
                              width: `${Math.min(100, Math.max(0, score))}%`,
                              backgroundColor: scoreColor,
                            }}
                          />
                        </div>
                        <span style={{ fontSize: 10, color: 'var(--c-text2)', letterSpacing: '0.04em' }}>
                          MATCH
                        </span>
                      </div>

                      {/* Right: Beneficiary B */}
                      <div style={{
                        background: 'var(--c-surface2)',
                        border: '1px solid var(--c-border)',
                        borderRadius: 4,
                        padding: '10px 12px',
                      }}>
                        <div className="label" style={{ fontSize: 10, color: 'var(--c-text2)', marginBottom: 2 }}>Candidate B</div>
                        <div style={{ fontWeight: 600, color: 'var(--c-navy)', fontSize: 13 }}>
                          {r.beneficiary_b?.name || '—'}
                        </div>
                        <div className="mono" style={{ fontSize: 11, color: 'var(--c-text2)', marginTop: 2 }}>
                          {r.beneficiary_b?.token || '—'}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--c-text2)', marginTop: 2 }}>
                          {r.beneficiary_b?.district || '—'}
                        </div>
                      </div>
                    </div>

                    {r.conflict_description && (
                      <div style={{
                        marginTop: 12,
                        padding: '6px 10px',
                        borderRadius: 4,
                        background: '#FDEAEA',
                        border: '1px solid #E8BABA',
                        fontSize: 12,
                        color: '#B54747',
                      }}>
                        {r.conflict_description}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Detail Panel */}
        {selected && (
          <div className="detail-panel">
            <div className="detail-panel-header">
              <div>
                <span className="section-label">Candidate Match Comparison</span>
                <div style={{ fontWeight: 600, color: 'var(--c-navy)', fontSize: 14 }}>
                  Anomaly #{selected.anomaly_id}
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
              {/* Confidence Bar */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span className="label">Similarity Confidence</span>
                  <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: selected.is_conflict ? '#B54747' : '#287D79' }}>
                    {selected.confidence_score?.toFixed(1)}%
                  </span>
                </div>
                <div className="risk-bar-track" style={{ height: 6 }}>
                  <div
                    className="risk-bar-fill"
                    style={{
                      width: `${Math.min(100, Math.max(0, selected.confidence_score ?? 0))}%`,
                      backgroundColor: selected.is_conflict ? '#B54747' : '#287D79',
                    }}
                  />
                </div>
              </div>

              {selected.conflict_description && (
                <div style={{
                  background: '#FDEAEA',
                  border: '1px solid #E8BABA',
                  borderRadius: 4,
                  padding: '8px 12px',
                  color: '#B54747',
                  fontSize: 12,
                  marginBottom: 16,
                  lineHeight: '18px',
                }}>
                  <strong>Conflict:</strong> {selected.conflict_description}
                </div>
              )}

              {/* Side-by-side attributes comparison */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                {[
                  { title: 'Record A', ben: selected.beneficiary_a },
                  { title: 'Record B', ben: selected.beneficiary_b },
                ].map(({ title, ben }, i) => (
                  <div
                    key={i}
                    style={{
                      background: 'var(--c-surface2)',
                      border: '1px solid var(--c-border)',
                      borderRadius: 4,
                      padding: '10px 12px',
                      fontSize: 12,
                    }}
                  >
                    <div className="label" style={{ color: 'var(--c-navy)', marginBottom: 6 }}>{title}</div>
                    <div style={{ marginBottom: 6 }}>
                      <span className="label" style={{ fontSize: 10 }}>Name:</span>
                      <div style={{ fontWeight: 600 }}>{ben?.name}</div>
                    </div>
                    <div style={{ marginBottom: 6 }}>
                      <span className="label" style={{ fontSize: 10 }}>Token:</span>
                      <div className="mono" style={{ fontSize: 11 }}>{ben?.token}</div>
                    </div>
                    <div style={{ marginBottom: 6 }}>
                      <span className="label" style={{ fontSize: 10 }}>Age / District:</span>
                      <div>{ben?.age} yrs · {ben?.district}</div>
                    </div>
                    <div style={{ marginBottom: 6 }}>
                      <span className="label" style={{ fontSize: 10 }}>Mobile Token:</span>
                      <div className="mono" style={{ fontSize: 11, color: 'var(--c-text2)' }}>{ben?.mobile_token}</div>
                    </div>
                    <div>
                      <span className="label" style={{ fontSize: 10 }}>Bank Token:</span>
                      <div className="mono" style={{ fontSize: 11, color: 'var(--c-text2)' }}>{ben?.bank_account_token}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Match Reasons */}
              {selected.reasons && selected.reasons.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div className="section-label" style={{ marginBottom: 6 }}>Matching Signals</div>
                  <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: 'var(--c-text2)', lineHeight: '18px' }}>
                    {selected.reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div style={{
                background: '#FDF3E3',
                border: '1px solid #E8D5A3',
                borderRadius: 4,
                padding: '8px 12px',
                fontSize: 12,
                color: '#B77928',
                marginBottom: 16,
              }}>
                <strong>Required Protocol:</strong> Physical photo identity records must be corroborated prior to initiating de-duplication or subsidy recovery procedures.
              </div>

              <div className="mono" style={{ fontSize: 11, color: 'var(--c-text2)' }}>
                Detected: {formatDateTime(selected.detected_at)}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
