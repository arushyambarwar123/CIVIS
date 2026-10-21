'use client';

import React from 'react';

export default function EngineControls({ engines, onResult }: any) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: 16,
      marginBottom: 24,
    }}>
      {engines.map((e: any, i: number) => (
        <button
          key={i}
          type="button"
          onClick={() => onResult(e.label, 'Result')}
          style={{
            background: '#FFFFFF',
            border: '1px solid var(--c-border, #E9EDF7)',
            borderRadius: 'var(--radius-lg, 16px)',
            boxShadow: '0 3.5px 5.5px rgba(0,0,0,0.02)',
            padding: '20px',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            fontFamily: 'inherit',
          }}
          onMouseEnter={(el) => {
            el.currentTarget.style.transform = 'translateY(-2px)';
            el.currentTarget.style.borderColor = 'var(--c-accent, #4361EE)';
            el.currentTarget.style.boxShadow = '0 6px 14px rgba(67, 97, 238, 0.08)';
          }}
          onMouseLeave={(el) => {
            el.currentTarget.style.transform = 'translateY(0)';
            el.currentTarget.style.borderColor = 'var(--c-border, #E9EDF7)';
            el.currentTarget.style.boxShadow = '0 3.5px 5.5px rgba(0,0,0,0.02)';
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-navy, #1B2559)' }}>{e.label}</div>
          <div style={{ fontSize: 12, color: 'var(--c-text2, #8F9BBA)', marginTop: 4 }}>{e.description}</div>
        </button>
      ))}
    </div>
  );
}
