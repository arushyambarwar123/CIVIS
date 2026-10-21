'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { api } from '@/lib/api';

const RULE_SETS = [
  { key: 'risk_rules', label: 'Risk Scoring Rules', description: 'Anomaly weights and severity multipliers for composite risk score calculations' },
  { key: 'attendance_rules', label: 'Attendance Rules', description: 'Thresholds and patterns for biometric and GPS attendance anomaly detection' },
  { key: 'evidence_rules', label: 'Evidence Rules', description: 'Perceptual hash hamming distance threshold and geo radius validation for evidence media' },
  { key: 'matching_rules', label: 'Matching Rules', description: 'Confidence scoring weights for demographic and financial surrogate token matching' },
  { key: 'inspection_rules', label: 'Inspection Rules', description: 'Scoring formula weights for physical inspection priority queue generation' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('risk_rules');
  const [configs, setConfigs] = useState<Record<string, any>>({});
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    api.getAllConfigs()
      .then(data => {
        setConfigs(data);
        const edits: Record<string, string> = {};
        Object.entries(data).forEach(([k, v]) => {
          edits[k] = JSON.stringify(v, null, 2);
        });
        setEditValues(edits);
      })
      .finally(() => setLoading(false));
  }, []);

  async function save(key: string) {
    setSaving(true);
    setSaveMsg('');
    try {
      const parsed = JSON.parse(editValues[key]);
      await api.updateConfig(key, parsed);
      setConfigs(prev => ({ ...prev, [key]: parsed }));
      setSaveMsg(`${key} saved successfully.`);
    } catch (e: any) {
      setSaveMsg(`Error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  }

  function reset(key: string) {
    setEditValues(prev => ({ ...prev, [key]: JSON.stringify(configs[key], null, 2) }));
    setSaveMsg('');
  }

  const activeRuleSet = RULE_SETS.find(r => r.key === activeTab);

  return (
    <AppLayout>
      <div style={{ marginBottom: 20 }}>
        <h1 className="page-title">Rules & Engine Configuration</h1>
        <p className="page-subtitle">Configure heuristic weights, detection parameters, and scoring formulas</p>
      </div>

      {/* Advisory Banner */}
      <div style={{
        background: '#FDF3E3',
        border: '1px solid #E8D5A3',
        borderRadius: 4,
        padding: '10px 14px',
        fontSize: 12,
        color: '#B77928',
        marginBottom: 20,
      }}>
        <strong>Configuration Notice:</strong> Parameter changes directly govern automated detection algorithms. Existing risk scores will need to be recomputed from the Risk Analysis page following weight modifications.
      </div>

      {/* Horizontal Tab Bar with border-bottom style */}
      <div style={{
        display: 'flex',
        gap: 24,
        borderBottom: '1px solid var(--c-border, #E2E8F0)',
        marginBottom: 24,
        overflowX: 'auto',
      }}>
        {RULE_SETS.map(rs => {
          const active = activeTab === rs.key;
          return (
            <button
              key={rs.key}
              onClick={() => { setActiveTab(rs.key); setSaveMsg(''); }}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: active ? '2px solid var(--c-accent, #4361EE)' : '2px solid transparent',
                color: active ? 'var(--c-accent, #4361EE)' : 'var(--c-text2, #5A6A85)',
                fontWeight: active ? 600 : 500,
                fontSize: 13.5,
                padding: '10px 6px',
                cursor: 'pointer',
                marginBottom: -1,
                whiteSpace: 'nowrap',
                transition: 'all 0.12s ease',
              }}
            >
              {rs.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <LoadingSpinner rows={10} label="Loading rule configurations..." />
      ) : (
        <div className="card">
          {activeRuleSet && (
            <>
              <div className="card-header">
                <div>
                  <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--c-navy)', margin: 0 }}>
                    {activeRuleSet.label}
                  </h2>
                  <p style={{ fontSize: 12, color: 'var(--c-text2)', margin: '4px 0 0' }}>
                    {activeRuleSet.description}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    onClick={() => reset(activeTab)}
                    className="btn btn-ghost btn-sm"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => save(activeTab)}
                    disabled={saving}
                    className="btn btn-teal btn-sm"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>

              <div className="card-body">
                {saveMsg && (
                  <div style={{
                    marginBottom: 16,
                    padding: '8px 12px',
                    borderRadius: 4,
                    fontSize: 12,
                    backgroundColor: saveMsg.startsWith('Error') ? '#FDEAEA' : '#EAF4EF',
                    color: saveMsg.startsWith('Error') ? '#B54747' : '#31785B',
                    border: `1px solid ${saveMsg.startsWith('Error') ? '#DCE2E3' : '#B5DCC8'}`,
                  }}>
                    {saveMsg}
                  </div>
                )}

                <div>
                  <label className="label" style={{ marginBottom: 6 }}>
                    Rule Definition JSON ({activeTab}.json)
                  </label>
                  <textarea
                    value={editValues[activeTab] || ''}
                    onChange={e => setEditValues(prev => ({ ...prev, [activeTab]: e.target.value }))}
                    rows={22}
                    className="input"
                    style={{
                      fontFamily: 'IBM Plex Mono, monospace',
                      fontSize: 12,
                      lineHeight: '20px',
                      whiteSpace: 'pre',
                      backgroundColor: 'var(--c-surface2)',
                    }}
                    spellCheck={false}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </AppLayout>
  );
}
