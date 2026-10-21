'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import MetricCard from '@/components/ui/MetricCard';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { getSession, CivisSession, roleHomePath } from '@/lib/auth';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { TrainingCentre } from '@/types';

interface MyInspection {
  id: number;
  centre_id: number;
  batch_id: number | null;
  inspection_date: string | null;
  compliance_status: string;
  status: string;
  duration_minutes: number | null;
}

export default function InspectorDashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<CivisSession | null>(null);
  const [inspections, setInspections] = useState<MyInspection[]>([]);
  const [centresMap, setCentresMap] = useState<Record<number, TrainingCentre>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const s = getSession();
    setSession(s);

    if (!s) {
      router.replace('/login');
      return;
    }

    if (s.role !== 'INSPECTOR') {
      router.replace(roleHomePath(s.role));
      return;
    }

    loadData();
  }, [router]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [inspData, centreData] = await Promise.all([
        api.getMyInspections(),
        api.getCentres().catch(() => [] as TrainingCentre[]),
      ]);

      setInspections(inspData || []);

      const map: Record<number, TrainingCentre> = {};
      if (Array.isArray(centreData)) {
        centreData.forEach((c: TrainingCentre) => {
          map[c.id] = c;
        });
      }
      setCentresMap(map);
    } catch (err: any) {
      setError(err?.message || 'Failed to load assigned inspections.');
    } finally {
      setLoading(false);
    }
  }

  if (loading && !session) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--c-bg, #F4F7FE)', color: 'var(--c-text2, #8F9BBA)', fontSize: 13,
      }}>
        Loading Inspector Workspace...
      </div>
    );
  }

  if (!session || session.role !== 'INSPECTOR') {
    return (
      <AppLayout>
        <div
          className="card"
          style={{
            maxWidth: 580,
            margin: '40px auto',
            padding: '36px 32px',
            textAlign: 'center',
          }}
        >
          <div style={{
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--c-danger, #EE5D50)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 10,
          }}>
            403 Forbidden
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--c-text, #2B3674)', marginBottom: 8 }}>
            Access Restricted
          </h2>
          <p style={{ fontSize: 14, color: 'var(--c-text2, #8F9BBA)', lineHeight: 1.5, marginBottom: 24 }}>
            This page is restricted to Field Inspectors only. You are currently logged in with role{' '}
            <strong style={{ color: 'var(--c-accent, #4361EE)' }}>{session?.role || 'None'}</strong>.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            style={{ display: 'inline-flex', margin: '0 auto' }}
            onClick={() => router.push(session ? roleHomePath(session.role) : '/login')}
          >
            Return to Dashboard
          </button>
        </div>
      </AppLayout>
    );
  }

  const pendingList = inspections.filter(
    (i) => i.status === 'scheduled' || i.status === 'pending'
  );
  const inProgressList = inspections.filter((i) => i.status === 'in_progress');
  const completedList = inspections.filter(
    (i) =>
      i.status === 'submitted' ||
      i.status === 'completed' ||
      i.status === 'resolved'
  );

  const pendingCount = pendingList.length;
  const inProgressCount = inProgressList.length;
  const completedCount = completedList.length;
  const totalCount = inspections.length;
  const upcomingAndActive = [...inProgressList, ...pendingList];

  return (
    <AppLayout>
      {/* Top Banner */}
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title">Field Inspector Command</h1>
        <p className="page-subtitle">
          On-site physical audits, trainee headcount verifications, and compliance findings
        </p>
      </div>

      {/* Inspector Identification Card */}
      <div
        className="card"
        style={{
          padding: '20px 24px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div className="section-label" style={{ marginBottom: 4 }}>
            Active Field Inspector
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--c-text, #2B3674)' }}>
            {session.name}
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            marginTop: 6,
            fontSize: 13,
            color: 'var(--c-text2, #8F9BBA)',
            flexWrap: 'wrap',
          }}>
            <span>
              Inspector ID: <strong className="mono" style={{ color: 'var(--c-text, #2B3674)' }}>{session.inspector_id || session.employee_id}</strong>
            </span>
            <span>&bull;</span>
            <span>
              Assigned Area: <strong style={{ color: 'var(--c-text, #2B3674)' }}>{session.assigned_area || session.region || 'Regional Sector'}</strong>
            </span>
            <span>&bull;</span>
            <span>
              Jurisdiction: <strong style={{ color: 'var(--c-text, #2B3674)' }}>{session.region || 'National'}</strong>
            </span>
          </div>
        </div>

        <div>
          <Link href="/inspector/inspections" className="btn btn-ghost btn-sm">
            View All Assigned ({totalCount})
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 18,
        marginBottom: 24,
      }}>
        <MetricCard
          label="Pending Audits"
          value={pendingCount}
          sub="Scheduled for on-site visit"
          accent={pendingCount > 0 ? 'warning' : 'default'}
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          }
        />
        <MetricCard
          label="In Progress"
          value={inProgressCount}
          sub="Active field verification"
          accent="info"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
            </svg>
          }
        />
        <MetricCard
          label="Completed"
          value={completedCount}
          sub="Submitted verification reports"
          accent="positive"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          }
        />
        <MetricCard
          label="Total Assigned"
          value={totalCount}
          sub="Cumulative inspection load"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
          }
        />
      </div>

      {error && (
        <div style={{
          padding: '14px 18px',
          borderRadius: 'var(--radius-sm, 8px)',
          backgroundColor: 'var(--c-danger-bg, #FFF0EF)',
          border: '1px solid #FFD3CE',
          color: 'var(--c-danger, #EE5D50)',
          fontSize: 13,
          marginBottom: 24,
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <LoadingSpinner rows={6} label="Fetching assigned site roster..." />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))',
          gap: 24,
          alignItems: 'start',
        }}>
          {/* Upcoming & Active Section */}
          <div className="card">
            <div className="card-header">
              <div>
                <span className="section-label">Active Site Visits</span>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--c-text, #2B3674)', marginTop: 2 }}>
                  Pending Verification ({upcomingAndActive.length})
                </div>
              </div>
              <Link href="/inspector/inspections" className="btn btn-ghost btn-sm">
                View All
              </Link>
            </div>

            <div style={{ padding: 0 }}>
              {upcomingAndActive.length === 0 ? (
                <div style={{ padding: 36, textAlign: 'center', color: 'var(--c-text3, #A3AED0)', fontSize: 13 }}>
                  No pending inspections assigned.
                </div>
              ) : (
                upcomingAndActive.map((insp, idx) => {
                  const centre = centresMap[insp.centre_id];
                  const centreName = centre?.centre_name || `Centre #${insp.centre_id}`;
                  const centreCode = centre?.centre_code || `CTR-${insp.centre_id}`;
                  const location = centre ? `${centre.district}, ${centre.state}` : 'Location on record';

                  return (
                    <div
                      key={insp.id}
                      style={{
                        padding: '14px 20px',
                        borderBottom: idx < upcomingAndActive.length - 1 ? '1px solid var(--c-border, #E9EDF7)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                          <Link
                            href={`/inspections/${insp.id}`}
                            style={{
                              fontSize: 14,
                              fontWeight: 600,
                              color: 'var(--c-accent, #4361EE)',
                              textDecoration: 'none',
                            }}
                          >
                            {centreName}
                          </Link>
                          <span className="mono" style={{ fontSize: 12, color: 'var(--c-text3, #A3AED0)' }}>
                            {centreCode}
                          </span>
                        </div>
                        <div style={{
                          fontSize: 12,
                          color: 'var(--c-text2, #8F9BBA)',
                          display: 'flex',
                          gap: 10,
                          flexWrap: 'wrap',
                          marginTop: 3,
                        }}>
                          <span>{location}</span>
                          <span>&bull;</span>
                          <span>Scheduled: {formatDate(insp.inspection_date)}</span>
                          {insp.batch_id && (
                            <>
                              <span>&bull;</span>
                              <span className="mono">Batch #{insp.batch_id}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        <StatusBadge status={insp.status} />
                        <Link
                          href={`/inspections/${insp.id}`}
                          className="btn btn-primary btn-sm"
                          style={{ padding: '6px 12px', fontSize: 12 }}
                        >
                          Conduct
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Submission History Section */}
          <div className="card">
            <div className="card-header">
              <div>
                <span className="section-label">Report Archive</span>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--c-text, #2B3674)', marginTop: 2 }}>
                  Completed Reports ({completedList.length})
                </div>
              </div>
            </div>

            <div style={{ padding: 0 }}>
              {completedList.length === 0 ? (
                <div style={{ padding: 36, textAlign: 'center', color: 'var(--c-text3, #A3AED0)', fontSize: 13 }}>
                  No completed reports submitted yet.
                </div>
              ) : (
                completedList.map((insp, idx) => {
                  const centre = centresMap[insp.centre_id];
                  const centreName = centre?.centre_name || `Centre #${insp.centre_id}`;
                  const centreCode = centre?.centre_code || `CTR-${insp.centre_id}`;

                  return (
                    <div
                      key={insp.id}
                      style={{
                        padding: '14px 20px',
                        borderBottom: idx < completedList.length - 1 ? '1px solid var(--c-border, #E9EDF7)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                          <Link
                            href={`/inspections/${insp.id}`}
                            style={{
                              fontSize: 14,
                              fontWeight: 600,
                              color: 'var(--c-text, #2B3674)',
                              textDecoration: 'none',
                            }}
                          >
                            {centreName}
                          </Link>
                          <span className="mono" style={{ fontSize: 12, color: 'var(--c-text3, #A3AED0)' }}>
                            {centreCode}
                          </span>
                        </div>
                        <div style={{
                          fontSize: 12,
                          color: 'var(--c-text2, #8F9BBA)',
                          display: 'flex',
                          gap: 10,
                          marginTop: 3,
                        }}>
                          <span>Date: {formatDate(insp.inspection_date)}</span>
                          {insp.duration_minutes !== null && (
                            <>
                              <span>&bull;</span>
                              <span>{insp.duration_minutes} mins duration</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        <StatusBadge status={insp.compliance_status || 'compliant'} />
                        <Link
                          href={`/inspections/${insp.id}`}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '6px 12px', fontSize: 12 }}
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
