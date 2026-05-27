import express from 'express';
import { getCampaigns, getCampaignById, createCampaign, updateCampaign, deleteCampaign } from '../controllers/campaignController';
import { requireAuth } from '../middlewares/auth';

const router = express.Router();
router.use(requireAuth);

router.get('/', getCampaigns);
router.get('/:id', getCampaignById);
router.post('/', createCampaign);
router.put('/:id', updateCampaign);
router.delete('/:id', deleteCampaign);

export default router;
