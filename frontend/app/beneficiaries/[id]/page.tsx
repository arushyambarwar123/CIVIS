'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import AnomalyCard from '@/components/ui/AnomalyCard';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

export default function BeneficiaryProfilePage() {
  const { id } = useParams() as { id: string };
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getBeneficiary(parseInt(id)).then(setProfile).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <AppLayout><div className="text-gray-400 text-sm p-6">Loading...</div></AppLayout>;
  if (!profile) return <AppLayout><div className="p-6 text-red-600">Beneficiary not found.</div></AppLayout>;

  return (
    <AppLayout>
      <div className="mb-4">
        <Link href="/beneficiaries" className="text-xs text-blue-600 hover:underline">← All Beneficiaries</Link>
      </div>

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-mono text-gray-400 mb-1">{profile.beneficiary_token}</div>
            <h1 className="text-2xl font-bold text-navy">{profile.name}</h1>
            <div className="flex gap-4 mt-2 text-sm text-gray-500">
              <span>Age: {profile.age}</span>
              <span>Gender: {profile.gender}</span>
              <span>Category: {profile.category}</span>
            </div>
            <div className="text-sm text-gray-500">{profile.district}, {profile.state}</div>
          </div>
          <StatusBadge status={profile.eligibility_status ? 'active' : 'failed'} />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100 text-sm">
          <div><span className="text-gray-400">Bank Account Token:</span> <span className="font-mono text-xs ml-1">{profile.bank_account_token}</span></div>
          <div><span className="text-gray-400">Mobile Token:</span> <span className="font-mono text-xs ml-1">{profile.mobile_token}</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Enrolments & Attendance */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Enrolments</h2>
            {profile.enrolments?.length === 0 ? <p className="text-gray-400 text-sm">No enrolments.</p> : (
              <div className="space-y-2">
                {profile.enrolments?.map((e: any) => (
                  <div key={e.id} className="flex justify-between items-center p-2 bg-gray-50 rounded text-xs">
                    <div>
                      <Link href={`/batches/${e.batch_id}`} className="font-medium text-blue-700 hover:underline">
                        Batch #{e.batch_id}
                      </Link>
                      <span className="text-gray-400 ml-2">Enrolled: {formatDate(e.enrolment_date)}</span>
                    </div>
                    <StatusBadge status={e.completion_status || e.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Attendance Summary</h2>
            {profile.attendance_summary?.length === 0 ? <p className="text-gray-400 text-sm">No attendance data.</p> : (
              <table className="w-full text-xs">
                <thead><tr><th>Batch</th><th>Days</th><th>Present</th><th>%</th></tr></thead>
                <tbody>
                  {profile.attendance_summary?.map((a: any) => (
                    <tr key={a.batch_id}>
                      <td className="font-mono">{a.batch_code}</td>
                      <td>{a.total_days}</td>
                      <td>{a.present_days}</td>
                      <td className={a.attendance_pct >= 80 ? 'text-green-600 font-bold' : a.attendance_pct >= 60 ? 'text-yellow-600 font-bold' : 'text-red-600 font-bold'}>
                        {a.attendance_pct}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Assessments</h2>
            {profile.assessments?.length === 0 ? <p className="text-gray-400 text-sm">No assessments.</p> : (
              <table className="w-full text-xs">
                <thead><tr><th>Batch</th><th>Score</th><th>Result</th><th>Certification</th></tr></thead>
                <tbody>
                  {profile.assessments?.map((a: any) => (
                    <tr key={a.id}>
                      <td>#{a.batch_id}</td>
                      <td className="font-bold">{a.score}</td>
                      <td><StatusBadge status={a.result} /></td>
                      <td><StatusBadge status={a.certification_status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {/* Placements */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Placements</h2>
            {profile.placements?.length === 0 ? <p className="text-gray-400 text-sm">No placement records.</p> : (
              profile.placements?.map((p: any) => (
                <div key={p.id} className="p-2 bg-gray-50 rounded text-xs mb-2">
                  <div className="font-medium">{p.employer_name}</div>
                  <div className="text-gray-400">{p.employment_type} · {formatDate(p.placement_date)} · Rs {p.salary?.toLocaleString()}/mo</div>
                  <StatusBadge status={p.verification_status} />
                </div>
              ))
            )}
          </div>

          {/* Payments */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Payments</h2>
            {profile.payments?.length === 0 ? <p className="text-gray-400 text-sm">No payment records.</p> : (
              <table className="w-full text-xs">
                <thead><tr><th>Type</th><th>Amount</th><th>Date</th><th>Status</th></tr></thead>
                <tbody>
                  {profile.payments?.map((p: any) => (
                    <tr key={p.id}>
                      <td className="capitalize">{p.payment_type}</td>
                      <td>Rs {p.amount?.toLocaleString()}</td>
                      <td>{formatDate(p.payment_date)}</td>
                      <td><StatusBadge status={p.payment_status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Anomalies */}
          {profile.anomalies?.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
                Anomalies ({profile.anomalies.length})
              </h2>
              <div className="space-y-2">
                {profile.anomalies?.map((a: any) => <AnomalyCard key={a.id} anomaly={a} compact />)}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
