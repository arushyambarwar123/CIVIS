'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { api } from '@/lib/api';

const RULE_SETS = [
  { key: 'risk_rules', label: 'Risk Scoring Rules', description: 'Anomaly weights and severity multipliers for risk score calculation' },
  { key: 'attendance_rules', label: 'Attendance Rules', description: 'Thresholds for attendance anomaly detection' },
  { key: 'evidence_rules', label: 'Evidence Rules', description: 'Hash similarity threshold and geo radius for evidence verification' },
  { key: 'matching_rules', label: 'Matching Rules', description: 'Confidence thresholds for beneficiary matching' },
  { key: 'inspection_rules', label: 'Inspection Rules', description: 'Scoring weights for inspection priority calculation' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('risk_rules');
  const [configs, setConfigs] = useState<Record<string, any>>({});
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    api.getAllConfigs().then(data => {
      setConfigs(data);
      // Initialize edit values with formatted JSON
      const edits: Record<string, string> = {};
      Object.entries(data).forEach(([k, v]) => { edits[k] = JSON.stringify(v, null, 2); });
      setEditValues(edits);
    });
  }, []);

  async function save(key: string) {
    setSaving(true); setSaveMsg('');
    try {
      const parsed = JSON.parse(editValues[key]);
      await api.updateConfig(key, parsed);
      setConfigs(prev => ({ ...prev, [key]: parsed }));
      setSaveMsg(`${key} saved successfully.`);
    } catch (e: any) {
      setSaveMsg(`Error: ${e.message}`);
    } finally { setSaving(false); }
  }

  function reset(key: string) {
    setEditValues(prev => ({ ...prev, [key]: JSON.stringify(configs[key], null, 2) }));
    setSaveMsg('');
  }

  const activeRuleSet = RULE_SETS.find(r => r.key === activeTab);

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">Rules & Configuration</h1>
        <p className="text-sm text-gray-500">Edit scoring weights, detection thresholds, and rule parameters</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-5 text-xs text-amber-800">
        <strong>Note:</strong> Changes to rule weights affect all future analysis runs. Risk scores will need to be recalculated after changes.
      </div>

      <div className="flex gap-5">
        {/* Sidebar */}
        <div className="w-56 shrink-0 space-y-1">
          {RULE_SETS.map(rs => (
            <button key={rs.key} onClick={() => { setActiveTab(rs.key); setSaveMsg(''); }}
              className="w-full text-left px-4 py-3 rounded-lg text-sm transition-colors"
              style={{
                backgroundColor: activeTab === rs.key ? '#EFF6FF' : 'white',
                color: activeTab === rs.key ? '#1D6FA4' : '#374151',
                border: `1px solid ${activeTab === rs.key ? '#BFDBFE' : '#E5E7EB'}`,
                fontWeight: activeTab === rs.key ? 600 : 400,
              }}>
              {rs.label}
            </button>
          ))}
        </div>

        {/* Editor */}
        <div className="flex-1 bg-white border border-gray-200 rounded-lg p-5">
          {activeRuleSet && (
            <>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="font-semibold text-navy">{activeRuleSet.label}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{activeRuleSet.description}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => reset(activeTab)}
                    className="px-3 py-1.5 text-xs border border-gray-200 rounded text-gray-600 hover:bg-gray-50">
                    Reset
                  </button>
                  <button onClick={() => save(activeTab)} disabled={saving}
                    className="px-4 py-1.5 text-xs font-semibold text-white rounded disabled:opacity-50"
                    style={{ backgroundColor: '#1D6FA4' }}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>

              {saveMsg && (
                <div className={`mb-3 p-2 rounded text-xs ${saveMsg.startsWith('Error') ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                  {saveMsg}
                </div>
              )}

              <textarea
                value={editValues[activeTab] || ''}
                onChange={e => setEditValues(prev => ({ ...prev, [activeTab]: e.target.value }))}
                rows={24}
                className="w-full font-mono text-xs border border-gray-200 rounded px-3 py-3 bg-gray-50 focus:outline-none focus:border-blue-300"
                spellCheck={false}
              />
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
