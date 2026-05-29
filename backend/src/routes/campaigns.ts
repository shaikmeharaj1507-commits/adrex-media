import express from 'express';
import { getCampaigns, getCampaignById, createCampaign, updateCampaign, deleteCampaign } from '../controllers/campaignController';
import { requireAuth, requireRole } from '../middlewares/auth';

const router = express.Router();
router.use(requireAuth);

router.use(requireRole(['SUPER_ADMIN', 'MANAGER', 'INFLUENCER_MANAGER', 'PERFORMANCE_MARKETER', 'SOCIAL_MEDIA_MANAGER', 'VIDEO_EDITOR']));

router.get('/', getCampaigns);
router.get('/:id', getCampaignById);
router.post('/', createCampaign);
router.put('/:id', updateCampaign);
router.delete('/:id', deleteCampaign);

export default router;
