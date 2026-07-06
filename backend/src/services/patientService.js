const { v4: uuidv4 } = require('uuid');

class PatientService {
  constructor(db) {
    this.db = db;
  }

  async generateMedicalNumber(clinicId) {
    try {
      // First check if clinic exists
      const clinic = await this.db('clinics').where({ id: clinicId }).first();
      
      // Use default prefix if clinic not found or no mfl_code
      let prefix = 'CLINIC';
      if (clinic && clinic.mfl_code) {
        prefix = clinic.mfl_code.toUpperCase();
      }
      
      // Get the last patient to determine the next number
      const lastPatient = await this.db('patients')
        .where({ clinic_id: clinicId })
        .orderBy('created_at', 'desc')
        .first();
        
      let nextNum = 1;
      if (lastPatient && lastPatient.medical_no) {
        const parts = lastPatient.medical_no.split('-');
        const lastNum = parseInt(parts[parts.length - 1]);
        if (!isNaN(lastNum)) nextNum = lastNum + 1;
      }
      const padded = nextNum.toString().padStart(4, '0');
      return `${prefix}-${padded}`;
    } catch (error) {
      console.error('Error generating medical number:', error);
      // Fallback to simple timestamp-based number
      return `CLINIC-${Date.now().toString().slice(-6)}`;
    }
  }

  async createPatient(clinicId, data, doctorId = null) {
    const medical_no = await this.generateMedicalNumber(clinicId);
    const id = uuidv4();
    await this.db('patients').insert({
      id,
      clinic_id: clinicId,
      medical_no,
      first_name: data.firstName,
      last_name: data.lastName,
      date_of_birth: data.dateOfBirth,
      gender: data.gender,
      phone: data.phone,
      email: data.email,
      address: data.address,
      emergency_contact_name: data.emergencyContactName,
      emergency_contact_phone: data.emergencyContactPhone,
      pcp_doctor_id: data.pcpDoctorId || doctorId,
      is_active: true
    });
    return this.getPatientById(id);
  }

  async getPatientById(id, clinicId = null) {
    const query = this.db('patients').where({ id });
    if (clinicId) query.where({ clinic_id: clinicId });
    return query.first();
  }

  async getPatientsByClinic(clinicId, filters = {}) {
    let query = this.db('patients').where({ clinic_id: clinicId });
    if (filters.search) {
      const search = `%${filters.search}%`;
      query = query.where(function() {
        this.where('first_name', 'ilike', search)
          .orWhere('last_name', 'ilike', search)
          .orWhere('medical_no', 'ilike', search)
          .orWhere('phone', 'ilike', search);
      });
    }
    if (filters.isActive !== undefined) {
      query.where({ is_active: filters.isActive });
    }
    if (filters.limit) {
      query.limit(filters.limit);
    }
    if (filters.offset) {
      query.offset(filters.offset);
    }
    return query.orderBy('created_at', 'desc');
  }

  async updatePatient(id, clinicId, data) {
    const updateData = {};
    if (data.firstName !== undefined) updateData.first_name = data.firstName;
    if (data.lastName !== undefined) updateData.last_name = data.lastName;
    if (data.dateOfBirth !== undefined) updateData.date_of_birth = data.dateOfBirth;
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.emergencyContactName !== undefined) updateData.emergency_contact_name = data.emergencyContactName;
    if (data.emergencyContactPhone !== undefined) updateData.emergency_contact_phone = data.emergencyContactPhone;
    if (data.pcpDoctorId !== undefined) updateData.pcp_doctor_id = data.pcpDoctorId;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;
    updateData.updated_at = this.db.fn.now();

    await this.db('patients')
      .where({ id, clinic_id: clinicId })
      .update(updateData);
    return this.getPatientById(id);
  }

  async deletePatient(id, clinicId) {
    await this.db('patients')
      .where({ id, clinic_id: clinicId })
      .update({ is_active: false, updated_at: this.db.fn.now() });
    return true;
  }

  async hardDeletePatient(id, clinicId) {
    await this.db('patients')
      .where({ id, clinic_id: clinicId })
      .delete();
    return true;
  }
}

module.exports = PatientService;