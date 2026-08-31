'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string>('');

  const roles = [
    {
      id: 'admin',
      label: 'Admin / Central Officer',
      description: 'Full access to all modules, risk analysis, configuration, and demo data simulator.',
      icon: '🏛️',
    },
    {
      id: 'monitoring_officer',
      label: 'Monitoring Officer',
      description: 'View assigned centres, batches, alerts, and inspection management.',
      icon: '📋',
    },
    {
      id: 'inspector',
      label: 'Inspector',
      description: 'Mobile inspection interface — view assigned inspections and submit findings.',
      icon: '🔍',
    },
  ];

  function handleEnter() {
    if (!selected) return;
    localStorage.setItem('civis_role', selected);
    router.push('/');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-4xl mb-3">🏛️</div>
          <h1 className="text-3xl font-bold text-navy mb-1">CIVIS Lite</h1>
          <p className="text-gray-600 text-lg">Intelligent Monitoring Prototype</p>
          <p className="text-gray-500 text-sm mt-1">Employability Development Scheme</p>
          <div className="mt-3 inline-block bg-blue-50 border border-blue-200 text-blue-700 text-xs px-3 py-1 rounded-full">
            DEMO PROTOTYPE — No real government data
          </div>
        </div>

        {/* Role selection */}
        <p className="text-center text-gray-600 mb-5 font-medium">Select your role to continue</p>
        <div className="space-y-3 mb-8">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => setSelected(role.id)}
              className={`w-full text-left p-5 rounded-lg border-2 transition-colors ${
                selected === role.id
                  ? 'border-accent bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-4">
                <span className="text-2xl">{role.icon}</span>
                <div>
                  <div className={`font-semibold ${selected === role.id ? 'text-accent' : 'text-navy'}`}>
                    {role.label}
                  </div>
                  <div className="text-sm text-gray-500 mt-0.5">{role.description}</div>
                </div>
                {selected === role.id && (
                  <span className="ml-auto text-accent text-xl">✓</span>
                )}
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={handleEnter}
          disabled={!selected}
          className="w-full py-3 bg-accent text-white font-semibold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-800 transition-colors"
        >
          Enter System →
        </button>

        <p className="text-center text-xs text-gray-400 mt-6">
          This is a proof-of-concept prototype. All data is synthetic and for demonstration purposes only.
        </p>
      </div>
    </div>
  );
}
