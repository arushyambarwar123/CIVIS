interface Props { status: string; }

const STATUS_MAP: Record<string, { bg: string; color: string; label: string }> = {
  open:                { bg: '#FDEAEA', color: '#B54747', label: 'Open' },
  under_review:        { bg: '#E3F2F0', color: '#287D79', label: 'Under Review' },
  in_progress:         { bg: '#FDF3E3', color: '#B77928', label: 'In Progress' },
  resolved:            { bg: '#EAF4EF', color: '#31785B', label: 'Resolved' },
  dismissed:           { bg: '#EFF2F1', color: '#64717D', label: 'Dismissed' },
  closed:              { bg: '#EAF4EF', color: '#31785B', label: 'Closed' },
  overdue:             { bg: '#FDEAEA', color: '#B54747', label: 'Overdue' },
  evidence_submitted:  { bg: '#FDF3E3', color: '#B77928', label: 'Evidence Submitted' },
  scheduled:           { bg: '#E3F2F0', color: '#287D79', label: 'Scheduled' },
  submitted:           { bg: '#EAF4EF', color: '#31785B', label: 'Submitted' },
  compliant:           { bg: '#EAF4EF', color: '#31785B', label: 'Compliant' },
  partially_compliant: { bg: '#FDF3E3', color: '#B77928', label: 'Partial' },
  non_compliant:       { bg: '#FDEAEA', color: '#B54747', label: 'Non-Compliant' },
  pending:             { bg: '#FDF3E3', color: '#B77928', label: 'Pending' },
  active:              { bg: '#EAF4EF', color: '#31785B', label: 'Active' },
  completed:           { bg: '#EFF2F1', color: '#64717D', label: 'Completed' },
  cancelled:           { bg: '#EFF2F1', color: '#64717D', label: 'Cancelled' },
  verified:            { bg: '#EAF4EF', color: '#31785B', label: 'Verified' },
  certified:           { bg: '#EAF4EF', color: '#31785B', label: 'Certified' },
  not_certified:       { bg: '#FDEAEA', color: '#B54747', label: 'Not Certified' },
  paid:                { bg: '#EAF4EF', color: '#31785B', label: 'Paid' },
  failed:              { bg: '#FDEAEA', color: '#B54747', label: 'Failed' },
};

export default function StatusBadge({ status }: Props) {
  const s = STATUS_MAP[status?.toLowerCase()] ?? { bg: '#EFF2F1', color: '#64717D', label: status };
  return (
    <span style={{
      backgroundColor: s.bg,
      color: s.color,
      fontSize: '11px',
      fontWeight: 500,
      padding: '2px 8px',
      borderRadius: '3px',
      whiteSpace: 'nowrap',
      display: 'inline-block',
      letterSpacing: '0.02em',
    }}>
      {s.label}
    </span>
  );
}
