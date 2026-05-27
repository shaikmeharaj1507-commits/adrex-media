import express from 'express';
import { getClientPortalData } from '../controllers/clientPortalController';
import { requireAuth } from '../middlewares/auth';

const router = express.Router();

router.use(requireAuth);

router.get('/:clientId', getClientPortalData);

export default router;
