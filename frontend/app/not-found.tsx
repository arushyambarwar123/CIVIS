'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, roleHomePath, CivisSession } from '@/lib/auth';

export default function NotFoundPage() {
  const router = useRouter();
  const [session, setSession] = useState<CivisSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const s = getSession();
    setSession(s);
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--c-bg, #F4F7FE)',
        color: 'var(--c-text2, #5A6A85)',
        fontSize: 13,
      }}>
        Loading...
      </div>
    );
  }

  const dashboardPath = session ? roleHomePath(session.role) : '/login';

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--c-bg, #F4F7FE)',
      padding: '24px',
    }}>
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 440,
          padding: '36px 32px',
          textAlign: 'center',
          boxShadow: 'var(--shadow-md, 0 2px 8px rgba(0,0,0,0.06))',
        }}
      >
        {/* Subtle Icon */}
        <div style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: 'var(--c-surface2, #F0F3F9)',
          color: 'var(--c-accent, #4361EE)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 18px',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M16 16s-1.5-2-4-2-4 2-4 2"></path>
            <line x1="9" y1="9" x2="9.01" y2="9"></line>
            <line x1="15" y1="9" x2="15.01" y2="9"></line>
          </svg>
        </div>

        {/* 404 Status Pill */}
        <div style={{
          display: 'inline-block',
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--c-text3, #75839C)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: 8,
        }}>
          Error 404
        </div>

        {/* Concise Heading */}
        <h1 style={{
          fontSize: 20,
          fontWeight: 700,
          color: 'var(--c-text, #1E293B)',
          letterSpacing: '-0.02em',
          margin: '0 0 8px',
        }}>
          Page Not Found
        </h1>

        {/* Short Explanation */}
        <p style={{
          fontSize: 13.5,
          color: 'var(--c-text2, #5A6A85)',
          lineHeight: 1.5,
          margin: '0 0 24px',
        }}>
          The page you are looking for does not exist or may have been moved.
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => router.push(dashboardPath)}
            className="btn btn-primary"
            style={{ borderRadius: 'var(--radius-sm, 8px)', padding: '9px 18px' }}
          >
            Go to Dashboard
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="btn btn-ghost"
            style={{ borderRadius: 'var(--radius-sm, 8px)', padding: '9px 18px' }}
          >
            Go Back
          </button>
        </div>
      </div>

      <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--c-text3, #75839C)', marginTop: 20 }}>
        CIVIS Monitoring Platform &bull; Employability Development Scheme
      </p>
    </div>
  );
}
