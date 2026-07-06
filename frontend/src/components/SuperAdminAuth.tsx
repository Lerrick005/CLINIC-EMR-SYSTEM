'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../lib/api';

interface SuperAdminAuthProps {
  children: React.ReactNode;
}

export default function SuperAdminAuth({ children }: SuperAdminAuthProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showPrompt, setShowPrompt] = useState(true);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if already authenticated in this session
    const superAdminAuth = sessionStorage.getItem('superAdminAuth');
    if (superAdminAuth === 'true') {
      setIsAuthenticated(true);
      setIsLoading(false);
      setShowPrompt(false);
      return;
    }

    // Check if user is SUPER_ADMIN
    try {
      const user = localStorage.getItem('user');
      if (user) {
        const parsed = JSON.parse(user);
        if (parsed.role !== 'SUPER_ADMIN') {
          router.push('/dashboard');
          return;
        }
      } else {
        router.push('/login');
        return;
      }
    } catch (e) {
      router.push('/login');
      return;
    }

    setIsLoading(false);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLocked) {
      setError('Too many failed attempts. Please try again later.');
      return;
    }

    try {
      const response = await api.post('/auth/verify-super-admin', {
        password: password
      });

      if (response.data.success) {
        sessionStorage.setItem('superAdminAuth', 'true');
        setIsAuthenticated(true);
        setShowPrompt(false);
        setPassword('');
        setAttempts(0);
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        if (newAttempts >= 3) {
          setIsLocked(true);
          setError('Too many failed attempts. Locked for 5 minutes.');
          setTimeout(() => {
            setIsLocked(false);
            setAttempts(0);
          }, 5 * 60 * 1000);
        } else {
          setError('Invalid password. ' + (3 - newAttempts) + ' attempt(s) remaining.');
        }
        setPassword('');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'An error occurred. Please try again.');
      setPassword('');
    }
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        color: '#64748B'
      }}>
        Loading...
      </div>
    );
  }

  if (showPrompt && !isAuthenticated) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#F8FAFC'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          width: '400px',
          maxWidth: '90%'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '48px', marginBottom: '8px' }}>🔐</div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0F172A', margin: 0 }}>
              Super Admin Access
            </h2>
            <p style={{ color: '#64748B', fontSize: '14px', marginTop: '4px' }}>
              Enter the super admin password to continue
            </p>
            {isLocked && (
              <p style={{ color: '#DC2626', fontSize: '14px', marginTop: '8px', fontWeight: '600' }}>
                🔒 Account locked. Please try again later.
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#0F172A',
                marginBottom: '4px'
              }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter super admin password"
                disabled={isLocked}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid ' + (error ? '#DC2626' : '#E2E8F0'),
                  borderRadius: '8px',
                  fontSize: '16px',
                  background: isLocked ? '#F1F5F9' : 'white',
                  cursor: isLocked ? 'not-allowed' : 'text'
                }}
                autoFocus
                required
              />
              {error && (
                <p style={{ color: '#DC2626', fontSize: '13px', marginTop: '4px' }}>
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLocked}
              style={{
                width: '100%',
                padding: '12px',
                background: isLocked ? '#94A3B8' : '#2563EB',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: isLocked ? 'not-allowed' : 'pointer'
              }}
            >
              {isLocked ? '🔒 Locked' : '🔓 Unlock Super Admin'}
            </button>
          </form>

          <div style={{
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid #E2E8F0',
            textAlign: 'center'
          }}>
            <button
              onClick={() => router.push('/dashboard')}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748B',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              ← Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
