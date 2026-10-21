'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, roleHomePath } from '@/lib/auth';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const [dashboardPath, setDashboardPath] = useState('/login');

  useEffect(() => {
    const s = getSession();
    if (s) {
      setDashboardPath(roleHomePath(s.role));
    }
  }, []);

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
          background: 'var(--c-danger-bg, #FFF0EF)',
          color: 'var(--c-danger, #EE5D50)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 18px',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>

        {/* Heading */}
        <h1 style={{
          fontSize: 20,
          fontWeight: 700,
          color: 'var(--c-text, #1E293B)',
          letterSpacing: '-0.02em',
          margin: '0 0 8px',
        }}>
          Something Went Wrong
        </h1>

        {/* Short Explanation */}
        <p style={{
          fontSize: 13.5,
          color: 'var(--c-text2, #5A6A85)',
          lineHeight: 1.5,
          margin: '0 0 24px',
        }}>
          We couldn’t complete your request. Please try again.
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => reset()}
            className="btn btn-primary"
            style={{ borderRadius: 'var(--radius-sm, 8px)', padding: '9px 18px' }}
          >
            Try Again
          </button>
          <button
            type="button"
            onClick={() => router.push(dashboardPath)}
            className="btn btn-ghost"
            style={{ borderRadius: 'var(--radius-sm, 8px)', padding: '9px 18px' }}
          >
            Go to Dashboard
          </button>
        </div>
      </div>

      <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--c-text3, #75839C)', marginTop: 20 }}>
        CIVIS Monitoring Platform &bull; Employability Development Scheme
      </p>
    </div>
  );
}
