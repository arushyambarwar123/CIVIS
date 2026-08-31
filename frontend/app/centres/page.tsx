'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import RiskBadge from '@/components/ui/RiskBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import { api } from '@/lib/api';
import { TrainingCentre } from '@/types';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

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

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy">Training Centres</h1>
          <p className="text-sm text-gray-500">{filtered.length} of {centres.length} centres</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-5 flex gap-3 flex-wrap items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Search</label>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Name, code, district..."
            className="border border-gray-200 rounded px-3 py-1.5 text-sm w-48" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Risk Level</label>
          <select value={filter.risk_level} onChange={e => setFilter(f => ({ ...f, risk_level: e.target.value }))}
            className="border border-gray-200 rounded px-3 py-1.5 text-sm">
            <option value="">All</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">State</label>
          <select value={filter.state} onChange={e => setFilter(f => ({ ...f, state: e.target.value }))}
            className="border border-gray-200 rounded px-3 py-1.5 text-sm">
            <option value="">All States</option>
            {states.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button onClick={() => { setFilter({ risk_level: '', state: '', status: '' }); setSearch(''); }}
          className="px-3 py-1.5 text-sm border border-gray-200 rounded bg-gray-50 text-gray-600">
          Clear
        </button>
      </div>

      {loading ? (
        <div className="text-gray-400 text-sm p-6">Loading...</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr>
                <th>Centre Code</th>
                <th>Centre Name</th>
                <th>District / State</th>
                <th>Status</th>
                <th>Risk</th>
                <th>Anomalies</th>
                <th>Last Inspection</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td className="font-mono text-xs text-gray-600">{c.centre_code}</td>
                  <td>
                    <Link href={`/centres/${c.id}`} className="font-medium text-blue-700 hover:underline">
                      {c.centre_name}
                    </Link>
                    <div className="text-xs text-gray-400">{c.organisation_name}</div>
                  </td>
                  <td className="text-sm">{c.district}<div className="text-xs text-gray-400">{c.state}</div></td>
                  <td><StatusBadge status={c.status} /></td>
                  <td><RiskBadge level={c.risk_level || 'low'} score={c.risk_score} /></td>
                  <td>
                    {(c.open_anomalies || 0) > 0 ? (
                      <span className="text-red-600 font-semibold">{c.open_anomalies}</span>
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </td>
                  <td className="text-sm text-gray-600">{formatDate(c.last_inspection_date)}</td>
                  <td>
                    <Link href={`/centres/${c.id}`}
                      className="text-xs text-blue-600 hover:underline px-2 py-1 border border-blue-100 rounded">
                      Profile
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">No centres match the current filters.</div>
          )}
        </div>
      )}
    </AppLayout>
  );
}
