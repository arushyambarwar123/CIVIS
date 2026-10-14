'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, roleHomePath, roleLabel, CivisSession } from '@/lib/auth';

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
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#F7F8F6', color: '#64717D', fontSize: 13,
      }}>
        Loading...
      </div>
    );
  }

  const dashboardPath = session ? roleHomePath(session.role) : '/login';
  const dashboardLabel = session ? `${roleLabel(session.role)} Dashboard` : 'Sign In';

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#F7F8F6',
      padding: '40px 24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 460,
        background: '#fff',
        border: '1px solid #DCE2E3',
        borderRadius: 4,
        padding: '40px 32px',
        textAlign: 'center',
      }}>
        {/* 404 tag */}
        <div style={{
          fontSize: 11,
          fontWeight: 600,
          color: '#B54747',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 12,
        }}>
          404 &mdash; Page Not Found
        </div>

        {/* Heading */}
        <h1 style={{
          fontSize: 22,
          fontWeight: 600,
          color: '#172B4D',
          marginBottom: 8,
          letterSpacing: '-0.01em',
        }}>
          This page does not exist
        </h1>

        {/* Description */}
        <p style={{
          fontSize: 13,
          color: '#64717D',
          lineHeight: '20px',
          marginBottom: 28,
        }}>
          The URL you requested could not be matched to any page in CIVIS.
          Please check the address or return to your dashboard.
        </p>

        {/* Action button */}
        <button
          type="button"
          onClick={() => router.push(dashboardPath)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 24px',
            fontSize: 14,
            fontWeight: 500,
            borderRadius: 4,
            border: 'none',
            background: '#172B4D',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          {dashboardLabel}
        </button>

        {session && (
          <div style={{
            marginTop: 16,
            fontSize: 12,
            color: '#A0AEB0',
          }}>
            Signed in as{' '}
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#64717D' }}>
              {session.employee_id}
            </span>
            {' '}&middot;{' '}
            <span style={{ color: '#64717D' }}>{roleLabel(session.role)}</span>
          </div>
        )}
      </div>

      <p style={{ textAlign: 'center', fontSize: 11, color: '#C0C8CC', marginTop: 20 }}>
        CIVIS Monitoring Platform &mdash; Demonstration Prototype
      </p>
    </div>
  );
}
