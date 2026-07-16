'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function AuthSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams?.get('accessToken') || null;
    const refreshToken = searchParams?.get('refreshToken') || null;
    const userId = searchParams?.get('userId') || null;

    if (accessToken && refreshToken && userId) {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('userId', userId);
      
      // Fetch user data
      fetch('/api/auth/me', {
        headers: {
          'Authorization': 'Bearer ' + accessToken
        }
      })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        router.push('/dashboard');
      })
      .catch(() => {
        router.push('/login');
      });
    } else {
      router.push('/login');
    }
  }, [router, searchParams]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      color: '#64748B'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
        <div>Completing login...</div>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';


export default function AuthSuccessPage() { return <Suspense fallback={<div>Loading...</div>}><AuthSuccessContent /></Suspense>; }
