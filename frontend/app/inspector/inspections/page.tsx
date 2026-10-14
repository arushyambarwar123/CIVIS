'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { getSession, CivisSession } from '@/lib/auth';
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

type TabType = 'all' | 'pending' | 'in_progress' | 'completed';

export default function InspectorInspectionsPage() {
  const router = useRouter();
  const [session, setSession] = useState<CivisSession | null>(null);
  const [inspections, setInspections] = useState<MyInspection[]>([]);
  const [centresMap, setCentresMap] = useState<Record<number, TrainingCentre>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const s = getSession();
    setSession(s);

    if (s && s.role === 'INSPECTOR') {
      loadInspections();
    } else {
      setLoading(false);
    }
  }, []);

  async function loadInspections() {
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
      setError(err?.message || 'Failed to retrieve inspector assignments.');
    } finally {
      setLoading(false);
    }
  }

  // Guard: INSPECTOR only
  if (!loading && (!session || session.role !== 'INSPECTOR')) {
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
            This inspection list is restricted to Field Inspectors only. You are currently
            signed in with role{' '}
            <strong className="mono" style={{ color: 'var(--c-text)' }}>
              {session?.role || 'None'}
            </strong>
            .
          </p>
          <Link
            href="/"
            className="btn btn-primary"
            style={{ display: 'inline-flex', margin: '0 auto' }}
          >
            Return to Dashboard
          </Link>
        </div>
      </AppLayout>
    );
  }

  // Calculate tab counts
  const allCount = inspections.length;
  const pendingCount = inspections.filter(
    (i) => i.status === 'scheduled' || i.status === 'pending'
  ).length;
  const inProgressCount = inspections.filter(
    (i) => i.status === 'in_progress'
  ).length;
  const completedCount = inspections.filter(
    (i) =>
      i.status === 'submitted' ||
      i.status === 'completed' ||
      i.status === 'resolved'
  ).length;

  // Filter list by tab
  const tabFiltered = inspections.filter((i) => {
    if (activeTab === 'pending') {
      return i.status === 'scheduled' || i.status === 'pending';
    }
    if (activeTab === 'in_progress') {
      return i.status === 'in_progress';
    }
    if (activeTab === 'completed') {
      return (
        i.status === 'submitted' ||
        i.status === 'completed' ||
        i.status === 'resolved'
      );
    }
    return true; // 'all'
  });

  // Filter list by search query
  const filtered = tabFiltered.filter((i) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const centre = centresMap[i.centre_id];
    const matchId = String(i.id).includes(q);
    const matchCentreName = centre?.centre_name.toLowerCase().includes(q) ?? false;
    const matchCentreCode = centre?.centre_code.toLowerCase().includes(q) ?? false;
    const matchDistrict = centre?.district.toLowerCase().includes(q) ?? false;
    const matchStatus = i.status.toLowerCase().includes(q);
    const matchCompliance = (i.compliance_status || '').toLowerCase().includes(q);
    return matchId || matchCentreName || matchCentreCode || matchDistrict || matchStatus || matchCompliance;
  });

  function handleRowClick(id: number) {
    router.push(`/inspections/${id}`);
  }

  return (
    <AppLayout>
      {/* Page Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 className="page-title">My Assigned Inspections</h1>
        <p className="page-subtitle">
          View assigned training centre inspection schedule, field status, and compliance results
        </p>
      </div>

      {/* Filter and Tab Bar */}
      <div className="filter-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: 'all' as TabType, label: 'All', count: allCount },
            { id: 'pending' as TabType, label: 'Pending', count: pendingCount },
            { id: 'in_progress' as TabType, label: 'In Progress', count: inProgressCount },
            { id: 'completed' as TabType, label: 'Completed', count: completedCount },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: active ? 600 : 400,
                  background: active ? 'var(--c-surface2)' : 'var(--c-surface)',
                  border: `1px solid ${active ? 'var(--c-teal)' : 'var(--c-border)'}`,
                  color: active ? 'var(--c-teal)' : 'var(--c-text)',
                  cursor: 'pointer',
                  transition: 'background 0.12s, border-color 0.12s',
                }}
              >
                <span>{tab.label}</span>
                <span
                  className="mono"
                  style={{
                    fontSize: 11,
                    padding: '1px 5px',
                    borderRadius: 3,
                    background: active ? 'rgba(40,125,121,0.15)' : 'var(--c-surface2)',
                    color: active ? 'var(--c-teal)' : 'var(--c-text2)',
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div style={{ minWidth: 240 }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search centre, ID, district..."
            className="input"
            style={{ fontSize: 12 }}
          />
        </div>
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

      {/* Main Inspections Table */}
      {loading ? (
        <LoadingSpinner rows={8} label="Loading assigned inspections..." />
      ) : inspections.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <p style={{ fontWeight: 500, color: 'var(--c-navy)', marginBottom: 4 }}>
              No inspections assigned
            </p>
            <p style={{ fontSize: 12, color: 'var(--c-text2)' }}>
              You currently do not have any inspection assignments allocated to your account.
            </p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <p style={{ fontWeight: 500, color: 'var(--c-navy)', marginBottom: 4 }}>
              No matching inspections found
            </p>
            <p style={{ fontSize: 12, color: 'var(--c-text2)', marginBottom: 16 }}>
              No records match your active tab and search criteria.
            </p>
            <button
              onClick={() => {
                setActiveTab('all');
                setSearch('');
              }}
              className="btn btn-ghost btn-sm"
            >
              Reset Filters
            </button>
          </div>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: 80 }}>ID</th>
                <th>Centre</th>
                <th>Scheduled Date</th>
                <th>Status</th>
                <th>Compliance</th>
                <th style={{ textAlign: 'right', width: 100 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const centre = centresMap[item.centre_id];
                const centreName = centre?.centre_name || `Centre #${item.centre_id}`;
                const centreCode = centre?.centre_code || `CTR-${item.centre_id}`;
                const location = centre ? `${centre.district}, ${centre.state}` : '—';

                return (
                  <tr
                    key={item.id}
                    onClick={() => handleRowClick(item.id)}
                    style={{
                      cursor: 'pointer',
                      transition: 'background-color 0.1s',
                    }}
                  >
                    {/* ID */}
                    <td className="mono" style={{ fontWeight: 600, color: 'var(--c-navy)' }}>
                      #{item.id}
                    </td>

                    {/* Centre */}
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--c-navy)', fontSize: 13 }}>
                        {centreName}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--c-text2)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          marginTop: 2,
                        }}
                      >
                        <span className="mono">{centreCode}</span>
                        <span>•</span>
                        <span>{location}</span>
                        {item.batch_id && (
                          <>
                            <span>•</span>
                            <span className="mono">Batch #{item.batch_id}</span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Date */}
                    <td>
                      <div style={{ fontSize: 13, color: 'var(--c-text)' }}>
                        {formatDate(item.inspection_date)}
                      </div>
                    </td>

                    {/* Status */}
                    <td>
                      <StatusBadge status={item.status} />
                    </td>

                    {/* Compliance */}
                    <td>
                      {item.compliance_status ? (
                        <StatusBadge status={item.compliance_status} />
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--c-text2)' }}>Pending</span>
                      )}
                    </td>

                    {/* Action */}
                    <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <Link
                        href={`/inspections/${item.id}`}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '3px 8px', fontSize: 11 }}
                      >
                        Open →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AppLayout>
  );
}
