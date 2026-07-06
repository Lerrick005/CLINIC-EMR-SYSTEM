'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import styles from './staff.module.css';

interface StaffMember {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}

export default function StaffManagement() {
  const router = useRouter();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'DOCTOR',
    password: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const roles = ['DOCTOR', 'RECEPTIONIST', 'PHARMACIST', 'LAB_STAFF', 'ACCOUNTANT'];

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await api.get('/staff');
      if (res.data.success) {
        setStaff(res.data.staff);
      } else {
        setError('Failed to load staff');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not load staff');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/staff', formData);
      if (res.data.success) {
        alert('✅ Staff added successfully!');
        setShowAddModal(false);
        setFormData({ email: '', firstName: '', lastName: '', role: 'DOCTOR', password: '' });
        fetchStaff();
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add staff');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (confirm('Are you sure you want to deactivate this staff member?')) {
      try {
        await api.delete(`/staff/${id}`);
        fetchStaff();
      } catch (err: any) {
        alert('Failed to deactivate staff');
      }
    }
  };

  const getRoleIcon = (role: string) => {
    const icons: Record<string, string> = {
      DOCTOR: '👨‍⚕️',
      RECEPTIONIST: '📋',
      PHARMACIST: '💊',
      LAB_STAFF: '🔬',
      ACCOUNTANT: '💰'
    };
    return icons[role] || '👤';
  };

  const getRoleBadgeClass = (role: string) => {
    const classes: Record<string, string> = {
      DOCTOR: styles.badgeDoctor,
      RECEPTIONIST: styles.badgeReception,
      PHARMACIST: styles.badgePharmacy,
      LAB_STAFF: styles.badgeLab,
      ACCOUNTANT: styles.badgeAccountant
    };
    return classes[role] || styles.badgeDefault;
  };

  if (loading) {
    return <div className={styles.loadingContainer}>Loading staff...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>👥 Staff Management</h1>
          <p className={styles.subtitle}>Manage your clinic staff members</p>
        </div>
        <button className={styles.addBtn} onClick={() => setShowAddModal(true)}>
          ➕ Add Staff
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {staff.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No staff members yet.</p>
          <button onClick={() => setShowAddModal(true)} className={styles.emptyAddBtn}>Add your first staff member</button>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Staff</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((member) => (
                <tr key={member.id}>
                  <td>
                    <div className={styles.staffCell}>
                      <span className={styles.staffAvatar}>{getRoleIcon(member.role)}</span>
                      <div>
                        <div className={styles.staffName}>
                          {member.first_name || ''} {member.last_name || ''}
                        </div>
                        <div className={styles.staffRole}>{member.role}</div>
                      </div>
                    </div>
                  </td>
                  <td>{member.email}</td>
                  <td>
                    <span className={`${styles.badge} ${getRoleBadgeClass(member.role)}`}>
                      {member.role}
                    </span>
                  </td>
                  <td>
                    <span className={member.is_active ? styles.activeBadge : styles.inactiveBadge}>
                      {member.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{new Date(member.created_at).toLocaleDateString()}</td>
                  <td>
                    <button className={styles.deleteBtn} onClick={() => handleDeleteStaff(member.id)}>
                      🗑️ Deactivate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>➕ Add Staff Member</h2>
              <button className={styles.modalClose} onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddStaff} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="staff@clinic.com"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  placeholder="First name"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  placeholder="Last name"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  {roles.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Min. 6 characters"
                  required
                  minLength={6}
                />
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className={styles.saveBtn} disabled={submitting}>
                  {submitting ? 'Adding...' : 'Add Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}