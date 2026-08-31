'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import RiskBadge from '@/components/ui/RiskBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import { api } from '@/lib/api';
import { PriorityItem } from '@/types';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

export default function PriorityPage() {
  const [list, setList] = useState<PriorityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<number | null>(null);
  const [inspectorMap, setInspectorMap] = useState<Record<number, string>>({});
  const [assigned, setAssigned] = useState<Record<number, string>>({});
  const [sample, setSample] = useState<any[] | null>(null);
  const [samplingCount, setSamplingCount] = useState(3);

  useEffect(() => { api.getPriorityList().then(setList).finally(() => setLoading(false)); }, []);

  async function assign(centreId: number) {
    const name = inspectorMap[centreId];
    if (!name?.trim()) return;
    setAssigning(centreId);
    try {
      const r = await api.assignInspection({ centre_id: centreId, inspector_name: name });
      setAssigned(prev => ({ ...prev, [centreId]: `Inspection #${r.inspection_id} assigned` }));
    } catch { setAssigned(prev => ({ ...prev, [centreId]: 'Failed' })); }
    finally { setAssigning(null); }
  }

  async function getRandomSample() {
    const r = await api.getRandomSample(samplingCount);
    setSample(r.sample);
  }

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-navy">Inspection Priority List</h1>
          <p className="text-sm text-gray-500">Centres ranked by composite risk score × inspection age × critical anomalies</p>
        </div>
      </div>

      {/* Scoring formula */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-5 text-xs text-blue-700">
        <strong>Priority Score Formula:</strong> Risk Score × 0.5 + Inspection Age Factor × 0.3 + (Critical Anomalies × 10) × 0.2
        &nbsp;| Inspection Age Factor = min(100, days_since / 3.65)
      </div>

      {/* Random sample */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 mb-5">
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Random Inspection Sample</h2>
        <div className="flex gap-3 items-end flex-wrap">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Sample Size</label>
            <input type="number" value={samplingCount} onChange={e => setSamplingCount(+e.target.value)}
              min={1} max={10} className="border border-gray-200 rounded px-3 py-1.5 text-sm w-20" />
          </div>
          <button onClick={getRandomSample}
            className="px-4 py-1.5 text-sm font-semibold text-white rounded"
            style={{ backgroundColor: '#6C757D' }}>
            GENERATE RANDOM SAMPLE
          </button>
        </div>
        {sample && (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
            {sample.map((s: any) => (
              <div key={s.centre_id} className="bg-gray-50 border border-gray-100 rounded p-3 text-xs">
                <div className="font-semibold text-navy">{s.centre_name}</div>
                <div className="text-gray-400 font-mono">{s.centre_code}</div>
                <div className="text-gray-500 mt-1">{s.district}</div>
                <div className="mt-1 text-blue-600">Method: Random Sample</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {loading ? <div className="text-gray-400 text-sm p-6">Loading...</div> : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr>
                <th style={{ width: 40 }}>Rank</th>
                <th>Centre</th>
                <th>Risk</th>
                <th>Priority Score</th>
                <th>Days Since Insp.</th>
                <th>Critical Anomalies</th>
                <th>Key Reasons</th>
                <th>Assign Inspector</th>
              </tr>
            </thead>
            <tbody>
              {list.map(item => (
                <tr key={item.centre_id}>
                  <td className="text-center font-bold text-gray-500">{item.rank}</td>
                  <td>
                    <Link href={`/centres/${item.centre_id}`} className="font-medium text-blue-700 hover:underline">
                      {item.centre_name}
                    </Link>
                    <div className="text-xs text-gray-400">{item.district}, {item.state}</div>
                  </td>
                  <td><RiskBadge level={item.risk_level} score={item.risk_score} /></td>
                  <td className="font-bold text-navy">{item.priority_score}</td>
                  <td className={item.days_since_inspection > 365 ? 'text-red-600 font-semibold' : 'text-gray-700'}>
                    {item.days_since_inspection === 999 ? 'Never' : `${item.days_since_inspection}d`}
                  </td>
                  <td className="text-center">
                    {item.critical_anomaly_count > 0 ? (
                      <span className="text-red-600 font-bold">{item.critical_anomaly_count}</span>
                    ) : '—'}
                  </td>
                  <td className="text-xs text-gray-500 max-w-xs">
                    {item.priority_reasons?.slice(0, 2).join(' · ')}
                  </td>
                  <td>
                    {assigned[item.centre_id] ? (
                      <span className="text-xs text-green-700">{assigned[item.centre_id]}</span>
                    ) : (
                      <div className="flex gap-1 items-center">
                        <input
                          placeholder="Inspector name"
                          value={inspectorMap[item.centre_id] || ''}
                          onChange={e => setInspectorMap(prev => ({ ...prev, [item.centre_id]: e.target.value }))}
                          className="border border-gray-200 rounded px-2 py-1 text-xs w-28" />
                        <button
                          onClick={() => assign(item.centre_id)}
                          disabled={assigning === item.centre_id || !inspectorMap[item.centre_id]?.trim()}
                          className="px-2 py-1 text-xs text-white rounded disabled:opacity-40"
                          style={{ backgroundColor: '#1D6FA4' }}>
                          Assign
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppLayout>
  );
}
