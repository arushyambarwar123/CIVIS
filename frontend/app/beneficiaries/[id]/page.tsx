'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import AnomalyCard from '@/components/ui/AnomalyCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function BeneficiaryProfilePage() {
  const { id } = useParams() as { id: string };
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'enrolments' | 'attendance' | 'assessments' | 'placements' | 'payments' | 'anomalies'>('all');

  useEffect(() => {
    api.getBeneficiary(parseInt(id)).then(setProfile).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <AppLayout>
        <LoadingSpinner rows={8} label="Loading beneficiary profile..." />
      </AppLayout>
    );
  }

  if (!profile) {
    return (
      <AppLayout>
        <div className="card">
          <div className="empty-state">
            <p style={{ color: '#B54747' }}>Beneficiary record not found.</p>
            <Link href="/beneficiaries" className="btn btn-ghost btn-sm" style={{ marginTop: 12 }}>
              Back to Beneficiaries
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const TABS = [
    { id: 'all', label: 'All Details' },
    { id: 'enrolments', label: `Enrolments (${profile.enrolments?.length || 0})` },
    { id: 'attendance', label: 'Attendance' },
    { id: 'assessments', label: `Assessments (${profile.assessments?.length || 0})` },
    { id: 'placements', label: `Placements (${profile.placements?.length || 0})` },
    { id: 'payments', label: `Payments (${profile.payments?.length || 0})` },
    { id: 'anomalies', label: `Anomalies (${profile.anomalies?.length || 0})` },
  ];

  const showAll = activeTab === 'all';

  return (
    <AppLayout>
      <div style={{ marginBottom: 16 }}>
        <Link
          href="/beneficiaries"
          style={{ color: '#287D79', fontSize: 12, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
        >
          ← Back to All Beneficiaries
        </Link>
      </div>

      {/* Header Profile Card: Two-column clean info grid */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div>
            <div className="mono" style={{ color: 'var(--c-text2)', marginBottom: 2 }}>{profile.beneficiary_token}</div>
            <h1 className="page-title">{profile.name}</h1>
          </div>
          <StatusBadge status={profile.eligibility_status ? 'active' : 'failed'} />
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px 24px' }}>
            <div>
              <div className="label">Age & Gender</div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{profile.age} years · {profile.gender}</div>
            </div>
            <div>
              <div className="label">Social Category</div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{profile.category}</div>
            </div>
            <div>
              <div className="label">District & State</div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{profile.district}, {profile.state}</div>
            </div>
            <div>
              <div className="label">Eligibility Status</div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{profile.eligibility_status ? 'Eligible' : 'Ineligible'}</div>
            </div>
            <div>
              <div className="label">Bank Account Token</div>
              <div className="mono" style={{ fontSize: 12, color: 'var(--c-text2)' }}>{profile.bank_account_token}</div>
            </div>
            <div>
              <div className="label">Mobile Token</div>
              <div className="mono" style={{ fontSize: 12, color: 'var(--c-text2)' }}>{profile.mobile_token}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
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

      {/* Profile Details Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: showAll ? 'repeat(auto-fit, minmax(460px, 1fr))' : '1fr', gap: 20 }}>
        {/* Enrolments */}
        {(showAll || activeTab === 'enrolments') && (
          <div className="card">
            <div className="card-header">
              <span className="section-label">Batch Enrolments ({profile.enrolments?.length || 0})</span>
            </div>
            <div className="card-body">
              {(!profile.enrolments || profile.enrolments.length === 0) ? (
                <div className="empty-state" style={{ padding: '24px 0' }}>
                  <p>No enrolments on record.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {profile.enrolments.map((e: any) => (
                    <div
                      key={e.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 12px',
                        background: 'var(--c-surface2)',
                        borderRadius: 4,
                        border: '1px solid var(--c-border)',
                      }}
                    >
                      <div>
                        <Link
                          href={`/batches/${e.batch_id}`}
                          style={{ color: '#287D79', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}
                        >
                          Batch #{e.batch_id}
                        </Link>
                        <div style={{ fontSize: 11, color: 'var(--c-text2)', marginTop: 2 }}>
                          Enrolled: {formatDate(e.enrolment_date)}
                        </div>
                      </div>
                      <StatusBadge status={e.completion_status || e.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Attendance Summary */}
        {(showAll || activeTab === 'attendance') && (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="card-header">
              <span className="section-label">Attendance Summary</span>
            </div>
            {(!profile.attendance_summary || profile.attendance_summary.length === 0) ? (
              <div className="empty-state">
                <p>No attendance records found.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Batch</th>
                    <th>Days</th>
                    <th>Present</th>
                    <th>Attendance %</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.attendance_summary.map((a: any) => {
                    const pct = a.attendance_pct ?? 0;
                    const barColor = pct >= 80 ? '#31785B' : pct >= 60 ? '#B77928' : '#B54747';
                    return (
                      <tr key={a.batch_id}>
                        <td className="mono" style={{ fontWeight: 500 }}>{a.batch_code}</td>
                        <td className="mono">{a.total_days}</td>
                        <td className="mono">{a.present_days}</td>
                        <td style={{ minWidth: 160 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="risk-bar-track" style={{ flex: 1, height: 6 }}>
                              <div
                                className="risk-bar-fill"
                                style={{ width: `${Math.min(100, Math.max(0, pct))}%`, backgroundColor: barColor }}
                              />
                            </div>
                            <span className="mono" style={{ fontSize: 12, fontWeight: 600, color: barColor, minWidth: 36, textAlign: 'right' }}>
                              {pct}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Assessments */}
        {(showAll || activeTab === 'assessments') && (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="card-header">
              <span className="section-label">Assessments & Certifications ({profile.assessments?.length || 0})</span>
            </div>
            {(!profile.assessments || profile.assessments.length === 0) ? (
              <div className="empty-state">
                <p>No assessment records found.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Batch</th>
                    <th>Score</th>
                    <th>Result</th>
                    <th>Certification</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.assessments.map((a: any) => (
                    <tr key={a.id}>
                      <td className="mono">#{a.batch_id}</td>
                      <td className="mono" style={{ fontWeight: 600 }}>{a.score}</td>
                      <td><StatusBadge status={a.result} /></td>
                      <td><StatusBadge status={a.certification_status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Placements */}
        {(showAll || activeTab === 'placements') && (
          <div className="card">
            <div className="card-header">
              <span className="section-label">Placements ({profile.placements?.length || 0})</span>
            </div>
            <div className="card-body">
              {(!profile.placements || profile.placements.length === 0) ? (
                <div className="empty-state" style={{ padding: '24px 0' }}>
                  <p>No placement records.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {profile.placements.map((p: any) => (
                    <div
                      key={p.id}
                      style={{
                        padding: '10px 12px',
                        background: 'var(--c-surface2)',
                        borderRadius: 4,
                        border: '1px solid var(--c-border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{p.employer_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--c-text2)', marginTop: 2 }}>
                          {p.employment_type} · {formatDate(p.placement_date)} · ₹{p.salary?.toLocaleString()}/mo
                        </div>
                      </div>
                      <StatusBadge status={p.verification_status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payments */}
        {(showAll || activeTab === 'payments') && (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="card-header">
              <span className="section-label">Payments ({profile.payments?.length || 0})</span>
            </div>
            {(!profile.payments || profile.payments.length === 0) ? (
              <div className="empty-state">
                <p>No payment records.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.payments.map((p: any) => (
                    <tr key={p.id}>
                      <td style={{ textTransform: 'capitalize' }}>{p.payment_type?.replace(/_/g, ' ')}</td>
                      <td className="mono" style={{ fontWeight: 600 }}>₹{p.amount?.toLocaleString()}</td>
                      <td style={{ fontSize: 12, color: 'var(--c-text2)' }}>{formatDate(p.payment_date)}</td>
                      <td><StatusBadge status={p.payment_status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Anomalies */}
        {(showAll || activeTab === 'anomalies') && (
          <div className="card" style={{ gridColumn: showAll ? '1 / -1' : undefined }}>
            <div className="card-header">
              <span className="section-label">Detected Anomalies ({profile.anomalies?.length || 0})</span>
            </div>
            <div className="card-body">
              {(!profile.anomalies || profile.anomalies.length === 0) ? (
                <div className="empty-state">
                  <p>No anomalies detected for this beneficiary.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {profile.anomalies.map((a: any) => (
                    <AnomalyCard key={a.id} anomaly={a} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
