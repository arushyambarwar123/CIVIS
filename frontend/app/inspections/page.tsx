'use client';

import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
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
      setInspections(data || []);
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
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title">Physical Inspections</h1>
        <p className="page-subtitle">Track, record, and submit on-site verification findings</p>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="filter-group">
          <label className="label">Inspection Status</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
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
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-pill, 50px)',
                    fontSize: 12,
                    fontWeight: 600,
                    background: active ? 'rgba(67, 97, 238, 0.1)' : 'var(--c-surface, #FFFFFF)',
                    border: `1px solid ${active ? 'var(--c-accent, #4361EE)' : 'var(--c-border, #E2E8F0)'}`,
                    color: active ? 'var(--c-accent, #4361EE)' : 'var(--c-text2, #5A6A85)',
                    cursor: 'pointer',
                    transition: 'all 0.12s',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 460px' : '1fr', gap: 24, alignItems: 'start' }}>
        {/* Inspection List Cards */}
        <div>
          {loading ? (
            <LoadingSpinner rows={8} label="Loading inspection records..." />
          ) : filtered.length === 0 ? (
            <div className="card">
              <EmptyState
                title="No Inspections Found"
                message="No site inspection records match the active filter criteria."
              />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filtered.map(i => {
                const isSelected = selected?.id === i.id;
                return (
                  <div
                    key={i.id}
                    onClick={() => selectInspection(i)}
                    className="card"
                    style={{
                      cursor: 'pointer',
                      borderLeft: isSelected ? '4px solid var(--c-accent, #4361EE)' : '1px solid var(--c-border, #E2E8F0)',
                      padding: '16px 20px',
                      background: isSelected ? '#FAFCFE' : '#FFFFFF',
                      boxShadow: isSelected ? 'var(--shadow-md)' : 'var(--shadow-card)',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.borderColor = 'var(--c-accent, #4361EE)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.borderColor = 'var(--c-border, #E2E8F0)';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--c-text, #1E293B)', fontSize: 14.5 }}>
                          {i.centre_name}
                        </div>
                        <div className="mono" style={{ fontSize: 12, color: 'var(--c-text3, #75839C)', marginTop: 2 }}>
                          {i.centre_code} {i.batch_code ? `&bull; Batch ${i.batch_code}` : ''}
                        </div>
                      </div>
                      <StatusBadge status={i.status} />
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      marginTop: 10,
                      fontSize: 12.5,
                      color: 'var(--c-text2, #5A6A85)',
                      flexWrap: 'wrap',
                    }}>
                      <span>Inspector: <strong style={{ color: 'var(--c-text, #1E293B)' }}>{i.inspector_name}</strong></span>
                      <span>&bull;</span>
                      <span>Scheduled: {formatDate(i.inspection_date)}</span>
                      {i.actual_people_found !== null && (
                        <>
                          <span>&bull;</span>
                          <span>Verified: <strong className="mono" style={{ color: 'var(--c-text, #1E293B)' }}>{i.actual_people_found}</strong> headcount</span>
                        </>
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
          <div className="detail-panel" style={{ position: 'sticky', top: 96 }}>
            <div className="detail-panel-header" style={{ padding: '18px 22px' }}>
              <div>
                <span className="mono" style={{ fontSize: 11.5, color: 'var(--c-text3, #75839C)' }}>
                  Inspection #{selected.id}
                </span>
                <div style={{ fontWeight: 700, color: 'var(--c-text, #1E293B)', fontSize: 15, marginTop: 2 }}>
                  {selected.centre_name}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="btn btn-ghost btn-sm"
                style={{ padding: '4px 8px', fontSize: 14 }}
              >
                ✕
              </button>
            </div>

            <div className="detail-panel-body" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div className="label">Inspector Assigned</div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--c-text, #1E293B)' }}>{selected.inspector_name}</div>
                </div>
                <StatusBadge status={selected.status} />
              </div>

              {selected.status === 'submitted' ? (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm, 8px)',
                  backgroundColor: 'var(--c-success-bg, #E6FBF3)',
                  border: '1px solid #B8F2DC',
                  color: 'var(--c-success, #01B574)',
                  fontSize: 13,
                  lineHeight: 1.5,
                  marginBottom: 16,
                }}>
                  <strong>Report Submitted: </strong>
                  Verified {selected.actual_people_found} trainees on site. Status rated as {selected.compliance_status}.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label className="label">Actual Trainees Present</label>
                      <input
                        type="number"
                        value={form.actual_people_found}
                        onChange={e => setForm(f => ({ ...f, actual_people_found: e.target.value }))}
                        className="input"
                        placeholder="Count..."
                      />
                    </div>
                    <div>
                      <label className="label">Duration (Minutes)</label>
                      <input
                        type="number"
                        value={form.duration_minutes}
                        onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))}
                        className="input"
                        placeholder="Mins..."
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
                    <label className="label" style={{ marginBottom: 8 }}>Site Verification Checklist</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {CHECKLIST_ITEMS.map(item => (
                        <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--c-text, #1E293B)', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={form.checklist[item.key] || false}
                            onChange={e => setForm(f => ({
                              ...f,
                              checklist: { ...f.checklist, [item.key]: e.target.checked },
                            }))}
                            style={{ accentColor: 'var(--c-accent, #4361EE)', width: 16, height: 16 }}
                          />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="label">Inspector Findings &amp; Summary</label>
                    <textarea
                      value={form.remarks}
                      onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))}
                      className="input"
                      rows={3}
                      placeholder="Enter field observations, notes, or deficiencies noted..."
                    />
                  </div>

                  {submitMsg && (
                    <div style={{
                      padding: '8px 12px',
                      borderRadius: 4,
                      fontSize: 12,
                      backgroundColor: submitMsg.includes('Failed') ? 'var(--c-danger-bg, #FFF0EF)' : 'var(--c-success-bg, #E6FBF3)',
                      color: submitMsg.includes('Failed') ? 'var(--c-danger, #EE5D50)' : 'var(--c-success, #01B574)',
                    }}>
                      {submitMsg}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={submitInspection}
                    disabled={submitting}
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', borderRadius: 'var(--radius-sm, 8px)' }}
                  >
                    {submitting ? 'Submitting...' : 'Submit Inspection Report'}
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
