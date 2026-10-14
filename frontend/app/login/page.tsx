'use client';
import { useState } from 'react';
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
  const [showDemo, setShowDemo] = useState(false);

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
    <div style={{ minHeight: '100vh', background: '#F7F8F6', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>

      {/* Prototype notice */}
      <div style={{ position: 'absolute', top: 20, right: 24, display: 'flex', gap: 8, alignItems: 'center' }}>
        <span className="demo-banner">Demonstration Prototype</span>
        <span style={{ fontSize: 11, color: '#A0AEB0' }}>All data is synthetic</span>
      </div>

      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Wordmark */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <CivisMark size={36} />
            <div>
              <div style={{ fontSize: 22, fontWeight: 600, color: '#172B4D', letterSpacing: '-0.02em', lineHeight: 1 }}>CIVIS</div>
              <div style={{ fontSize: 12, color: '#64717D', marginTop: 2 }}>Central Intelligent Verification &amp; Inspection System</div>
            </div>
          </div>
          <div style={{ fontSize: 13, color: '#64717D', borderTop: '1px solid #DCE2E3', paddingTop: 12, marginTop: 4 }}>
            Employability Development Scheme — Monitoring Platform
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#202B35', marginBottom: 5 }}>
              Employee ID
            </label>
            <input
              type="text"
              value={employeeId}
              onChange={e => setEmployeeId(e.target.value)}
              placeholder="e.g. INS-PUN-001"
              autoComplete="username"
              style={{
                width: '100%', padding: '9px 12px', fontSize: 14, borderRadius: 4,
                border: '1px solid #DCE2E3', background: '#fff', color: '#202B35',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#202B35', marginBottom: 5 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
              style={{
                width: '100%', padding: '9px 12px', fontSize: 14, borderRadius: 4,
                border: '1px solid #DCE2E3', background: '#fff', color: '#202B35',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 4, marginBottom: 14,
              background: '#FDEAEA', border: '1px solid #E8C4C4', color: '#B54747', fontSize: 13,
            }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '10px 20px',
            background: loading ? '#64717D' : '#172B4D',
            color: '#fff', fontSize: 14, fontWeight: 500, borderRadius: 4,
            border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
          }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Demo credentials panel */}
        <div style={{ marginTop: 24 }}>
          <button
            type="button"
            onClick={() => setShowDemo(!showDemo)}
            style={{
              width: '100%', textAlign: 'left', padding: '10px 14px',
              background: '#EFF2F1', border: '1px solid #DCE2E3',
              borderRadius: 4, cursor: 'pointer', fontSize: 12, color: '#64717D', fontWeight: 500,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}
          >
            <span>Demo Credentials</span>
            <span style={{ fontSize: 10 }}>{showDemo ? 'Hide' : 'Show'}</span>
          </button>
          {showDemo && (
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {DEMO_ACCOUNTS.map(acc => (
                <div key={acc.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 14px', background: '#fff', border: '1px solid #DCE2E3', borderRadius: 4,
                }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#202B35' }}>{acc.label}</div>
                    <div style={{ fontSize: 11, color: '#64717D', fontFamily: "'IBM Plex Mono', monospace", marginTop: 2 }}>
                      {acc.id} / {acc.password}
                    </div>
                  </div>
                  <button type="button" onClick={() => fillDemo(acc.id, acc.password)} style={{
                    fontSize: 11, padding: '4px 10px', borderRadius: 4,
                    background: '#EFF2F1', border: '1px solid #DCE2E3',
                    color: '#287D79', fontWeight: 500, cursor: 'pointer',
                  }}>
                    Fill
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#C0C8CC', marginTop: 20, lineHeight: '16px' }}>
          This is a proof-of-concept prototype for demonstration purposes.<br />
          No real government data, beneficiary records, or official integrations are used.
        </p>
      </div>
    </div>
  );
}

function CivisMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="4" fill="#287D79" />
      <rect x="7" y="7" width="5" height="14" rx="1" fill="white" fillOpacity="0.9" />
      <rect x="14" y="7" width="7" height="5" rx="1" fill="white" fillOpacity="0.9" />
      <rect x="14" y="16" width="7" height="5" rx="1" fill="white" fillOpacity="0.9" />
    </svg>
  );
}
