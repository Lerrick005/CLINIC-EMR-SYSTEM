const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { tenantContext } = require('../middleware/tenantContext');
const { requireRole, ROLES } = require('../middleware/rbac');

// All lab routes require clinic context
router.use(tenantContext);

// ============================
// GET /api/lab-orders - List all orders
// ============================
router.get('/', requireRole([ROLES.SUPER_ADMIN, ROLES.CLINIC_ADMIN, ROLES.DOCTOR, ROLES.LAB_STAFF]), async (req, res, next) => {
  try {
    const db = req.db;
    const clinicId = req.clinicId;
    const { status, priority, patientId } = req.query;

    let query = db('lab_orders')
      .where({ "lab_orders.clinic_id": clinicId })
      .leftJoin('patients', 'lab_orders.patient_id', 'patients.id')
      .leftJoin('users as ordered', 'lab_orders.ordered_by', 'ordered.id')
      .select(
        'lab_orders.*',
        'patients.first_name as patient_first_name',
        'patients.last_name as patient_last_name',
        'ordered.first_name as ordered_first_name',
        'ordered.last_name as ordered_last_name'
      );

    if (status) query = query.where({ status });
    if (priority) query = query.where({ priority });
    if (patientId) query = query.where({ patient_id: patientId });

    const orders = await query.orderBy('order_date', 'desc');

    res.json({ success: true, orders });
  } catch (err) {
    console.error('Error fetching lab orders:', err);
    next(err);
  }
});

// ============================
// GET /api/lab-orders/pending - Get pending orders
// ============================
router.get('/pending', requireRole([ROLES.SUPER_ADMIN, ROLES.CLINIC_ADMIN, ROLES.DOCTOR, ROLES.LAB_STAFF]), async (req, res, next) => {
  try {
    const db = req.db;
    const clinicId = req.clinicId;

    const orders = await db('lab_orders')
      .where({ "lab_orders.clinic_id": clinicId })
      .whereIn('status', ['pending', 'sample_collected', 'processing'])
      .leftJoin('patients', 'lab_orders.patient_id', 'patients.id')
      .select('lab_orders.*', 'patients.first_name', 'patients.last_name')
      .orderBy('order_date', 'asc');

    res.json({ success: true, orders });
  } catch (err) {
    next(err);
  }
});

// ============================
// GET /api/lab-orders/:id - Get single order
// ============================
router.get('/:id', requireRole([ROLES.SUPER_ADMIN, ROLES.CLINIC_ADMIN, ROLES.DOCTOR, ROLES.LAB_STAFF]), async (req, res, next) => {
  try {
    const db = req.db;
    const clinicId = req.clinicId;
    const { id } = req.params;

    const order = await db('lab_orders')
      .where({ clinic_id: clinicId, 'lab_orders.id': id })
      .leftJoin('patients', 'lab_orders.patient_id', 'patients.id')
      .leftJoin('users as ordered', 'lab_orders.ordered_by', 'ordered.id')
      .leftJoin('users as resulted', 'lab_orders.resulted_by', 'resulted.id')
      .leftJoin('users as reviewed', 'lab_orders.reviewed_by', 'reviewed.id')
      .select(
        'lab_orders.*',
        'patients.first_name as patient_first_name',
        'patients.last_name as patient_last_name',
        'ordered.first_name as ordered_first_name',
        'ordered.last_name as ordered_last_name',
        'resulted.first_name as resulted_first_name',
        'resulted.last_name as resulted_last_name',
        'reviewed.first_name as reviewed_first_name',
        'reviewed.last_name as reviewed_last_name'
      )
      .first();

    if (!order) {
      return res.status(404).json({ error: 'Lab order not found' });
    }

    // Get results
    const results = await db('lab_results')
      .where({ order_id: id })
      .orderBy('created_at', 'asc');

    res.json({ success: true, order, results });
  } catch (err) {
    next(err);
  }
});

// ============================
// POST /api/lab-orders - Create new order
// ============================
router.post('/', requireRole([ROLES.SUPER_ADMIN, ROLES.CLINIC_ADMIN, ROLES.DOCTOR]), async (req, res, next) => {
  try {
    const db = req.db;
    const clinicId = req.clinicId;
    const userId = req.user.id;

    const {
      patient_id,
      consultation_id,
      test_name,
      test_code,
      test_category,
      priority,
      fasting_required,
      clinical_notes,
      amount_due
    } = req.body;

    if (!patient_id || !test_name) {
      return res.status(400).json({ error: 'Patient ID and test name are required' });
    }

    const id = uuidv4();
    await db('lab_orders').insert({
      id,
      clinic_id: clinicId,
      patient_id,
      consultation_id: consultation_id || null,
      test_name,
      test_code: test_code || null,
      test_category: test_category || null,
      priority: priority || 'routine',
      status: 'pending',
      ordered_by: userId,
      order_date: db.fn.now(),
      fasting_required: fasting_required || false,
      clinical_notes: clinical_notes || '',
      amount_due: amount_due || 0,
      billed: false
    });

    res.status(201).json({
      success: true,
      message: 'Lab order created successfully',
      orderId: id
    });

  } catch (err) {
    console.error('Error creating lab order:', err);
    next(err);
  }
});

// ============================
// POST /api/lab-orders/:id/results - Enter results
// ============================
router.post('/:id/results', requireRole([ROLES.SUPER_ADMIN, ROLES.CLINIC_ADMIN, ROLES.LAB_STAFF]), async (req, res, next) => {
  try {
    const db = req.db;
    const clinicId = req.clinicId;
    const userId = req.user.id;
    const { id } = req.params;
    const { results, result_notes, status } = req.body;

    // Check if order exists
    const order = await db('lab_orders')
      .where({ clinic_id: clinicId, id })
      .first();

    if (!order) {
      return res.status(404).json({ error: 'Lab order not found' });
    }

    // Delete existing results
    await db('lab_results').where({ order_id: id }).del();

    // Insert new results
    let isAbnormal = false;
    const abnormalFlags = [];

    if (results && results.length > 0) {
      for (const result of results) {
        const flag = detectAbnormal(result.value, result.reference_min, result.reference_max);
        if (flag) {
          isAbnormal = true;
          abnormalFlags.push(flag);
        }

        await db('lab_results').insert({
          id: uuidv4(),
          order_id: id,
          test_name: result.test_name || order.test_name,
          parameter: result.parameter || '',
          value: result.value || '',
          unit: result.unit || '',
          reference_min: result.reference_min || '',
          reference_max: result.reference_max || '',
          is_abnormal: !!flag,
          flag: flag || '',
          notes: result.notes || ''
        });
      }
    }

    // Update order
    await db('lab_orders')
      .where({ id })
      .update({
        status: status || 'completed',
        resulted_by: userId,
        resulted_date: db.fn.now(),
        is_abnormal: isAbnormal,
        abnormal_flags: abnormalFlags,
        result_notes: result_notes || ''
      });

    res.json({
      success: true,
      message: 'Results saved successfully',
      isAbnormal,
      abnormalFlags
    });

  } catch (err) {
    console.error('Error saving lab results:', err);
    next(err);
  }
});

// ============================
// PUT /api/lab-orders/:id/review - Doctor reviews results
// ============================
router.put('/:id/review', requireRole([ROLES.SUPER_ADMIN, ROLES.CLINIC_ADMIN, ROLES.DOCTOR]), async (req, res, next) => {
  try {
    const db = req.db;
    const clinicId = req.clinicId;
    const userId = req.user.id;
    const { id } = req.params;

    const order = await db('lab_orders')
      .where({ clinic_id: clinicId, id })
      .first();

    if (!order) {
      return res.status(404).json({ error: 'Lab order not found' });
    }

    await db('lab_orders')
      .where({ id })
      .update({
        reviewed_by: userId,
        reviewed_date: db.fn.now()
      });

    res.json({
      success: true,
      message: 'Lab results reviewed successfully'
    });

  } catch (err) {
    next(err);
  }
});

// ============================
// DETECT ABNORMAL VALUES (Helper)
// ============================
function detectAbnormal(value, refMin, refMax) {
  if (!value) return null;
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return null;

  const min = refMin ? parseFloat(refMin) : null;
  const max = refMax ? parseFloat(refMax) : null;

  if (min !== null && numValue < min) {
    return numValue < min * 0.7 ? 'CRITICAL_LOW' : 'LOW';
  }
  if (max !== null && numValue > max) {
    return numValue > max * 1.3 ? 'CRITICAL_HIGH' : 'HIGH';
  }
  return null;
}

// GET /api/lab-orders/patient/:patientId - Get lab orders for a patient
router.get('/patient/:patientId', requireRole([ROLES.SUPER_ADMIN, ROLES.CLINIC_ADMIN, ROLES.DOCTOR, ROLES.LAB_STAFF]), async (req, res, next) => {
  try {
    const db = req.db;
    const clinicId = req.clinicId;
    const { patientId } = req.params;

    const orders = await db('lab_orders')
      .where({ "lab_orders.clinic_id": clinicId, patient_id: patientId })
      .orderBy('order_date', 'desc');

    res.json({ success: true, labOrders: orders });
  } catch (err) {
    next(err);
  }
});

module.exports = router;


