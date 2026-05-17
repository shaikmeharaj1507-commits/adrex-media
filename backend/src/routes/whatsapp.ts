import express from 'express';
import { getWhatsAppHistory, sendWhatsAppMessage, handleTwilioWebhook } from '../controllers/whatsappController';
import { requireAuth } from '../middlewares/auth';

const router = express.Router();

// Webhook endpoint does NOT require authentication because it is called by Twilio
router.post('/webhook', handleTwilioWebhook);

// Protected API routes for frontend
router.use(requireAuth);

router.get('/history', getWhatsAppHistory);
router.post('/send', sendWhatsAppMessage);

export default router;
