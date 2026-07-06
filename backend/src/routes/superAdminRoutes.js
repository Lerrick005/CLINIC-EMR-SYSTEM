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
      .select(
        'id', 
        'name', 
        'mfl_code', 
        'county', 
        'subcounty', 
        'ward', 
        'address', 
        'phone', 
        'email', 
        'is_active',
        'is_legacy',
        'subscription_status',
        'subscription_ends_at',
        'created_at'
      )
      .orderBy('name', 'asc');

    // Get user count for each clinic
    for (const clinic of clinics) {
      const userCount = await db('users')
        .where({ clinic_id: clinic.id, is_active: true })
        .count('id as count')
        .first();
      clinic.user_count = parseInt(userCount?.count || 0);
      
      const patientCount = await db('patients')
        .where({ clinic_id: clinic.id, is_active: true })
        .count('id as count')
        .first();
      clinic.patient_count = parseInt(patientCount?.count || 0);
    }

    res.json({ success: true, clinics });
  } catch (err) {
    console.error('Error fetching clinics:', err);
    res.status(500).json({ error: err.message });
  }
});


// ============================================
// TEST ENDPOINT - Verify token works
// ============================================
router.get('/test', isSuperAdmin, async (req, res, next) => {
  try {
    res.json({ 
      success: true, 
      message: 'Super Admin token is working!',
      user: req.user 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ============================================
// CREATE CLINIC (Super Admin only)
// ============================================
router.post('/clinics', isSuperAdmin, async (req, res, next) => {
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
      isLegacy = false
    } = req.body;

    console.log('📝 Creating clinic:', { name, adminEmail, isLegacy });

    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Clinic name is required' });
    }
    if (!adminEmail || !adminPassword) {
      return res.status(400).json({ error: 'Admin email and password are required' });
    }
    if (adminPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if clinic already exists
    const existingClinic = await db('clinics')
      .where({ name })
      .first();

    if (existingClinic) {
      return res.status(400).json({ error: 'Clinic with this name already exists' });
    }

    // Check if admin email already exists
    const existingUser = await db('users')
      .where({ email: adminEmail })
      .first();

    if (existingUser) {
      return res.status(400).json({ error: 'Admin email already registered' });
    }

    // Create clinic
    const clinicId = uuidv4();
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
      subscription_status: isLegacy ? 'LEGACY' : 'TRIAL',
      subscription_ends_at: isLegacy ? null : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      created_at: db.fn.now(),
      updated_at: db.fn.now()
    });

    // Create admin user for the clinic
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

    console.log('✅ Clinic created:', clinicId);

    res.status(201).json({
      success: true,
      message: 'Clinic created successfully',
      clinic: {
        id: clinicId,
        name,
        mflCode,
        county,
        subcounty,
        ward,
        isLegacy,
        subscriptionStatus: isLegacy ? 'LEGACY' : 'TRIAL'
      },
      admin: {
        email: adminEmail,
        firstName: adminFirstName || 'Clinic',
        lastName: adminLastName || 'Admin'
      }
    });
  } catch (err) {
    console.error('❌ Error creating clinic:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// UPDATE CLINIC (Super Admin only)
// ============================================
router.put('/clinics/:id', isSuperAdmin, async (req, res, next) => {
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

    await db('clinics')
      .where({ id })
      .update({
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
      });

    res.json({
      success: true,
      message: 'Clinic updated successfully'
    });
  } catch (err) {
    console.error('Error updating clinic:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// DELETE/DEACTIVATE CLINIC (Super Admin only)
// ============================================
router.delete('/clinics/:id', isSuperAdmin, async (req, res, next) => {
  try {
    const db = req.db;
    const { id } = req.params;

    await db('clinics')
      .where({ id })
      .update({
        is_active: false,
        updated_at: db.fn.now()
      });

    // Also deactivate all users for this clinic
    await db('users')
      .where({ clinic_id: id })
      .update({
        is_active: false,
        updated_at: db.fn.now()
      });

    res.json({
      success: true,
      message: 'Clinic deactivated successfully'
    });
  } catch (err) {
    console.error('Error deactivating clinic:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;


