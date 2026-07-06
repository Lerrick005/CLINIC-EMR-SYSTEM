const express = require('express');
const router = express.Router();
const { tenantContext } = require('../middleware/tenantContext');

router.use(tenantContext);

// GET /api/dashboard/stats - Dashboard statistics
router.get('/stats', async (req, res, next) => {
  try {
    const db = req.db;
    const clinicId = req.clinicId;

    // Total Patients
    const totalPatients = await db('patients')
      .where({ clinic_id: clinicId })
      .count('id as count')
      .first();

    // Active Patients
    const activePatients = await db('patients')
      .where({ clinic_id: clinicId, is_active: true })
      .count('id as count')
      .first();

    // Total Visits
    const totalVisits = await db('consultations')
      .where({ clinic_id: clinicId })
      .count('id as count')
      .first();

    // TODAY'S VISITS - FIXED (was hardcoded to 0)
    const todayVisits = await db('consultations')
      .where({ clinic_id: clinicId })
      .whereRaw('DATE(consultation_date) = CURRENT_DATE')
      .count('id as count')
      .first();

    // Handle lab_orders safely (table may not exist)
    let pendingLabs = 0;
    let totalLabs = 0;
    try {
      const pending = await db('lab_orders')
        .where({ clinic_id: clinicId, status: 'pending' })
        .count('id as count')
        .first();
      pendingLabs = parseInt(pending?.count || 0);
      const total = await db('lab_orders')
        .where({ clinic_id: clinicId })
        .count('id as count')
        .first();
      totalLabs = parseInt(total?.count || 0);
    } catch (e) {
      console.log('Lab orders table not found, using defaults');
    }

    // Handle referrals safely (table may not exist)
    let pendingReferrals = 0;
    let totalReferrals = 0;
    try {
      const pending = await db('referrals')
        .where({ clinic_id: clinicId, status: 'pending' })
        .count('id as count')
        .first();
      pendingReferrals = parseInt(pending?.count || 0);
      const total = await db('referrals')
        .where({ clinic_id: clinicId })
        .count('id as count')
        .first();
      totalReferrals = parseInt(total?.count || 0);
    } catch (e) {
      console.log('Referrals table not found, using defaults');
    }

    res.json({
      success: true,
      patients: {
        total: parseInt(totalPatients?.count || 0),
        active: parseInt(activePatients?.count || 0)
      },
      consultations: {
        today: parseInt(todayVisits?.count || 0),  // ✅ FIXED: Now counts today's visits
        total: parseInt(totalVisits?.count || 0)
      },
      labs: {
        pending: pendingLabs,
        total: totalLabs,
        processing: 0,
        completed: 0
      },
      referrals: {
        pending: pendingReferrals,
        total: totalReferrals
      }
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    next(err);
  }
});

// GET /api/dashboard/weekly-activity - Weekly consultation trends
router.get('/weekly-activity', async (req, res, next) => {
  try {
    const db = req.db;
    const clinicId = req.clinicId;
    const rows = await db.raw(`
      SELECT DATE(consultation_date) as date, COUNT(*) as count
      FROM consultations
      WHERE clinic_id = ? AND consultation_date >= CURRENT_DATE - INTERVAL '6 days'
      GROUP BY DATE(consultation_date)
      ORDER BY date ASC
    `, [clinicId]);
    res.json(rows.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/top-diagnoses - Top 5 diagnoses
router.get('/top-diagnoses', async (req, res, next) => {
  try {
    const db = req.db;
    const clinicId = req.clinicId;
    const diagnoses = await db('consultations')
      .where({ clinic_id: clinicId })
      .whereNotNull('diagnosis')
      .where('diagnosis', '!=', '')
      .select('diagnosis')
      .count('id as count')
      .groupBy('diagnosis')
      .orderBy('count', 'desc')
      .limit(5);
    res.json(diagnoses);
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/alerts - Disease alerts
router.get('/alerts', async (req, res, next) => {
  try {
    const db = req.db;
    const clinicId = req.clinicId;
    const malaria = await db('consultations')
      .where({ clinic_id: clinicId })
      .where('diagnosis', 'ilike', '%malaria%')
      .where('consultation_date', '>=', db.raw("CURRENT_DATE - INTERVAL '7 days'"))
      .count('id as count')
      .first();
    res.json({
      suspectedMalaria: parseInt(malaria?.count || 0)
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;