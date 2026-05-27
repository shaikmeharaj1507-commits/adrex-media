import express from 'express';
import { getInfluencerPortalData, uploadInfluencerDeliverable, getInfluencerMessages, sendInfluencerMessage } from '../controllers/influencerPortalController';
import { requireAuth } from '../middlewares/auth';

const router = express.Router();

// Support requireAuth for security
router.use(requireAuth);

router.get('/:influencerId', getInfluencerPortalData);
router.post('/:influencerId/files', uploadInfluencerDeliverable);
router.get('/:influencerId/messages', getInfluencerMessages);
router.post('/:influencerId/messages', sendInfluencerMessage);

export default router;
