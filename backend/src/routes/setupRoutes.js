const express = require('express');
const router = express.Router();
const AuthService = require('../services/authService');

// ==============================
// GET: Setup Status (MUST come before /init)
// ==============================
router.get('/status', async (req, res) => {
  try {
    const db = req.db;
    const authService = new AuthService(db);

    const completed = await authService.isSetupComplete();

    res.json({ completed });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check setup status' });
  }
});

// ==============================
// POST: Initialize System Setup
// ==============================
router.post('/init', async (req, res, next) => {
  const db = req.db;
  const authService = new AuthService(db);

  try {
    // Check if setup already completed
    const completed = await authService.isSetupComplete();
    if (completed) {
      return res.status(400).json({ error: 'Setup already completed' });
    }

    const { superAdmin, clinic, admin } = req.body;

    // Validation
    if (
      !superAdmin?.email ||
      !superAdmin?.password ||
      !clinic?.name ||
      !admin?.email ||
      !admin?.password
    ) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 1. Create SUPER_ADMIN
    await authService.createSuperAdmin(
      superAdmin.email,
      superAdmin.password,
      superAdmin.firstName || 'System',
      superAdmin.lastName || 'Administrator'
    );

    // 2. Create clinic and clinic admin
    await authService.createClinicAndAdmin(clinic, admin);

    // 3. Mark setup complete
    await authService.markSetupComplete();

    res.status(201).json({
      success: true,
      message: 'Setup complete. You can now log in.'
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;