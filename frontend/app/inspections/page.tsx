'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { api } from '@/lib/api';
import { Inspection } from '@/types';
import { formatDate } from '@/lib/utils';

const CHECKLIST_ITEMS = [
  { key: 'trainer_present', label: 'Trainer was physically present at session' },
  { key: 'training_active', label: 'Training activity actively in progress' },
  { key: 'equipment_available', label: 'Mandated equipment and infrastructure present' },
  { key: 'register_matches', label: 'Physical attendance matches electronic register' },
  { key: 'certificates_valid', label: 'Beneficiary IDs and records verified' },
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
    setLoading(true);
    try {
      const data = await api.getInspections();
      setInspections(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function selectInspection(i: Inspection) {
    setSelected(i);
    setSubmitMsg('');
    const cl: Record<string, boolean> = {};
    CHECKLIST_ITEMS.forEach(item => {
      cl[item.key] = (i.checklist as any)?.[item.key] ?? false;
    });
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
      setSubmitMsg('Inspection findings submitted and synchronized.');
      await load();
    } catch {
      setSubmitMsg('Failed to submit inspection report.');
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = filter ? inspections.filter(i => i.status === filter) : inspections;

  return (
    <AppLayout>
      <div style={{ marginBottom: 20 }}>
        <h1 className="page-title">Physical Inspections</h1>
        <p className="page-subtitle">Track, record, and submit on-site verification reports</p>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="filter-group">
          <label className="label">Inspection Status</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { id: '', label: 'All Inspections' },
              { id: 'scheduled', label: 'Scheduled' },
              { id: 'in_progress', label: 'In Progress' },
              { id: 'submitted', label: 'Submitted' },
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

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 440px' : '1fr', gap: 20, alignItems: 'start' }}>
        {/* Inspection List Cards */}
        <div>
          {loading ? (
            <LoadingSpinner rows={8} label="Loading inspection records..." />
          ) : filtered.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <p>No inspections found matching the filter.</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map(i => {
                const isSelected = selected?.id === i.id;
                return (
                  <div
                    key={i.id}
                    onClick={() => selectInspection(i)}
                    className="card"
                    style={{
                      cursor: 'pointer',
                      borderColor: isSelected ? 'var(--c-teal)' : 'var(--c-border)',
                      padding: '14px 18px',
                      transition: 'border-color 0.12s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--c-navy)', fontSize: 14 }}>
                          {i.centre_name}
                        </div>
                        <div className="mono" style={{ fontSize: 11, color: 'var(--c-text2)', marginTop: 2 }}>
                          {i.centre_code} {i.batch_code ? `· Batch ${i.batch_code}` : ''}
                        </div>
                      </div>
                      <StatusBadge status={i.status} />
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      marginTop: 10,
                      fontSize: 12,
                      color: 'var(--c-text2)',
                      flexWrap: 'wrap',
                    }}>
                      <span>Inspector: <strong style={{ color: 'var(--c-text)' }}>{i.inspector_name}</strong></span>
                      <span>Scheduled: {formatDate(i.inspection_date)}</span>
                      {i.actual_people_found !== null && (
                        <span>Verified: <strong className="mono" style={{ color: 'var(--c-text)' }}>{i.actual_people_found}</strong> attendees</span>
                      )}
                      {i.compliance_status && (
                        <span style={{ marginLeft: 'auto' }}>
                          <StatusBadge status={i.compliance_status} />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Inspector Checklist & Report Panel */}
        {selected && (
          <div className="detail-panel">
            <div className="detail-panel-header">
              <div>
                <span className="mono" style={{ fontSize: 11, color: 'var(--c-text2)' }}>
                  Inspection #{selected.id}
                </span>
                <div style={{ fontWeight: 600, color: 'var(--c-navy)', fontSize: 14 }}>
                  {selected.centre_name}
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="btn btn-ghost btn-sm"
                style={{ padding: '2px 8px', fontSize: 14 }}
              >
                ✕
              </button>
            </div>

            <div className="detail-panel-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div className="label">Inspector Assigned</div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{selected.inspector_name}</div>
                </div>
                <StatusBadge status={selected.status} />
              </div>

              {selected.status === 'submitted' ? (
                <div style={{
                  padding: '12px 14px',
                  borderRadius: 4,
                  backgroundColor: '#EAF4EF',
                  border: '1px solid #B5DCC8',
                  color: '#31785B',
                  fontSize: 12,
                  lineHeight: '18px',
                }}>
                  This inspection has been submitted and locked. You can review verification results in the centre profile.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label className="label">Headcount Found</label>
                      <input
                        type="number"
                        value={form.actual_people_found}
                        onChange={e => setForm(f => ({ ...f, actual_people_found: e.target.value }))}
                        placeholder="Attendees"
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">Duration (minutes)</label>
                      <input
                        type="number"
                        value={form.duration_minutes}
                        onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))}
                        placeholder="e.g. 45"
                        className="input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label">Compliance Evaluation</label>
                    <select
                      value={form.compliance_status}
                      onChange={e => setForm(f => ({ ...f, compliance_status: e.target.value }))}
                      className="input"
                    >
                      <option value="compliant">Compliant</option>
                      <option value="partially_compliant">Partially Compliant</option>
                      <option value="non_compliant">Non-Compliant</option>
                    </select>
                  </div>

                  <div>
                    <label className="label" style={{ marginBottom: 8 }}>Inspection Checklist</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {CHECKLIST_ITEMS.map(item => (
                        <label
                          key={item.key}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            fontSize: 12,
                            cursor: 'pointer',
                            color: 'var(--c-text)',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={form.checklist[item.key] || false}
                            onChange={e => setForm(f => ({
                              ...f,
                              checklist: { ...f.checklist, [item.key]: e.target.checked }
                            }))}
                            style={{ accentColor: 'var(--c-teal)', width: 14, height: 14 }}
                          />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="label">Field Observations & Findings</label>
                    <textarea
                      value={form.remarks}
                      onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))}
                      rows={3}
                      className="input"
                      placeholder="Enter detailed field observations, anomalies noted, or discrepancies..."
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  {submitMsg && (
                    <div style={{
                      padding: '8px 12px',
                      borderRadius: 4,
                      fontSize: 12,
                      backgroundColor: submitMsg.includes('failed') ? '#FDEAEA' : '#EAF4EF',
                      color: submitMsg.includes('failed') ? '#B54747' : '#31785B',
                      border: `1px solid ${submitMsg.includes('failed') ? '#DCE2E3' : '#B5DCC8'}`,
                    }}>
                      {submitMsg}
                    </div>
                  )}

                  <button
                    onClick={submitInspection}
                    disabled={submitting}
                    className="btn btn-primary"
                    style={{ justifyContent: 'center' }}
                  >
                    {submitting ? 'Submitting Report...' : 'Submit Inspection Report'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
