'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { api } from '@/lib/api';
import { Beneficiary } from '@/types';

export default function BeneficiariesPage() {
  const [bens, setBens] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState({ state: '', gender: '', category: '' });

  useEffect(() => {
    api.getBeneficiaries().then(setBens).finally(() => setLoading(false));
  }, []);

  const states = Array.from(new Set(bens.map(b => b.state))).sort();
  const filtered = bens.filter(b => {
    if (filter.state && b.state !== filter.state) return false;
    if (filter.gender && b.gender !== filter.gender) return false;
    if (filter.category && b.category !== filter.category) return false;
    if (search && !b.name.toLowerCase().includes(search.toLowerCase()) &&
        !b.beneficiary_token.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <AppLayout>
      <div style={{ marginBottom: 20 }}>
        <h1 className="page-title">Beneficiaries</h1>
        <p className="page-subtitle">Showing {filtered.length} of {bens.length} beneficiaries</p>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="filter-group">
          <label className="label">Search</label>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Name or token..."
            className="input"
            style={{ width: 200 }}
          />
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
          <label className="label">Gender</label>
          <select
            value={filter.gender}
            onChange={e => setFilter(f => ({ ...f, gender: e.target.value }))}
            className="input"
          >
            <option value="">All</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
        <div className="filter-group">
          <label className="label">Category</label>
          <select
            value={filter.category}
            onChange={e => setFilter(f => ({ ...f, category: e.target.value }))}
            className="input"
          >
            <option value="">All</option>
            {['General', 'OBC', 'SC', 'ST', 'EWS'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <button
          onClick={() => { setFilter({ state: '', gender: '', category: '' }); setSearch(''); }}
          className="btn btn-ghost btn-sm"
          style={{ height: 33 }}
        >
          Clear Filters
        </button>
      </div>

      {loading ? (
        <LoadingSpinner rows={8} label="Loading beneficiaries..." />
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table>
            <thead>
              <tr>
                <th>Token</th>
                <th>Name</th>
                <th>Demographics</th>
                <th>Category</th>
                <th>District / State</th>
                <th>Eligibility</th>
                <th>Enrolments</th>
                <th>Anomalies</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 200).map(b => (
                <tr key={b.id}>
                  <td className="mono" style={{ color: 'var(--c-text2)' }}>{b.beneficiary_token}</td>
                  <td style={{ fontWeight: 500, color: 'var(--c-navy)' }}>
                    <Link
                      href={`/beneficiaries/${b.id}`}
                      style={{ color: '#287D79', textDecoration: 'none' }}
                    >
                      {b.name}
                    </Link>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--c-text2)' }}>{b.age} yrs · {b.gender}</td>
                  <td style={{ fontSize: 12 }}>{b.category}</td>
                  <td>
                    <div style={{ fontSize: 13 }}>{b.district}</div>
                    <div style={{ fontSize: 11, color: 'var(--c-text2)' }}>{b.state}</div>
                  </td>
                  <td>
                    <StatusBadge status={b.eligibility_status ? 'active' : 'failed'} />
                  </td>
                  <td className="mono" style={{ textAlign: 'center' }}>{b.enrolment_count || 0}</td>
                  <td style={{ textAlign: 'center' }}>
                    {(b.open_anomalies || 0) > 0 ? (
                      <span className="mono" style={{ color: '#B54747', fontWeight: 600 }}>
                        {b.open_anomalies}
                      </span>
                    ) : (
                      <span className="mono" style={{ color: 'var(--c-text2)' }}>0</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Link href={`/beneficiaries/${b.id}`} className="btn btn-ghost btn-sm">
                      Profile
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="empty-state">
              <p>No beneficiaries found matching the criteria.</p>
            </div>
          )}
          {filtered.length > 200 && (
            <div style={{ textAlign: 'center', padding: '12px 16px', fontSize: 12, color: 'var(--c-text2)', borderTop: '1px solid var(--c-border)' }}>
              Showing first 200 of {filtered.length} beneficiaries. Refine filters to narrow results.
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
}
