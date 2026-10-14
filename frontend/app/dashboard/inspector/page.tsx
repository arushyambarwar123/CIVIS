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
      // Wrong role — send them to their own dashboard
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

  // Guard: still loading or wrong role (redirect already triggered above)
  if (loading && !session) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--c-bg)', color: 'var(--c-text2)', fontSize: 13,
      }}>
        Loading...
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
            padding: '32px 28px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#B54747',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 10,
            }}
          >
            403 Forbidden
          </div>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: 'var(--c-navy)',
              marginBottom: 8,
            }}
          >
            Access Denied
          </h2>
          <p
            style={{
              fontSize: 13,
              color: 'var(--c-text2)',
              lineHeight: '20px',
              marginBottom: 24,
            }}
          >
            This page is restricted to Field Inspectors only. You are currently
            signed in with role{' '}
            <strong className="mono" style={{ color: 'var(--c-text)' }}>
              {session?.role || 'None'}
            </strong>
            .
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
      <div style={{ marginBottom: 20 }}>
        <h1 className="page-title">Inspector Dashboard</h1>
        <p className="page-subtitle">
          Field inspection assignments, active site audits, and submitted findings
        </p>
      </div>

      {/* Inspector Identification Card */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <div className="section-label" style={{ marginBottom: 4 }}>
            Assigned Field Inspector
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: 'var(--c-navy)',
              letterSpacing: '-0.01em',
            }}
          >
            {session.name}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              marginTop: 6,
              fontSize: 12,
              color: 'var(--c-text2)',
              flexWrap: 'wrap',
            }}
          >
            <span>
              Inspector ID:{' '}
              <strong className="mono" style={{ color: 'var(--c-text)' }}>
                {session.inspector_id || session.employee_id}
              </strong>
            </span>
            <span>&bull;</span>
            <span>
              Assigned Area:{' '}
              <strong style={{ color: 'var(--c-text)' }}>
                {session.assigned_area || session.region || 'Field Division'}
              </strong>
            </span>
            <span>&bull;</span>
            <span>
              Region:{' '}
              <strong style={{ color: 'var(--c-text)' }}>
                {session.region || 'National'}
              </strong>
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/inspector/inspections" className="btn btn-ghost btn-sm">
            View All Inspections
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <MetricCard
          label="Pending Inspections"
          value={pendingCount}
          sub="Scheduled for on-site visit"
          accent={pendingCount > 0 ? 'warning' : 'default'}
        />
        <MetricCard
          label="In Progress"
          value={inProgressCount}
          sub="Active field verifications"
          accent="default"
        />
        <MetricCard
          label="Completed"
          value={completedCount}
          sub="Submitted verification reports"
          accent="positive"
        />
        <MetricCard
          label="Total Assigned"
          value={totalCount}
          sub="Cumulative inspection load"
          accent="default"
        />
      </div>

      {error && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 4,
            backgroundColor: '#FDEAEA',
            border: '1px solid #DCE2E3',
            color: '#B54747',
            fontSize: 13,
            marginBottom: 20,
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <LoadingSpinner rows={6} label="Loading assigned inspections..." />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
            gap: 20,
            alignItems: 'start',
          }}
        >
          {/* Upcoming & Pending Section */}
          <div className="card">
            <div className="card-header">
              <div>
                <span className="section-label">Upcoming &amp; Active</span>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-navy)', marginTop: 2 }}>
                  Pending Site Inspections ({upcomingAndActive.length})
                </div>
              </div>
              <Link
                href="/inspector/inspections"
                className="btn btn-ghost btn-sm"
                style={{ fontSize: 11 }}
              >
                Inspect All
              </Link>
            </div>

            <div className="card-body" style={{ padding: 0 }}>
              {upcomingAndActive.length === 0 ? (
                <div className="empty-state">
                  <p>No pending or active inspections assigned to your roster.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {upcomingAndActive.map((insp, idx) => {
                    const centre = centresMap[insp.centre_id];
                    const centreName = centre?.centre_name || `Centre #${insp.centre_id}`;
                    const centreCode = centre?.centre_code || `CTR-${insp.centre_id}`;
                    const location = centre ? `${centre.district}, ${centre.state}` : 'Location on file';

                    return (
                      <div
                        key={insp.id}
                        style={{
                          padding: '14px 18px',
                          borderBottom:
                            idx < upcomingAndActive.length - 1
                              ? '1px solid var(--c-border)'
                              : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                        }}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              marginBottom: 2,
                            }}
                          >
                            <Link
                              href={`/inspections/${insp.id}`}
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: 'var(--c-teal)',
                                textDecoration: 'none',
                              }}
                            >
                              {centreName}
                            </Link>
                            <span
                              className="mono"
                              style={{ fontSize: 11, color: 'var(--c-text2)' }}
                            >
                              {centreCode}
                            </span>
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: 'var(--c-text2)',
                              display: 'flex',
                              gap: 12,
                              flexWrap: 'wrap',
                              marginTop: 2,
                            }}
                          >
                            <span>{location}</span>
                            <span>&bull;</span>
                            <span>
                              Scheduled: {formatDate(insp.inspection_date)}
                            </span>
                            {insp.batch_id && (
                              <>
                                <span>&bull;</span>
                                <span className="mono">Batch #{insp.batch_id}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            flexShrink: 0,
                          }}
                        >
                          <StatusBadge status={insp.status} />
                          <Link
                            href={`/inspections/${insp.id}`}
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '4px 8px', fontSize: 11 }}
                          >
                            Conduct
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Recently Completed Section */}
          <div className="card">
            <div className="card-header">
              <div>
                <span className="section-label">Submission History</span>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-navy)', marginTop: 2 }}>
                  Recently Completed ({completedList.length})
                </div>
              </div>
              <span
                className="mono"
                style={{ fontSize: 11, color: 'var(--c-text2)' }}
              >
                Submitted Reports
              </span>
            </div>

            <div className="card-body" style={{ padding: 0 }}>
              {completedList.length === 0 ? (
                <div className="empty-state">
                  <p>No completed inspection reports submitted yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {completedList.map((insp, idx) => {
                    const centre = centresMap[insp.centre_id];
                    const centreName = centre?.centre_name || `Centre #${insp.centre_id}`;
                    const centreCode = centre?.centre_code || `CTR-${insp.centre_id}`;

                    return (
                      <div
                        key={insp.id}
                        style={{
                          padding: '14px 18px',
                          borderBottom:
                            idx < completedList.length - 1
                              ? '1px solid var(--c-border)'
                              : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                        }}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              marginBottom: 2,
                            }}
                          >
                            <Link
                              href={`/inspections/${insp.id}`}
                              style={{
                                fontSize: 13,
                                fontWeight: 500,
                                color: 'var(--c-navy)',
                                textDecoration: 'none',
                              }}
                            >
                              {centreName}
                            </Link>
                            <span
                              className="mono"
                              style={{ fontSize: 11, color: 'var(--c-text2)' }}
                            >
                              {centreCode}
                            </span>
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: 'var(--c-text2)',
                              display: 'flex',
                              gap: 12,
                              marginTop: 2,
                            }}
                          >
                            <span>Date: {formatDate(insp.inspection_date)}</span>
                            {insp.duration_minutes !== null && (
                              <>
                                <span>&bull;</span>
                                <span>{insp.duration_minutes} mins duration</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            flexShrink: 0,
                          }}
                        >
                          <StatusBadge
                            status={insp.compliance_status || 'compliant'}
                          />
                          <Link
                            href={`/inspections/${insp.id}`}
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '4px 8px', fontSize: 11 }}
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
