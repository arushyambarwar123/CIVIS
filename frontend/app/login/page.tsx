'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { setSession, roleHomePath, CivisSession } from '@/lib/auth';

const DEMO_ACCOUNTS = [
  { id: 'CA-001', password: 'Civis@Central001', label: 'Central Administrator', role: 'CENTRAL_ADMIN' },
  { id: 'MO-PUN-001', password: 'Civis@MO001', label: 'Monitoring Officer', role: 'MONITORING_OFFICER' },
  { id: 'INS-PUN-001', password: 'Civis@Ins001', label: 'Field Inspector', role: 'INSPECTOR' },
];

export default function LoginPage() {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(true);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!employeeId || !password) { setError('Enter both Employee ID and Password.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await api.login(employeeId.trim(), password);
      const session: CivisSession = {
        access_token: res.access_token,
        token_type: res.token_type,
        role: res.role,
        employee_id: res.employee_id,
        name: res.name,
        region: res.region,
        inspector_id: res.inspector_id,
        assigned_area: res.assigned_area,
        officer_id: res.officer_id,
      };
      setSession(session);
      router.push(roleHomePath(session.role));
    } catch (err: any) {
      setError(err?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(id: string, pw: string) {
    setEmployeeId(id);
    setPassword(pw);
    setError('');
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--c-bg, #F4F7FE)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
    }}>
      {/* Top Prototype Badge */}
      <div style={{ position: 'absolute', top: 24, right: 32, display: 'flex', gap: 12, alignItems: 'center' }}>
        <span className="demo-banner">Demonstration Prototype</span>
        <span style={{ fontSize: 12, color: 'var(--c-text3, #A3AED0)' }}>Synthetic Data</span>
      </div>

      <div style={{
        width: '100%',
        maxWidth: 440,
        background: '#FFFFFF',
        borderRadius: 'var(--radius-xl, 20px)',
        border: '1px solid var(--c-border, #E9EDF7)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        padding: '36px 36px 32px',
      }}>
        {/* Brand Header */}
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <CivisMark size={40} />
          </div>
          <h1 style={{
            fontSize: 24,
            fontWeight: 800,
            color: 'var(--c-navy, #1B2559)',
            letterSpacing: '-0.02em',
            margin: 0,
          }}>
            CIVIS<span style={{ color: 'var(--c-accent, #4361EE)' }}>.</span>
          </h1>
          <p style={{
            fontSize: 13,
            color: 'var(--c-text2, #8F9BBA)',
            marginTop: 4,
            fontWeight: 500,
          }}>
            Central Intelligent Verification &amp; Inspection System
          </p>
          <div style={{
            fontSize: 12,
            color: 'var(--c-text3, #A3AED0)',
            marginTop: 8,
            paddingTop: 8,
            borderTop: '1px solid var(--c-border, #E9EDF7)',
          }}>
            Employability Development Scheme
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label className="label">
              Employee ID
            </label>
            <input
              type="text"
              value={employeeId}
              onChange={e => setEmployeeId(e.target.value)}
              placeholder="e.g. CA-001 or INS-PUN-001"
              autoComplete="username"
              className="input"
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label className="label">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••••••"
              autoComplete="current-password"
              className="input"
            />
          </div>

          {error && (
            <div style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm, 8px)',
              marginBottom: 16,
              background: 'var(--c-danger-bg, #FFF0EF)',
              border: '1px solid #FFD3CE',
              color: 'var(--c-danger, #EE5D50)',
              fontSize: 13,
              fontWeight: 500,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '12px 20px', borderRadius: 'var(--radius-md, 12px)' }}
          >
            {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
          </button>
        </form>

        {/* Demo Credentials Panel */}
        <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--c-border, #E9EDF7)' }}>
          <button
            type="button"
            onClick={() => setShowDemo(!showDemo)}
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--c-accent, #4361EE)',
              padding: 0,
            }}
          >
            <span>Demo Access Accounts</span>
            <span style={{ fontSize: 11 }}>{showDemo ? 'Hide ▲' : 'Show ▼'}</span>
          </button>

          {showDemo && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {DEMO_ACCOUNTS.map(acc => (
                <div
                  key={acc.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: 'var(--c-surface2, #F0F3F9)',
                    borderRadius: 'var(--radius-sm, 8px)',
                    border: '1px solid var(--c-border, #E9EDF7)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-text, #2B3674)' }}>
                      {acc.label}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--c-text3, #A3AED0)', fontFamily: 'monospace', marginTop: 2 }}>
                      {acc.id}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => fillDemo(acc.id, acc.password)}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: 11, padding: '4px 10px', height: 26 }}
                  >
                    Auto-Fill
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--c-text3, #A3AED0)', marginTop: 20, marginBottom: 0, lineHeight: 1.5 }}>
          Proof-of-concept prototype for scheme monitoring.<br />
          No real beneficiary or government data is stored.
        </p>
      </div>
    </div>
  );
}

function CivisMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="10" fill="url(#brandGradLogin)" />
      <rect x="8" y="8" width="6" height="16" rx="2" fill="white" fillOpacity="0.95" />
      <rect x="16" y="8" width="8" height="6" rx="2" fill="white" fillOpacity="0.95" />
      <rect x="16" y="18" width="8" height="6" rx="2" fill="white" fillOpacity="0.95" />
      <defs>
        <linearGradient id="brandGradLogin" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4361EE" />
          <stop offset="1" stopColor="#287D79" />
        </linearGradient>
      </defs>
    </svg>
  );
}
