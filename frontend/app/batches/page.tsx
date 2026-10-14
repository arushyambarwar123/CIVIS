'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import RiskBadge from '@/components/ui/RiskBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { api } from '@/lib/api';
import { TrainingBatch } from '@/types';
import { formatDate } from '@/lib/utils';

export default function BatchesPage() {
  const [batches, setBatches] = useState<TrainingBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', course_name: '' });
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    api.getBatches(filter.status ? { status: filter.status } : {})
      .then(setBatches)
      .finally(() => setLoading(false));
  }, [filter.status]);

  const courses = Array.from(new Set(batches.map(b => b.course_name))).sort();
  const filtered = batches.filter(b => {
    if (filter.course_name && b.course_name !== filter.course_name) return false;
    if (search && !b.batch_code.toLowerCase().includes(search.toLowerCase()) &&
        !b.course_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <AppLayout>
      <div style={{ marginBottom: 20 }}>
        <h1 className="page-title">Training Batches</h1>
        <p className="page-subtitle">Showing {filtered.length} of {batches.length} batches</p>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="filter-group">
          <label className="label">Search</label>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Batch code, course..."
            className="input"
            style={{ width: 220 }}
          />
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
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="filter-group">
          <label className="label">Course</label>
          <select
            value={filter.course_name}
            onChange={e => setFilter(f => ({ ...f, course_name: e.target.value }))}
            className="input"
          >
            <option value="">All Courses</option>
            {courses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <button
          onClick={() => { setFilter({ status: '', course_name: '' }); setSearch(''); }}
          className="btn btn-ghost btn-sm"
          style={{ height: 33 }}
        >
          Clear Filters
        </button>
      </div>

      {loading ? (
        <LoadingSpinner rows={8} label="Loading training batches..." />
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table>
            <thead>
              <tr>
                <th>Batch Code</th>
                <th>Course Name</th>
                <th>Centre</th>
                <th>Duration</th>
                <th>Capacity / Enrolled</th>
                <th>Status</th>
                <th>Risk</th>
                <th>Anomalies</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b.id}>
                  <td className="mono">
                    <Link
                      href={`/batches/${b.id}`}
                      style={{ color: '#287D79', fontWeight: 600, textDecoration: 'none' }}
                    >
                      {b.batch_code}
                    </Link>
                  </td>
                  <td style={{ fontWeight: 500 }}>{b.course_name}</td>
                  <td>
                    <Link
                      href={`/centres/${b.centre_id}`}
                      style={{ color: '#287D79', textDecoration: 'none', fontSize: 13 }}
                    >
                      Centre #{b.centre_id}
                    </Link>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--c-text2)' }}>
                    {formatDate(b.start_date)} – {formatDate(b.end_date)}
                  </td>
                  <td className="mono" style={{ fontSize: 13 }}>
                    {b.registered_count} / {b.batch_capacity}
                  </td>
                  <td><StatusBadge status={b.status} /></td>
                  <td><RiskBadge level={b.risk_level || 'low'} score={b.risk_score} size="sm" /></td>
                  <td>
                    {(b.open_anomalies || 0) > 0 ? (
                      <span className="mono" style={{ color: '#B54747', fontWeight: 600 }}>
                        {b.open_anomalies}
                      </span>
                    ) : (
                      <span className="mono" style={{ color: 'var(--c-text2)' }}>0</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Link href={`/batches/${b.id}`} className="btn btn-ghost btn-sm">
                      Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="empty-state">
              <p>No batches match the selected criteria.</p>
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
}
