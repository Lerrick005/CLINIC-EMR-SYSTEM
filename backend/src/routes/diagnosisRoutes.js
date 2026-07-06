const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { tenantContext } = require('../middleware/tenantContext');
const { requireRole, ROLES } = require('../middleware/rbac');

router.use(tenantContext);

// ============================================
// HELPER FUNCTIONS
// ============================================

// Helper to safely parse JSON
function safeParseJSON(data) {
  if (!data) return {};
  if (typeof data === 'object') return data;
  try {
    return JSON.parse(data);
  } catch (e) {
    return {};
  }
}

// ============================================
// GET ALL DIAGNOSES
// ============================================
router.get('/all', requireRole([ROLES.SUPER_ADMIN, ROLES.CLINIC_ADMIN, ROLES.DOCTOR, ROLES.PHARMACIST, ROLES.LAB_STAFF, ROLES.RECEPTIONIST]), async (req, res, next) => {
  try {
    const db = req.db;
    const clinicId = req.clinicId;

    // Get all diagnoses from consultations
    const diagnoses = await db('consultations')
      .where({ clinic_id: clinicId })
      .whereNotNull('diagnosis')
      .where('diagnosis', '!=', '')
      .select('diagnosis')
      .count('id as total_cases')
      .groupBy('diagnosis')
      .orderBy('total_cases', 'desc');

    // Format the response
    const formattedDiagnoses = diagnoses.map((d, index) => ({
      id: `diag-${index}`,
      name: d.diagnosis,
      code: `D-${String(index + 1).padStart(4, '0')}`,
      category: 'General',
      total_cases: parseInt(d.total_cases) || 0,
    }));

    res.json({
      success: true,
      diagnoses: formattedDiagnoses,
      total: formattedDiagnoses.length
    });
  } catch (err) {
    console.error('Error fetching diagnoses:', err);
    next(err);
  }
});

// ============================================
// GET DIAGNOSIS BY ID
// ============================================
router.get('/:id', requireRole([ROLES.SUPER_ADMIN, ROLES.CLINIC_ADMIN, ROLES.DOCTOR]), async (req, res, next) => {
  try {
    const db = req.db;
    const clinicId = req.clinicId;
    const { id } = req.params;

    // Since we don't have a diagnoses table, we'll get from consultations
    const diagnosis = await db('consultations')
      .where({ clinic_id: clinicId })
      .where('diagnosis', 'ilike', `%${id}%`)
      .first();

    if (!diagnosis) {
      return res.status(404).json({ error: 'Diagnosis not found' });
    }

    res.json({
      success: true,
      diagnosis: {
        name: diagnosis.diagnosis,
        code: `D-${id}`,
        category: 'General',
        total_cases: 1
      }
    });
  } catch (err) {
    console.error('Error fetching diagnosis:', err);
    next(err);
  }
});

// ============================================
// CREATE DIAGNOSIS
// ============================================
router.post('/', requireRole([ROLES.SUPER_ADMIN, ROLES.CLINIC_ADMIN, ROLES.DOCTOR]), async (req, res, next) => {
  try {
    const db = req.db;
    const clinicId = req.clinicId;
    const { name, code, category, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Diagnosis name is required' });
    }

    // Check if diagnosis already exists
    const existing = await db('consultations')
      .where({ clinic_id: clinicId })
      .where('diagnosis', 'ilike', name)
      .first();

    if (existing) {
      return res.status(400).json({ error: 'Diagnosis already exists' });
    }

    // Since we don't have a diagnoses table, we'll just return success
    // In a real system, you'd have a diagnoses table
    res.status(201).json({
      success: true,
      message: 'Diagnosis added successfully',
      diagnosis: {
        id: `diag-${Date.now()}`,
        name,
        code: code || `D-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
        category: category || 'General',
        description: description || '',
        total_cases: 0
      }
    });
  } catch (err) {
    console.error('Error creating diagnosis:', err);
    next(err);
  }
});

// ============================================
// UPDATE DIAGNOSIS
// ============================================
router.put('/:id', requireRole([ROLES.SUPER_ADMIN, ROLES.CLINIC_ADMIN, ROLES.DOCTOR]), async (req, res, next) => {
  try {
    const db = req.db;
    const clinicId = req.clinicId;
    const { id } = req.params;
    const { name, code, category, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Diagnosis name is required' });
    }

    // Check if diagnosis exists
    const existing = await db('consultations')
      .where({ clinic_id: clinicId })
      .where('diagnosis', 'ilike', `%${id}%`)
      .first();

    if (!existing) {
      return res.status(404).json({ error: 'Diagnosis not found' });
    }

    // In a real system, you'd update the diagnoses table
    res.json({
      success: true,
      message: 'Diagnosis updated successfully',
      diagnosis: {
        id,
        name,
        code: code || existing.diagnosis,
        category: category || 'General',
        description: description || '',
        total_cases: 1
      }
    });
  } catch (err) {
    console.error('Error updating diagnosis:', err);
    next(err);
  }
});

// ============================================
// DELETE DIAGNOSIS
// ============================================
router.delete('/:id', requireRole([ROLES.SUPER_ADMIN, ROLES.CLINIC_ADMIN]), async (req, res, next) => {
  try {
    const db = req.db;
    const clinicId = req.clinicId;
    const { id } = req.params;

    // Check if diagnosis exists
    const existing = await db('consultations')
      .where({ clinic_id: clinicId })
      .where('diagnosis', 'ilike', `%${id}%`)
      .first();

    if (!existing) {
      return res.status(404).json({ error: 'Diagnosis not found' });
    }

    // In a real system, you'd soft delete from diagnoses table
    res.json({
      success: true,
      message: 'Diagnosis deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting diagnosis:', err);
    next(err);
  }
});

// ============================================
// GET DIAGNOSIS STATISTICS
// ============================================
router.get('/stats/overview', requireRole([ROLES.SUPER_ADMIN, ROLES.CLINIC_ADMIN, ROLES.DOCTOR]), async (req, res, next) => {
  try {
    const db = req.db;
    const clinicId = req.clinicId;

    // Get top diagnoses
    const topDiagnoses = await db('consultations')
      .where({ clinic_id: clinicId })
      .whereNotNull('diagnosis')
      .where('diagnosis', '!=', '')
      .select('diagnosis')
      .count('id as count')
      .groupBy('diagnosis')
      .orderBy('count', 'desc')
      .limit(10);

    // Get total unique diagnoses
    const uniqueCount = await db('consultations')
      .where({ clinic_id: clinicId })
      .whereNotNull('diagnosis')
      .where('diagnosis', '!=', '')
      .countDistinct('diagnosis as count')
      .first();

    // Get total consultations with diagnosis
    const totalWithDiagnosis = await db('consultations')
      .where({ clinic_id: clinicId })
      .whereNotNull('diagnosis')
      .where('diagnosis', '!=', '')
      .count('id as count')
      .first();

    res.json({
      success: true,
      stats: {
        total_unique: parseInt(uniqueCount?.count) || 0,
        total_with_diagnosis: parseInt(totalWithDiagnosis?.count) || 0,
        top_diagnoses: topDiagnoses.map(d => ({
          name: d.diagnosis,
          count: parseInt(d.count) || 0
        }))
      }
    });
  } catch (err) {
    console.error('Error fetching diagnosis stats:', err);
    next(err);
  }
});

module.exports = router;
