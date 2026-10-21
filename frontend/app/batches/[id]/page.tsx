'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import RiskBadge from '@/components/ui/RiskBadge';
import AnomalyCard from '@/components/ui/AnomalyCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function BatchDetailPage() {
  const { id } = useParams() as { id: string };
  const [batch, setBatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getBatch(parseInt(id)).then(setBatch).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <AppLayout>
        <LoadingSpinner rows={6} label="Loading batch details..." />
      </AppLayout>
    );
  }

  if (!batch) {
    return (
      <AppLayout>
        <div className="card" style={{ maxWidth: 440, margin: '40px auto', padding: '36px 32px' }}>
          <EmptyState
            title="Batch Record Not Found"
            message="The requested training batch could not be found or has been archived."
            action={
              <Link href="/batches" className="btn btn-primary btn-sm">
                Return to Batches
              </Link>
            }
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div style={{ marginBottom: 16 }}>
        <Link
          href="/batches"
          style={{ color: 'var(--c-accent, #4361EE)', fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 500 }}
        >
          &larr; Back to Batches Registry
        </Link>
      </div>

      {/* Batch Header Card */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div className="mono" style={{ color: 'var(--c-text3, #75839C)', fontSize: 12, marginBottom: 4 }}>
                {batch.batch_code}
              </div>
              <h1 className="page-title">{batch.course_name}</h1>
              <div style={{ fontSize: 13, color: 'var(--c-text2, #5A6A85)', marginTop: 4 }}>
                Course Timeline: {formatDate(batch.start_date)} &ndash; {formatDate(batch.end_date)}
              </div>
              <div style={{ marginTop: 6 }}>
                <Link
                  href={`/centres/${batch.centre_id}`}
                  style={{ color: 'var(--c-accent, #4361EE)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
                >
                  Training Centre #{batch.centre_id} &rarr;
                </Link>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
              <StatusBadge status={batch.status} />
              <RiskBadge level={batch.risk_level || 'low'} score={batch.risk_score} />
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 16,
            marginTop: 24,
            paddingTop: 20,
            borderTop: '1px solid var(--c-border, #E2E8F0)',
          }}>
            <div>
              <div className="label">Capacity</div>
              <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--c-text, #1E293B)' }}>{batch.batch_capacity}</div>
            </div>
            <div>
              <div className="label">Enrolled</div>
              <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--c-text, #1E293B)' }}>{batch.enrolled_count ?? batch.registered_count}</div>
            </div>
            <div>
              <div className="label">Attendance Average</div>
              <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: (batch.attendance_pct ?? 0) < 60 ? 'var(--c-danger, #EE5D50)' : 'var(--c-text, #1E293B)' }}>
                {batch.attendance_pct !== undefined ? `${batch.attendance_pct}%` : '—'}
              </div>
            </div>
            <div>
              <div className="label">Assessed</div>
              <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--c-text, #1E293B)' }}>{batch.total_assessed ?? '—'}</div>
            </div>
            <div>
              <div className="label">Passed</div>
              <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--c-success, #01B574)' }}>
                {batch.pass_count ?? '—'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Anomalies Section */}
      <div className="card">
        <div className="card-header" style={{ padding: '20px 24px' }}>
          <span className="section-label">Active Batch Anomalies ({batch.open_anomalies || batch.anomalies?.length || 0})</span>
        </div>
        <div className="card-body" style={{ padding: '24px' }}>
          {(!batch.anomalies || batch.anomalies.length === 0) ? (
            <EmptyState
              title="No Batch Anomalies"
              message="No attendance or operational discrepancies have been flagged for this batch."
              compact
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {batch.anomalies.map((a: any) => (
                <AnomalyCard key={a.id} anomaly={a} compact />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
