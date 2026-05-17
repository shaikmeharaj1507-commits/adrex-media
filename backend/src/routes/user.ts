import express from 'express';
import { updateProfile } from '../controllers/userController';
import { requireAuth } from '../middlewares/auth';

const router = express.Router();

router.use(requireAuth);

router.put('/profile', updateProfile);

export default router;
