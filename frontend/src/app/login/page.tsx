'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import api from '../../lib/api';
import styles from './login.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [superAdminMode, setSuperAdminMode] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'CLINIC EMR';
  const redirectingRef = useRef(false);

  const handleLogoClick = () => {
    setLogoClicks(prev => {
      const newClicks = prev + 1;
      if (newClicks >= 5) {
        setSuperAdminMode(true);
        return 0;
      }
      return newClicks;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (redirectingRef.current) return;

    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { email, password });

      localStorage.setItem('accessToken', res.data.accessToken);
      document.cookie = 'accessToken=' + res.data.accessToken + '; path=/; max-age=86400';
      localStorage.setItem('refreshToken', res.data.refreshToken);
      localStorage.setItem('userId', res.data.user.id);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      redirectingRef.current = true;

      if (res.data.user.role === 'SUPER_ADMIN') {
        window.location.href = '/super-admin';
        return;
      }

      try {
        const setupRes = await api.get('/setup/status');
        window.location.href = setupRes.data.completed ? '/dashboard' : '/setup';
      } catch (setupErr) {
        console.error('Setup status check failed:', setupErr);
        setError('Login succeeded but could not load dashboard. Please try again.');
        setLoading(false);
        redirectingRef.current = false;
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password');
      setLoading(false);
      redirectingRef.current = false;
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:3001/api/auth/google';
  };

  return (
    <div className={styles.container}>
      <div className={styles.bg}>
        <div className={styles.bgOverlay}></div>
      </div>

      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.logo} onClick={handleLogoClick} style={{ cursor: 'default', userSelect: 'none' }}>
            {appName}
            {superAdminMode && <span style={{ fontSize: '12px', color: '#F59E0B', display: 'block' }}>🔑 Super Admin Mode</span>}
          </h1>
          <p className={styles.subtitle}>{superAdminMode ? 'Super Admin Access' : 'Sign in to continue'}</p>
        </div>
        {error && (
          <div className={styles.error}>
            <span>!</span>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Email Address</label>
            <input
              type="email"
              className={styles.input}
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={superAdminMode ? 'superadmin@system.com' : 'doctor@clinic.com'}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Password</label>
            <input
              type="password"
              className={styles.input}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          <div className={styles.options}>
            <label className={styles.checkbox}>
              <input type="checkbox" /> Remember me
            </label>
            <Link href="/forgot-password" className={styles.forgotLink}>
              Forgot password?
            </Link>
          </div>
          <button
            type="submit"
            disabled={loading}
            className={styles.loginBtn}
            style={superAdminMode ? { background: '#F59E0B', borderColor: '#D97706' } : {}}
          >
            {loading ? 'Signing in...' : superAdminMode ? '🔓 Access Super Admin' : 'Sign In'}
          </button>
        </form>
        {!superAdminMode && (
          <>
            <div className={styles.divider}>
              <span className={styles.dividerLine}></span>
              <span className={styles.dividerText}>Or continue with</span>
              <span className={styles.dividerLine}></span>
            </div>
            <button type="button" onClick={handleGoogleLogin} className={styles.googleBtn}>
              <svg className={styles.googleIcon} viewBox="0 0 24 24" width="20" height="20">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Sign in with Google
            </button>
          </>
        )}
        <div className={styles.footer}>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '8px', fontSize: '12px' }}>
            <Link href="/terms" style={{ color: '#6B7280', textDecoration: 'none' }}>Terms of Service</Link>
            <span style={{ color: '#D1D5DB' }}>|</span>
            <Link href="/privacy" style={{ color: '#6B7280', textDecoration: 'none' }}>Privacy Policy</Link>
            <span style={{ color: '#D1D5DB' }}>|</span>
            <Link href="/refund" style={{ color: '#6B7280', textDecoration: 'none' }}>Refund Policy</Link>
          </div>
          <p>Secure healthcare platform</p>
          <p className={styles.version}>Version 2.0</p>
        </div>
      </div>
    </div>
  );
}