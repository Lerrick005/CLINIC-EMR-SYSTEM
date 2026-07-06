'use client';
import React, { useState } from 'react';
import { useDoctors } from '../hooks/useDoctors';
import DoctorModal from './DoctorModal';
import styles from '../admin.module.css';

export default function DoctorsTab() {
  const { doctors, addDoctor, deleteDoctor } = useDoctors();
  const [showModal, setShowModal] = useState(false);

  const handleDelete = (doctorId: string, doctorName: string) => {
    if (!confirm('Delete Dr. ' + doctorName + '? This action cannot be undone.')) return;
    deleteDoctor(doctorId);
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h3>Doctors</h3>
        <button className={styles.addBtn} onClick={() => setShowModal(true)}>+ Add Doctor</button>
      </div>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>Specialty</th>
              <th>Email</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {doctors.length === 0 ? (
              <tr><td colSpan={5} className={styles.emptyState}>No doctors found</td></tr>
            ) : (
              doctors.map((doc) => (
                <tr key={doc.id}>
                  <td>Dr. {doc.firstName} {doc.lastName}</td>
                  <td>{doc.username || '—'}</td>
                  <td>{doc.specialty || 'General Practice'}</td>
                  <td>{doc.email || '—'}</td>
                  <td>
                    <button className={styles.deleteBtn} onClick={() => handleDelete(doc.id, doc.firstName + ' ' + doc.lastName)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {showModal && <DoctorModal onClose={() => setShowModal(false)} onAdd={addDoctor} />}
    </div>
  );
}
