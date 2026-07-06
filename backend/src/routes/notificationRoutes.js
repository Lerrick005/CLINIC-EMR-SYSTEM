const express = require('express');
const router = express.Router();
const { tenantContext } = require('../middleware/tenantContext');
const NotificationService = require('../services/notificationService');

router.use(tenantContext);

// GET /api/notifications - Get user notifications
router.get('/', async (req, res, next) => {
  try {
    const db = req.db;
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;

    const notificationService = new NotificationService(db);
    const notifications = await notificationService.getNotifications(userId, limit);

    res.json({ success: true, notifications });
  } catch (err) {
    next(err);
  }
});

// GET /api/notifications/unread-count - Get unread count
router.get('/unread-count', async (req, res, next) => {
  try {
    const db = req.db;
    const userId = req.user.id;

    const notificationService = new NotificationService(db);
    const count = await notificationService.getUnreadCount(userId);

    res.json({ success: true, count });
  } catch (err) {
    next(err);
  }
});

// PUT /api/notifications/:id/read - Mark as read
router.put('/:id/read', async (req, res, next) => {
  try {
    const db = req.db;
    const userId = req.user.id;
    const { id } = req.params;

    const notificationService = new NotificationService(db);
    await notificationService.markAsRead(id, userId);

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// PUT /api/notifications/read-all - Mark all as read
router.put('/read-all', async (req, res, next) => {
  try {
    const db = req.db;
    const userId = req.user.id;

    const notificationService = new NotificationService(db);
    await notificationService.markAllAsRead(userId);

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;