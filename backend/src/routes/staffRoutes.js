const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { tenantContext } = require('../middleware/tenantContext');
const AuthService = require('../services/authService');

// All staff routes require clinic context
router.use(tenantContext);

// GET /api/staff - Get all staff for the clinic
router.get('/', async (req, res, next) => {
  try {
    const db = req.db;
    const clinicId = req.clinicId;

    const staff = await db('users')
      .where({ clinic_id: clinicId })
      .whereNotIn('role', ['SUPER_ADMIN']) // Exclude super admin
      .select('id', 'email', 'first_name', 'last_name', 'role', 'is_active', 'last_login', 'created_at')
      .orderBy('created_at', 'desc');

    res.json({ success: true, staff });
  } catch (err) {
    console.error('Error fetching staff:', err);
    next(err);
  }
});

// POST /api/staff - Add new staff
router.post('/', async (req, res, next) => {
  try {
    const db = req.db;
    const clinicId = req.clinicId;
    const authService = new AuthService(db);
    const { email, firstName, lastName, role, password } = req.body;

    // Validation
    if (!email || !role || !password) {
      return res.status(400).json({ error: 'Email, role, and password are required' });
    }

    if (!['DOCTOR', 'RECEPTIONIST', 'PHARMACIST', 'LAB_STAFF', 'ACCOUNTANT'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Check if user already exists
    const existingUser = await db('users').where({ email }).first();
    if (existingUser) {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }

    // Create user
    const hashedPassword = await authService.hashPassword(password);
    const userId = uuidv4();

    await db('users').insert({
      id: userId,
      clinic_id: clinicId,
      email,
      password_hash: hashedPassword,
      first_name: firstName || '',
      last_name: lastName || '',
      role,
      is_active: true,
      must_change_password: true
    });

    const newUser = await db('users').where({ id: userId }).first();
    res.status(201).json({
      success: true,
      message: 'Staff added successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        role: newUser.role
      }
    });

  } catch (err) {
    console.error('Error adding staff:', err);
    next(err);
  }
});

// PUT /api/staff/:id - Update staff
router.put('/:id', async (req, res, next) => {
  try {
    const db = req.db;
    const clinicId = req.clinicId;
    const { id } = req.params;
    const { firstName, lastName, role, isActive } = req.body;

    // Check if user exists and belongs to this clinic
    const user = await db('users')
      .where({ id, clinic_id: clinicId })
      .first();

    if (!user) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    // Update user
    const updateData = {};
    if (firstName !== undefined) updateData.first_name = firstName;
    if (lastName !== undefined) updateData.last_name = lastName;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.is_active = isActive;

    await db('users')
      .where({ id, clinic_id: clinicId })
      .update(updateData);

    res.json({
      success: true,
      message: 'Staff updated successfully'
    });

  } catch (err) {
    console.error('Error updating staff:', err);
    next(err);
  }
});

// DELETE /api/staff/:id - Deactivate/Delete staff
router.delete('/:id', async (req, res, next) => {
  try {
    const db = req.db;
    const clinicId = req.clinicId;
    const { id } = req.params;

    const user = await db('users')
      .where({ id, clinic_id: clinicId })
      .first();

    if (!user) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    // Soft delete - deactivate
    await db('users')
      .where({ id, clinic_id: clinicId })
      .update({ is_active: false });

    res.json({
      success: true,
      message: 'Staff deactivated successfully'
    });

  } catch (err) {
    console.error('Error deactivating staff:', err);
    next(err);
  }
});

module.exports = router;