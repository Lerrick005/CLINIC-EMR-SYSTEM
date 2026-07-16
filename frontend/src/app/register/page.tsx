'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from './register.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); setLoading(false); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); setLoading(false); return; }

    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      });
      const data = await res.json();
      if (res.ok) { setSuccess(true); }
      else { setError(data.error || 'Failed to reset password'); }
    } catch (err) { setError('Network error.'); }
    finally { setLoading(false); }
  };

  if (!token) return <div className={styles.container}><div className={styles.card}><h1>Invalid Link</h1><p>This reset link is invalid or missing a token.</p><Link href="/forgot-password">Request new reset link</Link></div></div>;
  if (success) return <div className={styles.container}><div className={styles.card}><h1>✅ Password Reset</h1><p>Your password has been reset successfully.</p><Link href="/login">Sign In</Link></div></div>;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}><h1>🔒 Reset Password</h1><p>Enter your new password</p></div>
        {error && <div className={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}><label>New Password</label><input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min. 6 characters" required /></div>
          <div className={styles.formGroup}><label>Confirm Password</label><input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm password" required /></div>
          <button type="submit" className={styles.resetBtn} disabled={loading}>{loading ? 'Resetting...' : 'Reset Password'}</button>
          <div className={styles.footer}><p><Link href="/login">← Back to Login</Link></p></div>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className={styles.container}><div className={styles.card}><h1>Loading...</h1></div></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}

export const dynamic = 'force-dynamic';
