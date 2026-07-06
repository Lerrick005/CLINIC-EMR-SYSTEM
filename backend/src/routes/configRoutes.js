const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { tenantContext } = require('../middleware/tenantContext');
const { requireRole, ROLES } = require('../middleware/rbac');
const { emitToClinic } = require('../socket');
const AuditService = require('../services/auditService');

// All config routes require clinic context
router.use(tenantContext);

// GET /api/config/clinic - Get clinic configuration
router.get('/clinic', async (req, res, next) => {
  try {
    const db = req.db;
    const clinicId = req.clinicId;

    const clinic = await db('clinics')
      .where({ id: clinicId })
      .first();

    if (!clinic) {
      return res.status(404).json({ error: 'Clinic not found' });
    }

    res.json({
      success: true,
      config: {
        clinicName: clinic.name || 'Clinic EMR',
        clinicAddress: clinic.address || '',
        clinicPhone: clinic.phone || '',
        clinicEmail: clinic.email || '',
        mflCode: clinic.mfl_code || '',
        county: clinic.county || '',
        subcounty: clinic.subcounty || '',
        ward: clinic.ward || '',
        consultationFee: clinic.settings?.consultationFee || 0,
        currency: clinic.settings?.currency || 'KES'
      }
    });
  } catch (err) {
    console.error('Error fetching clinic config:', err);
    next(err);
  }
});

// PUT /api/config/clinic - Update clinic configuration
router.put('/clinic', requireRole([ROLES.SUPER_ADMIN, ROLES.CLINIC_ADMIN]), async (req, res, next) => {
  try {
    const db = req.db;
    const clinicId = req.clinicId;
    const userId = req.user.id;
    const {
      clinicName,
      clinicAddress,
      clinicPhone,
      clinicEmail,
      mflCode,
      county,
      subcounty,
      ward,
      consultationFee,
      currency
    } = req.body;

    await db('clinics')
      .where({ id: clinicId })
      .update({
        name: clinicName,
        address: clinicAddress,
        phone: clinicPhone,
        email: clinicEmail,
        mfl_code: mflCode,
        county: county,
        subcounty: subcounty,
        ward: ward,
        settings: {
          consultationFee: consultationFee || 0,
          currency: currency || 'KES'
        },
        updated_at: db.fn.now()
      });

    // Audit log
    const auditService = new AuditService(db);
    await auditService.logAction({
      userId,
      clinicId,
      action: 'UPDATE',
      resourceType: 'clinic',
      resourceId: clinicId,
      details: { clinicName, county, subcounty },
      ipAddress: req.ip
    });

    // Real-time socket
    emitToClinic(clinicId, 'audit:new', {
      action: 'UPDATE',
      resourceType: 'clinic',
      details: { clinicName },
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Clinic settings updated successfully'
    });
  } catch (err) {
    console.error('Error updating clinic config:', err);
    next(err);
  }
});

// GET /api/config/doctors - Get all doctors
router.get('/doctors', requireRole([ROLES.SUPER_ADMIN, ROLES.CLINIC_ADMIN]), async (req, res, next) => {
  try {
    const db = req.db;
    const clinicId = req.clinicId;

    const doctors = await db('users')
      .where({
        clinic_id: clinicId,
        role: 'DOCTOR',
        is_active: true
      })
      .select('id', 'first_name', 'last_name', 'email')
      .orderBy('first_name', 'asc');

    const formattedDoctors = doctors.map(doc => ({
      id: doc.id,
      firstName: doc.first_name || '',
      lastName: doc.last_name || '',
      username: doc.email || '',
      email: doc.email || '',
      specialty: 'General Practice',
      licenseNo: ''
    }));

    res.json({
      success: true,
      doctors: formattedDoctors
    });
  } catch (err) {
    console.error('Error fetching doctors:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/config/doctors - Add a new doctor
router.post('/doctors', requireRole([ROLES.SUPER_ADMIN, ROLES.CLINIC_ADMIN]), async (req, res, next) => {
  try {
    const db = req.db;
    const clinicId = req.clinicId;
    const userId = req.user.id;
    const { firstName, lastName, password, specialty, licenseNo, email } = req.body;

    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'First name and last name are required' });
    }
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    if (!password || password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }

    const existing = await db('users')
      .where({ email })
      .first();

    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();

    await db('users').insert({
      id,
      clinic_id: clinicId,
      first_name: firstName,
      last_name: lastName,
      email,
      password_hash: hashedPassword,
      role: 'DOCTOR',
      is_active: true,
      created_at: db.fn.now(),
      updated_at: db.fn.now()
    });

    // Audit log
    const auditService = new AuditService(db);
    await auditService.logAction({
      userId,
      clinicId,
      action: 'CREATE',
      resourceType: 'doctor',
      resourceId: id,
      details: { firstName, lastName, email },
      ipAddress: req.ip
    });

    // Real-time socket
    emitToClinic(clinicId, 'audit:new', {
      action: 'CREATE',
      resourceType: 'doctor',
      details: { firstName, lastName, email },
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Doctor added successfully',
      doctor: { id, firstName, lastName, email }
    });
  } catch (err) {
    console.error('Error adding doctor:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/config/doctors/:id - Deactivate doctor
router.delete('/doctors/:id', requireRole([ROLES.SUPER_ADMIN, ROLES.CLINIC_ADMIN]), async (req, res, next) => {
  try {
    const db = req.db;
    const clinicId = req.clinicId;
    const userId = req.user.id;
    const { id } = req.params;

    await db('users')
      .where({ id, clinic_id: clinicId })
      .update({
        is_active: false,
        updated_at: db.fn.now()
      });

    // Audit log
    const auditService = new AuditService(db);
    await auditService.logAction({
      userId,
      clinicId,
      action: 'DELETE',
      resourceType: 'doctor',
      resourceId: id,
      details: { doctorId: id },
      ipAddress: req.ip
    });

    // Real-time socket
    emitToClinic(clinicId, 'audit:new', {
      action: 'DELETE',
      resourceType: 'doctor',
      details: { id },
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, message: 'Doctor deactivated successfully' });
  } catch (err) {
    console.error('Error deactivating doctor:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
