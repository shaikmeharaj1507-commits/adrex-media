import express from 'express';
import { getConversations, getMessages, sendMessage, markAsRead } from '../controllers/messageController';
import { requireAuth } from '../middlewares/auth';

const router = express.Router();

router.use(requireAuth);

router.get('/conversations', getConversations);
router.get('/:userId', getMessages);
router.post('/', sendMessage);
router.put('/:id/read', markAsRead);

export default router;
