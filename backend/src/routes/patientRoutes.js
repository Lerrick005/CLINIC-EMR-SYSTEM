const express = require('express');
const router = express.Router();
const PatientService = require('../services/patientService');
const { tenantContext } = require('../middleware/tenantContext');
const { requireRole, ROLES } = require('../middleware/rbac');

// All patient routes require tenant context (clinic isolation)
router.use(tenantContext);

// Get all patients for the current clinic (with optional search)
router.get('/', async (req, res, next) => {
  try {
    const patientService = new PatientService(req.db);
    const filters = {
      search: req.query.search,
      isActive: req.query.isActive === 'false' ? false : true,
      limit: req.query.limit ? parseInt(req.query.limit) : 100,
      offset: req.query.offset ? parseInt(req.query.offset) : 0
    };
    const patients = await patientService.getPatientsByClinic(req.clinicId, filters);
    res.json({ success: true, patients });
  } catch (err) {
    next(err);
  }
});

// Get a single patient by ID
router.get('/:id', async (req, res, next) => {
  try {
    const patientService = new PatientService(req.db);
    const patient = await patientService.getPatientById(req.params.id, req.clinicId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    res.json({ success: true, patient });
  } catch (err) {
    next(err);
  }
});

// Create a new patient
router.post('/', async (req, res, next) => {
  try {
    const patientService = new PatientService(req.db);
    const { firstName, lastName, dateOfBirth, gender, phone, email, address, emergencyContactName, emergencyContactPhone, pcpDoctorId } = req.body;
    
    // Basic validation
    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'First name and last name are required' });
    }
    
    const patient = await patientService.createPatient(
      req.clinicId,
      {
        firstName,
        lastName,
        dateOfBirth,
        gender,
        phone,
        email,
        address,
        emergencyContactName,
        emergencyContactPhone,
        pcpDoctorId
      },
      req.user.id // current doctor as PCP if not specified
    );
        const { emitToClinic } = require('../socket');
    emitToClinic(req.clinicId, 'patient:created', { patient, createdBy: req.user.id });
    res.status(201).json({ success: true, patient });
  } catch (err) {
    next(err);
  }
});

// Update a patient
router.put('/:id', async (req, res, next) => {
  try {
    const patientService = new PatientService(req.db);
    const patient = await patientService.updatePatient(req.params.id, req.clinicId, req.body);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    res.json({ success: true, patient });
  } catch (err) {
    next(err);
  }
});

// Soft delete a patient (set is_active = false)
router.delete('/:id', async (req, res, next) => {
  try {
    const patientService = new PatientService(req.db);
    await patientService.deletePatient(req.params.id, req.clinicId);
    res.json({ success: true, message: 'Patient deactivated' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
// GET /api/patients/:id/medical-record - Get comprehensive patient record
router.get('/:id/medical-record', async (req, res, next) => {
  try {
    const db = req.db;
    const clinicId = req.clinicId;
    const { id } = req.params;

    // Get patient details
    const patient = await db('patients')
      .where({ id, clinic_id: clinicId })
      .first();

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Get all consultations
    const consultations = await db('consultations')
      .where({ patient_id: id, clinic_id: clinicId })
      .orderBy('consultation_date', 'desc');

    // Get lab orders
    const labOrders = await db('lab_orders')
      .where({ patient_id: id, clinic_id: clinicId })
      .orderBy('order_date', 'desc');

    // Get prescriptions (from consultations)
    const prescriptions = [];
    consultations.forEach(c => {
      if (c.prescriptions && c.prescriptions.length > 0) {
        c.prescriptions.forEach(p => {
          prescriptions.push({
            ...p,
            consultation_date: c.consultation_date,
            diagnosis: c.diagnosis
          });
        });
      }
    });

    // Get referrals
    const referrals = await db('referrals')
      .where({ patient_id: id, clinic_id: clinicId })
      .orderBy('referral_date', 'desc');

    res.json({
      success: true,
      patient,
      consultations,
      labOrders,
      prescriptions,
      referrals,
      stats: {
        totalVisits: consultations.length,
        totalDiagnoses: consultations.filter(c => c.diagnosis).length,
        totalLabs: labOrders.length,
        totalReferrals: referrals.length
      }
    });
  } catch (err) {
    console.error('Error fetching medical record:', err);
    next(err);
  }
});
