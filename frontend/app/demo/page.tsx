'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { api } from '@/lib/api';

const ENGINES = [
  { key: 'attendance', label: 'Attendance Analysis', description: 'Detect perfect attendance, identical check-in times, geo mismatches, impossible travel, trainer conflicts', fn: () => api.runAttendanceAnalysis() },
  { key: 'evidence', label: 'Evidence Verification', description: 'Find duplicate images via perceptual hash, detect geo-mismatched evidence uploads', fn: () => api.runEvidenceAnalysis() },
  { key: 'placement', label: 'Placement Analysis', description: 'Detect placements before completion, without certification, employer concentration', fn: () => api.runPlacementAnalysis() },
  { key: 'payment', label: 'Payment Analysis', description: 'Detect low-attendance stipends, payments to unenrolled beneficiaries, duplicate references', fn: () => api.runPaymentAnalysis() },
  { key: 'matching', label: 'Beneficiary Matching', description: 'Cross-match beneficiary records by name similarity, mobile and bank account tokens', fn: () => api.runMatchingAnalysis() },
];

const DEMO_INJECTIONS = [
  { key: 'attendance-anomaly', label: 'Perfect Attendance', desc: 'Inject 100% attendance with identical 09:00 check-in for all beneficiaries in a batch' },
  { key: 'duplicate-beneficiary', label: 'Duplicate Enrolment', desc: 'Add a beneficiary enrolled in two overlapping active batches simultaneously' },
  { key: 'location-conflict', label: 'GPS Location Conflict', desc: 'Mark attendance 160km from the training centre' },
  { key: 'duplicate-image', label: 'Duplicate Evidence Photos', desc: 'Upload 3 monitoring photos with identical perceptual hash' },
  { key: 'placement-anomaly', label: 'Pre-completion Placement', desc: 'Inject placements dated before batch end date' },
  { key: 'payment-anomaly', label: 'Low-Attendance Stipend', desc: 'Pay stipend to a beneficiary with <50% attendance' },
  { key: 'high-risk-centre', label: 'Centre 07 Profile', desc: 'Re-inject the full Centre 07 critical risk profile (score 89/100)' },
];

export default function DemoPage() {
  const [engineStatus, setEngineStatus] = useState<Record<string, { running: boolean; result: any; error: string }>>({});
  const [injectStatus, setInjectStatus] = useState<Record<string, string>>({});
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState('');
  const [runningAll, setRunningAll] = useState(false);
  const [allResult, setAllResult] = useState<any>(null);

  async function runEngine(key: string, fn: () => Promise<any>) {
    setEngineStatus(prev => ({ ...prev, [key]: { running: true, result: null, error: '' } }));
    try {
      const result = await fn();
      setEngineStatus(prev => ({ ...prev, [key]: { running: false, result, error: '' } }));
    } catch (e: any) {
      setEngineStatus(prev => ({ ...prev, [key]: { running: false, result: null, error: e.message } }));
    }
  }

  async function runAll() {
    setRunningAll(true); setAllResult(null);
    try {
      const r = await api.runAllChecks();
      setAllResult(r);
    } catch { setAllResult({ error: 'Failed' }); }
    finally { setRunningAll(false); }
  }

  async function injectAnomaly(key: string) {
    setInjectStatus(prev => ({ ...prev, [key]: 'running' }));
    try {
      const r = await api.injectAnomaly(key);
      setInjectStatus(prev => ({ ...prev, [key]: r.message || 'Done' }));
    } catch (e: any) {
      setInjectStatus(prev => ({ ...prev, [key]: 'Error: ' + e.message }));
    }
  }

  async function resetDB() {
    if (!confirm('This will delete all data and re-seed from scratch. Continue?')) return;
    setResetting(true); setResetMsg('');
    try {
      await api.resetDatabase();
      setResetMsg('Database reset and re-seeded successfully. Refresh the page to see new data.');
    } catch { setResetMsg('Reset failed.'); }
    finally { setResetting(false); }
  }

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-navy">Demo Data Simulator</h1>
          <p className="text-sm text-gray-500">Run analysis engines and inject test anomalies for live demonstration</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 text-xs text-amber-800">
        <strong>Demo Mode Only.</strong> All data is synthetic. Use these controls to demonstrate CIVIS Lite capabilities.
      </div>

      {/* Run All */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Run All Analysis Engines</h2>
        <div className="flex gap-3 items-center flex-wrap">
          <button onClick={runAll} disabled={runningAll}
            className="px-6 py-2.5 text-sm font-bold text-white rounded disabled:opacity-50"
            style={{ backgroundColor: '#DC3545' }}>
            {runningAll ? 'Running All Engines...' : 'RUN ALL CHECKS NOW'}
          </button>
          <span className="text-xs text-gray-400">Runs attendance, evidence, placement, payment, matching, and risk recalculation in sequence</span>
        </div>
        {allResult && (
          <div className="mt-3 bg-gray-50 rounded p-3 text-xs">
            <div className="font-semibold text-gray-600 mb-2">Results:</div>
            {allResult.error ? <span className="text-red-600">{allResult.error}</span> : (
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(allResult.results || {}).map(([k, v]) => (
                  <div key={k} className="bg-white border border-gray-100 rounded p-2">
                    <div className="font-medium text-gray-700 capitalize">{k}</div>
                    <pre className="text-gray-500 text-xs mt-1 whitespace-pre-wrap">{JSON.stringify(v, null, 1)}</pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Individual engines */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">Individual Analysis Engines</h2>
        <div className="space-y-3">
          {ENGINES.map(engine => {
            const status = engineStatus[engine.key];
            return (
              <div key={engine.key} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <button onClick={() => runEngine(engine.key, engine.fn)}
                  disabled={status?.running}
                  className="shrink-0 px-4 py-2 text-xs font-semibold text-white rounded disabled:opacity-50 whitespace-nowrap"
                  style={{ backgroundColor: '#1D6FA4' }}>
                  {status?.running ? 'Running...' : `RUN ${engine.label.toUpperCase()}`}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-navy">{engine.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{engine.description}</div>
                  {status?.result && (
                    <div className="mt-1 text-xs text-green-700">
                      Done: {JSON.stringify(status.result.anomalies_detected || status.result)}
                    </div>
                  )}
                  {status?.error && <div className="mt-1 text-xs text-red-600">{status.error}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Demo anomaly injections */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">Inject Demo Anomalies</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {DEMO_INJECTIONS.map(inj => (
            <div key={inj.key} className="border border-gray-100 rounded-lg p-3 flex gap-3 items-start">
              <button onClick={() => injectAnomaly(inj.key)}
                disabled={injectStatus[inj.key] === 'running'}
                className="shrink-0 px-3 py-1.5 text-xs font-semibold text-white rounded disabled:opacity-50"
                style={{ backgroundColor: '#6C757D' }}>
                INJECT
              </button>
              <div>
                <div className="text-sm font-medium text-navy">{inj.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{inj.desc}</div>
                {injectStatus[inj.key] && injectStatus[inj.key] !== 'running' && (
                  <div className={`mt-1 text-xs ${injectStatus[inj.key].startsWith('Error') ? 'text-red-600' : 'text-green-700'}`}>
                    {injectStatus[inj.key]}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reset */}
      <div className="bg-white border border-red-200 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-red-600 uppercase tracking-wide mb-3">Reset Database</h2>
        <p className="text-sm text-gray-500 mb-3">Wipe all data and re-seed with the baseline dataset (20 centres, 400+ beneficiaries, Centre 07 anomaly profile).</p>
        {resetMsg && <div className="text-xs text-green-700 bg-green-50 border border-green-100 rounded p-2 mb-3">{resetMsg}</div>}
        <button onClick={resetDB} disabled={resetting}
          className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50">
          {resetting ? 'Resetting...' : 'RESET & RE-SEED DATABASE'}
        </button>
      </div>
    </AppLayout>
  );
}
