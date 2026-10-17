const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const NotificationModel = require('../models/NotificationModel');
const {
  createEmergencyTriggerNotifications,
} = require('../services/notificationService');

function normalizeMeta(metaJson) {
  if (!metaJson) return null;
  if (typeof metaJson === 'object') return metaJson;
  if (typeof metaJson === 'string') {
    try {
      return JSON.parse(metaJson);
    } catch (error) {
      return null;
    }
  }
  return null;
}

const listNotifications = asyncHandler(async (req, res) => {
  const rows = await NotificationModel.listByUser({
    userId: req.user.userId,
    priority: req.query.priority || null,
    type: req.query.type || null,
    unreadOnly: String(req.query.unreadOnly || '0') === '1',
    page: req.query.page || 1,
    limit: req.query.limit || 20,
  });
  return res.status(200).json({
    success: true,
    data: rows.map((row) => ({
      ...row,
      meta_json: normalizeMeta(row.meta_json),
    })),
  });
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await NotificationModel.getUnreadCount(req.user.userId);
  return res.status(200).json({
    success: true,
    data: { unreadCount: count },
  });
});

const markNotificationRead = asyncHandler(async (req, res) => {
  const updated = await NotificationModel.markRead(req.params.id, req.user.userId);
  if (!updated) throw new ApiError(404, 'Notification not found');
  return res.status(200).json({
    success: true,
    message: 'Notification marked as read',
  });
});

const markAllNotificationsRead = asyncHandler(async (req, res) => {
  const affectedRows = await NotificationModel.markAllRead(req.user.userId);
  return res.status(200).json({
    success: true,
    message: 'All notifications marked as read',
    data: { affectedRows },
  });
});

const hideNotification = asyncHandler(async (req, res) => {
  const row = await NotificationModel.getById(req.params.id, req.user.userId);
  if (!row) throw new ApiError(404, 'Notification not found');
  if (row.priority === 'critical') {
    throw new ApiError(400, 'Critical notifications cannot be hidden silently');
  }
  await NotificationModel.hideById(req.params.id, req.user.userId);
  return res.status(200).json({
    success: true,
    message: 'Notification hidden',
  });
});

const triggerEmergencyNotifications = asyncHandler(async (req, res) => {
  const location =
    req.body && typeof req.body === 'object'
      ? {
          lat: req.body?.lat ?? null,
          lng: req.body?.lng ?? null,
          accuracy: req.body?.accuracy ?? null,
        }
      : null;

  await createEmergencyTriggerNotifications({
    userId: req.user.userId,
    location,
  });

  return res.status(200).json({
    success: true,
    message: 'Emergency notifications created',
  });
});

module.exports = {
  listNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  hideNotification,
  triggerEmergencyNotifications,
};

