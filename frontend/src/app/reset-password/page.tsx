'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from './reset-password.module.css';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams?.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError('Invalid or missing reset token');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setMessage(data.message || 'Password reset successfully!');
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token && !error) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h1>🔒 Reset Password</h1>
            <p>Validating your reset link...</p>
          </div>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div className={styles.spinner}></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !success) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h1>❌ Invalid Link</h1>
            <p>The password reset link is invalid or has expired.</p>
          </div>
          <Link href="/forgot-password" className={styles.backLink}>
            Request a new reset link →
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h1>✅ Password Reset</h1>
            <p>Your password has been reset successfully!</p>
          </div>
          <div className={styles.successMessage}>
            <p>{message}</p>
            <p style={{ fontSize: '14px', color: '#666', marginTop: '12px' }}>
              Redirecting to login...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1>🔒 Reset Password</h1>
          <p>Enter your new password</p>
        </div>

        {error && <div className={styles.error}>{error}</div>}
        {message && <div className={styles.message}>{message}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
            />
          </div>

          <button type="submit" className={styles.resetBtn} disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>

          <div className={styles.footer}>
            <p><Link href="/login">← Back to Login</Link></p>
          </div>
        </form>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';


export default function ResetPasswordPage() { return <Suspense fallback={<div>Loading...</div>}><ResetPasswordContent /></Suspense>; }
