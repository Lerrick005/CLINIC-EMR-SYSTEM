'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import api from '../../../../lib/api';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  medical_no: string;
  phone: string;
  email: string;
  gender: string;
  date_of_birth: string;
  age?: number;
}

interface Consultation {
  id: string;
  consultation_date: string;
  chief_complaint: string;
  diagnosis: string;
  treatment_plan: string;
  vitals: any;
  prescriptions: any[];
  notes: string;
  doctor_name: string;
  amount_due: number;
}

interface LabOrder {
  id: string;
  test_name: string;
  status: string;
  result_data: string;
  order_date: string;
  resulted_date: string;
}

interface Referral {
  id: string;
  referral_no: string;
  reason_for_referral: string;
  specialty: string;
  status: string;
  created_at: string;
}

interface ClinicInfo {
  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
  clinicEmail: string;
  mflCode: string;
  county: string;
}

const formatAmount = (amount: number) => {
  if (!amount) return "0";
  return Number(amount).toLocaleString();
};

export default function MedicalRecordPage() {
  const params = useParams();
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [clinicInfo, setClinicInfo] = useState<ClinicInfo>({
    clinicName: 'Medical Clinic',
    clinicAddress: '',
    clinicPhone: '',
    clinicEmail: '',
    mflCode: '',
    county: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [clinicRes, patientRes, consultationsRes, labRes, referralRes] = await Promise.all([
        api.get('/config/clinic'),
        api.get(`/patients/${params.id}`),
        api.get(`/consultations/patient/${params.id}`),
        api.get(`/lab-orders/patient/${params.id}`).catch(() => ({ data: { labOrders: [] } })),
        api.get(`/referrals/patient/${params.id}`).catch(() => ({ data: { referrals: [] } }))
      ]);

      if (clinicRes.data.success) {
        setClinicInfo(clinicRes.data.config || {});
      }

      if (patientRes.data.success) {
        const p = patientRes.data.patient;
        setPatient({
          ...p,
          age: calculateAge(p.date_of_birth)
        });
      }

      if (consultationsRes.data.success) {
        setConsultations(consultationsRes.data.consultations || []);
      }
      if (labRes.data.success) {
        setLabOrders(labRes.data.labOrders || []);
      }
      if (referralRes.data.success) {
        setReferrals(referralRes.data.referrals || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dob: string) => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return `${formatDate(dateStr)}, ${date.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}`;
  };

  if (loading) {
    return <div style={{ padding: '24px', color: '#475569', background: '#F8FAFC', minHeight: '100vh' }}>Loading medical record...</div>;
  }

  if (!patient) {
    return <div style={{ padding: '24px', color: '#475569', background: '#F8FAFC', minHeight: '100vh' }}>Patient not found</div>;
  }

  const latestConsultation = consultations[0] || null;

  return (
    <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto', background: '#F8FAFC', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <button onClick={() => router.back()} style={{ color: '#475569', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
          ← Back to Patients
        </button>
        <button onClick={() => window.print()} style={{ padding: '10px 20px', background: '#2563EB', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>
          🖨️ Print Record
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', padding: '40px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
        <div style={{ textAlign: 'center', borderBottom: '3px solid #1e3a5f', paddingBottom: '20px', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 'bold', color: '#1e3a5f', marginBottom: '4px' }}>
            🏥 {clinicInfo.clinicName || 'Medical Clinic'}
          </h1>
          <p style={{ color: '#475569', fontSize: '13px' }}>
            {clinicInfo.clinicAddress || ''}
            {clinicInfo.clinicPhone ? ` | Tel: ${clinicInfo.clinicPhone}` : ''}
            {clinicInfo.mflCode ? ` | MFL: ${clinicInfo.mflCode}` : ''}
          </p>
          <h2 style={{ fontSize: '18px', color: '#1e3a5f', marginTop: '12px', textTransform: 'uppercase', letterSpacing: '2px' }}>
            Comprehensive Medical Record
          </h2>
          <p style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>
            Generated: {new Date().toLocaleString('en-KE')}
          </p>
        </div>

        <div style={{ marginBottom: '24px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e3a5f', marginBottom: '12px' }}>👤 Patient Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div><strong>Name:</strong> {patient.first_name} {patient.last_name}</div>
            <div><strong>Medical No:</strong> {patient.medical_no || 'N/A'}</div>
            <div><strong>Age/Gender:</strong> {patient.age || 'N/A'} yrs / {patient.gender || 'N/A'}</div>
            <div><strong>Contact:</strong> {patient.phone || 'N/A'}</div>
            <div><strong>Doctor:</strong> {latestConsultation?.doctor_name || 'N/A'}</div>
          </div>
        </div>

        {consultations.map((c, idx) => {
          const vitals = c.vitals || {};
          const hasVitals = vitals.bp_systolic || vitals.heart_rate || vitals.temperature || vitals.weight;
          const hasPrescriptions = c.prescriptions && c.prescriptions.length > 0;
          
          return (
            <div key={idx} style={{ marginBottom: '20px', padding: '16px', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                <strong style={{ color: '#1e3a5f' }}>Visit #{idx + 1}</strong>
                <span style={{ color: '#64748b' }}>{formatDateTime(c.consultation_date)}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                <div><strong>Chief Complaint:</strong> {c.chief_complaint || 'N/A'}</div>
                <div><strong>Diagnosis:</strong> <span style={{ color: '#DC2626', fontWeight: 'bold' }}>{c.diagnosis || 'N/A'}</span></div>
                <div><strong>Treatment:</strong> {c.treatment_plan || 'N/A'}</div>
                <div><strong>Amount Due:</strong> KES {formatAmount(c.amount_due)}</div>
              </div>
              {hasVitals && (
                <div style={{ marginTop: '12px', padding: '12px', background: '#f1f5f9', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  <strong style={{ color: '#1e3a5f' }}>📊 Vital Signs</strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '8px' }}>
                    {vitals.bp_systolic && vitals.bp_diastolic && <span style={{ background: 'white', padding: '4px 12px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>❤️ BP: {vitals.bp_systolic}/{vitals.bp_diastolic} mmHg</span>}
                    {vitals.heart_rate && <span style={{ background: 'white', padding: '4px 12px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>💓 HR: {vitals.heart_rate} bpm</span>}
                    {vitals.temperature && <span style={{ background: 'white', padding: '4px 12px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>🌡️ Temp: {vitals.temperature}°C</span>}
                    {vitals.respiratory_rate && <span style={{ background: 'white', padding: '4px 12px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>🌬️ RR: {vitals.respiratory_rate}/min</span>}
                    {vitals.oxygen_saturation && <span style={{ background: 'white', padding: '4px 12px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>🫁 O2: {vitals.oxygen_saturation}%</span>}
                    {vitals.weight && <span style={{ background: 'white', padding: '4px 12px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>⚖️ Weight: {vitals.weight} kg</span>}
                    {vitals.height && <span style={{ background: 'white', padding: '4px 12px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>📏 Height: {vitals.height} cm</span>}
                    {vitals.bmi && <span style={{ background: 'white', padding: '4px 12px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>📊 BMI: {vitals.bmi}</span>}
                  </div>
                </div>
              )}
              {hasPrescriptions && (
                <div style={{ marginTop: '12px' }}>
                  <strong style={{ color: '#1e3a5f' }}>💊 Prescriptions</strong>
                  <table style={{ width: '100%', marginTop: '8px', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead><tr style={{ background: '#f1f5f9' }}>
                      <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #E2E8F0' }}>Medication</th>
                      <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #E2E8F0' }}>Dosage</th>
                      <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #E2E8F0' }}>Frequency</th>
                      <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #E2E8F0' }}>Instructions</th>
                    </tr></thead>
                    <tbody>
                      {c.prescriptions.map((p, pIdx) => (
                        <tr key={pIdx}>
                          <td style={{ padding: '6px 8px', border: '1px solid #E2E8F0' }}>{p.medication || p.name}</td>
                          <td style={{ padding: '6px 8px', border: '1px solid #E2E8F0' }}>{p.dosage || p.dose}</td>
                          <td style={{ padding: '6px 8px', border: '1px solid #E2E8F0' }}>{p.frequency}</td>
                          <td style={{ padding: '6px 8px', border: '1px solid #E2E8F0' }}>{p.instructions || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          <div style={{ textAlign: 'center', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563EB' }}>{consultations.length}</div>
            <div style={{ fontSize: '12px', color: '#475569' }}>Consultations</div>
          </div>
          <div style={{ textAlign: 'center', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0D9488' }}>{labOrders.length}</div>
            <div style={{ fontSize: '12px', color: '#475569' }}>Lab Orders</div>
          </div>
          <div style={{ textAlign: 'center', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#7C3AED' }}>{referrals.length}</div>
            <div style={{ fontSize: '12px', color: '#475569' }}>Referrals</div>
          </div>
          <div style={{ textAlign: 'center', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#D97706' }}>{consultations.filter(c => c.diagnosis).length}</div>
            <div style={{ fontSize: '12px', color: '#475569' }}>Diagnoses</div>
          </div>
        </div>

        <div style={{ padding: '16px', background: '#FEF3C7', borderRadius: '8px', border: '1px solid #FDE68A' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <span style={{ fontWeight: 'bold', color: '#92400E' }}>💰 TOTAL AMOUNT DUE</span>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#D97706' }}>
              KES {formatAmount(consultations.reduce((sum, c) => sum + (c.amount_due || 0), 0))}
            </span>
          </div>
        </div>

        <div style={{ marginTop: '30px', textAlign: 'center', borderTop: '1px solid #E2E8F0', paddingTop: '20px' }}>
          <p style={{ fontSize: '10px', color: '#94A3B8' }}>
            This is an official medical record from {clinicInfo.clinicName || 'Medical Clinic'}
          </p>
          <p style={{ fontSize: '10px', color: '#94A3B8' }}>
            MFL Code: {clinicInfo.mflCode || 'N/A'} | County: {clinicInfo.county || 'N/A'}
          </p>
          <p style={{ fontSize: '10px', color: '#94A3B8', marginTop: '4px' }}>
            Generated on {new Date().toLocaleString('en-KE')}
          </p>
        </div>
      </div>
    </div>
  );
}