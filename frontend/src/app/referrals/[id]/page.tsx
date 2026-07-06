'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '../../../lib/api';
import PDFService from '../../../services/pdfService';
import styles from './detail.module.css';

export default function ReferralDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [referral, setReferral] = useState<any>(null);
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clinicInfo, setClinicInfo] = useState({
    clinicName: 'Clinic EMR',
    clinicAddress: '',
    clinicPhone: '',
    clinicEmail: '',
    mflCode: '',
    county: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [referralRes, clinicRes] = await Promise.all([
        api.get(`/referrals/${params.id}`),
        api.get('/config/clinic')
      ]);

      if (referralRes.data.success) {
        setReferral(referralRes.data.referral);
        // Fetch patient details
        const patientRes = await api.get(`/patients/${referralRes.data.referral.patient_id}`);
        if (patientRes.data.success) {
          setPatient(patientRes.data.patient);
        }
      }

      if (clinicRes.data.success) {
        setClinicInfo({
          clinicName: clinicRes.data.config?.clinicName || 'Clinic EMR',
          clinicAddress: clinicRes.data.config?.clinicAddress || '',
          clinicPhone: clinicRes.data.config?.clinicPhone || '',
          clinicEmail: clinicRes.data.config?.clinicEmail || '',
          mflCode: clinicRes.data.config?.mflCode || '',
          county: clinicRes.data.config?.county || ''
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!referral || !patient) return;
    const pdfService = new PDFService(clinicInfo);
    await pdfService.generateReferralPDF(referral, patient);
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      generated: '#6B7280',
      sent: '#3B82F6',
      accepted: '#10B981',
      completed: '#059669',
      cancelled: '#EF4444'
    };
    return { backgroundColor: colors[status] || '#6B7280' };
  };

  const getUrgencyBadge = (urgency: string) => {
    const colors: Record<string, string> = {
      routine: '#10B981',
      urgent: '#F59E0B',
      emergency: '#EF4444'
    };
    return { color: colors[urgency] || '#10B981' };
  };

  if (loading) {
    return <div className={styles.loadingContainer}>Loading...</div>;
  }

  if (!referral) {
    return <div className={styles.loadingContainer}>Referral not found</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => router.back()} className={styles.backBtn}>← Back</button>
        <h1 className={styles.title}>📋 Referral Details</h1>
        <button className={styles.downloadBtn} onClick={handleDownloadPDF}>
          📥 Download PDF
        </button>
      </div>

      <div className={styles.referralInfo}>
        <div className={styles.infoGrid}>
          <div><label>Referral No</label><span className={styles.referralNo}>{referral.referral_no}</span></div>
          <div><label>Patient</label><span>{patient?.first_name} {patient?.last_name}</span></div>
          <div><label>Specialty</label><span>{referral.specialty || 'General'}</span></div>
          <div><label>Urgency</label><span style={getUrgencyBadge(referral.urgency)}>{referral.urgency}</span></div>
          <div><label>Status</label><span className={styles.statusBadge} style={getStatusBadge(referral.status)}>{referral.status}</span></div>
          <div><label>Created</label><span>{new Date(referral.created_at).toLocaleDateString()}</span></div>
        </div>
      </div>

      <div className={styles.details}>
        <div className={styles.section}>
          <h3>📋 Medical History</h3>
          <p><strong>Medical:</strong> {referral.past_medical_history || '—'}</p>
          <p><strong>Surgical:</strong> {referral.past_surgical_history || '—'}</p>
          <p><strong>Obstetric:</strong> {referral.obstetric_history || '—'}</p>
          <p><strong>Diagnosis:</strong> {referral.current_diagnosis || '—'}</p>
        </div>

        <div className={styles.section}>
          <h3>🔬 Investigations</h3>
          <p><strong>Done:</strong> {referral.investigations_done || '—'}</p>
          <p><strong>Results:</strong> {referral.investigation_results || '—'}</p>
        </div>

        <div className={styles.section}>
          <h3>📌 Reason for Referral</h3>
          <p>{referral.reason_for_referral || '—'}</p>
          {referral.clinical_summary && <p><strong>Summary:</strong> {referral.clinical_summary}</p>}
        </div>

        <div className={styles.section}>
          <h3>👨‍⚕️ Referring Clinician</h3>
          <p><strong>Name:</strong> {referral.referring_clinician_name || '—'}</p>
          <p><strong>Title:</strong> {referral.referring_clinician_title || '—'}</p>
          <p><strong>Phone:</strong> {referral.referring_clinician_phone || '—'}</p>
          <p><strong>Email:</strong> {referral.referring_clinician_email || '—'}</p>
          <p><strong>Facility:</strong> {referral.facility_name || '—'}</p>
          <p><strong>Department:</strong> {referral.department || '—'}</p>
        </div>

        <div className={styles.section}>
          <h3>📍 Destination</h3>
          <p><strong>Specialty:</strong> {referral.specialty || '—'}</p>
          <p><strong>Facility:</strong> {referral.facility || '—'}</p>
          <p><strong>Doctor:</strong> {referral.doctor_name || '—'}</p>
          {referral.notes && <p><strong>Notes:</strong> {referral.notes}</p>}
        </div>
      </div>
    </div>
  );
}