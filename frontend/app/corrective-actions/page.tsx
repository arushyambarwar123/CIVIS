'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import RiskBadge from '@/components/ui/RiskBadge';
import { api } from '@/lib/api';
import { CorrectiveAction } from '@/types';
import { formatDate } from '@/lib/utils';

export default function CorrectiveActionsPage() {
  const [actions, setActions] = useState<CorrectiveAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [updating, setUpdating] = useState<number | null>(null);

  async function load() {
    const data = await api.getCorrectiveActions();
    setActions(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(id: number, status: string) {
    setUpdating(id);
    await api.updateCorrectiveAction(id, { status });
    setUpdating(null);
    load();
  }

  const filtered = filter ? actions.filter(a => a.status === filter) : actions;
  const overdue = actions.filter(a => a.is_overdue);
  const open = actions.filter(a => a.status === 'open');

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-navy">Corrective Actions</h1>
          <p className="text-sm text-gray-500">Track and manage follow-up actions on flagged anomalies</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="bg-white border border-red-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-600">{overdue.length}</div>
          <div className="text-xs text-gray-500 mt-1">Overdue Actions</div>
        </div>
        <div className="bg-white border border-yellow-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-600">{open.length}</div>
          <div className="text-xs text-gray-500 mt-1">Open Actions</div>
        </div>
        <div className="bg-white border border-green-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{actions.filter(a => a.status === 'closed' || a.status === 'verified').length}</div>
          <div className="text-xs text-gray-500 mt-1">Closed / Verified</div>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {['', 'open', 'in_progress', 'overdue', 'evidence_submitted', 'closed'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className="px-3 py-1.5 text-xs rounded border transition-colors"
            style={{ backgroundColor: filter === s ? '#1D6FA4' : 'white', color: filter === s ? 'white' : '#6C757D', borderColor: filter === s ? '#1D6FA4' : '#DEE2E6' }}>
            {s === '' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? <div className="text-gray-400 text-sm p-6">Loading...</div> : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th>#</th>
                <th>Action Required</th>
                <th>Centre</th>
                <th>Assigned To</th>
                <th>Deadline</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Update</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(ca => (
                <tr key={ca.id} style={{ backgroundColor: ca.is_overdue ? '#FFF5F5' : 'white' }}>
                  <td className="text-gray-400 text-xs">{ca.id}</td>
                  <td className="max-w-xs">
                    <div className="text-xs text-gray-700 leading-snug">{ca.action_required}</div>
                    {ca.is_overdue && <span className="text-xs text-red-600 font-semibold">OVERDUE</span>}
                  </td>
                  <td className="text-xs text-gray-500">Centre #{ca.centre_id}</td>
                  <td className="text-xs">{ca.responsible_person}</td>
                  <td className={`text-xs font-medium ${ca.is_overdue ? 'text-red-600' : 'text-gray-700'}`}>
                    {formatDate(ca.deadline)}
                  </td>
                  <td><RiskBadge level={ca.severity} size="sm" /></td>
                  <td><StatusBadge status={ca.status} /></td>
                  <td>
                    {ca.status !== 'closed' && ca.status !== 'verified' && (
                      <select
                        disabled={updating === ca.id}
                        onChange={e => updateStatus(ca.id, e.target.value)}
                        defaultValue=""
                        className="border border-gray-200 rounded px-2 py-1 text-xs">
                        <option value="" disabled>Change...</option>
                        <option value="in_progress">In Progress</option>
                        <option value="evidence_submitted">Evidence Submitted</option>
                        <option value="closed">Close</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">No actions found.</div>
          )}
        </div>
      )}
    </AppLayout>
  );
}
