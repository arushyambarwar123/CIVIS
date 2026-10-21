import React from 'react';

export default function EmptyState({ message, icon }: { message: string; icon?: React.ReactNode }) {
  return (
    <div className="empty-state">
      {icon ? (
        <div style={{ marginBottom: 16, color: 'var(--c-text3, #A3AED0)' }}>{icon}</div>
      ) : (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 16, opacity: 0.5 }}>
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      )}
      <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--c-text2, #8F9BBA)' }}>{message}</div>
    </div>
  );
}
