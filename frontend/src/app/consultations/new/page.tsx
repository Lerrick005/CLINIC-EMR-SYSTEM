'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import api from '../../../lib/api';

export default function NewConsultationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get('patientId');
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('soap');
  const [diagnosisInput, setDiagnosisInput] = useState('');
  const [errors, setErrors] = useState<any>({});

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
    diagnoses: [],
    differential: '',
    treatmentPlan: '',
    followUpPlan: '',
    amountDue: '',
    patientEducation: '',
    medications: []
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

  useEffect(() => {
    if (patientId) {
      fetchPatient();
    }
  }, [patientId]);

  const fetchPatient = async () => {
    try {
      const res = await api.get(`/patients/${patientId}`);
      if (res.data.success) {
        setPatient(res.data.patient);
      }
    } catch (error) {
      console.error('Error fetching patient:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPatientAge = () => {
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

  const calculateBMI = () => {
    const weight = parseFloat(formData.vitals.weight);
    const height = parseFloat(formData.vitals.height);
    if (weight && height) {
      const bmi = (weight / ((height/100) * (height/100))).toFixed(1);
      setFormData({ ...formData, vitals: { ...formData.vitals, bmi } });
    }
  };

  const handleAddDiagnosis = () => {
    if (diagnosisInput.trim()) {
      setFormData({
        ...formData,
        diagnoses: [...formData.diagnoses, { name: diagnosisInput }]
      });
      setDiagnosisInput('');
      setErrors({ ...errors, diagnosis: null });
    }
  };

  const handleRemoveDiagnosis = (index: number) => {
    const newDiag = [...formData.diagnoses];
    newDiag.splice(index, 1);
    setFormData({ ...formData, diagnoses: newDiag });
  };

  const handleAddMedication = () => {
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

  const handleRemoveMedication = (index: number) => {
    const newMeds = [...formData.medications];
    newMeds.splice(index, 1);
    setFormData({ ...formData, medications: newMeds });
  };

  const validate = () => {
    const newErrors: any = {};
    if (!formData.chiefComplaint.trim()) {
      newErrors.chiefComplaint = 'Chief complaint is required';
    }
    if (formData.diagnoses.length === 0 && !diagnosisInput.trim()) {
      newErrors.diagnosis = 'Please add at least one diagnosis';
    }
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      if (newErrors.diagnosis) {
        alert('⚠️ Please add a diagnosis before saving!');
      }
      setSaving(false);
      return;
    }

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
      const res = await api.post('/consultations', consultationData);
      if (res.data.success) {
        alert('✅ Consultation saved successfully!');
        router.push(`/patients`);
      } else {
        alert('❌ Failed to save consultation');
      }
    } catch (error: any) {
      console.error('Error saving consultation:', error);
      alert(error.response?.data?.error || '❌ Error saving consultation');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '24px', color: '#475569', background: '#F8FAFC', minHeight: '100vh' }}>Loading patient...</div>;
  }

  if (!patient) {
    return (
      <div style={{ padding: '24px', color: '#475569', background: '#F8FAFC', minHeight: '100vh' }}>
        <h2>No patient selected</h2>
        <p>Please select a patient from the patients page.</p>
        <button onClick={() => router.push('/patients')} style={{ marginTop: '16px', padding: '8px 16px', background: '#2563EB', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          Go to Patients
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto', background: '#F8FAFC', minHeight: '100vh' }}>
      <button onClick={() => router.back()} style={{ color: '#475569', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '16px', fontSize: '14px' }}>
        ← Back
      </button>

      <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0F172A', margin: '0' }}>New Consultation</h1>
            <p style={{ color: '#475569', marginTop: '4px' }}>
              Patient: <strong>{patient.first_name} {patient.last_name}</strong> • {patientAge} years • {isChild ? '👶 Child' : '👨 Adult'}
            </p>
          </div>
        </div>

        {/* SOAP Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
          <button
            onClick={() => setActiveTab('soap')}
            style={{
              padding: '8px 16px',
              background: activeTab === 'soap' ? '#2563EB' : 'transparent',
              color: activeTab === 'soap' ? 'white' : '#475569',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: activeTab === 'soap' ? '600' : '400'
            }}
          >
            📝 Subjective
          </button>
          <button
            onClick={() => setActiveTab('objective')}
            style={{
              padding: '8px 16px',
              background: activeTab === 'objective' ? '#2563EB' : 'transparent',
              color: activeTab === 'objective' ? 'white' : '#475569',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: activeTab === 'objective' ? '600' : '400'
            }}
          >
            📊 Objective
          </button>
          <button
            onClick={() => setActiveTab('assessment')}
            style={{
              padding: '8px 16px',
              background: activeTab === 'assessment' ? '#2563EB' : 'transparent',
              color: activeTab === 'assessment' ? 'white' : '#475569',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: activeTab === 'assessment' ? '600' : '400'
            }}
          >
            📋 Assessment
          </button>
          <button
            onClick={() => setActiveTab('plan')}
            style={{
              padding: '8px 16px',
              background: activeTab === 'plan' ? '#2563EB' : 'transparent',
              color: activeTab === 'plan' ? 'white' : '#475569',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: activeTab === 'plan' ? '600' : '400'
            }}
          >
            💊 Plan
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {activeTab === 'soap' && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: '600', color: '#0F172A', marginBottom: '4px' }}>Chief Complaint *</label>
                <textarea
                  rows={3}
                  value={formData.chiefComplaint}
                  onChange={(e) => setFormData({...formData, chiefComplaint: e.target.value})}
                  placeholder="What is the patient's main concern?"
                  style={{ width: '100%', padding: '10px', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '14px' }}
                  required
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: '600', color: '#0F172A', marginBottom: '4px' }}>History of Presenting Illness</label>
                <textarea
                  rows={4}
                  value={formData.historyOfPresentingIllness}
                  onChange={(e) => setFormData({...formData, historyOfPresentingIllness: e.target.value})}
                  placeholder="Describe the history in detail..."
                  style={{ width: '100%', padding: '10px', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '14px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: '600', color: '#0F172A', marginBottom: '4px' }}>Review of Systems</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {Object.entries(formData.reviewOfSystems).map(([key, value]) => (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#475569' }}>
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
            </div>
          )}

          {activeTab === 'objective' && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: '600', color: '#0F172A', marginBottom: '4px' }}>Vital Signs</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
                  <input type="text" placeholder="BP (120/80)" value={formData.vitals.bp} onChange={(e) => setFormData({...formData, vitals: {...formData.vitals, bp: e.target.value}})} style={{ padding: '8px', border: '1px solid #E2E8F0', borderRadius: '6px' }} />
                  <input type="number" placeholder="Heart Rate" value={formData.vitals.hr} onChange={(e) => setFormData({...formData, vitals: {...formData.vitals, hr: e.target.value}})} style={{ padding: '8px', border: '1px solid #E2E8F0', borderRadius: '6px' }} />
                  <input type="number" step="0.1" placeholder="Temperature" value={formData.vitals.temp} onChange={(e) => setFormData({...formData, vitals: {...formData.vitals, temp: e.target.value}})} style={{ padding: '8px', border: '1px solid #E2E8F0', borderRadius: '6px' }} />
                  <input type="number" placeholder="Respiratory Rate" value={formData.vitals.rr} onChange={(e) => setFormData({...formData, vitals: {...formData.vitals, rr: e.target.value}})} style={{ padding: '8px', border: '1px solid #E2E8F0', borderRadius: '6px' }} />
                  <input type="number" placeholder="O2 Saturation" value={formData.vitals.o2} onChange={(e) => setFormData({...formData, vitals: {...formData.vitals, o2: e.target.value}})} style={{ padding: '8px', border: '1px solid #E2E8F0', borderRadius: '6px' }} />
                  <input type="number" step="0.1" placeholder="Weight (kg)" value={formData.vitals.weight} onChange={(e) => { setFormData({...formData, vitals: {...formData.vitals, weight: e.target.value}}); setTimeout(calculateBMI, 100); }} style={{ padding: '8px', border: '1px solid #E2E8F0', borderRadius: '6px' }} />
                  <input type="number" placeholder="Height (cm)" value={formData.vitals.height} onChange={(e) => { setFormData({...formData, vitals: {...formData.vitals, height: e.target.value}}); setTimeout(calculateBMI, 100); }} style={{ padding: '8px', border: '1px solid #E2E8F0', borderRadius: '6px' }} />
                  <input type="text" placeholder="BMI" value={formData.vitals.bmi} readOnly style={{ padding: '8px', border: '1px solid #E2E8F0', borderRadius: '6px', background: '#f1f5f9' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: '600', color: '#0F172A', marginBottom: '4px' }}>Physical Examination</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <textarea placeholder="General appearance..." value={formData.physicalExam.general} onChange={(e) => setFormData({...formData, physicalExam: {...formData.physicalExam, general: e.target.value}})} rows={2} style={{ padding: '8px', border: '1px solid #E2E8F0', borderRadius: '6px' }} />
                  <textarea placeholder="HEENT findings..." value={formData.physicalExam.heent} onChange={(e) => setFormData({...formData, physicalExam: {...formData.physicalExam, heent: e.target.value}})} rows={2} style={{ padding: '8px', border: '1px solid #E2E8F0', borderRadius: '6px' }} />
                  <textarea placeholder="Cardiovascular..." value={formData.physicalExam.cardiovascular} onChange={(e) => setFormData({...formData, physicalExam: {...formData.physicalExam, cardiovascular: e.target.value}})} rows={2} style={{ padding: '8px', border: '1px solid #E2E8F0', borderRadius: '6px' }} />
                  <textarea placeholder="Respiratory..." value={formData.physicalExam.respiratory} onChange={(e) => setFormData({...formData, physicalExam: {...formData.physicalExam, respiratory: e.target.value}})} rows={2} style={{ padding: '8px', border: '1px solid #E2E8F0', borderRadius: '6px' }} />
                  <textarea placeholder="Abdominal..." value={formData.physicalExam.abdominal} onChange={(e) => setFormData({...formData, physicalExam: {...formData.physicalExam, abdominal: e.target.value}})} rows={2} style={{ padding: '8px', border: '1px solid #E2E8F0', borderRadius: '6px' }} />
                  <textarea placeholder="Neurological..." value={formData.physicalExam.neurological} onChange={(e) => setFormData({...formData, physicalExam: {...formData.physicalExam, neurological: e.target.value}})} rows={2} style={{ padding: '8px', border: '1px solid #E2E8F0', borderRadius: '6px' }} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'assessment' && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: '600', color: '#0F172A', marginBottom: '4px' }}>Diagnosis *</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    value={diagnosisInput}
                    onChange={(e) => setDiagnosisInput(e.target.value)}
                    placeholder="Enter diagnosis..."
                    style={{ flex: 1, padding: '8px', border: '1px solid #E2E8F0', borderRadius: '6px' }}
                  />
                  <button type="button" onClick={handleAddDiagnosis} style={{ padding: '8px 16px', background: '#2563EB', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Add</button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                  {formData.diagnoses.map((diag, index) => (
                    <span key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 10px', background: '#f1f5f9', borderRadius: '12px', fontSize: '13px' }}>
                      📋 {diag.name}
                      <button type="button" onClick={() => handleRemoveDiagnosis(index)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>✕</button>
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: '600', color: '#0F172A', marginBottom: '4px' }}>Differential Diagnoses</label>
                <textarea rows={3} value={formData.differential} onChange={(e) => setFormData({...formData, differential: e.target.value})} placeholder="List other conditions to consider..." style={{ width: '100%', padding: '8px', border: '1px solid #E2E8F0', borderRadius: '6px' }} />
              </div>
            </div>
          )}

          {activeTab === 'plan' && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: '600', color: '#0F172A', marginBottom: '4px' }}>💊 Treatment Plan</label>
                <textarea rows={3} value={formData.treatmentPlan} onChange={(e) => setFormData({...formData, treatmentPlan: e.target.value})} placeholder="Describe the treatment to be given..." style={{ width: '100%', padding: '8px', border: '1px solid #E2E8F0', borderRadius: '6px' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: '600', color: '#0F172A', marginBottom: '4px' }}>📅 Follow-up Plan</label>
                <textarea rows={2} value={formData.followUpPlan} onChange={(e) => setFormData({...formData, followUpPlan: e.target.value})} placeholder="When should the patient return?" style={{ width: '100%', padding: '8px', border: '1px solid #E2E8F0', borderRadius: '6px' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: '600', color: '#0F172A', marginBottom: '4px' }}>💰 Amount Due (KES)</label>
                <input type="number" value={formData.amountDue} onChange={(e) => setFormData({...formData, amountDue: e.target.value})} placeholder="e.g., 800" style={{ width: '100%', padding: '8px', border: '1px solid #E2E8F0', borderRadius: '6px' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: '600', color: '#0F172A', marginBottom: '4px' }}>💊 Medications</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.8fr 0.6fr 0.6fr 0.6fr 1fr', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                  <input type="text" placeholder="Medication" value={medicationInput.name} onChange={(e) => setMedicationInput({...medicationInput, name: e.target.value})} style={{ padding: '6px', border: '1px solid #E2E8F0', borderRadius: '6px' }} />
                  <input type="text" placeholder="Dose" value={medicationInput.dose} onChange={(e) => setMedicationInput({...medicationInput, dose: e.target.value})} style={{ padding: '6px', border: '1px solid #E2E8F0', borderRadius: '6px' }} />
                  <select value={medicationInput.frequency} onChange={(e) => setMedicationInput({...medicationInput, frequency: e.target.value})} style={{ padding: '6px', border: '1px solid #E2E8F0', borderRadius: '6px' }}>
                    {frequencies.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <select value={medicationInput.route} onChange={(e) => setMedicationInput({...medicationInput, route: e.target.value})} style={{ padding: '6px', border: '1px solid #E2E8F0', borderRadius: '6px' }}>
                    {routes.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <input type="text" placeholder="Duration" value={medicationInput.duration} onChange={(e) => setMedicationInput({...medicationInput, duration: e.target.value})} style={{ padding: '6px', border: '1px solid #E2E8F0', borderRadius: '6px' }} />
                  <button type="button" onClick={handleAddMedication} style={{ padding: '6px 12px', background: '#2563EB', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Add</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {formData.medications.map((med, index) => (
                    <div key={med.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                      <span><strong>{med.name}</strong> {med.dose} {med.route} {med.frequency} {med.duration && `• ${med.duration}`}</span>
                      <span style={{ color: '#475569', fontSize: '12px' }}>{med.instructions}</span>
                      <button type="button" onClick={() => handleRemoveMedication(index)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: '600', color: '#0F172A', marginBottom: '4px' }}>📝 Patient Education & Notes</label>
                <textarea rows={4} value={formData.patientEducation} onChange={(e) => setFormData({...formData, patientEducation: e.target.value})} placeholder="Document what was discussed with the patient..." style={{ width: '100%', padding: '8px', border: '1px solid #E2E8F0', borderRadius: '6px' }} />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
            <button type="button" onClick={() => router.back()} style={{ padding: '10px 20px', background: '#f1f5f9', border: 'none', borderRadius: '6px', color: '#475569', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ padding: '10px 24px', background: '#2563EB', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
              {saving ? 'Saving...' : 'Save Consultation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}