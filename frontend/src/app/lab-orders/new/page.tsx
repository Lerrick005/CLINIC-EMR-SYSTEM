
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '../../../lib/api';
import styles from './new.module.css';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
}

interface FormData {
  patient_id: string;
  test_name: string;
  test_code: string;
  test_category: string;
  priority: string;
  fasting_required: boolean;
  clinical_notes: string;
  amount_due: number;
}

interface PriorityOption {
  value: string;
  label: string;
  color: string;
}

function NewLabOrderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientIdParam = searchParams?.get('patientId');

  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [formData, setFormData] = useState<FormData>({
    patient_id: patientIdParam || '',
    test_name: '',
    test_code: '',
    test_category: '',
    priority: 'routine',
    fasting_required: false,
    clinical_notes: '',
    amount_due: 0,
  });

  const priorities: PriorityOption[] = [
    { value: 'routine', label: 'Routine (🟢)', color: '#10B981' },
    { value: 'urgent', label: 'Urgent (🟡)', color: '#F59E0B' },
    { value: 'stat', label: 'STAT (🟠)', color: '#F97316' },
    { value: 'emergency', label: 'Emergency (🔴)', color: '#EF4444' },
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patient_id || !formData.test_name) {
      alert('Please select a patient and enter test name');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/lab-orders', formData);
      if (res.data.success) {
        alert('✅ Lab order created successfully!');
        router.push('/lab-orders');
      } else {
        alert('❌ Failed to create lab order');
      }
    } catch (error) {
      console.error('Error creating lab order:', error);
      alert('❌ Error creating lab order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => router.back()} className={styles.backBtn}>← Back</button>
        <h1 className={styles.title}>📋 New Lab Order</h1>
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
          <h3 className={styles.sectionTitle}>Test Details</h3>
          <div className={styles.formGroup}>
            <label>Test Name *</label>
            <input
              type="text"
              name="test_name"
              value={formData.test_name}
              onChange={handleChange}
              placeholder="e.g., Complete Blood Count"
              required
            />
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Test Code</label>
              <input
                type="text"
                name="test_code"
                value={formData.test_code}
                onChange={handleChange}
                placeholder="e.g., CBC"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Category</label>
              <input
                type="text"
                name="test_category"
                value={formData.test_category}
                onChange={handleChange}
                placeholder="e.g., Hematology"
              />
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Order Details</h3>
          <div className={styles.formGroup}>
            <label>Priority *</label>
            <div className={styles.priorityOptions}>
              {priorities.map((p) => (
                <label key={p.value} className={styles.priorityOption}>
                  <input
                    type="radio"
                    name="priority"
                    value={p.value}
                    checked={formData.priority === p.value}
                    onChange={handleChange}
                  />
                  <span style={{ color: p.color }}>{p.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>
              <input
                type="checkbox"
                name="fasting_required"
                checked={formData.fasting_required}
                onChange={handleChange}
              />
              Fasting Required
            </label>
          </div>
          <div className={styles.formGroup}>
            <label>Clinical Notes</label>
            <textarea
              name="clinical_notes"
              value={formData.clinical_notes}
              onChange={handleChange}
              rows={3}
              placeholder="Any specific instructions or clinical context..."
            />
          </div>
          <div className={styles.formGroup}>
            <label>Amount Due (KES)</label>
            <input
              type="number"
              name="amount_due"
              value={formData.amount_due}
              onChange={handleChange}
              placeholder="0"
              min="0"
            />
          </div>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={() => router.back()}>
            Cancel
          </button>
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Creating...' : 'Create Lab Order'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewLabOrderPage() {
  return (
    <Suspense fallback={<div className={styles.loading}>Loading...</div>}>
      <NewLabOrderContent />
    </Suspense>
  );
}

export const dynamic = 'force-dynamic';


