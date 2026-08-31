'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import RiskBadge from '@/components/ui/RiskBadge';
import { api } from '@/lib/api';
import { RiskScore } from '@/types';
import { formatDateTime } from '@/lib/utils';
import Link from 'next/link';

export default function RiskPage() {
  const [scores, setScores] = useState<RiskScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [result, setResult] = useState('');
  const [selected, setSelected] = useState<RiskScore | null>(null);

  async function load() {
    const data = await api.getRiskScores('centre');
    setScores(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function recalculate() {
    setRecalculating(true);
    setResult('');
    try {
      await api.recalculateAllRisk();
      setResult('Risk scores recalculated successfully.');
      await load();
    } catch { setResult('Recalculation failed.'); }
    finally { setRecalculating(false); }
  }

  const grouped = { critical: [] as RiskScore[], high: [] as RiskScore[], medium: [] as RiskScore[], low: [] as RiskScore[] };
  scores.forEach(s => { if (grouped[s.risk_level]) grouped[s.risk_level].push(s); });

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy">Risk Analysis</h1>
          <p className="text-sm text-gray-500">Explainable risk scores for all training centres</p>
        </div>
        <div className="flex gap-3 items-center">
          {result && <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded">{result}</span>}
          <button onClick={recalculate} disabled={recalculating}
            className="px-4 py-2 text-sm font-semibold text-white rounded disabled:opacity-50"
            style={{ backgroundColor: '#1D6FA4' }}>
            {recalculating ? 'Recalculating...' : 'RECALCULATE RISK SCORES'}
          </button>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-5 text-xs text-amber-800">
        <strong>Important:</strong> Risk scores indicate monitoring priority only. They do NOT constitute evidence of fraud or misconduct.
        All flagged items require human review and physical verification before any action.
      </div>

      {loading ? <div className="text-gray-400 text-sm p-6">Loading...</div> : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div>
            {(['critical', 'high', 'medium', 'low'] as const).map(level => {
              if (grouped[level].length === 0) return null;
              const colors: Record<string, string> = { critical: '#DC3545', high: '#FD7E14', medium: '#FFC107', low: '#198754' };
              return (
                <div key={level} className="mb-5">
                  <h2 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: colors[level] }}>
                    {level} ({grouped[level].length})
                  </h2>
                  <div className="space-y-2">
                    {grouped[level].map(rs => (
                      <div key={rs.id}
                        onClick={() => setSelected(rs === selected ? null : rs)}
                        className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-sm transition-shadow"
                        style={{ borderLeftWidth: 4, borderLeftColor: colors[level] }}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-navy text-sm">{rs.entity_name}</div>
                            <div className="text-xs text-gray-400 font-mono">{rs.entity_code}</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-2xl font-bold" style={{ color: colors[level] }}>{rs.score}</div>
                            <RiskBadge level={rs.risk_level} />
                          </div>
                        </div>
                        {/* Score bar */}
                        <div className="mt-2 bg-gray-100 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full" style={{ width: `${rs.score}%`, backgroundColor: colors[level] }} />
                        </div>
                        <div className="text-xs text-gray-400 mt-1.5">
                          {rs.reasons?.length || 0} risk factor(s) · {formatDateTime(rs.calculated_at)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detail panel */}
          {selected && (
            <div className="bg-white border border-gray-200 rounded-lg p-5 sticky top-6 self-start">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-xs text-gray-400 mb-1">Risk Profile</div>
                  <h2 className="font-semibold text-navy">{selected.entity_name}</h2>
                  <div className="text-xs text-gray-400 font-mono">{selected.entity_code}</div>
                </div>
                <button onClick={() => setSelected(null)} className="text-gray-400 text-lg">×</button>
              </div>

              <div className="flex items-center gap-4 mb-5 p-4 bg-gray-50 rounded-lg">
                <div className="text-4xl font-bold" style={{
                  color: selected.risk_level === 'critical' ? '#DC3545' : selected.risk_level === 'high' ? '#FD7E14' : selected.risk_level === 'medium' ? '#FFC107' : '#198754'
                }}>{selected.score}</div>
                <div>
                  <RiskBadge level={selected.risk_level} />
                  <div className="text-xs text-gray-400 mt-1">out of 100</div>
                </div>
              </div>

              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Risk Factors</h3>
              {selected.reasons?.length === 0 ? (
                <p className="text-sm text-gray-400">No specific risk factors recorded.</p>
              ) : (
                <div className="space-y-3">
                  {selected.reasons?.map((r, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="text-xs font-medium text-gray-700">{r.description}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{r.factor?.replace(/_/g, ' ')}</div>
                        <div className="mt-1 bg-gray-100 rounded-full h-2">
                          <div className="h-2 rounded-full bg-red-400" style={{ width: `${Math.min(r.contribution * 4, 100)}%` }} />
                        </div>
                      </div>
                      <div className="text-sm font-bold text-red-600">+{r.contribution}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-5 pt-4 border-t border-gray-100">
                <Link href={`/centres/${selected.entity_id}`}
                  className="block text-center py-2 text-sm font-semibold text-white rounded"
                  style={{ backgroundColor: '#1D6FA4' }}>
                  View Centre Profile
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
}
