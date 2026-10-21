'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getSession, clearSession, CivisSession, roleHomePath } from '@/lib/auth';
import { api } from '@/lib/api';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSessionState] = useState<CivisSession | null>(null);
  const [ready, setReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--c-bg, #F4F7FE)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--c-text2, #8F9BBA)', fontSize: 14 }}>
          <div className="skeleton" style={{ width: 18, height: 18, borderRadius: '50%' }} />
          Loading CIVIS Platform...
        </div>
      </div>
    );
  }

  const firstName = session?.name ? session.name.split(' ')[0] : 'Officer';

  // Get current page section label
  const getPageTitle = () => {
    if (pathname.includes('/centres')) return 'Centres Management';
    if (pathname.includes('/batches')) return 'Training Batches';
    if (pathname.includes('/beneficiaries')) return 'Beneficiaries Registry';
    if (pathname.includes('/matching')) return 'Beneficiary Matching Engine';
    if (pathname.includes('/anomalies')) return 'Anomaly Detection';
    if (pathname.includes('/risk')) return 'Risk Analysis';
    if (pathname.includes('/evidence')) return 'Evidence Verification';
    if (pathname.includes('/priority')) return 'Inspection Priority Queue';
    if (pathname.includes('/inspections')) return 'Inspections';
    if (pathname.includes('/corrective-actions')) return 'Corrective Actions';
    if (pathname.includes('/users')) return 'User Management';
    if (pathname.includes('/settings')) return 'Rules & Configuration';
    if (pathname.includes('/demo')) return 'Demo Data Simulator';
    if (pathname.includes('/dashboard')) return 'Dashboard Overview';
    return 'CIVIS Platform';
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--c-bg, #F4F7FE)', display: 'flex' }}>
      {/* Sidebar */}
      <Sidebar session={session} />

      {/* Main Wrapper */}
      <div style={{ flex: 1, marginLeft: 260, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Top Header Bar */}
        <header style={{
          height: 72,
          padding: '0 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'transparent',
          position: 'sticky',
          top: 0,
          zIndex: 30,
        }}>
          {/* Greeting & Breadcrumb */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--c-text2, #8F9BBA)' }}>
              Pages / {getPageTitle()}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--c-text, #2B3674)', marginTop: 2 }}>
              Hello, {firstName} 👋
            </div>
          </div>

          {/* Right Area: Search & Profile Pills */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'var(--c-surface, #FFFFFF)',
            padding: '6px 12px 6px 16px',
            borderRadius: 'var(--radius-pill, 50px)',
            boxShadow: 'var(--shadow-card, 0 3.5px 5.5px rgba(0,0,0,0.02))',
            border: '1px solid var(--c-border, #E9EDF7)',
          }}>
            {/* Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--c-text3, #A3AED0)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: 13,
                  color: 'var(--c-text, #2B3674)',
                  width: 130,
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {/* Divider */}
            <div style={{ width: 1, height: 20, background: 'var(--c-border, #E9EDF7)' }} />

            {/* Notification Bell */}
            <button
              type="button"
              title="Notifications"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--c-text2, #8F9BBA)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 4,
                borderRadius: '50%',
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            </button>

            {/* User Avatar Circle */}
            <div
              title={`${session?.name} (${session?.role})`}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'var(--c-accent, #4361EE)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.02em',
                cursor: 'default',
              }}
            >
              {session?.name ? session.name.charAt(0).toUpperCase() : 'U'}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main style={{ flex: 1, padding: '16px 32px 40px', maxWidth: 1600, width: '100%', margin: '0 auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}

// ── Minimal SVG icons ────────────────────────────────────────────────────────
function Icon({ d, size = 18, color = 'currentColor' }: { d: string; size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}
const IconGrid      = (p: any) => <Icon size={p.size} color={p.color} d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />;
const IconBuilding  = (p: any) => <Icon size={p.size} color={p.color} d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 9h1M9 13h1M9 17h1M14 9h1M14 13h1M14 17h1" />;
const IconLayers    = (p: any) => <Icon size={p.size} color={p.color} d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />;
const IconUsers     = (p: any) => <Icon size={p.size} color={p.color} d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />;
const IconLink      = (p: any) => <Icon size={p.size} color={p.color} d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />;
const IconAlert     = (p: any) => <Icon size={p.size} color={p.color} d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" />;
const IconGauge     = (p: any) => <Icon size={p.size} color={p.color} d="M12 2a10 10 0 0 0-7.07 17.07l1.41-1.41A8 8 0 1 1 12 20a7.96 7.96 0 0 1-5.66-2.34M12 6v6l4 2" />;
const IconCamera    = (p: any) => <Icon size={p.size} color={p.color} d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />;
const IconList      = (p: any) => <Icon size={p.size} color={p.color} d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />;
const IconClipboard = (p: any) => <Icon size={p.size} color={p.color} d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" />;
const IconCheck     = (p: any) => <Icon size={p.size} color={p.color} d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3" />;
const IconSettings  = (p: any) => <Icon size={p.size} color={p.color} d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />;
const IconFlask     = (p: any) => <Icon size={p.size} color={p.color} d="M10 2v7.31L4.2 18A2 2 0 0 0 5.8 21h12.4a2 2 0 0 0 1.6-3L14 9.31V2M8.5 2h7M7 16h10" />;
const IconLogOut    = (p: any) => <Icon size={p.size} color={p.color} d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />;

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
      return { label: 'Central Admin', bg: '#E6FBF3', color: '#01B574', border: '#B8F2DC' };
    case 'MONITORING_OFFICER':
      return { label: 'Monitoring Officer', bg: '#EEF2FF', color: '#4361EE', border: '#CDD9FE' };
    case 'INSPECTOR':
      return { label: 'Field Inspector', bg: '#FFF8EC', color: '#FFB547', border: '#FFE7BF' };
    default:
      return { label: role || 'User', bg: '#F4F7FE', color: '#8F9BBA', border: '#E9EDF7' };
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
    <div
      className="fixed top-0 left-0 h-full flex flex-col z-40"
      style={{
        width: 260,
        backgroundColor: '#FFFFFF',
        borderRight: '1px solid var(--c-border, #E9EDF7)',
        color: 'var(--c-text, #2B3674)',
      }}
    >
      {/* Brand Header */}
      <div style={{ padding: '24px 24px 20px', borderBottom: '1px solid var(--c-border, #E9EDF7)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <CivisMark />
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--c-navy, #1B2559)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              CIVIS<span style={{ color: 'var(--c-accent, #4361EE)' }}>.</span>
            </div>
            <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--c-text2, #8F9BBA)', marginTop: 2 }}>
              Monitoring Platform
            </div>
          </div>
        </div>
        <span className="demo-banner">Demo Prototype</span>
      </div>

      {/* Navigation Links */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
        {navItems.map((item, i) => {
          if ('type' in item && item.type === 'group') {
            return (
              <div
                key={`group-${i}-${item.label}`}
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--c-text3, #75839C)',
                  padding: '18px 12px 6px',
                }}
              >
                {item.label}
              </div>
            );
          }
          const navLink = item as { href: string; label: string; icon: (p: any) => React.JSX.Element };
          const active = isActive(navLink.href);
          const IconComponent = navLink.icon;
          return (
            <Link
              key={navLink.href}
              href={navLink.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '9px 12px',
                borderRadius: 'var(--radius-sm, 8px)',
                marginBottom: 3,
                fontSize: 13,
                fontWeight: active ? 600 : 500,
                color: active ? 'var(--c-accent, #4361EE)' : 'var(--c-text2, #5A6A85)',
                background: active ? 'rgba(67, 97, 238, 0.08)' : 'transparent',
                boxShadow: active ? 'inset 3px 0 0 var(--c-accent, #4361EE)' : 'none',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'var(--c-surface2, #F0F3F9)';
                  e.currentTarget.style.color = 'var(--c-text, #1E293B)';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--c-text2, #5A6A85)';
                }
              }}
            >
              <IconComponent
                size={17}
                color={active ? 'var(--c-accent, #4361EE)' : 'var(--c-text3, #75839C)'}
              />
              <span style={{ flex: 1 }}>{navLink.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info & Logout Footer */}
      <div style={{ padding: '16px 18px', borderTop: '1px solid var(--c-border, #E9EDF7)', background: '#FAFCFE' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 4 }}>
          <div
            title={session?.name}
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--c-text, #2B3674)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              flex: 1,
            }}
          >
            {session?.name || 'Authorized User'}
          </div>
          <span style={{
            fontSize: 10,
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: '50px',
            letterSpacing: '0.02em',
            whiteSpace: 'nowrap',
            background: badge.bg,
            color: badge.color,
            border: `1px solid ${badge.border}`,
          }}>
            {badge.label}
          </span>
        </div>

        <div style={{
          fontSize: 11,
          color: 'var(--c-text3, #A3AED0)',
          fontFamily: "'IBM Plex Mono', monospace",
          marginBottom: 12,
        }}>
          {session?.employee_id || '—'}
          {session?.region ? ` · ${session.region}` : ''}
        </div>

        <button
          type="button"
          onClick={handleLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '8px 12px',
            fontSize: 12,
            fontWeight: 600,
            borderRadius: 'var(--radius-sm, 8px)',
            background: 'var(--c-surface2, #F0F3F9)',
            border: '1px solid var(--c-border, #E9EDF7)',
            color: 'var(--c-text2, #8F9BBA)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#FFF0EF';
            e.currentTarget.style.color = '#EE5D50';
            e.currentTarget.style.borderColor = '#FCD4D1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--c-surface2, #F0F3F9)';
            e.currentTarget.style.color = 'var(--c-text2, #8F9BBA)';
            e.currentTarget.style.borderColor = 'var(--c-border, #E9EDF7)';
          }}
        >
          <IconLogOut size={14} color="currentColor" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}

// ── CIVIS logotype mark ────────────────────────────────────────────────────
function CivisMark() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="10" fill="url(#brandGrad)" />
      <rect x="8" y="8" width="6" height="16" rx="2" fill="white" fillOpacity="0.95" />
      <rect x="16" y="8" width="8" height="6" rx="2" fill="white" fillOpacity="0.95" />
      <rect x="16" y="18" width="8" height="6" rx="2" fill="white" fillOpacity="0.95" />
      <defs>
        <linearGradient id="brandGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4361EE" />
          <stop offset="1" stopColor="#287D79" />
        </linearGradient>
      </defs>
    </svg>
  );
}
