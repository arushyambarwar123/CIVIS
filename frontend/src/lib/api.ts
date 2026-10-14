// API client for CIVIS Lite backend — with JWT auth header injection
import { getToken, clearSession } from './auth';

const BASE = (process.env.NEXT_PUBLIC_API_URL || 'https://civis-lite-backend.vercel.app') + '/api/v1';

function authHeaders(): Record<string, string> {
  const token = getToken();
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

async function handleResponse(r: Response) {
  if (r.status === 401) {
    clearSession();
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new Error('Session expired');
  }
  if (!r.ok) {
    let msg = `API error ${r.status}`;
    try {
      const data = await r.json();
      msg = data.detail || msg;
    } catch { /* ignore */ }
    throw new Error(msg);
  }
  return r.json();
}

async function get(path: string) {
  const r = await fetch(`${BASE}${path}`, { headers: authHeaders() });
  return handleResponse(r);
}

async function post(path: string, body?: unknown) {
  const r = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: authHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  return handleResponse(r);
}

async function patch(path: string, body: unknown) {
  const r = await fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  return handleResponse(r);
}

async function put(path: string, body: unknown) {
  const r = await fetch(`${BASE}${path}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  return handleResponse(r);
}

/** Login — does NOT send auth header (pre-auth call) */
async function loginPost(employee_id: string, password: string) {
  const r = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employee_id, password }),
  });
  if (!r.ok) {
    let msg = 'Login failed';
    try { const d = await r.json(); msg = d.detail || msg; } catch {}
    throw new Error(msg);
  }
  return r.json();
}

export const api = {
  // ── Auth ────────────────────────────────────────────────
  login: loginPost,
  getMe: () => get('/auth/me'),
  logout: () => post('/auth/logout'),

  // ── Users / Inspectors ─────────────────────────────────
  getInspectors: (params?: { region?: string; status?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return get(`/users/inspectors${q ? '?' + q : ''}`);
  },
  getInspector: (inspectorId: string) => get(`/users/inspectors/${inspectorId}`),
  getInspectorWorkload: (inspectorId: string) =>
    get(`/users/inspectors/${inspectorId}/workload`),
  getMyInspections: (status?: string) =>
    get(`/users/me/inspections${status ? '?status=' + status : ''}`),
  getAllUsers: () => get('/users/'),
  updateUserStatus: (userId: number, status: string) =>
    patch(`/users/${userId}/status`, { status }),

  // ── Notifications ──────────────────────────────────────
  getNotifications: (unreadOnly?: boolean) =>
    get(`/notifications${unreadOnly ? '?unread_only=true' : ''}`),
  markNotificationRead: (id: number) => patch(`/notifications/${id}/read`, {}),
  markAllNotificationsRead: () => patch('/notifications/read-all', {}),
  getUnreadCount: () => get('/notifications/unread-count'),

  // ── Dashboard ──────────────────────────────────────────
  getDashboard: () => get('/dashboard/summary'),

  // ── Centres ────────────────────────────────────────────
  getCentres: (params?: { state?: string; risk_level?: string; status?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return get(`/centres${q ? '?' + q : ''}`);
  },
  getCentre: (id: number) => get(`/centres/${id}`),
  getCentreProfile: (id: number) => get(`/centres/${id}/profile`),

  // ── Batches ────────────────────────────────────────────
  getBatches: (params?: { centre_id?: number; status?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return get(`/batches${q ? '?' + q : ''}`);
  },
  getBatch: (id: number) => get(`/batches/${id}`),

  // ── Beneficiaries ──────────────────────────────────────
  getBeneficiaries: (params?: { state?: string; district?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return get(`/beneficiaries${q ? '?' + q : ''}`);
  },
  getBeneficiary: (id: number) => get(`/beneficiaries/${id}`),

  // ── Anomalies ──────────────────────────────────────────
  getAnomalies: (params?: Record<string, string | number>) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return get(`/anomalies${q ? '?' + q : ''}`);
  },
  getAnomaly: (id: number) => get(`/anomalies/${id}`),
  updateAnomalyStatus: (id: number, status: string) =>
    patch(`/anomalies/${id}`, { status }),

  // ── Risk ───────────────────────────────────────────────
  getRiskScores: (entity_type?: string) =>
    get(`/risk${entity_type ? '?entity_type=' + entity_type : ''}`),
  recalculateAllRisk: () => post('/risk/recalculate'),

  // ── Matching ───────────────────────────────────────────
  getMatchingResults: () => get('/matching'),
  runMatching: () => post('/matching/run'),

  // ── Inspections ────────────────────────────────────────
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

  // ── Priority ───────────────────────────────────────────
  getPriorityList: () => get('/priority'),
  assignInspection: (data: unknown) => post('/priority/assign', data),
  getRandomSample: (count: number) => get(`/priority/random-sample?count=${count}`),

  // ── Corrective Actions ─────────────────────────────────
  getCorrectiveActions: (params?: Record<string, string | number>) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return get(`/corrective-actions${q ? '?' + q : ''}`);
  },
  createCorrectiveAction: (data: unknown) => post('/corrective-actions', data),
  updateCorrectiveAction: (id: number, data: unknown) =>
    patch(`/corrective-actions/${id}`, data),

  // ── Evidence ───────────────────────────────────────────
  getEvidence: (batch_id?: number) =>
    get(`/evidence${batch_id ? '?batch_id=' + batch_id : ''}`),

  // ── Config ─────────────────────────────────────────────
  getConfig: (ruleSet: string) => get(`/config/${ruleSet}`),
  updateConfig: (ruleSet: string, data: unknown) => put(`/config/${ruleSet}`, data),
  getAllConfigs: () => get('/config'),

  // ── Analysis engines ───────────────────────────────────
  runAttendanceAnalysis: () => post('/analyse/attendance'),
  runEvidenceAnalysis: () => post('/analyse/evidence'),
  runPlacementAnalysis: () => post('/analyse/placements'),
  runPaymentAnalysis: () => post('/analyse/payments'),
  runMatchingAnalysis: () => post('/analyse/matching'),
  runAllChecks: () => post('/analyse/all'),

  // ── Demo ───────────────────────────────────────────────
  resetDatabase: () => post('/demo/reset'),
  generateNormalData: () => post('/demo/generate-normal'),
  injectAnomaly: (type: string) => post(`/demo/inject/${type}`),
  runAllDemoChecks: () => post('/demo/run-all-checks'),
};
