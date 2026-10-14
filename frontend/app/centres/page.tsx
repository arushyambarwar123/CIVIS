'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import RiskBadge from '@/components/ui/RiskBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { api } from '@/lib/api';
import { TrainingCentre } from '@/types';
import { formatDate } from '@/lib/utils';

export default function CentresPage() {
  const [centres, setCentres] = useState<TrainingCentre[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ risk_level: '', state: '', status: '' });
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.getCentres().then(setCentres).finally(() => setLoading(false));
  }, []);

  const filtered = centres.filter(c => {
    if (filter.risk_level && c.risk_level !== filter.risk_level) return false;
    if (filter.state && c.state !== filter.state) return false;
    if (filter.status && c.status !== filter.status) return false;
    if (search && !c.centre_name.toLowerCase().includes(search.toLowerCase()) &&
        !c.centre_code.toLowerCase().includes(search.toLowerCase()) &&
        !c.district.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const states = Array.from(new Set(centres.map(c => c.state))).sort();

  const counts = {
    critical: centres.filter(c => c.risk_level === 'critical').length,
    high: centres.filter(c => c.risk_level === 'high').length,
    medium: centres.filter(c => c.risk_level === 'medium').length,
    low: centres.filter(c => c.risk_level === 'low').length,
  };

  return (
    <AppLayout>
      <div style={{ marginBottom: 20 }}>
        <h1 className="page-title">Training Centres</h1>
        <p className="page-subtitle">Showing {filtered.length} of {centres.length} centres</p>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="filter-group">
          <label className="label">Search</label>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Name, code, district..."
            className="input"
            style={{ width: 220 }}
          />
        </div>
        <div className="filter-group">
          <label className="label">Risk Level</label>
          <select
            value={filter.risk_level}
            onChange={e => setFilter(f => ({ ...f, risk_level: e.target.value }))}
            className="input"
          >
            <option value="">All Risk Levels</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div className="filter-group">
          <label className="label">State</label>
          <select
            value={filter.state}
            onChange={e => setFilter(f => ({ ...f, state: e.target.value }))}
            className="input"
          >
            <option value="">All States</option>
            {states.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label className="label">Status</label>
          <select
            value={filter.status}
            onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
            className="input"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <button
          onClick={() => { setFilter({ risk_level: '', state: '', status: '' }); setSearch(''); }}
          className="btn btn-ghost btn-sm"
          style={{ height: 33 }}
        >
          Clear Filters
        </button>
      </div>

      {/* Summary counts by risk level as small inline pills */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <span className="section-label" style={{ marginRight: 2 }}>Summary:</span>
        {(['critical', 'high', 'medium', 'low'] as const).map(lvl => {
          const isActive = filter.risk_level === lvl;
          return (
            <button
              key={lvl}
              onClick={() => setFilter(f => ({ ...f, risk_level: isActive ? '' : lvl }))}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '3px 8px',
                borderRadius: 4,
                background: isActive ? 'var(--c-surface2)' : 'var(--c-surface)',
                border: `1px solid ${isActive ? 'var(--c-teal)' : 'var(--c-border)'}`,
                cursor: 'pointer',
              }}
            >
              <RiskBadge level={lvl} size="sm" />
              <span className="mono" style={{ fontWeight: 600, color: 'var(--c-text)', fontSize: 12 }}>
                {counts[lvl]}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <LoadingSpinner rows={8} label="Loading training centres..." />
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table>
            <thead>
              <tr>
                <th>Centre Code</th>
                <th>Centre Name</th>
                <th>District / State</th>
                <th>Status</th>
                <th>Risk</th>
                <th>Anomalies</th>
                <th>Last Inspection</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td className="mono" style={{ color: 'var(--c-text2)' }}>{c.centre_code}</td>
                  <td>
                    <Link
                      href={`/centres/${c.id}`}
                      style={{ color: '#287D79', fontWeight: 500, textDecoration: 'none' }}
                    >
                      {c.centre_name}
                    </Link>
                    <div style={{ fontSize: 11, color: 'var(--c-text2)', marginTop: 2 }}>
                      {c.organisation_name}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: 13, color: 'var(--c-text)' }}>{c.district}</div>
                    <div style={{ fontSize: 11, color: 'var(--c-text2)' }}>{c.state}</div>
                  </td>
                  <td><StatusBadge status={c.status} /></td>
                  <td><RiskBadge level={c.risk_level || 'low'} score={c.risk_score} /></td>
                  <td>
                    {(c.open_anomalies || 0) > 0 ? (
                      <span className="mono" style={{ color: '#B54747', fontWeight: 600 }}>
                        {c.open_anomalies}
                      </span>
                    ) : (
                      <span className="mono" style={{ color: 'var(--c-text2)' }}>0</span>
                    )}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--c-text2)' }}>
                    {formatDate(c.last_inspection_date)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Link
                      href={`/centres/${c.id}`}
                      className="btn btn-ghost btn-sm"
                    >
                      Profile
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="empty-state">
              <p>No centres match the selected filters.</p>
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
}
