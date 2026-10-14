// Skeleton-based loading state
export default function LoadingSpinner({ rows = 5, label }: { rows?: number; label?: string }) {
  return (
    <div style={{ padding: '24px 0' }}>
      {label && (
        <div style={{ fontSize: 12, color: '#A0AEB0', marginBottom: 16 }}>{label}</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 36, borderRadius: 4, opacity: 1 - i * 0.12 }} />
        ))}
      </div>
    </div>
  );
}

// Inline spinner for buttons
export function InlineSpinner() {
  return (
    <span style={{
      display: 'inline-block', width: 12, height: 12,
      border: '2px solid rgba(255,255,255,0.3)',
      borderTopColor: '#fff', borderRadius: '50%',
      animation: 'spin 0.6s linear infinite',
    }} />
  );
}
