'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import { api } from '@/lib/api';
import { Beneficiary } from '@/types';
import Link from 'next/link';

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
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-navy">Beneficiaries</h1>
          <p className="text-sm text-gray-500">{filtered.length} of {bens.length} beneficiaries</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-5 flex gap-3 flex-wrap items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Search</label>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name or token..."
            className="border border-gray-200 rounded px-3 py-1.5 text-sm w-44" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">State</label>
          <select value={filter.state} onChange={e => setFilter(f => ({ ...f, state: e.target.value }))}
            className="border border-gray-200 rounded px-3 py-1.5 text-sm">
            <option value="">All States</option>
            {states.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Gender</label>
          <select value={filter.gender} onChange={e => setFilter(f => ({ ...f, gender: e.target.value }))}
            className="border border-gray-200 rounded px-3 py-1.5 text-sm">
            <option value="">All</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Category</label>
          <select value={filter.category} onChange={e => setFilter(f => ({ ...f, category: e.target.value }))}
            className="border border-gray-200 rounded px-3 py-1.5 text-sm">
            <option value="">All</option>
            {['General','OBC','SC','ST','EWS'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <button onClick={() => { setFilter({ state: '', gender: '', category: '' }); setSearch(''); }}
          className="px-3 py-1.5 text-sm border border-gray-200 rounded text-gray-600">Clear</button>
      </div>

      {loading ? <div className="text-gray-400 text-sm p-6">Loading...</div> : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th>Token</th>
                <th>Name</th>
                <th>Age / Gender</th>
                <th>Category</th>
                <th>District / State</th>
                <th>Eligibility</th>
                <th>Enrolments</th>
                <th>Anomalies</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 200).map(b => (
                <tr key={b.id}>
                  <td className="font-mono text-xs text-gray-500">{b.beneficiary_token}</td>
                  <td className="font-medium text-navy">{b.name}</td>
                  <td className="text-xs text-gray-500">{b.age} · {b.gender}</td>
                  <td className="text-xs">{b.category}</td>
                  <td className="text-xs text-gray-500">{b.district}<div className="text-gray-400">{b.state}</div></td>
                  <td>
                    <StatusBadge status={b.eligibility_status ? 'active' : 'failed'} />
                  </td>
                  <td className="text-center text-xs">{b.enrolment_count || 0}</td>
                  <td className="text-center">
                    {(b.open_anomalies || 0) > 0 ? (
                      <span className="text-red-600 font-semibold text-xs">{b.open_anomalies}</span>
                    ) : <span className="text-gray-300 text-xs">0</span>}
                  </td>
                  <td>
                    <Link href={`/beneficiaries/${b.id}`} className="text-xs text-blue-600 hover:underline px-2 py-0.5 border border-blue-100 rounded">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-8 text-gray-400 text-sm">No beneficiaries found.</div>}
          {filtered.length > 200 && <div className="text-center py-2 text-gray-400 text-xs">Showing first 200 of {filtered.length}. Refine filters to narrow results.</div>}
        </div>
      )}
    </AppLayout>
  );
}
