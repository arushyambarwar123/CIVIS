'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { api } from '@/lib/api';

const ENGINES = [
  {
    key: 'attendance',
    label: 'Attendance Analysis Engine',
    description: 'Scans for 100% attendance streaks, identical check-in times, GPS geo-radius mismatches, impossible travel, and trainer conflicts.',
    fn: () => api.runAttendanceAnalysis(),
  },
  {
    key: 'evidence',
    label: 'Evidence Verification Engine',
    description: 'Calculates perceptual image hashes, detects duplicate monitoring photographs, and flags telemetry coordinate deviations.',
    fn: () => api.runEvidenceAnalysis(),
  },
  {
    key: 'placement',
    label: 'Placement Analysis Engine',
    description: 'Verifies placement dates against batch completion, checks mandatory certifications, and spots employer concentration anomalies.',
    fn: () => api.runPlacementAnalysis(),
  },
  {
    key: 'payment',
    label: 'Payment & Stipend Analysis',
    description: 'Identifies low-attendance stipend payouts, payments to unenrolled beneficiaries, and duplicate transaction reference numbers.',
    fn: () => api.runPaymentAnalysis(),
  },
  {
    key: 'matching',
    label: 'Beneficiary Identity Matching',
    description: 'Executes fuzzy name similarity, mobile surrogate token matching, and bank account token collision detection.',
    fn: () => api.runMatchingAnalysis(),
  },
];

const DEMO_INJECTIONS = [
  { key: 'attendance-anomaly', label: 'Perfect Attendance Pattern', desc: 'Injects 100% attendance with identical 09:00:00 check-in for 50 beneficiaries across 30 days.' },
  { key: 'duplicate-beneficiary', label: 'Concurrent Enrolment Conflict', desc: 'Enrolls an active beneficiary in two overlapping training batches simultaneously.' },
  { key: 'location-conflict', label: 'GPS Location Mismatch', desc: 'Simulates mobile attendance check-in 160km away from registered training centre coordinates.' },
  { key: 'duplicate-image', label: 'Duplicate Evidence Photos', desc: 'Uploads 3 monitoring photos with identical perceptual image hashes across distinct batches.' },
  { key: 'placement-anomaly', label: 'Pre-Completion Placement', desc: 'Injects employment placements claimed prior to batch course completion date.' },
  { key: 'payment-anomaly', label: 'Low-Attendance Stipend', desc: 'Processes stipend payment to a beneficiary with less than 50% course attendance.' },
  { key: 'high-risk-centre', label: 'Centre 07 Benchmark Signature', desc: 'Re-injects the multi-factor critical risk anomaly signature for Training Centre 07.' },
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
      setAllResult({ error: e?.message || 'Pipeline execution failed.' });
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
    if (!confirm('This action will delete all transactional records and re-seed baseline test data. Continue?')) {
      return;
    }
    setResetting(true);
    setResetMsg('');
    try {
      await api.resetDatabase();
      setResetMsg('Database reset and baseline seeds reloaded successfully.');
    } catch {
      setResetMsg('Database reset failed.');
    } finally {
      setResetting(false);
    }
  }

  return (
    <AppLayout>
      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title">Simulation &amp; Audit Test Harness</h1>
        <p className="page-subtitle">
          Trigger automated verification engines and inject synthetic fraud patterns for live system evaluation
        </p>
      </div>

      {/* Advisory Banner */}
      <div style={{
        background: 'var(--c-warning-bg, #FFF8EC)',
        border: '1px solid #FFE7BF',
        borderRadius: 'var(--radius-md, 12px)',
        padding: '14px 18px',
        fontSize: 13,
        color: '#A06800',
        marginBottom: 24,
        lineHeight: 1.5,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <div>
          <strong>Demonstration Environment:</strong> All training centre entities, batch telemetry, and beneficiary records in this platform are synthetic test vectors. The engines execute real heuristic algorithms against this simulated dataset.
        </div>
      </div>

      {/* 1. Master Pipeline Control Card */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header" style={{ padding: '20px 24px' }}>
          <div>
            <span className="section-label">Master Pipeline</span>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--c-text, #1E293B)', marginTop: 2 }}>
              Run Complete Audit &amp; Risk Recalculation
            </div>
          </div>
          <button
            type="button"
            onClick={runAll}
            disabled={runningAll}
            className="btn btn-primary"
            style={{ borderRadius: 'var(--radius-sm, 8px)' }}
          >
            {runningAll ? 'Executing Full Pipeline...' : 'Run All Verification Checks'}
          </button>
        </div>

        <div className="card-body" style={{ padding: '24px' }}>
          <p style={{ fontSize: 13, color: 'var(--c-text2, #5A6A85)', margin: '0 0 16px', lineHeight: 1.5 }}>
            Sequentially executes attendance integrity checks, perceptual image comparison, placement timeline validation, stipend eligibility rules, cross-batch identity matching, and recalibrates all composite risk scores.
          </p>

          {allResult && (
            <div>
              <div className="label" style={{ marginBottom: 6 }}>Pipeline Execution Log:</div>
              <pre style={{
                background: 'var(--c-surface2, #F0F3F9)',
                border: '1px solid var(--c-border, #E2E8F0)',
                borderRadius: 'var(--radius-sm, 8px)',
                padding: '14px 16px',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 12,
                color: allResult.error ? 'var(--c-danger, #EE5D50)' : 'var(--c-text, #1E293B)',
                overflowX: 'auto',
                maxHeight: 260,
                margin: 0,
              }}>
                {JSON.stringify(allResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* 2. Specialized Engines Control Panel Card */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header" style={{ padding: '20px 24px' }}>
          <div>
            <span className="section-label">Heuristic Modules</span>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--c-text, #1E293B)', marginTop: 2 }}>
              Specialized Analysis Engines ({ENGINES.length})
            </div>
          </div>
        </div>

        <div className="card-body" style={{ padding: '0 24px 20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {ENGINES.map((engine, idx) => {
              const status = engineStatus[engine.key];
              return (
                <div
                  key={engine.key}
                  style={{
                    padding: '18px 0',
                    borderBottom: idx < ENGINES.length - 1 ? '1px solid var(--c-border, #E2E8F0)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 16,
                  }}
                >
                  <div style={{ minWidth: 260, flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-text, #1E293B)' }}>
                      {engine.label}
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--c-text2, #5A6A85)', marginTop: 3, lineHeight: 1.45 }}>
                      {engine.description}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {status?.result && (
                      <span style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'var(--c-success, #01B574)',
                        background: 'var(--c-success-bg, #E6FBF3)',
                        padding: '3px 10px',
                        borderRadius: 'var(--radius-pill, 50px)',
                      }}>
                        ✓ Complete
                      </span>
                    )}
                    {status?.error && (
                      <span style={{ fontSize: 12, color: 'var(--c-danger, #EE5D50)' }}>
                        {status.error}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => runEngine(engine.key, engine.fn)}
                      disabled={status?.running}
                      className="btn btn-ghost btn-sm"
                      style={{ borderRadius: 'var(--radius-sm, 8px)', fontWeight: 600 }}
                    >
                      {status?.running ? 'Running...' : 'Execute Engine'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Synthetic Anomaly Injections Panel Card */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header" style={{ padding: '20px 24px' }}>
          <div>
            <span className="section-label">Fraud Test Vectors</span>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--c-text, #1E293B)', marginTop: 2 }}>
              Synthetic Anomaly Injectors ({DEMO_INJECTIONS.length})
            </div>
          </div>
        </div>

        <div className="card-body" style={{ padding: '0 24px 20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {DEMO_INJECTIONS.map((inj, idx) => {
              const status = injectStatus[inj.key];
              const isError = status && status.startsWith('Error');
              const isDone = status && !isError && status !== 'running';

              return (
                <div
                  key={inj.key}
                  style={{
                    padding: '16px 0',
                    borderBottom: idx < DEMO_INJECTIONS.length - 1 ? '1px solid var(--c-border, #E2E8F0)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 16,
                  }}
                >
                  <div style={{ minWidth: 260, flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--c-text, #1E293B)' }}>
                      {inj.label}
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--c-text2, #5A6A85)', marginTop: 2 }}>
                      {inj.desc}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {isDone && (
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-success, #01B574)' }}>
                        ✓ {status}
                      </span>
                    )}
                    {isError && (
                      <span style={{ fontSize: 12, color: 'var(--c-danger, #EE5D50)' }}>
                        {status}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => injectAnomaly(inj.key)}
                      disabled={status === 'running'}
                      className="btn btn-ghost btn-sm"
                      style={{ borderRadius: 'var(--radius-sm, 8px)', fontWeight: 600 }}
                    >
                      {status === 'running' ? 'Injecting...' : 'Inject Anomaly'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Database Reset Card */}
      <div className="card">
        <div className="card-header" style={{ padding: '20px 24px' }}>
          <div>
            <span className="section-label" style={{ color: 'var(--c-danger, #EE5D50)' }}>Maintenance &amp; State</span>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--c-danger, #EE5D50)', marginTop: 2 }}>
              Reset System to Baseline Demonstration Seeds
            </div>
          </div>
          <button
            type="button"
            onClick={resetDB}
            disabled={resetting}
            className="btn btn-danger btn-sm"
            style={{ borderRadius: 'var(--radius-sm, 8px)' }}
          >
            {resetting ? 'Resetting Database...' : 'Reset & Re-Seed Database'}
          </button>
        </div>

        <div className="card-body" style={{ padding: '20px 24px' }}>
          <p style={{ fontSize: 13, color: 'var(--c-text2, #5A6A85)', margin: 0, lineHeight: 1.5 }}>
            Wipes all transactional state, generated inspection assignments, and injected anomaly records. Re-seeds the baseline 20 training centres, batches, and the benchmark Training Centre 07 anomaly dataset.
          </p>

          {resetMsg && (
            <div style={{
              marginTop: 14,
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm, 8px)',
              backgroundColor: resetMsg.includes('failed') ? 'var(--c-danger-bg, #FFF0EF)' : 'var(--c-success-bg, #E6FBF3)',
              color: resetMsg.includes('failed') ? 'var(--c-danger, #EE5D50)' : 'var(--c-success, #01B574)',
              border: `1px solid ${resetMsg.includes('failed') ? '#FFD3CE' : '#B8F2DC'}`,
              fontSize: 12.5,
              fontWeight: 500,
            }}>
              {resetMsg}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
