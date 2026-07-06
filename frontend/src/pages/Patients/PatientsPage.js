import React, { useState } from 'react';
import './PatientsPage.css';

const PatientsPage = ({ 
  patients, 
  onPatientClick, 
  onDeletePatient,
  onStartConsultation,
  onOrderLab,
  onReferral,
  onViewMedicalRecord,
  onPrintReport,
  selectedPatient,
  onUpdatePatient
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientForActions, setSelectedPatientForActions] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    age: '',
    gender: '',
    phone: '',
    address: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const filteredPatients = patients.filter(patient => {
    const patientName = patient.name || `${patient.first_name} ${patient.last_name}`;
    return patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           patient.phone?.includes(searchTerm);
  });

  const handlePatientSelect = (patient) => {
    setSelectedPatientForActions(patient);
    onPatientClick(patient);
  };

  const handleDeleteClick = (patient, e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete ${patient.name || `${patient.first_name} ${patient.last_name}`}?`)) {
      onDeletePatient(patient.id);
      if (selectedPatientForActions?.id === patient.id) {
        setSelectedPatientForActions(null);
      }
    }
  };

  const handleEditClick = (patient, e) => {
    e.stopPropagation();
    setEditingPatient(patient);
    setEditForm({
      first_name: patient.first_name || '',
      last_name: patient.last_name || '',
      age: patient.age || '',
      gender: patient.gender || '',
      phone: patient.phone || '',
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
      const response = await fetch(`http://localhost:3001/api/patients/${editingPatient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        alert('✅ Patient updated successfully!');
        setShowEditModal(false);
        window.location.reload();
      } else {
        alert('❌ Failed to update patient');
      }
    } catch (error) {
      console.error('Error updating patient:', error);
      alert('❌ Error updating patient');
    } finally {
      setIsUpdating(false);
    }
  };

  const currentPatient = selectedPatient || selectedPatientForActions;

  const getPendingLabOrders = (patient) => {
    const patientOrders = patient.labOrders?.filter(order => order.status !== 'completed') || [];
    return patientOrders.length;
  };

  const getRecentResults = (patient) => {
    const completedOrders = patient.labOrders?.filter(order => order.status === 'completed') || [];
    return completedOrders.slice(0, 3);
  };

  return (
    <div className="patients-page">
      <div className="patients-layout">
        {/* LEFT SIDE - Patient List */}
        <div className="patients-list-section">
          <div className="patients-header">
            <h1>👥 All Patients</h1>
            <div className="patients-actions">
              <input
                type="text"
                placeholder="🔍 Search patients..."
                className="patients-search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="patients-list">
            {filteredPatients.length === 0 ? (
              <div className="no-patients">
                <p>No patients found</p>
              </div>
            ) : (
              filteredPatients.map(patient => {
                const patientName = patient.name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim();
                const visitCount = patient.visits?.length || 0;
                const isReturning = visitCount > 0;
                const isSelected = currentPatient?.id === patient.id;
                
                return (
                  <div 
                    key={patient.id} 
                    className={`patient-card ${isReturning ? 'returning' : 'new'} ${isSelected ? 'selected' : ''}`}
                    onClick={() => handlePatientSelect(patient)}
                  >
                    <div className="patient-avatar">
                      {patient.gender === 'Male' || patient.gender === 'M' ? '👨' : '👩'}
                    </div>
                    <div className="patient-info">
                      <div className="patient-name">
                        {patientName}
                        {isReturning && <span className="return-badge">🔄 Returning ({visitCount} visits)</span>}
                      </div>
                      <div className="patient-details">
                        <span>📞 {patient.phone || 'No phone'}</span>
                        <span>🆔 {patient.medical_no || patient.id?.slice(0, 8)}</span>
                        <span>📅 Last visit: {patient.lastVisit || patient.recentVisits?.[0]?.consultation_date?.split('T')[0] || 'None'}</span>
                      </div>
                    </div>
                    <div className="patient-actions-buttons">
                      <button 
                        className="edit-patient-btn"
                        onClick={(e) => handleEditClick(patient, e)}
                        title="Edit patient"
                      >
                        ✏️
                      </button>
                      <button 
                        className="delete-patient-btn"
                        onClick={(e) => handleDeleteClick(patient, e)}
                        title="Delete patient"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT SIDE - Patient Actions Panel */}
        <div className="patient-actions-panel">
          {currentPatient ? (
            <div className="actions-panel-content">
              {/* Patient Header */}
              <div className="panel-patient-header">
                <div className="panel-avatar">
                  {currentPatient.gender === 'Male' || currentPatient.gender === 'M' ? '👨' : '👩'}
                </div>
                <div className="panel-patient-info">
                  <h2>{currentPatient.name || `${currentPatient.first_name} ${currentPatient.last_name}`}</h2>
                  <p>{currentPatient.age || 'N/A'} years • {currentPatient.gender === 'Male' ? 'Male' : 'Female'}</p>
                  <p>📞 {currentPatient.phone || 'No phone'} • 🆔 {currentPatient.medical_no || currentPatient.id?.slice(0, 8)}</p>
                  <button className="edit-patient-panel-btn" onClick={(e) => handleEditClick(currentPatient, e)}>
                    ✏️ Edit Patient Details
                  </button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="panel-quick-stats">
                <div className="quick-stat">
                  <span className="stat-number">{currentPatient.visits?.length || 0}</span>
                  <span className="stat-label">Total Visits</span>
                </div>
                <div className="quick-stat">
                  <span className="stat-number">{getPendingLabOrders(currentPatient)}</span>
                  <span className="stat-label">Pending Labs</span>
                </div>
                <div className="quick-stat">
                  <span className="stat-number">{currentPatient.allergies?.length || 0}</span>
                  <span className="stat-label">Allergies</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="panel-actions">
                <button className="action-btn consultation" onClick={() => onStartConsultation(currentPatient)}>
                  📝 New Consultation
                </button>
                <button className="action-btn lab" onClick={() => onOrderLab(currentPatient)}>
                  🔬 Order Lab
                </button>
                <button className="action-btn referral" onClick={() => onReferral(currentPatient)}>
                  📋 Referral
                </button>
                <button className="action-btn record" onClick={() => onViewMedicalRecord(currentPatient)}>
                  📄 Medical Record
                </button>
                <button className="action-btn print" onClick={() => onPrintReport(currentPatient)}>
                  🖨️ Print Report
                </button>
                <button className="action-btn delete" onClick={() => handleDeleteClick(currentPatient, { stopPropagation: () => {} })}>
                  🗑️ Delete Patient
                </button>
              </div>

              {/* Recent Lab Results */}
              {getRecentResults(currentPatient).length > 0 && (
                <div className="panel-recent-results">
                  <h4>📋 Recent Lab Results</h4>
                  <div className="recent-results-list">
                    {getRecentResults(currentPatient).map(result => (
                      <div key={result.id} className="recent-result">
                        <span className="result-test">{result.test_name}</span>
                        <span className="result-value">{result.results?.result_data?.value || '—'}</span>
                        <span className="result-date">{new Date(result.resulted_date).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Consultations */}
              {currentPatient.visits?.length > 0 && (
                <div className="panel-recent-consultations">
                  <h4>🩺 Recent Consultations</h4>
                  <div className="recent-consultations-list">
                    {currentPatient.visits.slice(0, 3).map((visit, idx) => (
                      <div key={idx} className="recent-consultation">
                        <span className="consult-date">{new Date(visit.consultation_date || visit.date).toLocaleDateString()}</span>
                        <span className="consult-diagnosis">{visit.diagnosis || 'No diagnosis'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="panel-empty">
              <span className="empty-icon">👈</span>
              <h3>Select a Patient</h3>
              <p>Click on any patient from the list to view their details and take actions</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Patient Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✏️ Edit Patient</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>First Name *</label>
                  <input 
                    type="text" 
                    value={editForm.first_name} 
                    onChange={(e) => setEditForm({...editForm, first_name: e.target.value})}
                    placeholder="First name"
                  />
                </div>
                <div className="form-group">
                  <label>Last Name *</label>
                  <input 
                    type="text" 
                    value={editForm.last_name} 
                    onChange={(e) => setEditForm({...editForm, last_name: e.target.value})}
                    placeholder="Last name"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Age</label>
                  <input 
                    type="number" 
                    value={editForm.age} 
                    onChange={(e) => setEditForm({...editForm, age: e.target.value})}
                    placeholder="Age"
                  />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select 
                    value={editForm.gender} 
                    onChange={(e) => setEditForm({...editForm, gender: e.target.value})}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Phone</label>
                  <input 
                    type="tel" 
                    value={editForm.phone} 
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    placeholder="Phone number"
                  />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <input 
                    type="text" 
                    value={editForm.address} 
                    onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                    placeholder="Address"
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="save-btn" onClick={handleUpdatePatient} disabled={isUpdating}>
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientsPage;