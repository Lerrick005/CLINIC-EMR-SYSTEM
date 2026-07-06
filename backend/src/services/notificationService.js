const { emitToClinic, emitToUser } = require('../socket');

class NotificationService {
  constructor(db) {
    this.db = db;
  }

  async createNotification(data) {
    const { userId, clinicId, title, message, type, referenceId, referenceType } = data;
    const { v4: uuidv4 } = require('uuid');

    const id = uuidv4();
    await this.db('notifications').insert({
      id,
      clinic_id: clinicId,
      user_id: userId,
      title,
      message,
      type,
      reference_id: referenceId,
      reference_type: referenceType,
      is_read: false,
      created_at: this.db.fn.now()
    });

    emitToUser(userId, 'notification:new', {
      id,
      title,
      message,
      type,
      reference_id: referenceId,
      reference_type: referenceType,
      created_at: new Date().toISOString()
    });

    emitToClinic(clinicId, 'notification:clinic', {
      userId,
      title,
      message,
      type,
      created_at: new Date().toISOString()
    });

    return { id };
  }

  async getNotifications(userId, limit = 50) {
    return this.db('notifications')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc')
      .limit(limit);
  }

  async getUnreadCount(userId) {
    const result = await this.db('notifications')
      .where({ user_id: userId, is_read: false })
      .count('id as count')
      .first();
    return parseInt(result?.count || 0);
  }

  async markAsRead(notificationId, userId) {
    await this.db('notifications')
      .where({ id: notificationId, user_id: userId })
      .update({ is_read: true });
    return true;
  }

  async markAllAsRead(userId) {
    await this.db('notifications')
      .where({ user_id: userId })
      .update({ is_read: true });
    return true;
  }

  // ========== EVENT HANDLERS ==========

  async onPatientCreated(patient, clinicId, doctorId) {
    const doctors = await this.db('users')
      .where({ clinic_id: clinicId, role: 'DOCTOR', is_active: true });

    const patientName = patient.first_name + ' ' + patient.last_name;
    for (const doctor of doctors) {
      await this.createNotification({
        userId: doctor.id,
        clinicId,
        title: 'New Patient Registered',
        message: 'Patient ' + patientName + ' has been registered.',
        type: 'patient',
        referenceId: patient.id,
        referenceType: 'patient'
      });
    }
  }

  async onConsultationCreated(consultation, clinicId, doctorId) {
    const patient = await this.db('patients').where({ id: consultation.patient_id }).first();
    const patientName = patient ? (patient.first_name || '') + ' ' + (patient.last_name || '') : '';
    const trimmedPatientName = patientName.trim();

    await this.createNotification({
      userId: doctorId,
      clinicId,
      title: 'Consultation Saved',
      message: 'Consultation for ' + trimmedPatientName + ' saved successfully.',
      type: 'consultation',
      referenceId: consultation.id,
      referenceType: 'consultation'
    });

    if (consultation.prescriptions && consultation.prescriptions.length > 0) {
      const pharmacists = await this.db('users')
        .where({ clinic_id: clinicId, role: 'PHARMACIST', is_active: true });

      for (const pharmacist of pharmacists) {
        await this.createNotification({
          userId: pharmacist.id,
          clinicId,
          title: 'New Prescription',
          message: 'New prescription for ' + trimmedPatientName + ' needs dispensing.',
          type: 'prescription',
          referenceId: consultation.id,
          referenceType: 'consultation'
        });
      }
    }
  }

  async onLabResultReady(labOrder, clinicId, technicianId) {
    const patient = await this.db('patients').where({ id: labOrder.patient_id }).first();
    const patientName = patient ? (patient.first_name || '') + ' ' + (patient.last_name || '') : '';
    const trimmedPatientName = patientName.trim();

    if (labOrder.ordered_by) {
      await this.createNotification({
        userId: labOrder.ordered_by,
        clinicId,
        title: 'Lab Result Ready',
        message: 'Results for ' + labOrder.test_name + ' are ready for ' + trimmedPatientName + '.',
        type: 'lab',
        referenceId: labOrder.id,
        referenceType: 'lab'
      });
    }

    if (labOrder.is_abnormal) {
      const admins = await this.db('users')
        .where({ clinic_id: clinicId, role: 'CLINIC_ADMIN', is_active: true });

      for (const admin of admins) {
        await this.createNotification({
          userId: admin.id,
          clinicId,
          title: 'Abnormal Lab Result',
          message: 'Abnormal result for ' + labOrder.test_name + ' - ' + trimmedPatientName + '.',
          type: 'lab_abnormal',
          referenceId: labOrder.id,
          referenceType: 'lab'
        });
      }
    }
  }

  async onReferralCreated(referral, clinicId, doctorId) {
    const patient = await this.db('patients').where({ id: referral.patient_id }).first();
    const patientName = patient ? (patient.first_name || '') + ' ' + (patient.last_name || '') : '';
    const trimmedPatientName = patientName.trim();

    await this.createNotification({
      userId: doctorId,
      clinicId,
      title: 'Referral Created',
      message: 'Referral for ' + trimmedPatientName + ' to ' + (referral.specialty || 'specialist') + ' has been created.',
      type: 'referral',
      referenceId: referral.id,
      referenceType: 'referral'
    });
  }

  // ============================================
  // PRESCRIPTION NOTIFICATIONS
  // ============================================

  async onPrescriptionCreated(consultation, clinicId, doctorId) {
    try {
      const patient = await this.db('patients')
        .where({ id: consultation.patient_id })
        .first();
      
      const patientName = patient ? (patient.first_name || '') + ' ' + (patient.last_name || '') : 'Patient';
      const trimmedPatientName = patientName.trim();
      
      const doctor = await this.db('users')
        .where({ id: doctorId })
        .first();
      const doctorName = doctor ? (doctor.first_name || '') + ' ' + (doctor.last_name || '') : 'Doctor';
      const trimmedDoctorName = doctorName.trim();
      
      const prescriptions = consultation.prescriptions || [];
      const medNames = prescriptions.map(function(p) { return p.name || p.medication || 'Unknown'; }).join(', ');
      
      const pharmacists = await this.db('users')
        .where({ clinic_id: clinicId, role: 'PHARMACIST', is_active: true });

      for (const pharmacist of pharmacists) {
        await this.createNotification({
          userId: pharmacist.id,
          clinicId: clinicId,
          title: 'New Prescription',
          message: 'Dr. ' + trimmedDoctorName + ' prescribed ' + medNames + ' for ' + trimmedPatientName,
          type: 'prescription_new',
          referenceId: consultation.id,
          referenceType: 'consultation'
        });
      }
      
      const admins = await this.db('users')
        .where({ clinic_id: clinicId, role: 'CLINIC_ADMIN', is_active: true });

      for (const admin of admins) {
        await this.createNotification({
          userId: admin.id,
          clinicId: clinicId,
          title: 'New Prescription Alert',
          message: 'New prescription for ' + trimmedPatientName + ' by Dr. ' + trimmedDoctorName,
          type: 'prescription_new',
          referenceId: consultation.id,
          referenceType: 'consultation'
        });
      }
    } catch (error) {
      console.error('Error in onPrescriptionCreated:', error);
    }
  }

  async onPrescriptionDispensed(consultation, medication, clinicId, pharmacistId, patientId) {
    try {
      const patient = await this.db('patients')
        .where({ id: patientId })
        .first();
      const patientName = patient ? (patient.first_name || '') + ' ' + (patient.last_name || '') : 'Patient';
      const trimmedPatientName = patientName.trim();
      
      const pharmacist = await this.db('users')
        .where({ id: pharmacistId })
        .first();
      const pharmacistName = pharmacist ? (pharmacist.first_name || '') + ' ' + (pharmacist.last_name || '') : 'Pharmacist';
      const trimmedPharmacistName = pharmacistName.trim();
      
      const medName = medication.name || medication.medication || 'Unknown';
      
      if (consultation.doctor_id) {
        await this.createNotification({
          userId: consultation.doctor_id,
          clinicId: clinicId,
          title: 'Prescription Dispensed',
          message: medName + ' for ' + trimmedPatientName + ' has been dispensed by ' + trimmedPharmacistName,
          type: 'prescription_dispensed',
          referenceId: consultation.id,
          referenceType: 'consultation'
        });
      }
      
      const receptionists = await this.db('users')
        .where({ clinic_id: clinicId, role: 'RECEPTIONIST', is_active: true });

      for (const receptionist of receptionists) {
        await this.createNotification({
          userId: receptionist.id,
          clinicId: clinicId,
          title: 'Prescription Ready for Pickup',
          message: trimmedPatientName + ' - ' + medName + ' is ready (dispensed by ' + trimmedPharmacistName + ')',
          type: 'prescription_ready',
          referenceId: consultation.id,
          referenceType: 'consultation'
        });
      }
    } catch (error) {
      console.error('Error in onPrescriptionDispensed:', error);
    }
  }

  async onPrescriptionCancelled(consultation, medication, clinicId, cancelledBy, patientId, reason) {
    try {
      const patient = await this.db('patients')
        .where({ id: patientId })
        .first();
      const patientName = patient ? (patient.first_name || '') + ' ' + (patient.last_name || '') : 'Patient';
      const trimmedPatientName = patientName.trim();
      
      const canceller = await this.db('users')
        .where({ id: cancelledBy })
        .first();
      const cancellerName = canceller ? (canceller.first_name || '') + ' ' + (canceller.last_name || '') : 'Staff';
      const trimmedCancellerName = cancellerName.trim();
      const cancellerRole = canceller?.role || 'Staff';
      
      const medName = medication.name || medication.medication || 'Unknown';
      
      if (consultation.doctor_id && consultation.doctor_id !== cancelledBy) {
        await this.createNotification({
          userId: consultation.doctor_id,
          clinicId: clinicId,
          title: 'Prescription Cancelled',
          message: medName + ' for ' + trimmedPatientName + ' was cancelled by ' + trimmedCancellerName + ' (' + cancellerRole + '). Reason: ' + reason,
          type: 'prescription_cancelled',
          referenceId: consultation.id,
          referenceType: 'consultation'
        });
      }
    } catch (error) {
      console.error('Error in onPrescriptionCancelled:', error);
    }
  }
}

module.exports = NotificationService;
