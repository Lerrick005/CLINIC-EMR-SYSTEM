'use client';

import Link from 'next/link';

export default function RegistrationSuccess() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '24px',
        padding: '48px',
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1A1A1A', marginBottom: '8px' }}>Registration Successful!</h1>
        <p style={{ color: '#666', fontSize: '16px', lineHeight: '1.6' }}>
          Your clinic has been registered successfully.
          You can now log in with your admin credentials.
        </p>
        <div style={{ marginTop: '32px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Link href="/login">
            <button style={{
              padding: '12px 32px',
              background: 'linear-gradient(135deg, #FFD700 0%, #CFAF00 100%)',
              border: 'none',
              borderRadius: '40px',
              color: '#1A1A1A',
              fontSize: '16px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}>
              Go to Login
            </button>
          </Link>
        </div>
        <p style={{ marginTop: '24px', fontSize: '12px', color: '#999' }}>
          We've sent a confirmation email to your inbox.
        </p>
      </div>
    </div>
  );
}