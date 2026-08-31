interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  bg?: string;
  border?: string;
}
export default function MetricCard({ label, value, sub, color, bg, border }: MetricCardProps) {
  return (
    <div className="rounded-lg p-5"
      style={{ backgroundColor: bg || 'white', border: `1px solid ${border || '#DEE2E6'}` }}>
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">{label}</div>
      <div className="text-3xl font-bold" style={{ color: color || '#1A2B4A' }}>{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}
