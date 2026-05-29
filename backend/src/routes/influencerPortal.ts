import express, { Request, Response, NextFunction } from 'express';
import { 
  getInfluencerPortalData, 
  uploadInfluencerDeliverable, 
  getInfluencerMessages, 
  sendInfluencerMessage,
  getInfluencerPortalDataMe,
  updateInfluencerPortalProfile
} from '../controllers/influencerPortalController';
import { requireAuth } from '../middlewares/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

// Support requireAuth for security
router.use(requireAuth);

// Helper middleware to verify influencer scope
const verifyInfluencerScope = async (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  if (user.role === 'INFLUENCER') {
    const { influencerId } = req.params;
    if (influencerId) {
      const influencer = await prisma.influencer.findUnique({
        where: { userId: user.userId }
      });
      if (!influencer || influencer.id !== influencerId) {
        return res.status(403).json({ error: 'Access denied: You can only access your own profile.' });
      }
    }
  }
  next();
};

// Influencer routes for self
router.get('/me', getInfluencerPortalDataMe);
router.put('/me/profile', updateInfluencerPortalProfile);

// Parametrized routes with verification check
router.get('/:influencerId', verifyInfluencerScope as any, getInfluencerPortalData);
router.post('/:influencerId/files', verifyInfluencerScope as any, uploadInfluencerDeliverable);
router.get('/:influencerId/messages', verifyInfluencerScope as any, getInfluencerMessages);
router.post('/:influencerId/messages', verifyInfluencerScope as any, sendInfluencerMessage);

export default router;

