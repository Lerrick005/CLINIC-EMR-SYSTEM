'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
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
  age: number;
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

interface ClinicInfo {
  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
  clinicEmail: string;
  mflCode: string;
  county: string;
}

export default function PrintMedicalRecord() {
  const params = useParams();
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
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
      const [clinicRes, patientRes, consultationsRes] = await Promise.all([
        api.get('/config/clinic'),
        api.get(`/patients/${params.id}`),
        api.get(`/consultations/patient/${params.id}`)
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
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-KE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return `${formatDate(dateStr)}, ${formatTime(dateStr)}`;
  };

  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Medical Record - ${patient?.first_name || ''} ${patient?.last_name || ''}</title>
              <style>
                @page { margin: 0.5in; }
                body { font-family: 'Times New Roman', Arial, sans-serif; padding: 20px; }
                @media print {
                  body { padding: 0; }
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              ${printRef.current.innerHTML}
              <script>
                window.onload = function() { window.print(); window.close(); }
              <\/script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', color: '#475569', background: '#F8FAFC', minHeight: '100vh' }}>
        Loading medical record...
      </div>
    );
  }

  if (!patient) {
    return (
      <div style={{ padding: '24px', color: '#475569', background: '#F8FAFC', minHeight: '100vh' }}>
        Patient not found
      </div>
    );
  }

  const latestConsultation = consultations[0] || null;

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', padding: '24px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <button onClick={() => router.back()} style={{ padding: '8px 16px', background: '#E2E8F0', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            ← Back
          </button>
          <button onClick={handlePrint} style={{ padding: '10px 24px', background: '#2563EB', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
            🖨️ Print Record
          </button>
        </div>

        {/* Medical Record Content */}
        <div ref={printRef} style={{ background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', borderBottom: '3px solid #1e3a5f', paddingBottom: '20px', marginBottom: '30px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e3a5f', marginBottom: '4px' }}>
              🏥 {clinicInfo.clinicName || 'Medical Clinic'}
            </h1>
            <p style={{ color: '#475569', fontSize: '13px' }}>
              {clinicInfo.clinicAddress || ''}
              {clinicInfo.clinicPhone ? ` | Tel: ${clinicInfo.clinicPhone}` : ''}
              {clinicInfo.mflCode ? ` | MFL: ${clinicInfo.mflCode}` : ''}
            </p>
            <h2 style={{ fontSize: '18px', color: '#1e3a5f', marginTop: '12px', textTransform: 'uppercase', letterSpacing: '2px' }}>
              Patient Medical Record
            </h2>
            <p style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>
              Generated: {new Date().toLocaleString('en-KE')}
            </p>
          </div>

          {/* Patient Information */}
          <div style={{ marginBottom: '24px', padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e3a5f', marginBottom: '12px' }}>
              👤 Patient Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div><strong>Name:</strong> {patient.first_name} {patient.last_name}</div>
              <div><strong>Medical No:</strong> {patient.medical_no || 'N/A'}</div>
              <div><strong>Age/Gender:</strong> {patient.age || 'N/A'} yrs / {patient.gender || 'N/A'}</div>
              <div><strong>Phone:</strong> {patient.phone || 'N/A'}</div>
              <div><strong>Email:</strong> {patient.email || 'N/A'}</div>
              <div><strong>Doctor:</strong> {latestConsultation?.doctor_name || 'N/A'}</div>
            </div>
          </div>

          {/* Consultation Details */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e3a5f', marginBottom: '12px', borderBottom: '2px solid #E2E8F0', paddingBottom: '8px' }}>
              🩺 Consultation Details
            </h3>
            {consultations.length === 0 ? (
              <p style={{ color: '#94A3B8' }}>No consultations recorded.</p>
            ) : (
              consultations.map((c, idx) => {
                const vitals = c.vitals || {};
                return (
                  <div key={idx} style={{ marginBottom: '24px', padding: '16px', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                      <strong style={{ color: '#1e3a5f' }}>Visit #{idx + 1}</strong>
                      <span style={{ color: '#64748b' }}>{formatDateTime(c.consultation_date)}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div><strong>Chief Complaint:</strong> {c.chief_complaint || 'N/A'}</div>
                      <div><strong>Diagnosis:</strong> <span style={{ color: '#DC2626', fontWeight: 'bold' }}>{c.diagnosis || 'N/A'}</span></div>
                      <div><strong>Treatment:</strong> {c.treatment_plan || 'N/A'}</div>
                      <div><strong>Amount Due:</strong> KES {c.amount_due?.toLocaleString() || '0'}</div>
                    </div>

                    {/* Vitals Section */}
                    {vitals && (vitals.bp_systolic || vitals.heart_rate || vitals.temperature) && (
                      <div style={{ marginTop: '12px', padding: '12px', background: '#f1f5f9', borderRadius: '6px' }}>
                        <strong style={{ color: '#1e3a5f' }}>📊 Vital Signs</strong>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '8px' }}>
                          {vitals.bp_systolic && vitals.bp_diastolic && (
                            <span>❤️ BP: {vitals.bp_systolic}/{vitals.bp_diastolic} mmHg</span>
                          )}
                          {vitals.heart_rate && <span>💓 HR: {vitals.heart_rate} bpm</span>}
                          {vitals.temperature && <span>🌡️ Temp: {vitals.temperature}°C</span>}
                          {vitals.respiratory_rate && <span>🌬️ RR: {vitals.respiratory_rate}/min</span>}
                          {vitals.oxygen_saturation && <span>🫁 O2: {vitals.oxygen_saturation}%</span>}
                          {vitals.weight && <span>⚖️ Weight: {vitals.weight} kg</span>}
                          {vitals.height && <span>📏 Height: {vitals.height} cm</span>}
                          {vitals.bmi && <span>📊 BMI: {vitals.bmi}</span>}
                        </div>
                      </div>
                    )}

                    {/* Prescriptions */}
                    {c.prescriptions && c.prescriptions.length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        <strong style={{ color: '#1e3a5f' }}>💊 Prescriptions</strong>
                        <table style={{ width: '100%', marginTop: '8px', borderCollapse: 'collapse', fontSize: '13px' }}>
                          <thead>
                            <tr style={{ background: '#f1f5f9' }}>
                              <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #E2E8F0' }}>Medication</th>
                              <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #E2E8F0' }}>Dosage</th>
                              <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #E2E8F0' }}>Frequency</th>
                              <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #E2E8F0' }}>Instructions</th>
                            </tr>
                          </thead>
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

                    {/* Notes */}
                    {c.notes && (
                      <div style={{ marginTop: '12px' }}>
                        <strong style={{ color: '#1e3a5f' }}>📝 Notes:</strong>
                        <p style={{ color: '#475569', marginTop: '4px', fontSize: '13px' }}>{c.notes}</p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Summary Section */}
          <div style={{ marginTop: '24px', padding: '16px', background: '#fef3c7', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#92400e', marginBottom: '8px' }}>
              💰 TOTAL AMOUNT DUE
            </h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#d97706' }}>
              KES {consultations.reduce((sum, c) => sum + (c.amount_due || 0), 0).toLocaleString()}
            </p>
            <p style={{ fontSize: '12px', color: '#92400e' }}>
              Total Consultations: {consultations.length}
            </p>
          </div>

          {/* Footer */}
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
    </div>
  );
}