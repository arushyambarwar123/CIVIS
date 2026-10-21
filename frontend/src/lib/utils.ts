// Utility functions

export function formatDate(d: string | null | undefined): string {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch {
    return d;
  }
}

export function formatDateTime(d: string | null | undefined): string {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return d;
  }
}

export function riskColor(level: string): string {
  const map: Record<string, string> = {
    low: '#01B574', medium: '#FFB547', high: '#FF8800', critical: '#EE5D50',
  };
  return map[level?.toLowerCase()] ?? '#8F9BBA';
}

export function riskBg(level: string): string {
  const map: Record<string, string> = {
    low: '#E6FBF3', medium: '#FFF8EC', high: '#FFF2E5', critical: '#FFF0EF',
  };
  return map[level?.toLowerCase()] ?? '#F4F7FE';
}


export function statusBg(status: string): string {
  const map: Record<string, string> = {
    open: '#FFF0EF', in_progress: '#EEF2FF', under_review: '#E6FBF3',
    resolved: '#E6FBF3', dismissed: '#F4F7FE', closed: '#E6FBF3',
    overdue: '#FFF0EF', evidence_submitted: '#FFF8EC', scheduled: '#EEF2FF',
    submitted: '#E6FBF3', compliant: '#E6FBF3', partially_compliant: '#FFF8EC',
    non_compliant: '#FFF0EF', pending: '#FFF8EC', active: '#E6FBF3',
    completed: '#E6FBF3', cancelled: '#F4F7FE', verified: '#E6FBF3',
    certified: '#E6FBF3', paid: '#E6FBF3', failed: '#FFF0EF',
    not_certified: '#FFF0EF',
  };
  return map[status?.toLowerCase()] ?? '#F4F7FE';
}

export function statusText(status: string): string {
  const map: Record<string, string> = {
    open: '#EE5D50', in_progress: '#4361EE', under_review: '#01B574',
    resolved: '#01B574', dismissed: '#8F9BBA', closed: '#01B574',
    overdue: '#EE5D50', evidence_submitted: '#FFB547', scheduled: '#4361EE',
    submitted: '#01B574', compliant: '#01B574', partially_compliant: '#FFB547',
    non_compliant: '#EE5D50', pending: '#FFB547', active: '#01B574',
    completed: '#01B574', cancelled: '#8F9BBA', verified: '#01B574',
    paid: '#01B574', failed: '#EE5D50', certified: '#01B574',
    not_certified: '#EE5D50',
  };
  return map[status?.toLowerCase()] ?? '#8F9BBA';
}

export function capitalize(s: string): string {
  if (!s) return '';
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function truncate(s: string, max = 80): string {
  if (!s) return '';
  return s.length > max ? s.slice(0, max) + '...' : s;
}

export function anomalyTypeLabel(t: string): string {
  const map: Record<string, string> = {
    perfect_attendance_pattern: 'Perfect Attendance Pattern',
    identical_checkin_time: 'Identical Check-in Times',
    attendance_geo_mismatch: 'GPS Location Mismatch',
    impossible_travel: 'Impossible Travel',
    trainer_conflict: 'Trainer Conflict',
    duplicate_evidence: 'Duplicate Evidence',
    evidence_geo_mismatch: 'Evidence Geo Mismatch',
    placement_without_certification: 'Placement Without Certification',
    placement_before_completion: 'Placement Before Completion',
    duplicate_employer_concentration: 'Employer Concentration',
    unverified_placement_pending: 'Unverified Placement',
    payment_low_attendance: 'Payment - Low Attendance',
    payment_before_batch_start: 'Payment Before Batch Start',
    payment_inactive_batch: 'Payment - Inactive Batch',
    payment_unenrolled_beneficiary: 'Payment - Unenrolled Beneficiary',
    duplicate_payment_reference: 'Duplicate Payment Reference',
    payment_after_dropout: 'Payment After Dropout',
    inspection_overdue: 'Inspection Overdue',
    beneficiary_match_high: 'Beneficiary Match (High)',
    beneficiary_match_possible: 'Beneficiary Match (Possible)',
    duplicate_enrolment_match: 'Duplicate Enrolment',
    attendance_anomaly: 'Attendance Anomaly',
  };
  return map[t] ?? capitalize(t);
}
