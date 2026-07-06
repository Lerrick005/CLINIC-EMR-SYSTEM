const express = require('express');
const router = express.Router();
const { tenantContext } = require('../middleware/tenantContext');
const { requireRole, ROLES } = require('../middleware/rbac');
const AuditService = require('../services/auditService');

router.use(tenantContext);

// GET /api/audit/logs - Get audit logs
router.get('/logs', requireRole([ROLES.SUPER_ADMIN, ROLES.CLINIC_ADMIN]), async (req, res, next) => {
  try {
    const db = req.db;
    const clinicId = req.clinicId;
    const {
      userId,
      action,
      resourceType,
      dateFrom,
      dateTo,
      limit = 50,
      offset = 0
    } = req.query;

    const auditService = new AuditService(db);
    const result = await auditService.getLogs(clinicId, {
      userId,
      action,
      resourceType,
      dateFrom,
      dateTo,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: result.data,
      total: result.total,
      limit: result.limit,
      offset: result.offset
    });
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    next(err);
  }
});

// GET /api/audit/users/:userId/activity - Get user activity summary
router.get('/users/:userId/activity', requireRole([ROLES.SUPER_ADMIN, ROLES.CLINIC_ADMIN]), async (req, res, next) => {
  try {
    const db = req.db;
    const clinicId = req.clinicId;
    const { userId } = req.params;
    const { days = 30 } = req.query;

    const auditService = new AuditService(db);
    const result = await auditService.getUserActivitySummary(clinicId, userId, parseInt(days));

    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    console.error('Error fetching user activity:', err);
    next(err);
  }
});

// GET /api/audit/resources/:resourceType/:resourceId - Get resource history
router.get('/resources/:resourceType/:resourceId', requireRole([ROLES.SUPER_ADMIN, ROLES.CLINIC_ADMIN]), async (req, res, next) => {
  try {
    const db = req.db;
    const clinicId = req.clinicId;
    const { resourceType, resourceId } = req.params;

    const auditService = new AuditService(db);
    const history = await auditService.getResourceHistory(clinicId, resourceType, resourceId);

    res.json({
      success: true,
      data: history
    });
  } catch (err) {
    console.error('Error fetching resource history:', err);
    next(err);
  }
});

// GET /api/audit/stats - Get audit statistics
router.get('/stats', requireRole([ROLES.SUPER_ADMIN, ROLES.CLINIC_ADMIN]), async (req, res, next) => {
  try {
    const db = req.db;
    const clinicId = req.clinicId;
    const { days = 7 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const stats = await db('audit_logs')
      .where({ clinic_id: clinicId })
      .where('created_at', '>=', startDate)
      .select('action')
      .count('id as count')
      .groupBy('action');

    const total = await db('audit_logs')
      .where({ clinic_id: clinicId })
      .where('created_at', '>=', startDate)
      .count('id as total')
      .first();

    const users = await db('audit_logs')
      .where({ clinic_id: clinicId })
      .where('created_at', '>=', startDate)
      .countDistinct('user_id as count')
      .first();

    res.json({
      success: true,
      data: {
        actions: stats,
        total: parseInt(total?.total || 0),
        activeUsers: parseInt(users?.count || 0),
        periodDays: parseInt(days)
      }
    });
  } catch (err) {
    console.error('Error fetching audit stats:', err);
    next(err);
  }
});

module.exports = router;
