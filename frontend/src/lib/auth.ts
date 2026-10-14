/**
 * CIVIS — Frontend authentication utilities.
 * Token stored in sessionStorage (cleared on browser close).
 * Never stores passwords or sensitive data in storage.
 */

export type CivisRole = "INSPECTOR" | "MONITORING_OFFICER" | "CENTRAL_ADMIN";

export interface CivisSession {
  access_token: string;
  token_type: string;
  role: CivisRole;
  employee_id: string;
  name: string;
  region: string | null;
  inspector_id?: string | null;
  assigned_area?: string | null;
  officer_id?: string | null;
}

const SESSION_KEY = "civis_session";

/** Centralized role-to-dashboard route mapping. Never construct URLs from display names. */
const ROLE_HOME: Record<CivisRole, string> = {
  INSPECTOR: "/dashboard/inspector",
  MONITORING_OFFICER: "/dashboard/monitoring-officer",
  CENTRAL_ADMIN: "/dashboard/central-admin",
};

export function setSession(session: CivisSession): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getSession(): CivisSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as CivisSession) : null;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export function isLoggedIn(): boolean {
  return getSession() !== null;
}

export function getToken(): string | null {
  return getSession()?.access_token ?? null;
}

export function getRole(): CivisRole | null {
  return getSession()?.role ?? null;
}

export function getEmployeeId(): string | null {
  return getSession()?.employee_id ?? null;
}

export function getUserName(): string | null {
  return getSession()?.name ?? null;
}

/** Returns the correct dashboard path for a given role. */
export function roleHomePath(role: CivisRole): string {
  return ROLE_HOME[role] || "/dashboard/central-admin";
}

/** Display label for a role value. */
export function roleLabel(role: CivisRole): string {
  switch (role) {
    case "INSPECTOR": return "Field Inspector";
    case "MONITORING_OFFICER": return "Monitoring Officer";
    case "CENTRAL_ADMIN": return "Central Administrator";
    default: return role;
  }
}

/** Check if the current user has one of the allowed roles. */
export function hasRole(...allowed: CivisRole[]): boolean {
  const r = getRole();
  return r !== null && allowed.includes(r);
}
