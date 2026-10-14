'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import RiskBadge from '@/components/ui/RiskBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import AnomalyCard from '@/components/ui/AnomalyCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { api } from '@/lib/api';
import { formatDate, riskColor } from '@/lib/utils';

export default function CentreProfilePage() {
  const { id } = useParams() as { id: string };
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [inspectorName, setInspectorName] = useState('');
  const [assigned, setAssigned] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'anomalies' | 'batches' | 'inspections' | 'actions'>('overview');

  useEffect(() => {
    api.getCentreProfile(parseInt(id)).then(setProfile).finally(() => setLoading(false));
  }, [id]);

  async function assignInspection() {
    if (!inspectorName.trim()) return;
    setAssigning(true);
    try {
      const r = await api.assignInspection({ centre_id: parseInt(id), inspector_name: inspectorName });
      setAssigned(`Inspection #${r.inspection_id} assigned to ${inspectorName}`);
      setInspectorName('');
      // Reload profile
      const updated = await api.getCentreProfile(parseInt(id));
      setProfile(updated);
    } catch {
      setAssigned('Failed to assign inspection.');
    } finally {
      setAssigning(false);
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <LoadingSpinner rows={8} label="Loading centre profile..." />
      </AppLayout>
    );
  }

  if (!profile || !profile.centre) {
    return (
      <AppLayout>
        <div className="card">
          <div className="empty-state">
            <p style={{ color: '#B54747' }}>Centre not found.</p>
            <Link href="/centres" className="btn btn-ghost btn-sm" style={{ marginTop: 12 }}>
              Back to Centres
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const { centre, risk_score, risk_level, risk_reasons, batches, anomalies, inspections, corrective_actions } = profile;

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'anomalies', label: `Anomalies (${anomalies?.length || 0})` },
    { id: 'batches', label: `Batches (${batches?.length || 0})` },
    { id: 'inspections', label: `Inspections (${inspections?.length || 0})` },
    { id: 'actions', label: `Corrective Actions (${corrective_actions?.length || 0})` },
  ];

  return (
    <AppLayout>
      <div style={{ marginBottom: 16 }}>
        <Link
          href="/centres"
          style={{ color: '#287D79', fontSize: 12, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
        >
          ← Back to All Centres
        </Link>
      </div>

      {/* Centre Header Card */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div className="mono" style={{ color: 'var(--c-text2)', marginBottom: 4 }}>{centre.centre_code}</div>
              <h1 className="page-title">{centre.centre_name}</h1>
              <div style={{ fontSize: 13, color: 'var(--c-text2)', marginTop: 2 }}>{centre.organisation_name}</div>
              <div style={{ fontSize: 13, color: 'var(--c-text2)' }}>{centre.address}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
              <RiskBadge level={risk_level || 'low'} score={risk_score} />
              <StatusBadge status={centre.status} />
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 16,
            marginTop: 20,
            paddingTop: 16,
            borderTop: '1px solid var(--c-border)',
          }}>
            <div>
              <div className="label">District / State</div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{centre.district}, {centre.state}</div>
            </div>
            <div>
              <div className="label">Total Batches</div>
              <div className="mono" style={{ fontSize: 13, fontWeight: 600 }}>{profile.total_batches ?? (batches?.length || 0)}</div>
            </div>
            <div>
              <div className="label">Enrolled Beneficiaries</div>
              <div className="mono" style={{ fontSize: 13, fontWeight: 600 }}>{profile.total_enrolled_beneficiaries ?? 0}</div>
            </div>
            <div>
              <div className="label">Last Inspection</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: !centre.last_inspection_date ? '#B54747' : 'inherit' }}>
                {centre.last_inspection_date ? formatDate(centre.last_inspection_date) : 'Never Inspected'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: 24,
        borderBottom: '1px solid var(--c-border)',
        marginBottom: 20,
        overflowX: 'auto',
      }}>
        {TABS.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: active ? '2px solid var(--c-teal)' : '2px solid transparent',
                color: active ? 'var(--c-teal)' : 'var(--c-text2)',
                fontWeight: active ? 600 : 400,
                fontSize: 13,
                padding: '8px 4px',
                cursor: 'pointer',
                marginBottom: -1,
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Risk Score Section */}
          <div className="card">
            <div className="card-header">
              <span className="section-label">Risk Assessment</span>
              <RiskBadge level={risk_level || 'low'} score={risk_score} />
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--c-navy)', lineHeight: 1 }}>
                    {risk_score ?? 0}
                    <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--c-text2)' }}> / 100</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--c-text2)', marginTop: 4 }}>
                    Overall Risk Rating: {risk_level ? risk_level.toUpperCase() : 'LOW'}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="risk-bar-track" style={{ height: 10 }}>
                    <div
                      className="risk-bar-fill"
                      style={{
                        width: `${Math.min(100, Math.max(0, risk_score ?? 0))}%`,
                        backgroundColor: riskColor(risk_level || 'low'),
                      }}
                    />
                  </div>
                </div>
              </div>

              {risk_reasons && risk_reasons.length > 0 && (
                <div>
                  <div className="section-label" style={{ marginBottom: 12 }}>Risk Contribution Factors</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {risk_reasons.map((r: any, i: number) => {
                      const pct = Math.min(100, (r.contribution / 40) * 100);
                      return (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 60px', alignItems: 'center', gap: 12 }}>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--c-text)' }}>
                              {r.factor ? r.factor.replace(/_/g, ' ') : 'Factor'}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--c-text2)' }}>{r.description}</div>
                          </div>
                          <div className="risk-bar-track">
                            <div
                              className="risk-bar-fill"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: riskColor(risk_level || 'low'),
                              }}
                            />
                          </div>
                          <div className="mono" style={{ fontSize: 12, fontWeight: 600, color: riskColor(risk_level || 'low'), textAlign: 'right' }}>
                            +{r.contribution}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick 2-column layout: Assign inspection & Recent Anomalies */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
            {/* Assign Inspection Card */}
            <div className="card">
              <div className="card-header">
                <span className="section-label">Assign Inspection</span>
              </div>
              <div className="card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label className="label">Inspector Name</label>
                    <input
                      value={inspectorName}
                      onChange={e => setInspectorName(e.target.value)}
                      placeholder="Enter inspector full name..."
                      className="input"
                    />
                  </div>
                  {assigned && (
                    <div style={{
                      padding: '8px 12px',
                      borderRadius: 4,
                      fontSize: 12,
                      backgroundColor: assigned.startsWith('Failed') ? '#FDEAEA' : '#EAF4EF',
                      color: assigned.startsWith('Failed') ? '#B54747' : '#31785B',
                      border: `1px solid ${assigned.startsWith('Failed') ? '#DCE2E3' : '#B5DCC8'}`,
                    }}>
                      {assigned}
                    </div>
                  )}
                  <button
                    onClick={assignInspection}
                    disabled={assigning || !inspectorName.trim()}
                    className="btn btn-primary btn-sm"
                    style={{ alignSelf: 'flex-start' }}
                  >
                    {assigning ? 'Assigning...' : 'Assign Physical Inspection'}
                  </button>
                </div>

                {inspections && inspections.length > 0 && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--c-border)' }}>
                    <div className="section-label" style={{ marginBottom: 8 }}>Recent Inspections</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {inspections.slice(0, 3).map((i: any) => (
                        <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                          <span style={{ color: 'var(--c-text2)' }}>
                            {i.inspector_name} · {formatDate(i.inspection_date)}
                          </span>
                          <StatusBadge status={i.compliance_status || i.status} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Active Anomalies Preview */}
            <div className="card">
              <div className="card-header">
                <span className="section-label">Active Anomalies ({anomalies?.length || 0})</span>
                <button onClick={() => setActiveTab('anomalies')} className="btn btn-ghost btn-sm">
                  View All
                </button>
              </div>
              <div className="card-body">
                {(!anomalies || anomalies.length === 0) ? (
                  <div className="empty-state" style={{ padding: '24px 0' }}>
                    <p>No anomalies detected for this centre.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {anomalies.slice(0, 3).map((a: any) => (
                      <AnomalyCard key={a.id} anomaly={a} compact />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'anomalies' && (
        <div className="card">
          <div className="card-header">
            <span className="section-label">Detected Anomalies ({anomalies?.length || 0})</span>
            <Link href={`/anomalies?centre_id=${centre.id}`} style={{ color: '#287D79', fontSize: 12, textDecoration: 'none' }}>
              Open in Anomaly Engine →
            </Link>
          </div>
          <div className="card-body">
            {(!anomalies || anomalies.length === 0) ? (
              <div className="empty-state">
                <p>No anomalies detected for this centre.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {anomalies.map((a: any) => (
                  <AnomalyCard key={a.id} anomaly={a} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'batches' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="card-header">
            <span className="section-label">Training Batches ({batches?.length || 0})</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Batch Code</th>
                <th>Course Name</th>
                <th>Timeline</th>
                <th>Capacity</th>
                <th>Registered</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {batches?.map((b: any) => (
                <tr key={b.id}>
                  <td className="mono" style={{ color: 'var(--c-text)' }}>{b.batch_code}</td>
                  <td>{b.course_name}</td>
                  <td style={{ fontSize: 12, color: 'var(--c-text2)' }}>
                    {formatDate(b.start_date)} - {formatDate(b.end_date)}
                  </td>
                  <td className="mono">{b.batch_capacity}</td>
                  <td className="mono">{b.registered_count}</td>
                  <td><StatusBadge status={b.status} /></td>
                  <td style={{ textAlign: 'right' }}>
                    <Link href={`/batches/${b.id}`} className="btn btn-ghost btn-sm">
                      Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!batches || batches.length === 0) && (
            <div className="empty-state">
              <p>No batches registered for this centre.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'inspections' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <div className="card-header">
              <span className="section-label">Schedule Inspection</span>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', maxWidth: 480 }}>
                <div style={{ flex: 1 }}>
                  <label className="label">Inspector Name</label>
                  <input
                    value={inspectorName}
                    onChange={e => setInspectorName(e.target.value)}
                    placeholder="Enter inspector full name..."
                    className="input"
                  />
                </div>
                <button
                  onClick={assignInspection}
                  disabled={assigning || !inspectorName.trim()}
                  className="btn btn-primary btn-sm"
                  style={{ height: 33 }}
                >
                  {assigning ? 'Assigning...' : 'Assign Inspection'}
                </button>
              </div>
              {assigned && (
                <div style={{
                  marginTop: 12,
                  padding: '8px 12px',
                  borderRadius: 4,
                  fontSize: 12,
                  backgroundColor: assigned.startsWith('Failed') ? '#FDEAEA' : '#EAF4EF',
                  color: assigned.startsWith('Failed') ? '#B54747' : '#31785B',
                  border: `1px solid ${assigned.startsWith('Failed') ? '#DCE2E3' : '#B5DCC8'}`,
                }}>
                  {assigned}
                </div>
              )}
            </div>
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="card-header">
              <span className="section-label">Past Inspections ({inspections?.length || 0})</span>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Inspection Date</th>
                  <th>Inspector</th>
                  <th>Compliance Status</th>
                  <th>Batch</th>
                  <th>People Found</th>
                </tr>
              </thead>
              <tbody>
                {inspections?.map((i: any) => (
                  <tr key={i.id}>
                    <td style={{ fontSize: 12 }}>{formatDate(i.inspection_date)}</td>
                    <td style={{ fontWeight: 500 }}>{i.inspector_name}</td>
                    <td><StatusBadge status={i.compliance_status || i.status} /></td>
                    <td className="mono" style={{ color: 'var(--c-text2)' }}>{i.batch_code || '—'}</td>
                    <td className="mono">{i.actual_people_found ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!inspections || inspections.length === 0) && (
              <div className="empty-state">
                <p>No inspections recorded yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'actions' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="card-header">
            <span className="section-label">Corrective Actions ({corrective_actions?.length || 0})</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Action Required</th>
                <th>Responsible Person</th>
                <th>Deadline</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {corrective_actions?.map((ca: any) => (
                <tr key={ca.id}>
                  <td>{ca.action_required}</td>
                  <td style={{ fontSize: 12, color: 'var(--c-text2)' }}>{ca.responsible_person}</td>
                  <td style={{ fontSize: 12, color: ca.is_overdue ? '#B54747' : 'inherit' }}>
                    {formatDate(ca.deadline)}
                  </td>
                  <td><StatusBadge status={ca.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!corrective_actions || corrective_actions.length === 0) && (
            <div className="empty-state">
              <p>No corrective actions required for this centre.</p>
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
}
