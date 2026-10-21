interface Props { status: string; }

const STATUS_MAP: Record<string, { bg: string; color: string; label: string }> = {
  open:                { bg: '#FFF0EF', color: '#EE5D50', label: 'Open' },
  under_review:        { bg: '#EEF2FF', color: '#4361EE', label: 'Under Review' },
  in_progress:         { bg: '#EEF2FF', color: '#4361EE', label: 'In Progress' },
  resolved:            { bg: '#E6FBF3', color: '#01B574', label: 'Resolved' },
  dismissed:           { bg: '#F4F7FE', color: '#8F9BBA', label: 'Dismissed' },
  closed:              { bg: '#E6FBF3', color: '#01B574', label: 'Closed' },
  overdue:             { bg: '#FFF0EF', color: '#EE5D50', label: 'Overdue' },
  evidence_submitted:  { bg: '#FFF8EC', color: '#FFB547', label: 'Evidence Submitted' },
  scheduled:           { bg: '#EEF2FF', color: '#4361EE', label: 'Scheduled' },
  submitted:           { bg: '#E6FBF3', color: '#01B574', label: 'Submitted' },
  compliant:           { bg: '#E6FBF3', color: '#01B574', label: 'Compliant' },
  partially_compliant: { bg: '#FFF8EC', color: '#FFB547', label: 'Partial' },
  non_compliant:       { bg: '#FFF0EF', color: '#EE5D50', label: 'Non-Compliant' },
  pending:             { bg: '#FFF8EC', color: '#FFB547', label: 'Pending' },
  active:              { bg: '#E6FBF3', color: '#01B574', label: 'Active' },
  completed:           { bg: '#E6FBF3', color: '#01B574', label: 'Completed' },
  cancelled:           { bg: '#F4F7FE', color: '#8F9BBA', label: 'Cancelled' },
  verified:            { bg: '#E6FBF3', color: '#01B574', label: 'Verified' },
  certified:           { bg: '#E6FBF3', color: '#01B574', label: 'Certified' },
  not_certified:       { bg: '#FFF0EF', color: '#EE5D50', label: 'Not Certified' },
  paid:                { bg: '#E6FBF3', color: '#01B574', label: 'Paid' },
  failed:              { bg: '#FFF0EF', color: '#EE5D50', label: 'Failed' },
};

export default function StatusBadge({ status }: Props) {
  const s = STATUS_MAP[status?.toLowerCase()] ?? { bg: '#F4F7FE', color: '#8F9BBA', label: status };
  return (
    <span style={{
      backgroundColor: s.bg,
      color: s.color,
      fontSize: '12px',
      fontWeight: 500,
      padding: '3px 10px',
      borderRadius: '50px',
      whiteSpace: 'nowrap',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      letterSpacing: '0.01em',
    }}>
      <span style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        backgroundColor: s.color,
        display: 'inline-block',
        flexShrink: 0,
      }} />
      {s.label}
    </span>
  );
}
