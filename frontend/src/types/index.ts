// TypeScript types for CIVIS Lite

export interface TrainingCentre {
  id: number;
  centre_code: string;
  centre_name: string;
  organisation_name: string;
  state: string;
  district: string;
  address: string;
  latitude: number;
  longitude: number;
  status: string;
  registration_date: string;
  last_inspection_date: string | null;
  risk_score?: number;
  risk_level?: string;
  open_anomalies?: number;
}

export interface TrainingBatch {
  id: number;
  batch_code: string;
  centre_id: number;
  course_name: string;
  trainer_id: number | null;
  start_date: string;
  end_date: string;
  expected_training_hours: number;
  batch_capacity: number;
  registered_count: number;
  status: string;
  risk_score?: number;
  risk_level?: string;
  open_anomalies?: number;
}

export interface Beneficiary {
  id: number;
  beneficiary_token: string;
  name: string;
  age: number;
  gender: string;
  category: string;
  district: string;
  state: string;
  eligibility_status: boolean;
  bank_account_token: string;
  mobile_token: string;
  open_anomalies?: number;
  enrolment_count?: number;
}

export interface Anomaly {
  id: number;
  entity_type: string;
  entity_id: number;
  anomaly_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  detected_at: string;
  evidence: Record<string, unknown>;
  status: string;
  related_entity_type?: string;
  related_entity_id?: number;
  recommended_action?: string;
}

export interface RiskReason {
  factor: string;
  contribution: number;
  description: string;
}

export interface RiskScore {
  id: number;
  entity_type: string;
  entity_id: number;
  score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  calculated_at: string;
  reasons: RiskReason[];
  entity_name?: string;
  entity_code?: string;
}

export interface Inspection {
  id: number;
  centre_id: number;
  centre_name?: string;
  centre_code?: string;
  batch_id: number | null;
  batch_code?: string | null;
  inspector_name: string;
  inspection_date: string;
  actual_people_found: number | null;
  findings: Record<string, unknown>;
  compliance_status: string;
  status: string;
  duration_minutes: number | null;
  inspector_latitude?: number | null;
  inspector_longitude?: number | null;
  checklist: Record<string, unknown>;
}

export interface CorrectiveAction {
  id: number;
  anomaly_id: number | null;
  inspection_id: number | null;
  centre_id: number;
  responsible_person: string;
  action_required: string;
  deadline: string;
  severity: string;
  status: string;
  evidence_submitted: string | null;
  verified: boolean;
  created_at: string;
  is_overdue?: boolean;
}

export interface PriorityItem {
  rank: number;
  centre_id: number;
  centre_name: string;
  centre_code: string;
  district: string;
  state: string;
  risk_score: number;
  risk_level: string;
  days_since_inspection: number;
  critical_anomaly_count: number;
  pending_actions: number;
  priority_score: number;
  priority_reasons: string[];
  last_inspection_date: string | null;
}

export interface MatchResult {
  anomaly_id: number;
  anomaly_type: string;
  severity: string;
  confidence_score: number;
  match_level: string;
  reasons: string[];
  is_conflict: boolean;
  conflict_description: string | null;
  beneficiary_a: {
    id: number; token: string; name: string; age: number;
    district: string; mobile_token: string; bank_account_token: string;
  } | null;
  beneficiary_b: {
    id: number; token: string; name: string; age: number;
    district: string; mobile_token: string; bank_account_token: string;
  } | null;
  detected_at: string;
  status: string;
}

export interface DashboardSummary {
  total_centres: number;
  active_batches: number;
  total_beneficiaries: number;
  high_risk_centres: number;
  critical_risk_centres: number;
  open_anomalies: number;
  pending_inspections: number;
  overdue_actions: number;
  risk_distribution: { low: number; medium: number; high: number; critical: number };
  recent_anomalies: Anomaly[];
  top_priorities: PriorityItem[];
}

export interface Evidence {
  id: number;
  batch_id: number;
  evidence_type: string;
  file_path: string;
  uploaded_at: string;
  captured_at: string | null;
  latitude: number | null;
  longitude: number | null;
  image_hash: string | null;
  source: string;
  is_flagged: boolean;
}
