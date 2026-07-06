'use client';

import { useState, useEffect } from 'react';
import api from '../../lib/api';
import styles from './PatientModal.module.css';

interface PatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  patient?: any; // For editing
}

export default function PatientModal({ isOpen, onClose, onSuccess, patient }: PatientModalProps) {
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

  useEffect(() => {
    if (patient) {
      setFormData({
        firstName: patient.first_name || '',
        lastName: patient.last_name || '',
        dateOfBirth: patient.date_of_birth || '',
        gender: patient.gender || '',
        phone: patient.phone || '',
        email: patient.email || '',
        address: patient.address || '',
        emergencyContactName: patient.emergency_contact_name || '',
        emergencyContactPhone: patient.emergency_contact_phone || ''
      });
    } else {
      setFormData({
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
    }
  }, [patient]);

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
      let res;
      if (patient) {
        res = await api.put(`/patients/${patient.id}`, formData);
      } else {
        res = await api.post('/patients', formData);
      }
      
      if (res.data.success) {
        onSuccess();
        onClose();
      } else {
        setError('Failed to save patient');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not save patient');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{patient ? 'Edit Patient' : 'Add New Patient'}</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Personal Information</h3>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>First Name <span className={styles.required}>*</span></label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required />
              </div>
              <div className={styles.formGroup}>
                <label>Last Name <span className={styles.required}>*</span></label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required />
              </div>
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Date of Birth</label>
                <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} />
              </div>
              <div className={styles.formGroup}>
                <label>Gender</label>
                <select name="gender" value={formData.gender} onChange={handleChange}>
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Contact Information</h3>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Phone</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} />
              </div>
              <div className={styles.formGroup}>
                <label>Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Address</label>
              <textarea name="address" value={formData.address} onChange={handleChange} rows={2} />
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Emergency Contact</h3>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Contact Name</label>
                <input type="text" name="emergencyContactName" value={formData.emergencyContactName} onChange={handleChange} />
              </div>
              <div className={styles.formGroup}>
                <label>Contact Phone</label>
                <input type="tel" name="emergencyContactPhone" value={formData.emergencyContactPhone} onChange={handleChange} />
              </div>
            </div>
          </div>

          <div className={styles.buttonGroup}>
            <button type="button" onClick={onClose} className={styles.cancelBtn}>Cancel</button>
            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? 'Saving...' : (patient ? 'Update Patient' : 'Add Patient')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}