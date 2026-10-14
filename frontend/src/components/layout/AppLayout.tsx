'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getSession, clearSession, CivisSession, CivisRole, roleHomePath, roleLabel } from '@/lib/auth';
import { api } from '@/lib/api';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [session, setSessionState] = useState<CivisSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const currentSession = getSession();
    if (!currentSession) {
      router.push('/login');
    } else {
      setSessionState(currentSession);
      setReady(true);
    }
  }, [router]);

  if (!ready || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--c-bg)' }}>
        <div className="flex items-center gap-3 text-c-text2 text-sm">
          <div className="skeleton w-4 h-4 rounded-full" />
          Loading CIVIS...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--c-bg)' }}>
      <Sidebar session={session} />
      <div style={{ marginLeft: '240px' }}>
        <main className="p-6 min-h-screen max-w-screen-2xl">{children}</main>
      </div>
    </div>
  );
}

// ── Minimal SVG icon set ───────────────────────────────────────────────────
function Icon({ d, size = 16, color = 'currentColor' }: { d: string; size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}
const IconGrid      = (p: any) => <Icon size={p.size} color={p.color} d="M2 2h5v5H2zm7 0h5v5H9zM2 9h5v5H2zm7 0h5v5H9z" />;
const IconBuilding  = (p: any) => <Icon size={p.size} color={p.color} d="M2 14V5l5-3 5 3v9M6 14v-4h4v4" />;
const IconLayers    = (p: any) => <Icon size={p.size} color={p.color} d="M8 1l6 3.5L8 8 2 4.5zM2 8l6 3.5L14 8M2 11.5l6 3.5 6-3.5" />;
const IconUsers     = (p: any) => <Icon size={p.size} color={p.color} d="M10 8a3 3 0 10-6 0 3 3 0 006 0zM1 14a6 6 0 0110.18-4.32M13 10a2 2 0 100-4 2 2 0 000 4zM15 14a4 4 0 00-4.46-3.98" />;
const IconLink      = (p: any) => <Icon size={p.size} color={p.color} d="M6 10a2 2 0 001.73 1H11a3 3 0 000-6H9M10 6a2 2 0 00-1.73-1H5a3 3 0 000 6h2" />;
const IconAlert     = (p: any) => <Icon size={p.size} color={p.color} d="M8 2l6 11H2L8 2zm0 4v3m0 2.5v.5" />;
const IconGauge     = (p: any) => <Icon size={p.size} color={p.color} d="M2 10a6 6 0 1112 0M8 10L5.5 7.5" />;
const IconCamera    = (p: any) => <Icon size={p.size} color={p.color} d="M1 5h14v9H1zM5 5V3h6v2M8 9.5a2 2 0 100-4 2 2 0 000 4" />;
const IconList      = (p: any) => <Icon size={p.size} color={p.color} d="M3 4h10M3 8h10M3 12h6" />;
const IconClipboard = (p: any) => <Icon size={p.size} color={p.color} d="M5 2h6v2H5zM3 3h10v11H3zM6 8h4M6 11h3" />;
const IconCheck     = (p: any) => <Icon size={p.size} color={p.color} d="M3 8l3 3 7-7" />;
const IconSettings  = (p: any) => <Icon size={p.size} color={p.color} d="M8 10a2 2 0 100-4 2 2 0 000 4zM8 1v2M8 13v2M1 8h2m10 0h2M2.93 2.93l1.41 1.41m7.32 7.32l1.41 1.41M2.93 13.07l1.41-1.41m7.32-7.32l1.41-1.41" />;
const IconFlask     = (p: any) => <Icon size={p.size} color={p.color} d="M6 2h4M5 2v5L2 14h12L11 7V2M5 10h6" />;
const IconLogOut    = (p: any) => <Icon size={p.size} color={p.color} d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3M10 11l3-3-3-3M13 8H5" />;

type NavItem =
  | { type: 'group'; label: string }
  | { href: string; label: string; icon: (p: any) => React.JSX.Element };

const CENTRAL_NAV: NavItem[] = [
  { href: '/dashboard/central-admin', label: 'Dashboard', icon: IconGrid },
  { type: 'group', label: 'Monitoring' },
  { href: '/centres', label: 'Centres', icon: IconBuilding },
  { href: '/batches', label: 'Batches', icon: IconLayers },
  { href: '/beneficiaries', label: 'Beneficiaries', icon: IconUsers },
  { type: 'group', label: 'Verification' },
  { href: '/matching', label: 'Beneficiary Matching', icon: IconLink },
  { href: '/anomalies', label: 'Anomaly Detection', icon: IconAlert },
  { href: '/risk', label: 'Risk Analysis', icon: IconGauge },
  { href: '/evidence', label: 'Evidence', icon: IconCamera },
  { type: 'group', label: 'Inspection' },
  { href: '/priority', label: 'Priority Queue', icon: IconList },
  { href: '/inspections', label: 'Inspections', icon: IconClipboard },
  { href: '/corrective-actions', label: 'Corrective Actions', icon: IconCheck },
  { type: 'group', label: 'Administration' },
  { href: '/central/users', label: 'User Management', icon: IconUsers },
  { type: 'group', label: 'System' },
  { href: '/settings', label: 'Configuration', icon: IconSettings },
  { href: '/demo', label: 'Demo Simulator', icon: IconFlask },
];

const MONITORING_NAV: NavItem[] = [
  { href: '/dashboard/monitoring-officer', label: 'Dashboard', icon: IconGrid },
  { type: 'group', label: 'Monitoring' },
  { href: '/centres', label: 'Centres', icon: IconBuilding },
  { href: '/batches', label: 'Batches', icon: IconLayers },
  { href: '/beneficiaries', label: 'Beneficiaries', icon: IconUsers },
  { type: 'group', label: 'Verification' },
  { href: '/anomalies', label: 'Anomaly Detection', icon: IconAlert },
  { href: '/risk', label: 'Risk Analysis', icon: IconGauge },
  { type: 'group', label: 'Field Operations' },
  { href: '/monitoring/inspectors', label: 'Inspector Directory', icon: IconUsers },
  { href: '/priority', label: 'Priority Queue', icon: IconList },
  { href: '/inspections', label: 'Inspections', icon: IconClipboard },
  { href: '/corrective-actions', label: 'Corrective Actions', icon: IconCheck },
];

const INSPECTOR_NAV: NavItem[] = [
  { href: '/dashboard/inspector', label: 'My Dashboard', icon: IconGrid },
  { type: 'group', label: 'My Work' },
  { href: '/inspector/inspections', label: 'My Inspections', icon: IconClipboard },
  { href: '/centres', label: 'Assigned Centres', icon: IconBuilding },
];

function getNavForRole(role?: string): NavItem[] {
  switch (role) {
    case 'INSPECTOR':
      return INSPECTOR_NAV;
    case 'MONITORING_OFFICER':
      return MONITORING_NAV;
    case 'CENTRAL_ADMIN':
      return CENTRAL_NAV;
    default:
      return CENTRAL_NAV;
  }
}

function getRoleBadge(role?: string) {
  switch (role) {
    case 'CENTRAL_ADMIN':
      return { label: 'Central', bg: 'rgba(40, 125, 121, 0.25)', color: '#5DD3CE', border: 'rgba(93, 211, 206, 0.35)' };
    case 'MONITORING_OFFICER':
      return { label: 'Officer', bg: 'rgba(56, 115, 186, 0.25)', color: '#8DC2F8', border: 'rgba(141, 194, 248, 0.35)' };
    case 'INSPECTOR':
      return { label: 'Inspector', bg: 'rgba(217, 130, 43, 0.25)', color: '#F4BA74', border: 'rgba(244, 186, 116, 0.35)' };
    default:
      return { label: role || 'User', bg: 'rgba(255, 255, 255, 0.1)', color: '#FFFFFF', border: 'rgba(255, 255, 255, 0.2)' };
  }
}

function Sidebar({ session }: { session: CivisSession }) {
  const pathname = usePathname();
  const router = useRouter();
  const navItems = getNavForRole(session?.role);
  const badge = getRoleBadge(session?.role);

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  }

  async function handleLogout() {
    try { await api.logout(); } catch { /* ignore */ }
    clearSession();
    router.push('/login');
  }

  return (
    <div className="fixed top-0 left-0 h-full flex flex-col z-40" style={{ width: 240, backgroundColor: '#172B4D', color: '#fff' }}>
      {/* Brand */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <CivisMark />
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', letterSpacing: '-0.01em' }}>CIVIS</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>Monitoring Platform</div>
          </div>
        </div>
        <span className="demo-banner">Demo Prototype</span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 10px' }}>
        {navItems.map((item, i) => {
          if ('type' in item && item.type === 'group') {
            return (
              <div key={`group-${i}-${item.label}`} style={{
                fontSize: 10, fontWeight: 600, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', padding: '16px 10px 5px',
              }}>
                {item.label}
              </div>
            );
          }
          const navLink = item as { href: string; label: string; icon: (p: any) => React.JSX.Element };
          const active = isActive(navLink.href);
          const IconComponent = navLink.icon;
          return (
            <Link key={navLink.href} href={navLink.href} style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '7px 10px', borderRadius: 4, marginBottom: 1,
              fontSize: 13, fontWeight: active ? 500 : 400,
              color: active ? '#fff' : 'rgba(255,255,255,0.55)',
              background: active ? 'rgba(40,125,121,0.35)' : 'transparent',
              textDecoration: 'none', transition: 'background 0.1s, color 0.1s',
            }}>
              <IconComponent size={15} color={active ? '#5DD3CE' : 'rgba(255,255,255,0.4)'} />
              {navLink.label}
            </Link>
          );
        })}
      </nav>

      {/* User info & Logout */}
      <div style={{ padding: '12px 14px 16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 2 }}>
          <div title={session?.name} style={{
            fontSize: 13, fontWeight: 600, color: '#FFFFFF',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1,
          }}>
            {session?.name || 'Authorized User'}
          </div>
          <span style={{
            fontSize: 9, fontWeight: 600, padding: '2px 5px', borderRadius: 3,
            letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap',
            background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`,
          }}>
            {badge.label}
          </span>
        </div>

        <div style={{
          fontSize: 11, color: 'rgba(255,255,255,0.5)',
          fontFamily: "'IBM Plex Mono', monospace", marginBottom: 10,
        }}>
          {session?.employee_id || '—'}
          {session?.region ? ` · ${session.region}` : ''}
        </div>

        <button type="button" onClick={handleLogout} style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 6, padding: '7px 10px', fontSize: 12, fontWeight: 500, borderRadius: 4,
          background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.12)',
          color: 'rgba(255, 255, 255, 0.75)', cursor: 'pointer',
          transition: 'background 0.12s, color 0.12s, border-color 0.12s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#fff'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
        >
          <IconLogOut size={13} color="currentColor" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}

// ── CIVIS logotype mark ────────────────────────────────────────────────────
function CivisMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="4" fill="#287D79" />
      <rect x="7" y="7" width="5" height="14" rx="1" fill="white" fillOpacity="0.9" />
      <rect x="14" y="7" width="7" height="5" rx="1" fill="white" fillOpacity="0.9" />
      <rect x="14" y="16" width="7" height="5" rx="1" fill="white" fillOpacity="0.9" />
    </svg>
  );
}
