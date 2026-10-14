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
    low: '#31785B', medium: '#B77928', high: '#C46A00', critical: '#B54747',
  };
  return map[level?.toLowerCase()] ?? '#64717D';
}

export function riskBg(level: string): string {
  const map: Record<string, string> = {
    low: '#EAF4EF', medium: '#FDF3E3', high: '#FDF0E3', critical: '#FDEAEA',
  };
  return map[level?.toLowerCase()] ?? '#EFF2F1';
}


export function statusBg(status: string): string {
  const map: Record<string, string> = {
    open: '#F8D7DA', in_progress: '#FFF3CD', under_review: '#D1ECF1',
    resolved: '#D1E7DD', dismissed: '#E9ECEF', closed: '#D1E7DD',
    overdue: '#F8D7DA', evidence_submitted: '#FFF3CD', scheduled: '#D1ECF1',
    submitted: '#D1E7DD', compliant: '#D1E7DD', partially_compliant: '#FFF3CD',
    non_compliant: '#F8D7DA', pending: '#FFF3CD', active: '#D1E7DD',
    completed: '#D1E7DD', cancelled: '#E9ECEF', verified: '#D1E7DD',
    certified: '#D1E7DD', paid: '#D1E7DD', failed: '#F8D7DA',
    not_certified: '#F8D7DA',
  };
  return map[status?.toLowerCase()] ?? '#E9ECEF';
}

export function statusText(status: string): string {
  const map: Record<string, string> = {
    open: '#842029', in_progress: '#664D03', under_review: '#0C5460',
    resolved: '#0A3622', dismissed: '#495057', closed: '#0A3622',
    overdue: '#842029', evidence_submitted: '#664D03', scheduled: '#0C5460',
    submitted: '#0A3622', compliant: '#0A3622', partially_compliant: '#664D03',
    non_compliant: '#842029', pending: '#664D03', active: '#0A3622',
    completed: '#0A3622', cancelled: '#495057', verified: '#0A3622',
    paid: '#0A3622', failed: '#842029', certified: '#0A3622',
    not_certified: '#842029',
  };
  return map[status?.toLowerCase()] ?? '#495057';
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
