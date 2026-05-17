import express from 'express';
import {
  generateCampaignIdea,
  generateCaption,
  generateOutreachMessage,
  generateStrategy,
  chatWithAI,
} from '../controllers/aiController';
import { requireAuth } from '../middlewares/auth';

const router = express.Router();
router.use(requireAuth);

router.post('/campaign-idea', generateCampaignIdea);
router.post('/caption', generateCaption);
router.post('/outreach', generateOutreachMessage);
router.post('/strategy', generateStrategy);
router.post('/chat', chatWithAI);

export default router;
