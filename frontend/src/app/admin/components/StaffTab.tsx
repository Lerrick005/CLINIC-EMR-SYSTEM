'use client';
import React, { useState } from 'react';
import { useStaff } from '../hooks/useStaff';
import StaffModal from './StaffModal';
import styles from '../admin.module.css';

export default function StaffTab() {
  const { staff, loading, error, deactivateStaff, addStaff } = useStaff();
  const [showModal, setShowModal] = useState(false);

  const handleDeactivate = (id: string) => {
    if (!confirm('Are you sure you want to deactivate this staff member?')) return;
    deactivateStaff(id);
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h3>Staff Management</h3>
        <button className={styles.addBtn} onClick={() => setShowModal(true)}>+ Add Staff</button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <div className={styles.loadingContainer}>Loading staff...</div>
      ) : staff.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No staff members yet.</p>
          <button className={styles.emptyAddBtn} onClick={() => setShowModal(true)}>Add your first staff member</button>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Staff</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((member) => (
                <tr key={member.id}>
                  <td>{member.first_name || ''} {member.last_name || ''}</td>
                  <td>{member.email}</td>
                  <td>{member.role}</td>
                  <td>{member.is_active ? 'Active' : 'Inactive'}</td>
                  <td>
                    <button className={styles.deleteBtn} onClick={() => handleDeactivate(member.id)}>Deactivate</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showModal && <StaffModal onClose={() => setShowModal(false)} onAdd={addStaff} />}
    </div>
  );
}
