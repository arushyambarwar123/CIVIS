'use client';

import React, { useState } from 'react';

export default function RuleEditor({ label, description, value, type, onSave }: any) {
  const [val, setVal] = useState(value);
  const [enabled, setEnabled] = useState(true);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 20px',
      borderBottom: '1px solid var(--c-border, #E9EDF7)',
      background: '#FFFFFF',
      flexWrap: 'wrap',
      gap: 16,
    }}>
      <div style={{ flex: 1, minWidth: 240 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-text, #2B3674)', margin: 0 }}>{label}</p>
        <p style={{ fontSize: 13, color: 'var(--c-text2, #8F9BBA)', margin: '4px 0 0' }}>{description}</p>
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <input
          type={type === 'number' ? 'number' : 'text'}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className="input"
          style={{ width: 140, padding: '8px 12px' }}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--c-text2, #8F9BBA)', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            style={{ width: 16, height: 16, accentColor: 'var(--c-accent, #4361EE)' }}
          />
          Enabled
        </label>
        <button
          type="button"
          onClick={() => onSave({ value: val, enabled })}
          className="btn btn-teal btn-sm"
        >
          Save
        </button>
      </div>
    </div>
  );
}
