'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import RiskBadge from '@/components/ui/RiskBadge';
import { api } from '@/lib/api';
import { MatchResult } from '@/types';
import { formatDateTime } from '@/lib/utils';

export default function MatchingPage() {
  const [results, setResults] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [runMsg, setRunMsg] = useState('');
  const [selected, setSelected] = useState<MatchResult | null>(null);

  async function load() {
    setLoading(true);
    const data = await api.getMatchingResults();
    setResults(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function runMatch() {
    setRunning(true); setRunMsg('');
    try {
      const r = await api.runMatching();
      setRunMsg(`Matching complete: ${r.matches_found} matches found, ${r.conflicts_found} conflicts.`);
      await load();
    } catch { setRunMsg('Matching failed.'); }
    finally { setRunning(false); }
  }

  const conflicts = results.filter(r => r.is_conflict);
  const highConf = results.filter(r => !r.is_conflict && r.match_level === 'high');
  const possible = results.filter(r => !r.is_conflict && r.match_level === 'possible');

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-navy">Beneficiary Matching</h1>
          <p className="text-sm text-gray-500">Identify potential duplicate beneficiary records</p>
        </div>
        <div className="flex gap-3 items-center">
          {runMsg && <span className="text-xs text-green-700 bg-green-50 border border-green-100 px-3 py-1.5 rounded">{runMsg}</span>}
          <button onClick={runMatch} disabled={running}
            className="px-4 py-2 text-sm font-semibold text-white rounded disabled:opacity-50"
            style={{ backgroundColor: '#1D6FA4' }}>
            {running ? 'Running...' : 'RUN BENEFICIARY MATCHING'}
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded p-3 mb-5 text-xs text-blue-700">
        <strong>Note:</strong> These are potential matches based on name similarity, mobile, and bank account tokens.
        A match does NOT mean fraud — it requires human verification.
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="bg-white border border-red-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{conflicts.length}</div>
          <div className="text-xs text-gray-500 mt-1">Enrolment Conflicts</div>
          <div className="text-xs text-gray-400">(Same person, multiple batches)</div>
        </div>
        <div className="bg-white border border-orange-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-500">{highConf.length}</div>
          <div className="text-xs text-gray-500 mt-1">High Confidence Matches</div>
          <div className="text-xs text-gray-400">(85%+ similarity)</div>
        </div>
        <div className="bg-white border border-yellow-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{possible.length}</div>
          <div className="text-xs text-gray-500 mt-1">Possible Matches</div>
          <div className="text-xs text-gray-400">(60-84% similarity)</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div>
          {loading ? <div className="text-gray-400 text-sm p-4">Loading...</div> :
           results.length === 0 ? (
             <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
               <div className="text-gray-400 text-sm">No matches found. Click "RUN BENEFICIARY MATCHING" to run the analysis.</div>
             </div>
           ) : (
            <div className="space-y-3">
              {results.map(r => {
                const isConflict = r.is_conflict;
                const borderColor = isConflict ? '#DC3545' : r.match_level === 'high' ? '#FD7E14' : '#FFC107';
                return (
                  <div key={r.anomaly_id}
                    onClick={() => setSelected(r === selected ? null : r)}
                    className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-sm"
                    style={{ borderLeftWidth: 4, borderLeftColor: borderColor }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold uppercase" style={{ color: borderColor }}>
                        {isConflict ? 'ENROLMENT CONFLICT' : `${r.match_level?.toUpperCase()} MATCH`}
                      </span>
                      <span className="text-sm font-bold" style={{ color: borderColor }}>
                        {r.confidence_score?.toFixed(0)}% confidence
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-gray-50 rounded p-2">
                        <div className="font-medium text-gray-700">{r.beneficiary_a?.name}</div>
                        <div className="text-gray-400 font-mono">{r.beneficiary_a?.token}</div>
                        <div className="text-gray-400">{r.beneficiary_a?.district}</div>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        <div className="font-medium text-gray-700">{r.beneficiary_b?.name}</div>
                        <div className="text-gray-400 font-mono">{r.beneficiary_b?.token}</div>
                        <div className="text-gray-400">{r.beneficiary_b?.district}</div>
                      </div>
                    </div>
                    {r.conflict_description && (
                      <div className="mt-2 text-xs text-red-600 bg-red-50 rounded p-1.5">{r.conflict_description}</div>
                    )}
                  </div>
                );
              })}
            </div>
           )}
        </div>

        {selected && (
          <div className="bg-white border border-gray-200 rounded-lg p-5 sticky top-6 self-start">
            <div className="flex justify-between mb-4">
              <h2 className="font-semibold text-navy">Match Detail</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 text-lg">×</button>
            </div>
            <div className="mb-3">
              <RiskBadge level={selected.severity} />
              <span className="ml-2 text-sm font-bold">{selected.confidence_score?.toFixed(1)}% similarity</span>
            </div>
            {selected.conflict_description && (
              <div className="bg-red-50 border border-red-100 rounded p-3 mb-3 text-xs text-red-700">
                <strong>Conflict:</strong> {selected.conflict_description}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
              {[selected.beneficiary_a, selected.beneficiary_b].map((b, i) => b && (
                <div key={i} className="border border-gray-100 rounded p-3 bg-gray-50">
                  <div className="font-semibold text-gray-700 mb-1">Beneficiary {i === 0 ? 'A' : 'B'}</div>
                  <div><span className="text-gray-400">Name: </span>{b.name}</div>
                  <div><span className="text-gray-400">Token: </span><span className="font-mono">{b.token}</span></div>
                  <div><span className="text-gray-400">Age: </span>{b.age}</div>
                  <div><span className="text-gray-400">District: </span>{b.district}</div>
                  <div><span className="text-gray-400">Mobile: </span><span className="font-mono">{b.mobile_token}</span></div>
                  <div><span className="text-gray-400">Bank: </span><span className="font-mono">{b.bank_account_token}</span></div>
                </div>
              ))}
            </div>
            {selected.reasons?.length > 0 && (
              <div className="mb-3">
                <div className="text-xs font-semibold text-gray-500 mb-1">Match Reasons</div>
                {selected.reasons.map((r, i) => <div key={i} className="text-xs text-gray-600 py-0.5">• {r}</div>)}
              </div>
            )}
            <div className="text-xs text-gray-400">{formatDateTime(selected.detected_at)}</div>
            <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded text-xs text-amber-700">
              <strong>Action Required:</strong> Verify beneficiary identity documents at both enrolment centres before any action.
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
