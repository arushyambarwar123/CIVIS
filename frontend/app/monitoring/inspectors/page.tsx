'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { getSession, CivisSession } from '@/lib/auth';
import { api } from '@/lib/api';
import { formatDate, formatDateTime } from '@/lib/utils';

interface InspectorItem {
  id: number;
  employee_id: string;
  name: string;
  region: string | null;
  status: string;
  last_login: string | null;
  inspector_id: string;
  assigned_area: string | null;
  designation: string | null;
  phone: string | null;
  active_inspections: number;
  completed_inspections: number;
  workload: number;
}

interface WorkloadDetail {
  inspector_id: string;
  name: string;
  active_inspection_count: number;
  active_inspections: Array<{
    id: number;
    centre_id: number;
    status: string;
  }>;
}

export default function MonitoringInspectorsPage() {
  const [session, setSession] = useState<CivisSession | null>(null);
  const [inspectors, setInspectors] = useState<InspectorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedInspector, setSelectedInspector] = useState<InspectorItem | null>(null);
  const [workloadDetail, setWorkloadDetail] = useState<WorkloadDetail | null>(null);
  const [loadingWorkload, setLoadingWorkload] = useState(false);

  useEffect(() => {
    const s = getSession();
    setSession(s);

    if (s && (s.role === 'MONITORING_OFFICER' || s.role === 'CENTRAL_ADMIN')) {
      loadInspectors();
    } else {
      setLoading(false);
    }
  }, []);

  async function loadInspectors() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getInspectors();
      setInspectors(data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch inspector directory.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectInspector(inspector: InspectorItem) {
    if (selectedInspector?.id === inspector.id) {
      setSelectedInspector(null);
      setWorkloadDetail(null);
      return;
    }

    setSelectedInspector(inspector);
    setLoadingWorkload(true);
    try {
      const workload = await api.getInspectorWorkload(inspector.employee_id);
      setWorkloadDetail(workload);
    } catch {
      setWorkloadDetail(null);
    } finally {
      setLoadingWorkload(false);
    }
  }

  // Guard: MONITORING_OFFICER or CENTRAL_ADMIN
  const isAuthorized =
    session && (session.role === 'MONITORING_OFFICER' || session.role === 'CENTRAL_ADMIN');

  if (!loading && !isAuthorized) {
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
            This directory is restricted to Monitoring Officers and Central Authority
            administrators. Your current session ({session?.name || 'User'}, role:{' '}
            <strong className="mono" style={{ color: 'var(--c-text)' }}>
              {session?.role || 'None'}
            </strong>
            ) is not authorized.
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

  // Filter inspectors
  const filtered = inspectors.filter((insp) => {
    if (statusFilter && insp.status.toUpperCase() !== statusFilter.toUpperCase()) {
      return false;
    }
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const matchName = insp.name.toLowerCase().includes(q);
    const matchId = (insp.inspector_id || '').toLowerCase().includes(q);
    const matchEmp = (insp.employee_id || '').toLowerCase().includes(q);
    const matchArea = (insp.assigned_area || '').toLowerCase().includes(q);
    const matchRegion = (insp.region || '').toLowerCase().includes(q);
    return matchName || matchId || matchEmp || matchArea || matchRegion;
  });

  function getWorkloadBadge(workload: number) {
    if (workload >= 4) {
      return {
        label: `${workload} (Heavy)`,
        color: '#B54747',
        bg: '#FDEAEA',
      };
    }
    if (workload >= 2) {
      return {
        label: `${workload} (Moderate)`,
        color: '#B77928',
        bg: '#FDF3E3',
      };
    }
    return {
      label: `${workload} (Optimal)`,
      color: '#31785B',
      bg: '#EAF4EF',
    };
  }

  return (
    <AppLayout>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 className="page-title">Field Inspector Directory</h1>
        <p className="page-subtitle">
          Roster of assigned inspectors, jurisdiction areas, live active workloads, and audit metrics
        </p>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="filter-group">
          <label className="label">Search Inspector</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, inspector ID..."
            className="input"
            style={{ minWidth: 260 }}
          />
        </div>

        <div className="filter-group">
          <label className="label">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
            style={{ minWidth: 160 }}
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>

        {(search || statusFilter) && (
          <button
            onClick={() => {
              setSearch('');
              setStatusFilter('');
            }}
            className="btn btn-ghost btn-sm"
            style={{ height: 33, alignSelf: 'flex-end' }}
          >
            Clear Filters
          </button>
        )}
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

      {/* Main Content: Table & Inspector Detail Drawer */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: selectedInspector ? '1fr 380px' : '1fr',
          gap: 20,
          alignItems: 'start',
        }}
      >
        {/* Table */}
        <div>
          {loading ? (
            <LoadingSpinner rows={8} label="Loading inspector directory..." />
          ) : inspectors.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <p style={{ fontWeight: 500, color: 'var(--c-navy)', marginBottom: 4 }}>
                  No inspectors found
                </p>
                <p style={{ fontSize: 12, color: 'var(--c-text2)' }}>
                  No field inspectors are registered under your jurisdiction.
                </p>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <p style={{ fontWeight: 500, color: 'var(--c-navy)', marginBottom: 4 }}>
                  No matching inspectors
                </p>
                <p style={{ fontSize: 12, color: 'var(--c-text2)', marginBottom: 12 }}>
                  No records match your search criteria.
                </p>
                <button
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('');
                  }}
                  className="btn btn-ghost btn-sm"
                >
                  Reset Search
                </button>
              </div>
            </div>
          ) : (
            <div className="card" style={{ overflow: 'hidden' }}>
              <table>
                <thead>
                  <tr>
                    <th>Inspector ID</th>
                    <th>Name</th>
                    <th>Area / Jurisdiction</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Active</th>
                    <th style={{ textAlign: 'center' }}>Completed</th>
                    <th>Workload</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((insp) => {
                    const isSelected = selectedInspector?.id === insp.id;
                    const workloadBadge = getWorkloadBadge(insp.workload || 0);

                    return (
                      <tr
                        key={insp.id}
                        onClick={() => handleSelectInspector(insp)}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: isSelected ? 'var(--c-surface2)' : undefined,
                          transition: 'background-color 0.1s',
                        }}
                      >
                        {/* Inspector ID */}
                        <td className="mono" style={{ fontWeight: 600, color: 'var(--c-navy)' }}>
                          {insp.inspector_id || insp.employee_id}
                        </td>

                        {/* Name */}
                        <td>
                          <div style={{ fontWeight: 500, color: 'var(--c-navy)', fontSize: 13 }}>
                            {insp.name}
                          </div>
                          {insp.designation && (
                            <div style={{ fontSize: 11, color: 'var(--c-text2)', marginTop: 2 }}>
                              {insp.designation}
                            </div>
                          )}
                        </td>

                        {/* Area */}
                        <td>
                          <div style={{ fontSize: 13, color: 'var(--c-text)' }}>
                            {insp.assigned_area || insp.region || '—'}
                          </div>
                          {insp.region && insp.assigned_area && insp.region !== insp.assigned_area && (
                            <div style={{ fontSize: 11, color: 'var(--c-text2)', marginTop: 1 }}>
                              Region: {insp.region}
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td>
                          <StatusBadge status={insp.status} />
                        </td>

                        {/* Active Inspections */}
                        <td style={{ textAlign: 'center' }}>
                          <span
                            className="mono"
                            style={{
                              fontWeight: 600,
                              color: insp.active_inspections > 0 ? 'var(--c-navy)' : 'var(--c-text2)',
                            }}
                          >
                            {insp.active_inspections ?? 0}
                          </span>
                        </td>

                        {/* Completed */}
                        <td style={{ textAlign: 'center' }}>
                          <span
                            className="mono"
                            style={{
                              color: 'var(--c-text2)',
                            }}
                          >
                            {insp.completed_inspections ?? 0}
                          </span>
                        </td>

                        {/* Workload */}
                        <td>
                          <span
                            style={{
                              backgroundColor: workloadBadge.bg,
                              color: workloadBadge.color,
                              fontSize: 11,
                              fontWeight: 500,
                              padding: '2px 8px',
                              borderRadius: 3,
                              whiteSpace: 'nowrap',
                              display: 'inline-block',
                            }}
                          >
                            {workloadBadge.label}
                          </span>
                        </td>

                        {/* Action */}
                        <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleSelectInspector(insp)}
                            className="btn btn-ghost btn-sm"
                            style={{
                              padding: '3px 8px',
                              fontSize: 11,
                              borderColor: isSelected ? 'var(--c-teal)' : undefined,
                              color: isSelected ? 'var(--c-teal)' : undefined,
                            }}
                          >
                            {isSelected ? 'Close' : 'Details'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Selected Inspector Detail Panel */}
        {selectedInspector && (
          <div className="detail-panel">
            <div className="detail-panel-header">
              <div>
                <span className="mono" style={{ fontSize: 11, color: 'var(--c-text2)' }}>
                  {selectedInspector.inspector_id || selectedInspector.employee_id}
                </span>
                <div style={{ fontWeight: 600, color: 'var(--c-navy)', fontSize: 14 }}>
                  {selectedInspector.name}
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedInspector(null);
                  setWorkloadDetail(null);
                }}
                className="btn btn-ghost btn-sm"
                style={{ padding: '2px 8px', fontSize: 13 }}
                title="Close details"
              >
                ✕
              </button>
            </div>

            <div className="detail-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Profile Overview */}
              <div>
                <div className="label">Inspector Profile</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--c-text2)' }}>Status:</span>
                    <StatusBadge status={selectedInspector.status} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--c-text2)' }}>Designation:</span>
                    <span style={{ fontWeight: 500 }}>{selectedInspector.designation || 'Field Inspector'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--c-text2)' }}>Employee ID:</span>
                    <span className="mono">{selectedInspector.employee_id}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--c-text2)' }}>Assigned Area:</span>
                    <span style={{ fontWeight: 500 }}>{selectedInspector.assigned_area || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--c-text2)' }}>Jurisdiction Region:</span>
                    <span style={{ fontWeight: 500 }}>{selectedInspector.region || '—'}</span>
                  </div>
                  {selectedInspector.phone && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--c-text2)' }}>Contact Phone:</span>
                      <span className="mono">{selectedInspector.phone}</span>
                    </div>
                  )}
                  {selectedInspector.last_login && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--c-text2)' }}>Last Activity:</span>
                      <span>{formatDateTime(selectedInspector.last_login)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Workload Stats */}
              <div
                style={{
                  borderTop: '1px solid var(--c-border)',
                  paddingTop: 14,
                }}
              >
                <div className="label">Audit Workload Metrics</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 6 }}>
                  <div
                    style={{
                      background: 'var(--c-surface2)',
                      borderRadius: 4,
                      padding: '10px 12px',
                    }}
                  >
                    <div style={{ fontSize: 10, color: 'var(--c-text2)', textTransform: 'uppercase' }}>
                      Active
                    </div>
                    <div className="mono" style={{ fontSize: 20, fontWeight: 600, color: 'var(--c-navy)', marginTop: 2 }}>
                      {selectedInspector.active_inspections ?? 0}
                    </div>
                  </div>
                  <div
                    style={{
                      background: 'var(--c-surface2)',
                      borderRadius: 4,
                      padding: '10px 12px',
                    }}
                  >
                    <div style={{ fontSize: 10, color: 'var(--c-text2)', textTransform: 'uppercase' }}>
                      Completed
                    </div>
                    <div className="mono" style={{ fontSize: 20, fontWeight: 600, color: '#31785B', marginTop: 2 }}>
                      {selectedInspector.completed_inspections ?? 0}
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Inspection Assignments */}
              <div
                style={{
                  borderTop: '1px solid var(--c-border)',
                  paddingTop: 14,
                }}
              >
                <div className="label" style={{ marginBottom: 8 }}>
                  Current Active Assignments
                </div>

                {loadingWorkload ? (
                  <div style={{ fontSize: 12, color: 'var(--c-text2)', padding: '8px 0' }}>
                    Loading active assignments...
                  </div>
                ) : !workloadDetail || workloadDetail.active_inspections.length === 0 ? (
                  <div style={{ fontSize: 12, color: 'var(--c-text2)', padding: '8px 0' }}>
                    No ongoing inspections currently active.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {workloadDetail.active_inspections.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          padding: '8px 10px',
                          borderRadius: 4,
                          border: '1px solid var(--c-border)',
                          background: 'var(--c-bg)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: 12,
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 500, color: 'var(--c-navy)' }}>
                            Inspection #{item.id}
                          </div>
                          <div className="mono" style={{ fontSize: 11, color: 'var(--c-text2)' }}>
                            Centre #{item.centre_id}
                          </div>
                        </div>
                        <StatusBadge status={item.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
