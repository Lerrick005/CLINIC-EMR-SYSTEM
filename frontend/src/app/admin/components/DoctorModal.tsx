'use client';
import React, { useState } from 'react';
import styles from '../admin.module.css';

interface DoctorModalProps {
  onClose: () => void;
  onAdd: (data: any) => Promise<{ success: boolean; message?: string }>;
}

export default function DoctorModal({ onClose, onAdd }: DoctorModalProps) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    username: '',
    password: '',
    pin: '',
    specialty: 'General Practice',
    licenseNo: '',
    email: '',
    phone: ''
  });

  const handleSubmit = async () => {
    if (!form.firstName || !form.lastName || !form.username || !form.password || !form.pin) {
      alert('Please fill in all required fields');
      return;
    }
    if (form.pin.length !== 4) {
      alert('PIN must be 4 digits');
      return;
    }
    if (form.password.length < 4) {
      alert('Password must be at least 4 characters');
      return;
    }

    const result = await onAdd(form);
    if (result.success) {
      alert('Doctor added successfully!');
      onClose();
    } else {
      alert('Failed: ' + result.message);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Add Doctor</h3>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.formGroup}><label>First Name *</label><input type="text" value={form.firstName} onChange={(e) => setForm({...form, firstName: e.target.value})} /></div>
          <div className={styles.formGroup}><label>Last Name *</label><input type="text" value={form.lastName} onChange={(e) => setForm({...form, lastName: e.target.value})} /></div>
          <div className={styles.formGroup}><label>Username *</label><input type="text" value={form.username} onChange={(e) => setForm({...form, username: e.target.value})} placeholder="e.g., jane.doe" /></div>
          <div className={styles.formGroup}><label>Password *</label><input type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} placeholder="Min. 4 characters" /></div>
          <div className={styles.formGroup}><label>4-digit PIN *</label><input type="password" maxLength={4} value={form.pin} onChange={(e) => setForm({...form, pin: e.target.value.replace(/[^0-9]/g, '')})} placeholder="1234" /></div>
          <div className={styles.formGroup}><label>Specialty</label><input type="text" value={form.specialty} onChange={(e) => setForm({...form, specialty: e.target.value})} /></div>
          <div className={styles.formGroup}><label>License Number</label><input type="text" value={form.licenseNo} onChange={(e) => setForm({...form, licenseNo: e.target.value})} /></div>
          <div className={styles.formGroup}><label>Email</label><input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} /></div>
          <div className={styles.formGroup}><label>Phone</label><input type="tel" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} /></div>
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.saveBtn} onClick={handleSubmit}>Add Doctor</button>
        </div>
      </div>
    </div>
  );
}
