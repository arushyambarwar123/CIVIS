'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import RiskBadge from '@/components/ui/RiskBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import { api } from '@/lib/api';
import { TrainingBatch } from '@/types';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

export default function BatchesPage() {
  const [batches, setBatches] = useState<TrainingBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', course_name: '' });
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.getBatches(filter.status ? { status: filter.status } : {})
      .then(setBatches).finally(() => setLoading(false));
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
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-navy">Training Batches</h1>
          <p className="text-sm text-gray-500">{filtered.length} of {batches.length} batches</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-5 flex gap-3 flex-wrap items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Search</label>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Batch code, course..."
            className="border border-gray-200 rounded px-3 py-1.5 text-sm w-40" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Status</label>
          <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
            className="border border-gray-200 rounded px-3 py-1.5 text-sm">
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Course</label>
          <select value={filter.course_name} onChange={e => setFilter(f => ({ ...f, course_name: e.target.value }))}
            className="border border-gray-200 rounded px-3 py-1.5 text-sm">
            <option value="">All Courses</option>
            {courses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {loading ? <div className="text-gray-400 text-sm p-6">Loading...</div> : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th>Batch Code</th>
                <th>Course</th>
                <th>Centre</th>
                <th>Dates</th>
                <th>Enrolled</th>
                <th>Status</th>
                <th>Risk</th>
                <th>Anomalies</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b.id}>
                  <td className="font-mono text-xs">
                    <Link href={`/batches/${b.id}`} className="text-blue-700 hover:underline">{b.batch_code}</Link>
                  </td>
                  <td className="text-xs text-gray-600">{b.course_name}</td>
                  <td><Link href={`/centres/${b.centre_id}`} className="text-blue-600 hover:underline text-xs">Centre #{b.centre_id}</Link></td>
                  <td className="text-xs text-gray-500">{formatDate(b.start_date)} – {formatDate(b.end_date)}</td>
                  <td className="text-center text-xs">{b.registered_count} / {b.batch_capacity}</td>
                  <td><StatusBadge status={b.status} /></td>
                  <td><RiskBadge level={b.risk_level || 'low'} score={b.risk_score} size="sm" /></td>
                  <td className="text-center">
                    {(b.open_anomalies || 0) > 0 ? <span className="text-red-600 font-semibold text-xs">{b.open_anomalies}</span> : <span className="text-gray-300 text-xs">0</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-8 text-gray-400 text-sm">No batches found.</div>}
        </div>
      )}
    </AppLayout>
  );
}
