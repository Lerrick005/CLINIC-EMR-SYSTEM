'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import styles from './super-admin.module.css';

interface Clinic {
  id: string;
  name: string;
  mfl_code: string;
  county: string;
  subcounty: string;
  ward: string;
  is_active: boolean;
  is_legacy: boolean;
  subscription_status: string;
  subscription_ends_at: string | null;
  user_count: number;
  patient_count: number;
  created_at: string;
}

export default function SuperAdminPage() {
  const router = useRouter();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    mflCode: '',
    county: '',
    subcounty: '',
    ward: '',
    address: '',
    phone: '',
    email: '',
    adminEmail: '',
    adminPassword: '',
    adminFirstName: '',
    adminLastName: '',
    isLegacy: false
  });

  useEffect(() => {
    // Check if user is SUPER_ADMIN
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.role !== 'SUPER_ADMIN') {
        router.push('/dashboard');
        return;
      }
    } catch (e) {
      router.push('/login');
      return;
    }
    fetchClinics();
  }, []);

  const fetchClinics = async () => {
    setLoading(true);
    try {
      const response = await api.get('/super-admin/clinics');
      if (response.data.success) {
        setClinics(response.data.clinics);
      }
    } catch (error: any) {
      console.error('Error fetching clinics:', error);
      if (error.response?.status === 403) {
        setError('Access denied. Super Admin only.');
        router.push('/dashboard');
      } else {
        setError('Failed to load clinics');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await api.post('/super-admin/clinics', formData);
      if (response.data.success) {
        alert('Clinic created successfully!');
        setShowModal(false);
        setFormData({
          name: '',
          mflCode: '',
          county: '',
          subcounty: '',
          ward: '',
          address: '',
          phone: '',
          email: '',
          adminEmail: '',
          adminPassword: '',
          adminFirstName: '',
          adminLastName: '',
          isLegacy: false
        });
        fetchClinics();
      }
    } catch (error: any) {
      alert('Failed to create clinic: ' + (error.response?.data?.error || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivateClinic = async (clinicId: string, clinicName: string) => {
    if (!confirm(`Deactivate ${clinicName}? This will disable all access for this clinic.`)) return;
    try {
      await api.delete(`/super-admin/clinics/${clinicId}`);
      fetchClinics();
    } catch (error) {
      alert('Failed to deactivate clinic');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; label: string }> = {
      'LEGACY': { color: '#DCFCE7', label: 'Legacy (Free)' },
      'TRIAL': { color: '#FEF3C7', label: 'Trial' },
      'ACTIVE': { color: '#DBEAFE', label: 'Active' },
      'EXPIRED': { color: '#FEE2E2', label: 'Expired' },
      'CANCELLED': { color: '#FEE2E2', label: 'Cancelled' }
    };
    const badge = badges[status] || { color: '#E2E8F0', label: status };
    return (
      <span style={{
        background: badge.color,
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '500'
      }}>
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return <div className={styles.container}><div className={styles.loading}>Loading clinics...</div></div>;
  }

  if (error) {
    return <div className={styles.container}><div className={styles.error}>{error}</div></div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>🏥 Clinic Management</h1>
          <p className={styles.subtitle}>Manage all clinics in the system</p>
        </div>
        <button className={styles.addBtn} onClick={() => setShowModal(true)}>
          ➕ Create Clinic
        </button>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{clinics.length}</div>
          <div className={styles.statLabel}>Total Clinics</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{clinics.filter(c => c.is_active).length}</div>
          <div className={styles.statLabel}>Active Clinics</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{clinics.filter(c => c.is_legacy).length}</div>
          <div className={styles.statLabel}>Legacy Clinics</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            {clinics.reduce((sum, c) => sum + (c.patient_count || 0), 0)}
          </div>
          <div className={styles.statLabel}>Total Patients</div>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Clinic</th>
              <th>MFL Code</th>
              <th>County</th>
              <th>Sub-county</th>
              <th>Staff</th>
              <th>Patients</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {clinics.map((clinic) => (
              <tr key={clinic.id}>
                <td>
                  <div>
                    <div className={styles.clinicName}>{clinic.name}</div>
                    <div className={styles.clinicEmail}>{clinic.email || 'No email'}</div>
                  </div>
                </td>
                <td>{clinic.mfl_code || '—'}</td>
                <td>{clinic.county || '—'}</td>
                <td>{clinic.subcounty || '—'}</td>
                <td>{clinic.user_count || 0}</td>
                <td>{clinic.patient_count || 0}</td>
                <td>
                  {getStatusBadge(clinic.subscription_status || 'TRIAL')}
                  {!clinic.is_active && (
                    <span style={{
                      marginLeft: '4px',
                      background: '#FEE2E2',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      color: '#DC2626'
                    }}>
                      Inactive
                    </span>
                  )}
                </td>
                <td>
                  <button
                    className={styles.editBtn}
                    onClick={() => alert('Edit coming soon')}
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDeactivateClinic(clinic.id, clinic.name)}
                    title="Deactivate"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Create New Clinic</h2>
              <button className={styles.modalClose} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateClinic} className={styles.modalForm}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Clinic Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    placeholder="e.g., Health Center"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>MFL Code</label>
                  <input
                    type="text"
                    value={formData.mflCode}
                    onChange={(e) => setFormData({...formData, mflCode: e.target.value})}
                    placeholder="e.g., 12345"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>County</label>
                  <input
                    type="text"
                    value={formData.county}
                    onChange={(e) => setFormData({...formData, county: e.target.value})}
                    placeholder="e.g., Nairobi"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Sub-county</label>
                  <input
                    type="text"
                    value={formData.subcounty}
                    onChange={(e) => setFormData({...formData, subcounty: e.target.value})}
                    placeholder="e.g., Westlands"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Ward</label>
                  <input
                    type="text"
                    value={formData.ward}
                    onChange={(e) => setFormData({...formData, ward: e.target.value})}
                    placeholder="e.g., Parklands"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="Physical address"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="e.g., 0712345678"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="clinic@email.com"
                  />
                </div>
              </div>

              <div className={styles.divider}>Admin Account</div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Admin First Name *</label>
                  <input
                    type="text"
                    value={formData.adminFirstName}
                    onChange={(e) => setFormData({...formData, adminFirstName: e.target.value})}
                    required
                    placeholder="e.g., John"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Admin Last Name *</label>
                  <input
                    type="text"
                    value={formData.adminLastName}
                    onChange={(e) => setFormData({...formData, adminLastName: e.target.value})}
                    required
                    placeholder="e.g., Doe"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Admin Email *</label>
                  <input
                    type="email"
                    value={formData.adminEmail}
                    onChange={(e) => setFormData({...formData, adminEmail: e.target.value})}
                    required
                    placeholder="admin@clinic.com"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Admin Password *</label>
                  <input
                    type="password"
                    value={formData.adminPassword}
                    onChange={(e) => setFormData({...formData, adminPassword: e.target.value})}
                    required
                    placeholder="Min 6 characters"
                    minLength={6}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.isLegacy}
                    onChange={(e) => setFormData({...formData, isLegacy: e.target.checked})}
                  />
                  <span>Legacy (Free Forever) - For first clients</span>
                </label>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className={styles.saveBtn} disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Clinic'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

