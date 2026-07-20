const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { isSuperAdmin } = require('../middleware/superAdmin');

// ============================================
// GET ALL CLINICS (Super Admin only)
// ============================================
router.get('/clinics', isSuperAdmin, async (req, res, next) => {
  try {
    const db = req.db;
    const clinics = await db('clinics')
      .select('id', 'name', 'mfl_code', 'county', 'subcounty', 'ward', 'address', 'phone', 'email', 'is_active', 'is_legacy', 'subscription_status', 'subscription_ends_at', 'created_at')
      .orderBy('name', 'asc');

    for (const clinic of clinics) {
      const userCount = await db('users').where({ clinic_id: clinic.id, is_active: true }).count('id as count').first();
      clinic.user_count = parseInt(userCount?.count || 0);
      const patientCount = await db('patients').where({ clinic_id: clinic.id, is_active: true }).count('id as count').first();
      clinic.patient_count = parseInt(patientCount?.count || 0);
    }
    res.json({ success: true, clinics });
  } catch (err) {
    console.error('Error fetching clinics:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// TEST ENDPOINT
// ============================================
router.get('/test', isSuperAdmin, async (req, res) => {
  res.json({ success: true, message: 'Super Admin token is working!', user: req.user });
});

// ============================================
// CREATE CLINIC
// ============================================
router.post('/clinics', isSuperAdmin, async (req, res) => {
  try {
    const db = req.db;
    const { 
      name, 
      mflCode, 
      county, 
      subcounty, 
      ward, 
      address, 
      phone, 
      email, 
      adminEmail, 
      adminPassword, 
      adminFirstName, 
      adminLastName, 
      isLegacy = false, 
      subscriptionType = 'TRIAL' 
    } = req.body;

    if (!name) return res.status(400).json({ error: 'Clinic name is required' });
    if (!adminEmail || !adminPassword) return res.status(400).json({ error: 'Admin email and password are required' });
    if (adminPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const existingClinic = await db('clinics').where({ name }).first();
    if (existingClinic) return res.status(400).json({ error: 'Clinic with this name already exists' });

    const existingUser = await db('users').where({ email: adminEmail }).first();
    if (existingUser) return res.status(400).json({ error: 'Admin email already registered' });

    const clinicId = uuidv4();
    
    // Determine subscription end date
    let subscriptionEndsAt = null;
    if (subscriptionType === 'PAID') {
      subscriptionEndsAt = null; // PAID has no end date
    } else if (isLegacy) {
      subscriptionEndsAt = null; // LEGACY has no end date
    } else {
      subscriptionEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // TRIAL: 14 days
    }

    await db('clinics').insert({
      id: clinicId, 
      name, 
      mfl_code: mflCode || '', 
      county: county || '', 
      subcounty: subcounty || '',
      ward: ward || '', 
      address: address || '', 
      phone: phone || '', 
      email: email || '',
      is_active: true, 
      is_legacy: isLegacy || false,
      subscription_status: subscriptionType || 'TRIAL',
      subscription_ends_at: subscriptionEndsAt,
      created_at: db.fn.now(), 
      updated_at: db.fn.now()
    });

    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const userId = uuidv4();
    await db('users').insert({
      id: userId, 
      clinic_id: clinicId, 
      email: adminEmail, 
      password_hash: hashedPassword,
      first_name: adminFirstName || 'Clinic', 
      last_name: adminLastName || 'Admin',
      role: 'CLINIC_ADMIN', 
      is_active: true, 
      created_at: db.fn.now(), 
      updated_at: db.fn.now()
    });

    res.status(201).json({ 
      success: true, 
      message: 'Clinic created', 
      clinic: { 
        id: clinicId, 
        name,
        subscription_status: subscriptionType,
        subscription_ends_at: subscriptionEndsAt
      }, 
      admin: { email: adminEmail } 
    });
  } catch (err) {
    console.error('Error creating clinic:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// UPDATE CLINIC
// ============================================
router.put('/clinics/:id', isSuperAdmin, async (req, res) => {
  try {
    const db = req.db;
    const { id } = req.params;
    const { 
      name, 
      mflCode, 
      county, 
      subcounty, 
      ward, 
      address, 
      phone, 
      email, 
      is_active, 
      is_legacy, 
      subscription_status 
    } = req.body;

    // If updating to PAID, clear the expiration date
    let updateData = {
      name, 
      mfl_code: mflCode, 
      county, 
      subcounty, 
      ward, 
      address, 
      phone, 
      email, 
      is_active, 
      is_legacy, 
      subscription_status,
      updated_at: db.fn.now()
    };

    // If subscription is PAID, set subscription_ends_at to null
    if (subscription_status === 'PAID') {
      updateData.subscription_ends_at = null;
    } else if (subscription_status === 'LEGACY') {
      updateData.subscription_ends_at = null;
    } else if (subscription_status === 'TRIAL') {
      // If switching to TRIAL, set a new 14-day expiration if null
      const clinic = await db('clinics').where({ id }).first();
      if (!clinic.subscription_ends_at) {
        updateData.subscription_ends_at = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      }
    }

    await db('clinics').where({ id }).update(updateData);
    res.json({ success: true, message: 'Clinic updated' });
  } catch (err) {
    console.error('Error updating clinic:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// DEACTIVATE CLINIC
// ============================================
router.delete('/clinics/:id', isSuperAdmin, async (req, res) => {
  try {
    const db = req.db;
    const { id } = req.params;
    await db('clinics').where({ id }).update({ is_active: false, updated_at: db.fn.now() });
    await db('users').where({ clinic_id: id }).update({ is_active: false, updated_at: db.fn.now() });
    res.json({ success: true, message: 'Clinic deactivated' });
  } catch (err) {
    console.error('Error deactivating clinic:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// REACTIVATE CLINIC
// ============================================
router.post('/clinics/:id/reactivate', isSuperAdmin, async (req, res) => {
  try {
    const db = req.db;
    const { id } = req.params;
    await db('clinics').where({ id }).update({ is_active: true, updated_at: db.fn.now() });
    await db('users').where({ clinic_id: id }).update({ is_active: true, updated_at: db.fn.now() });
    res.json({ success: true, message: 'Clinic reactivated' });
  } catch (err) {
    console.error('Error reactivating clinic:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// GET CLINIC USERS
// ============================================
router.get('/clinics/:id/users', isSuperAdmin, async (req, res) => {
  try {
    const db = req.db;
    const { id } = req.params;
    const users = await db('users').where({ clinic_id: id }).select('id', 'email', 'first_name', 'last_name', 'role', 'is_active', 'last_login', 'created_at').orderBy('role', 'asc');
    res.json({ success: true, users });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// RESET CLINIC ADMIN PASSWORD
// ============================================
router.post('/clinics/:id/reset-password', isSuperAdmin, async (req, res) => {
  try {
    const db = req.db;
    const { id } = req.params;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    const adminUser = await db('users').where({ clinic_id: id, role: 'CLINIC_ADMIN', is_active: true }).first();
    if (!adminUser) return res.status(404).json({ error: 'No active admin found' });
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db('users').where({ id: adminUser.id }).update({ password_hash: hashedPassword, updated_at: db.fn.now() });
    res.json({ success: true, message: `Password reset for ${adminUser.email}` });
  } catch (err) {
    console.error('Error resetting password:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// PERMANENT DELETE CLINIC (Super Admin only)
// ============================================
router.delete('/clinics/:id/permanent', isSuperAdmin, async (req, res) => {
  try {
    const db = req.db;
    const { id } = req.params;

    // Delete all related data
    await db('audit_logs').where({ clinic_id: id }).del();
    await db('notifications').where({ clinic_id: id }).del();
    await db('lab_results').whereIn('order_id', db('lab_orders').where({ clinic_id: id }).select('id')).del();
    await db('lab_orders').where({ clinic_id: id }).del();
    await db('prescriptions').where({ clinic_id: id }).del();
    await db('consultations').where({ clinic_id: id }).del();
    await db('referrals').where({ clinic_id: id }).del();
    await db('patients').where({ clinic_id: id }).del();
    await db('users').where({ clinic_id: id }).del();
    await db('clinics').where({ id }).del();

    res.json({ success: true, message: 'Clinic permanently deleted with all data' });
  } catch (err) {
    console.error('Error deleting clinic:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;