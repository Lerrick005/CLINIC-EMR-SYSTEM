'use client';
import { useState } from 'react';

const SECRET_CODE = 'lerrick-recover-2026';

export default function RecoverPage() {
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [verified, setVerified] = useState(false);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (code === SECRET_CODE) { setVerified(true); setMessage(''); }
    else { setMessage('Invalid recovery code'); }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${API_URL}/auth/recover-super-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recoveryCode: SECRET_CODE, newPassword })
      });
      const data = await res.json();
      setMessage(data.success ? 'Password reset! Go to /login' : data.error);
    } catch { setMessage('Failed. Contact support.'); }
  };

  return (
    <div style={{ maxWidth: 400, margin: '100px auto', padding: 40, background: 'white', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
      <h1>🔐 System Recovery</h1>
      {!verified ? (
        <form onSubmit={handleVerify}>
          <input type="password" value={code} onChange={e => setCode(e.target.value)} placeholder="Recovery code" style={{ width: '100%', padding: 10, marginBottom: 10 }} required />
          <button type="submit" style={{ width: '100%', padding: 12, background: '#7A1E2C', color: 'white', border: 'none', borderRadius: 8 }}>Verify</button>
        </form>
      ) : (
        <form onSubmit={handleReset}>
          <p>Reset super admin password</p>
          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password" style={{ width: '100%', padding: 10, marginBottom: 10 }} required minLength={6} />
          <button type="submit" style={{ width: '100%', padding: 12, background: '#7A1E2C', color: 'white', border: 'none', borderRadius: 8 }}>Reset Password</button>
        </form>
      )}
      {message && <p style={{ marginTop: 10, color: message.includes('success') ? 'green' : 'red' }}>{message}</p>}
    </div>
  );
}