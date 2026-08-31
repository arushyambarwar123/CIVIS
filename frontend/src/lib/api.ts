// API client for CIVIS Lite backend

const BASE = 'http://localhost:8000/api/v1';

async function get(path: string) {
  const r = await fetch(`${BASE}${path}`);
  if (!r.ok) throw new Error(`API error ${r.status}: ${path}`);
  return r.json();
}

async function post(path: string, body?: unknown) {
  const r = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error(`API error ${r.status}: ${path}`);
  return r.json();
}

async function patch(path: string, body: unknown) {
  const r = await fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`API error ${r.status}: ${path}`);
  return r.json();
}

async function put(path: string, body: unknown) {
  const r = await fetch(`${BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`API error ${r.status}: ${path}`);
  return r.json();
}

export const api = {
  // Dashboard
  getDashboard: () => get('/dashboard/summary'),

  // Centres
  getCentres: (params?: { state?: string; risk_level?: string; status?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return get(`/centres${q ? '?' + q : ''}`);
  },
  getCentre: (id: number) => get(`/centres/${id}`),
  getCentreProfile: (id: number) => get(`/centres/${id}/profile`),

  // Batches
  getBatches: (params?: { centre_id?: number; status?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return get(`/batches${q ? '?' + q : ''}`);
  },
  getBatch: (id: number) => get(`/batches/${id}`),

  // Beneficiaries
  getBeneficiaries: (params?: { state?: string; district?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return get(`/beneficiaries${q ? '?' + q : ''}`);
  },
  getBeneficiary: (id: number) => get(`/beneficiaries/${id}`),

  // Anomalies
  getAnomalies: (params?: Record<string, string | number>) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return get(`/anomalies${q ? '?' + q : ''}`);
  },
  getAnomaly: (id: number) => get(`/anomalies/${id}`),
  updateAnomalyStatus: (id: number, status: string) =>
    patch(`/anomalies/${id}`, { status }),

  // Risk
  getRiskScores: (entity_type?: string) =>
    get(`/risk${entity_type ? '?entity_type=' + entity_type : ''}`),
  recalculateAllRisk: () => post('/risk/recalculate'),

  // Matching
  getMatchingResults: () => get('/matching'),
  runMatching: () => post('/matching/run'),

  // Inspections
  getInspections: (params?: Record<string, string | number>) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return get(`/inspections${q ? '?' + q : ''}`);
  },
  getInspection: (id: number) => get(`/inspections/${id}`),
  createInspection: (data: unknown) => post('/inspections', data),
  updateInspection: (id: number, data: unknown) => patch(`/inspections/${id}`, data),
  submitInspection: (id: number, data: unknown) => post(`/inspections/${id}/submit`, data),
  getInspectionSample: (id: number, size?: number) =>
    get(`/inspections/${id}/sample${size ? '?sample_size=' + size : ''}`),

  // Priority
  getPriorityList: () => get('/priority'),
  assignInspection: (data: unknown) => post('/priority/assign', data),
  getRandomSample: (count: number) => get(`/priority/random-sample?count=${count}`),

  // Corrective Actions
  getCorrectiveActions: (params?: Record<string, string | number>) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return get(`/corrective-actions${q ? '?' + q : ''}`);
  },
  createCorrectiveAction: (data: unknown) => post('/corrective-actions', data),
  updateCorrectiveAction: (id: number, data: unknown) =>
    patch(`/corrective-actions/${id}`, data),

  // Evidence
  getEvidence: (batch_id?: number) =>
    get(`/evidence${batch_id ? '?batch_id=' + batch_id : ''}`),

  // Config
  getConfig: (ruleSet: string) => get(`/config/${ruleSet}`),
  updateConfig: (ruleSet: string, data: unknown) => put(`/config/${ruleSet}`, data),
  getAllConfigs: () => get('/config'),

  // Analysis engines
  runAttendanceAnalysis: () => post('/analyse/attendance'),
  runEvidenceAnalysis: () => post('/analyse/evidence'),
  runPlacementAnalysis: () => post('/analyse/placements'),
  runPaymentAnalysis: () => post('/analyse/payments'),
  runMatchingAnalysis: () => post('/analyse/matching'),
  runAllChecks: () => post('/analyse/all'),

  // Demo
  resetDatabase: () => post('/demo/reset'),
  generateNormalData: () => post('/demo/generate-normal'),
  injectAnomaly: (type: string) => post(`/demo/inject/${type}`),
  runAllDemoChecks: () => post('/demo/run-all-checks'),
};
