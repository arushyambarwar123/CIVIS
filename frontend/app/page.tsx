'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, roleHomePath } from '@/lib/auth';

/**
 * Root page — redirects every user to their role-specific dashboard.
 * No content is rendered here.
 */
export default function RootRedirect() {
  const router = useRouter();

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace('/login');
    } else {
      router.replace(roleHomePath(session.role));
    }
  }, [router]);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#F7F8F6', color: '#64717D', fontSize: 13,
    }}>
      Redirecting...
    </div>
  );
}
