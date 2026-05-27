import express from 'express';
import { getInfluencers, createInfluencer, updateInfluencer, deleteInfluencer, onboardInfluencer } from '../controllers/influencerController';
import { requireAuth } from '../middlewares/auth';

const router = express.Router();

// Public route for onboarding
router.post('/onboarding/:agencyId', onboardInfluencer);

// Protected routes
router.use(requireAuth);

router.get('/', getInfluencers);
router.post('/', createInfluencer);
router.put('/:id', updateInfluencer);
router.delete('/:id', deleteInfluencer);

export default router;
