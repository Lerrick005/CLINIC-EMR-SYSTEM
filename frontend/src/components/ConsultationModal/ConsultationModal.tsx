
'use client';

import React, { useState, useEffect } from 'react';
import styles from './ConsultationModal.module.css';

// Disease lists (simplified)
const adultDiseases = [
  { id: 1, keywords: ['diarrhoea', 'diarrhea'], name: 'Diarrhoea' },
  { id: 2, keywords: ['tuberculosis', 'tb'], name: 'Tuberculosis' },
  { id: 3, keywords: ['malaria'], name: 'Suspected Malaria' },
  { id: 4, keywords: ['confirmed malaria', 'malaria'], name: 'Confirmed Malaria' },
  { id: 5, keywords: ['hypertension', 'high blood pressure'], name: 'Hypertension' },
  { id: 6, keywords: ['diabetes', 'dm'], name: 'Diabetes' },
  { id: 7, keywords: ['pneumonia'], name: 'Pneumonia' },
  { id: 8, keywords: ['asthma'], name: 'Asthma' },
  { id: 9, keywords: ['uti', 'urinary tract infection'], name: 'Urinary Tract Infection' },
  { id: 10, keywords: ['typhoid fever', 'typhoid'], name: 'Typhoid Fever' },
];

const childrenDiseases = [
  { id: 1, keywords: ['diarrhoea'], name: 'Diarrhoea' },
  { id: 2, keywords: ['pneumonia'], name: 'Pneumonia' },
  { id: 3, keywords: ['malaria'], name: 'Suspected Malaria' },
  { id: 4, keywords: ['confirmed malaria', 'malaria'], name: 'Confirmed Malaria' },
  { id: 5, keywords: ['measles'], name: 'Measles' },
];

interface Disease {
  id: number;
  name: string;
}

const findDisease = (diagnosis: string, isChild: boolean): Disease | null => {
  if (!diagnosis) return null;
  const lowerDiagnosis = diagnosis.toLowerCase();
  const diseaseList = isChild ? childrenDiseases : adultDiseases;
  for (const disease of diseaseList) {
    for (const keyword of disease.keywords) {
      if (lowerDiagnosis.includes(keyword)) {
        return { id: disease.id, name: disease.name };
      }
    }
  }
  return null;
};

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: any;
  onSave: (data: any) => void;
  currentDoctor?: any;
}

interface Diagnosis {
  name: string;
  diseaseId: number | null;
  diseaseName: string;
}

interface Medication {
  id: number;
  name: string;
  dose: string;
  frequency: string;
  route: string;
  duration: string;
  instructions: string;
}

export default function ConsultationModal({ isOpen, onClose, patient, onSave, currentDoctor: propCurrentDoctor }: ConsultationModalProps) {
  const [activeTab, setActiveTab] = useState<string>('soap');
  const [diagnosisInput, setDiagnosisInput] = useState<string>('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [saving, setSaving] = useState<boolean>(false);
  const [currentDoctor, setCurrentDoctor] = useState<any>(null);

  // Get doctor from props or localStorage
  useEffect(() => {
    if (propCurrentDoctor && propCurrentDoctor.id) {
      setCurrentDoctor(propCurrentDoctor);
    } else {
      // Try to get from localStorage
      try {
        const user = localStorage.getItem('user');
        if (user) {
          const parsed = JSON.parse(user);
          if (parsed.id) {
            setCurrentDoctor(parsed);
          }
        }
      } catch (e) {
        console.error('Error getting doctor from localStorage:', e);
      }
    }
  }, [propCurrentDoctor]);

  const [formData, setFormData] = useState({
    chiefComplaint: '',
    historyOfPresentingIllness: '',
    reviewOfSystems: {
      constitutional: false,
      heent: false,
      cardiovascular: false,
      respiratory: false,
      gastrointestinal: false,
      musculoskeletal: false,
      neurological: false,
      psychiatric: false
    },
    vitals: {
      bp: '',
      hr: '',
      temp: '',
      rr: '',
      o2: '',
      weight: '',
      height: '',
      bmi: ''
    },
    physicalExam: {
      general: '',
      heent: '',
      cardiovascular: '',
      respiratory: '',
      abdominal: '',
      neurological: ''
    },
    diagnoses: [] as Diagnosis[],
    differential: '',
    treatmentPlan: '',
    followUpPlan: '',
    amountDue: '',
    patientEducation: '',
    medications: [] as Medication[]
  });

  const [medicationInput, setMedicationInput] = useState({
    name: '',
    dose: '',
    frequency: 'QD',
    route: 'PO',
    duration: '',
    instructions: ''
  });

  const frequencies = ['QD', 'BID', 'TID', 'QID', 'QHS', 'PRN', 'STAT'];
  const routes = ['PO', 'IV', 'IM', 'SC', 'SL', 'PR', 'TOP'];

  const getPatientAge = (): number => {
    if (patient?.age) return parseInt(patient.age);
    if (patient?.date_of_birth) {
      const birthDate = new Date(patient.date_of_birth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    }
    return 30;
  };

  const patientAge = getPatientAge();
  const isChild = patientAge < 18;

  const calculateBMI = (): void => {
    const weight = parseFloat(formData.vitals.weight);
    const height = parseFloat(formData.vitals.height);
    if (weight && height) {
      const bmi = (weight / ((height/100) * (height/100))).toFixed(1);
      setFormData({ ...formData, vitals: { ...formData.vitals, bmi } });
    }
  };

  const handleAddDiagnosis = (): void => {
    if (diagnosisInput.trim()) {
      const disease = findDisease(diagnosisInput, isChild);
      setFormData({
        ...formData,
        diagnoses: [...formData.diagnoses, {
          name: diagnosisInput,
          diseaseId: disease?.id || null,
          diseaseName: disease?.name || diagnosisInput
        }]
      });
      setDiagnosisInput('');
      setErrors({ ...errors, diagnosis: '' });
    }
  };

  const handleRemoveDiagnosis = (index: number): void => {
    const newDiag = [...formData.diagnoses];
    newDiag.splice(index, 1);
    setFormData({ ...formData, diagnoses: newDiag });
  };

  const handleAddMedication = (): void => {
    if (medicationInput.name.trim()) {
      setFormData({
        ...formData,
        medications: [...formData.medications, { ...medicationInput, id: Date.now() }]
      });
      setMedicationInput({
        name: '',
        dose: '',
        frequency: 'QD',
        route: 'PO',
        duration: '',
        instructions: ''
      });
    }
  };

  const handleRemoveMedication = (index: number): void => {
    const newMeds = [...formData.medications];
    newMeds.splice(index, 1);
    setFormData({ ...formData, medications: newMeds });
  };

  const validate = (): { [key: string]: string } => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.chiefComplaint.trim()) {
      newErrors.chiefComplaint = 'Chief complaint is required';
    }
    if (formData.diagnoses.length === 0 && !diagnosisInput.trim()) {
      newErrors.diagnosis = 'Please add at least one diagnosis';
    }
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    // Use the doctor we already have
    let doctorId = currentDoctor?.id;
    let doctorName = currentDoctor ? `Dr. ${currentDoctor.firstName} ${currentDoctor.lastName}` : null;

    if (!doctorId) {
      // Try one more time to get from localStorage
      try {
        const user = localStorage.getItem('user');
        if (user) {
          const parsed = JSON.parse(user);
          if (parsed.id) {
            doctorId = parsed.id;
            doctorName = `Dr. ${parsed.firstName} ${parsed.lastName}`;
          }
        }
      } catch (e) {
        console.error('Error getting doctor from localStorage:', e);
      }
    }

    // If still no doctor, show error
    if (!doctorId) {
      alert('⚠️ No doctor found! Please ensure you are logged in as a doctor or clinic admin.');
      return;
    }

    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      if (newErrors.diagnosis) {
        alert('⚠️ Please add a diagnosis before saving!');
      }
      return;
    }

    setSaving(true);

    const primaryDiagnosis = formData.diagnoses.length > 0 ? formData.diagnoses[0].name : diagnosisInput.trim();

    const vitalsForBackend = {
      bp_systolic: formData.vitals.bp ? parseInt(formData.vitals.bp.split('/')[0]) : null,
      bp_diastolic: formData.vitals.bp ? parseInt(formData.vitals.bp.split('/')[1]) : null,
      heart_rate: formData.vitals.hr ? parseInt(formData.vitals.hr) : null,
      temperature: formData.vitals.temp ? parseFloat(formData.vitals.temp) : null,
      respiratory_rate: formData.vitals.rr ? parseInt(formData.vitals.rr) : null,
      oxygen_saturation: formData.vitals.o2 ? parseInt(formData.vitals.o2) : null,
      weight: formData.vitals.weight ? parseFloat(formData.vitals.weight) : null,
      height: formData.vitals.height ? parseFloat(formData.vitals.height) : null,
      bmi: formData.vitals.bmi ? parseFloat(formData.vitals.bmi) : null
    };

    const consultationData = {
      patient_id: patient.id,
      doctor_id: doctorId,
      chief_complaint: formData.chiefComplaint,
      history_of_presenting_illness: formData.historyOfPresentingIllness,
      review_of_systems: formData.reviewOfSystems,
      physical_examination: formData.physicalExam,
      vitals: vitalsForBackend,
      diagnosis: primaryDiagnosis,
      differential_diagnosis: formData.differential,
      treatment_plan: formData.treatmentPlan,
      follow_up_plan: formData.followUpPlan,
      amount_due: parseFloat(formData.amountDue) || 0,
      prescriptions: formData.medications,
      notes: formData.patientEducation,
      patient_age: patientAge
    };

    try {
      await onSave(consultationData);
      onClose();
    } catch (error) {
      console.error('Error saving consultation:', error);
      alert('Failed to save consultation');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  // Show doctor warning if no doctor found
  const showDoctorWarning = !currentDoctor || !currentDoctor.id;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>New Consultation</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {showDoctorWarning && (
          <div style={{ 
            background: '#fee2e2', 
            color: '#991b1b', 
            padding: '12px 16px', 
            margin: '0 20px 16px 20px',
            borderRadius: '8px',
            borderLeft: '4px solid #dc2626'
          }}>
            ⚠️ No doctor assigned. The consultation will use your account as the doctor.
          </div>
        )}

        <div className={styles.patientInfo}>
          <span className={styles.patientName}>{patient?.first_name} {patient?.last_name}</span>
          <span className={styles.patientAge}>{patientAge} years • {isChild ? '👶 Child' : '👨 Adult'}</span>
          {currentDoctor && (
            <span style={{ marginLeft: 'auto', color: '#10b981', fontSize: '12px' }}>
              👨‍⚕️ {currentDoctor.firstName} {currentDoctor.lastName}
            </span>
          )}
        </div>

        {/* SOAP Tabs */}
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${activeTab === 'soap' ? styles.active : ''}`} onClick={() => setActiveTab('soap')}>
            📝 Subjective
          </button>
          <button className={`${styles.tab} ${activeTab === 'objective' ? styles.active : ''}`} onClick={() => setActiveTab('objective')}>
            📊 Objective
          </button>
          <button className={`${styles.tab} ${activeTab === 'assessment' ? styles.active : ''}`} onClick={() => setActiveTab('assessment')}>
            📋 Assessment
          </button>
          <button className={`${styles.tab} ${activeTab === 'plan' ? styles.active : ''}`} onClick={() => setActiveTab('plan')}>
            💊 Plan
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.tabContent}>
            {activeTab === 'soap' && (
              <>
                <div className={styles.formGroup}>
                  <label className={errors.chiefComplaint ? styles.error : ''}>Chief Complaint *</label>
                  <textarea
                    rows={3}
                    value={formData.chiefComplaint}
                    onChange={(e) => {
                      setFormData({...formData, chiefComplaint: e.target.value});
                      setErrors({...errors, chiefComplaint: ''});
                    }}
                    placeholder="What is the patient's main concern?"
                  />
                  {errors.chiefComplaint && <span className={styles.errorMsg}>{errors.chiefComplaint}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label>History of Presenting Illness</label>
                  <textarea
                    rows={4}
                    value={formData.historyOfPresentingIllness}
                    onChange={(e) => setFormData({...formData, historyOfPresentingIllness: e.target.value})}
                    placeholder="Describe the history in detail..."
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Review of Systems</label>
                  <div className={styles.rosGrid}>
                    {Object.entries(formData.reviewOfSystems).map(([key, value]) => (
                      <label key={key} className={styles.checkbox}>
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => setFormData({...formData, reviewOfSystems: {...formData.reviewOfSystems, [key]: e.target.checked}})}
                        />
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'objective' && (
              <>
                <div className={styles.formGroup}>
                  <label>Vital Signs</label>
                  <div className={styles.vitalsGrid}>
                    <input type="text" placeholder="BP (120/80)" value={formData.vitals.bp} onChange={(e) => setFormData({...formData, vitals: {...formData.vitals, bp: e.target.value}})} />
                    <input type="number" placeholder="Heart Rate" value={formData.vitals.hr} onChange={(e) => setFormData({...formData, vitals: {...formData.vitals, hr: e.target.value}})} />
                    <input type="number" step="0.1" placeholder="Temperature" value={formData.vitals.temp} onChange={(e) => setFormData({...formData, vitals: {...formData.vitals, temp: e.target.value}})} />
                    <input type="number" placeholder="Respiratory Rate" value={formData.vitals.rr} onChange={(e) => setFormData({...formData, vitals: {...formData.vitals, rr: e.target.value}})} />
                    <input type="number" placeholder="O2 Saturation" value={formData.vitals.o2} onChange={(e) => setFormData({...formData, vitals: {...formData.vitals, o2: e.target.value}})} />
                    <input type="number" step="0.1" placeholder="Weight (kg)" value={formData.vitals.weight} onChange={(e) => { setFormData({...formData, vitals: {...formData.vitals, weight: e.target.value}}); setTimeout(calculateBMI, 100); }} />
                    <input type="number" placeholder="Height (cm)" value={formData.vitals.height} onChange={(e) => { setFormData({...formData, vitals: {...formData.vitals, height: e.target.value}}); setTimeout(calculateBMI, 100); }} />
                    <input type="text" placeholder="BMI" value={formData.vitals.bmi} readOnly />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Physical Examination</label>
                  <div className={styles.examGrid}>
                    <textarea placeholder="General appearance..." value={formData.physicalExam.general} onChange={(e) => setFormData({...formData, physicalExam: {...formData.physicalExam, general: e.target.value}})} rows={2} />
                    <textarea placeholder="HEENT findings..." value={formData.physicalExam.heent} onChange={(e) => setFormData({...formData, physicalExam: {...formData.physicalExam, heent: e.target.value}})} rows={2} />
                    <textarea placeholder="Cardiovascular..." value={formData.physicalExam.cardiovascular} onChange={(e) => setFormData({...formData, physicalExam: {...formData.physicalExam, cardiovascular: e.target.value}})} rows={2} />
                    <textarea placeholder="Respiratory..." value={formData.physicalExam.respiratory} onChange={(e) => setFormData({...formData, physicalExam: {...formData.physicalExam, respiratory: e.target.value}})} rows={2} />
                    <textarea placeholder="Abdominal..." value={formData.physicalExam.abdominal} onChange={(e) => setFormData({...formData, physicalExam: {...formData.physicalExam, abdominal: e.target.value}})} rows={2} />
                    <textarea placeholder="Neurological..." value={formData.physicalExam.neurological} onChange={(e) => setFormData({...formData, physicalExam: {...formData.physicalExam, neurological: e.target.value}})} rows={2} />
                  </div>
                </div>
              </>
            )}

            {activeTab === 'assessment' && (
              <>
                <div className={styles.formGroup}>
                  <label className={styles.required}>Diagnosis *</label>
                  <div className={styles.diagnosisRow}>
                    <input
                      type="text"
                      value={diagnosisInput}
                      onChange={(e) => setDiagnosisInput(e.target.value)}
                      placeholder="Enter diagnosis..."
                    />
                    <button type="button" onClick={handleAddDiagnosis}>Add</button>
                  </div>
                  <div className={styles.diagnosisList}>
                    {formData.diagnoses.map((diag, index) => (
                      <div key={index} className={styles.diagnosisTag}>
                        <span>📋 {diag.name}</span>
                        {diag.diseaseId && <span className={styles.diseaseBadge}>✅</span>}
                        <button type="button" onClick={() => handleRemoveDiagnosis(index)}>✕</button>
                      </div>
                    ))}
                  </div>
                  {errors.diagnosis && <span className={styles.errorMsg}>⚠️ {errors.diagnosis}</span>}
                  {formData.diagnoses.length > 0 && (
                    <div className={styles.surveillanceNotice}>
                      <span>📊 Will be recorded in <strong>{isChild ? 'CHILDREN' : 'ADULTS'}</strong> Surveillance</span>
                    </div>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>Differential Diagnoses</label>
                  <textarea
                    rows={3}
                    value={formData.differential}
                    onChange={(e) => setFormData({...formData, differential: e.target.value})}
                    placeholder="List other conditions to consider..."
                  />
                </div>
              </>
            )}

            {activeTab === 'plan' && (
              <>
                <div className={styles.formGroup}>
                  <label>💊 Treatment Plan</label>
                  <textarea
                    rows={3}
                    value={formData.treatmentPlan}
                    onChange={(e) => setFormData({...formData, treatmentPlan: e.target.value})}
                    placeholder="Describe the treatment to be given..."
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>📅 Follow-up Plan</label>
                  <textarea
                    rows={2}
                    value={formData.followUpPlan}
                    onChange={(e) => setFormData({...formData, followUpPlan: e.target.value})}
                    placeholder="When should the patient return?"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>💰 Amount Due (KES)</label>
                  <input
                    type="number"
                    value={formData.amountDue}
                    onChange={(e) => setFormData({...formData, amountDue: e.target.value})}
                    placeholder="e.g., 800"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>💊 Medications</label>
                  <div className={styles.medRow}>
                    <input type="text" placeholder="Medication name" value={medicationInput.name} onChange={(e) => setMedicationInput({...medicationInput, name: e.target.value})} />
                    <input type="text" placeholder="Dose" value={medicationInput.dose} onChange={(e) => setMedicationInput({...medicationInput, dose: e.target.value})} />
                    <select value={medicationInput.frequency} onChange={(e) => setMedicationInput({...medicationInput, frequency: e.target.value})}>
                      {frequencies.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                    <select value={medicationInput.route} onChange={(e) => setMedicationInput({...medicationInput, route: e.target.value})}>
                      {routes.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <input type="text" placeholder="Duration" value={medicationInput.duration} onChange={(e) => setMedicationInput({...medicationInput, duration: e.target.value})} />
                    <input type="text" placeholder="Instructions" value={medicationInput.instructions} onChange={(e) => setMedicationInput({...medicationInput, instructions: e.target.value})} />
                    <button type="button" onClick={handleAddMedication}>Add</button>
                  </div>
                  <div className={styles.medList}>
                    {formData.medications.map((med, index) => (
                      <div key={med.id} className={styles.medItem}>
                        <span><strong>{med.name}</strong> {med.dose} {med.route} {med.frequency}</span>
                        <span className={styles.medDetails}>{med.duration} • {med.instructions}</span>
                        <button type="button" onClick={() => handleRemoveMedication(index)}>✕</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>📝 Patient Education & Notes</label>
                  <textarea
                    rows={4}
                    value={formData.patientEducation}
                    onChange={(e) => setFormData({...formData, patientEducation: e.target.value})}
                    placeholder="Document what was discussed with the patient..."
                  />
                </div>
              </>
            )}
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.saveBtn} disabled={saving}>
              {saving ? 'Saving...' : 'Save Consultation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

