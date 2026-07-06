const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { tenantContext } = require('../middleware/tenantContext');
const { requireRole, ROLES } = require('../middleware/rbac');

router.use(tenantContext);

// Generate referral number
function generateReferralNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return 'REF-' + year + month + day + '-' + random;
}

// GET /api/referrals - List all referrals
router.get('/', requireRole([ROLES.SUPER_ADMIN, ROLES.CLINIC_ADMIN, ROLES.DOCTOR]), async (req, res, next) => {
  try {
    const db = req.db;
    const clinicId = req.clinicId;
    const { status, patientId } = req.query;

    let query = db('referrals')
      .where({ "referrals.clinic_id": clinicId })
      .leftJoin('patients', 'referrals.patient_id', 'patients.id')
      .leftJoin('users as referring', 'referrals.referring_doctor_id', 'referring.id')
      .select(
        'referrals.*',
        'patients.first_name as patient_first_name',
        'patients.last_name as patient_last_name',
        'referring.first_name as referring_first_name',
        'referring.last_name as referring_last_name'
      );

    if (status) query = query.where({ status });
    if (patientId) query = query.where({ patient_id: patientId });

    const referrals = await query.orderBy('created_at', 'desc');

    res.json({ success: true, referrals });
  } catch (err) {
    console.error('Error fetching referrals:', err);
    next(err);
  }
});

// GET /api/referrals/patient/:patientId - Get patient referrals
router.get('/patient/:patientId', requireRole([ROLES.SUPER_ADMIN, ROLES.CLINIC_ADMIN, ROLES.DOCTOR]), async (req, res, next) => {
  try {
    const db = req.db;
    const clinicId = req.clinicId;
    const { patientId } = req.params;

    const referrals = await db('referrals')
      .where({ "referrals.clinic_id": clinicId, patient_id: patientId })
      .orderBy('created_at', 'desc');

    res.json({ success: true, referrals });
  } catch (err) {
    next(err);
  }
});

// GET /api/referrals/:id - Get single referral
router.get('/:id', requireRole([ROLES.SUPER_ADMIN, ROLES.CLINIC_ADMIN, ROLES.DOCTOR]), async (req, res, next) => {
  try {
    const db = req.db;
    const clinicId = req.clinicId;
    const { id } = req.params;

    const referral = await db('referrals')
      .where({ clinic_id: clinicId, 'referrals.id': id })
      .leftJoin('patients', 'referrals.patient_id', 'patients.id')
      .leftJoin('users as referring', 'referrals.referring_doctor_id', 'referring.id')
      .select(
        'referrals.*',
        'patients.first_name as patient_first_name',
        'patients.last_name as patient_last_name',
        'referring.first_name as referring_first_name',
        'referring.last_name as referring_last_name'
      )
      .first();

    if (!referral) {
      return res.status(404).json({ error: 'Referral not found' });
    }

    res.json({ success: true, referral });
  } catch (err) {
    next(err);
  }
});

// POST /api/referrals - Create referral
router.post('/', requireRole([ROLES.SUPER_ADMIN, ROLES.CLINIC_ADMIN, ROLES.DOCTOR]), async (req, res, next) => {
  try {
    const db = req.db;
    const clinicId = req.clinicId;
    const userId = req.user.id;

    const {
      patient_id,
      consultation_id,
      past_medical_history,
      past_surgical_history,
      obstetric_history,
      current_diagnosis,
      investigations_done,
      investigation_results,
      reason_for_referral,
      clinical_summary,
      urgency,
      referring_clinician_name,
      referring_clinician_title,
      referring_clinician_phone,
      referring_clinician_email,
      facility_name,
      department,
      specialty,
      doctor_name,
      notes
    } = req.body;

    if (!patient_id || !reason_for_referral) {
      return res.status(400).json({ error: 'Patient ID and reason for referral are required' });
    }

    const id = uuidv4();
    const referralNo = generateReferralNumber();

    await db('referrals').insert({
      id,
      clinic_id: clinicId,
      patient_id,
      consultation_id: consultation_id || null,
      referring_doctor_id: userId,
      referral_no: referralNo,
      past_medical_history: past_medical_history || '',
      past_surgical_history: past_surgical_history || '',
      obstetric_history: obstetric_history || '',
      current_diagnosis: current_diagnosis || '',
      investigations_done: investigations_done || '',
      investigation_results: investigation_results || '',
      reason_for_referral,
      clinical_summary: clinical_summary || '',
      urgency: urgency || 'routine',
      referring_clinician_name: referring_clinician_name || '',
      referring_clinician_title: referring_clinician_title || '',
      referring_clinician_phone: referring_clinician_phone || '',
      referring_clinician_email: referring_clinician_email || '',
      facility_name: facility_name || '',
      department: department || '',
      specialty: specialty || '',
      doctor_name: doctor_name || '',
      notes: notes || '',
      status: 'generated'
    });

    const newReferral = await db('referrals').where({ id }).first();

    res.status(201).json({
      success: true,
      message: 'Referral created successfully',
      referral: newReferral
    });
  } catch (err) {
    console.error('Error creating referral:', err);
    next(err);
  }
});

// PATCH /api/referrals/:id/status - Update referral status
router.patch('/:id/status', requireRole([ROLES.SUPER_ADMIN, ROLES.CLINIC_ADMIN, ROLES.DOCTOR]), async (req, res, next) => {
  try {
    const db = req.db;
    const clinicId = req.clinicId;
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['generated', 'sent', 'accepted', 'completed', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const referral = await db('referrals')
      .where({ clinic_id: clinicId, id })
      .first();

    if (!referral) {
      return res.status(404).json({ error: 'Referral not found' });
    }

    await db('referrals')
      .where({ id })
      .update({ status, updated_at: db.fn.now() });

    res.json({
      success: true,
      message: 'Referral status updated to ' + status
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/referrals/:id - Delete referral
router.delete('/:id', requireRole([ROLES.SUPER_ADMIN, ROLES.CLINIC_ADMIN]), async (req, res, next) => {
  try {
    const db = req.db;
    const clinicId = req.clinicId;
    const { id } = req.params;

    const referral = await db('referrals')
      .where({ clinic_id: clinicId, id })
      .first();

    if (!referral) {
      return res.status(404).json({ error: 'Referral not found' });
    }

    await db('referrals').where({ id }).del();

    res.json({
      success: true,
      message: 'Referral deleted successfully'
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;


