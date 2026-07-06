const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { tenantContext } = require('../middleware/tenantContext');
const { requireRole, ROLES } = require('../middleware/rbac');

router.use(tenantContext);

// GET /api/lab-catalog - Get all tests for clinic
router.get('/', requireRole([ROLES.SUPER_ADMIN, ROLES.CLINIC_ADMIN, ROLES.DOCTOR, ROLES.LAB_STAFF]), async (req, res, next) => {
  try {
    const db = req.db;
    const clinicId = req.clinicId;

    const tests = await db('lab_catalog')
      .where({ clinic_id: clinicId, is_active: true })
      .orderBy('name', 'asc');

    res.json({ success: true, tests });
  } catch (err) {
    next(err);
  }
});

// POST /api/lab-catalog - Add new test
router.post('/', requireRole([ROLES.SUPER_ADMIN, ROLES.CLINIC_ADMIN]), async (req, res, next) => {
  try {
    const db = req.db;
    const clinicId = req.clinicId;
    const { name, code, category, price, turnaround, reference_ranges } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: 'Name and code are required' });
    }

    const id = uuidv4();
    await db('lab_catalog').insert({
      id,
      clinic_id: clinicId,
      name,
      code: code.toUpperCase(),
      category: category || '',
      price: price || 0,
      turnaround: turnaround || '',
      reference_ranges: reference_ranges || {},
      is_active: true,
      is_system: false,
    });

    res.status(201).json({ success: true, message: 'Test added successfully' });
  } catch (err) {
    console.error('Error adding test:', err);
    next(err);
  }
});

// PUT /api/lab-catalog/:id - Update test
router.put('/:id', requireRole([ROLES.SUPER_ADMIN, ROLES.CLINIC_ADMIN]), async (req, res, next) => {
  try {
    const db = req.db;
    const clinicId = req.clinicId;
    const { id } = req.params;
    const { name, code, category, price, turnaround, reference_ranges } = req.body;

    const test = await db('lab_catalog')
      .where({ id, clinic_id: clinicId })
      .first();

    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    if (test.is_system) {
      return res.status(403).json({ error: 'Cannot modify system tests' });
    }

    await db('lab_catalog')
      .where({ id })
      .update({
        name: name || test.name,
        code: code ? code.toUpperCase() : test.code,
        category: category || test.category,
        price: price || test.price,
        turnaround: turnaround || test.turnaround,
        reference_ranges: reference_ranges || test.reference_ranges,
        updated_at: db.fn.now(),
      });

    res.json({ success: true, message: 'Test updated successfully' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/lab-catalog/:id - Soft delete test
router.delete('/:id', requireRole([ROLES.SUPER_ADMIN, ROLES.CLINIC_ADMIN]), async (req, res, next) => {
  try {
    const db = req.db;
    const clinicId = req.clinicId;
    const { id } = req.params;

    const test = await db('lab_catalog')
      .where({ id, clinic_id: clinicId })
      .first();

    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    if (test.is_system) {
      return res.status(403).json({ error: 'Cannot delete system tests' });
    }

    await db('lab_catalog')
      .where({ id })
      .update({ is_active: false, updated_at: db.fn.now() });

    res.json({ success: true, message: 'Test deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;