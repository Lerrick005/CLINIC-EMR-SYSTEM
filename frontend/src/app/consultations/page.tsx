'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  BarChart3, 
  Download, 
  Printer,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import styles from './consultations.module.css';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  age?: number;
  gender?: string;
  phone?: string;
  medical_no?: string;
  name?: string;
}

interface Consultation {
  id: string;
  consultation_date: string;
  chief_complaint: string;
  history_of_presenting_illness?: string;
  diagnosis?: string;
  differential_diagnosis?: string;
  treatment_plan?: string;
  follow_up_plan?: string;
  notes?: string;
  follow_up_date?: string;
  doctor_first_name?: string;
  doctor_last_name?: string;
  first_name?: string;
  last_name?: string;
  patient_id?: string;
}

interface Stats {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  topDiagnosis: string | null;
  topDiagnosisCount: number;
  avgPerDay: number;
  consultationsByDay: { day: string; count: number; fullDate: Date }[];
  consultationsByMonth: { month: string; count: number }[];
  doctors: { name: string; count: number }[];
  diagnoses: { name: string; count: number }[];
}

export default function ConsultationsPage() {
  const router = useRouter();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAnalyticsPopup, setShowAnalyticsPopup] = useState(false);
  const [showDoctorsPopup, setShowDoctorsPopup] = useState(false);
  const [showExportPopup, setShowExportPopup] = useState(false);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    topDiagnosis: null,
    topDiagnosisCount: 0,
    avgPerDay: 0,
    consultationsByDay: [],
    consultationsByMonth: [],
    doctors: [],
    diagnoses: []
  });

  useEffect(() => {
    fetchPatients();
    fetchConsultations();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoadingPatients(true);
      console.log('Fetching patients from API...');
      const response = await fetch('http://localhost:3001/api/patients');
      const data = await response.json();
      console.log('Patients API response:', data);
      
      if (data.success && Array.isArray(data.patients)) {
        setPatients(data.patients);
        console.log(`✅ Loaded ${data.patients.length} patients`);
      } else if (Array.isArray(data)) {
        setPatients(data);
        console.log(`✅ Loaded ${data.length} patients`);
      } else {
        console.error('Unexpected patients data format:', data);
        setPatients([]);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      setPatients([]);
    } finally {
      setLoadingPatients(false);
    }
  };

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/consultations');
      if (response.ok) {
        const data = await response.json();
        console.log('Consultations API response:', data);
        if (data.success && Array.isArray(data.consultations)) {
          setConsultations(data.consultations);
          calculateStats(data.consultations);
        } else if (Array.isArray(data)) {
          setConsultations(data);
          calculateStats(data);
        } else {
          setConsultations([]);
        }
      } else {
        console.error('Failed to fetch consultations:', response.status);
        setConsultations([]);
      }
    } catch (error) {
      console.error('Error fetching consultations:', error);
      setConsultations([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: Consultation[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);
    
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    monthAgo.setHours(0, 0, 0, 0);
    
    const todayCount = data.filter(c => {
      const consultDate = new Date(c.consultation_date);
      consultDate.setHours(0, 0, 0, 0);
      return consultDate.getTime() === today.getTime();
    }).length;
    
    const weekCount = data.filter(c => {
      const consultDate = new Date(c.consultation_date);
      consultDate.setHours(0, 0, 0, 0);
      return consultDate >= weekAgo;
    }).length;
    
    const monthCount = data.filter(c => {
      const consultDate = new Date(c.consultation_date);
      consultDate.setHours(0, 0, 0, 0);
      return consultDate >= monthAgo;
    }).length;
    
    const consultationsByDay = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dayName = days[date.getDay()];
      const count = data.filter(c => {
        const consultDate = new Date(c.consultation_date);
        consultDate.setHours(0, 0, 0, 0);
        return consultDate.getTime() === date.getTime();
      }).length;
      consultationsByDay.push({ day: dayName, count, fullDate: date });
    }
    
    const consultationsByMonth = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = monthNames[date.getMonth()];
      const year = date.getFullYear();
      const count = data.filter(c => {
        const consultDate = new Date(c.consultation_date);
        return consultDate.getMonth() === date.getMonth() && consultDate.getFullYear() === year;
      }).length;
      consultationsByMonth.push({ month: `${monthName} ${year}`, count });
    }
    
    const diagnosisCount: Record<string, number> = {};
    data.forEach(c => {
      if (c.diagnosis && c.diagnosis.trim()) {
        diagnosisCount[c.diagnosis] = (diagnosisCount[c.diagnosis] || 0) + 1;
      }
    });
    
    const diagnoses = Object.entries(diagnosisCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    let topDiagnosis = null;
    let topCount = 0;
    if (diagnoses.length > 0) {
      topDiagnosis = diagnoses[0].name;
      topCount = diagnoses[0].count;
    }
    
    const doctorCount: Record<string, number> = {};
    data.forEach(c => {
      const doctorName = `${c.doctor_first_name || ''} ${c.doctor_last_name || ''}`.trim() || 'Unknown';
      doctorCount[doctorName] = (doctorCount[doctorName] || 0) + 1;
    });
    
    const doctors = Object.entries(doctorCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    
    const firstDate = data.length > 0 ? new Date(data[data.length - 1].consultation_date) : new Date();
    const lastDate = data.length > 0 ? new Date(data[0].consultation_date) : new Date();
    const daysDiff = Math.max(1, Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)));
    const avgPerDay = Math.round((data.length / daysDiff) * 10) / 10;
    
    setStats({
      total: data.length,
      today: todayCount,
      thisWeek: weekCount,
      thisMonth: monthCount,
      topDiagnosis,
      topDiagnosisCount: topCount,
      avgPerDay,
      consultationsByDay,
      consultationsByMonth,
      doctors,
      diagnoses
    });
  };

  const getPatientName = (patient: Patient) => {
    return patient.name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || 'Unnamed Patient';
  };

  const getConsultationPatientName = (consultation: Consultation) => {
    return `${consultation.first_name || ''} ${consultation.last_name || ''}`.trim() || 'Unknown Patient';
  };

  const getDoctorName = (consultation: Consultation) => {
    return `${consultation.doctor_first_name || ''} ${consultation.doctor_last_name || ''}`.trim() || 'Dr. System';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-KE', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getPatientConsultations = () => {
    if (!selectedPatient) return [];
    const patientId = selectedPatient.id;
    return consultations.filter(c => c.patient_id === patientId);
  };

  const printConsultation = (consultation: Consultation) => {
    const printWindow = window.open('', '_blank');
    const patientName = getConsultationPatientName(consultation);
    const doctorName = getDoctorName(consultation);
    
    printWindow?.document.write(`
      <!DOCTYPE html>
      <html>
      <head><title>Consultation - ${patientName}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; }
        .header { background: #1A1A1A; color: #FFD700; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .info-card { margin-bottom: 20px; padding: 15px; background: #f5f5f5; border-radius: 8px; }
        .info-title { font-weight: bold; border-left: 3px solid #FFD700; padding-left: 10px; margin-bottom: 10px; }
      </style>
      </head>
      <body>
        <div class="header"><h1>🏥 CLINIC EMR</h1><h2>Consultation Record</h2><p>${new Date(consultation.consultation_date).toLocaleString()}</p></div>
        <div class="content">
          <div class="info-card"><div class="info-title">Patient Information</div><p><strong>Name:</strong> ${patientName}<br/><strong>Doctor:</strong> ${doctorName}</p></div>
          <div class="info-card"><div class="info-title">Chief Complaint</div><p>${consultation.chief_complaint || '—'}</p></div>
          <div class="info-card"><div class="info-title">Diagnosis</div><p>${consultation.diagnosis || '—'}</p></div>
          <div class="info-card"><div class="info-title">Treatment Plan</div><p>${consultation.treatment_plan || '—'}</p></div>
        </div>
      </body>
      </html>
    `);
    printWindow?.document.close();
    printWindow?.print();
  };

  const exportToCSV = () => {
    const consultationsList = getPatientConsultations();
    const headers = ['Date', 'Patient', 'Doctor', 'Diagnosis', 'Chief Complaint'];
    const rows = consultationsList.map(c => [
      new Date(c.consultation_date).toLocaleDateString(),
      getConsultationPatientName(c),
      getDoctorName(c),
      c.diagnosis || '',
      c.chief_complaint || ''
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `consultations_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportPopup(false);
  };

  const maxCount = Math.max(...stats.consultationsByDay.map(d => d.count), 1);
  const filteredConsultations = getPatientConsultations();

  if (loadingPatients) {
    return <div className={styles.consultSplit}><div className={styles.loadingSpinner}></div><p>Loading patients...</p></div>;
  }

  return (
    <div className={styles.consultSplit}>
      {/* LEFT PANEL - Patient List */}
      <div className={styles.consultLeftPanel}>
        <div className={styles.panelHeader}>
          <h2>👥 Patients</h2>
          <p>Select a patient to view their consultations</p>
        </div>
        <div className={styles.patientListScroll}>
          {patients.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              <p>No patients found in the system</p>
            </div>
          ) : (
            patients.map(patient => {
              const patientName = getPatientName(patient);
              const patientConsultations = consultations.filter(c => c.patient_id === patient.id);
              const isSelected = selectedPatient?.id === patient.id;
              return (
                <div 
                  key={patient.id} 
                  className={`${styles.patientItem} ${isSelected ? styles.selected : ''}`} 
                  onClick={() => setSelectedPatient(patient)}
                >
                  <div className={styles.patientAvatarSmall}>
                    {patient.gender === 'Male' ? '👨' : '👩'}
                  </div>
                  <div className={styles.patientDetailsSmall}>
                    <div className={styles.patientNameSmall}>{patientName}</div>
                    <div className={styles.patientMetaSmall}>
                      <span>{patient.age || 'N/A'} years</span>
                      <span>{patientConsultations.length} visits</span>
                    </div>
                  </div>
                  {isSelected && <div className={styles.selectedBadge}>✓</div>}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT PANEL - Main Content */}
      <div className={styles.consultRightPanel}>
        <div className={styles.rightHeader}>
          <div>
            <h1>🩺 Consultations</h1>
            <p>View and manage patient consultations</p>
          </div>
          <div className={styles.actionButtonsGroup}>
            <button className={styles.actionIconBtn} onClick={() => setShowAnalyticsPopup(true)}>
              <BarChart3 size={16} /> Analytics
            </button>
            <button className={styles.actionIconBtn} onClick={() => setShowDoctorsPopup(true)}>
              <Users size={16} /> Doctors
            </button>
            <button className={styles.actionIconBtn} onClick={() => setShowExportPopup(true)}>
              <Download size={16} /> Export
            </button>
          </div>
        </div>

        <div className={styles.statsBadges}>
          <span className={styles.statBadge}>📋 {stats.total} Total</span>
          <span className={styles.statBadge}>📅 {stats.today} Today</span>
          <span className={styles.statBadge}>📊 {stats.thisWeek} This Week</span>
          <span className={styles.statBadge}>🏆 Top Dx: {stats.topDiagnosis?.substring(0, 20) || 'None'}</span>
        </div>

        {selectedPatient ? (
          <div className={styles.selectedPatientCard}>
            <div className={styles.selectedPatientAvatar}>
              {selectedPatient.gender === 'Male' ? '👨' : '👩'}
            </div>
            <div className={styles.selectedPatientDetails}>
              <h3>{getPatientName(selectedPatient)}</h3>
              <p>{selectedPatient.age || 'N/A'} years • {selectedPatient.phone || 'No phone'}</p>
              <p>Medical No: {selectedPatient.medical_no || 'N/A'}</p>
            </div>
            <button className={styles.changePatientBtn} onClick={() => setSelectedPatient(null)}>
              Change
            </button>
          </div>
        ) : (
          <div className={styles.noPatientWarning}>
            <span>⚠️</span>
            <p>Please select a patient from the left panel to view their consultations</p>
          </div>
        )}

        <div className={styles.controlsBar}>
          <div className={styles.searchBox}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Search by diagnosis or chief complaint..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className={styles.dateFilters}>
            <button className={`${styles.filterBtn} ${dateFilter === 'all' ? styles.active : ''}`} onClick={() => setDateFilter('all')}>All</button>
            <button className={`${styles.filterBtn} ${dateFilter === 'today' ? styles.active : ''}`} onClick={() => setDateFilter('today')}>Today</button>
            <button className={`${styles.filterBtn} ${dateFilter === 'week' ? styles.active : ''}`} onClick={() => setDateFilter('week')}>This Week</button>
            <button className={`${styles.filterBtn} ${dateFilter === 'month' ? styles.active : ''}`} onClick={() => setDateFilter('month')}>This Month</button>
          </div>
          <button className={styles.newConsultBtn} onClick={() => router.push('/consultations/new')}>
            <span>📝</span> New Consultation
          </button>
        </div>

        <div className={styles.consultationsScroll}>
          {!selectedPatient ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>👈</span>
              <h3>Select a Patient</h3>
              <p>Click on a patient from the left panel to view their consultation history</p>
            </div>
          ) : filteredConsultations.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>📋</span>
              <h3>No consultations found</h3>
              <p>No consultation records for this patient yet.</p>
              <button className={styles.newConsultBtnSmall} onClick={() => router.push('/consultations/new')}>
                + Start First Consultation
              </button>
            </div>
          ) : (
            filteredConsultations.map((consultation) => {
              const isExpanded = expandedId === consultation.id;
              return (
                <div key={consultation.id} className={styles.consultationCard}>
                  <div className={styles.cardHeader} onClick={() => setExpandedId(isExpanded ? null : consultation.id)}>
                    <div className={styles.consultDateBadge}>
                      <span className={styles.dateDay}>{formatDate(consultation.consultation_date)}</span>
                      <span className={styles.dateFull}>{new Date(consultation.consultation_date).toLocaleTimeString()}</span>
                    </div>
                    <div className={styles.consultSummaryCompact}>
                      <div className={styles.chiefComplaintCompact}>
                        <span className={styles.label}>CC:</span>
                        <span className={styles.value}>{consultation.chief_complaint?.substring(0, 60) || '—'}</span>
                      </div>
                      {consultation.diagnosis && (
                        <span className={styles.diagnosisTag}>{consultation.diagnosis}</span>
                      )}
                    </div>
                    <div className={styles.expandIcon}>
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>
                  {isExpanded && (
                    <div className={styles.cardDetails}>
                      <div className={styles.detailsGrid}>
                        <div className={styles.detailSection}>
                          <div className={styles.sectionTitle}>📝 Chief Complaint</div>
                          <div className={styles.sectionContent}>{consultation.chief_complaint || 'Not recorded'}</div>
                        </div>
                        <div className={styles.detailSection}>
                          <div className={styles.sectionTitle}>📋 Diagnosis</div>
                          <div className={styles.sectionContent}>{consultation.diagnosis || 'Not recorded'}</div>
                        </div>
                        <div className={styles.detailSection}>
                          <div className={styles.sectionTitle}>💊 Treatment Plan</div>
                          <div className={styles.sectionContent}>{consultation.treatment_plan || 'Not recorded'}</div>
                        </div>
                      </div>
                      <div className={styles.cardActions}>
                        <button className={styles.printBtn} onClick={() => printConsultation(consultation)}>
                          <Printer size={14} /> Print Record
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Analytics Popup */}
      {showAnalyticsPopup && (
        <div className={styles.popupOverlay} onClick={() => setShowAnalyticsPopup(false)}>
          <div className={styles.popupContainer} onClick={e => e.stopPropagation()}>
            <div className={styles.popupHeader}>
              <h2>📊 Clinical Analytics</h2>
              <button className={styles.popupClose} onClick={() => setShowAnalyticsPopup(false)}>✕</button>
            </div>
            <div className={styles.popupBody}>
              <div className={styles.analyticsCard}>
                <h3>📈 Consultation Trends - Last 7 Days</h3>
                <div className={styles.weeklyChart}>
                  {stats.consultationsByDay.map((day, idx) => (
                    <div key={idx} className={styles.chartBarItem}>
                      <div className={styles.chartBarContainer}>
                        <div className={styles.chartBar} style={{ height: `${(day.count / maxCount) * 150}px` }}>
                          <span className={styles.barValue}>{day.count}</span>
                        </div>
                      </div>
                      <span className={styles.barLabel}>{day.day}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles.analyticsCard}>
                <h3>🏥 Top Diagnoses</h3>
                <div className={styles.diagnosesList}>
                  {stats.diagnoses.slice(0, 5).map((diag, idx) => (
                    <div key={idx} className={styles.diagnosisItem}>
                      <span className={styles.diagnosisRank}>#{idx + 1}</span>
                      <span className={styles.diagnosisName}>{diag.name}</span>
                      <div className={styles.diagnosisBarContainer}>
                        <div className={styles.diagnosisBar} style={{ width: `${(diag.count / (stats.diagnoses[0]?.count || 1)) * 100}%` }} />
                      </div>
                      <span className={styles.diagnosisCount}>{diag.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className={styles.popupFooter}>
              <button className={styles.closePopupBtn} onClick={() => setShowAnalyticsPopup(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Doctors Popup */}
      {showDoctorsPopup && (
        <div className={styles.popupOverlay} onClick={() => setShowDoctorsPopup(false)}>
          <div className={styles.popupContainer} onClick={e => e.stopPropagation()}>
            <div className={styles.popupHeader}>
              <h2>👨‍⚕️ Doctor Performance</h2>
              <button className={styles.popupClose} onClick={() => setShowDoctorsPopup(false)}>✕</button>
            </div>
            <div className={styles.popupBody}>
              <div className={styles.analyticsCard}>
                <h3>Workload Distribution</h3>
                <div className={styles.doctorsList}>
                  {stats.doctors.map((doctor, idx) => (
                    <div key={idx} className={styles.doctorItem}>
                      <div className={styles.doctorRank}>#{idx + 1}</div>
                      <div className={styles.doctorName}>{doctor.name}</div>
                      <div className={styles.doctorBarContainer}>
                        <div className={styles.doctorBar} style={{ width: `${(doctor.count / (stats.doctors[0]?.count || 1)) * 100}%` }} />
                      </div>
                      <div className={styles.doctorCount}>{doctor.count} consults</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className={styles.popupFooter}>
              <button className={styles.closePopupBtn} onClick={() => setShowDoctorsPopup(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Export Popup */}
      {showExportPopup && (
        <div className={styles.popupOverlay} onClick={() => setShowExportPopup(false)}>
          <div className={styles.popupContainer} onClick={e => e.stopPropagation()}>
            <div className={styles.popupHeader}>
              <h2>📥 Export Consultations</h2>
              <button className={styles.popupClose} onClick={() => setShowExportPopup(false)}>✕</button>
            </div>
            <div className={styles.popupBody}>
              <div className={styles.exportInfo}>
                <p>Exporting <strong>{filteredConsultations.length}</strong> consultations</p>
                <p>Format: CSV</p>
              </div>
            </div>
            <div className={styles.popupFooter}>
              <button className={styles.cancelPopupBtn} onClick={() => setShowExportPopup(false)}>Cancel</button>
              <button className={styles.confirmExportBtn} onClick={exportToCSV}>Download CSV</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}