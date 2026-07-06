'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './register.module.css';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    clinicName: '',
    clinicEmail: '',
    phone: '',
    country: 'Kenya',
    county: '',
    address: '',
    mflCode: '',
    adminName: '',
    adminEmail: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:3001/api/auth/register-clinic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicName: formData.clinicName,
          clinicEmail: formData.clinicEmail,
          phone: formData.phone,
          country: formData.country,
          county: formData.county,
          address: formData.address,
          mflCode: formData.mflCode,
          adminName: formData.adminName,
          adminEmail: formData.adminEmail,
          password: formData.password
        })
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/register/success');
      } else {
        setError(data.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1>ðŸ¥ Start Your Clinic</h1>
          <p>Register your clinic and start using CLINIC EMR</p>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.section}>
            <h2>Clinic Information</h2>
            <div className={styles.formGroup}>
              <label>Clinic Name *</label>
              <input type="text" name="clinicName" value={formData.clinicName} onChange={handleChange} placeholder="e.g., Fransline Medical Centre" required />
            </div>
            <div className={styles.formGroup}>
              <label>Clinic Email</label>
              <input type="email" name="clinicEmail" value={formData.clinicEmail} onChange={handleChange} placeholder="info@clinic.com" />
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Phone</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+254 700 000 000" />
              </div>
              <div className={styles.formGroup}>
                <label>Country</label>
                <select name="country" value={formData.country} onChange={handleChange}>
                  <option value="Kenya">Kenya</option>
                  <option value="Uganda">Uganda</option>
                  <option value="Tanzania">Tanzania</option>
                  <option value="Rwanda">Rwanda</option>
                  <option value="Nigeria">Nigeria</option>
                  <option value="South Africa">South Africa</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>County</label>
                <input type="text" name="county" value={formData.county} onChange={handleChange} placeholder="County" />
              </div>
              <div className={styles.formGroup}>
                <label>MFL Code</label>
                <input type="text" name="mflCode" value={formData.mflCode} onChange={handleChange} placeholder="Ministry of Health Code" />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Address</label>
              <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="Street, building, area" />
            </div>
          </div>

          <div className={styles.divider}></div>

          <div className={styles.section}>
            <h2>Administrator Account</h2>
            <div className={styles.formGroup}>
              <label>Full Name *</label>
              <input type="text" name="adminName" value={formData.adminName} onChange={handleChange} placeholder="Dr. John Doe" required />
            </div>
            <div className={styles.formGroup}>
              <label>Email Address *</label>
              <input type="email" name="adminEmail" value={formData.adminEmail} onChange={handleChange} placeholder="admin@yourclinic.com" required />
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Password *</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Min. 6 characters" required />
              </div>
              <div className={styles.formGroup}>
                <label>Confirm Password *</label>
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm password" required />
              </div>
            </div>
          </div>

          <button type="submit" className={styles.registerBtn} disabled={loading}>
            {loading ? 'Registering...' : 'Start Your Clinic ðŸš€'}
          </button>

          <div className={styles.footer}>
            <p>Already have an account? <Link href="/login">Sign In</Link></p>
            <p className={styles.terms}>By registering, you agree to our Terms of Service and Privacy Policy</p>
          </div>
        </form>
      </div>
    </div>
  );
}