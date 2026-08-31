'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import { api } from '@/lib/api';
import { Inspection } from '@/types';
import { formatDate, formatDateTime } from '@/lib/utils';
import Link from 'next/link';

const CHECKLIST_ITEMS = [
  { key: 'trainer_present', label: 'Trainer was present' },
  { key: 'training_active', label: 'Training session was active' },
  { key: 'equipment_available', label: 'Training equipment available' },
  { key: 'register_matches', label: 'Attendance register matches' },
  { key: 'certificates_valid', label: 'Certificates/documents valid' },
];

export default function InspectionsPage() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Inspection | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');
  const [form, setForm] = useState({
    actual_people_found: '',
    duration_minutes: '',
    compliance_status: 'partially_compliant',
    remarks: '',
    checklist: {} as Record<string, boolean>,
  });
  const [filter, setFilter] = useState('');

  async function load() {
    const data = await api.getInspections();
    setInspections(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function selectInspection(i: Inspection) {
    setSelected(i);
    setSubmitMsg('');
    const cl: Record<string, boolean> = {};
    CHECKLIST_ITEMS.forEach(item => { cl[item.key] = (i.checklist as any)?.[item.key] ?? false; });
    setForm({
      actual_people_found: i.actual_people_found?.toString() || '',
      duration_minutes: i.duration_minutes?.toString() || '',
      compliance_status: i.compliance_status || 'partially_compliant',
      remarks: (i.findings as any)?.summary || '',
      checklist: cl,
    });
  }

  async function submitInspection() {
    if (!selected) return;
    setSubmitting(true);
    try {
      await api.submitInspection(selected.id, {
        actual_people_found: parseInt(form.actual_people_found) || 0,
        duration_minutes: parseInt(form.duration_minutes) || 0,
        compliance_status: form.compliance_status,
        checklist: { ...form.checklist, remarks: form.remarks },
        findings: { summary: form.remarks, compliance: form.compliance_status },
      });
      setSubmitMsg('Inspection submitted successfully.');
      await load();
    } catch { setSubmitMsg('Submission failed.'); }
    finally { setSubmitting(false); }
  }

  const filtered = filter ? inspections.filter(i => i.status === filter) : inspections;

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-navy">Inspections</h1>
          <p className="text-sm text-gray-500">{inspections.length} total inspections</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {['', 'scheduled', 'in_progress', 'submitted'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className="px-3 py-1.5 text-xs rounded border transition-colors"
            style={{ backgroundColor: filter === s ? '#1D6FA4' : 'white', color: filter === s ? 'white' : '#6C757D', borderColor: filter === s ? '#1D6FA4' : '#DEE2E6' }}>
            {s === '' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div>
          {loading ? <div className="text-gray-400 text-sm p-4">Loading...</div> : (
            <div className="space-y-2">
              {filtered.map(i => (
                <div key={i.id}
                  onClick={() => selectInspection(i)}
                  className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-sm"
                  style={{ borderLeftWidth: 4, borderLeftColor: i.status === 'submitted' ? '#198754' : i.status === 'scheduled' ? '#1D6FA4' : '#FFC107' }}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-medium text-navy text-sm">{i.centre_name}</div>
                    <StatusBadge status={i.status} />
                  </div>
                  <div className="text-xs text-gray-400 font-mono">{i.centre_code}</div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>Inspector: <strong>{i.inspector_name}</strong></span>
                    <span>Date: {formatDate(i.inspection_date)}</span>
                    {i.actual_people_found !== null && <span>Found: {i.actual_people_found} people</span>}
                  </div>
                </div>
              ))}
              {filtered.length === 0 && <div className="text-gray-400 text-sm p-4">No inspections found.</div>}
            </div>
          )}
        </div>

        {/* Inspector Form */}
        {selected && (
          <div className="bg-white border border-gray-200 rounded-lg p-5 sticky top-6 self-start">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-xs text-gray-400">Inspection #{selected.id}</div>
                <h2 className="font-semibold text-navy">{selected.centre_name}</h2>
                <div className="text-xs text-gray-400 mt-0.5">Inspector: {selected.inspector_name}</div>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 text-lg">×</button>
            </div>

            {selected.status === 'submitted' ? (
              <div className="text-center p-4 bg-green-50 border border-green-100 rounded text-sm text-green-700">
                This inspection has been submitted. View details in centre profile.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">People Found at Centre</label>
                    <input type="number" value={form.actual_people_found}
                      onChange={e => setForm(f => ({ ...f, actual_people_found: e.target.value }))}
                      className="w-full border border-gray-200 rounded px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Duration (minutes)</label>
                    <input type="number" value={form.duration_minutes}
                      onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))}
                      className="w-full border border-gray-200 rounded px-3 py-2 text-sm" />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-500 block mb-2">Compliance Status</label>
                  <select value={form.compliance_status}
                    onChange={e => setForm(f => ({ ...f, compliance_status: e.target.value }))}
                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm">
                    <option value="compliant">Compliant</option>
                    <option value="partially_compliant">Partially Compliant</option>
                    <option value="non_compliant">Non-Compliant</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-500 block mb-2">Inspection Checklist</label>
                  <div className="space-y-1.5">
                    {CHECKLIST_ITEMS.map(item => (
                      <label key={item.key} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={form.checklist[item.key] || false}
                          onChange={e => setForm(f => ({ ...f, checklist: { ...f.checklist, [item.key]: e.target.checked } }))}
                          className="rounded" />
                        {item.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-500 block mb-1">Field Remarks</label>
                  <textarea value={form.remarks}
                    onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))}
                    rows={3} className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                    placeholder="Enter inspection findings and observations..." />
                </div>

                {submitMsg && (
                  <div className="text-xs text-green-700 bg-green-50 border border-green-100 rounded p-2">{submitMsg}</div>
                )}

                <button onClick={submitInspection} disabled={submitting}
                  className="w-full py-2.5 text-sm font-semibold text-white rounded disabled:opacity-50"
                  style={{ backgroundColor: '#198754' }}>
                  {submitting ? 'Submitting...' : 'SUBMIT INSPECTION REPORT'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
