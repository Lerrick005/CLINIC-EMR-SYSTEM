'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '../../../lib/api';
import styles from './new.module.css';

export default function NewReferralPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientIdParam = searchParams?.get('patientId');

  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [formData, setFormData] = useState({
    patient_id: patientIdParam || '',
    specialty: '',
    urgency: 'routine',
    status: 'generated',
    reason_for_referral: '',
    clinical_notes: '',
    facility_name: '',
    facility_address: '',
    facility_phone: '',
    contact_person: '',
  });

  const specialties = [
    'Cardiology',
    'Dermatology',
    'Endocrinology',
    'Gastroenterology',
    'Neurology',
    'Obstetrics and Gynecology',
    'Oncology',
    'Ophthalmology',
    'Orthopedics',
    'Otolaryngology (ENT)',
    'Pediatrics',
    'Psychiatry',
    'Pulmonology',
    'Rheumatology',
    'Urology',
    'General Surgery',
    'Internal Medicine',
    'Family Medicine',
    'Other'
  ];

  const urgencies = [
    { value: 'routine', label: 'Routine' },
    { value: 'urgent', label: 'Urgent' },
    { value: 'emergency', label: 'Emergency' },
  ];

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const res = await api.get('/patients');
      if (res.data.success) {
        setPatients(res.data.patients);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patient_id || !formData.specialty || !formData.reason_for_referral) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/referrals', formData);
      if (res.data.success) {
        alert('Referral created successfully!');
        router.push('/referrals');
      } else {
        alert('Failed to create referral');
      }
    } catch (error) {
      console.error('Error creating referral:', error);
      alert('Error creating referral');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => router.back()} className={styles.backBtn}>
          ← Back
        </button>
        <h1 className={styles.title}>New Referral</h1>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Patient Information</h3>
          <div className={styles.formGroup}>
            <label>Select Patient *</label>
            <select
              name="patient_id"
              value={formData.patient_id}
              onChange={handleChange}
              required
            >
              <option value="">Select a patient...</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.first_name} {p.last_name} - {p.phone || ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Referral Details</h3>
          <div className={styles.formGroup}>
            <label>Specialty *</label>
            <select
              name="specialty"
              value={formData.specialty}
              onChange={handleChange}
              required
            >
              <option value="">Select specialty...</option>
              {specialties.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Urgency *</label>
              <select
                name="urgency"
                value={formData.urgency}
                onChange={handleChange}
                required
              >
                {urgencies.map((u) => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Reason for Referral *</label>
            <textarea
              name="reason_for_referral"
              value={formData.reason_for_referral}
              onChange={handleChange}
              rows={4}
              placeholder="Explain why the patient needs to be referred..."
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Clinical Notes</label>
            <textarea
              name="clinical_notes"
              value={formData.clinical_notes}
              onChange={handleChange}
              rows={3}
              placeholder="Any additional clinical information..."
            />
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Facility Information</h3>
          <div className={styles.formGroup}>
            <label>Facility Name</label>
            <input
              type="text"
              name="facility_name"
              value={formData.facility_name}
              onChange={handleChange}
              placeholder="e.g., Kenyatta National Hospital"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Facility Address</label>
            <input
              type="text"
              name="facility_address"
              value={formData.facility_address}
              onChange={handleChange}
              placeholder="e.g., Nairobi, Kenya"
            />
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Facility Phone</label>
              <input
                type="text"
                name="facility_phone"
                value={formData.facility_phone}
                onChange={handleChange}
                placeholder="e.g., 0712345678"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Contact Person</label>
              <input
                type="text"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleChange}
                placeholder="e.g., Dr. Smith"
              />
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={() => router.back()}>
            Cancel
          </button>
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Creating...' : 'Create Referral'}
          </button>
        </div>
      </form>
    </div>
  );
}
