import express from 'express';
import { generateCampaignIdea, draftOutreachEmail, generateTaskBreakdown, generateCaption, generateStrategy, generateOutreachMessage, chatWithAI } from '../controllers/aiController';
import { requireAuth } from '../middlewares/auth';

const router = express.Router();
router.use(requireAuth);

router.post('/campaign-idea', generateCampaignIdea);
router.post('/outreach-email', draftOutreachEmail);
router.post('/task-breakdown', generateTaskBreakdown);

router.post('/caption', generateCaption);
router.post('/strategy', generateStrategy);
router.post('/outreach', generateOutreachMessage);
router.post('/chat', chatWithAI);

export default router;
