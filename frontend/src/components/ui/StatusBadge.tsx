import { statusBg, statusText, capitalize } from '@/lib/utils';
interface Props { status: string; }
export default function StatusBadge({ status }: Props) {
  return (
    <span style={{ backgroundColor: statusBg(status), color: statusText(status),
      padding: '2px 8px', fontSize: 11, fontWeight: 600, borderRadius: 4, whiteSpace: 'nowrap' }}>
      {capitalize(status)}
    </span>
  );
}
