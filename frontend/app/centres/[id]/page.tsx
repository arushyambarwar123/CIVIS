'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import RiskBadge from '@/components/ui/RiskBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import AnomalyCard from '@/components/ui/AnomalyCard';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

export default function CentreProfilePage() {
  const { id } = useParams() as { id: string };
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [inspectorName, setInspectorName] = useState('');
  const [assigned, setAssigned] = useState<string>('');

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
    } catch { setAssigned('Failed to assign inspection.'); }
    finally { setAssigning(false); }
  }

  if (loading) return <AppLayout><div className="text-gray-400 text-sm p-6">Loading...</div></AppLayout>;
  if (!profile) return <AppLayout><div className="p-6 text-red-600">Centre not found.</div></AppLayout>;

  const { centre, risk_score, risk_level, risk_reasons, batches, anomalies, inspections, corrective_actions } = profile;

  return (
    <AppLayout>
      <div className="mb-4">
        <Link href="/centres" className="text-xs text-blue-600 hover:underline">← All Centres</Link>
      </div>

      {/* Centre Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs text-gray-400 font-mono mb-1">{centre.centre_code}</div>
            <h1 className="text-2xl font-bold text-navy">{centre.centre_name}</h1>
            <div className="text-sm text-gray-500 mt-1">{centre.organisation_name}</div>
            <div className="text-sm text-gray-500">{centre.address}</div>
          </div>
          <div className="text-right flex flex-col items-end gap-2">
            <RiskBadge level={risk_level} score={risk_score} />
            <StatusBadge status={centre.status} />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-4 border-t border-gray-100">
          <div><div className="text-xs text-gray-400">District / State</div><div className="font-medium text-sm">{centre.district}, {centre.state}</div></div>
          <div><div className="text-xs text-gray-400">Total Batches</div><div className="font-medium text-sm">{profile.total_batches}</div></div>
          <div><div className="text-xs text-gray-400">Enrolled Beneficiaries</div><div className="font-medium text-sm">{profile.total_enrolled_beneficiaries}</div></div>
          <div><div className="text-xs text-gray-400">Last Inspection</div><div className={`font-medium text-sm ${!centre.last_inspection_date ? 'text-red-600' : ''}`}>{formatDate(centre.last_inspection_date) || 'Never'}</div></div>
        </div>
      </div>

      {/* Risk Reasons */}
      {risk_reasons && risk_reasons.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-5 mb-5">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">Risk Score Breakdown — {risk_score}/100</h2>
          <div className="space-y-2">
            {risk_reasons.map((r: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-32 text-xs text-gray-500 shrink-0">{r.factor?.replace(/_/g, ' ')}</div>
                <div className="flex-1 bg-gray-100 rounded-full h-4 relative overflow-hidden">
                  <div className="h-4 rounded-full" style={{ width: `${Math.min(r.contribution, 30) / 30 * 100}%`, backgroundColor: '#DC3545' }} />
                </div>
                <div className="text-xs font-bold text-red-700 w-8 text-right">+{r.contribution}</div>
                <div className="text-xs text-gray-500 flex-1">{r.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Anomalies */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 mb-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
            Detected Anomalies ({anomalies?.length || 0})
          </h2>
          <Link href={`/anomalies?centre_id=${centre.id}`} className="text-xs text-blue-600 hover:underline">View All</Link>
        </div>
        {anomalies?.length === 0 ? (
          <p className="text-gray-400 text-sm">No anomalies detected.</p>
        ) : (
          <div className="space-y-2">
            {anomalies.slice(0, 6).map((a: any) => <AnomalyCard key={a.id} anomaly={a} compact />)}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Batches */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">Batches</h2>
          <div className="space-y-2">
            {batches?.map((b: any) => (
              <div key={b.id} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100">
                <div>
                  <div className="text-sm font-medium text-navy">{b.batch_code}</div>
                  <div className="text-xs text-gray-400">{b.course_name} · {formatDate(b.start_date)} to {formatDate(b.end_date)}</div>
                </div>
                <StatusBadge status={b.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Assign Inspection */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">Assign Inspection</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Inspector Name</label>
              <input value={inspectorName} onChange={e => setInspectorName(e.target.value)}
                placeholder="Enter inspector name..."
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm" />
            </div>
            {assigned && <div className="text-xs text-green-700 bg-green-50 border border-green-100 rounded p-2">{assigned}</div>}
            <button onClick={assignInspection} disabled={assigning || !inspectorName.trim()}
              className="w-full py-2 text-sm font-semibold text-white rounded disabled:opacity-40"
              style={{ backgroundColor: '#1D6FA4' }}>
              {assigning ? 'Assigning...' : 'ASSIGN PHYSICAL INSPECTION'}
            </button>
          </div>

          {inspections?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="text-xs text-gray-500 mb-2">Past Inspections</div>
              {inspections.slice(0, 3).map((i: any) => (
                <div key={i.id} className="flex justify-between items-center text-xs py-1 border-b border-gray-50">
                  <span className="text-gray-600">{i.inspector_name} — {formatDate(i.inspection_date)}</span>
                  <StatusBadge status={i.compliance_status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Corrective Actions */}
      {corrective_actions?.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">
            Corrective Actions ({corrective_actions.length})
          </h2>
          <table className="w-full text-sm">
            <thead><tr><th>Action Required</th><th>Deadline</th><th>Assigned To</th><th>Status</th></tr></thead>
            <tbody>
              {corrective_actions.map((ca: any) => (
                <tr key={ca.id}>
                  <td className="max-w-xs truncate text-xs">{ca.action_required}</td>
                  <td className="text-xs">{formatDate(ca.deadline)}</td>
                  <td className="text-xs">{ca.responsible_person}</td>
                  <td><StatusBadge status={ca.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppLayout>
  );
}
