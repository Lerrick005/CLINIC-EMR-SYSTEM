

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, BarChart3, Download, Printer, ChevronDown, ChevronUp } from 'lucide-react';
import styles from './consultations.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

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
    total: 0, today: 0, thisWeek: 0, thisMonth: 0,
    topDiagnosis: null, topDiagnosisCount: 0, avgPerDay: 0,
    consultationsByDay: [], consultationsByMonth: [], doctors: [], diagnoses: []
  });

  useEffect(() => { fetchPatients(); fetchConsultations(); }, []);

  const fetchPatients = async () => {
    try {
      setLoadingPatients(true);
      const response = await fetch(`${API_URL}/patients`);
      const data = await response.json();
      if (data.success && Array.isArray(data.patients)) setPatients(data.patients);
      else if (Array.isArray(data)) setPatients(data);
      else setPatients([]);
    } catch (error) { setPatients([]); }
    finally { setLoadingPatients(false); }
  };

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/consultations`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.consultations)) { setConsultations(data.consultations); calculateStats(data.consultations); }
        else if (Array.isArray(data)) { setConsultations(data); calculateStats(data); }
        else setConsultations([]);
      } else setConsultations([]);
    } catch (error) { setConsultations([]); }
    finally { setLoading(false); }
  };

  const calculateStats = (data: Consultation[]) => {
    const today = new Date(); today.setHours(0,0,0,0);
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate()-7); weekAgo.setHours(0,0,0,0);
    const monthAgo = new Date(); monthAgo.setMonth(monthAgo.getMonth()-1); monthAgo.setHours(0,0,0,0);
    const todayCount = data.filter(c => new Date(c.consultation_date).setHours(0,0,0,0) === today.getTime()).length;
    const weekCount = data.filter(c => new Date(c.consultation_date).setHours(0,0,0,0) >= weekAgo.getTime()).length;
    const monthCount = data.filter(c => new Date(c.consultation_date).setHours(0,0,0,0) >= monthAgo.getTime()).length;
    
    const consultationsByDay = [];
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    for (let i=6; i>=0; i--) {
      const date = new Date(); date.setDate(date.getDate()-i); date.setHours(0,0,0,0);
      const dayName = days[date.getDay()];
      const count = data.filter(c => new Date(c.consultation_date).setHours(0,0,0,0) === date.getTime()).length;
      consultationsByDay.push({ day: dayName, count, fullDate: date });
    }
    
    const consultationsByMonth = [];
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    for (let i=5; i>=0; i--) {
      const date = new Date(); date.setMonth(date.getMonth()-i);
      const monthName = monthNames[date.getMonth()]; const year = date.getFullYear();
      const count = data.filter(c => { const d = new Date(c.consultation_date); return d.getMonth()===date.getMonth() && d.getFullYear()===year; }).length;
      consultationsByMonth.push({ month: `${monthName} ${year}`, count });
    }
    
    const diagnosisCount: Record<string,number> = {};
    data.forEach(c => { if(c.diagnosis?.trim()) diagnosisCount[c.diagnosis]=(diagnosisCount[c.diagnosis]||0)+1; });
    const diagnoses = Object.entries(diagnosisCount).map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count).slice(0,10);
    
    const doctorCount: Record<string,number> = {};
    data.forEach(c => { const n = `${c.doctor_first_name||''} ${c.doctor_last_name||''}`.trim()||'Unknown'; doctorCount[n]=(doctorCount[n]||0)+1; });
    const doctors = Object.entries(doctorCount).map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count);
    
    const firstDate = data.length>0 ? new Date(data[data.length-1].consultation_date) : new Date();
    const lastDate = data.length>0 ? new Date(data[0].consultation_date) : new Date();
    const daysDiff = Math.max(1, Math.ceil((lastDate.getTime()-firstDate.getTime())/(86400000)));
    
    setStats({
      total: data.length, today: todayCount, thisWeek: weekCount, thisMonth: monthCount,
      topDiagnosis: diagnoses[0]?.name||null, topDiagnosisCount: diagnoses[0]?.count||0,
      avgPerDay: Math.round((data.length/daysDiff)*10)/10,
      consultationsByDay, consultationsByMonth, doctors, diagnoses
    });
  };

  const getPatientName = (p: Patient) => p.name || `${p.first_name||''} ${p.last_name||''}`.trim() || 'Unnamed Patient';
  const getConsultationPatientName = (c: Consultation) => `${c.first_name||''} ${c.last_name||''}`.trim() || 'Unknown Patient';
  const getDoctorName = (c: Consultation) => `${c.doctor_first_name||''} ${c.doctor_last_name||''}`.trim() || 'Dr. System';
  const formatDate = (d: string) => { if(!d) return '—'; const dt=new Date(d), td=new Date(), yd=new Date(td); yd.setDate(yd.getDate()-1); if(dt.toDateString()===td.toDateString()) return 'Today'; if(dt.toDateString()===yd.toDateString()) return 'Yesterday'; return dt.toLocaleDateString('en-KE',{year:'numeric',month:'short',day:'numeric'}); };
  const getPatientConsultations = () => selectedPatient ? consultations.filter(c => c.patient_id===selectedPatient.id) : [];
  const filteredConsultations = getPatientConsultations();
  const maxCount = Math.max(...stats.consultationsByDay.map(d=>d.count),1);

  if (loadingPatients) return <div className={styles.consultSplit}><div className={styles.loadingSpinner}></div><p>Loading patients...</p></div>;

  return (
    <div className={styles.consultSplit}>
      <div className={styles.consultLeftPanel}>
        <div className={styles.panelHeader}><h2>👥 Patients</h2><p>Select a patient to view consultations</p></div>
        <div className={styles.patientListScroll}>
          {patients.length===0 ? <div style={{textAlign:'center',padding:'40px',color:'#999'}}><p>No patients found</p></div> :
            patients.map(patient => {
              const patientName = getPatientName(patient);
              const patientConsultations = consultations.filter(c=>c.patient_id===patient.id);
              const isSelected = selectedPatient?.id===patient.id;
              return (
                <div key={patient.id} className={`${styles.patientItem} ${isSelected?styles.selected:''}`} onClick={()=>setSelectedPatient(patient)}>
                  <div className={styles.patientAvatarSmall}>{patient.gender==='Male'?'👨':'👩'}</div>
                  <div className={styles.patientDetailsSmall}><div className={styles.patientNameSmall}>{patientName}</div><div className={styles.patientMetaSmall}><span>{patient.age||'N/A'} years</span><span>{patientConsultations.length} visits</span></div></div>
                  {isSelected && <div className={styles.selectedBadge}>✓</div>}
                </div>
              );
            })
          }
        </div>
      </div>

      <div className={styles.consultRightPanel}>
        <div className={styles.rightHeader}>
          <div><h1>🩺 Consultations</h1><p>View and manage patient consultations</p></div>
          <div className={styles.actionButtonsGroup}>
            <button className={styles.actionIconBtn} onClick={()=>setShowAnalyticsPopup(true)}><BarChart3 size={16}/> Analytics</button>
            <button className={styles.actionIconBtn} onClick={()=>setShowDoctorsPopup(true)}><Users size={16}/> Doctors</button>
            <button className={styles.actionIconBtn} onClick={()=>setShowExportPopup(true)}><Download size={16}/> Export</button>
          </div>
        </div>
        <div className={styles.statsBadges}>
          <span className={styles.statBadge}>📋 {stats.total} Total</span>
          <span className={styles.statBadge}>📅 {stats.today} Today</span>
          <span className={styles.statBadge}>📊 {stats.thisWeek} This Week</span>
          <span className={styles.statBadge}>🏆 Top Dx: {stats.topDiagnosis?.substring(0,20)||'None'}</span>
        </div>
        {selectedPatient ? (
          <div className={styles.selectedPatientCard}>
            <div className={styles.selectedPatientAvatar}>{selectedPatient.gender==='Male'?'👨':'👩'}</div>
            <div className={styles.selectedPatientDetails}><h3>{getPatientName(selectedPatient)}</h3><p>{selectedPatient.age||'N/A'} years • {selectedPatient.phone||'No phone'}</p><p>Medical No: {selectedPatient.medical_no||'N/A'}</p></div>
            <button className={styles.changePatientBtn} onClick={()=>setSelectedPatient(null)}>Change</button>
          </div>
        ) : (
          <div className={styles.noPatientWarning}><span>⚠️</span><p>Please select a patient from the left panel</p></div>
        )}
        <div className={styles.controlsBar}>
          <div className={styles.searchBox}><span className={styles.searchIcon}>🔍</span><input type="text" placeholder="Search by diagnosis..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/></div>
          <div className={styles.dateFilters}>
            {['all','today','week','month'].map(f=> <button key={f} className={`${styles.filterBtn} ${dateFilter===f?styles.active:''}`} onClick={()=>setDateFilter(f)}>{f==='all'?'All':f==='today'?'Today':f==='week'?'This Week':'This Month'}</button>)}
          </div>
          <button className={styles.newConsultBtn} onClick={()=>router.push('/consultations/new')}><span>📝</span> New Consultation</button>
        </div>
        <div className={styles.consultationsScroll}>
          {!selectedPatient ? <div className={styles.emptyState}><span>👈</span><h3>Select a Patient</h3></div> :
           filteredConsultations.length===0 ? <div className={styles.emptyState}><span>📋</span><h3>No consultations</h3><button onClick={()=>router.push('/consultations/new')}>+ Start First Consultation</button></div> :
           filteredConsultations.map(c => {
             const isExpanded = expandedId===c.id;
             return (
               <div key={c.id} className={styles.consultationCard}>
                 <div className={styles.cardHeader} onClick={()=>setExpandedId(isExpanded?null:c.id)}>
                   <div className={styles.consultDateBadge}><span>{formatDate(c.consultation_date)}</span><span>{new Date(c.consultation_date).toLocaleTimeString()}</span></div>
                   <div className={styles.consultSummaryCompact}><span>{c.chief_complaint?.substring(0,60)||'—'}</span>{c.diagnosis&&<span className={styles.diagnosisTag}>{c.diagnosis}</span>}</div>
                   <div className={styles.expandIcon}>{isExpanded?<ChevronUp size={18}/>:<ChevronDown size={18}/>}</div>
                 </div>
                 {isExpanded && (
                   <div className={styles.cardDetails}>
                     <div className={styles.detailsGrid}>
                       <div><b>Chief Complaint</b><p>{c.chief_complaint||'—'}</p></div>
                       <div><b>Diagnosis</b><p>{c.diagnosis||'—'}</p></div>
                       <div><b>Treatment Plan</b><p>{c.treatment_plan||'—'}</p></div>
                     </div>
                     <button onClick={()=>{const w=window.open('','_blank'); w?.document.write(`<html><head><title>Consultation</title></head><body><h1>${getConsultationPatientName(c)}</h1><p>${c.chief_complaint}</p><p>${c.diagnosis}</p><p>${c.treatment_plan}</p></body></html>`); w?.print();}}><Printer size={14}/> Print</button>
                   </div>
                 )}
               </div>
             );
           })
          }
        </div>
      </div>

      {showAnalyticsPopup && (
        <div className={styles.popupOverlay} onClick={()=>setShowAnalyticsPopup(false)}>
          <div className={styles.popupContainer} onClick={e=>e.stopPropagation()}>
            <div className={styles.popupHeader}><h2>📊 Clinical Analytics</h2><button onClick={()=>setShowAnalyticsPopup(false)}>✕</button></div>
            <div className={styles.popupBody}>
              <h3>📈 Last 7 Days</h3>
              <div className={styles.weeklyChart}>
                {stats.consultationsByDay.map((d,i)=><div key={i}><div style={{height:`${(d.count/maxCount)*150}px`,background:'#3b82f6',width:'30px',borderRadius:'4px'}}></div><span>{d.day}</span><span>{d.count}</span></div>)}
              </div>
              <h3>🏥 Top Diagnoses</h3>
              {stats.diagnoses.slice(0,5).map((d,i)=><div key={i}><span>#{i+1}</span><span>{d.name}</span><span>{d.count}</span></div>)}
            </div>
          </div>
        </div>
      )}
      {showDoctorsPopup && (
        <div className={styles.popupOverlay} onClick={()=>setShowDoctorsPopup(false)}>
          <div className={styles.popupContainer} onClick={e=>e.stopPropagation()}>
            <div className={styles.popupHeader}><h2>👨‍⚕️ Doctors</h2><button onClick={()=>setShowDoctorsPopup(false)}>✕</button></div>
            <div className={styles.popupBody}>{stats.doctors.map((d,i)=><div key={i}><span>#{i+1}</span><span>{d.name}</span><span>{d.count} consults</span></div>)}</div>
          </div>
        </div>
      )}
      {showExportPopup && (
        <div className={styles.popupOverlay} onClick={()=>setShowExportPopup(false)}>
          <div className={styles.popupContainer} onClick={e=>e.stopPropagation()}>
            <div className={styles.popupHeader}><h2>📥 Export</h2><button onClick={()=>setShowExportPopup(false)}>✕</button></div>
            <div className={styles.popupBody}><p>Exporting {filteredConsultations.length} consultations as CSV</p></div>
            <div className={styles.popupFooter}><button onClick={()=>setShowExportPopup(false)}>Cancel</button><button onClick={()=>{const csv=filteredConsultations.map(c=>[c.consultation_date,getConsultationPatientName(c),getDoctorName(c),c.diagnosis||'',c.chief_complaint||''].join(',')).join('\n'); const b=new Blob([csv]); const u=URL.createObjectURL(b); const a=document.createElement('a'); a.href=u; a.download='consultations.csv'; a.click(); setShowExportPopup(false);}}>Download</button></div>
          </div>
        </div>
      )}
    </div>
  );
}