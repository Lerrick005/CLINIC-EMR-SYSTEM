import html2pdf from 'html2pdf.js';

interface ClinicInfo {
  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
  clinicEmail: string;
  mflCode: string;
  county: string;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  age?: number;
  gender?: string;
  phone?: string;
  medical_no?: string;
  date_of_birth?: string;
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
  urgency: string;
  status: string;
  created_at: string;
}

class PDFService {
  private clinicInfo: ClinicInfo;

  constructor(clinicInfo: ClinicInfo) {
    this.clinicInfo = clinicInfo;
  }

  private escapeHtml(text: string): string {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private getUrgencyText(urgency: string): string {
    const map: Record<string, string> = {
      routine: 'ROUTINE',
      urgent: 'URGENT',
      emergency: 'EMERGENCY'
    };
    return map[urgency] || 'ROUTINE';
  }

  private getUrgencyColor(urgency: string): string {
    const map: Record<string, string> = {
      routine: '#10B981',
      urgent: '#F59E0B',
      emergency: '#EF4444'
    };
    return map[urgency] || '#10B981';
  }

  private getStatusText(status: string): string {
    const map: Record<string, string> = {
      generated: 'Generated',
      sent: 'Sent',
      accepted: 'Accepted',
      completed: 'Completed',
      cancelled: 'Cancelled'
    };
    return map[status] || status;
  }

  async generateReferralPDF(referral: any, patient: Patient): Promise<void> {
    const element = document.createElement('div');
    element.style.padding = '40px';
    element.style.backgroundColor = 'white';
    element.style.fontFamily = "'Times New Roman', 'Arial', sans-serif";
    element.style.maxWidth = '900px';
    element.style.margin = '0 auto';
    element.style.lineHeight = '1.5';

    const patientName = `${patient.first_name} ${patient.last_name}`;
    const patientAge = patient.age || 'N/A';
    const patientGender = patient.gender || 'N/A';
    const medicalNo = patient.medical_no || 'N/A';
    const today = new Date().toLocaleDateString('en-KE');
    const referralNo = referral.referral_no || `REF-${Date.now()}`;
    const urgencyText = this.getUrgencyText(referral.urgency);
    const urgencyColor = this.getUrgencyColor(referral.urgency);

    element.innerHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Medical Referral - ${patientName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Times New Roman', Arial, sans-serif; font-size: 14px; line-height: 1.5; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #1e3a5f; padding-bottom: 20px; }
          .clinic-name { font-size: 28px; font-weight: bold; color: #1e3a5f; margin-bottom: 8px; letter-spacing: 1px; }
          .clinic-address, .clinic-contact { font-size: 12px; color: #4a5568; margin-bottom: 4px; }
          .form-title { font-size: 22px; font-weight: bold; text-align: center; margin: 20px 0; color: #1e3a5f; text-transform: uppercase; letter-spacing: 2px; }
          .referral-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; padding: 12px 16px; background: #f8fafc; border-left: 4px solid #1e3a5f; }
          .referral-number { font-weight: bold; font-size: 14px; color: #1e3a5f; }
          .referral-date { font-size: 13px; color: #64748b; }
          .urgency-badge { display: inline-block; padding: 4px 16px; border-radius: 20px; font-size: 12px; font-weight: bold; background: ${urgencyColor}20; color: ${urgencyColor}; }
          .section { margin-bottom: 25px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
          .section-title { background: #1e3a5f; color: white; padding: 10px 16px; font-weight: bold; font-size: 15px; }
          .section-content { padding: 16px; }
          .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
          .info-row { display: flex; margin-bottom: 10px; }
          .info-label { font-weight: bold; width: 180px; flex-shrink: 0; color: #334155; }
          .info-value { flex: 1; color: #0f172a; border-bottom: 1px dotted #cbd5e1; padding-bottom: 4px; }
          .full-width { grid-column: span 2; }
          .signature-area { margin-top: 40px; display: flex; justify-content: space-between; gap: 40px; }
          .signature-box { flex: 1; text-align: center; }
          .signature-line { border-top: 1px solid #000; margin-top: 40px; padding-top: 8px; width: 100%; }
          .stamp-area { text-align: center; margin-top: 30px; }
          .stamp { border: 2px solid #1e3a5f; padding: 8px 24px; display: inline-block; font-size: 12px; font-weight: bold; color: #1e3a5f; }
          .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
          @media print { body { padding: 0; margin: 0; } .section { break-inside: avoid; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="clinic-name">🏥 ${this.escapeHtml(this.clinicInfo.clinicName)}</div>
          ${this.clinicInfo.clinicAddress ? `<div class="clinic-address">${this.escapeHtml(this.clinicInfo.clinicAddress)}</div>` : ''}
          ${this.clinicInfo.clinicPhone ? `<div class="clinic-contact">📞 Tel: ${this.escapeHtml(this.clinicInfo.clinicPhone)}</div>` : ''}
        </div>

        <div class="form-title">MEDICAL REFERRAL FORM</div>

        <div class="referral-header">
          <div><span class="referral-number">📋 REFERRAL NO: ${referralNo}</span></div>
          <div><span class="referral-date">📅 DATE: ${today}</span></div>
          <div><span class="urgency-badge">⚠️ ${urgencyText}</span></div>
        </div>

        <div class="section">
          <div class="section-title">👤 PATIENT INFORMATION</div>
          <div class="section-content">
            <div class="info-grid">
              <div class="info-row"><span class="info-label">Full Name:</span><span class="info-value">${this.escapeHtml(patientName)}</span></div>
              <div class="info-row"><span class="info-label">Medical No:</span><span class="info-value">${medicalNo}</span></div>
              <div class="info-row"><span class="info-label">Age / Gender:</span><span class="info-value">${patientAge} years / ${patientGender}</span></div>
              <div class="info-row"><span class="info-label">Contact:</span><span class="info-value">${patient.phone || 'N/A'}</span></div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">📋 MEDICAL / SURGICAL / OBSTETRIC HISTORY</div>
          <div class="section-content">
            <div class="info-row"><span class="info-label">Medical History:</span><span class="info-value">${this.escapeHtml(referral.past_medical_history || '—')}</span></div>
            <div class="info-row"><span class="info-label">Surgical History:</span><span class="info-value">${this.escapeHtml(referral.past_surgical_history || '—')}</span></div>
            <div class="info-row"><span class="info-label">Obstetric History:</span><span class="info-value">${this.escapeHtml(referral.obstetric_history || '—')}</span></div>
            <div class="info-row"><span class="info-label">Current Diagnosis:</span><span class="info-value">${this.escapeHtml(referral.current_diagnosis || '—')}</span></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">🔬 INVESTIGATIONS DONE</div>
          <div class="section-content">
            <div class="info-row"><span class="info-label">Investigations Performed:</span><span class="info-value">${this.escapeHtml(referral.investigations_done || '—')}</span></div>
            <div class="info-row"><span class="info-label">Results / Findings:</span><span class="info-value">${this.escapeHtml(referral.investigation_results || '—')}</span></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">📌 REASON FOR REFERRAL</div>
          <div class="section-content">
            <div class="info-row"><span class="info-label">Reason:</span><span class="info-value">${this.escapeHtml(referral.reason_for_referral || '—')}</span></div>
            ${referral.clinical_summary ? `<div class="info-row"><span class="info-label">Clinical Summary:</span><span class="info-value">${this.escapeHtml(referral.clinical_summary)}</span></div>` : ''}
          </div>
        </div>

        <div class="section">
          <div class="section-title">👨‍⚕️ REFERRING CLINICIAN</div>
          <div class="section-content">
            <div class="info-row"><span class="info-label">Name:</span><span class="info-value">${this.escapeHtml(referral.referring_clinician_name || '—')}</span></div>
            <div class="info-row"><span class="info-label">Title:</span><span class="info-value">${this.escapeHtml(referral.referring_clinician_title || '—')}</span></div>
            <div class="info-row"><span class="info-label">Contact:</span><span class="info-value">${this.escapeHtml(referral.referring_clinician_phone || '—')}</span></div>
            <div class="info-row"><span class="info-label">Email:</span><span class="info-value">${this.escapeHtml(referral.referring_clinician_email || '—')}</span></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">📍 REFERRAL DESTINATION</div>
          <div class="section-content">
            <div class="info-row"><span class="info-label">Specialty:</span><span class="info-value">${this.escapeHtml(referral.specialty || '—')}</span></div>
            <div class="info-row"><span class="info-label">Facility:</span><span class="info-value">${this.escapeHtml(referral.facility || '—')}</span></div>
            <div class="info-row"><span class="info-label">Attending Doctor:</span><span class="info-value">${this.escapeHtml(referral.doctor_name || '—')}</span></div>
            ${referral.notes ? `<div class="info-row"><span class="info-label">Notes:</span><span class="info-value">${this.escapeHtml(referral.notes)}</span></div>` : ''}
          </div>
        </div>

        <div class="signature-area">
          <div class="signature-box"><div class="signature-line"></div><div><strong>Signature of Referring Clinician</strong></div></div>
          <div class="signature-box"><div class="signature-line"></div><div><strong>Signature of Receiving Clinician</strong></div></div>
        </div>

        <div class="stamp-area"><div class="stamp">🏥 OFFICIAL CLINIC STAMP</div></div>

        <div class="footer">
          <p>This is an official medical referral document from ${this.escapeHtml(this.clinicInfo.clinicName)}</p>
          <p>Generated on ${today} at ${new Date().toLocaleTimeString()}</p>
        </div>
      </body>
      </html>
    `;

    const opt = {
      margin: [0.5, 0.5, 0.5, 0.5],
      filename: `Medical_Referral_${referralNo}_${patientName.replace(/\s/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    await html2pdf().set(opt).from(element).save();
  }

  async generateMedicalRecordPDF(patient: Patient, consultations: Consultation[], labOrders: LabOrder[], referrals: Referral[]): Promise<void> {
    const element = document.createElement('div');
    element.style.padding = '40px';
    element.style.backgroundColor = 'white';
    element.style.fontFamily = "'Times New Roman', 'Arial', sans-serif";
    element.style.maxWidth = '1000px';
    element.style.margin = '0 auto';
    element.style.lineHeight = '1.5';

    const patientName = `${patient.first_name} ${patient.last_name}`;
    const today = new Date().toLocaleDateString('en-KE');

    // Build consultations HTML
    let consultationsHtml = '';
    if (consultations && consultations.length > 0) {
      consultationsHtml = consultations.map(c => `
        <div style="margin-bottom: 20px; padding: 15px; background: #f8fafc; border-radius: 8px; border-left: 3px solid #1e3a5f;">
          <div style="display: flex; justify-content: space-between; font-weight: bold; color: #1e3a5f;">
            <span>📅 ${new Date(c.consultation_date).toLocaleDateString()}</span>
            <span>🩺 ${c.diagnosis || 'No diagnosis'}</span>
          </div>
          <p style="margin-top: 8px;"><strong>CC:</strong> ${this.escapeHtml(c.chief_complaint || '—')}</p>
          ${c.treatment_plan ? `<p><strong>Treatment:</strong> ${this.escapeHtml(c.treatment_plan)}</p>` : ''}
          ${c.prescriptions && c.prescriptions.length > 0 ? `<p><strong>Medications:</strong> ${c.prescriptions.map(p => `${p.medication} ${p.dosage} ${p.frequency}`).join(', ')}</p>` : ''}
        </div>
      `).join('');
    } else {
      consultationsHtml = '<p style="color: #6B6B6B;">No consultations recorded</p>';
    }

    // Build lab orders HTML
    let labHtml = '';
    if (labOrders && labOrders.length > 0) {
      labHtml = labOrders.map(l => `
        <div style="margin-bottom: 12px; padding: 12px; background: #f8fafc; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between;">
            <span style="font-weight: bold;">🔬 ${this.escapeHtml(l.test_name)}</span>
            <span style="color: ${l.status === 'completed' ? '#10B981' : '#F59E0B'};">${l.status}</span>
          </div>
          <div style="font-size: 13px; color: #64748b;">Ordered: ${new Date(l.order_date).toLocaleDateString()}</div>
          ${l.result_data ? `<div style="margin-top: 4px;"><strong>Result:</strong> ${this.escapeHtml(l.result_data)}</div>` : ''}
        </div>
      `).join('');
    } else {
      labHtml = '<p style="color: #6B6B6B;">No lab orders recorded</p>';
    }

    // Build referrals HTML
    let referralHtml = '';
    if (referrals && referrals.length > 0) {
      referralHtml = referrals.map(r => `
        <div style="margin-bottom: 12px; padding: 12px; background: #f8fafc; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between;">
            <span style="font-weight: bold;">📋 ${this.escapeHtml(r.referral_no || 'N/A')}</span>
            <span style="color: ${r.status === 'completed' ? '#10B981' : '#F59E0B'};">${this.getStatusText(r.status)}</span>
          </div>
          <div style="font-size: 13px; color: #64748b;">${this.escapeHtml(r.specialty || 'General')} → ${this.escapeHtml(r.facility || 'N/A')}</div>
          <div style="font-size: 13px; color: #64748b;">Reason: ${this.escapeHtml((r.reason_for_referral || '').substring(0, 100))}${(r.reason_for_referral || '').length > 100 ? '...' : ''}</div>
        </div>
      `).join('');
    } else {
      referralHtml = '<p style="color: #6B6B6B;">No referrals recorded</p>';
    }

    element.innerHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Medical Record - ${patientName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Times New Roman', Arial, sans-serif; font-size: 14px; line-height: 1.5; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #1e3a5f; padding-bottom: 20px; }
          .clinic-name { font-size: 28px; font-weight: bold; color: #1e3a5f; margin-bottom: 8px; letter-spacing: 1px; }
          .clinic-address, .clinic-contact { font-size: 12px; color: #4a5568; margin-bottom: 4px; }
          .record-title { font-size: 22px; font-weight: bold; text-align: center; margin: 20px 0; color: #1e3a5f; text-transform: uppercase; letter-spacing: 2px; }
          .patient-info { background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 25px; border: 1px solid #e2e8f0; }
          .patient-info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
          .patient-info-item { display: flex; flex-direction: column; }
          .patient-info-label { font-weight: bold; color: #64748b; font-size: 12px; }
          .patient-info-value { font-weight: 500; color: #0f172a; }
          .section { margin-bottom: 25px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
          .section-title { background: #1e3a5f; color: white; padding: 10px 16px; font-weight: bold; font-size: 15px; }
          .section-content { padding: 16px; }
          .summary-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
          .stat-card { background: #f8fafc; padding: 12px; border-radius: 8px; text-align: center; }
          .stat-number { font-size: 24px; font-weight: bold; color: #1e3a5f; }
          .stat-label { font-size: 11px; color: #64748b; text-transform: uppercase; }
          .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
          @media print { body { padding: 0; margin: 0; } .section { break-inside: avoid; } }
          @media (max-width: 768px) {
            .patient-info-grid { grid-template-columns: 1fr 1fr; }
            .summary-stats { grid-template-columns: 1fr 1fr; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="clinic-name">🏥 ${this.escapeHtml(this.clinicInfo.clinicName)}</div>
          ${this.clinicInfo.clinicAddress ? `<div class="clinic-address">${this.escapeHtml(this.clinicInfo.clinicAddress)}</div>` : ''}
          ${this.clinicInfo.clinicPhone ? `<div class="clinic-contact">📞 Tel: ${this.escapeHtml(this.clinicInfo.clinicPhone)}</div>` : ''}
        </div>

        <div class="record-title">COMPREHENSIVE MEDICAL RECORD</div>

        <div class="patient-info">
          <div class="patient-info-grid">
            <div class="patient-info-item"><span class="patient-info-label">Patient Name</span><span class="patient-info-value">${this.escapeHtml(patientName)}</span></div>
            <div class="patient-info-item"><span class="patient-info-label">Medical No</span><span class="patient-info-value">${patient.medical_no || 'N/A'}</span></div>
            <div class="patient-info-item"><span class="patient-info-label">Age / Gender</span><span class="patient-info-value">${patient.age || 'N/A'} / ${patient.gender || 'N/A'}</span></div>
            <div class="patient-info-item"><span class="patient-info-label">Contact</span><span class="patient-info-value">${patient.phone || 'N/A'}</span></div>
          </div>
        </div>

        <div class="summary-stats">
          <div class="stat-card"><div class="stat-number">${consultations?.length || 0}</div><div class="stat-label">Consultations</div></div>
          <div class="stat-card"><div class="stat-number">${labOrders?.length || 0}</div><div class="stat-label">Lab Orders</div></div>
          <div class="stat-card"><div class="stat-number">${referrals?.length || 0}</div><div class="stat-label">Referrals</div></div>
          <div class="stat-card"><div class="stat-number">${(consultations || []).filter(c => c.diagnosis).length || 0}</div><div class="stat-label">Diagnoses</div></div>
        </div>

        <div class="section">
          <div class="section-title">🩺 Consultation History (${consultations?.length || 0})</div>
          <div class="section-content">${consultationsHtml}</div>
        </div>

        <div class="section">
          <div class="section-title">🔬 Laboratory Results (${labOrders?.length || 0})</div>
          <div class="section-content">${labHtml}</div>
        </div>

        <div class="section">
          <div class="section-title">📋 Referrals (${referrals?.length || 0})</div>
          <div class="section-content">${referralHtml}</div>
        </div>

        <div class="footer">
          <p>This is an official medical record from ${this.escapeHtml(this.clinicInfo.clinicName)}</p>
          <p>Generated on ${today} at ${new Date().toLocaleTimeString()}</p>
          <p>MFL Code: ${this.clinicInfo.mflCode || 'N/A'} | County: ${this.clinicInfo.county || 'N/A'}</p>
        </div>
      </body>
      </html>
    `;

    const opt = {
      margin: [0.5, 0.5, 0.5, 0.5],
      filename: `Medical_Record_${patientName.replace(/\s/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    await html2pdf().set(opt).from(element).save();
  }
}

export default PDFService;