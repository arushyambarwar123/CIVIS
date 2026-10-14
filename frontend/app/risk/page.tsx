'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import RiskBadge from '@/components/ui/RiskBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { api } from '@/lib/api';
import { RiskScore } from '@/types';
import { formatDateTime, riskColor } from '@/lib/utils';

export default function RiskPage() {
  const [scores, setScores] = useState<RiskScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [result, setResult] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await api.getRiskScores('centre');
      setScores(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function recalculate() {
    setRecalculating(true);
    setResult('');
    try {
      await api.recalculateAllRisk();
      setResult('Risk scores recalculated successfully.');
      await load();
    } catch {
      setResult('Recalculation failed.');
    } finally {
      setRecalculating(false);
    }
  }

  const grouped: Record<string, RiskScore[]> = {
    critical: [],
    high: [],
    medium: [],
    low: [],
  };
  scores.forEach(s => {
    if (grouped[s.risk_level]) {
      grouped[s.risk_level].push(s);
    }
  });

  return (
    <AppLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Risk Assessment & Monitoring</h1>
          <p className="page-subtitle">Explainable risk scores across all registered training centres</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {result && (
            <span style={{
              fontSize: 12,
              padding: '4px 10px',
              borderRadius: 4,
              backgroundColor: result.includes('failed') ? '#FDEAEA' : '#EAF4EF',
              color: result.includes('failed') ? '#B54747' : '#31785B',
              border: `1px solid ${result.includes('failed') ? '#DCE2E3' : '#B5DCC8'}`,
            }}>
              {result}
            </span>
          )}
          <button
            onClick={recalculate}
            disabled={recalculating}
            className="btn btn-primary btn-sm"
          >
            {recalculating ? 'Recalculating...' : 'Recalculate Risk Scores'}
          </button>
        </div>
      </div>

      {/* Advisory Banner */}
      <div style={{
        background: '#FDF3E3',
        border: '1px solid #E8D5A3',
        borderRadius: 4,
        padding: '10px 14px',
        fontSize: 12,
        color: '#B77928',
        marginBottom: 20,
        lineHeight: '18px',
      }}>
        <strong>Monitoring Notice:</strong> Risk scores indicate inspection priority ranking only and do not constitute legal findings. All flagged centres require physical on-site verification before regulatory action.
      </div>

      {loading ? (
        <LoadingSpinner rows={8} label="Loading risk assessments..." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {(['critical', 'high', 'medium', 'low'] as const).map(level => {
            const list = grouped[level];
            if (list.length === 0) return null;

            return (
              <div key={level}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span className="section-label" style={{ color: riskColor(level) }}>
                    {level.toUpperCase()} RISK TIER ({list.length})
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {list.map(rs => {
                    const isExpanded = expandedId === rs.id;
                    const color = riskColor(rs.risk_level);

                    return (
                      <div key={rs.id} className="card">
                        <div
                          onClick={() => setExpandedId(isExpanded ? null : rs.id)}
                          style={{
                            padding: '14px 18px',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 16,
                            flexWrap: 'wrap',
                          }}
                        >
                          <div style={{ minWidth: 240, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontWeight: 600, color: 'var(--c-navy)', fontSize: 14 }}>
                                {rs.entity_name}
                              </span>
                              <span className="mono" style={{ color: 'var(--c-text2)', fontSize: 11 }}>
                                {rs.entity_code}
                              </span>
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--c-text2)', marginTop: 2 }}>
                              {rs.reasons?.length || 0} contributing factors · Updated {formatDateTime(rs.calculated_at)}
                            </div>
                          </div>

                          {/* Horizontal risk score track (0-100) */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 260 }}>
                            <div style={{ flex: 1 }}>
                              <div className="risk-bar-track" style={{ height: 6 }}>
                                <div
                                  className="risk-bar-fill"
                                  style={{
                                    width: `${Math.min(100, Math.max(0, rs.score))}%`,
                                    backgroundColor: color,
                                  }}
                                />
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 100, justifyContent: 'flex-end' }}>
                              <span className="mono" style={{ fontSize: 20, fontWeight: 700, color, lineHeight: 1 }}>
                                {rs.score}
                              </span>
                              <RiskBadge level={rs.risk_level} size="sm" />
                            </div>
                            <span style={{ fontSize: 12, color: 'var(--c-text2)', paddingLeft: 4 }}>
                              {isExpanded ? '▲' : '▼'}
                            </span>
                          </div>
                        </div>

                        {/* Expandable breakdown as definition list */}
                        {isExpanded && (
                          <div style={{
                            padding: '14px 18px',
                            borderTop: '1px solid var(--c-border)',
                            background: 'var(--c-surface2)',
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                              <span className="section-label">Risk Factor Contributions</span>
                              <Link
                                href={`/centres/${rs.entity_id}`}
                                className="btn btn-ghost btn-sm"
                                style={{ background: '#fff' }}
                              >
                                View Centre Profile →
                              </Link>
                            </div>

                            {(!rs.reasons || rs.reasons.length === 0) ? (
                              <p style={{ fontSize: 12, color: 'var(--c-text2)', margin: 0 }}>
                                Baseline risk level with no abnormal active flags.
                              </p>
                            ) : (
                              <dl style={{
                                margin: 0,
                                display: 'grid',
                                gridTemplateColumns: '220px 1fr 70px',
                                rowGap: 10,
                                columnGap: 14,
                                alignItems: 'center',
                              }}>
                                {rs.reasons.map((r, i) => {
                                  const factorPct = Math.min(100, (r.contribution / 40) * 100);
                                  return (
                                    <div key={i} style={{ display: 'contents' }}>
                                      <dt>
                                        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--c-text)' }}>
                                          {r.factor ? r.factor.replace(/_/g, ' ') : 'Factor'}
                                        </div>
                                        <div style={{ fontSize: 11, color: 'var(--c-text2)' }}>
                                          {r.description}
                                        </div>
                                      </dt>
                                      <dd style={{ margin: 0 }}>
                                        <div className="risk-bar-track" style={{ height: 5 }}>
                                          <div
                                            className="risk-bar-fill"
                                            style={{
                                              width: `${factorPct}%`,
                                              backgroundColor: color,
                                            }}
                                          />
                                        </div>
                                      </dd>
                                      <dd className="mono" style={{ margin: 0, fontSize: 12, fontWeight: 600, color, textAlign: 'right' }}>
                                        +{r.contribution}
                                      </dd>
                                    </div>
                                  );
                                })}
                              </dl>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
