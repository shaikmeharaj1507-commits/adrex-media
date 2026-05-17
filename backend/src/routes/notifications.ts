import express from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  updateNotificationPrefs,
  getNotificationPrefs,
} from '../controllers/notificationController';
import { requireAuth } from '../middlewares/auth';

const router = express.Router();
router.use(requireAuth);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);
router.delete('/:id', deleteNotification);
router.get('/prefs', getNotificationPrefs);
router.put('/prefs', updateNotificationPrefs);

export default router;
