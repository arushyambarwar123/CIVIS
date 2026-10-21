import React from 'react';

interface Props {
  title?: string;
  message: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  compact?: boolean;
}

export default function EmptyState({ title, message, icon, action, compact }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: compact ? '24px 16px' : '36px 20px',
        textAlign: 'center',
      }}
    >
      <div style={{
        width: compact ? 36 : 44,
        height: compact ? 36 : 44,
        borderRadius: '50%',
        background: 'var(--c-surface2, #F0F3F9)',
        color: 'var(--c-text3, #75839C)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        flexShrink: 0,
      }}>
        {icon ? icon : (
          <svg width={compact ? 18 : 20} height={compact ? 18 : 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
        )}
      </div>

      {title && (
        <div style={{
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--c-text, #1E293B)',
          marginBottom: 4,
        }}>
          {title}
        </div>
      )}

      <div style={{
        fontSize: 13,
        color: 'var(--c-text2, #5A6A85)',
        maxWidth: 360,
        lineHeight: 1.45,
        margin: 0,
      }}>
        {message}
      </div>

      {action && (
        <div style={{ marginTop: 14 }}>
          {action}
        </div>
      )}
    </div>
  );
}
