import express from 'express';
import { getInfluencers, createInfluencer, updateInfluencer, deleteInfluencer, onboardInfluencer, createPortalUser } from '../controllers/influencerController';
import { requireAuth, requireRole } from '../middlewares/auth';

const router = express.Router();

// Public route for onboarding
router.post('/onboarding/:agencyId', onboardInfluencer);

// Protected routes
router.use(requireAuth);
router.use(requireRole(['SUPER_ADMIN', 'MANAGER', 'INFLUENCER_MANAGER']));

router.get('/', getInfluencers);
router.post('/', createInfluencer);
router.put('/:id', updateInfluencer);
router.delete('/:id', deleteInfluencer);
router.post('/:id/portal-user', createPortalUser);

export default router;

