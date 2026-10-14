'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import MetricCard from '@/components/ui/MetricCard';
import AnomalyCard from '@/components/ui/AnomalyCard';
import RiskBadge from '@/components/ui/RiskBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { api } from '@/lib/api';
import { getSession, roleHomePath } from '@/lib/auth';
import { DashboardSummary, Anomaly, PriorityItem } from '@/types';
import { formatDate, riskColor } from '@/lib/utils';
import Link from 'next/link';

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
      setError('Cannot connect to backend. Ensure the server is running on port 8000.');
    } finally {
      setLoading(false);
    }
  }

  async function runChecks() {
    setRunning(true);
    setRunMsg('');
    try {
      const res = await api.runAllChecks();
      setRunMsg(`Analysis complete. ${JSON.stringify(res)}`);
      load();
    } catch {
      setRunMsg('Analysis failed.');
    } finally {
      setRunning(false);
    }
  }

  return (
    <AppLayout>
      <div style={{ marginBottom: 20 }}>
        <h1 className="page-title">Central Administration Dashboard</h1>
        <p className="page-subtitle">System-wide monitoring, risk overview, and inspection priorities</p>
      </div>

      {error && (
        <div style={{ padding: '14px 18px', borderRadius: 4, background: '#FDEAEA', border: '1px solid #E8C4C4', color: '#B54747', fontSize: 13, marginBottom: 20 }}>
          {error}
          <button onClick={load} style={{ marginLeft: 12, fontSize: 12, color: '#287D79', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Retry</button>
        </div>
      )}

      {loading ? (
        <LoadingSpinner rows={8} label="Loading dashboard data..." />
      ) : data ? (
        <>
          {/* Primary metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 16 }}>
            <MetricCard label="Total Centres" value={data.total_centres} sub="Training centres on file" />
            <MetricCard label="Active Batches" value={data.active_batches} sub="Currently running" />
            <MetricCard label="Total Beneficiaries" value={data.total_beneficiaries} sub="Enrolled individuals" />
            <MetricCard label="Open Anomalies" value={data.open_anomalies} sub="Requiring review" accent={data.open_anomalies > 0 ? 'warning' : 'default'} />
          </div>

          {/* Secondary metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
            <MetricCard label="High Risk Centres" value={data.high_risk_centres} accent="warning" />
            <MetricCard label="Critical Risk" value={data.critical_risk_centres} accent="critical" />
            <MetricCard label="Pending Inspections" value={data.pending_inspections} />
            <MetricCard label="Overdue Actions" value={data.overdue_actions} accent={data.overdue_actions > 0 ? 'warning' : 'default'} />
          </div>

          {/* Risk distribution */}
          <div className="card" style={{ marginBottom: 24, padding: '18px 20px' }}>
            <div className="section-label" style={{ marginBottom: 12 }}>Risk Distribution</div>
            {(['low', 'medium', 'high', 'critical'] as const).map(level => {
              const count = (data.risk_distribution as any)?.[level] || 0;
              const total = data.total_centres || 1;
              const pct = Math.round((count / total) * 100);
              const colors: Record<string, string> = { low: '#31785B', medium: '#B77928', high: '#C4652A', critical: '#B54747' };
              return (
                <div key={level} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ width: 60, fontSize: 12, color: '#64717D', textTransform: 'capitalize' }}>{level}</span>
                  <div style={{ flex: 1, height: 8, background: '#EFF2F1', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: colors[level], borderRadius: 4 }} />
                  </div>
                  <span style={{ width: 28, fontSize: 12, color: '#202B35', textAlign: 'right', fontWeight: 500 }}>{count}</span>
                </div>
              );
            })}
          </div>

          {/* Recent anomalies + Top priorities */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20 }}>
            {/* Recent Anomalies */}
            <div className="card">
              <div className="card-header">
                <span className="section-label">Recent Anomalies</span>
                <Link href="/anomalies" style={{ fontSize: 12, color: '#287D79', textDecoration: 'none' }}>View all</Link>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                {(data.recent_anomalies || []).length === 0 ? (
                  <div style={{ padding: 20, textAlign: 'center', fontSize: 13, color: '#64717D' }}>No recent anomalies.</div>
                ) : (
                  (data.recent_anomalies || []).map((a: any, i: number) => (
                    <div key={a.id || i} style={{ padding: '10px 16px', borderBottom: '1px solid #DCE2E3', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 13, color: '#202B35', fontWeight: 500 }}>{(a.anomaly_type || '').replace(/_/g, ' ')}</div>
                        <div style={{ fontSize: 11, color: '#64717D', marginTop: 2 }}>{a.entity_type} #{a.entity_id} — {formatDate(a.detected_at)}</div>
                      </div>
                      <RiskBadge level={a.severity} />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top priorities */}
            <div className="card">
              <div className="card-header">
                <span className="section-label">Top Inspection Priorities</span>
                <Link href="/priority" style={{ fontSize: 12, color: '#287D79', textDecoration: 'none' }}>View queue</Link>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                {(data.top_priorities || []).length === 0 ? (
                  <div style={{ padding: 20, textAlign: 'center', fontSize: 13, color: '#64717D' }}>No priorities computed.</div>
                ) : (
                  (data.top_priorities || []).map((p: any, i: number) => (
                    <div key={p.centre_id || i} style={{ padding: '10px 16px', borderBottom: '1px solid #DCE2E3', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#202B35' }}>
                          <span style={{ color: '#64717D', marginRight: 6 }}>#{p.rank || i + 1}</span>
                          <Link href={`/centres/${p.centre_id}`} style={{ color: '#287D79', textDecoration: 'none' }}>{p.centre_name || p.centre_code}</Link>
                        </div>
                        <div style={{ fontSize: 11, color: '#64717D', marginTop: 2 }}>
                          {p.days_since_inspection != null ? `${p.days_since_inspection}d since last inspection` : 'Never inspected'}
                        </div>
                      </div>
                      <RiskBadge level={p.risk_level} score={p.risk_score} />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Run all checks */}
          <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={runChecks} disabled={running} className="btn btn-primary" style={{ fontSize: 12 }}>
              {running ? 'Running...' : 'Run All Analysis Checks'}
            </button>
            {runMsg && <span style={{ fontSize: 12, color: '#64717D' }}>{runMsg}</span>}
          </div>
        </>
      ) : null}
    </AppLayout>
  );
}
