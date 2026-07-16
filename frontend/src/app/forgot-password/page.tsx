'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './forgot-password.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setMessage(data.message || 'Password reset email sent. Please check your inbox.');
      } else {
        setError(data.error || 'Failed to send reset email');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h1>📧 Check Your Email</h1>
            <p>We've sent a password reset link to <strong>{email}</strong></p>
          </div>
          <div className={styles.successMessage}>
            <p>{message}</p>
            <p style={{ fontSize: '14px', color: '#666', marginTop: '12px' }}>The link will expire in 1 hour.</p>
          </div>
          <Link href="/login" className={styles.backLink}>← Back to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}><h1>🔒 Forgot Password</h1><p>Enter your email to reset your password</p></div>
        {error && <div className={styles.error}>{error}</div>}
        {message && <div className={styles.message}>{message}</div>}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}><label>Email Address</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="doctor@clinic.com" required /></div>
          <button type="submit" className={styles.resetBtn} disabled={loading}>{loading ? 'Sending...' : 'Send Reset Link'}</button>
          <div className={styles.footer}><p>Remember your password? <Link href="/login">Sign In</Link></p></div>
        </form>
      </div>
    </div>
  );
}