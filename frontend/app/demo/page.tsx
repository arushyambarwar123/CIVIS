'use client';

import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { api } from '@/lib/api';

const ENGINES = [
  {
    key: 'attendance',
    label: 'Attendance Analysis Engine',
    description: 'Detect perfect attendance, identical check-in times, GPS geo mismatches, impossible travel, and trainer schedule conflicts.',
    fn: () => api.runAttendanceAnalysis(),
  },
  {
    key: 'evidence',
    label: 'Evidence Verification Engine',
    description: 'Calculate perceptual image hashes, detect duplicate monitoring photos, and flag telemetry geo mismatches.',
    fn: () => api.runEvidenceAnalysis(),
  },
  {
    key: 'placement',
    label: 'Placement Analysis Engine',
    description: 'Verify placement dates against batch completion, check mandatory certifications, and spot employer concentration anomalies.',
    fn: () => api.runPlacementAnalysis(),
  },
  {
    key: 'payment',
    label: 'Payment & Stipend Analysis',
    description: 'Identify low-attendance stipend payouts, payments to unenrolled beneficiaries, and duplicate payment reference numbers.',
    fn: () => api.runPaymentAnalysis(),
  },
  {
    key: 'matching',
    label: 'Beneficiary Identity Matching',
    description: 'Execute fuzzy name similarity, mobile surrogate token matching, and bank account token collision detection.',
    fn: () => api.runMatchingAnalysis(),
  },
];

const DEMO_INJECTIONS = [
  { key: 'attendance-anomaly', label: 'Perfect Attendance Pattern', desc: 'Inject 100% attendance with identical 09:00 check-in for all beneficiaries in a batch.' },
  { key: 'duplicate-beneficiary', label: 'Concurrent Enrolment', desc: 'Enroll an existing beneficiary in two overlapping active batches simultaneously.' },
  { key: 'location-conflict', label: 'GPS Location Conflict', desc: 'Simulate mobile check-in 160km away from registered training centre coordinates.' },
  { key: 'duplicate-image', label: 'Duplicate Evidence Photos', desc: 'Upload 3 monitoring photos with identical perceptual hashes across batches.' },
  { key: 'placement-anomaly', label: 'Pre-completion Placement', desc: 'Inject employment placements dated prior to batch course completion date.' },
  { key: 'payment-anomaly', label: 'Low-Attendance Stipend', desc: 'Process stipend payment to a beneficiary with under 50% course attendance.' },
  { key: 'high-risk-centre', label: 'Centre 07 Risk Profile', desc: 'Re-inject the multi-factor critical risk anomaly signature for Training Centre 07.' },
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
    setRunningAll(true);
    setAllResult(null);
    try {
      const r = await api.runAllChecks();
      setAllResult(r);
    } catch (e: any) {
      setAllResult({ error: e?.message || 'Pipeline run failed' });
    } finally {
      setRunningAll(false);
    }
  }

  async function injectAnomaly(key: string) {
    setInjectStatus(prev => ({ ...prev, [key]: 'running' }));
    try {
      const r = await api.injectAnomaly(key);
      setInjectStatus(prev => ({ ...prev, [key]: r.message || 'Anomaly injected successfully.' }));
    } catch (e: any) {
      setInjectStatus(prev => ({ ...prev, [key]: 'Error: ' + e.message }));
    }
  }

  async function resetDB() {
    if (!confirm('This action will delete all transactional data and re-seed the system with baseline demonstration data. Continue?')) {
      return;
    }
    setResetting(true);
    setResetMsg('');
    try {
      await api.resetDatabase();
      setResetMsg('Database reset and baseline seeds reloaded successfully. Navigate to Dashboard or Centres to verify.');
    } catch {
      setResetMsg('Database reset failed.');
    } finally {
      setResetting(false);
    }
  }

  return (
    <AppLayout>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <h1 className="page-title">Demo Simulator & Test Harness</h1>
          <span className="demo-banner">SIMULATED ENVIRONMENT</span>
        </div>
        <p className="page-subtitle">Trigger automated audit engines and inject synthetic fraud patterns for live demonstration</p>
      </div>

      {/* Warning Notice at Top */}
      <div style={{
        background: '#FDF3E3',
        border: '1px solid #E8D5A3',
        borderRadius: 4,
        padding: '12px 16px',
        fontSize: 13,
        color: '#B77928',
        marginBottom: 24,
        lineHeight: '20px',
      }}>
        <strong>Demonstration Notice:</strong> All training centre entities, batch telemetry, and beneficiary identity data in this system are synthetic test vectors. The engines execute real heuristic rules and probabilistic algorithms against this simulated dataset.
      </div>

      {/* Global Run All Pipeline */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div>
            <span className="section-label">Master Pipeline</span>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-navy)', marginTop: 2 }}>
              Run Complete Audit & Risk Recalculation
            </div>
          </div>
          <button
            onClick={runAll}
            disabled={runningAll}
            className="btn btn-primary"
          >
            {runningAll ? 'Executing Full Pipeline...' : 'Run All Checks Now'}
          </button>
        </div>
        <div className="card-body">
          <p style={{ fontSize: 12, color: 'var(--c-text2)', margin: '0 0 12px' }}>
            Sequentially executes attendance integrity checks, perceptual image comparison, placement timeline validation, stipend eligibility rules, cross-batch identity matching, and recalibrates all composite risk scores.
          </p>

          {allResult && (
            <div>
              <div className="label" style={{ marginBottom: 6 }}>Pipeline Execution Log:</div>
              <pre style={{
                background: '#EFF2F1',
                border: '1px solid var(--c-border)',
                borderRadius: 4,
                padding: '12px 14px',
                fontFamily: 'IBM Plex Mono, monospace',
                fontSize: 12,
                color: allResult.error ? '#B54747' : 'var(--c-text)',
                overflowX: 'auto',
                maxHeight: 280,
                margin: 0,
              }}>
                {JSON.stringify(allResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Individual Analysis Engines */}
      <div style={{ marginBottom: 24 }}>
        <div className="section-label" style={{ marginBottom: 12 }}>Specialized Analysis Engines</div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 16,
        }}>
          {ENGINES.map(engine => {
            const status = engineStatus[engine.key];
            return (
              <div key={engine.key} className="card">
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ fontWeight: 600, color: 'var(--c-navy)', fontSize: 14, marginBottom: 4 }}>
                    {engine.label}
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--c-text2)', lineHeight: '18px', flex: 1, margin: '0 0 16px' }}>
                    {engine.description}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                    <button
                      onClick={() => runEngine(engine.key, engine.fn)}
                      disabled={status?.running}
                      className="btn btn-primary btn-sm"
                    >
                      {status?.running ? 'Running...' : 'Execute Engine'}
                    </button>
                    {status?.result && (
                      <span className="mono" style={{ fontSize: 11, color: '#31785B' }}>
                        ✓ Complete
                      </span>
                    )}
                  </div>

                  {status?.result && (
                    <div style={{ marginTop: 12 }}>
                      <pre style={{
                        background: '#EFF2F1',
                        border: '1px solid var(--c-border)',
                        borderRadius: 4,
                        padding: '8px 10px',
                        fontFamily: 'IBM Plex Mono, monospace',
                        fontSize: 11,
                        color: 'var(--c-text)',
                        margin: 0,
                        overflowX: 'auto',
                        maxHeight: 120,
                      }}>
                        {JSON.stringify(status.result.anomalies_detected || status.result, null, 2)}
                      </pre>
                    </div>
                  )}

                  {status?.error && (
                    <div style={{
                      marginTop: 10,
                      padding: '6px 10px',
                      borderRadius: 4,
                      background: '#FDEAEA',
                      color: '#B54747',
                      fontSize: 11,
                    }}>
                      {status.error}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Demo Anomaly Injections */}
      <div style={{ marginBottom: 24 }}>
        <div className="section-label" style={{ marginBottom: 12 }}>Synthetic Anomaly Injectors</div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 12,
        }}>
          {DEMO_INJECTIONS.map(inj => {
            const status = injectStatus[inj.key];
            const isError = status && status.startsWith('Error');
            const isDone = status && !isError && status !== 'running';

            return (
              <div key={inj.key} className="card">
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 6 }}>
                    <div style={{ fontWeight: 600, color: 'var(--c-navy)', fontSize: 13 }}>
                      {inj.label}
                    </div>
                    <button
                      onClick={() => injectAnomaly(inj.key)}
                      disabled={status === 'running'}
                      className="btn btn-ghost btn-sm"
                    >
                      {status === 'running' ? 'Injecting...' : 'Inject'}
                    </button>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--c-text2)', margin: '0 0 8px', lineHeight: '17px' }}>
                    {inj.desc}
                  </p>
                  {isDone && (
                    <div style={{ fontSize: 11, color: '#31785B', fontWeight: 500 }}>
                      ✓ {status}
                    </div>
                  )}
                  {isError && (
                    <div style={{ fontSize: 11, color: '#B54747' }}>
                      {status}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reset Database Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <span className="section-label" style={{ color: '#B54747' }}>Database Reset</span>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#B54747', marginTop: 2 }}>
              Restore Clean Baseline Dataset
            </div>
          </div>
        </div>
        <div className="card-body">
          <p style={{ fontSize: 12, color: 'var(--c-text2)', margin: '0 0 16px', lineHeight: '18px' }}>
            Wipes all transactional state, generated inspections, and injected anomalies. Re-seeds the baseline 20 centres, batches, and the benchmark Training Centre 07 anomaly dataset.
          </p>

          {resetMsg && (
            <div style={{
              marginBottom: 16,
              padding: '10px 14px',
              borderRadius: 4,
              backgroundColor: resetMsg.includes('failed') ? '#FDEAEA' : '#EAF4EF',
              color: resetMsg.includes('failed') ? '#B54747' : '#31785B',
              border: `1px solid ${resetMsg.includes('failed') ? '#DCE2E3' : '#B5DCC8'}`,
              fontSize: 12,
            }}>
              {resetMsg}
            </div>
          )}

          <button
            onClick={resetDB}
            disabled={resetting}
            className="btn btn-danger"
          >
            {resetting ? 'Resetting Database...' : 'Reset & Re-Seed Database'}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
