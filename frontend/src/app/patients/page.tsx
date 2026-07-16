'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '../../lib/api';
import styles from './patients.module.css';

interface Patient {
  id: string;
  medical_no: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  age?: number;
  visits?: any[];
  labOrders?: any[];
  allergies?: any[];
  lastVisit?: string;
  address?: string;
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function PatientsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedPatientLoading, setSelectedPatientLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    phone: '',
    email: '',
    address: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPatients, setTotalPatients] = useState(0);
  const [itemsPerPage] = useState(20);

  useEffect(() => {
    const urlSearch = searchParams?.get('search');
    if (urlSearch) {
      setSearchTerm(urlSearch);
    }
  }, [searchParams]);

  const fetchPatients = useCallback(async (page = 1, search = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', itemsPerPage.toString());
      if (search && search.trim()) {
        params.set('search', search.trim());
      }
      
      const res = await api.get(`/patients?${params.toString()}`);
      if (res.data.success) {
        setPatients(res.data.patients);
        setFilteredPatients(res.data.patients);
        setTotalPages(res.data.pagination.totalPages);
        setTotalPatients(res.data.pagination.total);
        setCurrentPage(res.data.pagination.page);
      } else {
        setError('Failed to load patients');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not load patients');
    } finally {
      setLoading(false);
    }
  }, [itemsPerPage]);

  // Initial load and when search term changes
  useEffect(() => {
    fetchPatients(1, searchTerm);
  }, [fetchPatients, searchTerm]);

  const fetchPatientDetail = async (patientId: string) => {
    setSelectedPatientLoading(true);
    try {
      const [patientRes, consultationsRes, labRes] = await Promise.all([
        api.get(`/patients/${patientId}`),
        api.get(`/consultations/patient/${patientId}`),
        api.get(`/lab-orders/patient/${patientId}`).catch(() => ({ data: { labOrders: [] } }))
      ]);

      const patientData = patientRes.data.patient;
      const consultations = consultationsRes.data.consultations || [];

      setSelectedPatient({
        ...patientData,
        visits: consultations,
        labOrders: labRes.data.labOrders || [],
        allergies: [],
        lastVisit: consultations.length > 0 ? consultations[0].consultation_date : null
      });
    } catch (error) {
      console.error('Error fetching patient details:', error);
      const basicPatient = patients.find(p => p.id === patientId);
      if (basicPatient) {
        setSelectedPatient({ ...basicPatient, visits: [], labOrders: [], allergies: [], lastVisit: undefined });
      }
    } finally {
      setSelectedPatientLoading(false);
    }
  };

  const getPatientName = (patient: Patient) => {
    return `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || 'Unnamed Patient';
  };

  const getGenderIcon = (gender: string | null) => {
    if (gender === 'Male' || gender === 'M') {
      return '👨';
    } else if (gender === 'Female' || gender === 'F') {
      return '👩';
    }
    return '👤';
  };

  const handleSelectPatient = (patient: Patient) => {
    fetchPatientDetail(patient.id);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to deactivate this patient?')) {
      try {
        await api.delete(`/patients/${id}`);
        fetchPatients(currentPage, searchTerm);
        if (selectedPatient?.id === id) {
          setSelectedPatient(null);
        }
      } catch (err: any) {
        alert('Failed to delete patient');
      }
    }
  };

  const handleEditClick = (patient: Patient) => {
    setEditingPatient(patient);
    setEditForm({
      first_name: patient.first_name || '',
      last_name: patient.last_name || '',
      date_of_birth: patient.date_of_birth || '',
      gender: patient.gender || '',
      phone: patient.phone || '',
      email: patient.email || '',
      address: patient.address || ''
    });
    setShowEditModal(true);
  };

  const handleUpdatePatient = async () => {
    if (!editForm.first_name || !editForm.last_name) {
      alert('Please enter first name and last name');
      return;
    }

    setIsUpdating(true);
    try {
      await api.put(`/patients/${editingPatient?.id}`, editForm);
      alert('Patient updated successfully!');
      setShowEditModal(false);
      fetchPatients(currentPage, searchTerm);
      if (selectedPatient?.id === editingPatient?.id) {
        fetchPatientDetail(editingPatient!.id);
      }
    } catch (error) {
      alert('Error updating patient');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStartConsultation = () => {
    if (selectedPatient) {
      router.push(`/consultations/new?patientId=${selectedPatient.id}`);
    }
  };

  const handleOrderLab = () => {
    if (selectedPatient) {
      router.push(`/lab-orders/new?patientId=${selectedPatient.id}`);
    }
  };

  const handleReferral = () => {
    if (selectedPatient) {
      router.push(`/referrals/new?patientId=${selectedPatient.id}`);
    }
  };

  const handleMedicalRecord = () => {
    if (selectedPatient) {
      router.push(`/patients/${selectedPatient.id}/record`);
    }
  };

  const handlePrintReport = () => {
    if (selectedPatient) {
      router.push(`/patients/${selectedPatient.id}/print`);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString();
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchPatients(newPage, searchTerm);
    }
  };

  if (loading && patients.length === 0) {
    return <div className={styles.loadingContainer}>Loading patients...</div>;
  }

  return (
    <div className={styles.patientsContainer}>
      <div className={styles.patientListPanel}>
        <div className={styles.patientListHeader}>
          <h1>All Patients</h1>
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search patients by name or phone..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <div className={styles.searchResultCount}>
                Found {totalPatients} patient{totalPatients !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>

        <div className={styles.patientList}>
          {filteredPatients.length === 0 ? (
            <div className={styles.noPatients}>
              <p>No patients found</p>
            </div>
          ) : (
            filteredPatients.map((patient) => {
              const patientName = getPatientName(patient);
              const isSelected = selectedPatient?.id === patient.id;

              return (
                <div
                  key={patient.id}
                  className={`${styles.patientCard} ${isSelected ? styles.selected : ''}`}
                  onClick={() => handleSelectPatient(patient)}
                >
                  <div className={styles.patientAvatar}>
                    {getGenderIcon(patient.gender)}
                  </div>
                  <div className={styles.patientInfo}>
                    <div className={styles.patientName}>{patientName}</div>
                    <div className={styles.patientDetails}>
                      <span>Phone: {patient.phone || 'No phone'}</span>
                      <span>ID: {patient.medical_no || patient.id?.slice(0, 8)}</span>
                      <span>DOB: {patient.date_of_birth ? formatDate(patient.date_of_birth) : 'N/A'}</span>
                    </div>
                  </div>
                  <div className={styles.patientActions}>
                    <button className={styles.editBtn} onClick={(e) => { e.stopPropagation(); handleEditClick(patient); }} title="Edit">Edit</button>
                    <button className={styles.deleteBtn} onClick={(e) => { e.stopPropagation(); handleDelete(patient.id); }} title="Delete">Delete</button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={styles.paginationBtn}
            >
              ← Previous
            </button>
            <span className={styles.paginationInfo}>
              Page {currentPage} of {totalPages} ({totalPatients} patients)
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={styles.paginationBtn}
            >
              Next →
            </button>
          </div>
        )}
      </div>

      <div className={styles.patientActionsPanel}>
        {selectedPatientLoading ? (
          <div className={styles.panelLoading}>Loading patient details...</div>
        ) : selectedPatient ? (
          <div className={styles.actionsPanelContent}>
            <div className={styles.panelPatientHeader}>
              <div className={styles.panelAvatar}>
                {getGenderIcon(selectedPatient.gender)}
              </div>
              <div className={styles.panelPatientInfo}>
                <h2>{getPatientName(selectedPatient)}</h2>
                <p>{selectedPatient.age || 'N/A'} years • {selectedPatient.gender === 'Male' ? 'Male' : 'Female'}</p>
                <p>Phone: {selectedPatient.phone || 'No phone'} • ID: {selectedPatient.medical_no || selectedPatient.id?.slice(0, 8)}</p>
                <button className={styles.editPanelBtn} onClick={() => handleEditClick(selectedPatient)}>
                  Edit Patient Details
                </button>
              </div>
            </div>

            <div className={styles.panelQuickStats}>
              <div className={styles.quickStat}>
                <span className={styles.statNumber}>{selectedPatient.visits?.length || 0}</span>
                <span className={styles.statLabel}>Total Visits</span>
              </div>
              <div className={styles.quickStat}>
                <span className={styles.statNumber}>{selectedPatient.labOrders?.filter(o => o.status !== 'completed').length || 0}</span>
                <span className={styles.statLabel}>Pending Labs</span>
              </div>
              <div className={styles.quickStat}>
                <span className={styles.statNumber}>{selectedPatient.allergies?.length || 0}</span>
                <span className={styles.statLabel}>Allergies</span>
              </div>
            </div>

            <div className={styles.panelActions}>
              <button className={`${styles.actionBtn} ${styles.consultation}`} onClick={handleStartConsultation}>
                New Consultation
              </button>
              <button className={`${styles.actionBtn} ${styles.lab}`} onClick={handleOrderLab}>
                Order Lab
              </button>
              <button className={`${styles.actionBtn} ${styles.referral}`} onClick={handleReferral}>
                Referral
              </button>
              <button className={`${styles.actionBtn} ${styles.record}`} onClick={handleMedicalRecord}>
                Medical Record
              </button>
              <button className={`${styles.actionBtn} ${styles.print}`} onClick={handlePrintReport}>
                Print Report
              </button>
              <button className={`${styles.actionBtn} ${styles.delete}`} onClick={() => handleDelete(selectedPatient.id)}>
                Delete Patient
              </button>
            </div>

            {selectedPatient.visits && selectedPatient.visits.length > 0 && (
              <div className={styles.panelRecentConsultations}>
                <h4>Recent Consultations</h4>
                <div className={styles.recentConsultationsList}>
                  {selectedPatient.visits.slice(0, 3).map((visit, idx) => (
                    <div key={idx} className={styles.recentConsultation}>
                      <span className={styles.consultDate}>{new Date(visit.consultation_date || visit.date).toLocaleDateString()}</span>
                      <span className={styles.consultDiagnosis}>{visit.diagnosis || 'No diagnosis'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.panelEmpty}>
            <span className={styles.emptyIcon}>👆</span>
            <h3>Select a Patient</h3>
            <p>Click on any patient from the list to view their details and take actions</p>
          </div>
        )}
      </div>

      {showEditModal && editingPatient && (
        <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Edit Patient</h3>
              <button className={styles.modalClose} onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>First Name *</label>
                  <input type="text" value={editForm.first_name} onChange={(e) => setEditForm({...editForm, first_name: e.target.value})} placeholder="First name" />
                </div>
                <div className={styles.formGroup}>
                  <label>Last Name *</label>
                  <input type="text" value={editForm.last_name} onChange={(e) => setEditForm({...editForm, last_name: e.target.value})} placeholder="Last name" />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Date of Birth</label>
                  <input type="date" value={editForm.date_of_birth} onChange={(e) => setEditForm({...editForm, date_of_birth: e.target.value})} placeholder="Date of birth" />
                </div>
                <div className={styles.formGroup}>
                  <label>Gender</label>
                  <select value={editForm.gender} onChange={(e) => setEditForm({...editForm, gender: e.target.value})}>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Phone</label>
                  <input type="tel" value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} placeholder="Phone number" />
                </div>
                <div className={styles.formGroup}>
                  <label>Email</label>
                  <input type="email" value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} placeholder="Email" />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Address</label>
                <input type="text" value={editForm.address} onChange={(e) => setEditForm({...editForm, address: e.target.value})} placeholder="Address" />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className={styles.saveBtn} onClick={handleUpdatePatient} disabled={isUpdating}>
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PatientsPage() {
  return (
    <Suspense fallback={<div className={styles.loadingContainer}>Loading patients...</div>}>
      <PatientsContent />
    </Suspense>
  );
}

export const dynamic = 'force-dynamic';
