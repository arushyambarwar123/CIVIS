import React from 'react';

interface Props {
  rows?: number;
  label?: string;
  variant?: 'table' | 'cards' | 'default';
}

export default function LoadingSpinner({ rows = 5, label, variant = 'default' }: Props) {
  if (variant === 'cards') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, padding: '8px 0' }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="skeleton"
            style={{
              height: 96,
              borderRadius: 'var(--radius-lg, 16px)',
              border: '1px solid var(--c-border, #E2E8F0)',
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div style={{ padding: '16px 0', width: '100%' }}>
      {label && (
        <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--c-text2, #5A6A85)', marginBottom: 12 }}>
          {label}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="skeleton"
            style={{
              height: 38,
              borderRadius: 'var(--radius-sm, 8px)',
              opacity: 1 - i * 0.08,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function SkeletonMetric() {
  return (
    <div
      className="skeleton"
      style={{
        height: 98,
        borderRadius: 'var(--radius-lg, 16px)',
        border: '1px solid var(--c-border, #E2E8F0)',
      }}
    />
  );
}

export function InlineSpinner({ size = 14, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        border: `2px solid rgba(255,255,255,0.3)`,
        borderTopColor: color,
        borderRadius: '50%',
        animation: 'spin 0.6s linear infinite',
      }}
    />
  );
}
