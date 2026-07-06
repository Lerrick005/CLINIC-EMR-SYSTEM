'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../lib/api';
import styles from './newPatient.module.css';

export default function NewPatientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.firstName || !formData.lastName) {
      setError('First name and last name are required');
      setLoading(false);
      return;
    }

    try {
      const res = await api.post('/patients', formData);
      if (res.data.success) {
        router.push('/patients');
      } else {
        setError('Failed to create patient');
      }
    } catch (err: any) {
      console.error('Error creating patient:', err);
      setError(err.response?.data?.error || 'Could not create patient');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => router.back()} className={styles.backButton}>← Back</button>
        <h1 className={styles.title}>Add New Patient</h1>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Personal Information</h2>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>First Name <span className={styles.required}>*</span></label>
              <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className={styles.input} required />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Last Name <span className={styles.required}>*</span></label>
              <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className={styles.input} required />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Date of Birth</label>
              <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className={styles.input} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className={styles.select}>
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Contact Information</h2>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Phone</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={styles.input} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className={styles.input} />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Address</label>
            <textarea name="address" value={formData.address} onChange={handleChange} className={styles.textarea} rows={2} />
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Emergency Contact</h2>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Contact Name</label>
              <input type="text" name="emergencyContactName" value={formData.emergencyContactName} onChange={handleChange} className={styles.input} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Contact Phone</label>
              <input type="tel" name="emergencyContactPhone" value={formData.emergencyContactPhone} onChange={handleChange} className={styles.input} />
            </div>
          </div>
        </div>

        <div className={styles.buttonGroup}>
          <button type="button" onClick={() => router.back()} className={styles.cancelButton}>Cancel</button>
          <button type="submit" disabled={loading} className={styles.submitButton}>
            {loading ? 'Saving...' : 'Save Patient'}
          </button>
        </div>
      </form>
    </div>
  );
}