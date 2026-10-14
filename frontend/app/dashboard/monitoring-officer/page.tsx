'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import MetricCard from '@/components/ui/MetricCard';
import RiskBadge from '@/components/ui/RiskBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { api } from '@/lib/api';
import { getSession, roleHomePath } from '@/lib/auth';
import { formatDate } from '@/lib/utils';

export default function MonitoringOfficerDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<any>(null);
  const [inspectors, setInspectors] = useState<any[]>([]);
  const [recentInspections, setRecentInspections] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const session = getSession();
    if (!session) { router.replace('/login'); return; }
    if (session.role !== 'MONITORING_OFFICER') {
      router.replace(roleHomePath(session.role));
      return;
    }
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [dash, insp, inspList] = await Promise.all([
        api.getDashboard().catch(() => null),
        api.getInspectors().catch(() => []),
        api.getInspections({ status: 'submitted' }).catch(() => []),
      ]);
      setDashboard(dash);
      setInspectors(insp || []);
      setRecentInspections((inspList || []).slice(0, 8));
    } catch (e: any) {
      setError(e?.message || 'Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  }

  const session = typeof window !== 'undefined' ? getSession() : null;
  const totalActive = inspectors.reduce((s: number, i: any) => s + (i.active_inspections || 0), 0);
  const totalCompleted = inspectors.reduce((s: number, i: any) => s + (i.completed_inspections || 0), 0);

  return (
    <AppLayout>
      <div style={{ marginBottom: 20 }}>
        <h1 className="page-title">Monitoring Officer Dashboard</h1>
        <p className="page-subtitle">
          Regional oversight — {session?.region || 'All regions'} jurisdiction
        </p>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 4, background: '#FDEAEA', border: '1px solid #E8C4C4', color: '#B54747', fontSize: 13, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {loading ? (
        <LoadingSpinner rows={6} label="Loading monitoring dashboard..." />
      ) : (
        <>
          {/* Metrics row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
            <MetricCard label="Inspectors Under Command" value={inspectors.length} sub={`${session?.region || 'Regional'} team`} />
            <MetricCard label="Active Inspections" value={totalActive} sub="Across all inspectors" accent={totalActive > 0 ? 'warning' : 'default'} />
            <MetricCard label="Completed Reports" value={totalCompleted} sub="Submitted field reports" accent="positive" />
            <MetricCard label="Open Anomalies" value={dashboard?.open_anomalies ?? 0} sub="Requiring attention" accent={(dashboard?.open_anomalies ?? 0) > 0 ? 'warning' : 'default'} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 20, alignItems: 'start' }}>
            {/* Inspector workloads */}
            <div className="card">
              <div className="card-header">
                <div>
                  <span className="section-label">Inspector Workloads</span>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-navy)', marginTop: 2 }}>Field Team ({inspectors.length})</div>
                </div>
                <Link href="/monitoring/inspectors" className="btn btn-ghost btn-sm" style={{ fontSize: 11 }}>Full Directory</Link>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                {inspectors.length === 0 ? (
                  <div style={{ padding: 20, textAlign: 'center', fontSize: 13, color: '#64717D' }}>No inspectors in your jurisdiction.</div>
                ) : (
                  inspectors.map((insp: any, idx: number) => (
                    <div key={insp.employee_id} style={{
                      padding: '12px 16px', borderBottom: idx < inspectors.length - 1 ? '1px solid var(--c-border)' : 'none',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--c-navy)' }}>{insp.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--c-text2)', marginTop: 2 }}>
                          <span className="mono">{insp.inspector_id || insp.employee_id}</span>
                          <span style={{ margin: '0 6px' }}>·</span>
                          {insp.assigned_area || insp.region || 'Unassigned'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{
                          fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 4,
                          background: (insp.active_inspections || 0) >= 4 ? '#FDEAEA' : (insp.active_inspections || 0) >= 2 ? '#FFF4E5' : '#E8F5E9',
                          color: (insp.active_inspections || 0) >= 4 ? '#B54747' : (insp.active_inspections || 0) >= 2 ? '#B77928' : '#31785B',
                        }}>
                          {insp.active_inspections || 0} active
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--c-text2)' }}>{insp.completed_inspections || 0} done</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent submitted inspections */}
            <div className="card">
              <div className="card-header">
                <div>
                  <span className="section-label">Recently Submitted</span>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-navy)', marginTop: 2 }}>Inspection Reports ({recentInspections.length})</div>
                </div>
                <Link href="/inspections" className="btn btn-ghost btn-sm" style={{ fontSize: 11 }}>All Inspections</Link>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                {recentInspections.length === 0 ? (
                  <div style={{ padding: 20, textAlign: 'center', fontSize: 13, color: '#64717D' }}>No submitted reports.</div>
                ) : (
                  recentInspections.map((insp: any, idx: number) => (
                    <div key={insp.id} style={{
                      padding: '12px 16px', borderBottom: idx < recentInspections.length - 1 ? '1px solid var(--c-border)' : 'none',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <div>
                        <Link href={`/inspections/${insp.id}`} style={{ fontSize: 13, fontWeight: 500, color: 'var(--c-teal)', textDecoration: 'none' }}>
                          Inspection #{insp.id}
                        </Link>
                        <div style={{ fontSize: 11, color: 'var(--c-text2)', marginTop: 2 }}>
                          Centre #{insp.centre_id} — {formatDate(insp.inspection_date)}
                        </div>
                      </div>
                      <StatusBadge status={insp.compliance_status || insp.status} />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </AppLayout>
  );
}
