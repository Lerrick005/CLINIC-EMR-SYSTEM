'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Building2, Users, CreditCard, Clock, Star, Activity, Search, Plus, Download, BarChart3, MoreHorizontal, Edit3, Eye, Key, Trash2, RotateCcw, X } from 'lucide-react';
import api from '../../lib/api';
import AnalyticsDashboard from './components/AnalyticsDashboard';
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
  email?: string;
  phone?: string;
  address?: string;
}

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}

function SuperAdminContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null);
  const [viewingUsers, setViewingUsers] = useState<User[]>([]);
  const [viewingClinicName, setViewingClinicName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [editForm, setEditForm] = useState({
    name: '', mflCode: '', county: '', subcounty: '', ward: '', address: '', phone: '', email: '', is_active: true
  });

  const [formData, setFormData] = useState({
    name: '', mflCode: '', county: '', subcounty: '', ward: '', address: '', phone: '', email: '',
    adminEmail: '', adminPassword: '', adminFirstName: '', adminLastName: '', subscriptionType: 'TRIAL'
  });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filteredClinics = clinics.filter(clinic => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = !query || clinic.name.toLowerCase().includes(query) || (clinic.mfl_code || '').toLowerCase().includes(query) || (clinic.county || '').toLowerCase().includes(query);
    const matchesStatus = filterStatus === 'all' || clinic.subscription_status === filterStatus || (filterStatus === 'inactive' && !clinic.is_active);
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: clinics.length, active: clinics.filter(c => c.is_active).length,
    paid: clinics.filter(c => c.subscription_status === 'PAID').length,
    trial: clinics.filter(c => c.subscription_status === 'TRIAL').length,
    legacy: clinics.filter(c => c.is_legacy).length,
    patients: clinics.reduce((s, c) => s + (c.patient_count || 0), 0),
  };

  useEffect(() => {
    const init = async () => {
      const accessToken = searchParams?.get('accessToken');
      const refreshToken = searchParams?.get('refreshToken');
      const userId = searchParams?.get('userId');
      if (accessToken && refreshToken && userId) {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('userId', userId);
        try {
          const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
          const res = await fetch(`${API_BASE_URL}/auth/me`, { headers: { Authorization: `Bearer ${accessToken}` } });
          const data = await res.json();
          if (!res.ok || !data.user) { router.push('/login'); return; }
          localStorage.setItem('user', JSON.stringify(data.user));
          if (data.user.role !== 'SUPER_ADMIN') { router.push('/dashboard'); return; }
          router.replace('/super-admin'); fetchClinics();
        } catch (e) { router.push('/login'); }
        return;
      }
      try { const user = JSON.parse(localStorage.getItem('user') || '{}'); if (user.role !== 'SUPER_ADMIN') { router.push('/dashboard'); return; } } catch (e) { router.push('/login'); return; }
      fetchClinics();
    }; init();
  }, [searchParams]);

  const fetchClinics = async () => {
    setLoading(true);
    try { const r = await api.get('/super-admin/clinics'); if (r.data.success) setClinics(r.data.clinics); }
    catch (e: any) { if (e.response?.status === 403) { setError('Access denied.'); router.push('/dashboard'); } else setError('Failed to load clinics'); }
    finally { setLoading(false); }
  };

  const exportToCSV = () => {
    const h = ['Name', 'MFL Code', 'County', 'Status', 'Staff', 'Patients', 'Created'];
    const rows = clinics.map(c => [c.name, c.mfl_code || '', c.county || '', c.subscription_status || 'TRIAL', c.user_count || 0, c.patient_count || 0, new Date(c.created_at).toLocaleDateString()]);
    const csv = [h, ...rows].map(r => r.join(',')).join('\n');
    const b = new Blob([csv]); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `clinics_${new Date().toISOString().split('T')[0]}.csv`; a.click(); URL.revokeObjectURL(u);
    showToast('CSV exported successfully', 'success');
  };

  const handleCreateClinic = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true);
    try {
      console.log('SENDING TO BACKEND:', JSON.stringify(formData));
      await api.post('/super-admin/clinics', { 
        ...formData, 
        isLegacy: formData.subscriptionType === 'LEGACY', 
        subscriptionType: formData.subscriptionType 
      });
      showToast('Clinic created successfully!', 'success');
      setShowCreate(false); setFormData({ name: '', mflCode: '', county: '', subcounty: '', ward: '', address: '', phone: '', email: '', adminEmail: '', adminPassword: '', adminFirstName: '', adminLastName: '', subscriptionType: 'TRIAL' }); fetchClinics();
    } catch (e: any) { showToast(e.response?.data?.error || 'Failed to create clinic', 'error'); }
    finally { setSubmitting(false); }
  };

  const handleUpdateClinic = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editingClinic) return; setSubmitting(true);
    try { await api.put(`/super-admin/clinics/${editingClinic.id}`, editForm); showToast('Clinic updated!', 'success'); setShowEdit(false); setEditingClinic(null); fetchClinics(); }
    catch (e: any) { showToast(e.response?.data?.error || 'Failed', 'error'); }
    finally { setSubmitting(false); }
  };

  const handleResetPassword = async (clinicId: string) => {
    const p = prompt('Enter new password (min 6 characters):');
    if (!p || p.length < 6) return;
    try { const r = await api.post(`/super-admin/clinics/${clinicId}/reset-password`, { newPassword: p }); showToast(r.data.message, 'success'); }
    catch (e: any) { showToast(e.response?.data?.error || 'Failed', 'error'); }
  };

  const handleDeactivateClinic = async (clinicId: string, clinicName: string) => {
    if (!confirm(`Deactivate ${clinicName}?`)) return;
    try { await api.delete(`/super-admin/clinics/${clinicId}`); showToast('Clinic deactivated', 'success'); fetchClinics(); }
    catch { showToast('Failed', 'error'); }
  };

  const handleReactivateClinic = async (clinicId: string, clinicName: string) => {
    if (!confirm(`Reactivate ${clinicName}?`)) return;
    try { await api.post(`/super-admin/clinics/${clinicId}/reactivate`); showToast('Clinic reactivated', 'success'); fetchClinics(); }
    catch { showToast('Failed', 'error'); }
  };

  const handlePermanentDelete = async (clinicId: string, clinicName: string) => {
    if (!confirm(`⚠️ PERMANENTLY DELETE "${clinicName}"?\n\nThis will permanently remove ALL data including:\n- All patients\n- All consultations\n- All prescriptions\n- All lab orders and results\n- All users\n- All audit logs\n\nThis action CANNOT be undone!`)) return;
    const c = prompt(`Type "${clinicName}" to confirm permanent deletion:`);
    if (c !== clinicName) return;
    try { await api.delete(`/super-admin/clinics/${clinicId}/permanent`); showToast('Clinic permanently deleted', 'success'); fetchClinics(); }
    catch (e: any) { showToast(e.response?.data?.error || 'Failed to delete clinic', 'error'); }
  };

  const handleViewUsers = async (clinicId: string, clinicName: string) => {
    try { const r = await api.get(`/super-admin/clinics/${clinicId}/users`); if (r.data.success) { setViewingUsers(r.data.users); setViewingClinicName(clinicName); setShowUsers(true); } }
    catch { showToast('Failed to load users', 'error'); }
  };

  const badgeClass = (s: string) => {
    const m: Record<string, string> = { 'PAID': styles.badgePaid, 'LEGACY': styles.badgeLegacy, 'TRIAL': styles.badgeTrial, 'ACTIVE': styles.badgeActive, 'EXPIRED': styles.badgeExpired, 'CANCELLED': styles.badgeCancelled };
    return m[s] || styles.badgeInactive;
  };

  if (loading) return <div className={styles.container}><div className={styles.loading}><div className={styles.loadingSpinner}></div><p>Loading clinics...</p></div></div>;
  if (error) return <div className={styles.container}><div className={styles.error}>{error}</div></div>;

  return (
    <div className={styles.container}>
      {toast && <div className={`${styles.toast} ${toast.type === 'success' ? styles.toastSuccess : styles.toastError}`}>{toast.type === 'success' ? '✓' : '✕'} {toast.message}</div>}

      <div className={styles.header}>
        <div className={styles.headerLeft}><h1>Clinic Management</h1><p>Manage all clinics across the platform</p></div>
        <div className={styles.headerActions}>
          <div className={styles.searchWrapper}><Search size={16} className={styles.searchIcon} /><input type="text" placeholder="Search clinics..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />{searchQuery && <X size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#94a3b8' }} onClick={() => setSearchQuery('')} />}</div>
          <select className={styles.filterSelect} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}><option value="all">All Status</option><option value="PAID">Paid</option><option value="TRIAL">Trial</option><option value="LEGACY">Legacy</option><option value="EXPIRED">Expired</option><option value="inactive">Inactive</option></select>
          <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setShowAnalytics(true)}><BarChart3 size={16} /> Analytics</button>
          <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={exportToCSV}><Download size={16} /> Export</button>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setShowCreate(true)}><Plus size={18} /> Create Clinic</button>
        </div>
      </div>

      <div className={styles.statsGrid}>
        {[{ icon: Building2, value: stats.total, label: 'Total Clinics', color: '#eff6ff', iconColor: '#3b82f6' }, { icon: Activity, value: stats.active, label: 'Active', color: '#ecfdf5', iconColor: '#10b981' }, { icon: CreditCard, value: stats.paid, label: 'Paid', color: '#f0fdf4', iconColor: '#22c55e' }, { icon: Clock, value: stats.trial, label: 'Trial', color: '#fefce8', iconColor: '#eab308' }, { icon: Star, value: stats.legacy, label: 'Legacy', color: '#eff6ff', iconColor: '#6366f1' }, { icon: Users, value: stats.patients, label: 'Patients', color: '#f5f3ff', iconColor: '#8b5cf6' }].map((s, i) => (
          <div key={i} className={styles.statCard}><div className={styles.statIcon} style={{ background: s.color }}><s.icon size={22} color={s.iconColor} /></div><div className={styles.statContent}><div className={styles.statValue}>{s.value.toLocaleString()}</div><div className={styles.statLabel}>{s.label}</div></div></div>
        ))}
      </div>

      <div className={styles.tableSection}>
        <div className={styles.tableHeader}><h3>All Clinics</h3><span className={styles.tableCount}>{filteredClinics.length} clinics</span></div>
        <div style={{ overflowX: 'auto' }}>
          <table className={styles.table}>
            <thead><tr><th>Clinic</th><th>MFL Code</th><th>County</th><th>Staff</th><th>Patients</th><th>Status</th><th style={{ width: 120 }}>Actions</th></tr></thead>
            <tbody>
              {filteredClinics.map(clinic => (
                <tr key={clinic.id}>
                  <td><div className={styles.clinicName}>{clinic.name}</div><div className={styles.clinicMeta}>{clinic.email || 'No email'} · {clinic.ward || 'No ward'}</div></td>
                  <td><code style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: 6, fontSize: 12 }}>{clinic.mfl_code || '—'}</code></td>
                  <td>{clinic.county || '—'}{clinic.subcounty ? `, ${clinic.subcounty}` : ''}</td>
                  <td>{clinic.user_count || 0}</td>
                  <td>{clinic.patient_count || 0}</td>
                  <td><span className={`${styles.badge} ${badgeClass(clinic.subscription_status || 'TRIAL')}`}>{clinic.subscription_status || 'TRIAL'}</span>{!clinic.is_active && <span className={`${styles.badge} ${styles.badgeInactive}`} style={{ marginLeft: 4 }}>Inactive</span>}</td>
                  <td>
                    <div className={styles.actionBtns}>
                      <button className={styles.iconBtn} onClick={() => handleViewUsers(clinic.id, clinic.name)} title="View Users"><Eye size={15} /></button>
                      <button className={styles.iconBtn} onClick={() => { setEditingClinic(clinic); setEditForm({ name: clinic.name || '', mflCode: clinic.mfl_code || '', county: clinic.county || '', subcounty: clinic.subcounty || '', ward: clinic.ward || '', address: clinic.address || '', phone: clinic.phone || '', email: clinic.email || '', is_active: clinic.is_active }); setShowEdit(true); }} title="Edit"><Edit3 size={15} /></button>
                      {clinic.is_active ? (
                        <>
                          <button className={`${styles.iconBtn} ${styles.iconBtnDanger}`} onClick={() => handleDeactivateClinic(clinic.id, clinic.name)} title="Deactivate"><Trash2 size={15} /></button>
                          <button className={`${styles.iconBtn} ${styles.iconBtnDanger}`} onClick={() => handlePermanentDelete(clinic.id, clinic.name)} title="Delete Forever" style={{ background: '#DC2626', color: 'white', border: 'none' }}>💀</button>
                        </>
                      ) : (
                        <button className={`${styles.iconBtn} ${styles.iconBtnSuccess}`} onClick={() => handleReactivateClinic(clinic.id, clinic.name)} title="Reactivate"><RotateCcw size={15} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <div className={styles.modalOverlay} onClick={() => setShowCreate(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}><h2>Create New Clinic</h2><button className={styles.modalClose} onClick={() => setShowCreate(false)}><X size={18} /></button></div>
            <form onSubmit={handleCreateClinic}><div className={styles.modalBody}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}><label>Clinic Name *</label><input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required /></div>
                <div className={styles.formGroup}><label>MFL Code</label><input type="text" value={formData.mflCode} onChange={e => setFormData({ ...formData, mflCode: e.target.value })} /></div>
                <div className={styles.formGroup}><label>County</label><input type="text" value={formData.county} onChange={e => setFormData({ ...formData, county: e.target.value })} /></div>
                <div className={styles.formGroup}><label>Sub-county</label><input type="text" value={formData.subcounty} onChange={e => setFormData({ ...formData, subcounty: e.target.value })} /></div>
                <div className={styles.formGroup}><label>Ward</label><input type="text" value={formData.ward} onChange={e => setFormData({ ...formData, ward: e.target.value })} /></div>
                <div className={styles.formGroup}><label>Address</label><input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} /></div>
                <div className={styles.formGroup}><label>Phone</label><input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} /></div>
                <div className={styles.formGroup}><label>Email</label><input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div>
              </div>
              <div className={styles.divider}>Subscription</div>
              <div className={styles.formGroup}><label>Plan</label><select value={formData.subscriptionType} onChange={e => setFormData({ ...formData, subscriptionType: e.target.value })}><option value="TRIAL">Trial (14 Days)</option><option value="PAID">Paid</option><option value="LEGACY">Legacy (Free)</option></select></div>
              <div className={styles.divider}>Admin Account</div>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}><label>First Name *</label><input type="text" value={formData.adminFirstName} onChange={e => setFormData({ ...formData, adminFirstName: e.target.value })} required /></div>
                <div className={styles.formGroup}><label>Last Name *</label><input type="text" value={formData.adminLastName} onChange={e => setFormData({ ...formData, adminLastName: e.target.value })} required /></div>
                <div className={styles.formGroup}><label>Email *</label><input type="email" value={formData.adminEmail} onChange={e => setFormData({ ...formData, adminEmail: e.target.value })} required /></div>
                <div className={styles.formGroup}><label>Password *</label><input type="password" value={formData.adminPassword} onChange={e => setFormData({ ...formData, adminPassword: e.target.value })} required minLength={6} /></div>
              </div>
            </div>
            <div className={styles.modalFooter}><button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setShowCreate(false)}>Cancel</button><button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={submitting}>{submitting ? 'Creating...' : 'Create Clinic'}</button></div></form>
          </div>
        </div>
      )}

      {showEdit && editingClinic && (
        <div className={styles.modalOverlay} onClick={() => setShowEdit(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}><h2>Edit Clinic</h2><button className={styles.modalClose} onClick={() => setShowEdit(false)}><X size={18} /></button></div>
            <form onSubmit={handleUpdateClinic}><div className={styles.modalBody}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}><label>Name</label><input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} required /></div>
                <div className={styles.formGroup}><label>MFL Code</label><input type="text" value={editForm.mflCode} onChange={e => setEditForm({ ...editForm, mflCode: e.target.value })} /></div>
                <div className={styles.formGroup}><label>County</label><input type="text" value={editForm.county} onChange={e => setEditForm({ ...editForm, county: e.target.value })} /></div>
                <div className={styles.formGroup}><label>Sub-county</label><input type="text" value={editForm.subcounty} onChange={e => setEditForm({ ...editForm, subcounty: e.target.value })} /></div>
                <div className={styles.formGroup}><label>Ward</label><input type="text" value={editForm.ward} onChange={e => setEditForm({ ...editForm, ward: e.target.value })} /></div>
                <div className={styles.formGroup}><label>Email</label><input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} /></div>
                <div className={styles.formGroup}><label>Status</label><select value={editForm.is_active ? 'active' : 'inactive'} onChange={e => setEditForm({ ...editForm, is_active: e.target.value === 'active' })}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
              </div>
              <div className={styles.divider}>Danger Zone</div>
              <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => handleResetPassword(editingClinic.id)} style={{ width: '100%', justifyContent: 'center' }}><Key size={16} /> Reset Admin Password</button>
              {!editingClinic.is_active && <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => handlePermanentDelete(editingClinic.id, editingClinic.name)} style={{ width: '100%', justifyContent: 'center', marginTop: 8, color: '#dc2626', borderColor: '#fecaca' }}><Trash2 size={16} /> Permanently Delete</button>}
            </div>
            <div className={styles.modalFooter}><button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setShowEdit(false)}>Cancel</button><button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={submitting}>{submitting ? 'Saving...' : 'Save Changes'}</button></div></form>
          </div>
        </div>
      )}

      {showUsers && (
        <div className={styles.modalOverlay} onClick={() => setShowUsers(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: 750 }}>
            <div className={styles.modalHeader}><h2>Users — {viewingClinicName}</h2><button className={styles.modalClose} onClick={() => setShowUsers(false)}><X size={18} /></button></div>
            <div className={styles.modalBody}>
              {viewingUsers.length === 0 ? <p style={{ textAlign: 'center', color: '#94a3b8', padding: 20 }}>No users found</p> : (
                <table className={styles.table}><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Last Login</th></tr></thead>
                  <tbody>{viewingUsers.map(u => (<tr key={u.id}><td style={{ fontWeight: 500 }}>{u.first_name} {u.last_name}</td><td>{u.email}</td><td><span className={`${styles.badge} ${styles.badgeActive}`}>{u.role}</span></td><td>{u.is_active ? '🟢 Active' : '⚫ Inactive'}</td><td>{u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}</td></tr>))}</tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {showAnalytics && <AnalyticsDashboard clinics={clinics} onClose={() => setShowAnalytics(false)} />}
    </div>
  );
}

export default function SuperAdminPage() {
  return (
    <Suspense fallback={<div className={styles.loading}><div className={styles.loadingSpinner}></div><p>Loading...</p></div>}>
      <SuperAdminContent />
    </Suspense>
  );
}

export const dynamic = 'force-dynamic';