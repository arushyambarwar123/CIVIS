'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import RiskBadge from '@/components/ui/RiskBadge';
import MetricCard from '@/components/ui/MetricCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
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
      setActions(data);
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
      <div style={{ marginBottom: 20 }}>
        <h1 className="page-title">Corrective Actions</h1>
        <p className="page-subtitle">Track, assign, and verify remedial compliance measures</p>
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
        <MetricCard
          label="Overdue Actions"
          value={overdue.length}
          sub="Requires immediate escalation"
          accent="critical"
        />
        <MetricCard
          label="Open Actions"
          value={open.length}
          sub="Under active remediation"
          accent="warning"
        />
        <MetricCard
          label="Closed / Verified"
          value={resolved.length}
          sub="Resolution confirmed"
          accent="positive"
        />
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="filter-group">
          <label className="label">Filter By Status</label>
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
                  onClick={() => setFilter(tab.id)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: active ? 600 : 400,
                    background: active ? 'var(--c-surface2)' : 'var(--c-surface)',
                    border: `1px solid ${active ? 'var(--c-teal)' : 'var(--c-border)'}`,
                    color: active ? 'var(--c-teal)' : 'var(--c-text)',
                    cursor: 'pointer',
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
        <LoadingSpinner rows={8} label="Loading corrective actions..." />
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                <th>Action Required</th>
                <th>Centre</th>
                <th>Responsible Person</th>
                <th>Deadline</th>
                <th>Severity</th>
                <th>Status</th>
                <th style={{ minWidth: 150 }}>Update Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(ca => (
                <tr key={ca.id}>
                  <td className="mono" style={{ color: 'var(--c-text2)' }}>{ca.id}</td>
                  <td style={{ maxWidth: 320 }}>
                    <div style={{ fontSize: 13, color: 'var(--c-text)', lineHeight: '18px' }}>
                      {ca.action_required}
                    </div>
                  </td>
                  <td>
                    <Link
                      href={`/centres/${ca.centre_id}`}
                      style={{ color: '#287D79', fontSize: 13, textDecoration: 'none' }}
                    >
                      Centre #{ca.centre_id}
                    </Link>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--c-text2)' }}>{ca.responsible_person}</td>
                  <td>
                    <div style={{
                      fontSize: 12,
                      color: ca.is_overdue ? '#B54747' : 'var(--c-text)',
                      fontWeight: ca.is_overdue ? 600 : 400,
                    }}>
                      {formatDate(ca.deadline)}
                      {ca.is_overdue && (
                        <span style={{
                          display: 'inline-block',
                          marginLeft: 6,
                          fontSize: 10,
                          fontWeight: 700,
                          color: '#B54747',
                          backgroundColor: '#FDEAEA',
                          padding: '1px 5px',
                          borderRadius: 3,
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
                        style={{ padding: '4px 8px', fontSize: 12, height: 28 }}
                      >
                        <option value="" disabled>Change status...</option>
                        <option value="in_progress">In Progress</option>
                        <option value="evidence_submitted">Evidence Submitted</option>
                        <option value="closed">Mark Closed</option>
                      </select>
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--c-text2)' }}>Completed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="empty-state">
              <p>No corrective actions found matching the active filter.</p>
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
}
