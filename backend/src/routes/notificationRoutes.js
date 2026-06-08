const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const {
  listNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  hideNotification,
  triggerEmergencyNotifications,
} = require('../controllers/notificationController');

const router = express.Router();

router.use(authenticate);

router.get('/', listNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/read-all', markAllNotificationsRead);
router.patch('/:id/read', markNotificationRead);
router.patch('/:id/hide', hideNotification);
router.post('/emergency-trigger', triggerEmergencyNotifications);

module.exports = router;

