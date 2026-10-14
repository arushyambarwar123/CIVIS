'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import RiskBadge from '@/components/ui/RiskBadge';
import AnomalyCard from '@/components/ui/AnomalyCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
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
        <div className="card">
          <div className="empty-state">
            <p style={{ color: '#B54747' }}>Batch not found.</p>
            <Link href="/batches" className="btn btn-ghost btn-sm" style={{ marginTop: 12 }}>
              Back to Batches
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div style={{ marginBottom: 16 }}>
        <Link
          href="/batches"
          style={{ color: '#287D79', fontSize: 12, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
        >
          ← Back to All Batches
        </Link>
      </div>

      {/* Batch Header Card */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div className="mono" style={{ color: 'var(--c-text2)', marginBottom: 4 }}>{batch.batch_code}</div>
              <h1 className="page-title">{batch.course_name}</h1>
              <div style={{ fontSize: 13, color: 'var(--c-text2)', marginTop: 4 }}>
                Duration: {formatDate(batch.start_date)} – {formatDate(batch.end_date)}
              </div>
              <div style={{ marginTop: 4 }}>
                <Link
                  href={`/centres/${batch.centre_id}`}
                  style={{ color: '#287D79', fontSize: 13, textDecoration: 'none' }}
                >
                  Training Centre #{batch.centre_id} →
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
            marginTop: 20,
            paddingTop: 16,
            borderTop: '1px solid var(--c-border)',
          }}>
            <div>
              <div className="label">Capacity</div>
              <div className="mono" style={{ fontSize: 16, fontWeight: 600 }}>{batch.batch_capacity}</div>
            </div>
            <div>
              <div className="label">Enrolled</div>
              <div className="mono" style={{ fontSize: 16, fontWeight: 600 }}>{batch.enrolled_count ?? batch.registered_count}</div>
            </div>
            <div>
              <div className="label">Attendance</div>
              <div className="mono" style={{ fontSize: 16, fontWeight: 600, color: (batch.attendance_pct ?? 0) < 60 ? '#B54747' : 'inherit' }}>
                {batch.attendance_pct !== undefined ? `${batch.attendance_pct}%` : '—'}
              </div>
            </div>
            <div>
              <div className="label">Assessed</div>
              <div className="mono" style={{ fontSize: 16, fontWeight: 600 }}>{batch.total_assessed ?? '—'}</div>
            </div>
            <div>
              <div className="label">Passed</div>
              <div className="mono" style={{ fontSize: 16, fontWeight: 600, color: '#31785B' }}>
                {batch.pass_count ?? '—'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Anomalies Section */}
      <div className="card">
        <div className="card-header">
          <span className="section-label">Batch Anomalies ({batch.open_anomalies || batch.anomalies?.length || 0})</span>
        </div>
        <div className="card-body">
          {(!batch.anomalies || batch.anomalies.length === 0) ? (
            <div className="empty-state">
              <p>No anomalies detected for this batch.</p>
            </div>
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
