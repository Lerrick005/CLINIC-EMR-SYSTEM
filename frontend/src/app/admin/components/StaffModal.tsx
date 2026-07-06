'use client';
import React, { useState } from 'react';
import styles from '../admin.module.css';

const ROLES = ['DOCTOR', 'RECEPTIONIST', 'PHARMACIST', 'LAB_STAFF', 'ACCOUNTANT'];

interface StaffModalProps {
  onClose: () => void;
  onAdd: (data: any) => Promise<{ success: boolean; message?: string }>;
}

export default function StaffModal({ onClose, onAdd }: StaffModalProps) {
  const [form, setForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'DOCTOR',
    password: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await onAdd(form);
    if (result.success) {
      alert('Staff added successfully!');
      onClose();
    } else {
      alert('Failed: ' + result.message);
    }
    setSubmitting(false);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Add Staff Member</h3>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div className={styles.formGroup}><label>Email *</label><input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} placeholder="staff@clinic.com" required /></div>
            <div className={styles.formGroup}><label>First Name</label><input type="text" value={form.firstName} onChange={(e) => setForm({...form, firstName: e.target.value})} placeholder="First name" /></div>
            <div className={styles.formGroup}><label>Last Name</label><input type="text" value={form.lastName} onChange={(e) => setForm({...form, lastName: e.target.value})} placeholder="Last name" /></div>
            <div className={styles.formGroup}><label>Role *</label>
              <select value={form.role} onChange={(e) => setForm({...form, role: e.target.value})}>
                {ROLES.map((r) => (<option key={r} value={r}>{r}</option>))}
              </select>
            </div>
            <div className={styles.formGroup}><label>Password *</label><input type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} placeholder="Min. 6 characters" required minLength={6} /></div>
          </div>
          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.saveBtn} disabled={submitting}>
              {submitting ? 'Adding...' : 'Add Staff'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
