'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import RiskBadge from '@/components/ui/RiskBadge';
import AnomalyCard from '@/components/ui/AnomalyCard';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

export default function BatchDetailPage() {
  const { id } = useParams() as { id: string };
  const [batch, setBatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getBatch(parseInt(id)).then(setBatch).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <AppLayout><div className="text-gray-400 text-sm p-6">Loading...</div></AppLayout>;
  if (!batch) return <AppLayout><div className="p-6 text-red-600">Batch not found.</div></AppLayout>;

  return (
    <AppLayout>
      <div className="mb-4">
        <Link href="/batches" className="text-xs text-blue-600 hover:underline">← All Batches</Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-mono text-gray-400 mb-1">{batch.batch_code}</div>
            <h1 className="text-2xl font-bold text-navy">{batch.course_name}</h1>
            <div className="text-sm text-gray-500 mt-1">
              {formatDate(batch.start_date)} – {formatDate(batch.end_date)}
            </div>
            <div className="mt-1">
              <Link href={`/centres/${batch.centre_id}`} className="text-sm text-blue-600 hover:underline">
                Centre #{batch.centre_id}
              </Link>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={batch.status} />
            <RiskBadge level={batch.risk_level || 'low'} score={batch.risk_score} />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-5 pt-4 border-t border-gray-100">
          <div><div className="text-xs text-gray-400">Capacity</div><div className="font-semibold">{batch.batch_capacity}</div></div>
          <div><div className="text-xs text-gray-400">Enrolled</div><div className="font-semibold">{batch.enrolled_count}</div></div>
          <div><div className="text-xs text-gray-400">Attendance</div><div className="font-semibold">{batch.attendance_pct}%</div></div>
          <div><div className="text-xs text-gray-400">Assessments</div><div className="font-semibold">{batch.total_assessed}</div></div>
          <div><div className="text-xs text-gray-400">Passed</div><div className="font-semibold text-green-600">{batch.pass_count}</div></div>
        </div>
      </div>

      {batch.open_anomalies > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-5 mb-5">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
            Anomalies ({batch.open_anomalies})
          </h2>
          <div className="space-y-2">
            {batch.anomalies?.map((a: any) => <AnomalyCard key={a.id} anomaly={a} compact />)}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
