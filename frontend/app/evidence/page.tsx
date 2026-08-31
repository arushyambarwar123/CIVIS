'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { api } from '@/lib/api';
import { Evidence } from '@/types';
import { formatDateTime } from '@/lib/utils';

export default function EvidencePage() {
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [runMsg, setRunMsg] = useState('');
  const [filterFlagged, setFilterFlagged] = useState(false);

  async function load() {
    const data = await api.getEvidence();
    setEvidence(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function runAnalysis() {
    setRunning(true); setRunMsg('');
    try {
      const r = await api.runEvidenceAnalysis();
      setRunMsg(`Evidence analysis complete: ${r.anomalies_detected?.duplicate_images || 0} duplicates, ${r.anomalies_detected?.geo_mismatches || 0} geo mismatches.`);
      await load();
    } catch { setRunMsg('Analysis failed.'); }
    finally { setRunning(false); }
  }

  const displayed = filterFlagged ? evidence.filter(e => e.is_flagged) : evidence;
  const flaggedCount = evidence.filter(e => e.is_flagged).length;

  // Group by hash to show duplicates
  const hashGroups: Record<string, Evidence[]> = {};
  evidence.forEach(e => {
    if (e.image_hash) {
      if (!hashGroups[e.image_hash]) hashGroups[e.image_hash] = [];
      hashGroups[e.image_hash].push(e);
    }
  });
  const duplicateHashes = Object.entries(hashGroups).filter(([, evs]) => evs.length > 1);

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-navy">Evidence Verification</h1>
          <p className="text-sm text-gray-500">Detect reused monitoring photos via perceptual hash comparison</p>
        </div>
        <div className="flex gap-3 items-center">
          {runMsg && <span className="text-xs text-green-700 bg-green-50 border border-green-100 px-3 py-1.5 rounded">{runMsg}</span>}
          <button onClick={runAnalysis} disabled={running}
            className="px-4 py-2 text-sm font-semibold text-white rounded disabled:opacity-50"
            style={{ backgroundColor: '#1D6FA4' }}>
            {running ? 'Running...' : 'RUN EVIDENCE ANALYSIS'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-navy">{evidence.length}</div>
          <div className="text-xs text-gray-500 mt-1">Total Evidence Records</div>
        </div>
        <div className="bg-white border border-red-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-600">{flaggedCount}</div>
          <div className="text-xs text-gray-500 mt-1">Flagged (Duplicate Hash)</div>
        </div>
        <div className="bg-white border border-orange-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-orange-500">{duplicateHashes.length}</div>
          <div className="text-xs text-gray-500 mt-1">Unique Duplicate Hash Groups</div>
        </div>
      </div>

      {/* Duplicate hash groups */}
      {duplicateHashes.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-5 mb-5">
          <h2 className="text-sm font-semibold text-red-700 mb-3">Duplicate Image Hash Groups</h2>
          {duplicateHashes.map(([hash, evs]) => (
            <div key={hash} className="mb-3 bg-white border border-red-100 rounded p-3">
              <div className="text-xs font-mono text-red-700 mb-2">Hash: {hash} ({evs.length} images)</div>
              <div className="grid grid-cols-3 gap-2">
                {evs.map(e => (
                  <div key={e.id} className="bg-gray-50 rounded p-2 text-xs">
                    <div className="text-gray-500">Evidence #{e.id}</div>
                    <div className="text-gray-400">Batch #{e.batch_id}</div>
                    <div className="text-gray-400">{formatDateTime(e.uploaded_at)}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Evidence table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex gap-3 items-center">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={filterFlagged} onChange={e => setFilterFlagged(e.target.checked)} />
            Show flagged only ({flaggedCount})
          </label>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th>#</th>
              <th>Batch ID</th>
              <th>Type</th>
              <th>Image Hash</th>
              <th>Uploaded</th>
              <th>Source</th>
              <th>Flag</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-6 text-gray-400">Loading...</td></tr>
            ) : displayed.map(e => (
              <tr key={e.id} style={{ backgroundColor: e.is_flagged ? '#FFF5F5' : 'white' }}>
                <td className="text-gray-400 text-xs">{e.id}</td>
                <td className="font-mono text-xs text-blue-600">#{e.batch_id}</td>
                <td className="text-xs capitalize">{e.evidence_type}</td>
                <td className="font-mono text-xs text-gray-600">{e.image_hash || '—'}</td>
                <td className="text-xs text-gray-500">{formatDateTime(e.uploaded_at)}</td>
                <td className="text-xs capitalize">{e.source}</td>
                <td>
                  {e.is_flagged && (
                    <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded">DUPLICATE</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {displayed.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">No evidence records found.</div>
        )}
      </div>
    </AppLayout>
  );
}
