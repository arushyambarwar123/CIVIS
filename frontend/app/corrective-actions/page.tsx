'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import RiskBadge from '@/components/ui/RiskBadge';
import MetricCard from '@/components/ui/MetricCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { api } from '@/lib/api';
import { CorrectiveAction } from '@/types';
import { formatDate } from '@/lib/utils';

export default function CorrectiveActionsPage() {
  const [actions, setActions] = useState<CorrectiveAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [updating, setUpdating] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await api.getCorrectiveActions();
      setActions(data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(id: number, status: string) {
    setUpdating(id);
    try {
      await api.updateCorrectiveAction(id, { status });
      await load();
    } finally {
      setUpdating(null);
    }
  }

  const filtered = filter ? actions.filter(a => a.status === filter) : actions;
  const overdue = actions.filter(a => a.is_overdue);
  const open = actions.filter(a => a.status === 'open');
  const resolved = actions.filter(a => a.status === 'closed' || a.status === 'verified');

  return (
    <AppLayout>
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title">Corrective Actions &amp; Compliance</h1>
        <p className="page-subtitle">
          Track remediation plans, responsible officers, deadlines, and verification closure
        </p>
      </div>

      {/* Summary Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <MetricCard
          label="Overdue Actions"
          value={overdue.length}
          sub="Requires immediate escalation"
          accent="critical"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          }
        />
        <MetricCard
          label="Open Actions"
          value={open.length}
          sub="Under active remediation"
          accent="warning"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
            </svg>
          }
        />
        <MetricCard
          label="Closed &amp; Verified"
          value={resolved.length}
          sub="Remediation confirmed"
          accent="positive"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          }
        />
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="filter-group">
          <label className="label">Remediation Status</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { id: '', label: 'All Actions' },
              { id: 'open', label: 'Open' },
              { id: 'in_progress', label: 'In Progress' },
              { id: 'overdue', label: 'Overdue' },
              { id: 'evidence_submitted', label: 'Evidence Submitted' },
              { id: 'closed', label: 'Closed' },
            ].map(tab => {
              const active = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-pill, 50px)',
                    fontSize: 12,
                    fontWeight: 600,
                    background: active ? 'rgba(67, 97, 238, 0.1)' : 'var(--c-surface, #FFFFFF)',
                    border: `1px solid ${active ? 'var(--c-accent, #4361EE)' : 'var(--c-border, #E2E8F0)'}`,
                    color: active ? 'var(--c-accent, #4361EE)' : 'var(--c-text2, #5A6A85)',
                    cursor: 'pointer',
                    transition: 'all 0.12s',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner rows={8} label="Loading corrective action registry..." />
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 48 }}>#</th>
                  <th>Action Required</th>
                  <th>Centre</th>
                  <th>Responsible Person</th>
                  <th>Deadline</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th style={{ minWidth: 160 }}>Update Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(ca => (
                  <tr key={ca.id}>
                    <td className="mono" style={{ color: 'var(--c-text3, #75839C)' }}>{ca.id}</td>
                    <td style={{ maxWidth: 320 }}>
                      <div style={{ fontSize: 13.5, color: 'var(--c-text, #1E293B)', fontWeight: 500, lineHeight: 1.45 }}>
                        {ca.action_required}
                      </div>
                    </td>
                    <td>
                      <Link
                        href={`/centres/${ca.centre_id}`}
                        style={{ color: 'var(--c-accent, #4361EE)', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}
                      >
                        Centre #{ca.centre_id}
                      </Link>
                    </td>
                    <td style={{ fontSize: 12.5, color: 'var(--c-text2, #5A6A85)' }}>{ca.responsible_person}</td>
                    <td>
                      <div style={{
                        fontSize: 12.5,
                        color: ca.is_overdue ? 'var(--c-danger, #EE5D50)' : 'var(--c-text, #1E293B)',
                        fontWeight: ca.is_overdue ? 700 : 400,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}>
                        {formatDate(ca.deadline)}
                        {ca.is_overdue && (
                          <span style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: 'var(--c-danger, #EE5D50)',
                            backgroundColor: 'var(--c-danger-bg, #FFF0EF)',
                            padding: '2px 6px',
                            borderRadius: 'var(--radius-pill, 50px)',
                          }}>
                            OVERDUE
                          </span>
                        )}
                      </div>
                    </td>
                    <td><RiskBadge level={ca.severity} size="sm" /></td>
                    <td><StatusBadge status={ca.status} /></td>
                    <td>
                      {ca.status !== 'closed' && ca.status !== 'verified' ? (
                        <select
                          disabled={updating === ca.id}
                          onChange={e => updateStatus(ca.id, e.target.value)}
                          defaultValue=""
                          className="input"
                          style={{ padding: '6px 8px', fontSize: 12, height: 32 }}
                        >
                          <option value="" disabled>Change status...</option>
                          <option value="in_progress">In Progress</option>
                          <option value="evidence_submitted">Evidence Submitted</option>
                          <option value="closed">Mark Closed</option>
                        </select>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--c-text3, #75839C)' }}>Closed &bull; Verified</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <EmptyState
              title="No Actions Found"
              message="No corrective action items match the active status filter."
            />
          )}
        </div>
      )}
    </AppLayout>
  );
}
