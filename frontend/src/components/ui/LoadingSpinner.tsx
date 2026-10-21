export default function LoadingSpinner({ rows = 5, label }: { rows?: number; label?: string }) {
  return (
    <div style={{ padding: '24px 0' }}>
      {label && (
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--c-text2, #8F9BBA)', marginBottom: 16 }}>{label}</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 42, borderRadius: 10, opacity: 1 - i * 0.12 }} />
        ))}
      </div>
    </div>
  );
}

export function InlineSpinner() {
  return (
    <span style={{
      display: 'inline-block',
      width: 14,
      height: 14,
      border: '2px solid rgba(255,255,255,0.3)',
      borderTopColor: '#fff',
      borderRadius: '50%',
      animation: 'spin 0.6s linear infinite',
    }} />
  );
}
