'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import MetricCard from '@/components/ui/MetricCard';
import RiskBadge from '@/components/ui/RiskBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { api } from '@/lib/api';
import { getSession, roleHomePath } from '@/lib/auth';
import { DashboardSummary } from '@/types';
import { formatDate } from '@/lib/utils';

export default function CentralAdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [running, setRunning] = useState(false);
  const [runMsg, setRunMsg] = useState('');

  useEffect(() => {
    const session = getSession();
    if (!session) { router.replace('/login'); return; }
    if (session.role !== 'CENTRAL_ADMIN') {
      router.replace(roleHomePath(session.role));
      return;
    }
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const d = await api.getDashboard();
      setData(d);
    } catch {
      setError('Cannot connect to backend. Ensure the backend is reachable.');
    } finally {
      setLoading(false);
    }
  }

  async function runChecks() {
    setRunning(true);
    setRunMsg('');
    try {
      const res = await api.runAllChecks();
      setRunMsg(`Analysis completed successfully.`);
      load();
    } catch {
      setRunMsg('Analysis execution failed.');
    } finally {
      setRunning(false);
    }
  }

  return (
    <AppLayout>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">Central Administration Overview</h1>
          <p className="page-subtitle">National monitoring, AI anomaly signals, and high-priority site queues</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={runChecks}
            disabled={running}
            className="btn btn-primary"
            style={{ borderRadius: 'var(--radius-pill, 50px)', padding: '10px 20px' }}
          >
            {running ? (
              <>Running Engine...</>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                Run All Verification Checks
              </>
            )}
          </button>
          {runMsg && <span style={{ fontSize: 13, color: 'var(--c-teal, #287D79)', fontWeight: 500 }}>{runMsg}</span>}
        </div>
      </div>

      {error && (
        <div style={{
          padding: '14px 18px',
          borderRadius: 'var(--radius-sm, 8px)',
          background: 'var(--c-danger-bg, #FFF0EF)',
          border: '1px solid #FFD3CE',
          color: 'var(--c-danger, #EE5D50)',
          fontSize: 13,
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span>{error}</span>
          <button
            onClick={load}
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--c-accent, #4361EE)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <LoadingSpinner rows={8} label="Aggregating scheme metrics..." />
      ) : data ? (
        <>
          {/* Primary Metrics Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 18,
            marginBottom: 20,
          }}>
            <MetricCard
              label="Total Centres"
              value={data.total_centres}
              sub="Registered training hubs"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"></path>
                </svg>
              }
            />
            <MetricCard
              label="Active Batches"
              value={data.active_batches}
              sub="Training currently live"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                  <polyline points="2 17 12 22 22 17"></polyline>
                  <polyline points="2 12 12 17 22 12"></polyline>
                </svg>
              }
            />
            <MetricCard
              label="Total Beneficiaries"
              value={data.total_beneficiaries}
              sub="Enrolled scheme trainees"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                </svg>
              }
            />
            <MetricCard
              label="Open Anomalies"
              value={data.open_anomalies}
              sub="Pending investigation"
              accent={data.open_anomalies > 0 ? 'warning' : 'positive'}
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              }
            />
          </div>

          {/* Secondary Metrics Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 18,
            marginBottom: 24,
          }}>
            <MetricCard label="High Risk Centres" value={data.high_risk_centres} accent="warning" sub="Target for audit" />
            <MetricCard label="Critical Risk" value={data.critical_risk_centres} accent="critical" sub="Action required" />
            <MetricCard label="Pending Inspections" value={data.pending_inspections} accent="info" sub="Assigned to field" />
            <MetricCard label="Overdue Actions" value={data.overdue_actions} accent={data.overdue_actions > 0 ? 'critical' : 'positive'} sub="Deadline exceeded" />
          </div>

          {/* Risk Distribution Card */}
          <div className="card" style={{ marginBottom: 24, padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <span className="section-label">Risk Distribution</span>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--c-text, #2B3674)', marginTop: 2 }}>
                  Scheme Risk Segmentation
                </div>
              </div>
              <span style={{ fontSize: 13, color: 'var(--c-text2, #8F9BBA)' }}>
                {data.total_centres} Total Centres
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              {(['low', 'medium', 'high', 'critical'] as const).map(level => {
                const count = (data.risk_distribution as any)?.[level] || 0;
                const total = data.total_centres || 1;
                const pct = Math.round((count / total) * 100);
                const colors: Record<string, string> = {
                  low: 'var(--c-success, #01B574)',
                  medium: 'var(--c-warning, #FFB547)',
                  high: '#FF8800',
                  critical: 'var(--c-danger, #EE5D50)',
                };
                return (
                  <div key={level} style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md, 12px)',
                    background: 'var(--c-surface2, #F0F3F9)',
                    border: '1px solid var(--c-border, #E9EDF7)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, textTransform: 'capitalize', color: 'var(--c-text, #2B3674)' }}>
                        {level} Risk
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: colors[level] }}>
                        {count} <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--c-text3, #A3AED0)' }}>({pct}%)</span>
                      </span>
                    </div>
                    <div style={{ height: 6, background: '#E2E8F0', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: colors[level], borderRadius: 4 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Anomalies & Top Priorities Split */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: 24 }}>
            {/* Recent Anomalies */}
            <div className="card">
              <div className="card-header">
                <div>
                  <span className="section-label">Signal Detection</span>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--c-text, #2B3674)', marginTop: 2 }}>
                    Recent Flagged Anomalies
                  </div>
                </div>
                <Link href="/anomalies" className="btn btn-ghost btn-sm">
                  View All
                </Link>
              </div>

              <div style={{ padding: 0 }}>
                {(data.recent_anomalies || []).length === 0 ? (
                  <div style={{ padding: 32, textAlign: 'center', fontSize: 13, color: 'var(--c-text3, #A3AED0)' }}>
                    No recent anomalies detected.
                  </div>
                ) : (
                  (data.recent_anomalies || []).map((a: any, i: number) => (
                    <div
                      key={a.id || i}
                      style={{
                        padding: '14px 20px',
                        borderBottom: i < (data.recent_anomalies?.length || 0) - 1 ? '1px solid var(--c-border, #E9EDF7)' : 'none',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 14, color: 'var(--c-text, #2B3674)', fontWeight: 600 }}>
                          {(a.anomaly_type || '').replace(/_/g, ' ')}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--c-text2, #8F9BBA)', marginTop: 3 }}>
                          {a.entity_type} #{a.entity_id} &bull; {formatDate(a.detected_at)}
                        </div>
                      </div>
                      <RiskBadge level={a.severity} />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top Priorities */}
            <div className="card">
              <div className="card-header">
                <div>
                  <span className="section-label">Inspection Queue</span>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--c-text, #2B3674)', marginTop: 2 }}>
                    Top Inspection Targets
                  </div>
                </div>
                <Link href="/priority" className="btn btn-ghost btn-sm">
                  View Priority Queue
                </Link>
              </div>

              <div style={{ padding: 0 }}>
                {(data.top_priorities || []).length === 0 ? (
                  <div style={{ padding: 32, textAlign: 'center', fontSize: 13, color: 'var(--c-text3, #A3AED0)' }}>
                    No priority rankings computed.
                  </div>
                ) : (
                  (data.top_priorities || []).map((p: any, i: number) => (
                    <div
                      key={p.centre_id || i}
                      style={{
                        padding: '14px 20px',
                        borderBottom: i < (data.top_priorities?.length || 0) - 1 ? '1px solid var(--c-border, #E9EDF7)' : 'none',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-text3, #A3AED0)' }}>
                            #{p.rank || i + 1}
                          </span>
                          <Link
                            href={`/centres/${p.centre_id}`}
                            style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-accent, #4361EE)', textDecoration: 'none' }}
                          >
                            {p.centre_name || p.centre_code}
                          </Link>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--c-text2, #8F9BBA)', marginTop: 3 }}>
                          {p.days_since_inspection != null ? `${p.days_since_inspection}d since last audit` : 'Never inspected'}
                        </div>
                      </div>
                      <RiskBadge level={p.risk_level} score={p.risk_score} />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </AppLayout>
  );
}
