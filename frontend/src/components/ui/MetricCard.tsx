import React from 'react';

interface Props {
  label: string;
  value: string | number;
  sub?: string;
  accent?: 'default' | 'warning' | 'critical' | 'positive' | 'info';
  icon?: React.ReactNode;
}

const ACCENT_MAP = {
  default:  { color: '#1B2559', iconBg: '#F4F7FE', iconColor: '#4361EE' },
  warning:  { color: '#FFB547', iconBg: '#FFF8EC', iconColor: '#FFB547' },
  critical: { color: '#EE5D50', iconBg: '#FFF0EF', iconColor: '#EE5D50' },
  positive: { color: '#01B574', iconBg: '#E6FBF3', iconColor: '#01B574' },
  info:     { color: '#4361EE', iconBg: '#EEF2FF', iconColor: '#4361EE' },
};

export default function MetricCard({ label, value, sub, accent = 'default', icon }: Props) {
  const a = ACCENT_MAP[accent] || ACCENT_MAP.default;

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid var(--c-border, #E9EDF7)',
      borderRadius: 'var(--radius-lg, 16px)',
      boxShadow: '0 3.5px 5.5px rgba(0,0,0,0.02)',
      padding: '20px 22px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 12,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'var(--c-text3, #A3AED0)',
          marginBottom: 6,
        }}>
          {label}
        </div>
        <div style={{
          fontSize: 28,
          fontWeight: 700,
          color: a.color === '#1B2559' ? 'var(--c-text, #2B3674)' : a.color,
          fontVariantNumeric: 'tabular-nums',
          lineHeight: '1.2',
          letterSpacing: '-0.02em',
        }}>
          {value}
        </div>
        {sub && (
          <div style={{
            fontSize: 12,
            fontWeight: 500,
            color: 'var(--c-text2, #8F9BBA)',
            marginTop: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            {sub}
          </div>
        )}
      </div>

      {icon ? (
        <div style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: a.iconBg,
          color: a.iconColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          {icon}
        </div>
      ) : (
        <div style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: a.iconBg,
          color: a.iconColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
        </div>
      )}
    </div>
  );
}
