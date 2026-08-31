'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

const NAV = [
  { label: 'Dashboard', href: '/', icon: '▦' },
  { label: 'MONITORING', type: 'group' },
  { label: 'Centres', href: '/centres', icon: '⬡' },
  { label: 'Batches', href: '/batches', icon: '≡' },
  { label: 'Beneficiaries', href: '/beneficiaries', icon: '⚇' },
  { label: 'VERIFICATION', type: 'group' },
  { label: 'Beneficiary Matching', href: '/matching', icon: '⇔' },
  { label: 'Anomaly Detection', href: '/anomalies', icon: '!' },
  { label: 'Risk Analysis', href: '/risk', icon: '◕' },
  { label: 'Evidence Verification', href: '/evidence', icon: '⊞' },
  { label: 'INSPECTION', type: 'group' },
  { label: 'Priority List', href: '/priority', icon: '★' },
  { label: 'Inspections', href: '/inspections', icon: '◎' },
  { label: 'Corrective Actions', href: '/corrective-actions', icon: '✓' },
  { label: 'SYSTEM', type: 'group' },
  { label: 'Rules & Config', href: '/settings', icon: '⚙' },
  { label: 'Demo Data', href: '/demo', icon: '⬡' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [role, setRole] = useState('admin');

  useEffect(() => {
    const r = localStorage.getItem('civis_role') || 'admin';
    setRole(r);
  }, []);

  function changeRole(r: string) {
    setRole(r);
    localStorage.setItem('civis_role', r);
  }

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <div className="fixed top-0 left-0 h-full w-64 flex flex-col z-40"
      style={{ backgroundColor: '#1A2B4A', color: 'white' }}>
      <div className="px-5 py-5 border-b border-blue-900">
        <div className="text-lg font-bold text-white">CIVIS Lite</div>
        <div className="text-xs text-blue-300 mt-0.5">Monitoring Prototype</div>
        <div className="mt-2 text-xs bg-blue-900 rounded px-2 py-1 text-blue-200 inline-block">DEMO MODE</div>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        {NAV.map((item, i) => {
          if (item.type === 'group') {
            return (
              <div key={i} className="mt-4 mb-1 px-2 text-xs font-semibold tracking-widest text-blue-400 uppercase">
                {item.label}
              </div>
            );
          }
          const active = isActive(item.href!);
          return (
            <Link key={item.href} href={item.href!}
              className="flex items-center gap-2.5 px-3 py-2 rounded text-sm mb-0.5 transition-colors"
              style={{
                backgroundColor: active ? '#1D6FA4' : 'transparent',
                color: active ? 'white' : '#93C5FD',
              }}>
              <span className="w-4 text-center">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-4 border-t border-blue-900">
        <div className="text-xs text-blue-400 mb-1.5">Current Role</div>
        <select value={role} onChange={e => changeRole(e.target.value)}
          className="w-full text-xs rounded px-2 py-1.5"
          style={{ backgroundColor: '#0F1E35', color: '#93C5FD', border: '1px solid #1D6FA4' }}>
          <option value="admin">Admin / Central Officer</option>
          <option value="monitoring_officer">Monitoring Officer</option>
          <option value="inspector">Inspector</option>
        </select>
      </div>
    </div>
  );
}
