'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import '../globals.css';

export default function SetupWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [superAdmin, setSuperAdmin] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  });

  const [clinic, setClinic] = useState({
    name: '',
    mflCode: '',
    address: '',
    phone: '',
    email: '',
    county: '',
    subcounty: '',
    ward: ''
  });

  const [admin, setAdmin] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!superAdmin.email || !superAdmin.password) {
      setError('Super Admin email and password are required');
      setLoading(false);
      return;
    }
    if (!clinic.name) {
      setError('Clinic name is required');
      setLoading(false);
      return;
    }
    if (!admin.email || !admin.password) {
      setError('Clinic Admin email and password are required');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:3001/api/setup/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ superAdmin, clinic, admin })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Setup failed');

      alert('Setup complete! Please log in.');
      router.push('/login');
    } catch (err: any) {
      console.error('Setup error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="setup-container">
      <div className="setup-card">
        <div className="setup-header">
          <h1>🏥 CLINIC EMR</h1>
          <p>First‑time Setup Wizard</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>1. Super Administrator Account</h2>
              <div className="space-y-4">
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={superAdmin.email} onChange={e => setSuperAdmin({...superAdmin, email: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input type="password" value={superAdmin.password} onChange={e => setSuperAdmin({...superAdmin, password: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>First Name</label>
                  <input type="text" value={superAdmin.firstName} onChange={e => setSuperAdmin({...superAdmin, firstName: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input type="text" value={superAdmin.lastName} onChange={e => setSuperAdmin({...superAdmin, lastName: e.target.value})} />
                </div>
              </div>
              <button type="button" className="btn btn-primary" onClick={() => setStep(2)} style={{ marginTop: '1.5rem' }}>Next</button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>2. Clinic Details</h2>
              <div className="space-y-4">
                <div className="form-group"><label>Clinic Name *</label><input type="text" value={clinic.name} onChange={e => setClinic({...clinic, name: e.target.value})} required /></div>
                <div className="form-group"><label>MFL Code</label><input type="text" value={clinic.mflCode} onChange={e => setClinic({...clinic, mflCode: e.target.value})} /></div>
                <div className="form-group"><label>Address</label><input type="text" value={clinic.address} onChange={e => setClinic({...clinic, address: e.target.value})} /></div>
                <div className="form-group"><label>Phone</label><input type="tel" value={clinic.phone} onChange={e => setClinic({...clinic, phone: e.target.value})} /></div>
                <div className="form-group"><label>Email</label><input type="email" value={clinic.email} onChange={e => setClinic({...clinic, email: e.target.value})} /></div>
                <div className="form-group"><label>County</label><input type="text" value={clinic.county} onChange={e => setClinic({...clinic, county: e.target.value})} /></div>
                <div className="form-group"><label>Subcounty</label><input type="text" value={clinic.subcounty} onChange={e => setClinic({...clinic, subcounty: e.target.value})} /></div>
                <div className="form-group"><label>Ward</label><input type="text" value={clinic.ward} onChange={e => setClinic({...clinic, ward: e.target.value})} /></div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>Back</button>
                <button type="button" className="btn btn-primary" onClick={() => setStep(3)}>Next</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>3. Clinic Administrator Account</h2>
              <div className="space-y-4">
                <div className="form-group"><label>Email *</label><input type="email" value={admin.email} onChange={e => setAdmin({...admin, email: e.target.value})} required /></div>
                <div className="form-group"><label>Password *</label><input type="password" value={admin.password} onChange={e => setAdmin({...admin, password: e.target.value})} required /></div>
                <div className="form-group"><label>First Name</label><input type="text" value={admin.firstName} onChange={e => setAdmin({...admin, firstName: e.target.value})} /></div>
                <div className="form-group"><label>Last Name</label><input type="text" value={admin.lastName} onChange={e => setAdmin({...admin, lastName: e.target.value})} /></div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setStep(2)}>Back</button>
                <button type="submit" className="btn btn-success" disabled={loading}>
                  {loading ? 'Setting up...' : 'Complete Setup'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}