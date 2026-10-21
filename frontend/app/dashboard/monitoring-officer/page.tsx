'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import MetricCard from '@/components/ui/MetricCard';
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
      setError(e?.message || 'Failed to load monitoring dashboard.');
    } finally {
      setLoading(false);
    }
  }

  const session = typeof window !== 'undefined' ? getSession() : null;
  const totalActive = inspectors.reduce((s: number, i: any) => s + (i.active_inspections || 0), 0);
  const totalCompleted = inspectors.reduce((s: number, i: any) => s + (i.completed_inspections || 0), 0);

  return (
    <AppLayout>
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title">Monitoring Officer Operations</h1>
        <p className="page-subtitle">
          Regional oversight &bull; {session?.region || 'All regions'} jurisdiction &bull; Field team assignments
        </p>
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
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <LoadingSpinner rows={6} label="Loading monitoring command data..." />
      ) : (
        <>
          {/* Metrics Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 18,
            marginBottom: 24,
          }}>
            <MetricCard
              label="Inspectors Under Command"
              value={inspectors.length}
              sub={`${session?.region || 'Regional'} squad`}
              accent="info"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              }
            />
            <MetricCard
              label="Active Inspections"
              value={totalActive}
              sub="Currently ongoing on-site"
              accent={totalActive > 0 ? 'warning' : 'default'}
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                </svg>
              }
            />
            <MetricCard
              label="Completed Reports"
              value={totalCompleted}
              sub="Submitted field verifications"
              accent="positive"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              }
            />
            <MetricCard
              label="Open Anomalies"
              value={dashboard?.open_anomalies ?? 0}
              sub="Awaiting investigation"
              accent={(dashboard?.open_anomalies ?? 0) > 0 ? 'critical' : 'positive'}
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              }
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: 24, alignItems: 'start' }}>
            {/* Inspector Workloads */}
            <div className="card">
              <div className="card-header">
                <div>
                  <span className="section-label">Field Force</span>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--c-text, #2B3674)', marginTop: 2 }}>
                    Inspector Roster &amp; Workload ({inspectors.length})
                  </div>
                </div>
                <Link href="/monitoring/inspectors" className="btn btn-ghost btn-sm">
                  Full Directory
                </Link>
              </div>

              <div style={{ padding: 0 }}>
                {inspectors.length === 0 ? (
                  <div style={{ padding: 32, textAlign: 'center', fontSize: 13, color: 'var(--c-text3, #A3AED0)' }}>
                    No inspectors assigned in your jurisdiction.
                  </div>
                ) : (
                  inspectors.map((insp: any, idx: number) => (
                    <div
                      key={insp.employee_id}
                      style={{
                        padding: '14px 20px',
                        borderBottom: idx < inspectors.length - 1 ? '1px solid var(--c-border, #E9EDF7)' : 'none',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-text, #2B3674)' }}>
                          {insp.name}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--c-text2, #8F9BBA)', marginTop: 3 }}>
                          <span className="mono">{insp.inspector_id || insp.employee_id}</span>
                          <span style={{ margin: '0 6px' }}>&bull;</span>
                          {insp.assigned_area || insp.region || 'Unassigned District'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '3px 10px',
                          borderRadius: '50px',
                          background: (insp.active_inspections || 0) >= 4 ? 'var(--c-danger-bg, #FFF0EF)' : (insp.active_inspections || 0) >= 2 ? 'var(--c-warning-bg, #FFF8EC)' : 'var(--c-success-bg, #E6FBF3)',
                          color: (insp.active_inspections || 0) >= 4 ? 'var(--c-danger, #EE5D50)' : (insp.active_inspections || 0) >= 2 ? 'var(--c-warning, #FFB547)' : 'var(--c-success, #01B574)',
                        }}>
                          {insp.active_inspections || 0} active
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--c-text3, #A3AED0)' }}>
                          {insp.completed_inspections || 0} completed
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Submitted Inspections */}
            <div className="card">
              <div className="card-header">
                <div>
                  <span className="section-label">Field Reports</span>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--c-text, #2B3674)', marginTop: 2 }}>
                    Recent Submissions ({recentInspections.length})
                  </div>
                </div>
                <Link href="/inspections" className="btn btn-ghost btn-sm">
                  All Inspections
                </Link>
              </div>

              <div style={{ padding: 0 }}>
                {recentInspections.length === 0 ? (
                  <div style={{ padding: 32, textAlign: 'center', fontSize: 13, color: 'var(--c-text3, #A3AED0)' }}>
                    No submitted reports available.
                  </div>
                ) : (
                  recentInspections.map((insp: any, idx: number) => (
                    <div
                      key={insp.id}
                      style={{
                        padding: '14px 20px',
                        borderBottom: idx < recentInspections.length - 1 ? '1px solid var(--c-border, #E9EDF7)' : 'none',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <div>
                        <Link
                          href={`/inspections/${insp.id}`}
                          style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-accent, #4361EE)', textDecoration: 'none' }}
                        >
                          Inspection #{insp.id}
                        </Link>
                        <div style={{ fontSize: 12, color: 'var(--c-text2, #8F9BBA)', marginTop: 3 }}>
                          Centre #{insp.centre_id} &bull; {formatDate(insp.inspection_date)}
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
